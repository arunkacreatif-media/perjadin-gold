import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  Receipt, 
  Calculator, 
  Printer, 
  CheckCircle2,
  FileSearch,
  DollarSign,
  TrendingDown,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatIDRCurrency, formatDateIndo } from '../lib/utils.ts';
import { SPD, SPJ, AppConfig } from '../types.ts';
import { googleService } from '../services/googleService.ts';

interface SPJGeneratorProps {
  spdList: SPD[];
  spjList: SPJ[];
  setSpjList: (data: SPJ[]) => void;
  config: AppConfig;
}

export default function SPJGenerator({ spdList, spjList, setSpjList, config }: SPJGeneratorProps) {
  const [selectedSpdId, setSelectedSpdId] = useState('');
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
      s.NoSPD
    ];
    
    for (const val of candidates) {
      if (val && typeof val === 'string' && val.length > 5) return val;
    }

    // Prioritas 2: Cari key yang mengandung kata 'Nomor' dan 'SPD' (Case-insensitive)
    const keys = Object.keys(s);
    const dynamicKey = keys.find(k => {
      const lk = k.toLowerCase();
      return lk.includes('nomor') && (lk.includes('spd') || lk.includes('sppd'));
    });
    if (dynamicKey && s[dynamicKey] && String(s[dynamicKey]).length > 5) return String(s[dynamicKey]);

    // Prioritas 3: Biasanya Kolom 2 adalah Label (Index 1)
    if (keys.length >= 2 && s[keys[1]] && String(s[keys[1]]).length > 5 && !String(s[keys[1]]).includes('-')) {
      return String(s[keys[1]]);
    }

    return s.nomorSPPD || s.id || 'SPD Record';
  };
  
  const [formData, setFormData] = useState({
    uangHarian: 0,
    uangBBM: 0,
    bendahara: config.BENDAHARA || '',
    sekdes: config.SEKDES || '',
    kades: config.NAMA_KADES || '',
    tglBayar: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      bendahara: config.BENDAHARA || '',
      sekdes: config.SEKDES || '',
      kades: config.NAMA_KADES || '',
    }));
  }, [config]);

  const selectedSPD = spdList.find(s => {
    const sId = s.id || (s as any).ID || (s as any).spdId || (s as any).spd_id;
    return String(sId) === String(selectedSpdId);
  });
  
  const getSafeValue = (obj: any, key: string) => {
    if (!obj) return '';
    const search = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k in obj) {
       if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === search) return obj[k];
    }
    return obj[key] || '';
  };

  const totalJumlah = (formData.uangHarian || 0) + (formData.uangBBM || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSPD) return;

    setIsSubmitting(true);
    
    try {
      const newSPJ: SPJ = {
        ...formData,
        amount: totalJumlah,
        id: crypto.randomUUID(),
        spdId: selectedSPD.id!,
        nomorSPPD: selectedSPD.nomorSPPD,
        nama: selectedSPD.nama,
        nik: getSafeValue(selectedSPD, 'nik') || getSafeValue(selectedSPD, 'niap') || getSafeValue(selectedSPD, 'niapnik'),
        alamat: getSafeValue(selectedSPD, 'alamat'),
        maksud: getSafeValue(selectedSPD, 'maksud'),
        tempatTujuan: getSafeValue(selectedSPD, 'tempatTujuan'),
        jumlah: totalJumlah,
        biayaStr: formatIDRCurrency(totalJumlah),
        timestamp: new Date().toISOString(),
      };

      // Sync to Google Sheets & Generate Doc
      const response = await googleService.addSPJ(newSPJ);

      setSpjList([...spjList, newSPJ]);
      
      const docUrl = response.url || response;
      
      if (docUrl && typeof docUrl === 'string') {
        window.open(docUrl, '_blank');
        setLastSavedId(selectedSPD.nomorSPPD);
        setShowSuccess(true);
      } else {
        alert("Berhasil! SPJ tersimpan di Spreadsheet, namun link cetak tidak ditemukan.");
      }
      
      setTimeout(() => setShowSuccess(false), 8000);
      
      // Reset form
      setFormData({
        uangHarian: 0,
        uangBBM: 0,
        bendahara: config.BENDAHARA,
        sekdes: config.SEKDES,
        kades: config.NAMA_KADES,
        tglBayar: new Date().toISOString().split('T')[0],
      });
      setSelectedSpdId('');
    } catch (error) {
      console.error('Gagal sinkronisasi SPJ:', error);
      alert('Terjadi kesalahan saat menyinkronkan SPJ ke Google Spreadsheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="prestige-card p-8 rounded-[40px] bg-white shadow-2xl relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111111 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="mb-8 border-b-2 border-[#D9D9D9] pb-6 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-[#111111] rounded-[20px] border-2 border-[#D4AF37] shadow-xl">
              <Wallet className="text-[#D4AF37]" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#111111] tracking-tight not-italic leading-none">Kalkulasi Fiskal SPJ</h2>
              <p className="text-[11px] text-[#8B5E3C] font-semibold mt-1.5 not-italic">Verifikasi Pengeluaran Biaya Resmi</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          {/* Reference SPD Selection */}
          <div className="space-y-6">
             <h3 className="text-[10px] font-black font-serif uppercase tracking-[0.3em] text-[#111111] flex items-center gap-3 not-italic border-l-4 border-[#D4AF37] pl-4">
              <FileSearch size={16} className="text-[#8B5E3C]" />
              Identifikasi Dokumen Basis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-[#F5F2E9] p-6 rounded-[32px] border border-[#D9D9D9] shadow-inner">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.2em] ml-1">Seleksi Nomor SPD</label>
                <select 
                  required
                  className="w-full px-5 py-3 rounded-[18px] bg-white border border-[#D9D9D9] text-[#111111] cursor-pointer hover:border-[#D4AF37] transition-all text-xs font-black"
                  value={selectedSpdId}
                  onChange={(e) => setSelectedSpdId(e.target.value)}
                >
                  <option value="" style={{ color: '#888' }}>-- SPD TERVERIFIKASI --</option>
                  {spdList.map((s, idx) => {
                    const id = s.id || (s as any).ID || `spd-${idx}`;
                    const label = getSpdLabel(s);
                    return (
                      <option key={`opt-spd-${id}-${idx}`} value={id} style={{ color: '#111111' }}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-[8px] uppercase font-black text-[#8B5E3C] mb-1 tracking-[0.2em] not-italic">Pejabat Penerima</label>
                <p className="text-base font-black text-[#111111] not-italic uppercase tracking-tighter leading-tight truncate">{getSafeValue(selectedSPD, 'nama') || '—'}</p>
              </div>
              <div className="flex flex-col justify-center">
                <label className="text-[8px] uppercase font-black text-[#8B5E3C] mb-1 tracking-[0.2em] not-italic">Durasi Penugasan</label>
                <p className="text-base font-black text-[#111111] not-italic uppercase tracking-tighter leading-tight">{selectedSPD ? `${getSafeValue(selectedSPD, 'lamaHari')} Hari Kerja` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Biaya Calculation */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black font-serif uppercase tracking-[0.3em] text-[#111111] flex items-center gap-3 not-italic border-l-4 border-[#D4AF37] pl-4">
              <Calculator size={16} className="text-[#8B5E3C]" />
              Komponen Biaya Riil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.2em] ml-1">Uang Harian (Agrerasi)</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#D4AF37] text-[10px]">IDR</span>
                  <input 
                    required
                    type="number" 
                    className="w-full pl-16 pr-6 py-4 prestige-input rounded-[24px] font-black text-lg not-italic shadow-inner"
                    placeholder="0"
                    value={formData.uangHarian || ''}
                    onChange={(e) => setFormData({...formData, uangHarian: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.2em] ml-1">Transportasi / BBM</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#D4AF37] text-[10px]">IDR</span>
                  <input 
                    required
                    type="number" 
                    className="w-full pl-16 pr-6 py-4 prestige-input rounded-[24px] font-black text-lg not-italic shadow-inner"
                    placeholder="0"
                    value={formData.uangBBM || ''}
                    onChange={(e) => setFormData({...formData, uangBBM: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="bg-[#111111] p-6 rounded-[32px] text-white shadow-xl border-2 border-[#D4AF37] flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-all duration-1000 rotate-12">
                  <DollarSign size={80} className="text-[#D4AF37]" />
                </div>
                <label className="text-[8px] uppercase font-black text-[#D4AF37] mb-2 tracking-[0.3em] not-italic leading-none">Total Dana Cair</label>
                <div className="text-2xl font-black text-white not-italic tracking-tighter tabular-nums leading-none">
                  {formatIDRCurrency(totalJumlah)}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[7px] font-black text-[#D4AF37]/50 tracking-[0.3em] not-italic uppercase">
                  <div className="h-1.5 w-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span>Terverifikasi untuk Dicairkan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Info (Signatures) */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black font-serif uppercase tracking-[0.3em] text-[#111111] flex items-center gap-3 not-italic border-l-4 border-[#D4AF37] pl-4">
               <TrendingDown size={16} className="text-[#8B5E3C]" />
               Otoritas Pengesahan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.1em] ml-1">Bendahara Desa</label>
                <div className="w-full px-5 py-3 bg-[#F5F2E9] border border-[#D9D9D9] rounded-[18px] text-[10px] font-black text-[#111111] uppercase not-italic flex items-center truncate">
                  {formData.bendahara}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.1em] ml-1">Sekdes / PTPKD</label>
                <div className="w-full px-5 py-3 bg-[#F5F2E9] border border-[#D9D9D9] rounded-[18px] text-[10px] font-black text-[#111111] uppercase not-italic flex items-center truncate">
                  {formData.sekdes}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.1em] ml-1">Kepala Desa</label>
                <div className="w-full px-5 py-3 bg-[#F5F2E9] border border-[#D9D9D9] rounded-[18px] text-[10px] font-black text-[#111111] uppercase not-italic flex items-center truncate">
                  {formData.kades}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#111111] uppercase tracking-[0.1em] ml-1 not-italic">Tanggal Valuasi</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-5 py-3 prestige-input rounded-[18px] text-xs font-black not-italic shadow-inner"
                  value={formData.tglBayar}
                  onChange={(e) => setFormData({...formData, tglBayar: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-[#F5F2E9] flex justify-end">
             <button 
              type="submit"
              disabled={isSubmitting || !selectedSpdId}
              className={cn(
                "px-12 py-5 rounded-[24px] font-black transition-all active:scale-95 flex items-center gap-4 uppercase tracking-[0.3em] text-[10px] not-italic shadow-xl",
                isSubmitting || !selectedSpdId 
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                  : "bg-[#111111] text-[#D4AF37] border-2 border-[#D4AF37]"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                  <span>AUDIT BIAYA...</span>
                </>
              ) : (
                <>
                  <Printer size={18} />
                  <span>Selesaikan SPJ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar SPJ Terbit */}
      <div className="prestige-card rounded-[40px] overflow-hidden bg-white shadow-2xl border border-[#D9D9D9]">
        <div className="p-8 border-b-2 border-[#F5F2E9]">
           <h3 className="text-xl font-black font-serif text-[#111111] flex items-center gap-4 uppercase tracking-tighter not-italic">
            <div className="w-1.5 h-8 bg-[#D4AF37] rounded-full" />
            Catatan Audit Keuangan
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[calc(100vh-420px)] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111111] text-[#D4AF37] sticky top-0 z-20">
              <tr>
                <th className="px-8 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b border-[#D4AF37]/20 not-italic">Kode Buku Besar</th>
                <th className="px-8 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b border-[#D4AF37]/20 not-italic">Penerima</th>
                <th className="px-8 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b border-[#D4AF37]/20 not-italic">Jumlah Bersih</th>
                <th className="px-8 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b border-[#D4AF37]/20 not-italic">Tanggal Penutupan</th>
                <th className="px-8 py-4 text-[9px] uppercase tracking-[0.3em] font-black border-b border-[#D4AF37]/20 not-italic text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D9]">
              {spjList.length > 0 ? (
                spjList.map((spj, idx) => (
                  <tr key={spj.id || `spj-${idx}`} className="hover:bg-[#F5F2E9] transition-all group">
                    <td className="px-8 py-4">
                      <p className="text-[10px] font-black text-[#111111] not-italic tracking-tighter uppercase">{spj.nomorSPPD}</p>
                    </td>
                    <td className="px-8 py-4 uppercase font-black text-[#8B5E3C] text-xs not-italic tracking-tighter truncate max-w-[150px]">
                      {spj.nama}
                    </td>
                    <td className="px-8 py-4 font-black text-[#111111] text-base not-italic tabular-nums tracking-tighter">
                      {spj.biayaStr}
                    </td>
                    <td className="px-8 py-4 text-[9px] text-[#111111]/60 font-black uppercase tracking-widest not-italic leading-none">
                      {formatDateIndo(spj.tglBayar)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="w-10 h-10 bg-white border border-[#D9D9D9] text-[#111111] hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90">
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-[#8B5E3C] font-black not-italic uppercase tracking-[0.3em] bg-[#F5F2E9] text-xs">
                    Tidak ada catatan pengeluaran terdeteksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Notification Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="fixed bottom-10 right-10 z-[100] max-w-md w-full px-4 sm:px-0"
          >
            <div className="bg-[#111111] border-2 border-[#D4AF37] rounded-[32px] p-6 shadow-[0_20px_50px_rgba(212,175,55,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />
              
              <div className="flex gap-5 relative z-10">
                <div className="shrink-0 p-3 bg-[#D4AF37] rounded-2xl shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center">
                  <CheckCircle size={24} className="text-black" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[#D4AF37] font-black uppercase tracking-[0.15em] text-[10px]">Audit Keuangan Selesai</h4>
                    <button onClick={() => setShowSuccess(false)} className="text-white/30 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-white font-bold text-sm leading-tight">Data SPJ untuk <span className="text-[#D4AF37]">{lastSavedId}</span> telah resmi tersimpan di Spreadsheet.</p>
                  <p className="text-white/50 text-[10px] mt-2 font-medium tracking-wide">Pencairan dana telah diverifikasi dan dokumen dibuka.</p>
                </div>
              </div>
              
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
