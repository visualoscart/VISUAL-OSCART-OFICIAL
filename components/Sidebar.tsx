
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { useProjects } from '../context/ProjectContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, studioLogo, logout } = useProjects();

  const filteredNav = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      if (item.id === 'admin') {
        const userRole = (currentUser?.role || '').toLowerCase();
        return userRole.includes('director');
      }
      return true;
    });
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <aside className="w-full h-full flex flex-col border-r border-white/5 bg-background-dark overflow-y-auto scrollbar-hide">
      <div className="p-8 flex flex-col gap-10 min-h-full">
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-orange flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden shrink-0 border border-white/10">
            {studioLogo ? (
              <img src={studioLogo} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <span className="material-symbols-outlined text-white text-3xl">shutter_speed</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-white text-lg font-black leading-none tracking-tighter truncate">Visual Oscart</h1>
            <p className="text-accent-orange text-[9px] font-black uppercase tracking-[0.2em] mt-1 truncate">Marketing Flow</p>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="flex flex-col gap-2 flex-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                } group`}
              >
                <span className={`material-symbols-outlined text-2xl ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PERFIL Y SALIDA */}
        <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
          <Link
            to="/users"
            className="flex items-center gap-4 p-3 rounded-[1.5rem] hover:bg-white/5 transition-all group border border-white/5"
          >
            <div className="relative shrink-0">
               <img src={currentUser.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-accent-orange/20 group-hover:border-accent-orange transition-all" alt="Profile" />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background-dark"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-black truncate">{currentUser.firstName} {currentUser.lastName}</span>
              <span className="text-[9px] text-accent-orange font-black uppercase tracking-tighter truncate">{currentUser.role}</span>
            </div>
          </Link>
          <button
            onClick={() => { logout(); window.location.hash = '/login'; }}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[11px] uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
