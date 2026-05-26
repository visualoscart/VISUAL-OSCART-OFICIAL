
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useProjects } from '../context/ProjectContext';

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  promptContext: string;
  placeholder: string;
  isImageOnly?: boolean;
}

const CATEGORIES: Category[] = [
  { id: 'cm', title: 'Community Manager', icon: 'forum', description: 'Copys persuasivos optimizados para engagement.', color: 'from-blue-500/20 to-blue-600/5', promptContext: 'Actúa como un CM de élite. Genera copys con estructura AIDA (Atención, Interés, Deseo, Acción). Incluye emojis y hashtags estratégicos.', placeholder: 'Ej: Copy para un reel sobre lanzamientos...' },
  { id: 'design', title: 'Arte Visual IA', icon: 'palette', description: 'Generación de imágenes fotorrealistas con IA.', color: 'from-amber-500/20 to-amber-600/5', promptContext: 'Director de Arte. Genera descripciones visuales para IA.', placeholder: 'Ej: Mujer ejecutiva en oficina minimalista, luz dorada...', isImageOnly: true },
  { id: 'video', title: 'Scripts de Video', icon: 'movie_edit', description: 'Guiones de alto impacto para Reels y TikTok.', color: 'from-red-500/20 to-red-600/5', promptContext: 'Guionista de contenido viral. Estructura: Gancho (3s), Desarrollo (10s), CTA final.', placeholder: 'Ej: Guion para tutorial de 3 tips...' },
  { id: 'strategy', title: 'Estrategia Master', icon: 'psychology', description: 'Planes de contenido y pilares estratégicos.', color: 'from-emerald-500/20 to-emerald-600/5', promptContext: 'Consultor Estratégico. Define pilares de contenido y ángulos de venta.', placeholder: 'Ej: Pilares para una marca de suplementos...' },
];

const Ideation: React.FC = () => {
  const { projects, addTextAsset, addMediaAsset, currentUser, logAiUsage } = useProjects();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCategory) return;
    const userMsg = { role: 'user', content: input, type: 'text', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    if (currentUser) logAiUsage(currentUser.id, selectedCategory.id);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      if (selectedCategory.isImageOnly) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `High quality, professional marketing visual: ${userMsg.content}` }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });
        let imageData = '';
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) imageData = `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        setMessages(prev => [...prev, { role: 'assistant', type: 'image', content: imageData || '', timestamp: new Date() }]);
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMsg.content,
          config: { systemInstruction: selectedCategory.promptContext }
        });
        setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: response.text || "No se pudo generar respuesta.", timestamp: new Date() }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Error en la matriz IA. Reintentando...' }]);
    } finally {
      setIsTyping(false);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const saveAsset = (msg: any) => {
    if (!selectedBrand) return alert("Selecciona una marca para guardar.");
    if (msg.type === 'text') {
      addTextAsset(selectedBrand, { title: 'IA Insight', content: msg.content, tag: 'Otros' });
    } else {
      addMediaAsset(selectedBrand, { name: 'IA Design.png', type: 'Imagen', url: msg.content });
    }
    alert("Guardado en la Bóveda de Marca.");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark font-display relative overflow-hidden">
      {!selectedCategory ? (
        <div className="flex-1 overflow-y-auto p-12 animate-in fade-in">
           <div className="max-w-6xl mx-auto space-y-16">
              <div className="text-center">
                 <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Estudio IA Visual Oscart</h1>
                 <p className="text-slate-500 text-lg">Potencia tu creatividad con modelos generativos de última generación.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {CATEGORIES.map((cat, i) => (
                   <div key={cat.id} onClick={() => setSelectedCategory(cat)} className="p-8 rounded-[2.5rem] bg-card-dark border border-white/5 hover:border-primary/40 transition-all cursor-pointer group animate-in slide-in-from-bottom-6" style={{ animationDelay: `${i*100}ms` }}>
                      <span className="material-symbols-outlined text-4xl text-slate-500 mb-6 group-hover:text-primary transition-colors">{cat.icon}</span>
                      <h3 className="text-2xl font-black text-white mb-2">{cat.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{cat.description}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full bg-background-dark">
           <header className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-background-dark/80 backdrop-blur shrink-0">
              <div className="flex items-center gap-4">
                 <button onClick={() => setSelectedCategory(null)} className="p-2.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                 <h2 className="text-lg font-black text-white uppercase tracking-tight">Estudio: {selectedCategory.title}</h2>
              </div>
              <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-300 outline-none" onChange={e => setSelectedBrand(e.target.value)} value={selectedBrand}>
                 <option value="">Seleccionar Marca</option>
                 {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
           </header>
           <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                   <div className={`max-w-[80%] p-6 rounded-[2rem] shadow-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card-dark text-slate-200 border border-white/5 rounded-tl-none'}`}>
                      {msg.type === 'image' ? (msg.content && <img src={msg.content} className="w-full rounded-2xl shadow-2xl" />) : <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                      {msg.role === 'assistant' && msg.content && (
                        <button onClick={() => saveAsset(msg)} className="mt-6 px-6 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all">Guardar Activo</button>
                      )}
                   </div>
                </div>
              ))}
              {isTyping && <div className="flex justify-start"><div className="bg-card-dark p-6 rounded-2xl flex gap-2 animate-pulse"><div className="w-2 h-2 bg-primary rounded-full"></div><div className="w-2 h-2 bg-primary rounded-full"></div><div className="w-2 h-2 bg-primary rounded-full"></div></div></div>}
              <div ref={chatEndRef}></div>
           </div>
           <div className="p-8 border-t border-white/5 bg-background-dark/50 backdrop-blur-xl">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                 <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={selectedCategory.placeholder} className="w-full bg-card-dark border border-white/10 rounded-[2.2rem] pl-8 pr-16 py-6 text-white focus:border-primary outline-none shadow-2xl transition-all" />
                 <button type="submit" disabled={!input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 transition-all active:scale-90"><span className="material-symbols-outlined font-black">rocket_launch</span></button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Ideation;
