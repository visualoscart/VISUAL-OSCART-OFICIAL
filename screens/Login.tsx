
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

  const renderSpiralPath = (startAngle: number = 0) => {
    const points = [];
    const centerX = 500;
    const centerY = 500;
    const turns = 8;
    const pointsPerTurn = 100;
    const totalPoints = turns * pointsPerTurn;
    
    // Escala para hacerlos óvalos (estirados en horizontal)
    const scaleX = 1.6;
    const scaleY = 1.0;
    
    // Distancia entre vueltas consecutivas de la espiral
    const spacing = 130;
    const b = spacing / (2 * Math.PI);
    
    for (let i = 0; i <= totalPoints; i++) {
      const theta = (i / pointsPerTurn) * 2 * Math.PI + startAngle;
      const r = b * (theta - startAngle);
      const x = centerX + r * Math.cos(theta) * scaleX;
      const y = centerY + r * Math.sin(theta) * scaleY;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    
    return `M ${points.join(" L ")}`;
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role?.toLowerCase().startsWith('cliente')) {
        navigate('/client-hub');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.message);
    } catch (err) {
      setError("Fallo de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background-dark pattern-orbital">
      <style>{`
        @keyframes spiral-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spiral-spin-reverse {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-spiral-slow {
          animation: spiral-spin 90s linear infinite;
        }
        .animate-spiral-reverse {
          animation: spiral-spin-reverse 130s linear infinite;
        }
      `}</style>
      
      {/* Glow ambiental morado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Espiral de bandas ovaladas animada */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#18171c]">
        {/* Contenedor gigante centrado que gira lentamente */}
        <div className="absolute top-1/2 left-1/2 w-[2200px] h-[2200px] animate-spiral-slow pointer-events-none origin-center blur-2xl">
          <svg viewBox="0 0 1000 1000" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Brazo 1 de la espiral */}
            <path 
              d={renderSpiralPath(0)} 
              stroke="#1e212e" 
              strokeWidth="65" 
              strokeLinecap="round" 
              transform="rotate(-30 500 500)"
            />
            {/* Brazo 2 de la espiral (intercalado 180 grados para completar el patrón alterno) */}
            <path 
              d={renderSpiralPath(Math.PI)} 
              stroke="#1e212e" 
              strokeWidth="65" 
              strokeLinecap="round" 
              transform="rotate(-30 500 500)"
            />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-4xl h-[580px] glass-panel rounded-[2.5rem] overflow-hidden flex animate-in fade-in zoom-in-95 duration-700 relative z-10">
        
        {/* Lado Izquierdo: Visual Identity (Composición Refinada) */}
        <div className="relative w-[45%] hidden md:block overflow-hidden border-r border-white/5">
          <img 
            src={loginBackground || LIQUID_ART} 
            className="absolute inset-0 w-full h-full object-cover scale-105" 
            alt="Visual Identity Background" 
          />
          {/* Overlay de contraste suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-primary/20 to-background-dark/40"></div>
          
          <div className="relative z-10 pt-10 px-10 pb-14 h-full flex flex-col justify-between">
            
            {/* LOGO SIN ESPACIOS (Ajuste a object-cover y sin padding interno) */}
            <div className="animate-in slide-in-from-top-6 duration-700">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden p-0">
                {studioLogo ? (
                  <img src={studioLogo} className="w-full h-full object-cover filter drop-shadow-lg block" alt="Studio Logo" />
                ) : (
                  <span className="material-symbols-outlined text-white text-3xl">shutter_speed</span>
                )}
              </div>
            </div>

            {/* TEXTOS REDIMENSIONADOS PARA MEJOR COMPOSICIÓN */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                {loginTitle}
              </h1>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 opacity-60">
                {loginSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Acceso */}
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center bg-white/[0.01]">
          <div className="max-w-[320px] mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Acceso <span className="text-primary">Socio</span></h3>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5 opacity-60">Sincronización de Identidad</p>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6 text-rose-500 text-xs font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Correo Electrónico</label>
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
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Contraseña</label>
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
                className="w-full btn-premium text-white h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all" 
                type="submit"
              >
                {isSubmitting ? 'Validando...' : 'Iniciar sesión'}
                <span className="material-symbols-outlined text-lg">bolt</span>
              </button>
            </form>
            
            <p className="mt-10 text-center text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] opacity-40 italic">
              Visual Studio Flow Engine • v3.5.2
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
