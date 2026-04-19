
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useProjects } from '../context/ProjectContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, studioLogo, toast } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [currentUser, navigate, location]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!currentUser && location.pathname !== '/login') return null;

  return (
    <div className="flex h-screen w-full bg-background-dark overflow-hidden relative">
      {/* GLOBAL TOAST */}
      {toast.message && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-top flex items-center gap-3 border ${
          toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
        }`}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'verified' : 'error'}</span>
          {toast.message}
        </div>
      )}

      {/* Sidebar Desktop & Mobile Wrapper */}
      <div className={`
        fixed inset-y-0 left-0 z-[100] w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 px-6 flex items-center justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-md shrink-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              {studioLogo ? (
                <img src={studioLogo} className="w-full h-full object-cover rounded-lg" alt="Logo" />
              ) : (
                <span className="material-symbols-outlined text-white text-xl">shutter_speed</span>
              )}
            </div>
            <span className="text-white font-black text-sm uppercase tracking-tight">Visual Oscart</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-xl border border-white/10"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
