
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Task } from '../types';

const Calendar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, tasks, addTask, updateTask, toggleTaskStatus, deleteTask, usersDB, showToast } = useProjects();
  
  // Estado para filtrar por marca
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

  // Si cambiamos de marca seleccionada, actualizamos el pre-llenado del form
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
    // Resetear manteniendo la marca seleccionada si existe
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

  // Lógica de filtrado de tareas por día y por marca seleccionada
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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-y-auto scrollbar-hide font-display">
      <header className="px-8 py-6 border-b border-white/5 flex flex-col gap-6 shrink-0 sticky top-0 z-40 bg-background-dark/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <h2 className="text-2xl font-black text-white capitalize">{monthName} <span className="text-primary">{currentYear}</span></h2>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-card-dark p-1 rounded-xl border border-white/5">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase text-slate-400">Hoy</button>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-primary text-white font-black text-[10px] uppercase rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95">Nueva Tarea</button>
          </div>
        </div>

        {/* SELECTOR DE MARCAS (TABS) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button 
            onClick={() => setSelectedBrandId('all')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedBrandId === 'all' 
              ? 'bg-primary border-primary text-white shadow-lg' 
              : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
            }`}
          >
            Flujo Global
          </button>
          <div className="w-px h-6 bg-white/10 mx-2 shrink-0"></div>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedBrandId(p.id)}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedBrandId === p.id 
                ? 'bg-accent-orange border-accent-orange text-white shadow-lg' 
                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
              }`}
            >
              {p.logoUrl && <img src={p.logoUrl} className="w-4 h-4 rounded-full object-cover" />}
              {p.name}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8 pb-24">
        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="bg-card-dark p-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">{d}</div>)}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} className="bg-card-dark/20 min-h-[160px]"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1; 
            const month = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${month}-${dayStr}`;
            const dayTasks = getTasksForDay(dayNum); 
            const isToday = dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            return (
              <div 
                key={dayNum} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, dateStr)}
                className={`bg-card-dark/60 min-h-[160px] p-3 relative group transition-colors border-r border-b border-white/5 hover:bg-white/[0.02]`}
              >
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600'}`}>{dayNum}</span>
                <div className="mt-2 space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-hide">
                  {dayTasks.map(t => { 
                    const p = projects.find(x => x.id === t.projectId); 
                    const u = usersDB.find(x => x.id === t.collaboratorId);
                    return (
                      <div 
                        key={t.id} 
                        draggable="true"
                        onDragStart={(e) => onDragStart(e, t.id)}
                        onClick={() => { setSelectedTaskDetail(t); setIsEditingDetail(false); setEditForm(t); setConfirmDeleteStep(false); }} 
                        className={`p-2 rounded-lg text-[9px] font-bold truncate cursor-grab active:cursor-grabbing transition-all border flex items-center justify-between gap-2 ${t.status === 'Completada' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 opacity-60' : 'bg-background-dark border-white/10 text-white hover:border-primary shadow-sm'}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="flex -space-x-1.5 shrink-0">
                            {p?.logoUrl && <img src={p.logoUrl} className="w-4 h-4 rounded-full object-cover border border-white/20 shadow-sm" />}
                            {u?.avatar && <img src={u.avatar} className="w-4 h-4 rounded-full object-cover border border-white/20 shadow-sm" />}
                          </div>
                          <span className="truncate">{t.title}</span>
                        </div>
                      </div>
                    ); 
                  })}
                </div>
                <button onClick={() => { setTaskForm({...taskForm, date: dateStr}); setShowModal(true); }} className="absolute bottom-2 right-2 w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white shadow-xl"><span className="material-symbols-outlined text-sm">add</span></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="max-w-xl w-full bg-card-dark border border-white/10 rounded-[3rem] shadow-2xl p-10 space-y-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Agendar Nueva Tarea</h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Fecha Entrega</label>
                  <input type="date" required className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.date} onChange={e => setTaskForm({...taskForm, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1">Link Adjunto</label>
                  <input className="w-full bg-background-dark border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-primary" value={taskForm.driveLink} onChange={e => setTaskForm({...taskForm, driveLink: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black text-[10px] uppercase rounded-2xl">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white font-black text-[10px] uppercase rounded-2xl shadow-xl shadow-primary/20">
                  {isSubmitting ? 'Creando...' : 'Asignar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETALLE DE TAREA */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in" onClick={() => { if(!isEditingDetail) setSelectedTaskDetail(null); }}>
          <div className="max-w-2xl w-full bg-card-dark border border-white/10 rounded-[3rem] shadow-2xl p-10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">assignment</span>
                  </div>
                  <div>
                    {isEditingDetail ? (
                      <input className="bg-background-dark border border-white/10 rounded-xl px-4 py-2 text-white font-black text-xl outline-none w-full" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                    ) : (
                      <h3 className="text-2xl font-black text-white">{selectedTaskDetail.title}</h3>
                    )}
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">{selectedTaskDetail.date} • {selectedTaskDetail.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    {!isEditingDetail && (
                        <>
                            <button onClick={handleDuplicate} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-emerald-500 transition-all" title="Duplicar Tarea"><span className="material-symbols-outlined text-xl">content_copy</span></button>
                            <button onClick={() => { setIsEditingDetail(true); setEditForm(selectedTaskDetail); }} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                        </>
                    )}
                    <button onClick={() => setSelectedTaskDetail(null)} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined text-xl">close</span></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    {projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl && <img src={projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl} className="w-10 h-10 rounded-xl object-cover" />}
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Marca</p>
                      <p className="text-sm font-black text-white">{projects.find(p => p.id === selectedTaskDetail.projectId)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    {usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar && <img src={usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar} className="w-10 h-10 rounded-xl object-cover" />}
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Responsable</p>
                      <p className="text-sm font-black text-white">{usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.firstName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Instrucciones</label>
                  {isEditingDetail ? (
                    <textarea className="w-full bg-background-dark border border-white/10 rounded-2xl p-6 text-white text-sm h-32 resize-none outline-none" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  ) : (
                    <div className="bg-white/5 p-6 rounded-2xl text-slate-300 text-sm italic border border-white/5">"{selectedTaskDetail.description || 'Sin instrucciones.'}"</div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">link</span> Enlace de Entrega
                  </label>
                  {isEditingDetail ? (
                    <input className="w-full bg-background-dark border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none" value={editForm.driveLink || ''} onChange={e => setEditForm({...editForm, driveLink: e.target.value})} />
                  ) : selectedTaskDetail.driveLink ? (
                    <a href={selectedTaskDetail.driveLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-accent-orange/10 border border-accent-orange/20 rounded-2xl group hover:bg-accent-orange transition-all shadow-xl">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-accent-orange group-hover:text-white">cloud_download</span>
                        <span className="text-sm font-black uppercase text-accent-orange group-hover:text-white">Acceder al material</span>
                      </div>
                      <span className="material-symbols-outlined text-accent-orange group-hover:text-white">open_in_new</span>
                    </a>
                  ) : (
                    <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase italic">Sin link adjunto</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex gap-4 mt-10 shrink-0">
               {isEditingDetail ? (
                 <>
                   <button onClick={() => setIsEditingDetail(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black text-[10px] uppercase rounded-2xl">Cancelar</button>
                   <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white font-black text-[10px] uppercase rounded-2xl shadow-xl">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
                 </>
               ) : (
                 <>
                   <button 
                    onClick={handleDeleteClick} 
                    disabled={isSubmitting} 
                    className={`flex-1 py-4 font-black text-[10px] uppercase rounded-2xl border transition-all ${
                      confirmDeleteStep 
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                    }`}
                   >
                     {isSubmitting ? 'Borrando...' : confirmDeleteStep ? '¿ESTÁS SEGURO? CLIC PARA BORRAR' : 'Eliminar'}
                   </button>
                   <button onClick={async () => { await toggleTaskStatus(selectedTaskDetail.id); setSelectedTaskDetail(null); }} className={`flex-1 py-4 font-black text-[10px] uppercase rounded-2xl shadow-xl transition-all active:scale-95 ${selectedTaskDetail.status === 'Completada' ? 'bg-slate-700' : 'bg-emerald-500 text-white'}`}>
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
