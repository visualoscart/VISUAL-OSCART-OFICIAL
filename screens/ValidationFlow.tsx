
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
        // Calidad 0.5 (muy comprimida para evitar Payload Too Large)
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
        alert("Error de guardado. Intenta subir una foto más pequeña o sin foto.");
      }
    } catch (e) {
      alert("Error crítico de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark text-white font-display">
      <header className="px-8 py-4 border-b border-white/5 flex justify-between items-center bg-background-dark/40 backdrop-blur">
        <button onClick={() => navigate('/projects')} className="text-slate-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Nueva Marca <span className="text-accent-orange text-[10px] ml-2 tracking-widest">Paso {step}/4</span></h2>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <div className="space-y-12 animate-in fade-in">
              <h1 className="text-4xl font-black text-center uppercase tracking-tighter">Identidad Visual</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre Marca *</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-lg font-bold outline-none focus:border-primary transition-all" value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} placeholder="Ej: Visual Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nicho</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-primary transition-all" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})} placeholder="Ej: Real Estate" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Logo de la Marca</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-accent-orange transition-all overflow-hidden relative">
                    {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain p-4" alt="Preview" /> : <span className="material-symbols-outlined text-4xl opacity-20">cloud_upload</span>}
                  </div>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in max-w-2xl mx-auto">
              <h1 className="text-4xl font-black text-center uppercase tracking-tighter">Manual y Colores</h1>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL Manual de Marca</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-primary" value={formData.brandManualUrl} onChange={e => setFormData({...formData, brandManualUrl: e.target.value})} placeholder="Link de Drive" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paleta de Colores</label>
                    <button onClick={handleAddColor} type="button" className="bg-primary/20 text-primary text-[10px] font-black px-4 py-2 rounded-xl uppercase hover:bg-primary hover:text-white transition-all">Añadir</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.brandColors.map((color, index) => (
                      <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between group">
                        <input type="color" value={color} onChange={(e) => handleUpdateColor(index, e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                        <span className="text-xs font-mono font-bold uppercase">{color}</span>
                        <button onClick={() => handleRemoveColor(index)} type="button" className="text-rose-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in">
              <h1 className="text-4xl font-black text-center uppercase tracking-tighter">Psicología</h1>
              <div className="space-y-8">
                <textarea className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white h-32 outline-none focus:border-primary transition-all" value={formData.brief} onChange={e => setFormData({...formData, brief: e.target.value})} placeholder="Describe el alma de la marca..." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <textarea className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white h-32 outline-none focus:border-rose-500" value={formData.hell} onChange={e => setFormData({...formData, hell: e.target.value})} placeholder="El Infierno (Dolores)" />
                  <textarea className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white h-32 outline-none focus:border-emerald-500" value={formData.heaven} onChange={e => setFormData({...formData, heaven: e.target.value})} placeholder="El Cielo (Aspiraciones)" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-20 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-accent-orange/10 rounded-[3rem] flex items-center justify-center text-accent-orange mx-auto mb-8 shadow-2xl border border-accent-orange/20">
                <span className="material-symbols-outlined text-6xl">verified</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">Validado</h2>
              <p className="text-slate-500 mt-4 max-w-sm mx-auto">La marca "{formData.brandName}" está lista para el despliegue operativo.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="p-8 border-t border-white/5 flex justify-between bg-background-dark/80 backdrop-blur">
        <button onClick={() => setStep(s => Math.max(s - 1, 1))} className="px-8 py-4 text-slate-500 uppercase font-black text-[10px] tracking-widest disabled:opacity-0" disabled={step === 1}>Atrás</button>
        <button onClick={step === 4 ? handleFinish : () => setStep(s => s + 1)} className="px-10 py-4 bg-accent-orange text-white font-black rounded-2xl shadow-2xl active:scale-95 text-[10px] uppercase tracking-widest" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : step === 4 ? "Finalizar" : "Siguiente"}
        </button>
      </footer>
    </div>
  );
};

export default ValidationFlow;
