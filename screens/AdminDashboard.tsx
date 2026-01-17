
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';

const AdminDashboard: React.FC = () => {
  const { 
    projects, usersDB, sendReceiptToUser, deleteReceipt, updateBaseSalary, baseSalaries, 
    financeSettings, updateFinanceSettings, expenses, addExpense, deleteExpense,
    studioLogo, updateStudioLogo, loginBackground, updateLoginBackground, 
    loginTitle, loginSubtitle, updateLoginTexts, showToast, register, updateUser, updateProject, deleteProject, deleteUser, tasks, receipts
  } = useProjects();
  
  const [passwordAuth, setPasswordAuth] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'analytics' | 'payroll' | 'clients' | 'users' | 'settings'>('analytics');
  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [newSocio, setNewSocio] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '' });
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);

  useEffect(() => {
    if (deletingReceiptId) {
      const timer = setTimeout(() => setDeletingReceiptId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deletingReceiptId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { setIsAuthenticated(true); } else { setError('Acceso Denegado'); }
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
      <div className="flex-1 flex items-center justify-center bg-background-dark p-6 pattern-orbital relative">
        <div className="w-full max-w-xs glass-panel rounded-[2rem] p-8 text-center animate-in shadow-2xl relative z-10 border border-white/10">
          <span className="material-symbols-outlined text-primary text-3xl mb-6">admin_panel_settings</span>
          <h2 className="text-[10px] font-black text-white mb-8 uppercase tracking-[0.3em] italic">Consola Maestra</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" autoFocus className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white text-center text-2xl font-black outline-none focus:border-primary shadow-inner tracking-widest" value={passwordAuth} onChange={e => setPasswordAuth(e.target.value)} placeholder="••••" />
            {error && <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest">{error}</p>}
            <button type="submit" className="w-full py-3.5 bg-primary text-white font-black uppercase rounded-xl text-[9px] tracking-widest shadow-xl active:scale-95 transition-all">Sincronizar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto scrollbar-hide relative pattern-orbital font-display">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-40 bg-background-dark/40 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                <span className="material-symbols-outlined text-lg">terminal</span>
            </div>
            <div>
                <h3 className="text-xs font-black text-white uppercase tracking-tight italic">Oscar Chavarría <span className="text-primary">.</span></h3>
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Master Protocol</p>
            </div>
        </div>
        <nav className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-0.5 backdrop-blur-md">
          {[ {id:'analytics', icon:'grid_view'}, {id:'clients', icon:'handshake'}, {id:'users', icon:'group'}, {id:'payroll', icon:'payments'}, {id:'settings', icon:'tune'} ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`p-2 rounded-lg transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="p-4 sm:p-6 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {activeView === 'analytics' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {[ 
                      { label: 'Ingresos Brutos', val: financeMetrics.totalRevenue, color: 'text-emerald-400', icon: 'monitoring' }, 
                      { label: 'Egresos Totales', val: financeMetrics.totalPayroll + financeMetrics.totalExpenses, color: 'text-rose-400', icon: 'data_usage' }, 
                      { label: 'Beneficio Final', val: financeMetrics.netProfit, color: 'text-primary', icon: 'account_balance_wallet' } 
                    ].map((stat, i) => (
                    <div key={i} className="p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-xl">
                        <div className="flex justify-between items-start">
                          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest opacity-60">{stat.label}</p>
                          <span className={`material-symbols-outlined text-xs ${stat.color} opacity-30`}>{stat.icon}</span>
                        </div>
                        <h4 className={`text-xl sm:text-2xl font-black ${stat.color} italic tracking-tighter mt-3`}>${stat.val.toFixed(0)}</h4>
                    </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                    <div className="lg:col-span-4 glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] space-y-4 border border-white/5">
                        <h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Retenciones</h3>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-black text-[10px]">$</span>
                            <input type="number" className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 pl-7 text-rose-500 font-black text-lg outline-none focus:border-rose-500/20" value={financeSettings.estTaxes} onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <p className="text-[6px] text-slate-600 uppercase font-black tracking-tighter italic">Carga fiscal mensual</p>
                    </div>

                    <div className="lg:col-span-8 glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] space-y-4 border border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Matriz de Egresos</h3>
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">${financeMetrics.totalExpenses.toFixed(0)}/mo</span>
                        </div>
                        <form onSubmit={async (e) => { e.preventDefault(); await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day); setNewExpense({ name:'', amount:'', day:'' }); }} className="flex gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                           <input required placeholder="Concepto" className="flex-[2] bg-transparent border-none px-3 py-1 text-[9px] text-white outline-none placeholder:text-slate-700 font-bold" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                           <input required type="number" placeholder="Monto $" className="w-20 bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[9px] text-white outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                           <input required type="number" placeholder="Día" className="w-12 bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[9px] text-white outline-none" value={newExpense.day} onChange={e => setNewExpense({...newExpense, day: e.target.value})} />
                           <button type="submit" className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"><span className="material-symbols-outlined text-xs">add</span></button>
                        </form>
                        <div className="overflow-hidden rounded-xl border border-white/5">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-white/5 text-[6px] font-black uppercase text-slate-600 tracking-widest">
                                    <tr className="border-b border-white/5">
                                        <th className="px-4 py-2 w-1/2">Item</th>
                                        <th className="px-4 py-2 text-center w-20">Día</th>
                                        <th className="px-4 py-2 text-right w-24">Monto</th>
                                        <th className="px-4 py-2 text-right w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-[8px] sm:text-[9px]">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-white/[0.01] group transition-colors">
                                            <td className="px-4 py-2 text-white font-bold uppercase tracking-tight truncate">{e.name}</td>
                                            <td className="px-4 py-2 text-center text-slate-600 font-black">{e.date}</td>
                                            <td className="px-4 py-2 text-right text-rose-400 font-black italic">-${Number(e.amount).toFixed(0)}</td>
                                            <td className="px-4 py-2 text-right"><button onClick={() => deleteExpense(e.id)} className="text-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><span className="material-symbols-outlined text-xs">close</span></button></td>
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
             <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
                <div className="glass-panel rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-white/5">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Nómina Estratégica</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[6px] uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                          <tr><th className="px-4 py-2">Socio</th><th className="px-4 py-2">Base ($)</th><th className="px-4 py-2 text-center">Bonos</th><th className="px-4 py-2 text-right">Acción</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[8px] sm:text-[9px]">
                        {usersDB.map(u => {
                            const bonuses = calculateUserBonuses(u.id);
                            return (
                                <tr key={u.id} className="hover:bg-white/[0.01] group transition-colors">
                                  <td className="px-4 py-2 flex items-center gap-3">
                                    <img src={u.avatar} className="w-6 h-6 rounded-lg object-cover transition-all" />
                                    <span className="font-bold text-white uppercase">{u.firstName}</span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <input type="number" className="w-14 bg-black/40 border border-white/5 text-white text-[9px] font-black rounded-lg px-2 py-1 outline-none" value={baseSalaries[u.id] || 0} onChange={e => updateBaseSalary(u.id, parseFloat(e.target.value) || 0)} />
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex gap-2 items-center justify-center transition-opacity">
                                      <span className={`material-symbols-outlined text-sm ${bonuses.ninja ? 'text-blue-500' : 'text-slate-800'}`}>military_tech</span>
                                      <span className={`material-symbols-outlined text-sm ${bonuses.master ? 'text-amber-500' : 'text-slate-800'}`}>verified</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button disabled={isProcessingPayment === u.id} onClick={() => handleProcessPayment(u)} className={`px-2.5 py-1 bg-emerald-500 text-white text-[7px] font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all ${isProcessingPayment === u.id ? 'opacity-50' : ''}`}>
                                      {isProcessingPayment === u.id ? '...' : 'PAGAR'}
                                    </button>
                                  </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Historial Operativo</h3>
                        <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest">{receipts.length} OPERACIONES</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {receipts.map(r => {
                            const isDeleting = deletingReceiptId === r.id;
                            return (
                                <div key={r.id} className={`glass-panel px-4 py-2.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${isDeleting ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 hover:bg-white/[0.01]'}`}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="px-1.5 py-0.5 bg-black/40 rounded text-[7px] font-mono text-primary border border-white/5 shrink-0">{r.receiptNumber}</span>
                                        <span className="text-[9px] font-bold text-white uppercase truncate tracking-tight">{r.userName}</span>
                                        <span className="hidden sm:inline text-[7px] font-black text-slate-700 uppercase tracking-widest">{r.month} {r.year}</span>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="text-[10px] font-black text-emerald-500 italic tracking-tighter">${Number(r.total).toFixed(0)}</span>
                                        <button 
                                            onClick={() => handleTryDeleteReceipt(r.id)} 
                                            className={`transition-all w-7 h-7 rounded-lg flex items-center justify-center border ${
                                                isDeleting 
                                                ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                                                : 'text-slate-800 border-white/5 hover:text-rose-500 hover:bg-rose-500/10'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">{isDeleting ? 'report' : 'delete'}</span>
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
            <div className="animate-in fade-in space-y-4">
              <div className="glass-panel rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-white/5">
                <div className="p-4 border-b border-white/5"><h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Honorarios de Marcas</h3></div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[6px] uppercase text-slate-600 font-black tracking-widest">
                    <tr><th className="px-4 py-2">Marca</th><th className="px-4 py-2">Fee Mensual ($)</th><th className="px-4 py-2 text-right"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[8px] sm:text-[9px]">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.01] group transition-colors">
                        <td className="px-4 py-2 flex items-center gap-3"><img src={p.logoUrl} className="w-7 h-7 rounded-lg object-cover shadow-sm" /><span className="font-black text-white uppercase">{p.name}</span></td>
                        <td className="px-4 py-2"><input type="number" className="w-16 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-emerald-500 font-black text-[9px] outline-none" value={p.monthlyFee || 0} onChange={e => updateProject(p.id, { monthlyFee: Number(e.target.value) })} /></td>
                        <td className="px-4 py-2 text-right"><button onClick={() => deleteProject(p.id)} className="text-rose-500/10 hover:text-rose-500 transition-all"><span className="material-symbols-outlined text-base">delete_sweep</span></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="animate-in fade-in space-y-4 sm:space-y-6">
              <div className="glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] space-y-4 border border-white/5">
                <h3 className="text-[8px] font-black text-white uppercase italic tracking-widest">Alta de Socios</h3>
                <form onSubmit={handleCreateSocio} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <input required placeholder="Nombre" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none font-bold uppercase" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} />
                  <input placeholder="Apellido" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none font-bold uppercase" value={newSocio.lastName} onChange={e => setNewSocio({...newSocio, lastName: e.target.value})} />
                  <input required type="email" placeholder="Email" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none font-bold" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} />
                  <input placeholder="Rol" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none font-bold uppercase" value={newSocio.role} onChange={e => setNewSocio({...newSocio, role: e.target.value})} />
                  <input required placeholder="Pass" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none font-bold" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} />
                  <input type="date" className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[9px] text-white outline-none" value={newSocio.birthDate} onChange={e => setNewSocio({...newSocio, birthDate: e.target.value})} />
                  <button type="submit" disabled={isRegistering} className="lg:col-span-2 bg-primary text-white font-black text-[8px] uppercase rounded-xl h-8 shadow-lg hover:brightness-110 active:scale-95 transition-all">
                    {isRegistering ? '...' : 'Sincronizar Socio'}
                  </button>
                </form>
              </div>
              
              <div className="glass-panel rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden border border-white/5">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[6px] uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                      <tr><th className="px-4 py-2">Socio</th><th className="px-4 py-2">Pass</th><th className="px-4 py-2 text-right">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[8px] sm:text-[9px]">
                      {usersDB.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] group transition-colors">
                          <td className="px-4 py-2 flex items-center gap-3"><img src={u.avatar} className="w-6 h-6 rounded-lg object-cover transition-all" /><span className="font-bold text-white uppercase">{u.firstName}</span></td>
                          <td className="px-4 py-2"><div className="flex items-center gap-2"><input type="text" className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-white font-mono text-[9px] w-20 outline-none" value={tempPasswords[u.id] !== undefined ? tempPasswords[u.id] : (u.password || '')} onChange={e => setTempPasswords(prev => ({ ...prev, [u.id]: e.target.value }))} /><button onClick={() => handleUpdateUserPassword(u.id)} className="text-primary hover:scale-110 transition-transform"><span className="material-symbols-outlined text-base">check_circle</span></button></div></td>
                          <td className="px-4 py-2 text-right"><button onClick={() => deleteUser(u.id)} className="text-rose-500/10 hover:text-rose-500 transition-all"><span className="material-symbols-outlined text-base">person_remove</span></button></td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="animate-in fade-in space-y-4 sm:space-y-6 pb-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-col items-center border border-white/5 shadow-xl group">
                    <h3 className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-full italic mb-4">Branding</h3>
                    <div className="w-40 h-40 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all" onClick={() => logoInputRef.current?.click()}>
                      {studioLogo ? (
                        <img src={studioLogo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl opacity-20 text-primary">image</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white">add_a_photo</span>
                      </div>
                    </div>
                    <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateStudioLogo(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-col items-center border border-white/5 shadow-xl group">
                    <h3 className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-full italic mb-4">Ambiente</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all" onClick={() => bgInputRef.current?.click()}>
                      <img src={loginBackground} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white">wallpaper</span>
                      </div>
                    </div>
                    <input type="file" hidden ref={bgInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateLoginBackground(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] space-y-2.5 border border-white/5 shadow-xl flex flex-col justify-center">
                    <h3 className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Textos</h3>
                    <input className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-white font-black text-[9px] uppercase outline-none focus:border-primary/20 italic" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                    <input className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-slate-500 text-[8px] font-bold uppercase outline-none focus:border-primary/20" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                    <button onClick={() => updateLoginTexts(localTitle, localSubtitle)} className="w-full py-1.5 bg-primary text-white font-black rounded-lg uppercase text-[8px] tracking-widest hover:brightness-110">Sync</button>
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
