
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, Search, ArrowRight, MousePointer2 } from 'lucide-react';

const Strategy: React.FC = () => {
  const { projects, searchProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent relative pattern-orbital p-8 overflow-y-auto scrollbar-hide">
      {/* Luces ambientales refinadas */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary/3 blur-[100px] rounded-full pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            Estrategia de Marca
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Gestión Táctica y Rendimiento Mensual
          </p>
        </div>

        <div className="relative group w-full md:w-96">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            placeholder="BUSCAR MARCA POR NOMBRE..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm uppercase tracking-wider"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel rounded-[2.5rem] p-8 flex flex-col gap-8 group hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-black/40"
            >
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
                <div className="flex-1 min-w-0 space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Activa</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 gap-4">
                {/* CAMPAIGNS BUTTON */}
                <button
                  onClick={() => navigate(`/campaigns?project=${project.id}`)}
                  className="flex items-center gap-4 bg-white/5 hover:bg-primary border border-white/5 hover:border-primary-light p-5 rounded-2xl group/btn transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 group-hover/btn:bg-white/20 flex items-center justify-center text-primary group-hover/btn:text-white transition-colors shrink-0">
                    <Target size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Marketing</p>
                    <p className="text-sm font-black text-slate-400 group-hover/btn:text-white/80 uppercase italic tracking-tighter truncate">Gestión de Campañas</p>
                  </div>
                  <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0">
                    <ArrowRight size={20} color="white" />
                  </div>
                </button>

                {/* PERFORMANCE BUTTON */}
                <button
                  onClick={() => navigate(`/performance?project=${project.id}`)}
                  className="flex items-center gap-4 bg-white/5 hover:bg-accent-orange border border-white/5 hover:border-accent-orange-light p-5 rounded-2xl group/btn transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 group-hover/btn:bg-white/20 flex items-center justify-center text-accent-orange group-hover/btn:text-white transition-colors shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Analítica</p>
                    <p className="text-sm font-black text-slate-400 group-hover/btn:text-white/80 uppercase italic tracking-tighter truncate">Reporte de Rendimiento</p>
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
              <p className="text-xl font-bold text-white uppercase italic tracking-tight">No se encontraron marcas</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Intenta con otro término de búsqueda</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Strategy;
