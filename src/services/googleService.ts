/**
 * googleService.ts - Service for interacting with Google Workspace integration backend
 */

import { AppConfig } from '../types.ts';

// Helper to get headers with tenant ID
const getHeaders = (extraHeaders = {}) => {
  const savedVillage = localStorage.getItem('perjadin_village');
  const headers: any = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  
  if (savedVillage) {
    const { sheetId } = JSON.parse(savedVillage);
    if (sheetId) {
      headers['x-spreadsheet-id'] = sheetId;
    }
  }
  
  return headers;
};

// Helper for safe fetch with better error reporting
const safeFetch = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers || {})
  });
  
  const text = await response.text();
  let data;
  
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
    }
    throw new Error(`Gagal membaca JSON dari server. Teks: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data.error || `Server Error (${response.status})`);
  }
  
  return data;
};

export const googleService = {
  // Dashboard & Quick Stats
  async getDashboardStats() {
    return safeFetch('/api/dashboard/stats');
  },

  // Sheets API
  async getPegawai() {
    return safeFetch('/api/sheets/Pegawai');
  },

  async addPegawai(data: any) {
    return safeFetch('/api/sheets/Pegawai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSPD() {
    return safeFetch('/api/sheets/DataSPD');
  },

  async addSPD(data: any) {
    try {
      // 1. Simpan ke Spreadsheet
      await fetch('/api/sheets/DataSPD', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Gagal mencatat ke Sheet, mencoba lanjut...', e);
    }

    // 2. Generate Google Doc
    return safeFetch('/api/docs/generate/spd', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSPJ() {
    return safeFetch('/api/sheets/DataSPJ');
  },

  async addSPJ(data: any) {
    try {
      await fetch('/api/sheets/DataSPJ', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Sheet SPJ gagal, lanjut...', e);
    }

    return safeFetch('/api/docs/generate/spj', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addLaporan(data: any) {
    try {
      await fetch('/api/sheets/DataLAPORAN', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Sheet Laporan gagal, lanjut...', e);
    }

    return safeFetch('/api/docs/generate/laporan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getLaporan() {
    return safeFetch('/api/sheets/DataLAPORAN');
  },

  async getConfig() {
    return safeFetch('/api/sheets/Config');
  },

  async updateConfig(data: Partial<AppConfig>) {
    return safeFetch('/api/sheets/Config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Drive API
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/drive/upload', {
      method: 'POST',
      headers: {
        'x-spreadsheet-id': getHeaders()['x-spreadsheet-id'] || ''
      },
      body: formData,
    });
    
    const text = await response.text();
    if (!response.ok) throw new Error(`Upload gagal (${response.status}): ${text.substring(0, 50)}`);
    return text ? JSON.parse(text) : {};
  }
};
