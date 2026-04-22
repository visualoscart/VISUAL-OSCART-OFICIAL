
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

  const scrollDayDown = (dayNum: number) => {
    const el = document.getElementById(`day-tasks-${dayNum}`);
    if (el) el.scrollBy({ top: 40, behavior: 'smooth' });
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative pattern-orbital overflow-y-auto scrollbar-hide font-display">
      
      {/* Luces ambientales */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex flex-col gap-4 sm:gap-6 shrink-0 sticky top-0 z-40 bg-background-dark/30 backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-primary/20 p-2 rounded-xl text-primary border border-primary/20 shadow-lg">
              <span className="material-symbols-outlined text-xl sm:text-2xl">calendar_today</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white capitalize italic tracking-tighter">{monthName} <span className="text-primary">{currentYear}</span></h2>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg sm:text-xl">chevron_left</span>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-4 py-2 text-[8px] sm:text-[10px] font-black uppercase text-slate-400 hover:text-white">Hoy</button>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg sm:text-xl">chevron_right</span>
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-premium flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-white font-black text-[9px] sm:text-[10px] uppercase rounded-xl shadow-2xl transition-all active:scale-95">Nueva Tarea</button>
          </div>
        </div>

        {/* Brand Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          <button onClick={() => setSelectedBrandId('all')} className={`px-4 sm:px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedBrandId === 'all' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}>Flujo Global</button>
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedBrandId(p.id)} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedBrandId === p.id ? 'bg-accent-orange border-accent-orange text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}>
              {p.logoUrl && <img src={p.logoUrl} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full object-cover border border-white/20" />}
              {p.name}
            </button>
          ))}
        </div>
      </header>

      <div className="p-2 sm:p-8 pb-24 relative z-10">
        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[1.2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl bg-black/40">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
            <div key={i} className="bg-black/40 p-2 sm:p-4 text-center text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
              {d}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={i} className="bg-black/10 min-h-[100px] sm:min-h-[160px]"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1; 
            const month = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${month}-${dayStr}`;
            const dayTasks = getTasksForDay(dayNum); 
            const isToday = dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            
            const hasMore = dayTasks.length > 3;

            return (
              <div 
                key={dayNum} 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => onDrop(e, dateStr)} 
                className="bg-black/20 min-h-[100px] sm:min-h-[160px] p-1.5 sm:p-4 relative group transition-all border-r border-b border-white/5 hover:bg-primary/5"
              >
                <div className="flex justify-between items-start mb-1 sm:mb-2 relative z-10">
                  <span className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600'}`}>{dayNum}</span>
                  {dayTasks.length > 3 && (
                    <span className="text-[6px] sm:text-[8px] font-black text-accent-orange uppercase tracking-tighter bg-accent-orange/10 px-1 py-0.5 rounded-md">+{dayTasks.length - 3}</span>
                  )}
                </div>

                <div 
                  id={`day-tasks-${dayNum}`}
                  className={`mt-1 sm:mt-2 space-y-1 sm:space-y-1.5 h-[65px] sm:h-[105px] overflow-y-auto scrollbar-hide relative z-0`}
                >
                  {dayTasks.map(t => { 
                    const p = projects.find(x => x.id === t.projectId); 
                    const u = usersDB.find(x => x.id === t.collaboratorId);
                    const isDone = t.status === 'Completada';
                    return (
                      <div 
                        key={t.id} 
                        draggable="true" 
                        onDragStart={(e) => onDragStart(e, t.id)} 
                        onClick={() => { setSelectedTaskDetail(t); setIsEditingDetail(false); setEditForm(t); setConfirmDeleteStep(false); }} 
                        className={`p-1 rounded-lg sm:rounded-xl transition-all border flex items-center justify-center sm:justify-start gap-1 sm:gap-2 cursor-pointer ${
                          isDone 
                          ? 'bg-primary/5 border-primary/10 opacity-30 grayscale-[0.4] hover:opacity-70 transition-opacity' 
                          : 'bg-black/60 border-white/5 hover:border-primary shadow-2xl backdrop-blur-md'
                        }`}
                      >
                        <div className="flex -space-x-1 sm:-space-x-1.5 shrink-0 scale-90 sm:scale-100">
                          {p?.logoUrl && <img src={p.logoUrl} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/20 shadow-sm" />}
                          {u?.avatar && <img src={u.avatar} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white/20 shadow-sm" />}
                        </div>
                        <span className={`hidden sm:inline truncate text-[9px] font-bold uppercase tracking-tight ${isDone ? 'text-primary/60' : 'text-white/80'}`}>
                          {t.title}
                        </span>
                      </div>
                    ); 
                  })}
                </div>
                
                {/* Botón de Scroll Minimalista Reubicado para no tapar */}
                {hasMore && (
                    <button 
                        onClick={() => scrollDayDown(dayNum)}
                        className="absolute bottom-1.5 left-1.5 text-white/10 hover:text-primary transition-colors z-20"
                        title="Ver más tareas"
                    >
                        <span className="material-symbols-outlined text-[10px]">keyboard_double_arrow_down</span>
                    </button>
                )}

                <button onClick={() => { setTaskForm({...taskForm, date: dateStr}); setShowModal(true); }} className="absolute bottom-1 right-1 sm:bottom-3 sm:right-3 w-5 h-5 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-primary hover:text-white shadow-2xl border border-primary/20 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[10px] sm:text-xs">add</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowModal(false)}>
          <div className="max-w-xl w-full glass-panel border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-12 space-y-8 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Agendar <span className="text-primary">Misión</span></h3>
            <form onSubmit={handleSaveTask} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Marca Estratégica</label>
                  <select required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary" value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Socio Asignado</label>
                  <select required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary" value={taskForm.collaboratorId} onChange={e => setTaskForm({...taskForm, collaboratorId: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {usersDB.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Identificador de Tarea</label>
                <input required className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white text-sm font-bold uppercase outline-none focus:border-primary" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Ej: Diseño de Reels" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Protocolo de Instrucción</label>
                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 outline-none focus:border-primary resize-none italic leading-relaxed" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Detalla los requisitos maestros..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Fecha Limite</label>
                  <input type="date" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-primary" value={taskForm.date} onChange={e => setTaskForm({...taskForm, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Punto de Acceso (URL)</label>
                  <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-primary italic" value={taskForm.driveLink} onChange={e => setTaskForm({...taskForm, driveLink: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-white/5 text-slate-500 font-black text-[10px] uppercase rounded-[2rem] hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-premium flex-2 py-5 text-white font-black text-[11px] uppercase rounded-[2rem] shadow-2xl">{isSubmitting ? 'Procesando...' : 'Desplegar Tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => { if(!isEditingDetail) setSelectedTaskDetail(null); }}>
          <div className="max-w-2xl w-full glass-panel border border-white/10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-12 flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-xl">
                    <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
                  </div>
                  <div className="min-w-0">
                    {isEditingDetail ? (
                      <input className="bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white font-black text-xl outline-none w-full italic" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                    ) : (
                      <h3 className="text-xl sm:text-3xl font-black text-white truncate max-w-[200px] sm:max-w-md uppercase tracking-tighter italic">{selectedTaskDetail.title}</h3>
                    )}
                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mt-2">{selectedTaskDetail.date} • {selectedTaskDetail.status}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                    {!isEditingDetail && (
                        <>
                            <button onClick={handleDuplicate} className="w-10 h-10 bg-white/5 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all border border-white/5 shadow-lg flex items-center justify-center" title="Duplicar Tarea"><span className="material-symbols-outlined text-xl">content_copy</span></button>
                            <button onClick={() => { setIsEditingDetail(true); setEditForm(selectedTaskDetail); }} className="w-10 h-10 bg-white/5 rounded-2xl text-slate-400 hover:text-primary transition-all border border-white/5 shadow-lg flex items-center justify-center"><span className="material-symbols-outlined text-xl">edit_note</span></button>
                        </>
                    )}
                    <button onClick={() => setSelectedTaskDetail(null)} className="w-10 h-10 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all border border-white/5 shadow-lg flex items-center justify-center"><span className="material-symbols-outlined text-xl">close</span></button>
                </div>
             </div>
             
             <div className="flex-1 space-y-8 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
                       {projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl ? <img src={projects.find(p => p.id === selectedTaskDetail.projectId)?.logoUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-600">business</span>}
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">Marca</p>
                      <p className="text-sm font-black text-white uppercase">{projects.find(p => p.id === selectedTaskDetail.projectId)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
                       {usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar ? <img src={usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.avatar} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-600">person</span>}
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">Responsable</p>
                      <p className="text-sm font-black text-white uppercase">{usersDB.find(u => u.id === selectedTaskDetail.collaboratorId)?.firstName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Protocolo de Ejecución</label>
                  {isEditingDetail ? (
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white text-sm h-40 resize-none outline-none italic leading-relaxed" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  ) : (
                    <div className="bg-white/[0.03] p-8 rounded-[2rem] text-slate-300 text-sm italic border border-white/5 whitespace-pre-wrap leading-relaxed shadow-inner">"{selectedTaskDetail.description || 'Sin instrucciones maestras definidas.'}"</div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">cloud_done</span> Bóveda de Entrega
                  </label>
                  {isEditingDetail ? (
                    <input className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none italic" value={editForm.driveLink || ''} onChange={e => setEditForm({...editForm, driveLink: e.target.value})} />
                  ) : selectedTaskDetail.driveLink ? (
                    <a href={selectedTaskDetail.driveLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-primary/10 border border-primary/20 rounded-[2rem] group hover:bg-primary transition-all shadow-2xl">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">rocket_launch</span>
                        <span className="text-xs font-black uppercase text-primary group-hover:text-white tracking-widest">Acceder al material de despliegue</span>
                      </div>
                      <span className="material-symbols-outlined text-primary group-hover:text-white">open_in_new</span>
                    </a>
                  ) : (
                    <div className="p-8 border border-dashed border-white/10 rounded-[2rem] text-center bg-white/[0.01]">
                      <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">No se ha vinculado material de entrega aún.</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex gap-4 mt-12 shrink-0">
               {isEditingDetail ? (
                 <>
                   <button onClick={() => setIsEditingDetail(false)} className="flex-1 py-5 bg-white/5 text-slate-500 font-black text-[10px] uppercase rounded-[2rem] hover:text-white transition-colors">Cancelar Redacción</button>
                   <button onClick={handleSaveEdit} disabled={isSubmitting} className="btn-premium flex-1 py-5 text-white font-black text-[11px] uppercase rounded-[2rem] shadow-2xl">{isSubmitting ? 'Sincronizando...' : 'Sincronizar Cambios'}</button>
                 </>
               ) : (
                 <>
                   <button onClick={handleDeleteClick} disabled={isSubmitting} className={`flex-1 py-5 font-black text-[10px] uppercase rounded-[2rem] border transition-all ${confirmDeleteStep ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white shadow-xl'}`}>
                     {isSubmitting ? 'Borrando...' : confirmDeleteStep ? '¿CONFIRMAR PURGA?' : 'Eliminar Tarea'}
                   </button>
                   <button onClick={async () => { await toggleTaskStatus(selectedTaskDetail.id); setSelectedTaskDetail(null); }} className={`flex-2 py-5 font-black text-[11px] uppercase rounded-[2rem] shadow-2xl transition-all active:scale-95 border border-white/10 ${selectedTaskDetail.status === 'Completada' ? 'bg-slate-800 text-slate-400' : 'btn-premium text-white'}`}>
                     {selectedTaskDetail.status === 'Completada' ? 'Reabrir Protocolo' : 'Finalizar Misión'}
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
