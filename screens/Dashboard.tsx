
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, currentUser, dashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle, performances } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  const myTasks = useMemo(() => tasks.filter(t => String(t.collaboratorId) === String(currentUser?.id)), [tasks, currentUser]);
  const pendingTasksCount = myTasks.filter(t => t.status === 'Pendiente').length;
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  // --- NEW METRICS CALCULATIONS ---
  const currentMonthNum = new Date().getMonth();
  const currentYearNum = new Date().getFullYear();
  const currentMonthStr = String(currentMonthNum + 1).padStart(2, '0');
  
  // Tasks Donut logic
  const currentMonthTasks = tasks.filter(t => t.date.startsWith(`${currentYearNum}-${currentMonthStr}`));
  const completedMonthTasks = currentMonthTasks.filter(t => t.status === 'Completada').length;
  const pendingMonthTasks = currentMonthTasks.filter(t => t.status === 'Pendiente').length;
  const taskData = [
    { name: 'Completadas', value: completedMonthTasks, color: '#8c2bee' },
    { name: 'Pendientes', value: pendingMonthTasks, color: '#f97316' }
  ];

  // Performance Bar logic (Previous Month)
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthName = previousMonthDate.toLocaleString('es-ES', { month: 'long' }).toLowerCase();
  const previousMonthYearNum = previousMonthDate.getFullYear();
  
  const previousPerformances = performances.filter(p => p.month.toLowerCase() === previousMonthName && p.year === previousMonthYearNum);
  
  let totalReach = 0;
  let totalInteractions = 0;
  let totalNewFollowers = 0;
  
  previousPerformances.forEach(p => {
    p.metrics.forEach(m => {
      totalReach += (m.reach || 0);
      totalInteractions += (m.interactions || 0);
      totalNewFollowers += (m.followers || 0);
    });
  });

  const performanceData = [
    { name: 'Alcance', value: totalReach },
    { name: 'Interacc.', value: totalInteractions },
    { name: 'Seguidores', value: totalNewFollowers }
  ];
  // --------------------------------

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative pattern-orbital">
      
      {/* Luces ambientales refinadas */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary/3 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="h-20 px-6 sm:px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl shrink-0 z-10">
        <div>
          <h2 className="text-xl font-black text-white tracking-tighter">Hola, {currentUser?.firstName || 'Socio'} <span className="text-primary">.</span></h2>
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
                   <h1 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{dashboardBannerTitle || 'Intelligence Hub'}</h1>
                   <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em] mt-2 leading-relaxed">{dashboardBannerSubtitle || 'Sincronización global de activos y métricas de rendimiento'}</p>
                </div>
             </div>
          </div>

          {/* Top Row: General Stats & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
            {/* General Stats Column */}
            <div className="flex flex-col gap-6 justify-between">
              <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between group hover:border-primary/30 transition-all flex-1 h-full">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Marcas Activas</p>
                  <h3 className="text-4xl font-black text-white mt-2 leading-none">{projects.length}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20 shadow-lg">
                  <span className="material-symbols-outlined text-3xl">folder_special</span>
                </div>
              </div>
              <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between group hover:border-accent-orange/30 transition-all flex-1 h-full">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mis Pendientes</p>
                  <h3 className="text-4xl font-black text-white mt-2 leading-none">{pendingTasksCount}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 text-accent-orange flex items-center justify-center group-hover:scale-110 transition-transform border border-accent-orange/20 shadow-lg">
                  <span className="material-symbols-outlined text-3xl">pending_actions</span>
                </div>
              </div>
            </div>

            {/* Tasks Donut */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl flex flex-col relative overflow-hidden group hover:border-white/10 transition-all">
               <h3 className="text-sm font-black text-white uppercase tracking-widest z-10">Misiones del Mes</h3>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 z-10">Progreso Global</p>
               
               <div className="flex-1 min-h-[180px] w-full z-10 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={taskData} dataKey="value" innerRadius={65} outerRadius={85} stroke="none" cornerRadius={10} paddingAngle={5}>
                          {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                       <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                         contentStyle={{ backgroundColor: 'rgba(10, 9, 12, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                         itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'Poppins' }}
                       />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                     <span className="text-4xl font-black text-white tracking-tighter">{currentMonthTasks.length}</span>
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Totales</span>
                  </div>
               </div>
               
               <div className="flex justify-center gap-6 mt-4 z-10 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(140,43,238,0.5)]"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Done <span className="text-primary">({completedMonthTasks})</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-orange shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Left <span className="text-accent-orange">({pendingMonthTasks})</span></span>
                  </div>
               </div>
               
               <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 blur-[50px] rounded-full z-0 group-hover:bg-primary/20 transition-all"></div>
            </div>

            {/* Performance Bar Chart */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-xl flex flex-col relative overflow-hidden group hover:border-white/10 transition-all">
               <h3 className="text-sm font-black text-white uppercase tracking-widest z-10">Rendimiento ({previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1)})</h3>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 z-10">De todas las marcas</p>
               
               <div className="flex-1 min-h-[180px] w-full z-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900, textAnchor: 'middle' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                       <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                         contentStyle={{ backgroundColor: 'rgba(10, 9, 12, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                         itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'Poppins' }}
                       />
                       <Bar dataKey="value" fill="#8c2bee" radius={[8, 8, 0, 0]} maxBarSize={50}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#8c2bee' : index === 1 ? '#f97316' : '#8c2bee'} />
                          ))}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               
               {totalReach === 0 && totalInteractions === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm z-20">
                   <div className="text-center px-6">
                     <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">monitoring</span>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Esperando métricas para mostrar el rendimiento global.</p>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Listado de Movimientos Minimalista */}
          <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden animate-in fade-in duration-1000">
            <div className="px-6 py-6 sm:px-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tighter">Nuestros Clientes</h3>
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
                      <td className="px-8 py-5 text-right text-[9px] text-slate-700 font-black tracking-widest opacity-60">{row.date}</td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                        <p className="font-black text-[8px] uppercase tracking-widest">Base de datos vacía</p>
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
