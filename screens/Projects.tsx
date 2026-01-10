
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
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden font-display">
      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Marcas Estratégicas</h2>
          <p className="text-slate-400 text-sm mt-1">Biblioteca corporativa y centros de operaciones por cliente.</p>
        </div>
        <button 
          onClick={() => navigate('/validation')}
          className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-hover shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3 self-start md:self-center"
        >
          <span className="material-symbols-outlined font-black">add_circle</span>
          Nueva Marca
        </button>
      </header>

      <div className="px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 shrink-0 bg-white/[0.01]">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input 
            type="text"
            placeholder="Buscar marca o nicho..."
            className="w-full pl-10 pr-4 py-2.5 bg-card-dark border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-card-dark p-1 rounded-xl border border-white/5">
          {['Todos', 'Activos', 'Revisión', 'Completados'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === tab ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
        <div className="max-w-7xl mx-auto">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-card-dark border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/40 transition-all group cursor-pointer flex flex-col h-full relative overflow-hidden shadow-xl animate-in zoom-in-95 duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <img 
                      src={project.logoUrl || "https://picsum.photos/100/100?random=logo"} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg group-hover:scale-110 transition-transform" 
                      alt="Brand Logo" 
                    />
                    <div className="flex flex-col items-end gap-2">
                       <button 
                         onClick={(e) => handleRequestDelete(e, project.id)}
                         className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                           deletingId === project.id ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500'
                         }`}
                       >
                         <span className="material-symbols-outlined text-sm">{deletingId === project.id ? 'warning' : 'delete'}</span>
                       </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight">{project.name}</h3>
                    <p className="text-primary text-[9px] font-black uppercase tracking-[0.2em] mt-1">{project.niche}</p>
                    <p className="text-slate-500 text-sm mt-3 line-clamp-2 italic leading-relaxed">"{project.brief || 'Sin brief definido.'}"</p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {project.collaborators.slice(0, 3).map((c, i) => (
                        <img 
                          key={i}
                          src={c.avatar} 
                          className="w-8 h-8 rounded-full border-2 border-card-dark object-cover" 
                          alt={c.name} 
                        />
                      ))}
                      {project.collaborators.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary border-2 border-card-dark">
                          +{project.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      {project.textRepository.length + project.mediaRepository.length} Activos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-card-dark rounded-full flex items-center justify-center mb-6 border border-white/5">
                 <span className="material-symbols-outlined text-6xl text-slate-800">business</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">No hay marcas registradas</h3>
              <p className="text-slate-500 max-w-xs text-sm leading-relaxed">Comienza creando tu primera marca mediante el flujo de validación estratégica.</p>
              <button 
                onClick={() => navigate('/validation')}
                className="mt-10 px-8 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
              >
                Crear Mi Primera Marca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
