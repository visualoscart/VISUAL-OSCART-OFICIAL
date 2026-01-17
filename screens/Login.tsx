
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, studioLogo, loginTitle, loginSubtitle, currentUser, loginBackground } = useProjects();
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Imagen por defecto: Arte fluido morado para armonizar con el patrón orbital
  const LIQUID_ART = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200";

  useEffect(() => {
    if (currentUser) navigate('/');
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) navigate('/');
      else setError(result.message);
    } catch (err) {
      setError("Fallo de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background-dark pattern-orbital">
      
      {/* Glow ambiental morado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-4xl h-[580px] glass-panel rounded-[2.5rem] overflow-hidden flex animate-in fade-in zoom-in-95 duration-700">
        
        {/* Lado Izquierdo: Visual Identity (Composición Refinada) */}
        <div className="relative w-[45%] hidden md:block overflow-hidden border-r border-white/5">
          <img 
            src={loginBackground || LIQUID_ART} 
            className="absolute inset-0 w-full h-full object-cover scale-105" 
            alt="Visual Identity Background" 
          />
          {/* Overlay de contraste suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-primary/20 to-background-dark/40"></div>
          
          <div className="relative z-10 p-10 h-full flex flex-col justify-between">
            
            {/* LOGO SIN ESPACIOS (Ajuste a object-cover y sin padding interno) */}
            <div className="animate-in slide-in-from-top-6 duration-700">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden p-0">
                {studioLogo ? (
                  <img src={studioLogo} className="w-full h-full object-cover filter drop-shadow-lg block" alt="Studio Logo" />
                ) : (
                  <span className="material-symbols-outlined text-white text-3xl">shutter_speed</span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-white text-[9px] font-black uppercase tracking-[0.5em] font-display italic opacity-60">Visual Oscart Studio</span>
              </div>
            </div>

            {/* TEXTOS REDIMENSIONADOS PARA MEJOR COMPOSICIÓN */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight uppercase tracking-tighter italic mb-4">
                {loginTitle}
              </h1>
              <div className="h-0.5 w-10 bg-primary mb-4 opacity-50"></div>
              <p className="text-white/60 text-[8px] font-bold uppercase tracking-[0.4em] max-w-[240px] leading-relaxed">
                {loginSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Acceso */}
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center bg-white/[0.01]">
          <div className="max-w-[320px] mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight italic">Acceso <span className="text-primary italic">Socio</span></h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest opacity-60">Sincronización de Identidad</p>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6 text-rose-500 text-[8px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Identificador de Red</label>
                <input 
                  required 
                  className="w-full rounded-2xl p-4 text-xs text-white outline-none focus:border-primary transition-all bg-white/[0.02] border border-white/5" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="socio@visual.com" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Clave de Bóveda</label>
                <input 
                  required 
                  className="w-full rounded-2xl p-4 text-xs text-white outline-none focus:border-primary transition-all bg-white/[0.02] border border-white/5" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
              </div>
              
              <button 
                disabled={isSubmitting} 
                className="w-full btn-premium text-white h-14 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all" 
                type="submit"
              >
                {isSubmitting ? 'Validando...' : 'Iniciar Sincronización'}
                <span className="material-symbols-outlined text-lg">bolt</span>
              </button>
            </form>
            
            <p className="mt-10 text-center text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] opacity-40 italic">
              Visual Studio Flow Engine • v3.5.2
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
