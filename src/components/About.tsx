import React from 'react';
import { Mail, Globe, MapPin, CheckCircle2, Award, Zap, Camera, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  const features = [
    { icon: <CheckCircle2 className="text-white" />, title: 'Manajemen Pegawai', desc: 'Database perangkat desa terpusat.' },
    { icon: <Zap className="text-white" />, title: 'SPD Instan', desc: 'Generate dokumen SPPD otomatis.' },
    { icon: <Camera className="text-white" />, title: 'Embed Dokumentasi', desc: 'Lampirkan foto langsung ke laporan.' },
    { icon: <ShieldCheck className="text-white" />, title: 'Validasi SPJ', desc: 'Kalkulasi otomatis biaya harian.' },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      {/* Hero Section - Compact */}
      <section className="relative overflow-hidden prestige-card rounded-[40px] p-10 bg-[#111111] border-none shadow-2xl group">
        {/* Silver Batik Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c1.1 0 2 .9 2 2v26h26c1.1 0 2 .9 2 2s-.9 2-2 2H32v26c0 1.1-.9 2-2 2s-2-.9-2-2V32H2c-1.1 0-2-.9-2-2s.9-2 2-2h26V2c0-1.1.9-2 2-2zm0 30c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zM10 10c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm40 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM10 50c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm40 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23C0C0C0' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
               backgroundSize: '80px 80px'
             }} 
        />
        
        <div className="relative z-10 flex items-center gap-10 max-w-5xl mx-auto text-left">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#D4AF37] blur-[70px] opacity-30 animate-pulse" />
            <img 
              src="https://res.cloudinary.com/maswardi/image/upload/v1776699505/Gemini_Generated_Image_4t6s7p4t6s7p4t6s_fbqyxz.png" 
              alt="perjadinGO Logo" 
              className="w-32 h-32 relative rounded-[28px] shadow-2xl border-2 border-[#D4AF37]/40 p-1.5 bg-[#111111] transform group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
              <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-bold tracking-tighter text-[#D4AF37] not-italic leading-none flex items-baseline">
                perjadin<span className="text-4xl text-black select-none leading-[0.6] translate-y-2 font-black">GO</span>
                <span className="ml-8 text-white/20 text-xs tracking-[0.2em] align-middle font-semibold">VERSI 2.8</span>
              </h1>
              <div className="inline-flex">
                 <span className="px-5 py-2 bg-[#D4AF37] text-black rounded-full text-[12px] font-bold border border-white/20 flex items-center gap-3 not-italic shadow-xl hover:bg-white hover:text-black transition-all cursor-default">
                  <Award size={14} /> Tersertifikasi Unggul
                </span>
              </div>
            </div>
            <p className="text-lg text-white/80 font-semibold not-italic tracking-tight leading-snug max-w-xl">
              Sistem Tata Kelola & Penugasan Elektronik Terpadu untuk Keunggulan Administrasi Desa Profesional.
            </p>
          </div>
        </div>
        
        {/* Animated Background Details */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
      </section>

      {/* Description & Features - Side by Side and Compact */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-[#111111] leading-none tracking-tight not-italic">Konsep Administrasi & Teknologi Presisi.</h2>
          <p className="text-lg text-[#8B5E3C] leading-snug font-semibold not-italic tracking-tight">
            "perjadinGO mendefinisikan ulang protokol administrasi desa dengan teknologi cloud yang aman, terisolasi, dan sangat efisien."
          </p>
          <div className="w-16 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF3750]" />
          
          <div className="space-y-3 mt-6">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                <p className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Multi-Tenant Isolation Architecture</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#111111]"></div>
                <p className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Real-time Cloud Sync Engine</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                <p className="text-[10px] font-black text-[#111111] uppercase tracking-widest">Zero-Infrastructure Maintenance</p>
             </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="p-5 prestige-card rounded-[24px] bg-white group border border-[#D9D9D9] shadow-md hover:bg-[#F5F2E9] transition-all"
            >
              <div className="bg-[#111111] w-10 h-10 rounded-[12px] flex items-center justify-center mb-3 shadow-xl border border-[#D4AF37] group-hover:rotate-12 transition-all">
                <div className="text-[#D4AF37]">{React.cloneElement(f.icon as React.ReactElement, { size: 18, className: 'text-[#D4AF37]' })}</div>
              </div>
              <h4 className="font-bold text-[#111111] mb-1 text-sm tracking-tight not-italic">{f.title}</h4>
              <p className="text-[10px] text-[#8B5E3C] leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Panel - Compact */}
      <section className="prestige-card rounded-[32px] p-6 bg-white border border-[#111111] shadow-xl relative overflow-hidden">
        {/* Pattern backdrop */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #111111 25%, transparent 25%, transparent 75%, #111111 75%, #111111), linear-gradient(45deg, #111111 25%, transparent 25%, transparent 75%, #111111 75%, #111111)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-left">
            <h3 className="text-xl font-bold text-[#111111] tracking-tight not-italic">Dukungan Instansi</h3>
            <p className="text-[#8B5E3C] font-semibold tracking-wide text-[11px] not-italic">Konsultasi Strategis & Penanganan Teknis</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 grow max-w-3xl">
            <ContactCard 
              icon={<MapPin size={16} />} 
              label="Arsitektur Utama" 
              value="Arunika Media" 
              href="http://www.arunikakreatifmedia.my.id/"
            />
            <ContactCard 
              icon={<Globe size={16} />} 
              label="Domain Utama" 
              value="arunikakreatif.id" 
              href="http://www.arunikakreatifmedia.my.id/"
            />
            <ContactCard 
              icon={<Mail size={16} />} 
              label="Bantuan Teknis" 
              value="support@arunika.id" 
              href="mailto:arunikakreatif@gmail.com"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({ icon, label, value, href }: { icon: React.ReactNode, label: string, value: string, href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-[16px] bg-[#F5F2E9] border border-[#D9D9D9] hover:bg-[#111111] hover:border-[#D4AF37] transition-all group shadow-sm"
    >
      <div className="p-2 bg-white rounded-lg border border-[#D9D9D9] text-[#111111] group-hover:bg-[#D4AF37] transition-all shadow-sm">
        {icon}
      </div>
      <div className="truncate">
        <p className="text-[7px] uppercase font-black text-[#8B5E3C] group-hover:text-[#D4AF37] tracking-[0.2em] mb-0.5 transition-colors not-italic">{label}</p>
        <p className="font-black text-[#111111] group-hover:text-white text-[9px] uppercase tracking-tighter not-italic truncate">{value}</p>
      </div>
    </a>
  );
}

