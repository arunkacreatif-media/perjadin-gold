import React, { useState } from 'react';
import { Settings, Save, Globe, Info, Mail, MapPin, Loader2 } from 'lucide-react';
import { AppConfig } from '../types.ts';
import { googleService } from '../services/googleService.ts';

interface ConfigManagerProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export default function ConfigManager({ config, setConfig }: ConfigManagerProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof AppConfig, value: string) => {
    setConfig({ ...config, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await googleService.updateConfig(config);
      alert('Konfigurasi berhasil disimpan ke Google Sheets!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan konfigurasi ke Google Sheets.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="prestige-card p-8 rounded-[40px] bg-white shadow-2xl relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37] opacity-[0.05] rounded-bl-[80px]" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-10 pb-6 border-b-2 border-[#F5F2E9] relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-[#111111] rounded-[20px] text-[#D4AF37] border-2 border-[#D4AF37] shadow-xl">
              <Settings size={32} className="animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#111111] tracking-tight not-italic leading-none">Konfigurasi Sistem</h2>
              <p className="text-[11px] text-[#8B5E3C] font-semibold mt-1.5 not-italic">Pengaturan Parameter & Identitas Lembaga</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 bg-[#111111] text-[#D4AF37] px-8 py-4 rounded-xl font-bold shadow-lg border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111111] transition-all text-[11px] tracking-wide not-italic active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>

        <div className="space-y-10 relative z-10">
          {/* Identitas Desa */}
          <div className="space-y-6">
             <h3 className="text-[13px] font-bold font-sans tracking-wide text-[#111111]/70 flex items-center gap-3 not-italic border-l-4 border-[#8B5E3C] pl-4">
              <Globe size={16} className="text-[#D4AF37]" />
              Identitas Wilayah & Hukum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#F5F2E9]/50 p-6 rounded-[32px] border border-[#D9D9D9] shadow-inner">
              <ConfigField label="Nama Desa" value={config.NAMA_DESA} onChange={(val) => handleChange('NAMA_DESA', val)} />
              <ConfigField label="Kecamatan" value={config.KECAMATAN} onChange={(val) => handleChange('KECAMATAN', val)} />
              <ConfigField label="Kabupaten / Kota" value={config.KABUPATEN} onChange={(val) => handleChange('KABUPATEN', val)} />
            </div>
          </div>

          {/* Pejabat */}
          <div className="space-y-6 pt-8 border-t-2 border-[#F5F2E9]">
             <h3 className="text-[13px] font-bold font-sans tracking-wide text-[#111111]/70 flex items-center gap-3 not-italic border-l-4 border-[#8B5E3C] pl-4">
              <Info size={16} className="text-[#D4AF37]" />
              Pejabat Penandatangan Sah
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#F5F2E9]/50 p-6 rounded-[32px] border border-[#D9D9D9] shadow-inner">
              <ConfigField label="Kepala Desa (Kades)" value={config.NAMA_KADES} onChange={(val) => handleChange('NAMA_KADES', val)} />
              <ConfigField label="Sekretaris Desa (Sekdes)" value={config.SEKDES} onChange={(val) => handleChange('SEKDES', val)} />
              <ConfigField label="Bendahara Desa" value={config.BENDAHARA} onChange={(val) => handleChange('BENDAHARA', val)} />
            </div>
          </div>

          {/* Anggaran */}
          <div className="space-y-6 pt-8 border-t-2 border-[#F5F2E9]">
             <h3 className="text-[13px] font-bold font-sans tracking-wide text-[#111111]/70 flex items-center gap-3 not-italic border-l-4 border-[#8B5E3C] pl-4">
              <Settings size={16} className="text-[#D4AF37]" />
              Periode Anggaran & Kode Struktur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F5F2E9]/50 p-6 rounded-[32px] border border-[#D9D9D9] shadow-inner">
              <ConfigField label="Tahun Anggaran Berjalan" value={config.TAHUN_ANGGARAN} onChange={(val) => handleChange('TAHUN_ANGGARAN', val)} />
              <ConfigField label="Kode Anggaran Utama" value={config.KODE_ANGGARAN} onChange={(val) => handleChange('KODE_ANGGARAN', val)} />
            </div>
          </div>

          {/* Kontak */}
          <div className="space-y-6 pt-8 border-t-2 border-[#F5F2E9]">
             <h3 className="text-[13px] font-bold font-sans tracking-wide text-[#111111]/70 flex items-center gap-3 not-italic border-l-4 border-[#8B5E3C] pl-4">
              <MapPin size={16} className="text-[#D4AF37]" />
               Kantor Pusat & Kanal Resmi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-[#F5F2E9]/50 p-6 rounded-[32px] border border-[#D9D9D9] shadow-inner">
              <div className="md:col-span-2 lg:col-span-2 space-y-3">
                <label className="text-[11px] font-bold text-[#8B5E3C] ml-1">Alamat Kantor Resmi</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-[20px] prestige-input focus:bg-white transition-all outline-none text-sm font-semibold not-italic shadow-inner"
                  rows={2}
                  value={config.ALAMAT_KANTOR}
                  onChange={(e) => handleChange('ALAMAT_KANTOR', e.target.value)}
                />
              </div>
              <ConfigField label="Email Dukungan" value={config.EMAIL_KANTOR} onChange={(val) => handleChange('EMAIL_KANTOR', (val || '').toLowerCase())} type="email" />
              <ConfigField label="Domain Website" value={config.WEB_KANTOR} onChange={(val) => handleChange('WEB_KANTOR', (val || '').toLowerCase())} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigField({ label, value, onChange, type = 'text' }: { label: string, value: string, onChange: (val: string) => void, type?: string }) {
  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-[#8B5E3C] uppercase tracking-[0.1em] ml-1">{label}</label>
      <input 
        type={type} 
        className="w-full px-6 py-4 prestige-input rounded-[20px] text-sm font-bold not-italic focus:bg-white transition-all outline-none shadow-inner"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

