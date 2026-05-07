/**
 * APPS SCRIPT BRIDGE - PASTE THIS INTO YOUR GOOGLE APPS SCRIPT EDITOR
 * Tutorial: 
 * 1. Open Google Sheet
 * 2. Extensions > Apps Script
 * 3. Replace all code with this
 * 4. Build > Deploy > New Deployment > Web App
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Copy the Web App URL and set as GOOGLE_SCRIPT_URL in AI Studio Secrets
 */

const SPREADSHEET_ID = "1hDBsEYcVWcESO2oXVHq49Wb-dMYDERPGiYr5YtcuzuY"; 
const FOLDER_ROOT_ID = "1qqIzwZhFYyP0zVL1KL_MbUMGBikS63c6";

let currentSheetId = null; 

// Mapping functions specifically for bridge
const bridgeFunctions = {
  'getConfig': getConfig,
  'getPegawai': getPegawai,
  'getSPDList': getSPDList,
  'getLaporanList': getLaporanList,
  'getSPJList': getSPJList,
  'tambahPegawai': tambahPegawai,
  'saveSPD': saveSPD,
  'saveLaporan': saveLaporan,
  'saveSPJ': saveSPJ,
  'updateConfig': updateConfig,
  'generateDocument': generateDocument,
  'getDashboardStats': getDashboardStats,
  'verifyTenant': verifyTenant
};

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const { funcName, args, spreadsheetId } = data;
  
  if (spreadsheetId) {
    currentSheetId = spreadsheetId;
  }
  
  try {
    const func = bridgeFunctions[funcName] || this[funcName];
    if (typeof func !== 'function') throw new Error("Fungsi " + funcName + " tidak terdaftar atau tidak ditemukan.");
    
    const res = func.apply(null, args);
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(name) {
  // Jika ini MASTER_DESA, kita HARUS pakai SPREADSHEET_ID (Master), jangan pakai yang lain.
  const isMaster = (name === "MASTER_DESA");
  const targetId = isMaster ? SPREADSHEET_ID : (currentSheetId || SPREADSHEET_ID);
  
  try {
    const ss = SpreadsheetApp.openById(targetId);
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (name === 'Pegawai') sheet.getRange(1, 1, 1, 4).setValues([["id", "nama", "jabatan", "nik"]]);
      if (name === 'DataSPD') sheet.getRange(1, 1, 1, 13).setValues([["id", "nomorSPPD", "nama", "nik", "jabatan", "dasar", "instansi", "maksud", "tempatTujuan", "alatAngkut", "tglBerangkat", "tglKembali", "lamaHari"]]);
      if (name === 'DataLAPORAN') sheet.getRange(1, 1, 1, 11).setValues([["id", "spdId", "nomorSPPD", "nama", "nik", "tglBuat", "isiRingkas", "imageData", "caption", "laporan1", "timestamp"]]);
      if (name === 'DataSPJ') sheet.getRange(1, 1, 1, 12).setValues([["id", "spdId", "nomorSPPD", "nama", "nik", "uangHarian", "uangBBM", "jumlah", "bendahara", "sekdes", "kades", "tglBayar"]]);
      if (name === 'MASTER_DESA') sheet.getRange(1, 1, 1, 4).setValues([["ID_DESA", "NAMA_DESA", "SPREADSHEET_ID", "STATUS"]]);
    }
    return sheet;
  } catch (e) {
    throw new Error("Gagal membuka Spreadsheet ID: " + targetId + ". Pesan: " + e.message);
  }
}

// --- DATA ACCESSORS ---

function getConfig() {
  const sheet = getSheet("Config");
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return config;
}

function getPegawai() {
  const sheet = getSheet("Pegawai");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getSPDList() {
  const sheet = getSheet("DataSPD");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).reverse().map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getLaporanList() {
  const sheet = getSheet("DataLAPORAN");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).reverse().map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getSPJList() {
  const sheet = getSheet("DataSPJ");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).reverse().map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// --- DATA SAVERS ---

function tambahPegawai(data) {
  const sheet = getSheet("Pegawai");
  sheet.appendRow([data.id, data.nama, data.jabatan, data.nik || data.nip]);
  return { success: true };
}

function saveSPD(data) {
  const sheet = getSheet("DataSPD");
  sheet.appendRow([
    data.id, 
    data.nomorSPPD, 
    data.nama, 
    data.nik || "",
    data.jabatan, 
    data.dasar, 
    data.instansi || data.tujuan || "",
    data.maksud, 
    data.tempatTujuan || data.tujuan || "",
    data.alatAngkut || "",
    data.tglBerangkat || "", 
    data.tglKembali || "", 
    data.lamaHari || ""
  ]);
  return { success: true };
}

function saveLaporan(data) {
  const sheet = getSheet("DataLAPORAN");
  sheet.appendRow([
    data.id,
    data.spdId,
    data.nomorSPPD,
    data.nama,
    data.nik || "",
    data.tglBuat,
    data.isiRingkas,
    data.imageData,
    data.caption,
    data.laporan1,
    data.timestamp || new Date().toISOString()
  ]);
  return { success: true, id: data.id };
}

function saveSPJ(data) {
  const sheet = getSheet("DataSPJ");
  sheet.appendRow([
    data.id,
    data.spdId,
    data.nomorSPPD,
    data.nama,
    data.nik || "",
    data.uangHarian,
    data.uangBBM,
    data.jumlah,
    data.bendahara,
    data.sekdes,
    data.kades,
    data.tglBayar
  ]);
  return { success: true };
}

function updateConfig(data) {
  const sheet = getSheet("Config");
  Object.keys(data).forEach(key => {
    const finder = sheet.createTextFinder(key).matchEntireCell(true).findNext();
    if (finder) {
      sheet.getRange(finder.getRow(), 2).setValue(data[key]);
    } else {
      sheet.appendRow([key, data[key]]);
    }
  });
  return { success: true };
}

// --- DOCUMENT GENERATOR ---

function generateDocument(type, data, base64Image) {
  let templateId = "";
  const config = getConfig();
  const upType = type.toUpperCase();
  
  // High-flexibility Template ID Search
  const possibleKeys = [
    upType + "_TEMPLATE_ID", 
    "TEMPLATE_" + upType + "_ID", 
    "ID_TEMPLATE_" + upType,
    upType + "_DOC_ID",
    "TEMPLATE_" + (type === "SPD" ? "SPPD" : type) // Legacy support
  ];
  
  // Set defaults based on hardcoded values if not in config
  if (upType === "SPD") templateId = config.SPD_TEMPLATE_ID || "1-NIfpfHFTDnvVWbxjthqgsMFCfIV59X8R43zExK5w5I";
  if (upType === "LAPORAN") templateId = config.LAPORAN_TEMPLATE_ID || "1-jdPT0cmo8Qqxp_hgIxZSDuWXVxQQM41JwSVG-la0aE";
  if (upType === "SPJ") templateId = config.SPJ_TEMPLATE_ID || "1YtO_yxETvX5AbLyygyhurXNh9J0YKMS-D9niVL9Bu9Q";
  
  for (let k of possibleKeys) {
    if (config[k]) {
      templateId = config[k];
      break;
    }
  }
  
  if (!templateId) throw new Error("Template ID untuk " + upType + " belum diatur di Sheet Config. Harap tambahkan key: " + possibleKeys[0] + " di tab Config.");
  
  let root;
  let copyFile;
  try {
    const templateFile = DriveApp.getFileById(templateId);
    if (!templateFile) throw new Error("Template file tidak ditemukan.");
    
    const parents = templateFile.getParents();
    if (parents.hasNext()) {
      root = parents.next();
    } else {
      root = DriveApp.getRootFolder();
    }
    
    const fileName = type + " - " + (data.nomorSPPD || data.id || "Doc");
    copyFile = templateFile.makeCopy(fileName, root);
  } catch (e) {
    throw new Error("Gagal mengakses/menyalin template dari Google Drive: " + e.message);
  }

  const copyId = copyFile.getId();
  const doc = DocumentApp.openById(copyId);
  const body = doc.getBody();
  
  // High-precision Mapping
  const repl = {
    'ALAMAT_KANTOR': config['ALAMAT_KANTOR'],
    'EMAIL_KANTOR': config['EMAIL_KANTOR'],
    'WEB_KANTOR': config['WEB_KANTOR'],
    'KODEPOS_KANTOR': config['KODEPOS_KANTOR'],
    'NAMA_DESA': config['NAMA_DESA'],
    'KECAMATAN': config['KECAMATAN'],
    'KABUPATEN': config['KABUPATEN'],
    'NAMA_KADES': config['NAMA_KADES'],
    'KADES': config['NAMA_KADES'],
    'BENDAHARA': config['BENDAHARA'] || "Bendahara Desa",
    'SEKDES': config['SEKDES'] || "Sekretaris Desa",
    'NOMOR_SPPD': data.nomorSPPD || data.nomor,
    'DASAR_SPPD': data.dasar,
    'MAKSUD_PERJALANAN': data.maksud,
    'TEMPAT_TUJUAN': data.tempatTujuan || data.tujuan,
    'TANGGAL_BERANGKAT': formatTglIndo(data.tglBerangkat || data.tanggalBerangkat),
    'TANGGAL_KEMBALI': formatTglIndo(data.tglKembali || data.tanggalKembali),
    'LAMA_HARI': data.lamaHari || data.lamahari,
    'ALAT_ANGKUT': data.alatAngkut,
    'MATA_ANGGARAN': data.mataAnggaran,
    'NAMA': data.nama,
    'NIK': data.nik,
    'ALAMAT': data.alamat || "",
    'JABATAN': data.jabatan,
    'LAPORAN_1': data.laporan1,
    'LAPORAN_2': data.laporan2,
    'LAPORAN_3': data.laporan3,
    'CAPTION': data.caption,
    'KETERANGAN': data.caption,
    'UANG_HARIAN': formatRp(data.uangHarian),
    'UANG_BBM': formatRp(data.uangBBM),
    'BIAYA': formatRp(data.biaya || data.totalBiaya || data.jumlah),
    'JUMLAH': formatRp(data.jumlah || data.totalBiaya || data.biaya),
    'TGL_BAYAR': formatTglIndo(data.tglBayar)
  };

  for (let key in repl) {
    body.replaceText("{{" + key + "}}", repl[key] || "");
  }

  // Handle Image with Precise Auto-Resize
  if (base64Image) {
    try {
      const imgData = base64Image.split(",")[1] || base64Image;
      const blob = Utilities.newBlob(Utilities.base64Decode(imgData), "image/jpeg", "dokumentasi.jpg");
      
      // Support various placeholders
      const placeholders = ["{{IMAGE}}", "{{FOTO_Upload}}", "{{FOTO}}", "{{Bukti}}"];
      let found = false;
      for (let p of placeholders) {
        let search = body.findText(p);
        if (search) {
          const element = search.getElement();
          element.asText().setText(""); 
          const img = element.getParent().asParagraph().appendInlineImage(blob);
          
          // Auto resize to fit (max width 450, max height 300)
          let w = img.getWidth();
          let h = img.getHeight();
          const MAX_W = 450;
          const MAX_H = 300;
          
          let ratio = 1;
          if (w > MAX_W) ratio = MAX_W / w;
          if (h * ratio > MAX_H) ratio = MAX_H / h;
          
          img.setWidth(w * ratio);
          img.setHeight(h * ratio);
          found = true;
          break;
        }
      }
    } catch (e) {
      Logger.log("Image injection failed: " + e.message);
    }
  }
  
  doc.saveAndClose();
  
  // Convert to PDF
  let pdfFile;
  try {
    const pdfBlob = copyFile.getAs('application/pdf');
    // Try to save in same folder as template, fallback to root if fail
    try {
      pdfFile = root.createFile(pdfBlob);
    } catch (e) {
      pdfFile = DriveApp.getRootFolder().createFile(pdfBlob);
    }
    try {
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log("Sharing failed: " + e.message);
    }
  } catch (e) {
    throw new Error("Gagal konversi ke PDF: " + e.message);
  }
  
  // Delete temporary Doc
  try {
    copyFile.setTrashed(true);
  } catch (e) {
    Logger.log("Failed to delete temp doc: " + e.message);
  }
  
  return { url: pdfFile.getUrl(), docId: pdfFile.getId() };
}

function formatTglIndo(d) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    const day = date.getDate();
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return day + " " + month + " " + year;
  } catch(e) {
    return d;
  }
}

function formatRp(val) {
  if (!val) return "0";
  const num = typeof val === 'string' ? parseInt(val.replace(/[^0-9]/g, '')) : val;
  if (isNaN(num)) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getDashboardStats() {
  const spd = getSheet("DataSPD").getLastRow() - 1;
  const laporan = getSheet("DataLAPORAN").getLastRow() - 1;
  const spj = getSheet("DataSPJ").getLastRow() - 1;
  
  return {
    totalSPD: spd > 0 ? spd : 0,
    totalLaporan: laporan > 0 ? laporan : 0,
    totalSPJ: spj > 0 ? spj : 0,
    lastUpdate: new Date().toISOString()
  };
}

function verifyTenant(villageId) {
  const targetId = SPREADSHEET_ID;
  const ss = SpreadsheetApp.openById(targetId);
  const sheet = ss.getSheetByName("MASTER_DESA") || ss.insertSheet("MASTER_DESA");
  
  const range = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1) + 10, 10);
  const fullData = range.getValues();
  
  let headerRowIndex = -1;
  let headers = [];
  
  // Mencari baris header
  for (let i = 0; i < fullData.length; i++) {
    const row = fullData[i].map(c => String(c).trim().toUpperCase());
    if (row.indexOf("ID_DESA") !== -1) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }
  
  // FITUR BARU: AUTO GENERATE JIKA KOSONG
  if (headerRowIndex === -1) {
    const isSheetEmpty = fullData.every(row => row.every(cell => String(cell).trim() === ""));
    if (isSheetEmpty) {
      sheet.getRange(1, 1, 1, 4).setValues([["ID_DESA", "NAMA_DESA", "SPREADSHEET_ID", "STATUS"]]);
      throw new Error("Tab MASTER_DESA di Spreadsheet '" + ss.getName() + "' ternyata kosong. Kami sudah OTOMATIS membuatkan Judul Kolom. Silakan buka Sheet tersebut, isi data desa (ID_DESA, SPREADSHEET_ID, dll), lalu coba lagi.");
    }
    
    // Jika tidak kosong tapi header tidak ditemukan
    throw new Error("Header 'ID_DESA' tidak ditemukan di baris manapun pada tab MASTER_DESA. Pastikan Anda menulis ID_DESA di Baris 1.");
  }
  
  const idIdx = headers.indexOf("ID_DESA");
  const sheetIdIdx = headers.indexOf("SPREADSHEET_ID");
  const nameIdx = headers.indexOf("NAMA_DESA");
  const statusIdx = headers.indexOf("STATUS");
  
  const searchId = String(villageId).trim().toUpperCase();
  
  // Cari di data setelah header
  for (let i = headerRowIndex + 1; i < fullData.length; i++) {
    const row = fullData[i];
    if (row[idIdx] && String(row[idIdx]).trim().toUpperCase() === searchId) {
      return {
        id: String(row[idIdx]).trim(),
        name: String(row[nameIdx] || row[idIdx]).trim(),
        sheetId: String(row[sheetIdIdx]).trim(),
        status: String(row[statusIdx] || "ACTIVE").toUpperCase()
      };
    }
  }
  
  return null;
}
