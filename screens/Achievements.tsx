
import React from 'react';
import { useProjects } from '../context/ProjectContext';

const Achievements: React.FC = () => {
  const { tasks, currentUser } = useProjects();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysRemaining = Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formattedClosingDate = lastDayOfMonth.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });

  // Lógica mejorada: Tareas que cuentan para el periodo actual
  // 1. Tareas con fecha de entrega en este mes.
  // 2. Tareas con fecha de entrega futura PERO ya completadas (Trabajo anticipado).
  const relevantTasks = tasks.filter(t => {
    if (t.collaboratorId !== currentUser?.id) return false;
    
    const taskDate = new Date(t.date);
    const isThisMonth = taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    const isFutureButDone = taskDate > now && t.status === 'Completada';
    
    // Si estamos en la primera semana, también mostramos las de la última semana del mes pasado para referencia
    const isVeryRecentPast = now.getDate() <= 7 && 
                             taskDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) &&
                             t.status === 'Completada';

    return isThisMonth || isFutureButDone || isVeryRecentPast;
  });

  const completedTasks = relevantTasks.filter(t => t.status === 'Completada');

  // Para los logros, evaluamos sobre el set de tareas del mes actual + las futuras terminadas
  const evaluationSet = relevantTasks.filter(t => {
      const d = new Date(t.date);
      return (d.getMonth() === currentMonth && d.getFullYear() === currentYear) || (d > now && t.status === 'Completada');
  });

  const allTasksDone = evaluationSet.length > 0 && evaluationSet.every(t => t.status === 'Completada');

  const isMarketingNinja = allTasksDone && evaluationSet.every(t => {
    if (!t.completedAt) return false;
    const deadline = new Date(t.date);
    const completedDate = new Date(t.completedAt);
    return completedDate <= deadline;
  });

  const isStrategyMaster = allTasksDone && evaluationSet.every(t => {
    if (!t.completedAt) return false;
    const deadline = new Date(t.date);
    const completedDate = new Date(t.completedAt);
    const diffTime = deadline.getTime() - completedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    return diffDays >= 7;
  });

  const LOGROS_CONFIG = [
    {
      id: 'ninja',
      title: 'Marketing Ninja',
      icon: 'military_tech',
      description: 'Completa el 100% de tus tareas del periodo a tiempo.',
      bonus: '$10 USD Bono Mensual',
      earned: isMarketingNinja,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      progress: evaluationSet.length > 0 ? (evaluationSet.filter(t => t.status === 'Completada').length / evaluationSet.length) * 100 : 0,
      requirement: 'Perfección Puntual'
    },
    {
      id: 'master',
      title: 'Strategy Master',
      icon: 'verified',
      description: 'Completa el 100% de tus tareas con al menos 7 días de anticipación. (Incluye tareas del mes siguiente adelantadas)',
      bonus: '$20 USD Bono Mensual',
      earned: isStrategyMaster,
      color: 'from-amber-400 to-orange-600',
      shadow: 'shadow-amber-500/20',
      progress: evaluationSet.length > 0 ? (evaluationSet.filter(t => {
        if (!t.completedAt) return false;
        const diffDays = Math.floor((new Date(t.date).getTime() - new Date(t.completedAt).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
      }).length / evaluationSet.length) * 100 : 0,
      requirement: 'Maestría Anticipada'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden font-display">
      <header className="px-8 py-8 border-b border-white/5 shrink-0 bg-background-dark/50 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Centro de Logros y Bonos</h2>
            <p className="text-slate-500 text-sm mt-1">Evaluación de Desempeño • {now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tareas en Evaluación</p>
               <p className="text-lg font-black text-white">{completedTasks.length} / {relevantTasks.length}</p>
            </div>
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {!allTasksDone && evaluationSet.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-center gap-4 text-amber-500">
               <span className="material-symbols-outlined text-4xl">bolt</span>
               <div>
                  <p className="text-sm font-black uppercase tracking-widest">Estado: Operación en curso</p>
                  <p className="text-xs opacity-80">Completa las tareas pendientes para calificar a los bonos de este periodo.</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {LOGROS_CONFIG.map((logro) => (
              <div 
                key={logro.id} 
                className={`relative group bg-card-dark border rounded-[2.5rem] p-8 overflow-hidden transition-all duration-500 ${
                  logro.earned ? `border-white/10 ${logro.shadow}` : 'border-white/5 opacity-80 grayscale'
                }`}
              >
                <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${logro.color} blur-3xl opacity-5 group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${logro.color} flex items-center justify-center text-white shadow-2xl`}>
                      <span className="material-symbols-outlined text-3xl">{logro.icon}</span>
                    </div>
                    {logro.earned ? (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                        Calificado
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">
                        En Progreso
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{logro.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6 flex-1">{logro.description}</p>
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{logro.requirement}</span>
                      <span className={`text-[10px] font-black uppercase ${logro.earned ? 'text-primary' : 'text-slate-500'}`}>{Math.round(logro.progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div 
                        className={`h-full bg-gradient-to-r ${logro.color} rounded-full transition-all duration-1000`} 
                        style={{ width: `${Math.min(logro.progress, 100)}%` }}
                       ></div>
                    </div>
                    <div className={`mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 ${logro.earned ? 'border-primary/20' : ''}`}>
                      <span className="material-symbols-outlined text-primary text-lg">payments</span>
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">{logro.bonus}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
             <div className="space-y-2 text-center md:text-left">
                <h4 className="text-2xl font-black text-white">Estado de Liquidación</h4>
                <p className="text-slate-500 text-sm font-medium">Cierre de Mes: <span className="text-primary font-black">{formattedClosingDate}</span></p>
                <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                   <span className="material-symbols-outlined text-rose-500 text-sm">schedule</span>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{daysRemaining} días para el corte de nómina</span>
                </div>
             </div>
             
             <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-16">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bonos Estimados</p>
                   <div className="flex items-center gap-2">
                      <span className="text-4xl font-black text-emerald-400">${(isMarketingNinja ? 10 : 0) + (isStrategyMaster ? 20 : 0)}</span>
                      <span className="text-slate-500 font-bold text-xs uppercase">USD</span>
                   </div>
                </div>
                <div className="w-px h-16 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Estatus Global</p>
                   <div className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${
                      allTasksDone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'
                   }`}>
                      {allTasksDone ? 'OBJETIVOS CUMPLIDOS' : 'PENDIENTES'}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
