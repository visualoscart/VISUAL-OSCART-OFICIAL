
import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { useProjects } from '../context/ProjectContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, notifications, markNotificationAsRead, studioLogo, logout } = useProjects();
  const [showNotifs, setShowNotifs] = useState(false);

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => String(n.userId) === String(currentUser.id));
  }, [notifications, currentUser]);

  const unreadCount = myNotifications.filter(n => !n.read).length;

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

        {/* NOTIFICACIONES */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all border ${showNotifs ? 'bg-white/10 border-accent-orange/40' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined text-slate-400 text-xl">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-orange rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-[#141118]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Alertas</span>
            </div>
            <span className={`material-symbols-outlined text-slate-600 text-sm transition-transform ${showNotifs ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {showNotifs && (
            <div className="absolute left-0 right-0 mt-3 bg-[#1e1726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 z-50">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recientes</span>
              </div>
              <div className="max-h-60 overflow-y-auto scrollbar-hide">
                {myNotifications.length > 0 ? (
                  myNotifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-4 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${!n.read ? 'bg-accent-orange/10' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-base mt-0.5 ${n.type === 'warning' ? 'text-accent-orange' : 'text-primary'}`}>
                          {n.type === 'warning' ? 'warning' : n.type === 'success' ? 'check_circle' : 'info'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-white leading-tight uppercase tracking-tighter">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed italic">"{n.message}"</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Sin alertas pendientes</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
