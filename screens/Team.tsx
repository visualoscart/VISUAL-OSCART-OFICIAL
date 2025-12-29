
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { UserProfile, Receipt, Task } from '../types';

declare var html2pdf: any;

const Team: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, tasks, projects, receipts, usersDB, studioLogo, showToast, toggleTaskStatus } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile | null>(currentUser);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser && !isEditing) {
      setEditForm(currentUser);
    }
  }, [currentUser, isEditing]);

  if (!currentUser) return null;

  // Función crítica para comprimir imágenes antes de enviarlas a Supabase
  const compressImage = (base64: string, maxWidth = 300, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
    });
  };

  const myPendingTasks = useMemo(() => {
    return (tasks || []).filter(t => 
      String(t.collaboratorId) === String(currentUser.id) && 
      t.status === 'Pendiente'
    );
  }, [tasks, currentUser.id]);

  const myReceipts = useMemo(() => {
    return (receipts || []).filter(r => 
      String(r.userId) === String(currentUser.id)
    );
  }, [receipts, currentUser.id]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    return usersDB
      .filter(u => u.birthDate)
      .map(u => {
        const bd = new Date(u.birthDate + 'T12:00:00');
        return { ...u, bdDay: bd.getDate(), bdMonth: bd.getMonth() };
      })
      .sort((a, b) => (a.bdMonth !== b.bdMonth ? a.bdMonth - b.bdMonth : a.bdDay - b.bdDay))
      .filter(u => u.bdMonth >= currentMonth && u.bdMonth <= currentMonth + 1)
      .slice(0, 5);
  }, [usersDB]);

  const handleSaveProfile = async () => {
    if (editForm) {
      setIsSaving(true);
      try {
        const success = await updateProfile({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          role: editForm.role,
          birthDate: editForm.birthDate,
          avatar: editForm.avatar,
          banner: editForm.banner
        });
        if (success) {
          setIsEditing(false);
          showToast("Perfil actualizado correctamente");
        } else {
          showToast("Error al guardar cambios", "error");
        }
      } catch (err) {
        showToast("Error de conexión con el servidor", "error");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        // Comprimimos la imagen drásticamente para asegurar rapidez en Supabase
        const compressed = await compressImage(base64, type === 'banner' ? 600 : 250);
        setEditForm(prev => prev ? ({ ...prev, [type]: compressed }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden relative font-display">
      <header className="px-8 py-8 border-b border-white/5 shrink-0 flex items-center justify-between bg-background-dark/50 backdrop-blur">
        <div>
          <h2 className="text-2xl font-display text-white uppercase italic tracking-tight">Mi Workspace Personal</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Visual Oscart Network</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-primary/10 rounded-2xl border border-primary/20 text-center">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Por Hacer</p>
            <p className="text-lg font-black text-white">{myPendingTasks.length}</p>
          </div>
          <div className="px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Liquidaciones</p>
            <p className="text-lg font-black text-emerald-400">{myReceipts.length}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
          
          {/* PERFIL */}
          <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-bottom-6">
            <div className="bg-card-dark border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="h-40 w-full bg-slate-800 relative cursor-pointer group" onClick={() => isEditing && bannerInputRef.current?.click()}>
                <img src={isEditing ? editForm?.banner : currentUser.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-100" />
                {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm"><span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Banner</span></div>}
                <input type="file" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" />
              </div>
              <div className="p-10 flex flex-col items-center text-center -mt-20 relative z-10">
                <div className="relative mb-8 cursor-pointer group" onClick={() => isEditing && avatarInputRef.current?.click()}>
                  <img src={isEditing ? editForm?.avatar : currentUser.avatar} className="w-36 h-36 rounded-[2.5rem] object-cover border-4 border-background-dark shadow-2xl group-hover:scale-105 transition-transform" />
                  {isEditing && <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] flex items-center justify-center backdrop-blur-sm"><span className="material-symbols-outlined text-white text-3xl">photo_camera</span></div>}
                  <input type="file" hidden ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
                </div>
                {isEditing ? (
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="bg-background-dark border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-primary" value={editForm?.firstName} onChange={e => setEditForm(prev => prev ? ({...prev, firstName: e.target.value}) : null)} placeholder="Nombre" />
                      <input className="bg-background-dark border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-primary" value={editForm?.lastName} onChange={e => setEditForm(prev => prev ? ({...prev, lastName: e.target.value}) : null)} placeholder="Apellido" />
                    </div>
                    <div className="text-left">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-1">Puesto / Rol</label>
                      <input className="w-full bg-background-dark border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-primary" value={editForm?.role} onChange={e => setEditForm(prev => prev ? ({...prev, role: e.target.value}) : null)} placeholder="Ej: Diseñador Senior" />
                    </div>
                    <div className="text-left">
                      <label className="text-[9px] font-black text-slate-500 uppercase px-1">Cumpleaños</label>
                      <input type="date" className="w-full bg-background-dark border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-primary" value={editForm?.birthDate} onChange={e => setEditForm(prev => prev ? ({...prev, birthDate: e.target.value}) : null)} />
                    </div>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-5 bg-primary text-white font-display uppercase rounded-2xl shadow-xl text-[11px] tracking-widest active:scale-95 transition-all">{isSaving ? 'Sincronizando...' : 'Guardar Perfil'}</button>
                    <button onClick={() => setIsEditing(false)} className="w-full text-slate-600 font-black text-[10px] uppercase hover:text-white transition-colors">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-display text-white tracking-tight">{currentUser.firstName} {currentUser.lastName}</h3>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mt-3 bg-primary/10 px-5 py-2 rounded-full border border-primary/20">{currentUser.role}</p>
                    <div className="mt-6 flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                       <span className="material-symbols-outlined text-sm text-primary">cake</span>
                       {currentUser.birthDate ? new Date(currentUser.birthDate + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }) : 'No definido'}
                    </div>
                    <button onClick={() => setIsEditing(true)} className="mt-8 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white/10 hover:text-white transition-all">Configurar Perfil</button>
                  </>
                )}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 italic"><span className="material-symbols-outlined text-lg">cake</span> Próximos Brindis</h4>
              <div className="space-y-4">
                {upcomingBirthdays.map(u => (
                  <div key={u.id} className="flex items-center gap-4">
                    <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/5" />
                    <div><p className="text-xs font-bold text-white uppercase">{u.firstName}</p><p className="text-[9px] text-slate-500 font-bold uppercase">{new Date(u.birthDate + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OPERACIÓN Y PAGOS */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* TAREAS */}
            <section className="space-y-6">
              <h3 className="text-xl font-display text-white uppercase italic tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">assignment</span>
                Mis Pendientes Operativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPendingTasks.length > 0 ? myPendingTasks.map(t => {
                  const p = projects.find(proj => proj.id === t.projectId);
                  return (
                    <div key={t.id} className="bg-card-dark border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all animate-in fade-in">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20 text-primary">
                          <span className="material-symbols-outlined">pending</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{t.title}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{p?.name || 'Marca'} • {t.date}</p>
                        </div>
                      </div>
                      <button onClick={() => toggleTaskStatus(t.id)} className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined">done</span>
                      </button>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-[2.5rem] text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-4xl mb-4 opacity-20 block">task_alt</span>
                    Todo al día. No hay tareas pendientes.
                  </div>
                )}
              </div>
            </section>

            {/* RECIBOS */}
            <section className="space-y-6">
              <h3 className="text-xl font-display text-white uppercase italic tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">payments</span>
                Historial de Recibos de Pago
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReceipts.length > 0 ? myReceipts.map(r => (
                  <div key={r.id} onClick={() => setSelectedReceipt(r)} className="bg-card-dark border border-white/5 p-6 rounded-[2rem] hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <span className="material-symbols-outlined">receipt_long</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{r.month} {r.year}</p>
                        <p className="text-xs font-bold text-white uppercase">{r.receiptNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display text-white leading-none">${(r.total || 0).toFixed(0)}</p>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">Ver Detalle</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-[2.5rem] text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-4xl mb-4 opacity-20 block">payments</span>
                    No se encontraron liquidaciones para tu usuario.
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* MODAL RECIBO */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-3xl animate-in fade-in" onClick={() => setSelectedReceipt(null)}>
          <div className="max-w-xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            <div ref={receiptPrintRef} className="w-full bg-white text-slate-900 rounded-[2.5rem] shadow-2xl p-12 space-y-10">
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white overflow-hidden shrink-0">
                      {studioLogo ? <img src={studioLogo} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined">shutter_speed</span>}
                    </div>
                    <div><h1 className="text-lg font-display uppercase tracking-tighter leading-none">Visual Oscart</h1><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Marketing Studio</p></div>
                  </div>
                  <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Liquidación</p><p className="text-sm font-black text-slate-900">{selectedReceipt.receiptNumber}</p></div>
                </div>
                <div className="space-y-6">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Beneficiario:</p><p className="text-lg font-display text-slate-900 uppercase tracking-tight">{selectedReceipt.userName}</p></div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Mes:</p><p className="text-sm font-bold text-slate-800">{selectedReceipt.month} {selectedReceipt.year}</p></div>
                    <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fecha:</p><p className="text-sm font-bold text-slate-800">{selectedReceipt.date}</p></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pagado:</p>
                  <p className="text-4xl font-display text-slate-900">${(selectedReceipt.total || 0).toFixed(2)}</p>
                </div>
                <p className="text-[8px] text-center text-slate-300 font-bold uppercase tracking-widest italic pt-4">Documento digital verificado por la administración de Visual Oscart</p>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={() => setSelectedReceipt(null)} className="flex-1 py-5 bg-white/5 text-slate-500 text-[10px] font-black uppercase rounded-2xl border border-white/10 hover:text-white transition-all">Cerrar</button>
              <button 
                onClick={() => { 
                  setIsDownloading(true); 
                  const opt = { 
                    margin: 0.5, 
                    filename: `VO_Recibo_${selectedReceipt.receiptNumber}.pdf`, 
                    image: { type: 'jpeg', quality: 0.98 }, 
                    html2canvas: { scale: 3, useCORS: true }, 
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
                  }; 
                  html2pdf().set(opt).from(receiptPrintRef.current).save().then(() => {
                    setIsDownloading(false);
                  }); 
                }} 
                className="flex-1 py-5 bg-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-2xl active:scale-95 transition-all"
              >
                {isDownloading ? 'Generando PDF...' : 'Descargar Recibo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
