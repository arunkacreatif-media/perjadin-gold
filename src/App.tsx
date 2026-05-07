/**
 * perjadinGO - Main Application Wrapper
 */
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Wallet, 
  Settings, 
  Info, 
  Home, 
  Menu, 
  X,
  Bell,
  Search,
  Plus,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.ts';
import Dashboard from './components/Dashboard.tsx';
import PegawaiManager from './components/PegawaiManager.tsx';
import SPDGenerator from './components/SPDGenerator.tsx';
import LaporanEditor from './components/LaporanEditor.tsx';
import SPJGenerator from './components/SPJGenerator.tsx';
import ConfigManager from './components/ConfigManager.tsx';
import About from './components/About.tsx';
import { VillagePortal } from './components/VillagePortal.tsx';
import { Pegawai, SPD, Laporan, SPJ, AppConfig } from './types.ts';
import { DEFAULT_CONFIG } from './constants.ts';
import { googleService } from './services/googleService.ts';

type ViewId = 'dashboard' | 'pegawai' | 'spd' | 'laporan' | 'spj' | 'konfigurasi' | 'about';

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [spdList, setSpdList] = useState<SPD[]>([]);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [spjList, setSpjList] = useState<SPJ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVillage, setCurrentVillage] = useState<any>(null);

  // Initial Load from LocalStorage & Sync with Google Sheets
  useEffect(() => {
    const savedVillage = localStorage.getItem('perjadin_village');
    if (savedVillage) {
      setCurrentVillage(JSON.parse(savedVillage));
    }
  }, []);

  useEffect(() => {
    if (!currentVillage) return;
    
    const savedConfig = localStorage.getItem('perjadin_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));

    const syncData = async () => {
      setIsLoading(true);
      try {
        // 1. Get Dashboard Stats (Includes remote counts & global config)
        const stats = await googleService.getDashboardStats();
        if (stats && !stats.error) {
          // Update config from remote if available (Support both raw uppercase and camelCase from bridge)
          const remoteConfig = {
            ...config,
            NAMA_DESA: stats.NAMA_DESA || stats.namaDesa || config.NAMA_DESA,
            NAMA_KADES: stats.NAMA_KADES || stats.namaKades || stats.kades || config.NAMA_KADES,
            SEKDES: stats.SEKDES || stats.sekdes || config.SEKDES,
            BENDAHARA: stats.BENDAHARA || stats.bendahara || config.BENDAHARA,
            KECAMATAN: stats.KECAMATAN || stats.kecamatan || config.KECAMATAN,
            KABUPATEN: stats.KABUPATEN || stats.kabupaten || config.KABUPATEN,
            TAHUN_ANGGARAN: stats.TAHUN_ANGGARAN || stats.tahunAnggaran || config.TAHUN_ANGGARAN,
            ALAMAT_KANTOR: stats.ALAMAT_KANTOR || stats.alamatKantor || config.ALAMAT_KANTOR,
            EMAIL_KANTOR: stats.EMAIL_KANTOR || stats.emailKantor || config.EMAIL_KANTOR,
            WEB_KANTOR: stats.WEB_KANTOR || stats.webKantor || config.WEB_KANTOR,
            KODEPOS_KANTOR: stats.KODEPOS_KANTOR || stats.kodeposKantor || config.KODEPOS_KANTOR,
            KODE_ANGGARAN: stats.KODE_ANGGARAN || stats.kodeAnggaran || config.KODE_ANGGARAN
          };
          setConfig(remoteConfig);
          localStorage.setItem('perjadin_config', JSON.stringify(remoteConfig));
        }

        // 1.5. Full Config Sync (Detailed - ensure it merges properly)
        try {
          const remoteFullConfig = await googleService.getConfig();
          if (remoteFullConfig && !remoteFullConfig.error) {
            // If it's a bridge result, it might be an object
            // If it's a raw sheet result, it might need parsing, but bridge functions usually return objects
            setConfig(prev => ({ 
              ...prev, 
              ...remoteFullConfig,
              // Fallback map if keys are different
              NAMA_KADES: remoteFullConfig.NAMA_KADES || remoteFullConfig.namaKades || prev.NAMA_KADES,
              SEKDES: remoteFullConfig.SEKDES || remoteFullConfig.sekdes || prev.SEKDES,
              BENDAHARA: remoteFullConfig.BENDAHARA || remoteFullConfig.bendahara || prev.BENDAHARA
            }));
          }
        } catch (confErr) {
          console.warn('Gagal sync config detail:', confErr);
        }

        // 2. Sync Pegawai
        const remotePegawai = await googleService.getPegawai();
        if (remotePegawai && remotePegawai.length > 0) {
          setPegawai(remotePegawai);
          localStorage.setItem('perjadin_pegawai', JSON.stringify(remotePegawai));
        } else {
          loadLocalPegawai();
        }

        // Sync SPD
        const remoteSPD = await googleService.getSPD();
        if (remoteSPD) setSpdList(remoteSPD);

        // Sync SPJ
        const remoteSPJ = await googleService.getSPJ();
        if (remoteSPJ) setSpjList(remoteSPJ);

        // Sync Laporan
        const remoteLaporan = await googleService.getLaporan();
        if (remoteLaporan) setLaporanList(remoteLaporan);

      } catch (error) {
        console.warn('Sync Google Workspace gagal, menggunakan data lokal:', error);
        loadLocalPegawai();
        loadLocalOtherData();
      } finally {
        setIsLoading(false);
      }
    };

    const loadLocalPegawai = () => {
      const savedPegawai = localStorage.getItem('perjadin_pegawai');
      if (savedPegawai) {
        setPegawai(JSON.parse(savedPegawai));
      } else {
        const initialPegawai: Pegawai[] = [
          { id: '1', nama: 'Budi Santoso', nik: '198001012010011001', jabatan: 'Kaur Keuangan', alamat: 'Jl. Merpati No. 1' },
          { id: '2', nama: 'Siti Aminah', nik: '199005052015022002', jabatan: 'Sekretaris Desa', alamat: 'Jl. Elang No. 5' },
          { id: '3', nama: 'Ahmad Yani', nik: '198502022009011003', jabatan: 'Kasi Pemerintahan', alamat: 'Jl. Kenari No. 10' }
        ];
        setPegawai(initialPegawai);
      }
    };

    const loadLocalOtherData = () => {
      const savedSPD = localStorage.getItem('perjadin_spd');
      if (savedSPD) setSpdList(JSON.parse(savedSPD));

      const savedLaporan = localStorage.getItem('perjadin_laporan');
      if (savedLaporan) setLaporanList(JSON.parse(savedLaporan));

      const savedSPJ = localStorage.getItem('perjadin_spj');
      if (savedSPJ) setSpjList(JSON.parse(savedSPJ));
    };

    syncData();
  }, [currentVillage]);

  // Save changes to LocalStorage helpers
  const handleVillageVerify = (villageData: any) => {
    setCurrentVillage(villageData);
    localStorage.setItem('perjadin_village', JSON.stringify(villageData));
    // Reset data local saat ganti desa
    localStorage.removeItem('perjadin_config');
    localStorage.removeItem('perjadin_pegawai');
    localStorage.removeItem('perjadin_spd');
    localStorage.removeItem('perjadin_laporan');
    localStorage.removeItem('perjadin_spj');
  };

  const handleLogout = () => {
    // Menghapus konfirmasi karena dialog browser sering terblokir di iframe pratinjau
    // 1. Hapus semua memori browser secara total
    localStorage.clear(); // Bersihkan semua untuk keamanan total
    
    // 2. Info log untuk memastikan perintah berjalan
    console.log('Logging out...');

    // 3. Langsung segarkan halaman ke root untuk paksa kembali ke login
    window.location.href = window.location.origin;
  };
  const updatePegawai = (newData: Pegawai[]) => {
    setPegawai(newData);
    localStorage.setItem('perjadin_pegawai', JSON.stringify(newData));
  };

  const updateSPD = (newData: SPD[]) => {
    setSpdList(newData);
    localStorage.setItem('perjadin_spd', JSON.stringify(newData));
  };

  const updateLaporan = (newData: Laporan[]) => {
    setLaporanList(newData);
    localStorage.setItem('perjadin_laporan', JSON.stringify(newData));
  };

  const updateSPJ = (newData: SPJ[]) => {
    setSpjList(newData);
    localStorage.setItem('perjadin_spj', JSON.stringify(newData));
  };

  const updateAppConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('perjadin_config', JSON.stringify(newConfig));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'pegawai', label: 'Data Pegawai', icon: Users },
    { id: 'spd', label: 'Buat SPD', icon: FileText },
    { id: 'laporan', label: 'Laporan Perjadin', icon: ClipboardList },
    { id: 'spj', label: 'SPJ', icon: Wallet },
    { id: 'konfigurasi', label: 'Konfigurasi', icon: Settings },
    { id: 'about', label: 'Tentang Kami', icon: Info },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
          pegawaiCount={pegawai.length} 
          spdCount={spdList.length} 
          laporanCount={laporanList.length} 
          spjCount={spjList.length} 
          config={config}
          onNavigate={(id) => setActiveView(id as ViewId)}
        />;
      case 'pegawai':
        return <PegawaiManager pegawai={pegawai} setPegawai={updatePegawai} />;
      case 'spd':
        return <SPDGenerator 
          pegawai={pegawai} 
          spdList={spdList} 
          setSpdList={updateSPD} 
          config={config} 
        />;
      case 'laporan':
        return <LaporanEditor 
          spdList={spdList} 
          laporanList={laporanList} 
          setLaporanList={updateLaporan} 
          config={config} 
        />;
      case 'spj':
        return <SPJGenerator 
          spdList={spdList} 
          spjList={spjList} 
          setSpjList={updateSPJ} 
          config={config} 
        />;
      case 'konfigurasi':
        return <ConfigManager config={config} setConfig={updateAppConfig} />;
      case 'about':
        return <About />;
      default:
        return <Dashboard 
          pegawaiCount={0} spdCount={0} laporanCount={0} spjCount={0} 
          config={config}
          onNavigate={(id) => setActiveView(id as ViewId)}
        />;
    }
  };

  if (!currentVillage) {
    return <VillagePortal onVerify={handleVillageVerify} />;
  }

  return (
    <div className="flex h-screen text-[#111111] bg-[#F5F2E9] overflow-hidden relative">
      {/* Texture/Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8B5E3C 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "h-full z-50 prestige-sidebar transition-all duration-300 ease-in-out lg:static lg:block shrink-0 flex flex-col",
          isSidebarOpen ? "w-72" : "w-20",
          !isSidebarOpen && "lg:w-20"
        )}
      >
        <div className="flex h-20 items-center justify-between px-6 border-b border-[#D4AF37]/20">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "w-0")}>
            <div className="h-10 w-10 shrink-0">
               <img 
                 src="https://res.cloudinary.com/maswardi/image/upload/v1776699505/Gemini_Generated_Image_4t6s7p4t6s7p4t6s_fbqyxz.png" 
                 alt="perjadinGO Logo" 
                 className="h-full w-full object-contain rounded-lg shadow-lg transform rotate-3"
                 referrerPolicy="no-referrer"
               />
            </div>
            <div className="flex flex-col">
              <span className="font-black font-serif text-xl tracking-tighter text-white leading-none">perjadin<span className="text-[#D4AF37]">GO</span></span>
              <span className="text-[10px] tracking-[0.2em] text-[#D4AF37]/60 font-bold mt-1">Layanan Administrasi Digital</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-[#D4AF37] hover:bg-white/5 rounded-xl transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8 px-3 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewId)}
              className={cn(
                "flex items-center w-full px-5 py-3 rounded-[18px] transition-all group relative overflow-hidden",
                activeView === item.id 
                  ? "bg-[#D4AF37] text-[#111111] shadow-xl shadow-[#D4AF37]/10" 
                  : "text-slate-400 hover:text-[#D4AF37] hover:bg-white/5"
              )}
            >
              <item.icon size={20} className={cn("shrink-0 transition-transform duration-500", activeView === item.id ? "text-black" : "group-hover:scale-110")} />
              <span className={cn("ml-4 font-bold text-[13px] tracking-wide transition-all duration-300", !isSidebarOpen && "opacity-0 invisible w-0")}>
                {item.label}
              </span>
              {activeView === item.id && (
                <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-6 bg-black rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className={cn("mt-auto px-4 pb-8 flex flex-col gap-4 overflow-hidden", !isSidebarOpen && "items-center px-2")}>
          {/* Tombol Logout - Prestige Theme (Gold/Black) */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 group relative",
              "text-slate-400 hover:text-[#D4AF37] hover:bg-white/10 active:scale-95",
              !isSidebarOpen && "justify-center w-12 h-12 px-0"
            )}
          >
            <LogOut size={20} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            {isSidebarOpen && (
              <span className="ml-4 font-bold text-[13px] tracking-wide whitespace-nowrap opacity-100 group-hover:pl-1 transition-all">
                Keluar Aplikasi
              </span>
            )}
          </button>

          {isSidebarOpen && (
            <div className="p-5 bg-white/5 rounded-[20px] border border-[#D4AF37]/10 relative overflow-hidden">
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1">Tingkat Akses:</p>
              <p className="text-xs font-black text-white not-italic tracking-tight uppercase">Admin Eksekutif</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <p className="text-[8px] text-[#D4AF37]/60 font-black uppercase tracking-widest">Sesi Aktif</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-8 border-b border-[#D9D9D9] bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && (
               <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-[#111111]"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-black font-serif tracking-[2px] text-[#111111] leading-none uppercase">
                {menuItems.find(i => i.id === activeView)?.label}
              </h1>
              <div className="h-1 w-10 bg-[#D4AF37] mt-1.5 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-[#F5F2E9] px-5 py-2.5 rounded-xl border border-[#D9D9D9] group focus-within:border-[#D4AF37] transition-all">
              <Search size={16} className="text-[#8B5E3C] mr-3" />
              <input 
                type="text" 
                placeholder="Cari sumber daya..." 
                className="bg-transparent border-none outline-none text-[11px] w-48 text-[#111111] font-bold placeholder:text-[#8B5E3C]/40"
              />
            </div>
            <button className="relative p-2.5 text-[#111111] hover:bg-[#F5F2E9] rounded-xl transition-all border border-transparent hover:border-[#D9D9D9]">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-white animate-bounce"></span>
            </button>
            <div className="flex items-center gap-4 border-l pl-6 border-[#D9D9D9]">
              <div className="text-right hidden xl:block">
                <p className="text-[10px] font-black text-[#111111] uppercase tracking-tighter leading-none">Admin Desa</p>
                <p className="text-[8px] uppercase font-black text-[#8B5E3C] tracking-[0.2em] mt-1">{currentVillage?.name || config.NAMA_DESA}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="h-10 w-10 rounded-[14px] bg-[#111111] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-black text-sm shadow-lg shadow-[#D4AF37]/10 hover:bg-black transition-all"
              >
                {currentVillage?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto px-8 py-6 relative custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-7xl mx-auto h-full"
            >
              <div className="min-h-full">
                {renderView()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed Footer */}
        <footer className="shrink-0 py-3 px-8 border-t border-[#D9D9D9] bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-[9px] text-[#8B5E3C] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              &copy; 2026 perjadinGO 
              <span className="w-0.5 h-0.5 bg-[#D4AF37] rounded-full" /> 
              Sistem Tata Kelola Desa
            </p>
            <div className="flex items-center gap-4">
              <p className="text-[9px] text-slate-400 font-black flex items-center gap-3 uppercase tracking-widest">
                Developed by 
                <span className="flex items-center gap-2 text-[#111111]">
                  <img 
                    src="https://res.cloudinary.com/maswardi/image/upload/v1775745397/akm_yq9a7m.png" 
                    alt="Arunika Logo" 
                    className="h-5 w-auto"
                    referrerPolicy="no-referrer"
                  />
                  <span className="border-b border-[#D4AF37] pb-0.5">Arunika Kreatif Media</span>
                </span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
