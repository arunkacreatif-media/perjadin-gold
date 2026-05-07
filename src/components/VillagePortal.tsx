import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ShieldCheck, ArrowRight, Building2, Globe, Server } from 'lucide-react';

interface VillagePortalProps {
  onVerify: (villageData: any) => void;
}

export const VillagePortal: React.FC<VillagePortalProps> = ({ onVerify }) => {
  const [villageId, setVillageId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenant/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villageId: villageId.toUpperCase() }),
      });

      const text = await response.text();
      let result;
      
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Respon server bukan JSON. Teks respon: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.error || `Server error (${response.status}): ${text.substring(0, 50)}`);
      }

      onVerify(result.village);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F2E9] relative overflow-hidden p-6 font-sans">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#8B5E3C 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#111111] via-[#D4AF37] to-[#111111]"></div>
      
      <div className="max-w-md w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-4 bg-[#111111] rounded-[24px] border-2 border-[#D4AF37] shadow-2xl mb-6 group transition-transform hover:scale-105">
            <img 
              src="https://res.cloudinary.com/maswardi/image/upload/v1776699505/Gemini_Generated_Image_4t6s7p4t6s7p4t6s_fbqyxz.png" 
              alt="perjadinGO Logo" 
              className="h-12 w-12 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-4xl font-black font-serif tracking-tighter text-[#111111] leading-none mb-2">
            perjadin<span className="text-[#D4AF37]">GO</span>
          </h1>
          <p className="text-[10px] tracking-[0.4em] text-[#8B5E3C] uppercase font-bold">Portal Administrasi Desa Terpusat</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#D9D9D9] rounded-[32px] p-10 shadow-2xl relative overflow-hidden group"
        >
          {/* Subtle Corner Decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-700"></div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#111111] mb-2 font-serif uppercase tracking-tight">Verifikasi Akses</h2>
              <p className="text-xs text-[#8B5E3C] font-medium leading-relaxed">Masukkan Kode Identifikasi Desa Anda untuk masuk ke sistem tata kelola spesifik wilayah.</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-[9px] uppercase font-black tracking-widest text-[#111111] mb-2.5">
                  ID Desa / Lisensi Produk
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5E3C]/40 group-focus-within:text-[#D4AF37] transition-colors">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="text"
                    value={villageId}
                    onChange={(e) => setVillageId(e.target.value)}
                    placeholder="Contoh: PONCOL01"
                    className="w-full pl-12 pr-4 py-4 bg-[#F5F2E9] border-2 border-[#D9D9D9] focus:border-[#D4AF37] rounded-2xl outline-none transition-all placeholder:text-[#8B5E3C]/30 text-sm font-bold tracking-widest uppercase text-[#111111]"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
                >
                  <div className="w-1 h-8 bg-red-500 rounded-full shrink-0"></div>
                  <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-tight">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111111] text-[#D4AF37] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#111111]/10 hover:bg-black transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
                ) : (
                  <>
                    Validasi Sistem
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#D9D9D9]">
              <ShieldCheck size={14} className="text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-[#111111] uppercase tracking-tighter">Enkripsi Enterprise</span>
              <span className="text-[7px] text-[#8B5E3C] uppercase font-bold">Data Multi-Tenant Terisolasi</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-[#111111]/40 uppercase tracking-tighter">Server Region</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-[#111111] uppercase">IDN-JKT</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <p className="absolute bottom-[-100px] left-0 w-full text-center text-[9px] text-[#8B5E3C]/40 uppercase tracking-[0.3em] font-black">
          &copy; 2026 Arunika Kreatif Media - Digital Governance Solutions
        </p>
      </div>
    </div>
  );
};
