
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, Search, ArrowRight, MousePointer2 } from 'lucide-react';

const Strategy: React.FC = () => {
  const { projects } = useProjects();
  const activeProjects = projects.filter(p => p.status !== 'Inactivo');

  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredProjects = activeProjects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative pattern-orbital" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Luces ambientales refinadas */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary/3 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg">
            <span className="material-symbols-outlined text-2xl">psychology</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Estrategia de <span className="text-primary">Marca</span></h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 opacity-60">Gestión Táctica y Rendimiento Mensual</p>
          </div>
        </div>
      </header>

      <div className="px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 shrink-0 bg-white/[0.02] backdrop-blur-md z-10">
        <div className="relative flex-1 max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input
            type="text"
            placeholder="BUSCAR MARCA O NICHO..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white font-medium placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-xs uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth scrollbar-hide relative z-10">
        <div className="max-w-7xl mx-auto w-full">
          {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel rounded-2xl sm:rounded-3xl p-8 flex flex-col gap-8 group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* BRAND HEADER */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center p-0 border border-white/10 shadow-xl relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  {project.logoUrl ? (
                    <img src={project.logoUrl} className="w-full h-full object-cover relative z-10" alt={project.name} />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-600 relative z-10">broken_image</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                </div>
                <div className="flex-1 min-w-0 space-y-1 relative z-10">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tighter leading-tight drop-shadow-md">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest leading-none">Activa</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 gap-4">
                {/* CAMPAIGNS BUTTON */}
                <button
                  onClick={() => navigate(`/campaigns?project=${project.id}`)}
                  className="flex items-center gap-4 bg-black/20 hover:bg-primary/90 border border-white/5 hover:border-primary p-5 rounded-2xl group/btn transition-all duration-300 text-left shadow-lg hover:shadow-primary/20 relative z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 group-hover/btn:bg-white/20 flex items-center justify-center text-primary group-hover/btn:text-white transition-colors shrink-0">
                    <Target size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-primary group-hover/btn:text-white/80 uppercase tracking-widest leading-none mb-1">Marketing</p>
                    <p className="text-sm font-bold text-white uppercase tracking-tighter truncate">Gestión de Campañas</p>
                  </div>
                  <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0">
                    <ArrowRight size={20} color="white" />
                  </div>
                </button>

                {/* PERFORMANCE BUTTON */}
                <button
                  onClick={() => navigate(`/performance?project=${project.id}`)}
                  className="flex items-center gap-4 bg-black/20 hover:bg-accent-orange/90 border border-white/5 hover:border-accent-orange p-5 rounded-2xl group/btn transition-all duration-300 text-left shadow-lg hover:shadow-accent-orange/20 relative z-10"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-orange/20 group-hover/btn:bg-white/20 flex items-center justify-center text-accent-orange group-hover/btn:text-white transition-colors shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-accent-orange group-hover/btn:text-white/80 uppercase tracking-widest leading-none mb-1">Analítica</p>
                    <p className="text-sm font-bold text-white uppercase tracking-tighter truncate">Reporte de Rendimiento</p>
                  </div>
                  <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0">
                    <ArrowRight size={20} color="white" />
                  </div>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-4xl text-slate-600">search_off</span>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-white uppercase tracking-tight">No se encontraron marcas</p>
              <p className="text-slate-500 text-sm font-normal">Intenta con otro término de búsqueda</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default Strategy;
