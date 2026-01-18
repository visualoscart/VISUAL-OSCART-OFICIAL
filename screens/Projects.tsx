
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (deletingId) {
      const timer = setTimeout(() => setDeletingId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletingId]);

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      deleteProject(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'Todos' || 
                         (filter === 'Activos' && p.status === 'En Progreso') ||
                         (filter === 'Revisión' && p.status === 'Revisión') ||
                         (filter === 'Completados' && p.status === 'Completado');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden font-display relative pattern-orbital">
      
      {/* Luces ambientales para coherencia con el Dashboard/Login */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Marcas <span className="text-primary">Estratégicas</span></h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1 opacity-60">Biblioteca corporativa y centros de activos</p>
        </div>
        <button 
          onClick={() => navigate('/validation')}
          className="btn-premium px-8 py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 self-start md:self-center"
        >
          <span className="material-symbols-outlined font-black">add_circle</span>
          Nueva Marca
        </button>
      </header>

      <div className="px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 shrink-0 bg-white/[0.02] backdrop-blur-md z-10">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input 
            type="text"
            placeholder="Buscar marca o nicho..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-all text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {['Todos', 'Activos', 'Revisión', 'Completados'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth scrollbar-hide relative z-10">
        <div className="max-w-7xl mx-auto">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, idx) => (
                <div 
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-panel rounded-[2.5rem] p-8 border border-white/5 hover:border-primary/40 transition-all group cursor-pointer flex flex-col h-full relative overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-8">
                    {/* LOGO CORREGIDO: Full cover, sin paddings, coherente con sidebar */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                      <img 
                        src={project.logoUrl || "https://picsum.photos/100/100?random=logo"} 
                        className="w-full h-full object-cover" 
                        alt="Brand Logo" 
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <button 
                         onClick={(e) => handleRequestDelete(e, project.id)}
                         className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                           deletingId === project.id ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5'
                         }`}
                       >
                         <span className="material-symbols-outlined text-base">{deletingId === project.id ? 'warning' : 'delete'}</span>
                       </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight italic uppercase">{project.name}</h3>
                    <p className="text-primary text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">{project.niche}</p>
                    <p className="text-slate-500 text-xs mt-4 line-clamp-2 italic leading-relaxed opacity-70">"{project.brief || 'Sin brief definido.'}"</p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {project.collaborators.slice(0, 3).map((c, i) => (
                        <img 
                          key={i}
                          src={c.avatar} 
                          className="w-9 h-9 rounded-2xl border-2 border-background-dark object-cover shadow-lg" 
                          alt={c.name} 
                        />
                      ))}
                      {project.collaborators.length > 3 && (
                        <div className="w-9 h-9 rounded-2xl bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary border-2 border-background-dark shadow-lg">
                          +{project.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                      <span className="material-symbols-outlined text-base">inventory_2</span>
                      {project.textRepository.length + project.mediaRepository.length} Activos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
              <div className="w-24 h-24 glass-panel rounded-full flex items-center justify-center mb-6 border border-white/10">
                 <span className="material-symbols-outlined text-5xl text-slate-700">business</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 italic">Sin Marcas en Flujo</h3>
              <p className="text-slate-500 max-w-xs text-sm leading-relaxed uppercase font-black text-[9px] tracking-widest opacity-60">Inicia el despliegue estratégico para comenzar la gestión de activos.</p>
              <button 
                onClick={() => navigate('/validation')}
                className="btn-premium mt-10 px-8 py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl"
              >
                Registrar Marca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
