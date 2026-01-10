
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Repository: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteTextAsset, deleteMediaAsset } = useProjects();
  const [activeTab, setActiveTab] = useState<'textos' | 'multimedia'>('textos');
  const [textFilter, setTextFilter] = useState('Todos');

  // Estas listas se recalculan cada vez que 'projects' cambia en el contexto
  const allTextAssets = projects.flatMap(p => 
    p.textRepository.map(item => ({ ...item, projectName: p.name, projectId: p.id }))
  );
  
  const allMediaAssets = projects.flatMap(p => 
    p.mediaRepository.map(item => ({ ...item, projectName: p.name, projectId: p.id }))
  );

  const filteredText = allTextAssets.filter(item => textFilter === 'Todos' || item.tag === textFilter);

  const handleConfirmDeleteText = (projectId: string, assetId: string) => {
    if (confirm('¿Deseas eliminar este texto definitivamente de su proyecto original?')) {
      deleteTextAsset(projectId, assetId);
    }
  };

  const handleConfirmDeleteMedia = (projectId: string, assetId: string) => {
    if (confirm('¿Deseas eliminar este archivo definitivamente de su proyecto original?')) {
      deleteMediaAsset(projectId, assetId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-hidden text-white">
      <header className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Bóveda Global</h2>
          <p className="text-slate-400 text-sm mt-1">Biblioteca consolidada de todos tus activos creativos.</p>
        </div>
        <div className="flex bg-card-dark p-1 rounded-xl border border-white/5 shadow-inner">
          <button onClick={() => setActiveTab('textos')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'textos' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Textos</button>
          <button onClick={() => setActiveTab('multimedia')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'multimedia' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Archivos</button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'textos' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex gap-2">
                {['Todos', 'Hooks', 'Copys', 'CTA'].map(tag => (
                  <button 
                    key={tag} onClick={() => setTextFilter(tag)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${textFilter === tag ? 'bg-primary border-primary text-white shadow-md' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredText.map((item) => (
                  <div key={item.id} className="bg-card-dark border border-white/5 rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col h-full relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20 tracking-widest">{item.tag}</span>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/projects/${item.projectId}`)} className="text-slate-500 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase transition-all" title="Ir al proyecto">
                          <span className="material-symbols-outlined text-sm">link</span>{item.projectName}
                        </button>
                        <button onClick={() => handleConfirmDeleteText(item.projectId, item.id)} className="text-rose-500/50 hover:text-rose-500 transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-slate-400 text-sm italic leading-relaxed mb-6 line-clamp-3">"{item.content}"</p>
                    <button onClick={() => navigator.clipboard.writeText(item.content)} className="mt-auto p-2 bg-white/5 hover:bg-primary text-slate-400 hover:text-white rounded-lg transition-all self-end shadow-inner" title="Copiar contenido">
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                ))}
                {filteredText.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                    No se encontraron activos de texto.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
              {allMediaAssets.map((asset) => (
                <div key={asset.id} className="group flex flex-col bg-card-dark border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all animate-in zoom-in-95 duration-200">
                  <div className="aspect-square bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    {asset.type === 'Imagen' ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : asset.type === 'Video' ? (
                      <span className="material-symbols-outlined text-5xl text-slate-700">movie</span>
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-slate-700">description</span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                       <a href={asset.url} download={asset.name} className="p-2 bg-primary rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">download</span>
                       </a>
                       <button onClick={() => handleConfirmDeleteMedia(asset.projectId, asset.id)} className="p-2 bg-rose-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">delete</span>
                       </button>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-sm border border-white/5">
                      {asset.projectName}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-white truncate">{asset.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{asset.type}</span>
                      <span className="text-[10px] text-slate-500">{asset.size}</span>
                    </div>
                  </div>
                </div>
              ))}
              {allMediaAssets.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                  No se encontraron activos multimedia.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Repository;
