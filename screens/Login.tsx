
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

  // Configuración de las partículas flotantes en el fondo
  const PARTICLES = [
    { id: 1, left: '5%', size: 6, delay: '0s', duration: '18s' },
    { id: 2, left: '15%', size: 8, delay: '2s', duration: '24s' },
    { id: 3, left: '25%', size: 4, delay: '5s', duration: '16s' },
    { id: 4, left: '38%', size: 10, delay: '1s', duration: '28s' },
    { id: 5, left: '45%', size: 5, delay: '7s', duration: '20s' },
    { id: 6, left: '55%', size: 7, delay: '3s', duration: '22s' },
    { id: 7, left: '68%', size: 9, delay: '8s', duration: '26s' },
    { id: 8, left: '78%', size: 6, delay: '4s', duration: '18s' },
    { id: 9, left: '88%', size: 8, delay: '6s', duration: '25s' },
    { id: 10, left: '95%', size: 4, delay: '9s', duration: '15s' },
    { id: 11, left: '10%', size: 7, delay: '12s', duration: '23s' },
    { id: 12, left: '30%', size: 9, delay: '14s', duration: '27s' },
    { id: 13, left: '50%', size: 5, delay: '11s', duration: '19s' },
    { id: 14, left: '70%', size: 8, delay: '15s', duration: '21s' },
    { id: 15, left: '90%', size: 6, delay: '13s', duration: '24s' },
  ];

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
        @keyframes aurora-blob-1 {
          0% { transform: translate(-10%, -15%) scale(1) rotate(0deg); }
          50% { transform: translate(15%, 10%) scale(1.1) rotate(180deg); }
          100% { transform: translate(-10%, -15%) scale(1) rotate(360deg); }
        }
        @keyframes aurora-blob-2 {
          0% { transform: translate(10%, 15%) scale(1) rotate(0deg); }
          50% { transform: translate(-15%, -10%) scale(1.2) rotate(-180deg); }
          100% { transform: translate(10%, 15%) scale(1) rotate(-360deg); }
        }
        @keyframes aurora-blob-3 {
          0% { transform: translate(-5%, 10%) scale(1) rotate(0deg); }
          50% { transform: translate(10%, -15%) scale(0.9) rotate(180deg); }
          100% { transform: translate(-5%, 10%) scale(1) rotate(360deg); }
        }
        @keyframes float-particle {
          0% {
            transform: translateY(105vh) translateX(0px) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-5vh) translateX(50px) scale(1.3);
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Glow ambiental morado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[130px] rounded-full pointer-events-none z-[1]"></div>

      {/* Fondo Aurora Degradada y Partículas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-[#18171c] to-[#1e212e]">
        {/* Blobs de Aurora */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-[#9e6cff]/15 blur-[120px] pointer-events-none"
          style={{
            top: '-20%',
            left: '-10%',
            animation: 'aurora-blob-1 25s infinite ease-in-out'
          }}
        />
        <div 
          className="absolute w-[900px] h-[900px] rounded-full bg-[#3b82f6]/10 blur-[140px] pointer-events-none"
          style={{
            bottom: '-25%',
            right: '-15%',
            animation: 'aurora-blob-2 35s infinite ease-in-out'
          }}
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full bg-[#9e6cff]/12 blur-[110px] pointer-events-none"
          style={{
            top: '30%',
            left: '30%',
            animation: 'aurora-blob-3 30s infinite ease-in-out'
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-[#8b5cf6]/10 blur-[100px] pointer-events-none"
          style={{
            bottom: '20%',
            left: '-10%',
            animation: 'aurora-blob-1 28s infinite reverse ease-in-out'
          }}
        />

        {/* Partículas Flotantes */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white rounded-full pointer-events-none opacity-0"
            style={{
              left: p.left,
              top: 0,
              width: `${p.size}px`,
              height: `${p.size}px`,
              filter: 'blur(0.5px)',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8), 0 0 10px rgba(158, 108, 255, 0.3)',
              animationName: 'float-particle',
              animationDuration: p.duration,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: p.delay,
              animationFillMode: 'backwards',
            }}
          />
        ))}
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
