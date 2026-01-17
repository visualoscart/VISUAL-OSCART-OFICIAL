
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

  const relevantTasks = tasks.filter(t => {
    if (t.collaboratorId !== currentUser?.id) return false;
    
    const taskDate = new Date(t.date);
    const isThisMonth = taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    const isFutureButDone = taskDate > now && t.status === 'Completada';
    const isVeryRecentPast = now.getDate() <= 7 && 
                             taskDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) &&
                             t.status === 'Completada';

    return isThisMonth || isFutureButDone || isVeryRecentPast;
  });

  const completedTasks = relevantTasks.filter(t => t.status === 'Completada');
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
      description: '100% tareas del periodo a tiempo.',
      bonus: '$10 USD Bono',
      earned: isMarketingNinja,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      progress: evaluationSet.length > 0 ? (evaluationSet.filter(t => t.status === 'Completada').length / evaluationSet.length) * 100 : 0,
      requirement: 'Puntualidad Absoluta'
    },
    {
      id: 'master',
      title: 'Strategy Master',
      icon: 'verified',
      description: '100% tareas con 7 días de anticipación.',
      bonus: '$20 USD Bono',
      earned: isStrategyMaster,
      color: 'from-amber-400 to-orange-600',
      shadow: 'shadow-amber-500/20',
      progress: evaluationSet.length > 0 ? (evaluationSet.filter(t => {
        if (!t.completedAt) return false;
        const diffDays = Math.floor((new Date(t.date).getTime() - new Date(t.completedAt).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
      }).length / evaluationSet.length) * 100 : 0,
      requirement: 'Anticipación Crítica'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative font-display pattern-orbital">
      
      <div className="absolute -top-12 -right-12 w-[450px] h-[450px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 shrink-0 bg-background-dark/30 backdrop-blur-2xl z-10">
        <div className="flex items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Rendimiento <span className="text-primary">& Bonos</span></h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Ciclo Operativo Mensual • {now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 text-center backdrop-blur-md shadow-xl">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">Sincronización</p>
               <p className="text-base font-black text-white leading-tight mt-0.5">{completedTasks.length} / {relevantTasks.length}</p>
            </div>
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-2xl">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-hide relative z-0">
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
          {!allTasksDone && evaluationSet.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl flex items-center gap-5 text-amber-500 backdrop-blur-sm animate-pulse shadow-xl">
               <span className="material-symbols-outlined text-2xl">bolt</span>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Status: Protocolo en Despliegue</p>
                  <p className="text-sm opacity-80 leading-relaxed font-bold">Consolida las misiones pendientes para calificar en los incentivos del periodo actual.</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {LOGROS_CONFIG.map((logro) => (
              <div 
                key={logro.id} 
                className={`relative group glass-panel rounded-[2.5rem] p-10 overflow-hidden transition-all duration-500 border shadow-2xl ${
                  logro.earned ? `border-primary/20 bg-primary/5` : 'border-white/5 opacity-80 grayscale-[0.5]'
                }`}
              >
                <div className={`absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-br ${logro.color} blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${logro.color} flex items-center justify-center text-white shadow-2xl border border-white/20 transition-transform group-hover:scale-110`}>
                      <span className="material-symbols-outlined text-4xl">{logro.icon}</span>
                    </div>
                    {logro.earned ? (
                      <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 shadow-lg">
                        PROTOCOL OK
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/5">
                        DESPLIEGUE...
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 italic tracking-tight uppercase">{logro.title}</h3>
                  <p className="text-slate-400 text-xs italic leading-relaxed mb-10 flex-1 opacity-70">"{logro.description}"</p>
                  
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{logro.requirement}</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${logro.earned ? 'text-primary' : 'text-slate-500'}`}>{Math.round(logro.progress)}%</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                       <div 
                        className={`h-full bg-gradient-to-r ${logro.color} rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: `${Math.min(logro.progress, 100)}%` }}
                       ></div>
                    </div>
                    <div className={`mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-all shadow-lg ${logro.earned ? 'border-primary/20' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                        <span className="text-sm font-black text-white uppercase italic tracking-tight">{logro.bonus}</span>
                      </div>
                      {logro.earned && <span className="material-symbols-outlined text-primary text-xl animate-bounce">check_circle</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel border border-white/5 rounded-[3rem] p-10 flex flex-col sm:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden group bg-white/[0.01]">
             <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
             <div className="space-y-3 text-center sm:text-left relative z-10">
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Balance <span className="text-primary">Incentivo</span></h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">CIERRE DE CICLO: <span className="text-primary font-black ml-2">{formattedClosingDate}</span></p>
                <div className="flex items-center gap-3 mt-6 justify-center sm:justify-start">
                   <span className="material-symbols-outlined text-rose-500 text-lg">timer</span>
                   <span className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{daysRemaining} días para el desembolso</span>
                </div>
             </div>
             
             <div className="flex items-center gap-12 relative z-10">
                <div className="text-center">
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 opacity-60">Acumulado Total</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-emerald-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">${(isMarketingNinja ? 10 : 0) + (isStrategyMaster ? 20 : 0)}</span>
                      <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest italic">USD</span>
                   </div>
                </div>
                <div className="w-px h-16 bg-white/10 hidden sm:block"></div>
                <div className="text-center">
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 opacity-60">Estado Actual</p>
                   <div className={`px-6 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${
                      allTasksDone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                   }`}>
                      {allTasksDone ? 'QUALIFIED' : 'PENDING'}
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
