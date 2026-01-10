
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { getMarketingAdvice } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, currentUser, receipts } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAdvice, setAiAdvice] = useState('Consultando estrategia...');

  const myTasks = useMemo(() => tasks.filter(t => String(t.collaboratorId) === String(currentUser?.id)), [tasks, currentUser]);
  const pendingTasksCount = myTasks.filter(t => t.status === 'Pendiente').length;
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    const loadAdvice = async () => {
      const context = projects.length > 0 ? `Gestionando ${projects.length} marcas` : "Inicio de operaciones";
      const advice = await getMarketingAdvice(context, "Estrategia");
      setAiAdvice(advice);
    };
    loadAdvice();
  }, [projects]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark">
      <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/50 backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-xl font-display text-white">Hola, {currentUser?.firstName || 'Líder'} 👋</h2>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1 italic">Workspace Maestro</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-primary transition-all" placeholder="Buscar marcas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => navigate('/validation')} className="bg-accent-orange text-white px-5 py-2 rounded-xl text-[10px] font-display uppercase tracking-widest shadow-lg shadow-accent-orange/10 hover:scale-105 active:scale-95 transition-all">Nueva Marca</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <section className="bg-gradient-to-r from-primary/20 to-transparent border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-6 animate-in shadow-2xl">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
                <span className="material-symbols-outlined text-4xl">psychology</span>
             </div>
             <div>
                <h4 className="text-[9px] font-bold text-primary uppercase tracking-[0.3em] mb-1">Estrategia IA</h4>
                <p className="text-white text-lg font-medium italic">"{aiAdvice}"</p>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Marcas Activas', val: projects.length, icon: 'folder_copy', color: 'text-accent-orange' },
              { title: 'Mis Pendientes', val: pendingTasksCount, icon: 'pending_actions', color: 'text-amber-500' },
              { title: 'Liquidaciones', val: receipts.length, icon: 'payments', color: 'text-emerald-500' },
              { title: 'Eficiencia', val: '98%', icon: 'bolt', color: 'text-primary' },
            ].map((stat, i) => (
              <div key={i} className="bg-card-dark p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group animate-in shadow-xl" style={{ animationDelay: `${i*100}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.title}</p>
                  <span className={`material-symbols-outlined ${stat.color} opacity-30`}>{stat.icon}</span>
                </div>
                <h3 className="text-3xl font-display text-white">{stat.val}</h3>
              </div>
            ))}
          </div>

          <div className="bg-card-dark rounded-[2.5rem] border border-white/5 overflow-hidden animate-in shadow-2xl">
            <div className="p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-lg font-display text-white uppercase tracking-tight italic">Movimientos Recientes</h3>
              <button onClick={() => navigate('/projects')} className="text-[9px] font-bold text-accent-orange uppercase tracking-widest">Ver Catálogo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest"><tr className="border-b border-white/5"><th className="px-8 py-4">Marca</th><th className="px-8 py-4">Nicho</th><th className="px-8 py-4">Estatus</th><th className="px-8 py-4 text-right">Fecha</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProjects.map((row) => (
                    <tr key={row.id} onClick={() => navigate(`/projects/${row.id}`)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={row.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${row.name}`} className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                          <span className="text-sm font-bold text-white uppercase">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">{row.niche}</td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${row.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>{row.status}</span>
                      </td>
                      <td className="px-8 py-6 text-right text-[10px] text-slate-500 font-bold">{row.date}</td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest italic">No hay marcas registradas en el sistema.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
