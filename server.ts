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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Google Auth Setup
  const googleEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let googleKey = process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_PRIVATE_KEY;
  
  if (googleKey) {
    // 1. Bersihkan spasi, tanda kutip, dan karakter aneh yang sering muncul saat copy-paste di Vercel
    googleKey = googleKey.trim()
      .replace(/^['"]+|['"]+$/g, '') // Hapus kutip di awal/akhir
      .replace(/\\n/g, '\n')         // Ubah \n teks menjadi newline asli
      .replace(/\s+/g, (match) => match.includes('\n') ? '\n' : match); // Bersihkan spasi horizontal berlebih

    // 2. Pastikan header PEM ada dan tidak terduplikasi
    if (!googleKey.includes('-----BEGIN PRIVATE KEY-----')) {
      googleKey = `-----BEGIN PRIVATE KEY-----\n${googleKey}\n-----END PRIVATE KEY-----`;
    }
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || process.env.VITE_GOOGLE_SPREADSHEET_ID;
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwgxPFqnUT0Ji688rYr_-GtwuOPpk-w8NwvJlfjy0CC-FXuW639U64fC0HcvEmT6on_Kg/exec';

  // Debug info for user (safe version)
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.log('Production Environment Detected');
    console.log('Google Email configured:', !!googleEmail);
    console.log('Google Key configured:', !!googleKey);
    console.log('Spreadsheet ID configured:', !!spreadsheetId);
  }

  if (!googleEmail || !googleKey) {
    console.warn('WARNING: Google Credentials missing. Drive/Docs and Apps Script features will fail.');
  }

  const auth = new JWT({
    email: googleEmail || 'missing@service.account',
    key: googleKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  });

  // Automated connection test on startup
  async function testGoogleConnection() {
    console.log('--- STARTING GOOGLE CONNECTION TEST ---');
    
    // 1. Check Service Account Auth & Spreadsheet
    if (googleEmail && googleKey && spreadsheetId) {
      try {
        console.log('[TEST] Checking Service Account & Spreadsheet...');
        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();
        console.log(`[TEST] SUCCESS: Connected to Spreadsheet "${doc.title}"`);
      } catch (err: any) {
        console.error('[TEST] FAILED: Service Account/Spreadsheet connection error:');
        if (err.message.includes('403')) {
          console.error('  -> ERROR 403: Email Service Account belum di-invite ke Spreadsheet.');
        } else if (err.message.includes('private key')) {
          console.error('  -> ERROR KEY: GOOGLE_PRIVATE_KEY rusak atau salah format.');
        } else {
          console.error(`  -> ${err.message}`);
        }
      }
    } else {
      console.warn('[TEST] SKIP: Service Account credentials or Spreadsheet ID not fully configured.');
    }

    // 2. Check Apps Script Bridge
    if (scriptUrl && scriptUrl.startsWith('https://')) {
      try {
        console.log('[TEST] Checking Apps Script Bridge...');
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ funcName: 'ping', args: [] }),
        });
        
        if (response.ok) {
          const text = await response.text();
          if (text.includes('google.com') && text.includes('login')) {
            console.error('[TEST] FAILED: Apps Script meminta LOGIN. Pastikan sudah dideploy ke "Anyone".');
          } else {
            console.log('[TEST] SUCCESS: Apps Script Bridge reachable.');
          }
        } else {
          console.error(`[TEST] FAILED: Apps Script returned status ${response.status}`);
        }
      } catch (err: any) {
        console.error(`[TEST] FAILED: Apps Script Bridge unreachable: ${err.message}`);
      }
    } else {
      console.warn('[TEST] SKIP: Apps Script URL not configured or invalid.');
    }
    
    console.log('--- GOOGLE CONNECTION TEST COMPLETED ---');
  }

  // Run test in production or if requested
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    testGoogleConnection().catch(console.error);
  }

  // Helper to get Google Drive client safely
  const getDriveClient = () => {
    if (!googleKey || !googleEmail) {
      // Return a dummy client that resolves with a warning instead of throwing
      return {
        files: {
          create: async () => { 
            return { 
              data: { 
                id: 'dummy', 
                webViewLink: '', 
                warning: 'FITUR UPLOAD NON-AKTIF: Anda tidak mengatur GOOGLE_PRIVATE_KEY & EMAIL di Secrets. Foto akan tetap diproses menggunakan link lokal (Base64).' 
              } 
            }; 
          }
        }
      } as any;
    }
    return google.drive({ version: 'v3', auth });
  };

  // Helper to call Apps Script Bridge
  const callBridge = async (req: express.Request, funcName: string, args: any[] = []) => {
    if (!scriptUrl) throw new Error('GOOGLE_SCRIPT_URL is not set. Harap atur di menu Secrets.');
    
    // Safety check: Pastikan scriptUrl adalah URL, bukan kode mentah
    if (!scriptUrl.startsWith('https://')) {
      throw new Error('KONFIGURASI SALAH: GOOGLE_SCRIPT_URL di menu Secrets harus berisi LINK (dimulai dengan https://), bukan kode skrip. Silakan cek ulang menu Secrets.');
    }

    const targetId = req.headers['x-spreadsheet-id'];

    console.log(`[BRIDGE] Calling ${funcName} for Sheet: ${targetId || 'DEFAULT'}...`);
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funcName, args, spreadsheetId: targetId }),
    });
    
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Apps Script Bridge returned error status ${response.status}: ${text.substring(0, 500)}`);
    }

    let text = '';
    try {
      text = await response.text();
    } catch (e) {
      throw new Error(`Gagal membaca body respon dari Google: ${response.statusText}`);
    }

    if (contentType && !contentType.includes('application/json')) {
        if (text.includes('doGet') || text.includes('doPost')) {
            throw new Error(`KONFIGURASI SKRIP SALAH: Skrip Google Anda tidak memiliki fungsi doPost atau doGet. Pastikan skrip sudah di-deploy sebagai Web App dan memiliki fungsi doPost(e).`);
        }
        if (text.includes('The page you requested could not be found') || response.status === 404) {
            throw new Error(`LINK SALAH: Google Apps Script tidak menemukan link ini. Cek GOOGLE_SCRIPT_URL di Vercel Dashboard.`);
        }
        // If it's HTML, it might be a Google Login redirect or error page
        if (text.includes('google.com') && text.includes('login')) {
            throw new Error(`AKSES DITOLAK: Google Apps Script meminta login. Pastikan script sudah di-deploy dengan setting "Who has access: Anyone".`);
        }
    }
    
    try {
      if (!text || text.trim() === '' || text === 'null') {
        return null;
      }
      const result = JSON.parse(text);
      if (result && typeof result === 'object' && result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (e: any) {
      if (e.message.startsWith('Apps Script')) throw e;
      throw new Error(`JSON Error dari Apps Script. Pesan: ${e.message}. Respon Mentah: ${text.substring(0, 100)}`);
    }
  };

  // Helper to validate credentials (supports either Service Account or Bridge)
  const checkAuth = (res: any) => {
    const hasServiceAccount = googleEmail && googleKey && spreadsheetId;
    const hasBridge = !!scriptUrl;
    
    if (!hasServiceAccount && !hasBridge) {
      res.status(500).json({ 
        error: 'KONFIGURASI DIBERHENTIKAN: Gunakan salah satu metode integrasi:\n1. Metode Service Account (GOOGLE_SERVICE_ACCOUNT_EMAIL & KEY)\n2. Metode Bridge (GOOGLE_SCRIPT_URL)\n\nAtur di menu Secrets AI Studio.' 
      });
      return false;
    }
    return true;
  };

  // Helper to get target spreadsheet ID
  const getTargetId = (req: express.Request) => {
    return (req.headers['x-spreadsheet-id'] as string) || spreadsheetId;
  };

  // Endpoint untuk cek status konfigurasi di Vercel
  app.get('/api/status', (req, res) => {
    res.json({
      environment: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      config: {
        hasEmail: !!googleEmail,
        hasKey: !!googleKey,
        hasSpreadsheetId: !!spreadsheetId,
        hasScriptUrl: !!scriptUrl && scriptUrl.startsWith('https')
      },
      tips: "Jika config masih false, isi Environment Variables di Dashboard Vercel (Settings > Environment Variables)"
    });
  });

  // MULTI-TENANT: Endpoint untuk verifikasi ID Desa dari Master Sheet
  app.post('/api/tenant/verify', async (req, res) => {
    try {
      const { villageId } = req.body;
      if (!villageId) return res.status(400).json({ error: 'Village ID is required' });

      console.log(`[TENANT] Verifying village ID: "${villageId}"...`);
      
      let villageDataRaw;

      // Prioritas menggunakan Apps Script Bridge jika ada
      if (scriptUrl) {
        try {
          console.log('[TENANT] Using Apps Script Bridge...');
          villageDataRaw = await callBridge(req, 'verifyTenant', [villageId]);
        } catch (bridgeErr: any) {
          console.error('[TENANT] Bridge Error:', bridgeErr.message);
          // Don't throw yet, try fallback if service account is available
        }
      }

      if (!villageDataRaw) {
        console.log('[TENANT] Using Service Account Fallback...');
        // Fallback ke Service Account jika Bridge tidak ada atau gagal
        if (!googleKey || !googleEmail) {
          console.error('[TENANT] Missing Service Account Credentials');
          throw new Error('KONFIGURASI ERROR: GOOGLE_PRIVATE_KEY atau EMAIL tidak diatur di Secrets/Environment Variables Vercel.');
        }
        
        if (!spreadsheetId) {
          console.error('[TENANT] Missing GOOGLE_SPREADSHEET_ID');
          throw new Error('KONFIGURASI ERROR: GOOGLE_SPREADSHEET_ID tidak diatur.');
        }

        console.log('[TENANT] Loading Master Spreadsheet:', spreadsheetId);
        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();
        
        const masterSheet = doc.sheetsByTitle['MASTER_DESA'];
        if (!masterSheet) {
          console.error('[TENANT] Sheet "MASTER_DESA" not found');
          throw new Error('Master sheet "MASTER_DESA" tidak ditemukan di Spreadsheet utama.');
        }

        const rows = await masterSheet.getRows();
        console.log(`[TENANT] Found ${rows.length} villages in Master Sheet.`);
        
        const row = rows.find(r => r.get('ID_DESA')?.toString().toUpperCase() === villageId.toUpperCase());
        
        if (row) {
          villageDataRaw = {
            id: row.get('ID_DESA'),
            name: row.get('NAMA_DESA'),
            sheetId: row.get('SPREADSHEET_ID'),
            status: row.get('STATUS')
          };
        }
      }

      if (!villageDataRaw) {
        return res.status(404).json({ error: 'Desa tidak ditemukan atau ID salah.' });
      }

      if (villageDataRaw.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Akses dinonaktifkan untuk desa ini. Silakan hubungi admin.' });
      }

      res.json({
        success: true,
        village: villageDataRaw
      });
    } catch (error: any) {
      console.error('Tenant verification error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });

  // Dashboard & Misc APIs (Using Bridge priority if available)
  app.get('/api/dashboard/stats', async (req, res) => {
    if (!checkAuth(res)) return;
    try {
      if (scriptUrl) {
        const stats = await callBridge(req, 'getDashboardStats');
        return res.json(stats);
      }
      // Fallback or other logic if needed
      res.json({ message: "Dashboard stats only supported via Apps Script Bridge currently" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Spreadsheet API
  app.get('/api/sheets/:sheetName', async (req, res) => {
    if (!checkAuth(res)) return;
    try {
      const { sheetName } = req.params;
      
      // Use Bridge if available for specific complex functions
      if (scriptUrl) {
        let data;
        if (sheetName === 'Pegawai') data = await callBridge(req, 'getPegawai');
        else if (sheetName === 'DataSPD') data = await callBridge(req, 'getSPDList');
        else if (sheetName === 'DataLAPORAN') data = await callBridge(req, 'getLaporanList');
        else if (sheetName === 'DataSPJ') data = await callBridge(req, 'getSPJList');
        else if (sheetName === 'Config') data = await callBridge(req, 'getConfig');
        
        if (data) return res.json(data);
      }

      // Fallback to direct library for generic sheets
      const doc = new GoogleSpreadsheet(getTargetId(req)!, auth);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle[sheetName];
      if (!sheet) {
        return res.status(404).json({ error: `Sheet "${sheetName}" not found` });
      }
      const rows = await sheet.getRows();
      const data = rows.map(row => row.toObject());
      res.json(data);
    } catch (error: any) {
      console.error('Sheet fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/sheets/:sheetName', async (req, res) => {
    if (!checkAuth(res)) return;
    try {
      const { sheetName } = req.params;

      if (scriptUrl) {
        if (sheetName === 'Pegawai') {
          const result = await callBridge(req, 'tambahPegawai', [req.body]);
          return res.json(result);
        }
        if (sheetName === 'DataSPD') {
          const result = await callBridge(req, 'saveSPD', [req.body]);
          return res.json(result);
        }
        if (sheetName === 'DataLAPORAN') {
          const result = await callBridge(req, 'saveLaporan', [req.body]);
          return res.json(result);
        }
        if (sheetName === 'DataSPJ') {
          const result = await callBridge(req, 'saveSPJ', [req.body]);
          return res.json(result);
        }
        if (sheetName === 'Config') {
          const result = await callBridge(req, 'updateConfig', [req.body]);
          return res.json(result);
        }
      }

      const doc = new GoogleSpreadsheet(getTargetId(req)!, auth);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle[sheetName];
      if (!sheet) {
        return res.status(404).json({ error: `Sheet "${sheetName}" not found` });
      }
      await sheet.addRow(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Sheet update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Drive Upload
  app.post('/api/drive/upload', upload.single('file'), async (req: any, res: any) => {
    if (!checkAuth(res)) return;
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      // Use the safe client helper
      const drive = getDriveClient();
      const response = await drive.files.create({
        requestBody: {
          name: `upload_${Date.now()}_${file.originalname}`,
          // You might want to specify a folder ID here
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        },
        fields: 'id, webViewLink, webContentLink',
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Drive upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google Doc Generation
  app.post('/api/docs/generate/:templateType', async (req, res) => {
    if (!checkAuth(res)) return;
    try {
      const { templateType } = req.params;
      const data = req.body;
      // Extract image data from either root or inside data object
      const base64Image = req.body.base64Image || req.body.imageData || (data && (data.base64Image || data.imageData));

      if (scriptUrl) {
        // Map types to what Apps Script expects: 'SPD', 'LAPORAN', 'SPJ'
        const type = templateType.toUpperCase();
        console.log(`[DOC GEN] Requesting ${type} document generation via Bridge...`);
        
        try {
          const result = await callBridge(req, 'generateDocument', [type, data, base64Image]);
          console.log(`[DOC GEN] Bridge response for ${type}:`, result);
          
          // Handle result being just a URL string OR an object with url property
          const docUrl = typeof result === 'string' ? result : (result.url || result.webViewLink || result.webViewlink);
          const docId = result.docId || (typeof result === 'string' ? result.split('/d/')[1]?.split('/')[0] : null);
          
          if (!docUrl) {
            console.error(`[DOC GEN] No URL found in bridge response for ${type}`);
          }
          
          return res.json({ docId, url: docUrl });
        } catch (bridgeErr) {
          console.error(`[DOC GEN] Bridge error for ${type}:`, bridgeErr);
          throw bridgeErr;
        }
      }

      // Old direct method as fallback (limited functionality)
      const drive = google.drive({ version: 'v3', auth });
      const docs = google.docs({ version: 'v1', auth });

      let templateId = '';
      if (templateType === 'spd') templateId = process.env.GOOGLE_DOC_SPD_TEMPLATE_ID!;
      else if (templateType === 'spj') templateId = process.env.GOOGLE_DOC_SPJ_TEMPLATE_ID!;
      else if (templateType === 'laporan') templateId = process.env.GOOGLE_DOC_LAPORAN_TEMPLATE_ID!;

      if (!templateId) return res.status(400).json({ error: 'Template ID missing' });

      const copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: `Official Document - ${data.nomorSPPD || data.id}`,
        },
      });

      const newDocId = copyResponse.data.id!;
      const requests = Object.keys(data).map(key => ({
        replaceAllText: {
          containsText: { text: `{{${key}}}`, matchCase: false },
          replaceText: String(data[key]),
        },
      }));

      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests },
      });

      res.json({ docId: newDocId, url: `https://docs.google.com/document/d/${newDocId}/edit` });
    } catch (error: any) {
      console.error('Doc generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Export for Vercel or listen locally
  if (process.env.VERCEL) {
    return app;
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
  
  return app;
}

// Handle local execution
if (!process.env.VERCEL) {
  startServer();
}

// Initialized app instance for Vercel
let appInstance: any;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    appInstance = await startServer();
  }
  return appInstance(req, res);
}
