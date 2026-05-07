import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Wallet, 
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { AppConfig } from '../types.ts';

interface DashboardProps {
  pegawaiCount: number;
  spdCount: number;
  laporanCount: number;
  spjCount: number;
  config: AppConfig;
  onNavigate: (id: string) => void;
}

export default function Dashboard({ 
  pegawaiCount, 
  spdCount, 
  laporanCount, 
  spjCount, 
  config,
  onNavigate 
}: DashboardProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    }) + ' WIB';
  };

  const stats = [
    { label: 'Total Pegawai', value: pegawaiCount, icon: Users, color: '#111111', sub: 'Terdaftar aktif', link: 'pegawai' },
    { label: 'Total SPD', value: spdCount, icon: FileText, color: '#D4AF37', sub: 'Surat Terbit', link: 'spd' },
    { label: 'Total Laporan', value: laporanCount, icon: ClipboardList, color: '#8B5E3C', sub: 'Dokumen Selesai', link: 'laporan' },
    { label: 'Total SPJ', value: spjCount, icon: Wallet, color: '#111111', sub: 'Verifikasi Biaya', link: 'spj' },
  ];

  return (
    <div className="space-y-6">
      {/* Date Time Hero */}
      <section className="relative overflow-hidden prestige-card rounded-[32px] p-6 text-[#111111] shadow-2xl bg-white">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111111 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#111111] rounded-[24px] border-2 border-[#D4AF37] shadow-xl transform -rotate-2">
              <CalendarIcon size={40} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif tracking-tight mb-1 leading-none" id="dashboard-date">
                {formatDate(time)}
              </h2>
              <div className="flex items-center gap-2 text-lg text-[#8B5E3C] font-semibold">
                <Clock size={18} className="text-[#D4AF37]" />
                <span className="tracking-tight">{formatTime(time)}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#111111] px-6 py-3 rounded-xl border border-[#D4AF37]/30 flex flex-col items-end gap-0.5 shadow-2xl">
            <span className="text-[8px] text-[#D4AF37] font-black uppercase tracking-[0.4em]">Status Sistem</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
              <span className="text-[10px] font-black text-white tracking-widest uppercase not-italic">Operasional</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="prestige-card rounded-[32px] p-8 bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 border-b border-[#D9D9D9] pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-[#D4AF37] rounded-full" />
            <div className="flex flex-col">
              <h3 className="text-lg font-bold font-serif text-[#111111] tracking-tight">Indikator Kinerja Desa</h3>
              <p className="text-[10px] text-[#8B5E3C] font-semibold mt-1">Ikhtisar Manajemen Tahun {config.TAHUN_ANGGARAN}</p>
            </div>
          </div>
          <p className="text-[10px] text-[#111111] font-black not-italic bg-[#F5F2E9] px-3 py-1.5 rounded-lg border border-[#D9D9D9]">Pemerintah Desa {config.NAMA_DESA}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onNavigate(stat.link)}
              className="group flex flex-col gap-4 p-5 rounded-[24px] bg-[#F5F2E9] border border-[#D9D9D9] hover:bg-white hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all text-left relative overflow-hidden active:scale-95"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:bg-[#111111] group-hover:rotate-6 bg-white border border-[#D9D9D9] shadow-inner"
                  style={{ color: stat.color }}
                >
                  <stat.icon size={20} className="group-hover:text-[#D4AF37] transition-colors" />
                </div>
                <ChevronRight className="text-[#8B5E3C] group-hover:text-[#111111] transition-all" size={16} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-[#8B5E3C] mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-[#111111] tabular-nums tracking-tighter">{stat.value}</p>
                <p className="text-[9px] tracking-wide text-[#111111]/60 font-semibold mt-1 bg-black/5 inline-block px-2 py-0.5 rounded">{stat.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#D9D9D9]">
          {[
            { icon: '📅', label: 'Tahun Anggaran', value: config.TAHUN_ANGGARAN },
            { icon: '🏛️', label: 'Lembaga Desa', value: `Pemdes ${config.NAMA_DESA}` },
            { icon: '⚖️', label: 'E-Governance', value: 'Terverifikasi', color: '#8B5E3C' },
          ].map((item) => (
            <div key={item.label} className="bg-white px-5 py-4 rounded-xl flex items-center gap-4 border border-[#D9D9D9] hover:bg-[#F5F2E9] transition-all">
              <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
              <div>
                <p className="text-[8px] uppercase text-[#8B5E3C] font-black tracking-[0.25em] mb-0.5">{item.label}</p>
                <p className="text-sm font-black text-[#111111] not-italic" style={{ color: item.color }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        <section className="prestige-card rounded-[32px] p-8 bg-white">
          <h4 className="text-lg font-black font-serif text-[#111111] mb-6 flex items-center gap-3 uppercase tracking-tighter">
            <div className="p-1.5 bg-[#D4AF37] rounded-lg shadow-lg">
              <Plus size={20} className="text-[#111111]" />
            </div>
            Operasi Cepat
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('spd')}
              className="p-5 rounded-[24px] bg-[#F5F2E9] border border-[#D9D9D9] hover:bg-white hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all text-center group active:scale-95"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center border border-[#D9D9D9] text-[#111111] group-hover:bg-[#111111] group-hover:text-[#D4AF37] transition-all">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Registrasi SPD</span>
            </button>
            <button 
              onClick={() => onNavigate('pegawai')}
              className="p-5 rounded-[24px] bg-[#F5F2E9] border border-[#D9D9D9] hover:bg-white hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all text-center group active:scale-95"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center border border-[#D9D9D9] text-[#111111] group-hover:bg-[#111111] group-hover:text-[#D4AF37] transition-all">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Input Pegawai</span>
            </button>
          </div>
        </section>

        <section className="prestige-card rounded-[32px] p-5 relative overflow-hidden bg-white">
          {/* Subtle background decoration */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl" />
          
          <h4 className="text-sm font-black font-serif text-[#111111] mb-2.5 flex items-center gap-2 tracking-tight uppercase">
            <div className="p-1 px-1.5 bg-[#F5F2E9] border border-[#D4AF37]/30 rounded-md">
              <span className="text-[8px] text-[#8B5E3C] uppercase tracking-widest font-black">INF</span>
            </div>
            Data Struktural
          </h4>
          
          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between items-center py-1.5 border-b border-[#D9D9D9]/50 group hover:bg-[#F5F2E9]/50 transition-all px-1 rounded-sm">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#8B5E3C] font-black uppercase tracking-widest leading-none mb-1">Kepala Desa (Kades)</span>
                <span className="text-[14px] font-black text-[#111111] not-italic tracking-tight leading-none">{config.NAMA_KADES}</span>
              </div>
              <TrendingUp size={12} className="text-[#D4AF37]" />
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-[#D9D9D9]/50 group hover:bg-[#F5F2E9]/50 transition-all px-1 rounded-sm">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#8B5E3C] font-black uppercase tracking-widest leading-none mb-1">Sekretaris Desa (Sekdes)</span>
                <span className="text-[14px] font-black text-[#111111] not-italic tracking-tight leading-none">{config.SEKDES}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-[#D9D9D9]/50 group hover:bg-[#F5F2E9]/50 transition-all px-1 rounded-sm">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#8B5E3C] font-black uppercase tracking-widest leading-none mb-1">Bendahara Desa</span>
                <span className="text-[14px] font-black text-[#111111] not-italic tracking-tight leading-none">{config.BENDAHARA}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 group hover:bg-[#F5F2E9]/50 transition-all px-1 rounded-sm">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#8B5E3C] font-black uppercase tracking-widest leading-none mb-1">Wilayah Administrasi</span>
                <span className="text-[12px] font-black text-[#D4AF37] not-italic tracking-tight uppercase leading-none">Kec. {config.KECAMATAN}, {config.KABUPATEN}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2.5 bg-[#F5F2E9] border border-[#D9D9D9] rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[6px] text-[#8B5E3C] font-black uppercase tracking-widest">Platform Terverifikasi</span>
              <span className="text-[8px] text-[#111111]/60 font-black uppercase tracking-tight">Data Cloud {config.NAMA_DESA} Aman</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1 w-1 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
