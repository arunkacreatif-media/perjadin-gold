import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils.ts';
import { Pegawai } from '../types.ts';
import { googleService } from '../services/googleService.ts';

interface PegawaiManagerProps {
  pegawai: Pegawai[];
  setPegawai: (data: Pegawai[]) => void;
}

export default function PegawaiManager({ pegawai, setPegawai }: PegawaiManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSafeValue = (obj: any, key: string) => {
    if (!obj) return '';
    const search = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k in obj) {
       if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === search) return obj[k];
    }
    return obj[key] || '';
  };

  const [formData, setFormData] = useState<Pegawai>({
    nama: '',
    nik: '',
    jabatan: '',
    alamat: '',
  });

  const handleOpenModal = (p?: Pegawai) => {
    if (p) {
      setEditingPegawai(p);
      setFormData(p);
    } else {
      setEditingPegawai(null);
      setFormData({ nama: '', nik: '', jabatan: '', alamat: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPegawai(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPegawai) {
        const updatedList = pegawai.map(p => p.id === editingPegawai.id ? { ...formData, id: p.id } : p);
        setPegawai(updatedList);
        // Sync update - implementation depends on how you want to handle existing rows
      } else {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const newPegawai = { ...formData, id, createdAt };
        
        // Optimistic update
        setPegawai([...pegawai, newPegawai]);
        
        // Sync to Google Sheets
        await googleService.addPegawai({ ...formData, id, createdAt });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Gagal sinkronisasi Sheets:', error);
      // Fallback already handled by optimistic update locally
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) {
      setPegawai(pegawai.filter(p => p.id !== id));
    }
  };

  const filteredPegawai = pegawai.filter(p => 
    (p.nama || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (p.nik || '').includes(searchTerm || '') ||
    (p.jabatan || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 prestige-card p-6 bg-white rounded-[32px]">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#111111] flex items-center gap-4 tracking-tight not-italic">
            <div className="p-2.5 bg-[#111111] rounded-xl border-2 border-[#D4AF37]">
              <Users size={24} className="text-[#D4AF37]" />
            </div>
            Manajemen Perangkat Desa
          </h2>
          <p className="text-[11px] text-[#8B5E3C] mt-2 font-semibold tracking-wide pl-14">Registrasi Dan Validasi Data Personel</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 btn-prestige-gold px-8 py-3 rounded-xl active:scale-95 uppercase tracking-widest text-[10px] font-bold"
        >
          <UserPlus size={16} />
          <span>Tambah Data Pegawai</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="prestige-card p-4 bg-[#111111] rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama, identitas, atau jabatan..."
            className="w-full pl-12 pr-6 py-3 bg-white/10 border border-[#D4AF37]/20 focus:border-[#D4AF37] rounded-xl outline-none transition-all placeholder:text-slate-600 font-bold text-white text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.3em] px-6 border-l border-[#D4AF37]/20 not-italic whitespace-nowrap">
          Data Terverifikasi: <span className="text-white text-base ml-2">{filteredPegawai.length}</span>
        </div>
      </div>

      {/* Data Grid with fixed height scroll */}
      <div className="prestige-card rounded-[32px] overflow-hidden bg-white shadow-2xl">
        <div className="overflow-x-auto max-h-[calc(100vh-420px)] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111111] text-[#D4AF37] sticky top-0 z-20">
              <tr>
                <th className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.3em] border-b border-[#D4AF37]/20">Identitas Personel</th>
                <th className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.3em] border-b border-[#D4AF37]/20">Jabatan</th>
                <th className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.3em] border-b border-[#D4AF37]/20">Lokasi</th>
                <th className="px-8 py-4 font-black text-[9px] uppercase tracking-[0.3em] border-b border-[#D4AF37]/20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D9]">
              <AnimatePresence>
                {filteredPegawai.length > 0 ? (
                  filteredPegawai.map((p, idx) => (
                    <motion.tr 
                      key={p.id || `peg-row-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[#F5F2E9] transition-all group"
                    >
                      <td className="px-8 py-4">
                        <p className="font-black text-[#111111] text-base tracking-tighter uppercase group-hover:text-[#D4AF37] transition-colors">{getSafeValue(p, 'nama')}</p>
                        <p className="text-[9px] font-black text-[#8B5E3C] mt-0.5 tracking-[0.1em] not-italic">NIK. {getSafeValue(p, 'nik') || getSafeValue(p, 'niap') || getSafeValue(p, 'niapnik') || getSafeValue(p, 'nip') || '—'}</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className="inline-block px-3 py-1 rounded-lg bg-[#111111] text-[#D4AF37] text-[8px] font-black uppercase tracking-widest border border-[#D4AF37]/30 group-hover:shadow-lg transition-all">
                          {getSafeValue(p, 'jabatan')}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-xs text-slate-500 font-bold max-w-xs truncate not-italic">{getSafeValue(p, 'alamat')}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(p)}
                            className="p-2.5 bg-white border border-[#D9D9D9] text-[#111111] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id!)}
                            className="p-2.5 bg-white border border-[#D9D9D9] text-[#111111] hover:bg-black hover:text-[#D4AF37] rounded-lg transition-all shadow-sm"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-[#8B5E3C] font-black not-italic uppercase tracking-widest bg-[#F5F2E9]">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-2xl bg-[#F5F2E9] rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-[#D4AF37]"
            >
              <div className="p-10 bg-[#111111] border-b border-[#D4AF37]/30 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 not-italic font-black text-6xl text-white">FORM</div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black font-serif text-white not-italic uppercase tracking-tighter">
                    {editingPegawai ? 'Revisi Data' : 'Pendaftaran Resmi'}
                  </h3>
                  <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em] mt-2">Layanan Manajemen Dokumen</p>
                </div>
                <button onClick={handleCloseModal} className="relative z-10 p-3 bg-white/5 hover:bg-[#D4AF37] rounded-2xl transition-all text-white group">
                  <XIcon size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E3C] ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-5 prestige-input rounded-[24px] placeholder:text-slate-300 font-bold text-lg not-italic"
                      placeholder="Contoh: H. Sutrisno"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E3C] ml-1">NIK (Nomor Induk Kependudukan)</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-5 prestige-input rounded-[24px] font-black text-lg tracking-widest placeholder:text-slate-300"
                      placeholder="16-Digit Kode"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E3C] ml-1">Jabatan Resmi</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-5 prestige-input rounded-[24px] placeholder:text-slate-300 font-black not-italic text-base"
                      placeholder="Contoh: Sekretaris Desa"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B5E3C] ml-1">Alamat Tinggal</label>
                    <textarea 
                      required
                      rows={2}
                      className="w-full px-6 py-5 prestige-input rounded-[24px] placeholder:text-slate-300 text-sm font-bold resize-none"
                      placeholder="Detail Domisili Lengkap"
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-6 pt-6">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="px-10 py-5 rounded-2xl font-black text-[#8B5E3C] hover:text-[#111111] transition-all uppercase tracking-widest text-xs"
                  >
                    Batalkan
                  </button>
                  <button 
                    type="submit"
                    className="px-14 py-6 rounded-2xl font-black bg-[#111111] text-[#D4AF37] hover:shadow-[0_0_30px_#D4AF3780] transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-[0.3em] not-italic"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}

function XIcon({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
