
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { UserProfile, Receipt, Task } from '../types';

declare var html2pdf: any;

const Team: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, tasks, projects, receipts, usersDB, studioLogo, showToast } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile | null>(currentUser);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (currentUser && !isEditing) setEditForm(currentUser); }, [currentUser, isEditing]);

  if (!currentUser) return null;

  const compressImage = (base64: string, maxWidth = 300, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image(); img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const scale = maxWidth / img.width;
        canvas.width = maxWidth; canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', quality)); }
        else resolve(base64);
      };
      img.onerror = () => resolve(base64);
    });
  };

  const todayISO = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }, []);
  
  const myPendingTasks = useMemo(() => (tasks || []).filter(t => String(t.collaboratorId) === String(currentUser.id) && t.status === 'Pendiente'), [tasks, currentUser.id]);
  const myTodayTasks = useMemo(() => myPendingTasks.filter(t => t.date === todayISO), [myPendingTasks, todayISO]);
  const mySortedPendingTasks = useMemo(() => {
    return [...myPendingTasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [myPendingTasks]);
  
  const myReceipts = useMemo(() => (receipts || []).filter(r => String(r.userId) === String(currentUser.id)), [receipts, currentUser.id]);

  const upcomingBirthdays = useMemo(() => {
    const today = new Date(); const currentMonth = today.getMonth();
    return usersDB.filter(u => u.birthDate).map(u => { 
        const bd = new Date(u.birthDate + 'T12:00:00'); 
        return { ...u, bdDay: bd.getDate(), bdMonth: bd.getMonth() }; 
    })
      .sort((a, b) => (a.bdMonth !== b.bdMonth ? a.bdMonth - b.bdMonth : a.bdDay - b.bdDay))
      .filter(u => u.bdMonth >= currentMonth && u.bdMonth <= currentMonth + 1).slice(0, 5);
  }, [usersDB]);

  const handleSaveProfile = async () => {
    if (editForm) {
      setIsSaving(true);
      try {
        const success = await updateProfile({ firstName: editForm.firstName, lastName: editForm.lastName, role: editForm.role, birthDate: editForm.birthDate, avatar: editForm.avatar, banner: editForm.banner });
        if (success) { setIsEditing(false); showToast("Perfil actualizado"); } else showToast("Error al guardar", "error");
      } catch (err) { showToast("Fallo de red", "error"); } finally { setIsSaving(false); }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target?.result as string, type === 'banner' ? 800 : 400);
        setEditForm(prev => prev ? ({ ...prev, [type]: compressed }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const openTaskInCalendar = (taskId: string) => navigate('/calendar', { state: { openTaskId: taskId } });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative font-display pattern-orbital">
      
      <div className="absolute -top-12 -right-12 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-background-dark/30 backdrop-blur-2xl shrink-0 z-10">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Mi Workspace <span className="text-primary">.</span></h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 opacity-60">Visual Oscart Network • Identity Protocol</p>
        </div>
        <div className="flex gap-4">
          <div className="px-5 py-2.5 bg-primary/5 rounded-2xl border border-primary/10 text-center"><p className="text-[8px] font-black text-primary uppercase">Pendientes</p><p className="text-lg font-black text-white leading-none mt-1">{myPendingTasks.length}</p></div>
          <div className="px-5 py-2.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center"><p className="text-[8px] font-black text-emerald-500 uppercase">Cobros</p><p className="text-lg font-black text-white leading-none mt-1">{myReceipts.length}</p></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-hide relative z-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="h-40 w-full bg-slate-800 relative cursor-pointer group" onClick={() => isEditing && bannerInputRef.current?.click()}>
                <img src={isEditing ? editForm?.banner : currentUser.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-40" />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                  </div>
                )}
                <input type="file" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" />
              </div>

              <div className="p-8 flex flex-col items-center text-center -mt-20 relative z-10">
                <div className="relative mb-6 cursor-pointer group" onClick={() => isEditing && avatarInputRef.current?.click()}>
                   <img src={isEditing ? editForm?.avatar : currentUser.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover border-[6px] border-[#0a090c] shadow-2xl transition-transform group-hover:scale-105" />
                   {isEditing && (
                    <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] flex items-center justify-center backdrop-blur-sm">
                      <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                    </div>
                   )}
                   <input type="file" hidden ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
                </div>

                {isEditing ? (
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="bg-background-dark border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none font-bold" value={editForm?.firstName} onChange={e => setEditForm(prev => prev ? ({...prev, firstName: e.target.value}) : null)} placeholder="Nombre" />
                      <input className="bg-background-dark border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none font-bold" value={editForm?.lastName} onChange={e => setEditForm(prev => prev ? ({...prev, lastName: e.target.value}) : null)} placeholder="Apellido" />
                    </div>
                    <input className="w-full bg-background-dark border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none font-bold" value={editForm?.role} onChange={e => setEditForm(prev => prev ? ({...prev, role: e.target.value}) : null)} placeholder="Rol" />
                    <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-4 bg-primary text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all">{isSaving ? 'Guardando...' : 'Aplicar Cambios'}</button>
                    <button onClick={() => setIsEditing(false)} className="w-full text-slate-500 text-xs font-black uppercase hover:text-white transition-colors">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{currentUser.firstName} {currentUser.lastName}</h3>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mt-3 bg-primary/5 px-6 py-2 rounded-full border border-primary/10">{currentUser.role}</p>
                    <button onClick={() => setIsEditing(true)} className="mt-8 w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all shadow-lg">Editar Perfil</button>
                  </>
                )}
              </div>
            </div>

            <div className="glass-panel border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <span className="material-symbols-outlined text-sm">cake</span>
                Próximos Cumpleaños
              </h3>
              <div className="space-y-4">
                {upcomingBirthdays.map((u, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-8 h-8 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                      <p className="text-xs font-bold text-white uppercase tracking-tight">{u.firstName} {u.lastName}</p>
                    </div>
                    <p className="text-[9px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">{u.bdDay} {new Date(2000, u.bdMonth).toLocaleString('es-ES', { month: 'short' })}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            {/* MISIÓN DE HOY */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase italic tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
                Misión de Hoy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTodayTasks.map(t => {
                  const p = projects.find(x => x.id === t.projectId);
                  return (
                    <div key={t.id} onClick={() => openTaskInCalendar(t.id)} className="glass-panel border border-primary/20 p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-all shadow-2xl">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                          <img src={p?.logoUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white uppercase truncate tracking-tight">{t.title}</p>
                          <p className="text-[8px] text-primary font-black uppercase mt-1 tracking-widest">Protocolo Activo</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary text-base group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </div>
                  );
                })}
                {myTodayTasks.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white/[0.02] rounded-[2.5rem] border border-white/5 shadow-inner">
                    <span className="material-symbols-outlined text-slate-800 text-3xl mb-3">verified</span>
                    <p className="text-[10px] text-slate-600 italic uppercase tracking-[0.3em] font-black">Sin misiones asignadas para hoy.</p>
                  </div>
                )}
              </div>
            </section>

            {/* LISTADO DE PRIORIDADES */}
            <section className="space-y-6">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Listado de Prioridades</h3>
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{mySortedPendingTasks.length} OPERACIONES</span>
               </div>
               <div className="glass-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="max-h-[450px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                    {mySortedPendingTasks.map(t => {
                      const p = projects.find(x => x.id === t.projectId);
                      const isOverdue = new Date(t.date) < new Date(todayISO);
                      const isToday = t.date === todayISO;
                      return (
                        <div key={t.id} onClick={() => openTaskInCalendar(t.id)} className={`flex items-center justify-between p-6 hover:bg-white/[0.03] transition-all cursor-pointer group ${isToday ? 'bg-primary/5' : ''}`}>
                           <div className="flex items-center gap-5 min-w-0">
                              <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                <img src={p?.logoUrl} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-white uppercase truncate group-hover:text-primary transition-colors tracking-tight">{t.title}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase truncate tracking-widest opacity-60 mt-0.5">{p?.name}</p>
                              </div>
                           </div>
                           <div className="text-right shrink-0">
                              <p className={`text-xs font-black uppercase italic tracking-tight ${isOverdue ? 'text-rose-500' : isToday ? 'text-primary' : 'text-slate-400'}`}>
                                {isToday ? 'DUE TODAY' : isOverdue ? 'OVERDUE' : t.date}
                              </p>
                              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 opacity-50">Sincronización</p>
                           </div>
                        </div>
                      );
                    })}
                    {mySortedPendingTasks.length === 0 && (
                      <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-slate-800 text-5xl mb-4">task_alt</span>
                        <p className="text-[11px] text-slate-600 font-black uppercase tracking-widest italic opacity-50">Sistema libre de pendientes.</p>
                      </div>
                    )}
                  </div>
               </div>
            </section>

            {/* COBROS */}
            <section className="space-y-6">
               <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Historial de Cobros</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {myReceipts.map(r => (
                   <div key={r.id} onClick={() => setSelectedReceipt(r)} className="glass-panel border border-white/5 p-6 rounded-[2rem] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between group shadow-xl hover:shadow-emerald-500/5">
                     <div>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{r.month} {r.year}</p>
                       <p className="text-xs font-bold text-white uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{r.receiptNumber}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black text-white italic tracking-tighter">${r.total.toFixed(0)}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Desembolsado</p>
                     </div>
                   </div>
                 ))}
                 {myReceipts.length === 0 && <p className="col-span-full text-[10px] text-slate-600 italic uppercase text-center py-10 opacity-40 font-black tracking-widest">No hay liquidaciones registradas en el servidor.</p>}
               </div>
            </section>
          </div>
        </div>
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0a090c]/95 backdrop-blur-3xl animate-in fade-in" onClick={() => setSelectedReceipt(null)}>
          <div className="max-w-xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            <div ref={receiptPrintRef} className="w-full bg-white text-slate-900 rounded-[2.5rem] shadow-2xl p-12 space-y-10">
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 overflow-hidden shadow-lg">
                      {studioLogo ? <img src={studioLogo} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl">shutter_speed</span>}
                    </div>
                    <div><h1 className="text-xl font-display font-black uppercase tracking-tighter leading-none">Visual Oscart</h1><p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Marketing Studio</p></div>
                  </div>
                  <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidación</p><p className="text-base font-black text-slate-900 italic tracking-tight">{selectedReceipt.receiptNumber}</p></div>
                </div>
                <div className="space-y-8">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Socio:</p><p className="text-2xl font-display text-slate-900 font-black uppercase tracking-tight">{selectedReceipt.userName}</p></div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodo:</p><p className="text-base font-bold text-slate-800">{selectedReceipt.month} {selectedReceipt.year}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emisión:</p><p className="text-base font-bold text-slate-800">{selectedReceipt.date}</p></div>
                  </div>
                </div>
                <div className="bg-slate-900 p-10 rounded-[2.5rem] flex justify-between items-center text-white shadow-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Total Neto:</p>
                  <p className="text-5xl font-display font-black italic tracking-tighter">${(selectedReceipt.total || 0).toFixed(2)}</p>
                </div>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={() => setSelectedReceipt(null)} className="flex-1 py-5 bg-white/5 text-slate-500 text-xs font-black uppercase rounded-2xl border border-white/10 hover:text-white transition-all">Cerrar</button>
              <button onClick={() => { setIsDownloading(true); html2pdf().set({ margin: 0.5, filename: `VO_Recibo_${selectedReceipt.receiptNumber}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 3, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(receiptPrintRef.current).save().then(() => setIsDownloading(false)); }} className="flex-1 py-5 bg-primary text-white text-xs font-black uppercase rounded-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all">Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
