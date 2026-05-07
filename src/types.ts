/**
 * perjadinGO - Type Definitions
 */

export interface Pegawai {
  id?: string;
  nama: string;
  nik: string;
  jabatan: string;
  alamat: string;
  createdAt?: string;
}

export interface SPD {
  id?: string;
  nomorSPPD: string;
  pegawaiId: string;
  nama: string;
  nik: string;
  jabatan: string;
  alamat: string;
  dasar: string;
  maksud: string;
  tujuan: string;
  tempatTujuan: string;
  tglBerangkat: string;
  tglKembali: string;
  lamaHari: number;
  alatAngkut: string;
  kodeAnggaran: string;
  mataAnggaran: string;
  tahun: string;
  linkPDF?: string;
}

export interface Laporan {
  id?: string;
  spdId: string;
  nomorSPPD: string;
  nama: string;
  nik?: string;
  alamat?: string;
  maksud?: string;
  tempatTujuan?: string;
  tglBerangkat?: string;
  tglKembali?: string;
  tglBuat: string;
  isiRingkas: string;
  linkPDF?: string;
  laporan1: string;
  laporan2: string;
  laporan3: string;
  caption: string;
  imageData?: string; // drive link or base64
  base64Image?: string; // used for transfer to backend
  timestamp?: string;
}

export interface SPJ {
  id?: string;
  spdId: string;
  nomorSPPD: string;
  nama: string;
  nik?: string;
  alamat?: string;
  maksud?: string;
  tempatTujuan?: string;
  uangHarian: number;
  uangBBM: number;
  jumlah: number;
  bendahara: string;
  sekdes: string;
  kades: string;
  biayaStr: string;
  tglBayar: string;
  linkPDF?: string;
  timestamp?: string;
}

export interface AppConfig {
  NAMA_DESA: string;
  KECAMATAN: string;
  KABUPATEN: string;
  NAMA_KADES: string;
  SEKDES: string;
  BENDAHARA: string;
  TAHUN_ANGGARAN: string;
  KODE_ANGGARAN: string;
  ALAMAT_KANTOR: string;
  EMAIL_KANTOR: string;
  WEB_KANTOR: string;
  KODEPOS_KANTOR: string;
}
