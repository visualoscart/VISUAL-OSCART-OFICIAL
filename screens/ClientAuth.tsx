import React, { useState } from 'react';
import { Phone, Lock, User, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // State for forms
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login/signup logic
    console.log(isLogin ? "Logging in..." : "Signing up...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden selection:bg-cyan-500/30 font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Glass Panel */}
      <div className="relative w-full max-w-md p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-10 transition-all duration-500 m-4">
        
        {/* Top Toggle */}
        <div className="flex bg-black/40 rounded-2xl p-1 mb-8 relative border border-white/5">
           <div 
             className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white/10 rounded-xl shadow-sm border border-white/10 transition-transform duration-300 ease-out ${isLogin ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
           />
           <button 
             type="button"
             onClick={() => setIsLogin(true)}
             className={`flex-1 py-3 text-sm font-medium transition-colors relative z-10 ${isLogin ? 'text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Sign In
           </button>
           <button 
             type="button"
             onClick={() => setIsLogin(false)}
             className={`flex-1 py-3 text-sm font-medium transition-colors relative z-10 ${!isLogin ? 'text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Sign Up
           </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <Sparkles className="text-cyan-400 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isLogin ? 'Ingresa tus datos para continuar' : 'Únete para agendar citas y ganar recompensas'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sign Up Fields (Animated Height/Opacity) */}
          <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isLogin ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'}`}>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Apellido</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Common Fields */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 123 456 7890"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contraseña</label>
              {isLogin && <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">¿Olvidaste tu contraseña?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 bg-white text-black hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] rounded-2xl py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 group border border-transparent hover:border-cyan-300"
          >
            {isLogin ? 'Ingresar' : 'Crear cuenta'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default ClientAuth;
