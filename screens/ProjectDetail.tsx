
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Collaborator } from '../types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, usersDB, updateProject, addMediaAsset, deleteMediaAsset, addTextAsset, deleteTextAsset, showToast } = useProjects();
  
  const project = projects.find(p => String(p.id) === String(id));
  
  const [activeTab, setActiveTab] = useState<'resumen' | 'repositorio'>('resumen');
  const [repoTab, setRepoTab] = useState<'textos' | 'multimedia'>('textos');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showMediaLinkModal, setShowMediaLinkModal] = useState(false);
  const [isEditingAdn, setIsEditingAdn] = useState(false);
  
  const [editAdnForm, setEditAdnForm] = useState({ brief: '', hell: '', heaven: '', brandColors: [] as string[], brandManualUrl: '' });
  const [newText, setNewText] = useState({ title: '', content: '', tag: 'Hooks' as any });
  const [newMediaLink, setNewMediaLink] = useState({ name: '', url: '', type: 'Imagen' as any, platform: 'Drive' as any });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setEditAdnForm({
        brief: project.brief || '',
        hell: project.hell || '',
        heaven: project.heaven || '',
        brandColors: project.brandColors || ['#8c2bee', '#f97316'],
        brandManualUrl: project.brandManualUrl || ''
      });
    }
  }, [project]);

  const toggleCollaborator = async (userId: string) => {
    if (!project) return;
    const user = usersDB.find(u => String(u.id) === String(userId));
    if (!user) return;
    
    const currentCollabs = Array.isArray(project.collaborators) ? [...project.collaborators] : [];
    const index = currentCollabs.findIndex(c => String(c.id) === String(userId));
    
    let nextCollabs: Collaborator[];
    if (index !== -1) {
      nextCollabs = currentCollabs.filter(c => String(c.id) !== String(userId));
    } else {
      const newCollab: Collaborator = { 
        id: user.id, 
        name: `${user.firstName} ${user.lastName}`, 
        role: user.role, 
        avatar: user.avatar 
      };
      nextCollabs = [...currentCollabs, newCollab];
    }
    
    await updateProject(project.id, { collaborators: nextCollabs });
  };

  const handleSaveAdn = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      await updateProject(project.id, editAdnForm);
      setIsEditingAdn(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateColor = (index: number, color: string) => {
    const next = [...editAdnForm.brandColors];
    next[index] = color;
    setEditAdnForm({ ...editAdnForm, brandColors: next });
  };

  const handleAddColor = () => {
    setEditAdnForm({ ...editAdnForm, brandColors: [...editAdnForm.brandColors, '#ffffff'] });
  };

  const handleRemoveColor = (index: number) => {
    setEditAdnForm({ ...editAdnForm, brandColors: editAdnForm.brandColors.filter((_, i) => i !== index) });
  };

  const handleAddText = async () => {
    if (!project || !newText.title || !newText.content) return alert("Rellena todos los campos");
    setIsSubmitting(true);
    try {
      await addTextAsset(project.id, newText);
      setShowTextModal(false);
      setNewText({ title: '', content: '', tag: 'Hooks' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMediaLink = async () => {
    if (!project || !newMediaLink.name || !newMediaLink.url) return alert("Rellena todos los campos");
    setIsSubmitting(true);
    try {
      await addMediaAsset(project.id, { 
        ...newMediaLink, 
        size: 'Vínculo Externo' 
      });
      setShowMediaLinkModal(false);
      setNewMediaLink({ name: '', url: '', type: 'Imagen', platform: 'Drive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("Texto copiado al portapapeles", "success");
  };

  if (!project) return <div className="p-10 text-center text-white font-black uppercase">Cargando Bóveda...</div>;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-white font-display bg-background-dark">
      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/40 backdrop-blur shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/projects')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><span className="material-symbols-outlined">arrow_back</span></button>
            <div className="flex items-center gap-5">
              <img src={project.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${project.name}`} className="w-16 h-16 rounded-3xl object-cover border-2 border-accent-orange/20 shadow-2xl" />
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">{project.name}</h2>
                <div className="flex items-center gap-3">
                   <span className="text-accent-orange text-[10px] font-black uppercase tracking-[0.2em]">{project.niche}</span>
                   <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                   <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{project.client}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SOCIOS ASIGNADOS</span>
              <button onClick={() => setShowTeamModal(true)} className="p-1.5 bg-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"><span className="material-symbols-outlined text-base">group_add</span></button>
            </div>
            <div className="flex -space-x-3">
              {(Array.isArray(project.collaborators) ? project.collaborators : []).map((c, i) => (
                <img key={i} src={c.avatar} className="w-10 h-10 rounded-2xl border-4 border-background-dark object-cover shadow-lg hover:translate-y-[-4px] transition-transform" title={c.name} />
              ))}
              {(!project.collaborators || project.collaborators.length === 0) && <span className="text-[9px] text-slate-600 font-bold uppercase italic">Sin asignar</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          <div className="flex justify-between items-center border-b border-white/5">
            <div className="flex gap-10">
              {[{id:'resumen', label:'Estrategia', icon:'dna'}, {id:'repositorio', label:'Bóveda Activos', icon:'folder_zip'}].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 pb-6 text-[10px] font-black uppercase tracking-[0.3em] relative transition-all ${activeTab === t.id ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                  <span className="material-symbols-outlined text-lg">{t.icon}</span>
                  {t.label}
                  {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-orange rounded-full"></div>}
                </button>
              ))}
            </div>
            {activeTab === 'resumen' && (
              <button 
                onClick={() => isEditingAdn ? handleSaveAdn() : setIsEditingAdn(true)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditingAdn ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'}`}
              >
                {isEditingAdn ? 'Guardar Cambios' : 'Editar Estrategia'}
              </button>
            )}
          </div>

          {activeTab === 'resumen' ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card-dark p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                   <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Concepto Maestro</h3>
                   {isEditingAdn ? (
                     <textarea className="w-full bg-background-dark border border-white/10 rounded-2xl p-6 text-white text-sm outline-none focus:border-primary resize-none h-32" value={editAdnForm.brief} onChange={e => setEditAdnForm({...editAdnForm, brief: e.target.value})} placeholder="Escribe el concepto maestro..." />
                   ) : (
                     <p className="text-slate-200 italic text-xl leading-relaxed font-medium">"{project.brief || 'Sin descripción establecida.'}"</p>
                   )}
                </div>
                <div className="bg-card-dark p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-10">
                   <div>
                      <h3 className="text-[10px] font-black uppercase text-rose-500 mb-4 tracking-widest">El Infierno</h3>
                      {isEditingAdn ? (
                        <textarea className="w-full bg-background-dark border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-rose-500 resize-none h-24" value={editAdnForm.hell} onChange={e => setEditAdnForm({...editAdnForm, hell: e.target.value})} placeholder="Dolores de la marca..." />
                      ) : (
                        <p className="text-slate-400 text-sm italic">"{project.hell || 'No documentado'}"</p>
                      )}
                   </div>
                   <div className="h-px bg-white/5"></div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase text-emerald-500 mb-4 tracking-widest">El Cielo</h3>
                      {isEditingAdn ? (
                        <textarea className="w-full bg-background-dark border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-emerald-500 resize-none h-24" value={editAdnForm.heaven} onChange={e => setEditAdnForm({...editAdnForm, heaven: e.target.value})} placeholder="Aspiraciones de la marca..." />
                      ) : (
                        <p className="text-slate-400 text-sm italic">"{project.heaven || 'No documentado'}"</p>
                      )}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-card-dark p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-primary tracking-widest italic">Paleta de Colores de Marca</h3>
                    {isEditingAdn && <button onClick={handleAddColor} className="text-[9px] bg-primary/10 text-primary px-3 py-1 rounded-lg border border-primary/20 font-black uppercase">Añadir Color</button>}
                  </div>
                  <div className="flex flex-wrap gap-8">
                    {(isEditingAdn ? editAdnForm.brandColors : (project.brandColors || ['#8c2bee', '#f97316'])).map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-4 group relative">
                        {isEditingAdn ? (
                          <div className="flex flex-col items-center gap-3">
                            <input type="color" value={color} onChange={e => handleUpdateColor(idx, e.target.value)} className="w-20 h-20 rounded-3xl cursor-pointer bg-transparent border-none" />
                            <input type="text" value={color} onChange={e => handleUpdateColor(idx, e.target.value)} className="bg-transparent border-none text-[10px] font-mono text-center text-slate-500 w-20 outline-none" />
                            <button onClick={() => handleRemoveColor(idx)} className="text-rose-500 absolute -top-2 -right-2 bg-background-dark rounded-full p-1 border border-white/5"><span className="material-symbols-outlined text-xs">close</span></button>
                          </div>
                        ) : (
                          <>
                            <div className="w-20 h-20 rounded-3xl shadow-2xl border-2 border-white/10" style={{ backgroundColor: color }}></div>
                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">{color}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-4 bg-card-dark p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
                   <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20">
                     <span className="material-symbols-outlined text-4xl">menu_book</span>
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-tighter">Manual de Identidad</h3>
                   {isEditingAdn ? (
                     <input type="text" className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-[10px] outline-none" value={editAdnForm.brandManualUrl} onChange={e => setEditAdnForm({...editAdnForm, brandManualUrl: e.target.value})} placeholder="URL Manual..." />
                   ) : (
                     project.brandManualUrl && <a href={project.brandManualUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase rounded-2xl shadow-xl flex items-center justify-center gap-2"><span className="material-symbols-outlined text-sm">open_in_new</span> Ver Manual</a>
                   )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
               <div className="flex justify-between items-center">
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button onClick={() => setRepoTab('textos')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${repoTab === 'textos' ? 'bg-accent-orange text-white' : 'text-slate-600 hover:text-white'}`}>Textos</button>
                    <button onClick={() => setRepoTab('multimedia')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${repoTab === 'multimedia' ? 'bg-accent-orange text-white' : 'text-slate-600 hover:text-white'}`}>Multimedia</button>
                  </div>
                  <button onClick={() => repoTab === 'textos' ? setShowTextModal(true) : setShowMediaLinkModal(true)} className="px-10 py-4 bg-accent-orange text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl active:scale-95 transition-all">Nuevo Activo</button>
               </div>
               
               {repoTab === 'textos' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(project.textRepository || []).map(item => (
                      <div key={item.id} className="bg-card-dark p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-accent-orange/30 shadow-xl transition-all">
                        <div className="absolute top-6 right-6 flex gap-2">
                            <button onClick={() => copyToClipboard(item.content)} className="text-slate-500/50 hover:text-primary transition-colors" title="Copiar Texto"><span className="material-symbols-outlined">content_copy</span></button>
                            <button onClick={() => deleteTextAsset(project.id, item.id)} className="text-rose-500/30 hover:text-rose-500 transition-colors" title="Borrar"><span className="material-symbols-outlined">delete</span></button>
                        </div>
                        <span className="px-3 py-1 bg-accent-orange/10 text-accent-orange text-[9px] font-black uppercase rounded-lg border border-accent-orange/20">{item.tag}</span>
                        <h4 className="text-white font-black text-lg mt-4 mb-4">{item.title}</h4>
                        <p className="text-slate-400 text-sm italic line-clamp-4 leading-relaxed">"{item.content}"</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {(project.mediaRepository || []).map(asset => (
                      <div key={asset.id} className="bg-card-dark rounded-[2.2rem] overflow-hidden group border border-white/5 shadow-xl hover:border-primary/40 transition-all">
                        <div className="aspect-square flex flex-col items-center justify-center bg-slate-900 relative">
                           <span className="material-symbols-outlined text-6xl text-slate-800">{asset.type === 'Imagen' ? 'image' : asset.type === 'Video' ? 'movie' : 'description'}</span>
                           <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all backdrop-blur-sm">
                             <a href={asset.url} target="_blank" rel="noreferrer" className="p-4 bg-primary text-white rounded-2xl shadow-2xl hover:scale-110 transition-transform active:scale-90"><span className="material-symbols-outlined">open_in_new</span></a>
                             <button onClick={() => deleteMediaAsset(project.id, asset.id)} className="p-4 bg-rose-500 text-white rounded-2xl shadow-2xl hover:scale-110 transition-transform active:scale-90"><span className="material-symbols-outlined">delete</span></button>
                           </div>
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] font-black uppercase text-white truncate">{asset.name}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {showTeamModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowTeamModal(false)}>
          <div className="bg-card-dark border border-white/10 rounded-[3rem] w-full max-w-lg p-10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tighter italic">Gestionar Socios</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {usersDB.map(u => {
                const isAssigned = (Array.isArray(project.collaborators) ? project.collaborators : []).some(c => String(c.id) === String(u.id));
                return (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                      <div>
                        <p className="text-sm font-black text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest">{u.role}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleCollaborator(u.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAssigned ? 'bg-rose-500 text-white' : 'bg-primary text-white shadow-lg'}`}>
                      {isAssigned ? 'Retirar' : 'Asignar'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowTeamModal(false)} className="w-full mt-8 py-4 bg-white/5 border border-white/5 text-slate-500 font-black uppercase text-[10px] rounded-2xl hover:text-white transition-colors">Cerrar Panel</button>
          </div>
        </div>
      )}

      {showTextModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowTextModal(false)}>
           <div className="bg-card-dark border border-white/10 rounded-[3rem] w-full max-w-lg p-10 space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black uppercase text-white tracking-tighter italic">Nuevo Activo de Texto</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Clasificación</label>
                    <select className="w-full bg-background-dark border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newText.tag} onChange={e => setNewText({...newText, tag: e.target.value as any})}>
                        <option value="Hooks">Hooks</option>
                        <option value="Copys">Copys</option>
                        <option value="CTA">CTA</option>
                        <option value="Otros">Otros</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Título</label>
                    <input className="w-full bg-background-dark border border-white/5 rounded-2xl p-5 text-white text-sm outline-none" placeholder="Ej: Gancho Reels" value={newText.title} onChange={e => setNewText({...newText, title: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Contenido</label>
                    <textarea className="w-full bg-background-dark border border-white/5 rounded-2xl p-5 text-white text-sm h-32 outline-none resize-none" placeholder="Texto aquí..." value={newText.content} onChange={e => setNewText({...newText, content: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowTextModal(false)} className="flex-1 py-5 bg-white/5 text-slate-500 font-black rounded-2xl uppercase text-[10px]">Cancelar</button>
                 <button onClick={handleAddText} disabled={isSubmitting} className="flex-2 py-5 bg-primary text-white font-black rounded-2xl uppercase text-[11px] tracking-widest">{isSubmitting ? 'Guardando...' : 'Integrar'}</button>
              </div>
           </div>
        </div>
      )}

      {showMediaLinkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowMediaLinkModal(false)}>
           <div className="bg-card-dark border border-white/10 rounded-[3rem] w-full max-w-lg p-10 space-y-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black uppercase text-white tracking-tighter italic">Vincular Recurso</h3>
              <div className="space-y-5">
                 <input className="w-full bg-background-dark border border-white/5 rounded-2xl p-5 text-white text-sm outline-none" placeholder="Nombre..." value={newMediaLink.name} onChange={e => setNewMediaLink({...newMediaLink, name: e.target.value})} />
                 <input className="w-full bg-background-dark border border-white/5 rounded-2xl p-5 text-white text-sm outline-none" placeholder="URL..." value={newMediaLink.url} onChange={e => setNewMediaLink({...newMediaLink, url: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowMediaLinkModal(false)} className="flex-1 py-5 bg-white/5 text-slate-500 font-black rounded-2xl uppercase text-[10px]">Cerrar</button>
                <button onClick={handleAddMediaLink} disabled={isSubmitting} className="flex-2 py-5 bg-accent-orange text-white font-black rounded-2xl uppercase text-[11px] tracking-widest">
                  {isSubmitting ? 'Procesando...' : 'Integrar'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
