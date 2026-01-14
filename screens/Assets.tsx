
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Assets: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteMediaAsset } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Imagen' | 'Video' | 'Archivo'>('Todos');
  const [brandFilter, setBrandFilter] = useState('Todas');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Recopilar todos los activos de todos los proyectos
  const allMediaAssets = projects.flatMap(p => 
    p.mediaRepository.map(asset => ({
      ...asset,
      projectName: p.name,
      projectId: p.id,
      projectLogo: p.logoUrl
    }))
  );

  // Filtrado lógico
  const filteredAssets = allMediaAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'Todos' || asset.type === typeFilter;
    const matchesBrand = brandFilter === 'Todas' || asset.projectName === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  // Temporizador para resetear borrado
  useEffect(() => {
    if (deletingId) {
      const timer = setTimeout(() => setDeletingId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletingId]);

  const handleRequestDelete = (projectId: string, assetId: string) => {
    if (deletingId === assetId) {
      deleteMediaAsset(projectId, assetId);
      setDeletingId(null);
    } else {
      setDeletingId(assetId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden font-display text-white">
      <header className="px-8 py-8 border-b border-white/5 bg-background-dark/50 backdrop-blur shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Bóveda Global de Activos</h2>
            <p className="text-slate-500 text-sm mt-1">Biblioteca consolidada de recursos multimedia del estudio.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">Almacenamiento Total</span>
               <span className="text-xl font-black text-white">{allMediaAssets.length} Archivos</span>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
          </div>
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="px-8 py-4 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input 
            type="text"
            placeholder="Buscar por nombre de archivo..."
            className="w-full pl-12 pr-4 py-3 bg-card-dark border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="bg-card-dark border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 outline-none focus:border-primary"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="Todas">Todas las Marcas</option>
            {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>

          <div className="flex bg-card-dark p-1 rounded-2xl border border-white/5">
            {['Todos', 'Imagen', 'Video', 'Archivo'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t as any)}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  typeFilter === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
        <div className="max-w-[1600px] mx-auto">
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="group relative flex flex-col bg-card-dark border border-white/5 rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all shadow-xl animate-in zoom-in-95 duration-300"
                >
                  {/* PREVIEW */}
                  <div className="aspect-square bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {asset.type === 'Imagen' ? (
                      <img src={asset.url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={asset.name} />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-6xl text-slate-800 group-hover:text-primary/40 transition-colors">
                          {asset.type === 'Video' ? 'movie' : 'description'}
                        </span>
                      </div>
                    )}

                    {/* OVERLAY ACTIONS */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                       <div className="flex gap-3">
                         <a 
                          href={asset.url} 
                          download={asset.name}
                          className="p-4 bg-primary rounded-2xl text-white shadow-2xl hover:scale-110 transition-transform active:scale-95"
                         >
                           <span className="material-symbols-outlined">download</span>
                         </a>
                         <button 
                          onClick={() => handleRequestDelete(asset.projectId, asset.id)}
                          className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-95 ${
                            deletingId === asset.id ? 'bg-rose-600 animate-pulse' : 'bg-rose-500 hover:bg-rose-600'
                          }`}
                         >
                           <span className="material-symbols-outlined">
                            {deletingId === asset.id ? 'warning' : 'delete'}
                           </span>
                         </button>
                       </div>
                       {deletingId === asset.id && (
                         <span className="text-[10px] font-black text-rose-500 bg-white px-3 py-1 rounded-full animate-bounce">¡CLIC PARA BORRAR!</span>
                       )}
                       
                       <button 
                        onClick={() => navigate(`/projects/${asset.projectId}`)}
                        className="text-[9px] font-black text-white/60 hover:text-white uppercase tracking-widest mt-2 flex items-center gap-1"
                       >
                        Ver en Marca <span className="material-symbols-outlined text-xs">open_in_new</span>
                       </button>
                    </div>

                    {/* BRAND TAG */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 max-w-[80%]">
                       <img src={asset.projectLogo || "https://picsum.photos/50/50?random=1"} className="w-4 h-4 rounded-full object-cover" />
                       <span className="text-[9px] font-black text-white uppercase truncate">{asset.projectName}</span>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="p-5">
                    <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter mb-1">{asset.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-xs ${asset.type === 'Imagen' ? 'text-blue-400' : asset.type === 'Video' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {asset.type === 'Imagen' ? 'image' : asset.type === 'Video' ? 'movie' : 'description'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{asset.type}</span>
                      </div>
                      <span className="text-[9px] text-slate-600 font-bold">{asset.size || '---'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-700">
               <div className="w-24 h-24 bg-card-dark rounded-full flex items-center justify-center mb-6 border border-white/5">
                 <span className="material-symbols-outlined text-5xl text-slate-800">cloud_off</span>
               </div>
               <h3 className="text-xl font-black text-white mb-2">No se encontraron archivos</h3>
               <p className="text-slate-500 max-w-xs">Prueba ajustando los filtros o sube material directamente en la Bóveda Creativa de cada marca.</p>
               <button 
                onClick={() => {setSearchTerm(''); setTypeFilter('Todos'); setBrandFilter('Todas');}}
                className="mt-8 px-6 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/10"
               >
                 Limpiar Filtros
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assets;
