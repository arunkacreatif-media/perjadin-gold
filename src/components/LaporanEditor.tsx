import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Image as ImageIcon, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Sparkles,
  Printer, 
  CheckCircle2,
  FileSearch,
  Camera,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { googleService } from '../services/googleService.ts';
import { GoogleGenAI, Type } from "@google/genai";
import { cn, formatDateIndo } from '../lib/utils.ts';
import { SPD, Laporan, AppConfig } from '../types.ts';

interface LaporanEditorProps {
  spdList: SPD[];
  laporanList: Laporan[];
  setLaporanList: (data: Laporan[]) => void;
  config: AppConfig;
}

export default function LaporanEditor({ spdList, laporanList, setLaporanList, config }: LaporanEditorProps) {
  const [selectedSpdId, setSelectedSpdId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedId, setLastSavedId] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState<Partial<Laporan>>({
    laporan1: '',
    laporan2: '',
    laporan3: '',
    caption: '',
  });

  const selectedSPD = spdList.find(s => {
    const sId = s.id || (s as any).ID || (s as any).spdId || (s as any).spd_id;
    return String(sId) === String(selectedSpdId);
  });

  const getSafeValue = (obj: any, key: string) => {
    if (!obj) return '';
    const search = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Prioritas 1: Exact normalized match
    for (const k in obj) {
       if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === search) return obj[k];
    }
    // Prioritas 2: Partial match (e.g. 'maksud' matches 'maksud_perjalanan')
    for (const k in obj) {
       if (k.toLowerCase().includes(search)) return obj[k];
    }
    return obj[key] || '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than 1200px
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use JPEG with 0.7 compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCurrentImage(dataUrl);
        setRotation(0);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const rotateImage = (dir: 'left' | 'right') => {
    setRotation(prev => (prev + (dir === 'left' ? -90 : 90)) % 360);
  };

  const removeImage = () => {
    setCurrentImage(null);
    setRotation(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAISummarize = async () => {
    if (!formData.laporan1 && !formData.laporan2 && !formData.laporan3) {
      alert("Silakan isi catatan singkat atau draf di salah satu kotak agar AI dapat mengolahnya.");
      return;
    }

    setIsSummarizing(true);
    try {
      const prompt = `
        Tugas: Susun laporan perjalanan dinas yang terstruktur dan profesional.
        Konteks: Administrasi Pemerintahan/Desa.
        
        Substansi Tugas: ${getSafeValue(selectedSPD, 'maksud')}
        Lokasi Tujuan: ${getSafeValue(selectedSPD, 'tempatTujuan')}
        
        Catatan Mentah / Input:
        - Kotak 1: ${formData.laporan1}
        - Kotak 2: ${formData.laporan2}
        - Kotak 3: ${formData.laporan3}
        
        Instruksi Struktur (Output JSON):
        1. "inti": Narasi ringkasan utama hasil kegiatan (formal, 1-2 kalimat).
        2. "pendukung1": Detail teknis perjumpaan/kegiatan pertama (poin penting).
        3. "pendukung2": Detail teknis perjumpaan/kegiatan kedua atau tindak lanjut.
        
        Ketentuan:
        - Gunakan Bahasa Indonesia Baku.
        - Jika input hanya ada di satu kotak, kembangkan menjadi 3 bagian tersebut secara cerdas berdasarkan konteks tujuan perjalanan.
        - Hindari kata-kata santai.
      `;

      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              inti: { type: Type.STRING },
              pendukung1: { type: Type.STRING },
              pendukung2: { type: Type.STRING }
            },
            required: ["inti", "pendukung1", "pendukung2"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result) {
        setFormData(prev => ({ 
          ...prev, 
          laporan1: result.inti || '', 
          laporan2: result.pendukung1 || '', 
          laporan3: result.pendukung2 || '' 
        }));
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      alert(`Gagal mengolah data: ${err.message}. Pastikan input sudah terisi.`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSPD || !currentImage || !selectedFile) {
      alert("Mohon lengkapi data SPD dan foto dokumentasi.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Upload ke Google Drive
      let driveResponse = { webViewLink: '' };
      try {
        driveResponse = await googleService.uploadImage(selectedFile);
      } catch (uploadErr) {
        console.warn('Upload G-Drive gagal, menggunakan base64:', uploadErr);
      }
      
      const newLaporan: Laporan = {
        ...formData as Laporan,
        id: crypto.randomUUID(),
        spdId: selectedSPD.id!,
        nomorSPPD: selectedSPD.nomorSPPD,
        nama: getSafeValue(selectedSPD, 'nama'),
        nik: getSafeValue(selectedSPD, 'nik') || getSafeValue(selectedSPD, 'niap') || getSafeValue(selectedSPD, 'niapnik'),
        alamat: getSafeValue(selectedSPD, 'alamat'),
        maksud: getSafeValue(selectedSPD, 'maksud'),
        tempatTujuan: getSafeValue(selectedSPD, 'tempatTujuan'),
        tglBerangkat: getSafeValue(selectedSPD, 'tglBerangkat'),
        tglKembali: getSafeValue(selectedSPD, 'tglKembali'),
        tglBuat: new Date().toISOString(),
        isiRingkas: (formData.laporan1 || '').substring(0, 100) + '...',
        imageData: driveResponse.webViewLink || 'pending', // Link Drive atau placeholder
        base64Image: currentImage, // Data asli untuk Google Doc
        timestamp: new Date().toISOString(),
      };

      // 2. Add to Sheets and Generate Doc
      const docResponse = await googleService.addLaporan(newLaporan);

      setLaporanList([...laporanList, newLaporan]);
      setIsSubmitting(false);
      
      const docUrl = docResponse.url || docResponse;
      
      if (docUrl && typeof docUrl === 'string') {
        window.open(docUrl, '_blank');
        setLastSavedId(selectedSPD.nomorSPPD);
        setShowSuccess(true);
      } else {
        alert("Berhasil! Laporan tersimpan di Spreadsheet, namun link cetak tidak ditemukan.");
      }
      
      setTimeout(() => setShowSuccess(false), 8000);
      
      // Reset form
      setFormData({ laporan1: '', laporan2: '', laporan3: '', caption: '' });
      setSelectedFile(null);
      setCurrentImage(null);
      setRotation(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedSpdId('');
    } catch (error) {
      console.error('Gagal sinkronisasi Laporan:', error);
      alert('Gagal mengunggah laporan ke Google Workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="prestige-card p-6 rounded-[32px] bg-white shadow-xl relative overflow-hidden">
        {/* Artistic accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-[0.03] blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="mb-6 border-b border-[#F5F2E9] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#111111] rounded-[16px] border-2 border-[#D4AF37] shadow-lg">
              <ClipboardList className="text-[#D4AF37]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-[#111111] tracking-tight not-italic leading-none">Laporan Akuntabilitas Perjalanan</h2>
              <p className="text-[10px] text-[#8B5E3C] font-semibold mt-1 not-italic">Protokol Transparansi & Verifikasi Data</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reference SPD Selection - more compact */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F5F2E9] p-2.5 rounded-[24px] border border-[#D9D9D9]">
            <div className="lg:col-span-4 space-y-1 p-2">
              <label className="text-[8px] font-black text-[#8B5E3C] uppercase tracking-[0.2em] ml-1">Pilih Record SPD</label>
              <div className="relative">
                <select 
                  required
                  className="w-full px-4 py-2.5 rounded-[14px] bg-white border border-[#D9D9D9] text-[#111111] cursor-pointer hover:border-[#D4AF37] transition-all text-[11px] font-black uppercase"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B5E3C]">
                  <Search size={12} />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center border-l border-[#D9D9D9] pl-6 py-2">
              <label className="text-[7px] uppercase font-black text-[#8B5E3C] mb-0.5 tracking-[0.2em] not-italic">Substansi Tugas</label>
              <p className="text-sm font-black text-[#111111] not-italic tracking-tighter uppercase leading-tight truncate">{getSafeValue(selectedSPD, 'maksud') || '—'}</p>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center border-l border-[#D9D9D9] pl-6 py-2">
              <label className="text-[7px] uppercase font-black text-[#8B5E3C] mb-0.5 tracking-[0.2em] not-italic">Pejabat Pelaksana</label>
              <p className="text-sm font-black text-[#D4AF37] not-italic tracking-tighter uppercase">{selectedSPD ? getSafeValue(selectedSPD, 'nama') : '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Content Editor - took more space */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-black font-serif uppercase tracking-[0.3em] text-[#111111] flex items-center gap-2 not-italic border-l-3 border-[#8B5E3C] pl-3">
                  <ClipboardList size={14} className="text-[#D4AF37]" />
                  Deskripsi Hasil
                </h3>
                <button 
                  type="button"
                  onClick={handleAISummarize}
                  disabled={isSummarizing || !selectedSpdId}
                  className="flex items-center gap-2 text-[8px] font-black bg-[#111111] text-[#D4AF37] px-4 py-1.5 rounded-lg hover:shadow-md disabled:opacity-30 border border-[#D4AF37]/30 uppercase tracking-[0.2em]"
                >
                  {isSummarizing ? (
                    <><div className="h-2.5 w-2.5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" /> ...</>
                  ) : <><Sparkles size={12} /> RANGKUM AI</>}
                </button>
              </div>
              <div className="space-y-4">
                <textarea 
                  required
                  rows={2}
                  className="w-full px-5 py-4 rounded-[20px] prestige-input focus:bg-white outline-none transition-all text-xs font-black not-italic shadow-inner placeholder:text-slate-300"
                  placeholder="JUDUL / INTI LAPORAN..."
                  value={formData.laporan1}
                  onChange={(e) => setFormData({...formData, laporan1: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <textarea 
                    rows={2}
                    className="w-full px-5 py-3 rounded-[16px] prestige-input focus:bg-white outline-none transition-all text-[10px] font-black not-italic shadow-inner placeholder:text-slate-300"
                    placeholder="DATA PENDUKUNG 1..."
                    value={formData.laporan2}
                    onChange={(e) => setFormData({...formData, laporan2: e.target.value})}
                  />
                  <textarea 
                    rows={2}
                    className="w-full px-5 py-3 rounded-[16px] prestige-input focus:bg-white outline-none transition-all text-[10px] font-black not-italic shadow-inner placeholder:text-slate-300"
                    placeholder="DATA PENDUKUNG 2..."
                    value={formData.laporan3}
                    onChange={(e) => setFormData({...formData, laporan3: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Photo Section - more compact */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-[9px] font-black font-serif uppercase tracking-[0.3em] text-[#111111] flex items-center gap-2 not-italic border-l-3 border-[#8B5E3C] pl-3">
                <Camera size={14} className="text-[#D4AF37]" />
                Bukti Visual
              </h3>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative h-32 border-2 border-dashed border-[#D9D9D9] rounded-[24px] flex flex-col items-center justify-center bg-[#F5F2E9] cursor-pointer hover:bg-white hover:border-[#D4AF37] transition-all overflow-hidden shadow-inner"
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="p-3 bg-[#111111] rounded-[14px] text-[#D4AF37] group-hover:scale-110 transition-all border border-[#D4AF37]/20 shadow-lg">
                      <ImageIcon size={20} />
                    </div>
                    <p className="mt-2 font-black text-[7px] text-[#111111] uppercase tracking-[0.1em] not-italic">Unggah Foto</p>
                  </div>
                  <input 
                    type="text" 
                    placeholder="KETERANGAN GAMBAR..."
                    className="w-full px-4 py-2 prestige-input rounded-xl text-[10px] font-black not-italic shadow-sm placeholder:text-slate-300"
                    value={formData.caption}
                    onChange={(e) => setFormData({...formData, caption: e.target.value})}
                  />
                </div>

                <div className="h-32">
                  <AnimatePresence mode="wait">
                    {currentImage ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full bg-[#111111] rounded-[24px] p-3 flex flex-col items-center justify-center shadow-lg border border-[#D4AF37]/20"
                      >
                        <div className="relative group overflow-hidden rounded-lg border border-[#D4AF37]/50 h-16 w-full flex items-center justify-center">
                          <img 
                            src={currentImage} 
                            alt="Preview" 
                            className="max-h-full object-contain"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          />
                        </div>
                        
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => rotateImage('left')} className="p-1.5 bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#111111] rounded-md transition-all">
                            <RotateCcw size={12} />
                          </button>
                          <button type="button" onClick={() => rotateImage('right')} className="p-1.5 bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#111111] rounded-md transition-all">
                            <RotateCw size={12} />
                          </button>
                          <button type="button" onClick={removeImage} className="p-1.5 bg-white/10 hover:bg-[#8B5E3C] text-white rounded-md transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full rounded-[24px] bg-[#F5F2E9] border-2 border-dashed border-[#D9D9D9] flex flex-col items-center justify-center gap-2 opacity-50">
                        <ImageIcon size={32} className="text-[#8B5E3C]" />
                        <p className="text-[#8B5E3C] font-black uppercase tracking-[0.2em] text-[7px] not-italic">Siap</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F5F2E9] flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting || !selectedSpdId || !currentImage}
              className={cn(
                "px-8 py-3.5 rounded-[20px] font-black inline-flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg uppercase tracking-[0.2em] text-[10px] not-italic",
                isSubmitting || !selectedSpdId || !currentImage 
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                  : "bg-[#111111] text-[#D4AF37] border-2 border-[#D4AF37]"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                  <span>MENERBITKAN...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>Selesaikan Laporan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Laporan - narrower cards */}
      <div className="space-y-4 px-1">
        <div className="flex items-center justify-between border-b border-[#D4AF37] pb-2">
          <h3 className="text-base font-black font-serif text-[#111111] flex items-center gap-3 uppercase tracking-tighter not-italic">
            <div className="w-1 h-6 bg-[#111111] rounded-full" />
            Arsip Laporan Terbit
          </h3>
          <span className="text-[7px] font-black text-[#8B5E3C] uppercase tracking-[0.2em] not-italic bg-[#F5F2E9] px-3 py-1 rounded-full border border-[#D9D9D9]">Riwayat</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {laporanList.slice().reverse().map((lap, idx) => (
            <motion.div 
              key={lap.id || `lap-${idx}`} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="prestige-card p-4 rounded-[24px] bg-white flex flex-col group hover:shadow-lg transition-all border border-[#D9D9D9] border-b-2 border-b-[#111111] hover:border-[#D4AF37]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-[#111111] rounded-lg text-[#D4AF37] border border-[#D4AF37]/30 shadow-md group-hover:rotate-3 transition-all">
                  <ClipboardList size={14} />
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-[#111111] uppercase tracking-tighter">
                    {formatDateIndo(lap.tglBuat)}
                  </p>
                </div>
              </div>
              
              <h4 className="font-black text-[#111111] text-sm mb-0.5 group-hover:text-[#D4AF37] transition-all uppercase tracking-tighter not-italic truncate leading-none">{lap.nama}</h4>
              <p className="text-[8px] font-black text-[#8B5E3C] uppercase tracking-[0.1em] mb-3 not-italic">{lap.nomorSPPD}</p>
              
              {lap.imageData && (
                <div className="aspect-video rounded-[14px] overflow-hidden mb-3 bg-[#F5F2E9] border border-[#D9D9D9] transition-all">
                  <img src={lap.imageData} alt="Dokumentasi" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0" />
                </div>
              )}
              
              <p className="text-[10px] text-slate-500 font-bold leading-tight not-italic line-clamp-2 pl-2 border-l border-[#D4AF37]/30 group-hover:text-[#111111] transition-colors mb-4">
                {lap.laporan1}
              </p>
              
              <button className="mt-auto flex items-center justify-center gap-2 py-2.5 bg-[#111111] text-[#D4AF37] rounded-xl text-[8px] font-black hover:bg-[#D4AF37] hover:text-[#111111] transition-all uppercase tracking-[0.1em] not-italic border border-[#D4AF37]/30">
                <Printer size={12} /> Lihat Dokumen
              </button>
            </motion.div>
          ))}
          {laporanList.length === 0 && (
            <div className="col-span-full py-12 text-center text-[#8B5E3C] font-black not-italic uppercase tracking-[0.3em] bg-[#F5F2E9] rounded-[24px] border-2 border-dashed border-[#D9D9D9] opacity-50 text-[10px]">
              Arsip Operasional Kosong.
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
                    <h4 className="text-[#D4AF37] font-black uppercase tracking-[0.15em] text-[10px]">Laporan Terdaftar</h4>
                    <button onClick={() => setShowSuccess(false)} className="text-white/30 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-white font-bold text-sm leading-tight">Dokumentasi <span className="text-[#D4AF37]">{lastSavedId}</span> telah resmi tersimpan di Spreadsheet.</p>
                  <p className="text-white/50 text-[10px] mt-2 font-medium tracking-wide">Laporan tercetak telah di-generate dan dibuka di tab baru.</p>
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
