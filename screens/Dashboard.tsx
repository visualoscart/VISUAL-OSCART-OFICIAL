
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, currentUser, receipts, dashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  const myTasks = useMemo(() => tasks.filter(t => String(t.collaboratorId) === String(currentUser?.id)), [tasks, currentUser]);
  const pendingTasksCount = myTasks.filter(t => t.status === 'Pendiente').length;
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative pattern-orbital">
      
      {/* Luces ambientales refinadas */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary/3 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="h-20 px-6 sm:px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl shrink-0 z-10">
        <div>
          <h2 className="text-xl font-black text-white italic tracking-tighter">Hola, {currentUser?.firstName || 'Socio'} <span className="text-primary">.</span></h2>
          <p className="text-slate-600 text-[7px] font-black uppercase tracking-[0.3em] mt-0.5 opacity-60">Centro de Operaciones Digitales</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-56 hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 text-xs">search</span>
            <input 
              className="w-full pl-9 pr-3 py-2 bg-white/3 border border-white/5 rounded-xl text-[10px] text-white outline-none focus:border-primary/30 transition-all font-bold" 
              placeholder="Buscar marca..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => navigate('/validation')} 
            className="btn-premium text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xs">add_circle</span>
            Nueva Marca
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative z-10">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          
          {/* Dashboard Superior Banner */}
          <div className="w-full h-32 lg:h-44 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 relative group bg-slate-900 animate-in fade-in zoom-in-95 duration-700">
             <img src={dashboardBanner} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Dashboard Hub" />
             <div className="absolute inset-0 bg-gradient-to-r from-background-dark/60 to-transparent flex items-center px-12">
                <div className="max-w-md">
                   <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg leading-tight">{dashboardBannerTitle || 'Intelligence Hub'}</h1>
                   <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em] mt-2 leading-relaxed">{dashboardBannerSubtitle || 'Sincronización global de activos y métricas de rendimiento'}</p>
                </div>
             </div>
          </div>

          {/* Métricas Compactas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Marcas Activas', val: projects.length, icon: 'folder_copy', color: 'text-primary' },
              { title: 'Mis Pendientes', val: pendingTasksCount, icon: 'pending_actions', color: 'text-accent-orange' },
              { title: 'Liquidaciones', val: receipts.length, icon: 'payments', color: 'text-emerald-500' },
              { title: 'Eficiencia', val: '98%', icon: 'bolt', color: 'text-primary' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="glass-panel p-5 sm:p-6 rounded-[1.5rem] border border-white/5 hover:border-primary/10 transition-all group animate-in slide-in-from-bottom-2 duration-500 shadow-lg" 
                style={{ animationDelay: `${i*100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">{stat.title}</p>
                  <div className={`w-8 h-8 rounded-lg bg-white/3 flex items-center justify-center ${stat.color} border border-white/5`}>
                    <span className="material-symbols-outlined text-base">{stat.icon}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter">{stat.val}</h3>
              </div>
            ))}
          </div>

          {/* Listado de Movimientos Minimalista */}
          <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden animate-in fade-in duration-1000">
            <div className="px-6 py-6 sm:px-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tighter italic">Movimientos <span className="text-primary">Recientes</span></h3>
                <p className="text-[6px] font-black text-slate-700 uppercase tracking-widest mt-0.5">Sincronización global en tiempo real</p>
              </div>
              <button 
                onClick={() => navigate('/projects')} 
                className="px-4 py-2 bg-white/3 hover:bg-white/5 rounded-lg text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-widest border border-white/5 transition-all"
              >
                Ver Catálogo
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/3 text-[7px] uppercase text-slate-700 font-black tracking-[0.2em]">
                  <tr className="border-b border-white/5">
                    <th className="px-8 py-4">Marca</th>
                    <th className="px-8 py-4 text-center">Nicho</th>
                    <th className="px-8 py-4 text-center">Estatus</th>
                    <th className="px-8 py-4 text-right">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProjects.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => navigate(`/projects/${row.id}`)} 
                      className="hover:bg-white/[0.01] transition-all cursor-pointer group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group-hover:scale-105 transition-transform shrink-0 shadow-lg">
                            <img 
                              src={row.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${row.name}`} 
                              className="w-full h-full object-cover transition-all" 
                              alt={row.name}
                            />
                          </div>
                          <div>
                            <span className="text-xs font-black text-white uppercase tracking-tight block">{row.name}</span>
                            <span className="text-[7px] text-slate-700 font-bold uppercase tracking-widest">{row.client}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-white/3 px-3 py-1.5 rounded-lg border border-white/5">
                          {row.niche}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                          row.status === 'Completado' 
                            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                            : 'bg-primary/5 text-primary border-primary/10'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-[9px] text-slate-700 font-black tracking-widest opacity-60 italic">{row.date}</td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                        <p className="font-black text-[8px] uppercase tracking-widest italic">Base de datos vacía</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-white/[0.005] border-t border-white/5 text-center">
              <p className="text-[6px] font-black text-slate-800 uppercase tracking-[0.5em]">Visual Studio Flow Engine v3.5.2 • Minimalistic Protocol</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
