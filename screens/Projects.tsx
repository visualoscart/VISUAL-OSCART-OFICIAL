
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteProject, updateProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Activas');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleTogglePause = async (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    if (p.status === 'Inactivo') {
      await updateProject(p.id, { status: 'En Progreso', typography: { ...p.typography, inactiveAt: undefined } });
    } else {
      await updateProject(p.id, { status: 'Inactivo', typography: { ...p.typography, inactiveAt: new Date().toISOString() } });
    }
  };

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
    const matchesFilter = filter === 'Todas' || 
                         (filter === 'Activas' && p.status !== 'Inactivo') ||
                         (filter === 'Inactivas' && p.status === 'Inactivo');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden font-display relative pattern-orbital">
      
      {/* Luces ambientales animadas */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none animate-pulse duration-7000"></div>

      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 z-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Marcas <span className="text-primary">Estratégicas</span></h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1 opacity-60">Biblioteca corporativa y centros de activos</p>
        </div>
        <button 
          onClick={() => navigate('/validation')}
          className="btn-premium relative overflow-hidden group px-8 py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 self-start md:self-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <span className="material-symbols-outlined font-black relative z-10">add_circle</span>
          <span className="relative z-10">Nueva Marca</span>
        </button>
      </header>

      <div className="px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 shrink-0 bg-white/[0.02] backdrop-blur-md z-10">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
          <input 
            type="text"
            placeholder="Buscar marca o nicho..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 relative">
          {['Activas', 'Inactivas', 'Todas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`relative px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all z-10 duration-300 ${
                filter === tab ? 'text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter === tab && (
                <div className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/30 -z-10" />
              )}
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
                  className="glass-panel rounded-[2.5rem] p-8 border border-white/5 hover:border-primary/50 transition-all duration-500 group cursor-pointer flex flex-col h-full relative overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 animate-in slide-in-from-bottom-8 fade-in"
                  style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-colors duration-500 pointer-events-none" />
                  <div className="flex justify-between items-start mb-8">
                    {/* LOGO CORREGIDO: Full cover, sin paddings, coherente con sidebar */}
                    <div className="relative group/logo">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                        <img 
                          src={project.logoUrl || "https://picsum.photos/100/100?random=logo"} 
                          className="w-full h-full object-cover" 
                          alt="Brand Logo" 
                        />
                      </div>
                      {project.brandCode && (
                        <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-primary text-[7px] font-black rounded-md shadow-lg border border-white/10 z-10 uppercase tracking-tighter">
                          {project.brandCode}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 relative z-20">
                       <button 
                         onClick={(e) => handleTogglePause(e, project)}
                         className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/5 text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 border border-white/5"
                         title={project.status === 'Inactivo' ? 'Reanudar Marca' : 'Pausar Marca'}
                       >
                         <span className="material-symbols-outlined text-base">{project.status === 'Inactivo' ? 'play_arrow' : 'pause'}</span>
                       </button>
                       <button 
                         onClick={(e) => handleRequestDelete(e, project.id)}
                         className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                           deletingId === project.id ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5'
                         }`}
                         title="Eliminar Marca"
                       >
                         <span className="material-symbols-outlined text-base">{deletingId === project.id ? 'warning' : 'delete'}</span>
                       </button>
                    </div>
                  </div>

                  {project.status === 'Inactivo' && project.typography?.inactiveAt && (
                    <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 relative z-10">
                      <span className="material-symbols-outlined text-rose-500 text-sm">timer</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/80">
                        Eliminación en {Math.max(0, 60 - Math.ceil(Math.abs(new Date().getTime() - new Date(project.typography.inactiveAt).getTime()) / (1000 * 60 * 60 * 24)))} días
                      </p>
                    </div>
                  )}

                  <div className="mb-8 relative z-10">
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors duration-500 tracking-tight uppercase">{project.name}</h3>
                    <p className="text-primary text-[9px] font-medium uppercase tracking-[0.2em] mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity">{project.niche}</p>
                    <p className="text-slate-500 text-xs mt-4 line-clamp-2 font-normal leading-relaxed opacity-70 group-hover:text-slate-400 transition-colors">"{project.brief || 'Sin brief definido.'}"</p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                    <div className="flex -space-x-3 group/avatars">
                      {project.collaborators.slice(0, 3).map((c, i) => (
                        <img 
                          key={i}
                          src={c.avatar} 
                          className="w-9 h-9 rounded-2xl border-2 border-background-dark object-cover shadow-lg hover:-translate-y-2 hover:scale-110 hover:z-20 transition-all duration-300" 
                          alt={c.name} 
                        />
                      ))}
                      {project.collaborators.length > 3 && (
                        <div className="w-9 h-9 rounded-2xl bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary border-2 border-background-dark shadow-lg hover:-translate-y-2 hover:scale-110 hover:z-20 transition-all duration-300">
                          +{project.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5 opacity-60 group-hover:text-primary group-hover:opacity-100 transition-all duration-500">
                      <span className="material-symbols-outlined text-base group-hover:animate-bounce">inventory_2</span>
                      {project.textRepository.length + project.mediaRepository.length} Activos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse" />
                <div className="relative w-24 h-24 glass-panel rounded-full flex items-center justify-center mb-6 border border-white/10 animate-[bounce_3s_infinite]">
                  <span className="material-symbols-outlined text-5xl text-primary/50">business</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Sin Marcas en Flujo</h3>
              <p className="text-slate-500 max-w-xs leading-relaxed uppercase font-medium text-[9px] tracking-widest opacity-60">Inicia el despliegue estratégico para comenzar la gestión de activos.</p>
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
