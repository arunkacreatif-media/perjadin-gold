import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  MapPin, 
  Calendar, 
  Truck, 
  CreditCard,
  Printer,
  ChevronRight,
  Info,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDateIndo } from '../lib/utils.ts';
import { Pegawai, SPD, AppConfig } from '../types.ts';
import { googleService } from '../services/googleService.ts';

interface SPDGeneratorProps {
  pegawai: Pegawai[];
  spdList: SPD[];
  setSpdList: (data: SPD[]) => void;
  config: AppConfig;
}

export default function SPDGenerator({ pegawai, spdList, setSpdList, config }: SPDGeneratorProps) {
  const [selectedPegawaiId, setSelectedPegawaiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedId, setLastSavedId] = useState('');

  // Fungsi pembantu untuk mengambil label Nomor SPD secara dinamis dan defensif
  const getSpdLabel = (s: any) => {
    if (!s) return 'Loading...';
    
    // Prioritas 1: Kecocokan nama properti yang umum (terutama dengan spasi seperti di Spreadsheet)
    const candidates = [
      s.nomorSPPD, 
      s.nomorSPD, 
      s["Nomor SPPD"], 
      s["Nomor SPD"], 
      s.NomorSPPD, 
      s.NomorSPD, 
      s["Nomor_SPPD"], 
      s["No. SPD"], 
      s.NoSPD,
      s.nomorsppd
    ];
    
    for (const val of candidates) {
      if (val && typeof val === 'string' && val.length > 5) return val;
    }
    return s.nomorSPPD || s.nomorsppd || s.id || (s as any).ID || 'SPD Record';
  };

  const getSafeValue = (obj: any, key: string) => {
    if (!obj) return '';
    const search = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Prioritas 1: Exact normalized match
    for (const k in obj) {
       if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === search) return obj[k];
    }
    // Prioritas 2: Partial match
    for (const k in obj) {
       if (k.toLowerCase().includes(search)) return obj[k];
    }
    return obj[key] || '';
  };
  
  const [formData, setFormData] = useState<Partial<SPD>>({
    dasar: '',
    maksud: '',
    tujuan: '',
    tempatTujuan: '',
    tglBerangkat: '',
    tglKembali: '',
    lamaHari: 0,
    alatAngkut: 'Kendaraan Pribadi',
    kodeAnggaran: '01.01.01.01',
    mataAnggaran: '5.2.3.01',
  });

  useEffect(() => {
    if (formData.tglBerangkat && formData.tglKembali) {
      const start = new Date(formData.tglBerangkat);
      const end = new Date(formData.tglKembali);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1;
      setFormData(prev => ({ ...prev, lamaHari: diffDays }));
    }
  }, [formData.tglBerangkat, formData.tglKembali]);

  const handlePegawaiChange = (id: string) => {
    setSelectedPegawaiId(id);
  };

  const currentPegawai = pegawai.find((p, idx) => {
    const pId = p.id || (p as any).ID || (p as any).id || `peg-${idx}`;
    return String(pId) === String(selectedPegawaiId);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPegawai) {
      alert("Silakan pilih personel terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const urutan = spdList.length + 1;
      const nomorSPPD = `${urutan}/SPD/${config.KODE_ANGGARAN}/${config.TAHUN_ANGGARAN}`;
      
        const newSPD: SPD = {
        ...formData as SPD,
        id: crypto.randomUUID(),
        nomorSPPD,
        pegawaiId: String(currentPegawai.id || (currentPegawai as any).ID || (currentPegawai as any).id),
        nama: currentPegawai.nama || (currentPegawai as any).Nama || getSafeValue(currentPegawai, 'nama'),
        nik: getSafeValue(currentPegawai, 'nik') || getSafeValue(currentPegawai, 'niap') || getSafeValue(currentPegawai, 'niapnik') || getSafeValue(currentPegawai, 'nip'),
        jabatan: getSafeValue(currentPegawai, 'jabatan'),
        alamat: getSafeValue(currentPegawai, 'alamat'),
        tahun: config.TAHUN_ANGGARAN,
      };

      // 1. Sync to Google Workspace
      console.log('Sending SPD data to Google Workspace...', newSPD);
      const response = await googleService.addSPD(newSPD);
      console.log('Response from Google Workspace:', response);
      
      // 2. Update Local State
      setSpdList([...spdList, newSPD]);
      
      const docUrl = response.url || (typeof response === 'string' ? response : null);
      
      if (docUrl && typeof docUrl === 'string') {
        console.log('Opening document URL:', docUrl);
        window.open(docUrl, '_blank');
        setLastSavedId(nomorSPPD);
        setShowSuccess(true);
      } else {
        console.warn('Doc URL not found in response:', response);
        alert(`Berhasil! Data telah tersimpan di Spreadsheet, namun link cetak tidak ditemukan.`);
      }
      
      // Auto close notification after 5 seconds
      setTimeout(() => setShowSuccess(false), 8000);
      
      // Reset form
      setFormData({
        dasar: '',
        maksud: '',
        tujuan: '',
        tempatTujuan: '',
        tglBerangkat: '',
        tglKembali: '',
        lamaHari: 0,
        alatAngkut: 'Kendaraan Pribadi',
        kodeAnggaran: config.KODE_ANGGARAN,
        mataAnggaran: '5.2.3.01',
      });
      setSelectedPegawaiId('');
    } catch (error) {
      console.error('Gagal integrasi Google Workspace:', error);
      alert('Terjadi kesalahan saat sinkronisasi dengan Google Workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="prestige-card p-6 rounded-[32px] bg-white shadow-2xl relative overflow-hidden">
        {/* Ribbon accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37] opacity-10 blur-3xl -mr-12 -mt-12" />
        
        <div className="mb-6 border-b-2 border-[#F5F2E9] pb-6 relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-2.5 bg-[#111111] rounded-[16px] border-2 border-[#D4AF37] shadow-xl">
              <FileText className="text-[#D4AF37]" size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold font-serif text-[#111111] tracking-tight">Dokumen SPD Elektronika</h1>
              <p className="text-xs text-[#8B5E3C] font-medium mt-0.5">Sistem Administrasi Perjalanan Dinas Terpadu</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black font-serif text-[#111111] border-l-4 border-[#D4AF37] pl-5 flex items-center gap-4 not-italic">
              <User size={16} className="text-[#D4AF37]" />
              Personel Pelaksana Tugas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#111111] uppercase tracking-wide ml-1">Seleksi Personel</label>
                <select 
                  required
                  className="w-full px-5 py-2.5 rounded-[16px] font-bold text-[#111111] bg-white border-2 border-[#D4AF37]/30 cursor-pointer hover:border-[#D4AF37] transition-all text-sm"
                  value={selectedPegawaiId}
                  onChange={(e) => handlePegawaiChange(e.target.value)}
                >
                  <option value="" style={{ color: '#888' }}>-- Pilih Data Pegawai --</option>
                  {pegawai.map((p, idx) => {
                    const id = p.id || (p as any).ID || `peg-${idx}`;
                    const nama = p.nama || (p as any).Nama;
                    return (
                      <option key={`opt-peg-${id}-${idx}`} value={id} style={{ color: '#111111' }}>
                        {nama}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#111111] uppercase tracking-wide ml-1">Nomor Identitas</label>
                <div 
                  className={cn(
                    "w-full px-5 py-2.5 rounded-[16px] font-bold text-[#111111] text-sm h-[46px] shadow-inner border transition-all flex items-center overflow-hidden",
                    selectedPegawaiId && currentPegawai ? "bg-white border-[#D4AF37]" : "bg-[#F5F2E9] border-[#D9D9D9] text-[#111111]/30"
                  )}
                >
                  {currentPegawai ? (getSafeValue(currentPegawai, 'nik') || getSafeValue(currentPegawai, 'niap') || getSafeValue(currentPegawai, 'niapnik') || getSafeValue(currentPegawai, 'nip') || '—') : <span className="text-xs opacity-50">NIK Terisi Otomatis</span>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#111111] uppercase tracking-wide ml-1">Jabatan Struktural</label>
                <div 
                  className={cn(
                    "w-full px-5 py-2.5 rounded-[16px] font-bold text-[#111111] text-sm h-[46px] shadow-inner border transition-all flex items-center overflow-hidden truncate",
                    selectedPegawaiId && currentPegawai ? "bg-white border-[#D4AF37]" : "bg-[#F5F2E9] border-[#D9D9D9] text-[#111111]/30"
                  )}
                >
                  {currentPegawai ? (getSafeValue(currentPegawai, 'jabatan') || '—') : <span className="text-xs opacity-50">Jabatan Terisi Otomatis</span>}
                </div>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="p-3 bg-[#111111] rounded-[16px] border-2 border-[#D4AF37] shadow-xl text-center h-[46px] flex flex-col justify-center">
                  <p className="text-[7px] uppercase font-bold text-[#D4AF37]/70 tracking-[0.2em] mb-0.5 leading-none">Verifikasi</p>
                  <p className="text-[9px] font-bold text-[#D4AF37] not-italic tracking-[0.15em] uppercase leading-none">{currentPegawai ? 'TERVERIFIKASI' : 'MENUNGGU'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Maksud & Tujuan */}
          <div className="space-y-8">
             <h3 className="text-sm font-black font-serif text-[#111111] border-l-4 border-[#D4AF37] pl-5 flex items-center gap-4 not-italic">
              <MapPin size={18} className="text-[#D4AF37]" />
              Mandat & Lokasi Tujuan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3 md:col-span-2 lg:col-span-2">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Landasan Hukum / Surat Dasar</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Masukkan Nomor dan Perihal Surat Dasar Penugasan"
                  className="w-full px-6 py-4 prestige-input rounded-[24px] text-sm font-bold not-italic shadow-inner resize-none placeholder:text-[#111111]/30"
                  value={formData.dasar}
                  onChange={(e) => setFormData({...formData, dasar: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Maksud Penugasan</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Contoh: Kompetensi / Koordinasi"
                    className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic shadow-inner placeholder:text-[#111111]/30 text-sm"
                    value={formData.maksud}
                    onChange={(e) => setFormData({...formData, maksud: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Instansi / Dinas Tujuan</label>
                <input 
                  required
                  type="text" 
                  placeholder="Nama Instansi Tujuan"
                  className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic shadow-inner placeholder:text-[#111111]/30 text-sm"
                  value={formData.tujuan}
                  onChange={(e) => setFormData({...formData, tujuan: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Lokasi Kabupaten / Kota</label>
                <input 
                  required
                  type="text" 
                  placeholder="Tempat Tujuan"
                  className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic shadow-inner placeholder:text-[#111111]/30 text-sm"
                  value={formData.tempatTujuan}
                  onChange={(e) => setFormData({...formData, tempatTujuan: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Moda Transportasi</label>
                <select 
                  className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic shadow-inner cursor-pointer text-[#111111] text-sm"
                  value={formData.alatAngkut}
                  onChange={(e) => setFormData({...formData, alatAngkut: e.target.value})}
                >
                  <option value="Kendaraan Pribadi">Kendaraan Pribadi</option>
                  <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                  <option value="Angkutan Umum">Angkutan Umum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Waktu & Anggaran */}
          <div className="space-y-8">
            <h3 className="text-sm font-black font-serif text-[#111111] border-l-4 border-[#D4AF37] pl-5 flex items-center gap-4 not-italic">
              <Calendar size={18} className="text-[#D4AF37]" />
              Data Waktu & Anggaran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Keberangkatan</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic text-[#111111] text-sm h-[52px]"
                  value={formData.tglBerangkat}
                  onChange={(e) => setFormData({...formData, tglBerangkat: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Kepulangan</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-6 py-4 prestige-input rounded-[24px] font-bold not-italic text-[#111111] text-sm h-[52px]"
                  value={formData.tglKembali}
                  onChange={(e) => setFormData({...formData, tglKembali: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1">Jumlah Hari</label>
                <div className="relative group">
                  <input readOnly type="text" className="w-full px-6 py-4 bg-[#111111] border-2 border-[#D4AF37] rounded-[24px] font-bold text-center text-[#D4AF37] text-xl shadow-2xl not-italic h-[52px]" value={formData.lamaHari} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest not-italic border-l border-[#D4AF37]/30 pl-3">Hari</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wide ml-1 not-italic flex items-center gap-2">
                  Budget Code <Info size={12} className="text-[#D4AF37]" />
                </label>
                <div className="w-full px-6 py-4 bg-[#F5F2E9] border border-[#D9D9D9] rounded-[24px] text-[#111111] font-bold text-center tracking-[0.2em] h-[52px] flex items-center justify-center text-xs shadow-inner not-italic">
                  {formData.mataAnggaran}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t-2 border-[#D9D9D9] flex flex-col sm:flex-row justify-end gap-6">
             <button 
              type="button" 
              onClick={() => alert('Draf tersimpan di memori lokal.')}
              className="px-10 py-6 rounded-[28px] font-black text-[#8B5E3C] hover:text-[#111111] transition-all uppercase tracking-[0.3em] text-[10px] not-italic"
            >
              Simpan Draf
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !selectedPegawaiId}
              className={cn(
                "px-14 py-7 rounded-[32px] font-black text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs not-italic",
                isSubmitting || !selectedPegawaiId ? "bg-slate-300 cursor-not-allowed text-slate-500" : "bg-[#111111] text-[#D4AF37] hover:shadow-[0_0_40px_#D4AF3730] border-2 border-[#D4AF37]"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-6 w-6 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                  <span>Menghasilkan Dokumen...</span>
                </>
              ) : (
                <>
                  <Printer size={24} />
                  <span>Selesaikan & Cetak SPD</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat SPD Singkat */}
      <div className="prestige-card p-12 rounded-[48px] bg-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#D9D9D9]">
          <h1 className="text-2xl font-black font-serif text-[#111111] tracking-[0.05em] uppercase text-right">
            Riwayat Perjalanan Dinas
          </h1>
          <div className="bg-[#111111] p-2 px-4 rounded-full">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4AF37] not-italic">Tinjauan Data Utama</span>
          </div>
        </div>
        <div className="space-y-6">
           {spdList.slice(-5).reverse().map((spd, idx) => (
             <div key={spd.id || `spd-hist-${idx}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 rounded-[36px] bg-[#F5F2E9] border border-[#D9D9D9] group hover:bg-white hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/5 transition-all">
                <div className="flex items-center gap-6">
                  <div className="bg-[#111111] p-5 rounded-[24px] text-[#D4AF37] border border-[#D4AF37]/30 group-hover:scale-110 transition-all shadow-lg">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="font-black text-[#111111] text-xl tracking-tighter uppercase not-italic">
                      {getSpdLabel(spd)}
                    </p>
                    <p className="text-[10px] text-[#8B5E3C] font-black tracking-widest mt-2 uppercase flex items-center gap-2">
                      <span className="text-[#111111]">{getSafeValue(spd, 'nama')}</span>
                      <span className="w-1 h-1 bg-[#D9D9D9] rounded-full" />
                      <span className="not-italic">{getSafeValue(spd, 'maksud')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-8 sm:mt-0">
                  <div className="text-right hidden md:block">
                    <p className="text-[8px] uppercase font-black text-[#8B5E3C] tracking-[0.4em] mb-2 not-italic">Tanggal Penugasan</p>
                    <p className="text-sm font-black text-[#111111] not-italic">{formatDateIndo(spd.tglBerangkat)}</p>
                  </div>
                  <button className="w-14 h-14 bg-white border border-[#D9D9D9] text-[#8B5E3C] rounded-full flex items-center justify-center hover:bg-[#111111] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm">
                    <ChevronRight size={24} />
                  </button>
                </div>
             </div>
           ))}
           {spdList.length === 0 && (
             <div className="text-center py-24 text-[#8B5E3C] font-black not-italic uppercase tracking-[0.3em] bg-[#F5F2E9] rounded-[48px] border-4 border-dashed border-[#D9D9D9]">
                Buku besar utama kosong. Tidak ada data terdeteksi.
             </div>
           )}
        </div>
      </div>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-10 right-10 z-[100] max-w-md w-full"
          >
            <div className="bg-[#111111] border-2 border-[#D4AF37] rounded-[32px] p-6 shadow-[0_20px_50px_rgba(212,175,55,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />
              
              <div className="flex gap-5 relative z-10">
                <div className="shrink-0 p-3 bg-[#D4AF37] rounded-2xl shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
                  <CheckCircle size={24} className="text-black" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[#D4AF37] font-black uppercase tracking-[0.15em] text-[10px]">Transaksi Berhasil</h4>
                    <button onClick={() => setShowSuccess(false)} className="text-white/30 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-white font-bold text-sm leading-tight">Data SPD <span className="text-[#D4AF37]">{lastSavedId}</span> telah resmi tersimpan di Spreadsheet.</p>
                  <p className="text-white/50 text-[10px] mt-2 font-medium tracking-wide">Dokumen cetak telah di-generate dan dibuka di tab baru.</p>
                </div>
              </div>
              
              {/* Progress bar timer background */}
              <div className="absolute bottom-0 left-0 h-1 bg-[#D4AF37]/20 w-full">
                 <motion.div 
                   initial={{ width: "100%" }}
                   animate={{ width: "0%" }}
                   transition={{ duration: 8, ease: "linear" }}
                   className="h-full bg-[#D4AF37]"
                 />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}
