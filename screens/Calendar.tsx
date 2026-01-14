
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Task } from '../types';

const Calendar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, tasks, addTask, updateTask, toggleTaskStatus, deleteTask, usersDB, showToast } = useProjects();
  
  const [selectedBrandId, setSelectedBrandId] = useState<'all' | string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', projectId: '', collaboratorId: '', 
    date: new Date().toISOString().split('T')[0], driveLink: ''
  });

  const [editForm, setEditForm] = useState<Partial<Task>>({});

  useEffect(() => {
    if (location.state?.openTaskId && tasks.length > 0) {
      const task = tasks.find(t => String(t.id) === String(location.state.openTaskId));
      if (task) {
        setSelectedTaskDetail(task);
        setEditForm(task);
        setConfirmDeleteStep(false);
        setCurrentDate(new Date(task.date));
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, tasks, navigate, location.pathname]);

  useEffect(() => {
    if (selectedBrandId !== 'all') {
      setTaskForm(prev => ({ ...prev, projectId: selectedBrandId }));
    } else {
      setTaskForm(prev => ({ ...prev, projectId: '' }));
    }
  }, [selectedBrandId]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.projectId || !taskForm.collaboratorId) {
      showToast("Completa los campos obligatorios", "error");
      return;
    }
    setIsSubmitting(true);
    await addTask(taskForm);
    setIsSubmitting(false);
    setShowModal(false);
    setTaskForm({ 
      title: '', 
      description: '', 
      projectId: selectedBrandId !== 'all' ? selectedBrandId : '', 
      collaboratorId: '', 
      date: new Date().toISOString().split('T')[0], 
      driveLink: '' 
    });
    showToast("Tarea creada");
  };

  const handleSaveEdit = async () => {
    if (!selectedTaskDetail) return;
    setIsSubmitting(true);
    try {
      const dataToUpdate = {
          title: editForm.title,
          description: editForm.description,
          date: editForm.date,
          driveLink: editForm.driveLink,
          projectId: editForm.projectId,
          collaboratorId: editForm.collaboratorId
      };
      await updateTask(selectedTaskDetail.id, dataToUpdate);
      setSelectedTaskDetail(prev => prev ? ({ ...prev, ...dataToUpdate } as Task) : null);
      setIsEditingDetail(false);
      showToast("Tarea actualizada");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedTaskDetail) return;
    if (!confirmDeleteStep) {
      setConfirmDeleteStep(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTaskDetail.id);
      setSelectedTaskDetail(null);
      setConfirmDeleteStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = () => {
    if (!selectedTaskDetail) return;
    setTaskForm({
      title: `${selectedTaskDetail.title} (Copia)`,
      description: selectedTaskDetail.description,
      projectId: selectedTaskDetail.projectId,
      collaboratorId: selectedTaskDetail.collaboratorId,
      date: selectedTaskDetail.date,
      driveLink: selectedTaskDetail.driveLink || ''
    });
    setSelectedTaskDetail(null);
    setShowModal(true);
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDrop = async (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      await updateTask(taskId, { date: newDate });
      showToast("Fecha actualizada");
    }
  };

  const getTasksForDay = (day: number) => {
    const month = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${month}-${dayStr}`;
    return (tasks || []).filter(t => {
      const matchDate = t.date === dateStr;
      const matchBrand = selectedBrandId === 'all' || t.projectId === selectedBrandId;
      return matchDate && matchBrand;
    });
  };

  const scrollTasks = (dateStr: string) => {
    const container = dayRefs.current[dateStr];
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
      if (isAtBottom) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ top: 60, behavior: 'smooth' });
      }
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-y-auto scrollbar-hide font-display">
      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex flex-col gap-4 sm:gap-6 shrink-0 sticky top-0 z-40 bg-background-dark/80 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <span className="material-symbols-outlined text-xl sm:text-2xl">calendar_today</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white capitalize">{monthName} <span className="text-primary">{currentYear}</span></h2>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <div className="flex bg-card-dark p-1 rounded-xl border border-white/5">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg sm:text-xl">chevron_left</span>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-4 py-2 text-[8px] sm:text-[10px] font-black uppercase text-slate-400">Hoy</button>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg sm:text-xl">chevron_right</span>
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-primary text-white font-black text-[9px] sm:text-[10px] uppercase rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95">Nueva Tarea</button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setSelectedBrandId('all')} className={`px-4 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedBrandId === 'all' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>Flujo Global</button>
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedBrandId(p.id)} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedBrandId === p.id ? 'bg-accent-orange border-accent-orange text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
              {p.logoUrl && <img src={p.logoUrl} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full object-cover border border-white/20" />}
              {p.name}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 sm:p-8 pb-24">
        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="bg-card-dark p-2 sm:p-4 text-center text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">{d}</div>)}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} className="bg-card-dark/20 min-h-[100px] sm:min-h-[160px]"></div>)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1; 
            const month = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${month}-${dayStr}`;
            const dayTasks = getTasksForDay(dayNum); 
            const isToday = dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            
            const maxVisible = 3;
            const extraTasks = dayTasks.length > maxVisible ? dayTasks.length - maxVisible : 0;

            return (
              <div key={dayNum} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, dateStr)} className="bg-card-dark/60 min-h-[100px] sm:min-h-[160px] p-2 sm:p-3 relative group transition-colors border-r border-b border-white/5 hover:bg-white/[0.02]">
                <div className="flex justify-between items-center mb-1 sm:mb-2">
                  <span className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600'}`}>{dayNum}</span>
                  {extraTasks > 0 && (
                    <span className="text-[7px] sm:text-[8px] font-black text-accent-orange uppercase tracking-tighter opacity-80">+{extraTasks}</span>
                  )}
                </div>

                {dayTasks.length > maxVisible && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); scrollTasks(dateStr); }}
                    className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-10 w-3 sm:w-4 h-8 sm:h-12 bg-white/5 hover:bg-primary/20 rounded-full flex items-center justify-center text-slate-600 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[10px] sm:text-xs">expand_more</span>
                  </button>
                )}

                <div 
                  ref={el => dayRefs.current[dateStr] = el}
                  className={`mt-1 sm:mt-2 space-y-1 sm:space-y-1.5 max-h-[60px] sm:max-h-[100px] overflow-y-auto scrollbar-hide ${dayTasks.length > maxVisible ? 'pl-1.5 sm:pl-2' : ''}`}
                >
                  {dayTasks.map(t => { 
                    const p = projects.find(x => x.id === t.projectId); 
                    const u = usersDB.find(x => x.id === t.collaboratorId);
                    return (
                      <div 
                        key={t.id} 
                        draggable="true" 
                        onDragStart={(e) => onDragStart(e, t.id)} 
                        onClick={() => { setSelectedTaskDetail(t); setIsEditingDetail(false); setEditForm(t); setConfirmDeleteStep(false); }} 
                        className={`p-1 sm:p-2 rounded-lg transition-all border flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                          t.status === 'Completada' ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 'bg-background-dark border-white/10 hover:border-primary shadow-sm'
                        }`}
                      >
                        <div className="flex -space-x-1.5 shrink-0">
                          {p?.logoUrl && <img src={p.logoUrl} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/20 shadow-sm" />}
                          {u?.avatar && <img src={u.avatar} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/20 shadow-sm" />}
                        </div>
                        <span className="hidden sm:inline truncate text-[9px] font-bold text-white">{t.title}</span>
                      </div>
                    ); 
                  })}
                </div>
                
                <button onClick={() => { setTaskForm({...taskForm, date: dateStr}); setShowModal(true); }} className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white shadow-xl">
                  <span className="material-symbols-outlined text-[10px] sm:text-sm">add</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="max-w-xl w-full bg-card-dark border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 space-y-6 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight">Agendar Nueva Tarea</h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Marca</label>
                  <select required className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Socio</label>
                  <select required className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.collaboratorId} onChange={e => setTaskForm({...taskForm, collaboratorId: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {usersDB.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase px-1">Título de Tarea</label>
                <input required className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Ej: Diseño de Reels" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase px-1">Instrucciones</label>
                <textarea className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs h-24 outline-none focus:border-primary resize-none" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Detalla los requisitos..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Fecha Entrega</label>
                  <input type="date" required className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.date} onChange={e => setTaskForm({...taskForm, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Link Adjunto</label>
                  <input className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.driveLink} onChange={e => setTaskForm({...taskForm, driveLink: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black text-[9px] sm:text-[10px] uppercase rounded-2xl">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white font-black text-[9px] sm:text-[10px] uppercase rounded-2xl shadow-xl shadow-primary/20">{isSubmitting ? 'Creando...' : 'Asignar Tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in" onClick={() => { if(!isEditingDetail) setSelectedTaskDetail(null); }}>
          <div className="max-w-2xl w-full bg-card-dark border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-6 sm:mb-8 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">assignment</span>
                  </div>
                  <div className="min-w-0">
                    {isEditingDetail ? (
                      <input className="bg-background-dark border border-white/10 rounded-xl px-3 py-2 text-white font-black text-lg sm:text-xl outline-none w-full" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                    ) : (
                      <h3 className="text-lg sm:text-2xl font-black text-white truncate max-w-[200px] sm:max-w-md">{selectedTaskDetail.title}</h3>
                    )}
                    <p className="text-[8px] sm:text-[10px] text-primary font-black uppercase tracking-widest mt-1">{selectedTaskDetail.date} • {selectedTaskDetail.status}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                    {!isEditingDetail && (
                        <>
                            <button onClick={handleDuplicate} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-emerald-500 transition-all" title="Duplicar Tarea"><span className="material-symbols-outlined text-lg sm:text-xl">content_copy</span></button>
                            <button onClick={() => { setIsEditingDetail(true); setEditForm(selectedTaskDetail); }} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-lg sm:text-xl">edit</span></button>
                        </>
                    )}
                    <button onClick={() => setSelectedTaskDetail(null)} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined text-lg sm:text-xl">close</span></button>
                </div>
             </div>
             
             <div className="flex-1 space-y-6 sm:space-y-8 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    {projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl && <img src={projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover" />}
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">Marca</p>
                      <p className="text-xs sm:text-sm font-black text-white">{projects.find(p => p.id === selectedTaskDetail.projectId)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    {usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar && <img src={usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover" />}
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">Responsable</p>
                      <p className="text-xs sm:text-sm font-black text-white">{usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.firstName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Instrucciones</label>
                  {isEditingDetail ? (
                    <textarea className="w-full bg-background-dark border border-white/10 rounded-2xl p-4 sm:p-6 text-white text-sm h-32 resize-none outline-none" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  ) : (
                    <div className="bg-white/5 p-4 sm:p-6 rounded-2xl text-slate-300 text-sm italic border border-white/5 whitespace-pre-wrap leading-relaxed">"{selectedTaskDetail.description || 'Sin instrucciones.'}"</div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">link</span> Enlace de Entrega
                  </label>
                  {isEditingDetail ? (
                    <input className="w-full bg-background-dark border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white text-sm outline-none" value={editForm.driveLink || ''} onChange={e => setEditForm({...editForm, driveLink: e.target.value})} />
                  ) : selectedTaskDetail.driveLink ? (
                    <a href={selectedTaskDetail.driveLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 sm:p-6 bg-accent-orange/10 border border-accent-orange/20 rounded-2xl group hover:bg-accent-orange transition-all shadow-xl">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="material-symbols-outlined text-accent-orange group-hover:text-white">cloud_download</span>
                        <span className="text-[10px] sm:text-sm font-black uppercase text-accent-orange group-hover:text-white">Acceder al material</span>
                      </div>
                      <span className="material-symbols-outlined text-accent-orange group-hover:text-white">open_in_new</span>
                    </a>
                  ) : (
                    <div className="p-4 sm:p-6 border border-dashed border-white/10 rounded-2xl text-center">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase italic">Sin link adjunto</p>
                    </div>
                  )}
                </div>
             </div>

             {/* Footer del Modal: Restauración de botones a escala completa */}
             <div className="flex gap-4 mt-8 sm:mt-10 shrink-0">
               {isEditingDetail ? (
                 <>
                   <button onClick={() => setIsEditingDetail(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black text-[9px] sm:text-[10px] uppercase rounded-2xl">Cancelar</button>
                   <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white font-black text-[9px] sm:text-[10px] uppercase rounded-2xl shadow-xl">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                 </>
               ) : (
                 <>
                   <button onClick={handleDeleteClick} disabled={isSubmitting} className={`flex-1 py-4 font-black text-[9px] sm:text-[10px] uppercase rounded-2xl border transition-all ${confirmDeleteStep ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'}`}>
                     {isSubmitting ? 'Borrando...' : confirmDeleteStep ? '¿ESTÁS SEGURO?' : 'Eliminar'}
                   </button>
                   <button onClick={async () => { await toggleTaskStatus(selectedTaskDetail.id); setSelectedTaskDetail(null); }} className={`flex-1 py-4 font-black text-[9px] sm:text-[10px] uppercase rounded-2xl shadow-xl transition-all active:scale-95 ${selectedTaskDetail.status === 'Completada' ? 'bg-slate-700' : 'bg-emerald-500 text-white'}`}>
                     {selectedTaskDetail.status === 'Completada' ? 'Reabrir' : 'Finalizar'}
                   </button>
                 </>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
