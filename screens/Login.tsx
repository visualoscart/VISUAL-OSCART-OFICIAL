
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, studioLogo, loginBackground, loginTitle, loginSubtitle, currentUser } = useProjects();
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
          navigate('/');
      } else {
          setError(result.message);
      }
    } catch (err) {
      setError("Fallo de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[650px] bg-[#0c0b0e] rounded-[3rem] shadow-2xl overflow-hidden flex border border-white/5 animate-in">
        <div className="relative w-1/2 hidden lg:block overflow-hidden">
          <img className="absolute inset-0 w-full h-full object-cover opacity-30" src={loginBackground} alt="Login" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="relative z-10 p-12 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                {studioLogo ? <img src={studioLogo} className="w-full h-full object-contain p-2" /> : <span className="material-symbols-outlined text-white text-xl">shutter_speed</span>}
              </div>
              <h1 className="text-white text-md font-display">Visual Oscart</h1>
            </div>
            <div>
              <h2 className="text-2xl font-display text-white mb-4 uppercase tracking-tight">{loginTitle}</h2>
              <div className="h-1 w-10 bg-primary mb-4"></div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{loginSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center bg-card-dark">
          <div className="max-w-[340px] mx-auto w-full">
            <div className="mb-10">
              <h3 className="text-xl font-display text-white mb-2 uppercase italic">Acceso Seguro</h3>
              <p className="text-slate-500 text-[11px] font-medium">Ingresa tus credenciales autorizadas.</p>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-6 text-rose-500 text-[9px] font-bold uppercase tracking-widest text-center">{error}</div>}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Corporativo</label>
                <input required className="w-full rounded-2xl border border-white/5 bg-black/40 text-white p-4 text-sm outline-none focus:border-primary" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="oscar@visual.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Password</label>
                <input required className="w-full rounded-2xl border border-white/5 bg-black/40 text-white p-4 text-sm outline-none focus:border-primary" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              
              <button disabled={isSubmitting} className="w-full bg-primary text-white font-display text-[11px] uppercase tracking-widest h-14 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-6" type="submit">
                {isSubmitting ? 'Iniciando...' : 'Autenticar Acceso'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
