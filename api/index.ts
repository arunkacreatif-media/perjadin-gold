import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Standard Express setup
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// --- GOOGLE CONFIGURATION ---
const googleEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
let googleKeyRaw = process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_PRIVATE_KEY;

let googleKey = '';
if (googleKeyRaw) {
  googleKey = googleKeyRaw.trim()
    .replace(/^['"]+|['"]+$/g, '') 
    .replace(/\\n/g, '\n')         
    .replace(/\s+/g, (match) => match.includes('\n') ? '\n' : match);

  if (!googleKey.includes('-----BEGIN PRIVATE KEY-----')) {
    googleKey = `-----BEGIN PRIVATE KEY-----\n${googleKey}\n-----END PRIVATE KEY-----`;
  }
}

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || process.env.VITE_GOOGLE_SPREADSHEET_ID;
const scriptUrl = 'https://script.google.com/macros/s/AKfycbwgxPFqnUT0Ji688rYr_-GtwUOPpk-w8NwvJlfjy0CC-FXuW639U64fC0HcvEmT6on_Kg/exec';

const auth = new JWT({
  email: googleEmail || 'missing@service.account',
  key: googleKey,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
  ],
});

// --- HELPERS ---
const callBridge = async (req: express.Request, funcName: string, args: any[] = []) => {
  const targetId = (req.headers['x-spreadsheet-id'] as string) || spreadsheetId;
  
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ funcName, args, spreadsheetId: targetId }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apps Script Error (${response.status}): ${text.substring(0, 500)}`);
  }

  const text = await response.text();
  try {
    const result = JSON.parse(text);
    if (result && result.error) throw new Error(result.error);
    return result;
  } catch (e: any) {
    throw new Error(`JSON Error: ${e.message}. Respon: ${text.substring(0, 100)}`);
  }
};

// --- API ROUTES ---

// Create a router to handle both /api/ and root hits from Vercel
const api = express.Router();

api.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    isVercel: !!process.env.VERCEL,
    google: {
      email: !!googleEmail,
      key: !!googleKey,
      sheet: !!spreadsheetId
    }
  });
});

api.post('/tenant/verify', async (req, res) => {
  try {
    const { villageId } = req.body;
    if (!villageId) return res.status(400).json({ error: 'ID Desa diperlukan' });

    console.log(`[VERIFY] Village: ${villageId}`);
    
    let villageData;
    // 1. Try Bridge
    try {
      villageData = await callBridge(req, 'verifyTenant', [villageId]);
    } catch (e) {
      console.warn('Bridge failed, trying fallback...');
    }

    // 2. Fallback to Service Account
    if (!villageData && googleKey && spreadsheetId) {
      const doc = new GoogleSpreadsheet(spreadsheetId, auth);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle['MASTER_DESA'];
      if (!sheet) throw new Error('Sheet MASTER_DESA tidak ditemukan.');
      
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('ID_DESA')?.toString().toUpperCase() === villageId.toUpperCase());
      if (row) {
        villageData = {
          id: row.get('ID_DESA'),
          name: row.get('NAMA_DESA'),
          sheetId: row.get('SPREADSHEET_ID'),
          status: row.get('STATUS')
        };
      }
    }

    if (!villageData) return res.status(404).json({ error: 'ID Desa tidak terdaftar.' });
    if (villageData.status !== 'ACTIVE') return res.status(403).json({ error: 'Akses dinonaktifkan.' });

    res.json({ success: true, village: villageData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

api.get('/sheets/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    let data;
    if (sheetName === 'Pegawai') data = await callBridge(req, 'getPegawai');
    else if (sheetName === 'DataSPD') data = await callBridge(req, 'getSPDList');
    else if (sheetName === 'DataLAPORAN') data = await callBridge(req, 'getLaporanList');
    else if (sheetName === 'DataSPJ') data = await callBridge(req, 'getSPJList');
    else if (sheetName === 'Config') data = await callBridge(req, 'getConfig');

    if (data) return res.json(data);
    
    // Generic fallback
    const doc = new GoogleSpreadsheet((req.headers['x-spreadsheet-id'] as string) || spreadsheetId!, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return res.status(404).send('Not found');
    const rows = await sheet.getRows();
    res.json(rows.map(r => r.toObject()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

api.post('/sheets/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    let result;
    if (sheetName === 'Pegawai') result = await callBridge(req, 'tambahPegawai', [req.body]);
    else if (sheetName === 'DataSPD') result = await callBridge(req, 'saveSPD', [req.body]);
    else if (sheetName === 'DataLAPORAN') result = await callBridge(req, 'saveLaporan', [req.body]);
    else if (sheetName === 'DataSPJ') result = await callBridge(req, 'saveSPJ', [req.body]);
    else if (sheetName === 'Config') result = await callBridge(req, 'updateConfig', [req.body]);

    if (result) return res.json(result);

    const doc = new GoogleSpreadsheet((req.headers['x-spreadsheet-id'] as string) || spreadsheetId!, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    await sheet.addRow(req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

api.post('/docs/generate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const result = await callBridge(req, 'generateDocument', [type.toUpperCase(), req.body, req.body.imageData || req.body.base64Image]);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

api.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await callBridge(req, 'getDashboardStats');
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Apply the router to both /api and root as fallback
app.use('/api', api);
app.use('/', api);

// Serve local frontend ONLY when NOT on Vercel
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Support local execution
if (!process.env.VERCEL && import.meta.url === `file://${process.argv[1]}`) {
  app.listen(3000, '0.0.0.0', () => {
    console.log(`Local dev server: http://0.0.0.0:3000`);
  });
}

// Vercel export
export default app;
