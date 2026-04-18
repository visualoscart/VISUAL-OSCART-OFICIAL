
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const ValidationFlow: React.FC = () => {
  const navigate = useNavigate();
  const { addProject } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    brandName: '', niche: '', brief: '', clientName: '', logoUrl: '', 
    brandManualUrl: '', hell: '', heaven: '', 
    brandColors: ['#8c2bee', '#f97316']
  });

  const compressImage = (base64: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const fullBase64 = ev.target?.result as string;
        const compressed = await compressImage(fullBase64);
        setFormData(prev => ({ ...prev, logoUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    setFormData(prev => ({ ...prev, brandColors: [...prev.brandColors, '#ffffff'] }));
  };

  const handleUpdateColor = (index: number, value: string) => {
    const nextColors = [...formData.brandColors];
    nextColors[index] = value;
    setFormData(prev => ({ ...prev, brandColors: nextColors }));
  };

  const handleRemoveColor = (index: number) => {
    if (formData.brandColors.length <= 1) return;
    setFormData(prev => ({ ...prev, brandColors: prev.brandColors.filter((_, i) => i !== index) }));
  };

  const handleFinish = async () => {
    if (!formData.brandName.trim()) { alert("El nombre es obligatorio"); return; }
    setIsSubmitting(true);
    try {
      const result = await addProject(formData);
      if (result.success) {
        navigate('/projects');
      } else {
        alert("Error de guardado. Intenta subir una foto más pequeña.");
      }
    } catch (e) {
      alert("Error crítico de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-white font-display relative pattern-orbital">
      
      {/* Luces ambientales */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-background-dark/30 backdrop-blur-2xl z-10 shrink-0">
        <button onClick={() => navigate('/projects')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-xl font-black uppercase tracking-tighter italic">Despliegue Estratégico <span className="text-primary text-[10px] ml-3 tracking-[0.4em] font-black opacity-60">Fase {step}/4</span></h2>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide z-10 relative">
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <div className="space-y-16 animate-in fade-in">
              <div className="text-center">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Identidad Visual <span className="text-primary">Primaria</span></h1>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Protocolo de Identificación de Marca</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descriptor de Marca *</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg font-black italic outline-none focus:border-primary transition-all shadow-inner" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} placeholder="Ej: VISUAL CORP" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nicho Estratégico</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-sm font-bold outline-none focus:border-primary transition-all italic" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})} placeholder="Ej: HIGH-TICKET REAL ESTATE" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Activo de Logo</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-56 glass-panel border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden relative shadow-2xl">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-5xl opacity-20 text-primary">cloud_upload</span>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Subir Identificador</p>
                      </div>
                    )}
                  </div>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-16 animate-in fade-in max-w-2xl mx-auto">
              <div className="text-center">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Arquitectura <span className="text-primary">Visual</span></h1>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Sincronización de manuales y paletas</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Punto de Acceso Manual de Marca</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-xs outline-none focus:border-primary italic" value={formData.brandManualUrl} onChange={e => setFormData({...formData, brandManualUrl: e.target.value})} placeholder="https://drive.google.com/..." />
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matriz de Colores</label>
                    <button onClick={handleAddColor} type="button" className="bg-primary/20 text-primary text-[10px] font-black px-5 py-2 rounded-xl uppercase hover:bg-primary hover:text-white transition-all border border-primary/20 shadow-lg">Añadir Tono</button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {formData.brandColors.map((color, index) => (
                      <div key={index} className="glass-panel p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group shadow-xl">
                        <input type="color" value={color} onChange={(e) => handleUpdateColor(index, e.target.value)} className="w-12 h-12 rounded-2xl bg-transparent border-none cursor-pointer p-0 overflow-hidden" />
                        <span className="text-xs font-mono font-black uppercase text-white/70">{color}</span>
                        <button onClick={() => handleRemoveColor(index)} type="button" className="text-rose-500/40 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-16 animate-in fade-in">
              <div className="text-center">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Psicología de <span className="text-primary">Marca</span></h1>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">ADN Estratégico y Mapeo de Dolores</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Brief Maestro</label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-white text-lg h-48 outline-none focus:border-primary transition-all italic leading-relaxed shadow-2xl" value={formData.brief} onChange={e => setFormData({...formData, brief: e.target.value})} placeholder="Escribe el alma de la marca aquí..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1 italic">El Infierno (Dolores)</label>
                    <textarea className="bg-white/5 border border-white/5 rounded-[2rem] p-8 text-white text-sm h-40 outline-none focus:border-rose-500/50 italic leading-relaxed" value={formData.hell} onChange={e => setFormData({...formData, hell: e.target.value})} placeholder="¿Qué le duele a la marca?" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1 italic">El Cielo (Aspiraciones)</label>
                    <textarea className="bg-white/5 border border-white/5 rounded-[2rem] p-8 text-white text-sm h-40 outline-none focus:border-emerald-500/50 italic leading-relaxed" value={formData.heaven} onChange={e => setFormData({...formData, heaven: e.target.value})} placeholder="¿A dónde quiere llegar?" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-20 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-primary/10 rounded-[3rem] flex items-center justify-center text-primary mx-auto mb-10 shadow-[0_0_50px_rgba(140,43,238,0.2)] border border-primary/20">
                <span className="material-symbols-outlined text-6xl">verified</span>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">Matriz Validada</h2>
              <p className="text-slate-500 mt-6 max-w-sm mx-auto text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed opacity-60 italic">
                La marca "{formData.brandName}" ha completado el protocolo de validación y está lista para el flujo operativo.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="p-10 border-t border-white/5 flex justify-between bg-background-dark/30 backdrop-blur-2xl z-20 shrink-0">
        <button onClick={() => setStep(s => Math.max(s - 1, 1))} className="px-10 py-4 text-slate-500 uppercase font-black text-[10px] tracking-[0.3em] disabled:opacity-0 transition-all hover:text-white" disabled={step === 1}>Paso Anterior</button>
        <button onClick={step === 4 ? handleFinish : () => setStep(s => s + 1)} className="btn-premium px-12 py-5 text-white font-black rounded-2xl shadow-2xl active:scale-95 text-[11px] uppercase tracking-widest" disabled={isSubmitting}>
          {isSubmitting ? "Sincronizando..." : step === 4 ? "Finalizar Despliegue" : "Siguiente Fase"}
        </button>
      </footer>
    </div>
  );
};

export default ValidationFlow;
