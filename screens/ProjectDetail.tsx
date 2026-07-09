
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Collaborator } from '../types';
import { createBrandFolder, uploadFileResumable, createSubFolder } from '../lib/driveService';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, usersDB, updateProject, addMediaAsset, deleteMediaAsset, addTextAsset, deleteTextAsset, showToast, currentUser } = useProjects();
  
  const project = projects.find(p => String(p.id) === String(id));
  
  const [activeTab, setActiveTab] = useState<'resumen' | 'repositorio'>('resumen');
  const [repoTab, setRepoTab] = useState<'textos' | 'multimedia'>('textos');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showMediaLinkModal, setShowMediaLinkModal] = useState(false);
  const [isEditingAdn, setIsEditingAdn] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const [editAdnForm, setEditAdnForm] = useState({ 
    brief: '', 
    hell: '', 
    heaven: '', 
    brandCode: '',
    brandColors: [] as string[], 
    brandManualUrl: '',
    coverUrl: '',
    typography: {

      titles: { name: '', url: '' as string | undefined },
      subtitles: { name: '', url: '' as string | undefined },
      body: { name: '', url: '' as string | undefined }
    }
  });
  const [newText, setNewText] = useState({ title: '', content: '', tag: 'Hooks' as any });
  const [newMediaLink, setNewMediaLink] = useState({ name: '', url: '', type: 'Imagen' as any, platform: 'Drive' as any });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaTab, setMediaTab] = useState<'link' | 'upload'>('upload');
  const [adnUploadProgress, setAdnUploadProgress] = useState<Record<string, number>>({});
  const [isUploadingAdn, setIsUploadingAdn] = useState<Record<string, boolean>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para clasificaciones de activos digitales
  const [selectedClassification, setSelectedClassification] = useState<string>('Todos');
  const [isAddingClassification, setIsAddingClassification] = useState(false);
  const [newClassificationName, setNewClassificationName] = useState('');
  const [newMediaAssetClassification, setNewMediaAssetClassification] = useState('');
  const [showEditMediaModal, setShowEditMediaModal] = useState(false);
  const [editingMediaAsset, setEditingMediaAsset] = useState<any>(null);
  const [editMediaName, setEditMediaName] = useState('');
  const [editMediaClassification, setEditMediaClassification] = useState('');

  const isDirectorCreativo = currentUser?.role === 'Director Creativo' || 
    currentUser?.role?.toLowerCase().includes('director creativo');

  useEffect(() => {
    if (project) {
      const projTypo = project.typography;
      setEditAdnForm({
        brief: project.brief || '',
        hell: project.hell || '',
        heaven: project.heaven || '',
        brandCode: project.brandCode || '',
        brandColors: project.brandColors || ['#8c2bee', '#f97316'],
        brandManualUrl: project.brandManualUrl || '',
        coverUrl: project.coverUrl || project.typography?.coverUrl || '',
        typography: {
          titles: { name: projTypo?.titles?.name || '', url: projTypo?.titles?.url },
          subtitles: { name: projTypo?.subtitles?.name || '', url: projTypo?.subtitles?.url },
          body: { name: projTypo?.body?.name || '', url: projTypo?.body?.url }
        }
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
        size: 'Vínculo Externo',
        classification: newMediaAssetClassification || undefined
      });
      setShowMediaLinkModal(false);
      setNewMediaLink({ name: '', url: '', type: 'Imagen', platform: 'Drive' });
      setNewMediaAssetClassification('');
      setNewMediaAssetClassification('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadCoverImage = async (file: File) => {
    if (!project || !file) return;
    setIsUploadingAdn(prev => ({ ...prev, cover: true }));
    setAdnUploadProgress(prev => ({ ...prev, cover: 0 }));
    try {
      const resourcesFolderId = await createBrandFolder(`${project.name} - Recursos`);
      const coverFolderId = await createSubFolder("Portada", resourcesFolderId);
      const { url } = await uploadFileResumable(file, coverFolderId, (prog) => {
         setAdnUploadProgress(prev => ({ ...prev, cover: prog }));
      });
      setEditAdnForm(prev => ({ ...prev, coverUrl: url }));
      showToast("Imagen de portada subida exitosamente", "success");
    } catch (e: any) {
      showToast("Error al subir portada: " + e.message, "error");
    } finally {
      setIsUploadingAdn(prev => ({ ...prev, cover: false }));
    }
  };

  const handleUploadBrandManual = async (file: File) => {
    if (!project || !file) return;
    setIsUploadingAdn(prev => ({ ...prev, manual: true }));
    setAdnUploadProgress(prev => ({ ...prev, manual: 0 }));
    try {
      const resourcesFolderId = await createBrandFolder(`${project.name} - Recursos`);
      const manualFolderId = await createSubFolder("Manual de Marca", resourcesFolderId);
      const { url } = await uploadFileResumable(file, manualFolderId, (prog) => {
         setAdnUploadProgress(prev => ({ ...prev, manual: prog }));
      });
      setEditAdnForm(prev => ({ ...prev, brandManualUrl: url }));
      showToast("Manual subido exitosamente", "success");
    } catch (e: any) {
      showToast("Error al subir manual: " + e.message, "error");
    } finally {
      setIsUploadingAdn(prev => ({ ...prev, manual: false }));
    }
  };

  const handleUploadFont = async (file: File, key: 'titles' | 'subtitles' | 'body') => {
    if (!project || !file) return;
    setIsUploadingAdn(prev => ({ ...prev, [key]: true }));
    setAdnUploadProgress(prev => ({ ...prev, [key]: 0 }));
    try {
      const resourcesFolderId = await createBrandFolder(`${project.name} - Recursos`);
      const fontsFolderId = await createSubFolder("Fuentes", resourcesFolderId);
      const { url } = await uploadFileResumable(file, fontsFolderId, (prog) => {
         setAdnUploadProgress(prev => ({ ...prev, [key]: prog }));
      });
      setEditAdnForm(prev => ({
        ...prev,
        typography: {
          ...prev.typography,
          [key]: { ...prev.typography[key], url }
        }
      }));
      showToast("Fuente subida exitosamente", "success");
    } catch (e: any) {
      showToast("Error al subir fuente: " + e.message, "error");
    } finally {
      setIsUploadingAdn(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUploadMediaFile = async () => {
    if (!project || !uploadFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const folderId = await createBrandFolder(`${project.name} - Recursos`);
      const { url, fileId, thumbnailUrl } = await uploadFileResumable(uploadFile, folderId, setUploadProgress);
      let type: 'Imagen' | 'Video' | 'Archivo' = 'Archivo';
      if (uploadFile.type.startsWith('image/')) type = 'Imagen';
      else if (uploadFile.type.startsWith('video/')) type = 'Video';
      const previewUrl = thumbnailUrl || (type === 'Imagen' ? `https://drive.google.com/uc?export=view&id=${fileId}` : undefined);
      await addMediaAsset(project.id, {
        name: newMediaLink.name || uploadFile.name.split('.')[0],
        url,
        type,
        platform: 'Drive',
        size: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
        fileId,
        previewUrl,
        classification: newMediaAssetClassification || undefined
      });
      setShowMediaLinkModal(false);
      setUploadFile(null);
      setNewMediaLink({ name: '', url: '', type: 'Imagen', platform: 'Drive' });
      setNewMediaAssetClassification('');
      setNewMediaAssetClassification('');
      showToast("Activo subido exitosamente", "success");
    } catch (e: any) {
      showToast("Error al subir: " + e.message, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateDriveFolder = async () => {
    if (!project) return;
    setIsCreatingFolder(true);
    try {
      const folderId = await createBrandFolder(project.name);
      await updateProject(project.id, { driveFolderId: folderId });
      showToast("Carpeta de Drive creada exitosamente", "success");
    } catch (e: any) {
      showToast("Error al crear carpeta: " + e.message, "error");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateClassification = async () => {
    if (!isDirectorCreativo) {
      showToast("Acceso denegado. Solo el Director Creativo puede crear clasificaciones.", "error");
      return;
    }
    if (!project || !newClassificationName.trim()) return;
    const currentList = project.mediaClassifications || [];
    const name = newClassificationName.trim();
    if (currentList.some(c => c.toLowerCase() === name.toLowerCase())) {
      showToast("Esta clasificación ya existe", "error");
      return;
    }
    const nextList = [...currentList, name];
    await updateProject(project.id, { mediaClassifications: nextList });
    setNewClassificationName('');
    setIsAddingClassification(false);
    showToast("Clasificación creada", "success");
  };

  const handleDeleteClassification = async (name: string) => {
    if (!isDirectorCreativo) {
      showToast("Acceso denegado. Solo el Director Creativo puede eliminar clasificaciones.", "error");
      return;
    }
    if (!project) return;
    if (!window.confirm(`¿Estás seguro de eliminar la clasificación "${name}"? Esto no borrará tus activos, solo les quitará la categoría.`)) return;
    const nextList = (project.mediaClassifications || []).filter(c => c !== name);
    const updatedMedia = (project.mediaRepository || []).map(asset => {
      if (asset.classification === name) {
        const { classification, ...rest } = asset;
        return rest;
      }
      return asset;
    });
    await updateProject(project.id, { 
      mediaClassifications: nextList,
      mediaRepository: updatedMedia
    });
    if (selectedClassification === name) {
      setSelectedClassification('Todos');
    }
    showToast("Clasificación eliminada", "success");
  };

  const handleOpenEditMediaModal = (asset: any) => {
    if (!isDirectorCreativo) {
      showToast("Acceso denegado. Solo el Director Creativo puede editar activos.", "error");
      return;
    }
    setEditingMediaAsset(asset);
    setEditMediaName(asset.name);
    setEditMediaClassification(asset.classification || '');
    setShowEditMediaModal(true);
  };

  const handleSaveEditMedia = async () => {
    if (!isDirectorCreativo) {
      showToast("Acceso denegado. Solo el Director Creativo puede editar activos.", "error");
      return;
    }
    if (!project || !editingMediaAsset) return;
    setIsSubmitting(true);
    try {
      const updatedMedia = (project.mediaRepository || []).map(m => {
        if (m.id === editingMediaAsset.id) {
          return {
            ...m,
            name: editMediaName,
            classification: editMediaClassification || undefined
          };
        }
        return m;
      });
      await updateProject(project.id, { mediaRepository: updatedMedia });
      setShowEditMediaModal(false);
      setEditingMediaAsset(null);
      showToast("Activo actualizado correctamente", "success");
    } finally {
      setIsSubmitting(false);
    }
  };



  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("Texto copiado al portapapeles", "success");
  };

  if (!project) return <div className="p-10 text-center text-white font-black uppercase tracking-[0.5em] animate-pulse">Cargando Bóveda Estratégica...</div>;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-white font-display bg-transparent relative pattern-orbital">
      
      {/* Luces ambientales */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl shrink-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/projects')} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all shadow-xl">
              <span className="material-symbols-outlined text-slate-400">arrow_back</span>
            </button>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-900 shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={project.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${project.name}`} 
                  className="w-full h-full object-cover" 
                  alt={project.name}
                />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">{project.name} <span className="text-primary">.</span></h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-accent-orange text-[9px] font-medium uppercase tracking-[0.3em] opacity-80">{project.niche}</span>
                   <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                   <span className="text-slate-500 text-[9px] font-medium uppercase tracking-widest opacity-60">{project.client}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">SOCIOS ASIGNADOS</span>
              <button onClick={() => setShowTeamModal(true)} className="w-8 h-8 bg-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">group_add</span>
              </button>
            </div>
            <div className="flex -space-x-3">
              {(Array.isArray(project.collaborators) ? project.collaborators : []).map((c, i) => (
                <img key={i} src={c.avatar} className="w-10 h-10 rounded-2xl border-4 border-background-dark object-cover shadow-2xl hover:translate-y-[-4px] transition-transform" title={c.name} />
              ))}
              {(!project.collaborators || project.collaborators.length === 0) && <span className="text-[9px] text-slate-700 font-medium uppercase tracking-widest">Sin asignar</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth scrollbar-hide relative z-10">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          <div className="flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
            <div className="flex gap-12">
              {[
                {id:'resumen', label:'Arquitectura Estratégica', icon:'dna'}, 
                {id:'repositorio', label:'Bóveda de Activos', icon:'folder_zip'}
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as any)} 
                  className={`flex items-center gap-3 pb-6 text-[10px] font-black uppercase tracking-[0.3em] relative transition-all ${activeTab === t.id ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <span className={`material-symbols-outlined text-lg ${activeTab === t.id ? 'text-primary' : ''}`}>{t.icon}</span>
                  {t.label}
                  {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(140,43,238,0.5)]"></div>}
                </button>
              ))}
            </div>
            {activeTab === 'resumen' && (
              <button 
                onClick={() => isEditingAdn ? handleSaveAdn() : setIsEditingAdn(true)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl ${isEditingAdn ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'}`}
              >
                {isEditingAdn ? 'Sincronizar ADN' : 'Modificar ADN'}
              </button>
            )}
          </div>

          {activeTab === 'resumen' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* CONCEPTO MAESTRO: Refinado a fuente normal y más pequeña */}
                <div className="lg:col-span-8 glass-panel p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden group hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary group-hover:w-2 transition-all duration-500"></div>
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                   <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8 opacity-40">
                         <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                         <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] ">Concepto Maestro <span className="text-primary">/ Protocolo 01</span></h3>
                         
                         {/* Brand Code Display/Edit */}
                         {!isEditingAdn && project.brandCode && (
                           <div className="ml-auto px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                             <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">{project.brandCode}</span>
                           </div>
                         )}
                      </div>
                      
                      {isEditingAdn && (
                        <div className="mb-8 space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 opacity-60 ">Identificador Único (Código de Marca)</label>
                           <input 
                              type="text" 
                              className="w-full bg-[#08070b] border border-primary/10 rounded-2xl px-6 py-4 text-white text-xs font-black uppercase outline-none focus:border-primary/30 tracking-[0.2em]" 
                              value={editAdnForm.brandCode} 
                              onChange={e => setEditAdnForm({...editAdnForm, brandCode: e.target.value.toUpperCase()})} 
                              placeholder="Ej: MARCAXX" 
                           />
                        </div>
                      )}
                      {isEditingAdn ? (
                        <textarea 
                          className="w-full bg-[#08070b] border border-primary/10 rounded-[2rem] p-8 text-slate-300 text-base font-normal outline-none focus:border-primary/30 resize-none h-60 transition-all leading-relaxed whitespace-pre-wrap" 
                          value={editAdnForm.brief} 
                          onChange={e => setEditAdnForm({...editAdnForm, brief: e.target.value})} 
                          placeholder="Describe el alma estratégica de la marca..." 
                        />
                      ) : (
                        <p className="text-slate-400 text-xl lg:text-2xl leading-relaxed font-normal tracking-normal whitespace-pre-wrap">
                          {project.brief || 'Arquitectura de marca en proceso de definición estratégica.'}
                        </p>
                      )}
                      <div className="mt-12 flex items-center justify-between">
                         <div className="flex items-center gap-3 opacity-20">
                            <div className="w-8 h-px bg-white"></div>
                            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Bóveda de Inteligencia Visual</span>
                         </div>
                         <div className="flex items-center gap-3 relative z-20">
                            {project.driveFolderId ? (
                              <a 
                                href={`https://drive.google.com/drive/folders/${project.driveFolderId}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-2 text-[10px] font-black text-primary uppercase bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg"
                              >
                                <span className="material-symbols-outlined text-sm">folder_open</span> Abrir Carpeta Drive
                              </a>
                            ) : (
                              <button 
                                onClick={handleCreateDriveFolder}
                                disabled={isCreatingFolder}
                                className="flex items-center gap-2 text-[10px] font-black text-white uppercase bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-primary/20 hover:border-primary/50 transition-all shadow-lg z-20"
                              >
                                <span className="material-symbols-outlined text-sm">create_new_folder</span>
                                {isCreatingFolder ? 'Creando...' : 'Crear Carpeta Drive'}
                              </button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                   <div className="glass-panel p-8 rounded-[3rem] border border-rose-500/10 flex-1 relative group overflow-hidden bg-rose-950/5 hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-500 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="flex items-center gap-3 mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-500 relative z-10">
                         <span className="material-symbols-outlined text-rose-500 text-lg">dangerous</span>
                         <h3 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] ">Diferencial de Dolor</h3>
                      </div>
                      {isEditingAdn ? (
                        <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-rose-500/50 resize-none h-32 whitespace-pre-wrap" value={editAdnForm.hell} onChange={e => setEditAdnForm({...editAdnForm, hell: e.target.value})} placeholder="Puntos críticos..." />
                      ) : (
                        <p className="text-slate-400 text-xs font-medium opacity-70 leading-relaxed whitespace-pre-wrap">
                          "{project.hell || 'Aún no se han mapeado los puntos de dolor del nicho.'}"
                        </p>
                      )}
                   </div>
                   
                   <div className="glass-panel p-8 rounded-[3rem] border border-emerald-500/10 flex-1 relative group overflow-hidden bg-emerald-950/5 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="flex items-center gap-3 mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-500 relative z-10">
                         <span className="material-symbols-outlined text-emerald-500 text-lg">auto_graph</span>
                         <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] ">Aspiración Máxima</h3>
                      </div>
                      {isEditingAdn ? (
                        <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:border-emerald-500/50 resize-none h-32 whitespace-pre-wrap" value={editAdnForm.heaven} onChange={e => setEditAdnForm({...editAdnForm, heaven: e.target.value})} placeholder="Promesa de marca..." />
                      ) : (
                        <p className="text-slate-400 text-xs font-medium opacity-70 leading-relaxed whitespace-pre-wrap">
                          "{project.heaven || 'Definición de cielo aspiracional pendiente.'}"
                        </p>
                      )}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 glass-panel p-10 rounded-[3rem] border border-white/5 space-y-10 hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ">Identidad de Color</h3>
                    {isEditingAdn && (
                      <button onClick={handleAddColor} className="text-[9px] bg-primary/10 text-primary px-4 py-1.5 rounded-xl border border-primary/20 font-black uppercase hover:bg-primary hover:text-white transition-all">Añadir Tono</button>
                    )}
                  </div>
                  {/* COLORES: Reducidos de tamaño para mayor sutileza */}
                  <div className="flex flex-wrap gap-8">
                    {(isEditingAdn ? editAdnForm.brandColors : (project.brandColors || ['#8c2bee', '#f97316'])).map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-4 group relative animate-in zoom-in-95" style={{ animationDelay: `${idx*100}ms` }}>
                        {isEditingAdn ? (
                          <div className="flex flex-col items-center gap-3">
                            <input type="color" value={color} onChange={e => handleUpdateColor(idx, e.target.value)} className="w-14 h-14 rounded-2xl cursor-pointer bg-transparent border-none p-0 overflow-hidden shadow-xl" />
                            <input type="text" value={color} onChange={e => handleUpdateColor(idx, e.target.value)} className="bg-transparent border-none text-[8px] font-mono text-center text-slate-600 w-14 outline-none uppercase font-black" />
                            <button onClick={() => handleRemoveColor(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-background-dark text-rose-500 rounded-full border border-white/10 flex items-center justify-center shadow-xl hover:bg-rose-500 hover:text-white transition-all">
                              <span className="material-symbols-outlined text-[10px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex flex-col items-center gap-4 cursor-pointer group/color" 
                            onClick={() => { copyToClipboard(color); showToast(`Color ${color} copiado`, "success"); }}
                            title="Haz clic para copiar el código HEX"
                          >
                            <div className="w-14 h-14 rounded-2xl shadow-xl border border-white/10 group-hover/color:scale-110 transition-transform relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: color }}>
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/color:opacity-100 transition-opacity" />
                               <span className="material-symbols-outlined text-white text-lg opacity-0 group-hover/color:opacity-100 transition-opacity relative z-10 drop-shadow-lg">content_copy</span>
                            </div>
                            <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest group-hover/color:text-primary transition-colors">{color}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-3 glass-panel p-10 rounded-[3rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-8 hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                   <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-2xl">
                     <span className="material-symbols-outlined text-2xl">menu_book</span>
                   </div>
                   <div>
                     <h3 className="text-xs font-black text-white uppercase tracking-tighter ">Manual Corporativo</h3>
                     <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 opacity-60">Guía de Activos Visuales</p>
                   </div>
                   {isEditingAdn ? (
                     <div className="w-full space-y-2">
                        <div className="flex gap-2">
                           <input type="text" className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none " value={editAdnForm.brandManualUrl} onChange={e => setEditAdnForm({...editAdnForm, brandManualUrl: e.target.value})} placeholder="URL de Documentación..." disabled={isUploadingAdn['manual']} />
                           <label className={`w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${isUploadingAdn['manual'] ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10 hover:bg-primary hover:text-white text-slate-400'}`}>
                             <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleUploadBrandManual(e.target.files[0]); }} disabled={isUploadingAdn['manual']} accept=".pdf,.doc,.docx" />
                             {isUploadingAdn['manual'] ? (
                               <span className="text-[9px] font-black text-primary">{adnUploadProgress['manual'] || 0}%</span>
                             ) : (
                               <span className="material-symbols-outlined text-lg">cloud_upload</span>
                             )}
                           </label>
                        </div>
                        {isUploadingAdn['manual'] && (
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${adnUploadProgress['manual']}%` }}></div>
                          </div>
                        )}
                     </div>
                   ) : (
                     project.brandManualUrl && (
                       <a href={project.brandManualUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                         <span className="material-symbols-outlined text-xs">open_in_new</span> Acceder al Manual
                       </a>
                     )
                   )}
                </div>

                <div className="lg:col-span-3 glass-panel p-10 rounded-[3rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-8 hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-2xl overflow-hidden relative">
                      {editAdnForm.coverUrl || project.coverUrl ? (
                        <img src={editAdnForm.coverUrl || project.coverUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl">image</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-tighter ">Portada de Marca</h3>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 opacity-60">Cabecera de Portal de Cliente</p>
                    </div>
                    {isEditingAdn ? (
                      <div className="w-full space-y-2">
                         <div className="flex gap-2">
                            <input type="text" className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none " value={editAdnForm.coverUrl} onChange={e => setEditAdnForm({...editAdnForm, coverUrl: e.target.value})} placeholder="URL de Portada..." disabled={isUploadingAdn['cover']} />
                            <label className={`w-12 shrink-0 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${isUploadingAdn['cover'] ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10 hover:bg-primary hover:text-white text-slate-400'}`}>
                              <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleUploadCoverImage(e.target.files[0]); }} disabled={isUploadingAdn['cover']} accept="image/*" />
                              {isUploadingAdn['cover'] ? (
                                <span className="text-[9px] font-black text-primary">{adnUploadProgress['cover'] || 0}%</span>
                              ) : (
                                <span className="material-symbols-outlined text-lg">cloud_upload</span>
                              )}
                            </label>
                         </div>
                         {isUploadingAdn['cover'] && (
                           <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                             <div className="h-full bg-primary transition-all duration-300" style={{ width: `${adnUploadProgress['cover']}%` }}></div>
                           </div>
                         )}
                      </div>
                    ) : (
                      (project.coverUrl || project.typography?.coverUrl) && (
                        <a href={project.coverUrl || project.typography?.coverUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                          <span className="material-symbols-outlined text-xs">open_in_new</span> Ver Portada
                        </a>
                      )
                    )}
                </div>
              </div>

              <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-10 animate-in fade-in duration-700 hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ">Identidad Tipográfica</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                    { key: 'titles' as const, label: 'Títulos', icon: 'text_fields' },
                    { key: 'subtitles' as const, label: 'Subtítulos', icon: 'format_size' },
                    { key: 'body' as const, label: 'Texto / Cuerpo', icon: 'subject' }
                  ].map((type) => (
                    <div key={type.key} className="flex flex-col gap-5 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="material-symbols-outlined text-lg">{type.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{type.label}</h4>
                        </div>
                      </div>
                      
                      {isEditingAdn ? (
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-[10px] outline-none font-bold uppercase" 
                            placeholder="Nombre de la fuente..." 
                            value={editAdnForm.typography[type.key].name} 
                            onChange={e => {
                              setEditAdnForm({ 
                                ...editAdnForm, 
                                typography: {
                                  ...editAdnForm.typography,
                                  [type.key]: { ...editAdnForm.typography[type.key], name: e.target.value }
                                }
                              });
                            }} 
                          />
                          <div className="flex flex-col gap-2">
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-white text-[10px] outline-none " 
                                 placeholder="URL de descarga..." 
                                 value={editAdnForm.typography[type.key].url} 
                                 onChange={e => {
                                   setEditAdnForm({ 
                                     ...editAdnForm, 
                                     typography: {
                                       ...editAdnForm.typography,
                                       [type.key]: { ...editAdnForm.typography[type.key], url: e.target.value }
                                     }
                                   });
                                 }} 
                                 disabled={isUploadingAdn[type.key]}
                               />
                               <label className={`w-10 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${isUploadingAdn[type.key] ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10 hover:bg-primary hover:text-white text-slate-400'}`}>
                                 <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleUploadFont(e.target.files[0], type.key); }} disabled={isUploadingAdn[type.key]} accept=".ttf,.otf,.woff,.woff2,.zip" />
                                 {isUploadingAdn[type.key] ? (
                                   <span className="text-[8px] font-black text-primary">{adnUploadProgress[type.key] || 0}%</span>
                                 ) : (
                                   <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                 )}
                               </label>
                             </div>
                             {isUploadingAdn[type.key] && (
                               <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                 <div className="h-full bg-primary transition-all duration-300" style={{ width: `${adnUploadProgress[type.key]}%` }}></div>
                               </div>
                             )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xl font-black tracking-tighter uppercase truncate text-slate-300">
                            {project.typography?.[type.key].name || 'Pendiente'}
                          </p>
                          {project.typography?.[type.key].url && (
                             <a 
                               href={project.typography[type.key].url} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors group/link"
                             >
                               <span className="material-symbols-outlined text-sm group-hover/link:animate-bounce">download</span>
                               Descargar Fuente
                             </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
               <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                  <div className="flex bg-white/5 p-1.5 rounded-2xl">
                    <button onClick={() => setRepoTab('textos')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${repoTab === 'textos' ? 'bg-primary text-white shadow-xl' : 'text-slate-600 hover:text-white'}`}>Propiedad Intelectual</button>
                    <button onClick={() => setRepoTab('multimedia')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${repoTab === 'multimedia' ? 'bg-primary text-white shadow-xl' : 'text-slate-600 hover:text-white'}`}>Activos Digitales</button>
                  </div>
                  <button onClick={() => repoTab === 'textos' ? setShowTextModal(true) : setShowMediaLinkModal(true)} className="btn-premium px-10 py-4 text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl active:scale-95 transition-all">Integrar Activo</button>
               </div>
               
               {repoTab === 'textos' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(project.textRepository || []).map((item, idx) => (
                      <div key={item.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-primary/30 shadow-2xl transition-all animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx*50}ms` }}>
                        <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyToClipboard(item.content)} className="w-9 h-9 bg-white/10 rounded-xl text-white/50 hover:text-primary transition-colors border border-white/5 flex items-center justify-center" title="Copiar Texto"><span className="material-symbols-outlined text-lg">content_copy</span></button>
                            <button onClick={() => deleteTextAsset(project.id, item.id)} className="w-9 h-9 bg-white/10 rounded-xl text-white/50 hover:text-rose-500 transition-colors border border-white/5 flex items-center justify-center" title="Borrar"><span className="material-symbols-outlined text-lg">delete</span></button>
                        </div>
                        <span className="px-4 py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-xl border border-primary/20 tracking-widest">{item.tag}</span>
                        <h4 className="text-white font-black text-xl mt-6 mb-4 uppercase tracking-tighter">{item.title}</h4>
                        <p className="text-slate-400 text-sm font-normal line-clamp-4 leading-relaxed opacity-70 whitespace-pre-wrap group-hover:text-slate-300 transition-colors">"{item.content}"</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="space-y-6">
                   {/* Barra de Clasificaciones */}
                   <div className="flex flex-wrap items-center gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Categorías:</span>
                     
                     <button
                       onClick={() => setSelectedClassification('Todos')}
                       className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                         selectedClassification === 'Todos'
                           ? 'bg-primary text-white shadow-lg font-black'
                           : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 font-black'
                       }`}
                     >
                       Todos
                     </button>

                     {(project.mediaClassifications || []).map(c => (
                       <div
                         key={c}
                         className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 ${
                           selectedClassification === c
                             ? 'bg-primary text-white shadow-lg'
                             : 'bg-white/5 text-slate-400 hover:text-white'
                         }`}
                       >
                         <button onClick={() => setSelectedClassification(c)} className="uppercase tracking-widest cursor-pointer font-black">{c}</button>
                         {isDirectorCreativo && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteClassification(c); }}
                             className="w-4 h-4 rounded-full flex items-center justify-center bg-black/25 text-white/60 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                             title="Eliminar Categoría"
                           >
                             <span className="material-symbols-outlined text-[10px] leading-none">close</span>
                           </button>
                         )}
                       </div>
                     ))}

                     {isDirectorCreativo && (
                       isAddingClassification ? (
                         <div className="flex items-center gap-2 bg-white/5 border border-primary/30 p-1 rounded-xl animate-in zoom-in-95">
                           <input
                             type="text"
                             placeholder="Nueva..."
                             className="bg-transparent border-none text-[9px] font-bold text-white uppercase outline-none px-2 w-20 tracking-wider"
                             value={newClassificationName}
                             onChange={e => setNewClassificationName(e.target.value)}
                             onKeyDown={e => { if (e.key === 'Enter') handleCreateClassification(); }}
                             autoFocus
                         />
                           <button onClick={handleCreateClassification} className="text-emerald-400 hover:text-emerald-300 w-5 h-5 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-sm">check</span></button>
                           <button onClick={() => { setIsAddingClassification(false); setNewClassificationName(''); }} className="text-slate-500 hover:text-white w-5 h-5 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-sm">close</span></button>
                         </div>
                       ) : (
                         <button
                           onClick={() => setIsAddingClassification(true)}
                           className="px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 flex items-center gap-1 cursor-pointer"
                         >
                           <span className="material-symbols-outlined text-xs">add</span> Nueva
                         </button>
                       )
                     )}
                   </div>

                   {/* Listado de Activos Digitales Filtrados */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {((project.mediaRepository || []).filter(asset => {
                        if (selectedClassification === 'Todos') return true;
                        return asset.classification === selectedClassification;
                      })).map((asset, idx) => (
                        <div 
                          key={asset.id} 
                          className="glass-panel rounded-3xl p-6 border border-white/5 hover:border-primary/40 transition-all group flex items-center gap-6 relative overflow-hidden bg-[#08070b]/60 shadow-xl"
                          style={{ animationDelay: `${idx*50}ms` }}
                        >
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-full h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                               <span className={`material-symbols-outlined text-3xl ${asset.type === 'Imagen' ? 'text-primary' : asset.type === 'Video' ? 'text-accent-orange' : 'text-blue-400'}`}>
                                  {asset.type === 'Imagen' ? 'frame_inspect' : asset.type === 'Video' ? 'movie_filter' : 'deployed_code'}
                               </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.05em] truncate mb-1 group-hover:text-primary transition-colors">{asset.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                 {asset.classification || 'General'}
                               </span>
                               <span className="text-[8px] font-mono text-slate-700 uppercase">{asset.size || 'Vínculo'}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shrink-0">
                             <a 
                              href={asset.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-9 h-9 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-90 border border-white/20 cursor-pointer"
                              title="Acceder"
                             >
                               <span className="material-symbols-outlined text-sm">rocket_launch</span>
                             </a>
                             {isDirectorCreativo && (
                               <button 
                                onClick={() => handleOpenEditMediaModal(asset)} 
                                className="w-9 h-9 bg-white/5 text-slate-400 hover:bg-primary hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90 border border-white/10 cursor-pointer"
                                title="Editar"
                               >
                                 <span className="material-symbols-outlined text-sm">edit</span>
                               </button>
                             )}
                             <button 
                              onClick={() => deleteMediaAsset(project.id, asset.id)} 
                              className="w-9 h-9 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 border border-rose-500/20 cursor-pointer"
                              title="Eliminar"
                             >
                               <span className="material-symbols-outlined text-sm">delete_sweep</span>
                             </button>
                          </div>
                        </div>
                      ))}
                      {((project.mediaRepository || []).filter(asset => {
                        if (selectedClassification === 'Todos') return true;
                        return asset.classification === selectedClassification;
                      })).length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white/[0.01] border border-white/5 rounded-3xl">
                          <span className="material-symbols-outlined text-slate-700 text-3xl mb-2">folder_open</span>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">No hay activos registrados en esta categoría</p>
                        </div>
                      )}
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {showTeamModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowTeamModal(false)}>
          <div className="glass-panel border border-white/10 rounded-[3rem] w-full max-w-lg p-12 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-tighter ">Flujo de <span className="text-primary">Colaboración</span></h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {usersDB.filter(u => !u.role?.toLowerCase().startsWith('cliente')).map(u => {
                const isAssigned = (Array.isArray(project.collaborators) ? project.collaborators : []).some(c => String(c.id) === String(u.id));
                return (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[2rem] group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-5">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-xl" />
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{u.firstName} {u.lastName}</p>
                        <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mt-1">{u.role}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleCollaborator(u.id)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl ${isAssigned ? 'bg-rose-500 text-white' : 'bg-primary text-white'}`}>
                      {isAssigned ? 'Retirar' : 'Asignar'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowTeamModal(false)} className="w-full mt-10 py-5 bg-white/5 border border-white/5 text-slate-500 font-black uppercase text-[10px] rounded-[2rem] hover:text-white transition-colors tracking-widest">Cerrar Protocolo</button>
          </div>
        </div>
      )}

      {showTextModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowTextModal(false)}>
           <div className="glass-panel border border-white/10 rounded-[3rem] w-full max-w-lg p-12 space-y-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black uppercase text-white tracking-tighter ">Integración de <span className="text-primary">Propiedad</span></h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 opacity-60">Clasificación Estratégica</label>
                    <select className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary" value={newText.tag} onChange={e => setNewText({...newText, tag: e.target.value as any})}>
                        <option value="Hooks">Hooks</option>
                        <option value="Copys">Copys</option>
                        <option value="CTA">CTA</option>
                        <option value="Otros">Otros</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 opacity-60">Identificador (Título)</label>
                    <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold uppercase" placeholder="Ej: Gancho High-Ticket" value={newText.title} onChange={e => setNewText({...newText, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 opacity-60">Cuerpo del Activo</label>
                    <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm h-32 outline-none resize-none font-medium leading-relaxed whitespace-pre-wrap" placeholder="Escribe el copy maestro..." value={newText.content} onChange={e => setNewText({...newText, content: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowTextModal(false)} className="flex-1 py-5 bg-white/5 text-slate-600 font-black rounded-[2rem] uppercase text-[10px] tracking-widest">Abortar</button>
                 <button onClick={handleAddText} disabled={isSubmitting} className="btn-premium flex-2 py-5 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-widest">{isSubmitting ? 'Procesando...' : 'Desplegar'}</button>
              </div>
           </div>
        </div>
      )}

      {showMediaLinkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowMediaLinkModal(false)}>
           <div className="glass-panel border border-white/10 rounded-[3rem] w-full max-w-lg p-12 space-y-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black uppercase text-white tracking-tighter ">Integrar <span className="text-primary">Activo Digital</span></h3>
              
              <div className="flex bg-white/5 p-1.5 rounded-2xl">
                 <button onClick={() => setMediaTab('upload')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mediaTab === 'upload' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Subir Archivo</button>
                 <button onClick={() => setMediaTab('link')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mediaTab === 'link' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Vincular URL</button>
              </div>

              {mediaTab === 'upload' ? (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Nombre del Recurso (Opcional)</label>
                      <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold uppercase" placeholder="Ej: Logo Principal" value={newMediaLink.name} onChange={e => setNewMediaLink({...newMediaLink, name: e.target.value})} disabled={isUploading} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Archivo Local</label>
                      <div className={`w-full border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-4 ${uploadFile ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-white/5'}`}>
                         <span className="material-symbols-outlined text-4xl text-primary">{uploadFile ? 'check_circle' : 'cloud_upload'}</span>
                         <div>
                            <p className="text-white font-bold text-sm">{uploadFile ? uploadFile.name : 'Seleccionar archivo'}</p>
                            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">{uploadFile ? `${(uploadFile.size/1024/1024).toFixed(2)} MB` : 'Soporta imágenes, videos, documentos'}</p>
                         </div>
                         <input type="file" className="hidden" id="asset-upload" onChange={e => setUploadFile(e.target.files?.[0] || null)} disabled={isUploading} />
                         {!isUploading && <label htmlFor="asset-upload" className="btn-premium px-6 py-2 rounded-xl text-white font-black text-[9px] uppercase tracking-widest cursor-pointer mt-2">Explorar</label>}
                      </div>
                   </div>
                   {isUploading && (
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                     </div>
                   )}
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Nombre del Recurso</label>
                      <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold uppercase" placeholder="Ej: Master Video Edit" value={newMediaLink.name} onChange={e => setNewMediaLink({...newMediaLink, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Punto de Acceso (URL)</label>
                      <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none " placeholder="https://..." value={newMediaLink.url} onChange={e => setNewMediaLink({...newMediaLink, url: e.target.value})} />
                   </div>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Clasificación / Categoría</label>
                 <select 
                   className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary"
                   value={newMediaAssetClassification}
                   onChange={e => setNewMediaAssetClassification(e.target.value)}
                 >
                   <option value="">Sin Clasificación</option>
                   {(project.mediaClassifications || []).map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Clasificación / Categoría</label>
                 <select 
                   className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary"
                   value={newMediaAssetClassification}
                   onChange={e => setNewMediaAssetClassification(e.target.value)}
                 >
                   <option value="">Sin Clasificación</option>
                   {(project.mediaClassifications || []).map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowMediaLinkModal(false)} className="flex-1 py-5 bg-white/5 text-slate-600 font-black rounded-[2rem] uppercase text-[10px] tracking-widest" disabled={isUploading}>Cerrar</button>
                <button 
                  onClick={mediaTab === 'upload' ? handleUploadMediaFile : handleAddMediaLink} 
                  disabled={isSubmitting || isUploading} 
                  className="btn-premium flex-2 py-5 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-widest shadow-xl"
                >
                  {isSubmitting || isUploading ? 'Procesando...' : 'Integrar a Bóveda'}
                </button>
              </div>
           </div>
        </div>
      )}

      {showEditMediaModal && editingMediaAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => { setShowEditMediaModal(false); setEditingMediaAsset(null); }}>
           <div className="glass-panel border border-white/10 rounded-[3rem] w-full max-w-lg p-12 space-y-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black uppercase text-white tracking-tighter ">Editar <span className="text-primary">Activo Digital</span></h3>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Nombre del Recurso</label>
                    <input 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold uppercase" 
                      placeholder="Ej: Logo Principal" 
                      value={editMediaName} 
                      onChange={e => setEditMediaName(e.target.value)} 
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Clasificación / Categoría</label>
                    <select 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary"
                      value={editMediaClassification}
                      onChange={e => setEditMediaClassification(e.target.value)}
                    >
                      <option value="">Sin Clasificación</option>
                      {(project.mediaClassifications || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setShowEditMediaModal(false); setEditingMediaAsset(null); }} className="flex-1 py-5 bg-white/5 text-slate-600 font-black rounded-[2rem] uppercase text-[10px] tracking-widest">Cancelar</button>
                <button 
                  onClick={handleSaveEditMedia} 
                  disabled={isSubmitting} 
                  className="btn-premium flex-2 py-5 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-widest shadow-xl"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
           </div>
        </div>
      )}

      {showEditMediaModal && editingMediaAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-2xl animate-in fade-in" onClick={() => { setShowEditMediaModal(false); setEditingMediaAsset(null); }}>
           <div className="glass-panel border border-white/10 rounded-[3rem] w-full max-w-lg p-12 space-y-8 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black uppercase text-white tracking-tighter ">Editar <span className="text-primary">Activo Digital</span></h3>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Nombre del Recurso</label>
                    <input 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold uppercase" 
                      placeholder="Ej: Logo Principal" 
                      value={editMediaName} 
                      onChange={e => setEditMediaName(e.target.value)} 
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Clasificación / Categoría</label>
                    <select 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-primary"
                      value={editMediaClassification}
                      onChange={e => setEditMediaClassification(e.target.value)}
                    >
                      <option value="">Sin Clasificación</option>
                      {(project.mediaClassifications || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setShowEditMediaModal(false); setEditingMediaAsset(null); }} className="flex-1 py-5 bg-white/5 text-slate-600 font-black rounded-[2rem] uppercase text-[10px] tracking-widest">Cancelar</button>
                <button 
                  onClick={handleSaveEditMedia} 
                  disabled={isSubmitting} 
                  className="btn-premium flex-2 py-5 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-widest shadow-xl"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
