
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';

const AdminDashboard: React.FC = () => {
  const { 
    projects, usersDB, sendReceiptToUser, deleteReceipt, updateBaseSalary, baseSalaries, 
    financeSettings, updateFinanceSettings, expenses, addExpense, deleteExpense,
    studioLogo, updateStudioLogo, dashboardBanner, updateDashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle, updateDashboardBannerTexts, loginBackground, updateLoginBackground, 
    loginTitle, loginSubtitle, updateLoginTexts, showToast, register, updateUser, updateProject, deleteProject, deleteUser, tasks, receipts
  } = useProjects();
  
  const [passwordAuth, setPasswordAuth] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'analytics' | 'payroll' | 'clients' | 'users' | 'settings'>('analytics');
  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [newSocio, setNewSocio] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '' });
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);
  const [localBannerTitle, setLocalBannerTitle] = useState(dashboardBannerTitle);
  const [localBannerSubtitle, setLocalBannerSubtitle] = useState(dashboardBannerSubtitle);

  useEffect(() => {
    if (deletingReceiptId) {
      const timer = setTimeout(() => setDeletingReceiptId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletingReceiptId]);

  useEffect(() => {
    setLocalBannerTitle(dashboardBannerTitle);
    setLocalBannerSubtitle(dashboardBannerSubtitle);
  }, [dashboardBannerTitle, dashboardBannerSubtitle]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { setIsAuthenticated(true); } else { setError('Acceso Denegado'); }
  };

  const handleSaveBannerTexts = async () => {
    setIsSavingBanner(true);
    await updateDashboardBannerTexts(localBannerTitle, localBannerSubtitle);
    setIsSavingBanner(false);
  };

  const handleCreateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocio.firstName || !newSocio.email || !newSocio.password) {
      showToast("Nombre, Email y Contraseña son obligatorios", "error");
      return;
    }
    setIsRegistering(true);
    try {
      const result = await register(newSocio);
      if (result.success) {
        showToast(result.message);
        setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
      } else {
        showToast(result.message, "error");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateUserPassword = async (userId: string) => {
    const newPass = tempPasswords[userId];
    if (newPass === undefined || newPass.trim() === '') {
      showToast("Contraseña inválida", "error");
      return;
    }
    const success = await updateUser(userId, { password: newPass });
    if (success) {
      showToast("Contraseña actualizada");
      setTempPasswords(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } else {
      showToast("Error al actualizar", "error");
    }
  };

  const financeMetrics = useMemo(() => {
    const totalRevenue = projects.reduce((acc, p) => acc + (Number(p.monthlyFee) || 0), 0);
    const totalPayroll = usersDB.reduce((acc, user) => acc + (Number(baseSalaries[user.id]) || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const estTaxes = Number(financeSettings.estTaxes || 0);
    const netProfit = totalRevenue - totalPayroll - totalExpenses - estTaxes;
    return { totalRevenue, totalPayroll, totalExpenses, estTaxes, netProfit };
  }, [projects, baseSalaries, usersDB, financeSettings, expenses]);

  const calculateUserBonuses = (userId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const userTasks = tasks.filter(t => 
      String(t.collaboratorId) === String(userId) &&
      new Date(t.date + 'T12:00:00').getMonth() === currentMonth &&
      new Date(t.date + 'T12:00:00').getFullYear() === currentYear
    );
    if (userTasks.length === 0) return { ninja: false, master: false };
    const allDone = userTasks.every(t => t.status === 'Completada');
    if (!allDone) return { ninja: false, master: false };
    const isNinja = userTasks.every(t => {
      if (!t.completedAt) return false;
      const deadline = new Date(t.date + 'T23:59:59');
      const completed = new Date(t.completedAt);
      return completed <= deadline;
    });
    const isMaster = userTasks.every(t => {
      if (!t.completedAt) return false;
      const deadline = new Date(t.date + 'T12:00:00');
      const completed = new Date(t.completedAt);
      const diffDays = Math.floor((deadline.getTime() - completed.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 7;
    });
    return { ninja: isNinja, master: isMaster };
  };

  const handleProcessPayment = async (user: any) => {
    const base = Number(baseSalaries[user.id] || 0);
    if (base <= 0) { showToast("Sueldo base no definido", "error"); return; }
    setIsProcessingPayment(user.id);
    const bonuses = calculateUserBonuses(user.id);
    const ninjaBonusVal = bonuses.ninja ? 10 : 0;
    const masterBonusVal = bonuses.master ? 20 : 0;
    const now = new Date();
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const receiptData = {
      id: '', userId: String(user.id), userName: `${user.firstName} ${user.lastName}`,
      month: monthNames[now.getMonth()], year: now.getFullYear(),
      baseSalary: base, ninjaBonus: ninjaBonusVal, masterBonus: masterBonusVal,
      total: base + ninjaBonusVal + masterBonusVal, date: now.toLocaleDateString('es-ES'),
      receiptNumber: `VO-${Math.floor(Math.random() * 90000) + 10000}`
    };
    const success = await sendReceiptToUser(receiptData);
    setIsProcessingPayment(null);
    if (success) showToast(`Pago enviado a ${user.firstName}`);
  };

  const handleTryDeleteReceipt = (id: string) => {
    if (deletingReceiptId === id) {
      deleteReceipt(id);
      setDeletingReceiptId(null);
    } else {
      setDeletingReceiptId(id);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark p-6 pattern-orbital-hyper relative min-h-screen">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]"></div>
        
        <div className="w-full max-w-xl glass-panel rounded-xl p-12 lg:p-16 text-center animate-in fade-in zoom-in-95 duration-1000 relative z-10 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_30px_rgba(140,43,238,0.4)]">
                    <span className="material-symbols-outlined text-3xl">terminal</span>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] italic leading-none">Matriz de Acceso</h2>
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.5em] mt-2 opacity-80">Director General Protocol</p>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <form onSubmit={handleLogin} className="w-full space-y-8 max-w-sm">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">Sincronización Obligatoria</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                    <input 
                      type="password" 
                      autoFocus 
                      className="relative w-full bg-black/80 border border-white/5 rounded-xl p-6 text-white text-center text-3xl font-black outline-none focus:border-primary/40 shadow-[inner_0_2px_10px_rgba(0,0,0,0.5)] tracking-[0.8em] transition-all" 
                      value={passwordAuth} 
                      onChange={e => setPasswordAuth(e.target.value)} 
                      placeholder="••••" 
                    />
                </div>
                {error && (
                    <div className="flex items-center justify-center gap-2 text-rose-500 animate-bounce">
                        <span className="material-symbols-outlined text-sm">report</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">{error}</p>
                    </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-5 btn-premium text-white font-black uppercase rounded-xl text-xs tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
              >
                <span>Ejecutar Validación</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">key_visualizer</span>
              </button>
            </form>

            <div className="flex items-center gap-8 mt-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
               <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">Quantum Flow Engine v4.0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto scrollbar-hide relative pattern-orbital font-display">
      <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-40 bg-background-dark/40 backdrop-blur-3xl">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg">
                <span className="material-symbols-outlined text-2xl">terminal</span>
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Oscar Chavarría <span className="text-primary">.</span></h3>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Master Protocol</p>
            </div>
        </div>
        <nav className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5 backdrop-blur-md">
          {[ {id:'analytics', icon:'grid_view'}, {id:'clients', icon:'handshake'}, {id:'users', icon:'group'}, {id:'payroll', icon:'payments'}, {id:'settings', icon:'tune'} ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="p-8 sm:p-12 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {activeView === 'analytics' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {[ 
                      { label: 'Ingresos Brutos', val: financeMetrics.totalRevenue, color: 'text-emerald-400', icon: 'monitoring' }, 
                      { label: 'Egresos Totales', val: financeMetrics.totalPayroll + financeMetrics.totalExpenses, color: 'text-rose-400', icon: 'data_usage' }, 
                      { label: 'Beneficio Final', val: financeMetrics.netProfit, color: 'text-primary', icon: 'account_balance_wallet' } 
                    ].map((stat, i) => (
                    <div key={i} className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl transition-all hover:border-primary/20">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">{stat.label}</p>
                          <span className={`material-symbols-outlined text-lg ${stat.color} opacity-30`}>{stat.icon}</span>
                        </div>
                        <h4 className={`text-3xl sm:text-4xl font-black ${stat.color} italic tracking-tighter mt-6`}>${stat.val.toLocaleString('es-ES', { minimumFractionDigits: 0 })}</h4>
                    </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
                    <div className="lg:col-span-4 glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 border border-white/5 shadow-xl">
                        <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Retenciones Fiscales</h3>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 font-black text-lg">$</span>
                            <input type="number" className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-10 text-rose-500 font-black text-2xl outline-none focus:border-rose-500/20" value={financeSettings.estTaxes} onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic leading-relaxed">Provisión automática para carga fiscal mensual proyectada.</p>
                    </div>

                    <div className="lg:col-span-8 glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 border border-white/5 overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Matriz de Egresos Variables</h3>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">${financeMetrics.totalExpenses.toFixed(0)}/mo</span>
                        </div>
                        <form onSubmit={async (e) => { e.preventDefault(); await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day); setNewExpense({ name:'', amount:'', day:'' }); }} className="flex gap-4 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                           <input required placeholder="Concepto del gasto" className="flex-[2] bg-transparent border-none px-5 py-3 text-xs text-white outline-none placeholder:text-slate-700 font-bold" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                           <input required type="number" placeholder="Monto $" className="w-28 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                           <input required type="number" placeholder="Día" className="w-20 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.day} onChange={e => setNewExpense({...newExpense, day: e.target.value})} />
                           <button type="submit" className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform shrink-0"><span className="material-symbols-outlined text-xl">add</span></button>
                        </form>
                        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/10">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-white/5 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 w-1/2">Item Operativo</th>
                                        <th className="px-6 py-4 text-center w-24">Día Ciclo</th>
                                        <th className="px-6 py-4 text-right w-32">Desembolso</th>
                                        <th className="px-6 py-4 text-right w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-white/[0.02] group transition-colors">
                                            <td className="px-6 py-5 text-white font-bold uppercase tracking-tight truncate">{e.name}</td>
                                            <td className="px-6 py-5 text-center text-slate-600 font-black">{e.date}</td>
                                            <td className="px-6 py-5 text-right text-rose-400 font-black italic">-${Number(e.amount).toFixed(0)}</td>
                                            <td className="px-6 py-5 text-right"><button onClick={() => deleteExpense(e.id)} className="text-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><span className="material-symbols-outlined text-xl">close</span></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeView === 'payroll' && (
             <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500">
                <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Nómina Estratégica de Socios</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[9px] uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                          <tr><th className="px-8 py-5">Socio</th><th className="px-8 py-5">Sueldo Base ($)</th><th className="px-8 py-5 text-center">Incentivos/Bonos</th><th className="px-8 py-5 text-right">Protocolo</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                        {usersDB.map(u => {
                            const bonuses = calculateUserBonuses(u.id);
                            return (
                                <tr key={u.id} className="hover:bg-white/[0.02] group transition-colors">
                                  <td className="px-8 py-6 flex items-center gap-5">
                                    <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-xl border border-white/10" />
                                    <div>
                                      <span className="font-bold text-white uppercase tracking-tight block">{u.firstName} {u.lastName}</span>
                                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.role}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="relative w-28">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-xs">$</span>
                                       <input type="number" className="w-full bg-black/40 border border-white/5 text-white text-base font-black rounded-xl pl-7 pr-3 py-3 outline-none" value={baseSalaries[u.id] || 0} onChange={e => updateBaseSalary(u.id, parseFloat(e.target.value) || 0)} />
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <div className="flex gap-4 items-center justify-center">
                                      <div className={`flex flex-col items-center gap-1 ${bonuses.ninja ? 'text-blue-500' : 'text-slate-800'}`}>
                                        <span className={`material-symbols-outlined text-2xl`}>military_tech</span>
                                        <span className="text-[7px] font-black uppercase tracking-widest">NINJA</span>
                                      </div>
                                      <div className={`flex flex-col items-center gap-1 ${bonuses.master ? 'text-amber-500' : 'text-slate-800'}`}>
                                        <span className={`material-symbols-outlined text-2xl`}>verified</span>
                                        <span className="text-[7px] font-black uppercase tracking-widest">MASTER</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <button disabled={isProcessingPayment === u.id} onClick={() => handleProcessPayment(u)} className={`px-8 py-3.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all ${isProcessingPayment === u.id ? 'opacity-50' : 'hover:brightness-110'}`}>
                                      {isProcessingPayment === u.id ? 'Sincronizando...' : 'EJECUTAR PAGO'}
                                    </button>
                                  </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Historial de Operaciones Financieras</h3>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{receipts.length} REGISTROS TOTALES</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {receipts.map(r => {
                            const isDeleting = deletingReceiptId === r.id;
                            return (
                                <div key={r.id} className={`glass-panel px-8 py-5 rounded-[2rem] border flex items-center justify-between transition-all duration-300 shadow-xl ${isDeleting ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 hover:bg-white/[0.02]'}`}>
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <span className="px-3 py-1 bg-black/40 rounded-xl text-[9px] font-mono text-primary border border-white/5 shrink-0 shadow-inner">{r.receiptNumber}</span>
                                        <div>
                                          <span className="text-sm font-black text-white uppercase truncate tracking-tight block">{r.userName}</span>
                                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{r.month} {r.year} • Ciclo Operativo</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                          <span className="text-2xl font-black text-emerald-500 italic tracking-tighter block">${Number(r.total).toFixed(0)}</span>
                                          <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Liquidez Enviada</span>
                                        </div>
                                        <button 
                                            onClick={() => handleTryDeleteReceipt(r.id)} 
                                            className={`transition-all w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${
                                                isDeleting 
                                                ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                                                : 'text-slate-800 border-white/5 hover:text-rose-500 hover:bg-rose-500/10'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-xl">{isDeleting ? 'report' : 'delete'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
          )}

          {activeView === 'clients' && (
            <div className="animate-in fade-in space-y-8">
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                   <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Matriz de Honorarios por Marca</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[9px] uppercase text-slate-600 font-black tracking-widest">
                    <tr><th className="px-8 py-5">Identificador de Marca</th><th className="px-8 py-5">Fee Mensual Contratado ($)</th><th className="px-8 py-5 text-right">Gestión</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] group transition-colors">
                        <td className="px-8 py-6 flex items-center gap-5">
                          <img src={p.logoUrl} className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-white/10" />
                          <div>
                            <span className="font-black text-white uppercase tracking-tight block">{p.name}</span>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{p.niche}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="relative w-32">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xs">$</span>
                             <input type="number" className="w-full bg-black/40 border border-white/5 rounded-xl px-7 py-3 text-emerald-500 font-black text-lg outline-none focus:border-emerald-500/20" value={p.monthlyFee || 0} onChange={e => updateProject(p.id, { monthlyFee: Number(e.target.value) })} />
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => deleteProject(p.id)} className="w-10 h-10 rounded-xl text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center ml-auto">
                            <span className="material-symbols-outlined text-2xl">delete_sweep</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="animate-in fade-in space-y-10 sm:space-y-12">
              <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] space-y-8 border border-white/5 shadow-2xl">
                <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Protocolo de Alta de Nuevos Socios</h3>
                <form onSubmit={handleCreateSocio} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-bold uppercase" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Apellido</label>
                    <input className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-bold uppercase" value={newSocio.lastName} onChange={e => setNewSocio({...newSocio, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Email Corporativo</label>
                    <input required type="email" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-bold" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Rol en el Workspace</label>
                    <input className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-bold uppercase" value={newSocio.role} onChange={e => setNewSocio({...newSocio, role: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Clave de Acceso</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-bold" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha Nacimiento</label>
                    <input type="date" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none" value={newSocio.birthDate} onChange={e => setNewSocio({...newSocio, birthDate: e.target.value})} />
                  </div>
                  <button type="submit" disabled={isRegistering} className="lg:col-span-3 mt-4 btn-premium text-white font-black text-xs uppercase rounded-[2rem] h-16 shadow-2xl active:scale-95 transition-all">
                    {isRegistering ? 'Procesando Protocolo...' : 'Sincronizar Nuevo Socio al Sistema'}
                  </button>
                </form>
              </div>
              
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                      <tr><th className="px-8 py-5">Identidad del Socio</th><th className="px-8 py-5">Gestión de Claves</th><th className="px-8 py-5 text-right">Administración</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {usersDB.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] group transition-colors">
                          <td className="px-8 py-6 flex items-center gap-5">
                            <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-xl border border-white/10" />
                            <div>
                               <span className="font-bold text-white uppercase tracking-tight block">{u.firstName} {u.lastName}</span>
                               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                               <input type="text" className="bg-black/40 border border-white/5 rounded-xl px-5 py-2.5 text-white font-mono text-xs w-32 outline-none" value={tempPasswords[u.id] !== undefined ? tempPasswords[u.id] : (u.password || '')} onChange={e => setTempPasswords(prev => ({ ...prev, [u.id]: e.target.value }))} />
                               <button onClick={() => handleUpdateUserPassword(u.id)} className="text-primary hover:scale-110 transition-transform shadow-lg"><span className="material-symbols-outlined text-2xl">check_circle</span></button>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => deleteUser(u.id)} className="w-10 h-10 rounded-xl text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center ml-auto">
                               <span className="material-symbols-outlined text-2xl">person_remove</span>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="animate-in fade-in space-y-10 sm:space-y-12 pb-24">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest w-full italic mb-10 text-center">Identidad de Agencia</h3>
                    <div className="w-48 h-48 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all" onClick={() => logoInputRef.current?.click()}>
                      {studioLogo ? (
                        <img src={studioLogo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <span className="material-symbols-outlined text-6xl opacity-20 text-primary">image</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                      </div>
                    </div>
                    <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">Tamaño sugerido: 512x512px • PNG/SVG</p>
                    <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateStudioLogo(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest w-full italic mb-6 text-center">Banner Dashboard</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all mb-6" onClick={() => bannerInputRef.current?.click()}>
                      <img src={dashboardBanner} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">add_photo_alternate</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                        <input className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white font-black text-[10px] uppercase outline-none focus:border-primary/20 italic" value={localBannerTitle} onChange={e => setLocalBannerTitle(e.target.value)} placeholder="Título del Banner" />
                        <input className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-slate-500 text-[9px] font-bold uppercase outline-none focus:border-primary/20" value={localBannerSubtitle} onChange={e => setLocalBannerSubtitle(e.target.value)} placeholder="Subtítulo del Banner" />
                        <button onClick={handleSaveBannerTexts} disabled={isSavingBanner} className="w-full py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white font-black rounded-xl uppercase text-[8px] tracking-widest transition-all">
                          {isSavingBanner ? 'Sincronizando...' : 'Sincronizar Textos Banner'}
                        </button>
                    </div>
                    <input type="file" hidden ref={bannerInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateDashboardBanner(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest w-full italic mb-10 text-center">Ambiente Visual Login</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all" onClick={() => bgInputRef.current?.click()}>
                      <img src={loginBackground} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">wallpaper</span>
                      </div>
                    </div>
                    <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">Fondo panorámico de alta fidelidad</p>
                    <input type="file" hidden ref={bgInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateLoginBackground(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] space-y-6 border border-white/5 shadow-2xl flex flex-col justify-center relative overflow-hidden lg:col-span-3">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest italic mb-4">Textos de Bienvenida</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Título Principal</label>
                        <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-black text-base uppercase outline-none focus:border-primary/20 italic shadow-inner" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Subtítulo Descriptivo</label>
                        <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-500 text-xs font-bold uppercase outline-none focus:border-primary/20 h-24 resize-none shadow-inner" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                      </div>
                    </div>
                    <button onClick={() => updateLoginTexts(localTitle, localSubtitle)} className="w-full py-4 mt-4 bg-primary text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:brightness-110 shadow-2xl active:scale-95 transition-all">Sincronizar Textos Maestros</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
