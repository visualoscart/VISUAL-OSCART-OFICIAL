
import React, { useState, useMemo, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';

const AdminDashboard: React.FC = () => {
  // Added deleteProject to the hook destructuring to fix the reference error on line 333
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
  const [receiptToDeleteId, setReceiptToDeleteId] = useState<string | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  const [newSocio, setNewSocio] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '' });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { setIsAuthenticated(true); } else { setError('Acceso Denegado'); }
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

  const handleCreateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocio.birthDate) { showToast("Cumpleaños obligatorio", "error"); return; }
    setIsRegistering(true);
    const res = await register(newSocio);
    if (res.success) {
      showToast("Socio creado");
      setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
    } else { showToast(res.message, "error"); }
    setIsRegistering(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount || !newExpense.day) return;
    await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day);
    setNewExpense({ name: '', amount: '', day: '' });
  };

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>, callback: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => callback(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcessPayment = async (user: any) => {
    const base = Number(baseSalaries[user.id] || 0);
    if (base <= 0) { showToast("Sueldo base no definido", "error"); return; }

    setIsProcessingPayment(user.id);
    const bonuses = calculateUserBonuses(user.id);
    const ninjaBonusVal = bonuses.ninja ? 10 : 0;
    const masterBonusVal = bonuses.master ? 20 : 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    const receiptData = {
      id: '',
      userId: String(user.id),
      userName: `${user.firstName} ${user.lastName}`,
      month: monthNames[currentMonth],
      year: currentYear,
      baseSalary: base,
      ninjaBonus: ninjaBonusVal,
      masterBonus: masterBonusVal,
      total: base + ninjaBonusVal + masterBonusVal,
      date: now.toLocaleDateString('es-ES'),
      receiptNumber: `VO-${Math.floor(Math.random() * 90000) + 10000}`
    };

    const success = await sendReceiptToUser(receiptData);
    setIsProcessingPayment(null);
    if (success) { showToast(`Pago enviado a ${user.firstName}`); } else { showToast("Fallo en persistencia", "error"); }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark p-6">
        <div className="w-full max-sm glass-panel rounded-[2.5rem] p-10 text-center animate-in shadow-2xl">
          <span className="material-symbols-outlined text-4xl text-primary mb-6">lock_person</span>
          <h2 className="text-xl font-display text-white mb-8 uppercase tracking-tight italic">Consola Maestra</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" autoFocus className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-center text-2xl font-bold outline-none focus:border-primary" value={passwordAuth} onChange={e => setPasswordAuth(e.target.value)} placeholder="••••" />
            {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
            <button type="submit" className="w-full py-4 bg-primary text-white font-display uppercase rounded-xl text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Acceder</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark overflow-y-auto scrollbar-hide">
      <header className="px-10 py-8 border-b border-white/5 flex flex-col lg:flex-row items-center justify-between sticky top-0 z-40 bg-background-dark/80 backdrop-blur-xl gap-6">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"><span className="material-symbols-outlined text-2xl">terminal</span></div>
            <div>
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Director Creativo</h2>
                <h3 className="text-xl font-display text-white uppercase tracking-tight italic">Oscar Chavarría</h3>
            </div>
        </div>
        <div className="flex flex-wrap justify-center bg-white/5 p-1 rounded-2xl border border-white/5 gap-1">
          {[ 
            {id:'analytics', icon:'grid_view', label:'Métricas'}, 
            {id:'clients', icon:'handshake', label:'Marcas'}, 
            {id:'users', icon:'group', label:'Socios'}, 
            {id:'payroll', icon:'payments', label:'Nómina'}, 
            {id:'settings', icon:'stylus_note', label:'Portal'} 
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="p-10 pb-32">
        <div className="max-w-6xl mx-auto space-y-12">
          {activeView === 'analytics' && (
            <div className="space-y-10 animate-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[ 
                        { label: 'Ingresos Mensuales (Bruto)', val: `$${financeMetrics.totalRevenue}`, color: 'text-emerald-400', icon: 'monitoring' }, 
                        { label: 'Gastos + Nómina', val: `$${financeMetrics.totalPayroll + financeMetrics.totalExpenses}`, color: 'text-rose-400', icon: 'data_usage' }, 
                        { label: 'Ganancia Neta (Final)', val: `$${financeMetrics.netProfit.toFixed(0)}`, color: 'text-primary', icon: 'account_balance_wallet' }
                    ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] space-y-6 shadow-xl">
                        <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <span className="material-symbols-outlined text-white/10">{stat.icon}</span>
                        </div>
                        <h4 className={`text-3xl font-display ${stat.color} italic tracking-tighter`}>{stat.val}</h4>
                    </div>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 glass-panel p-8 rounded-[3rem] space-y-6">
                        <h3 className="text-sm font-display text-white uppercase italic tracking-tight">Personalizar Impuestos</h3>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto de Retenciones / Otros</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                                <input type="number" className="w-full bg-background-dark border border-white/10 rounded-2xl p-5 pl-10 text-rose-500 font-display text-xl outline-none focus:border-rose-500" value={financeSettings.estTaxes} onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 glass-panel p-8 rounded-[3rem] space-y-8">
                        <h3 className="text-sm font-display text-white uppercase italic tracking-tight flex items-center justify-between">
                            Gestión de Gastos Fijos (JSON Store)
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Mensual: ${financeMetrics.totalExpenses.toFixed(0)}</span>
                        </h3>
                        
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl">
                           <input required placeholder="Concepto (ej: Canva)" className="bg-background-dark border border-white/5 rounded-xl px-4 py-3 text-xs text-white" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                           <input required type="number" placeholder="Monto $" className="bg-background-dark border border-white/5 rounded-xl px-4 py-3 text-xs text-white" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                           <div className="flex gap-2">
                             <input required type="number" placeholder="Día (ej: 15)" className="flex-1 bg-background-dark border border-white/5 rounded-xl px-4 py-3 text-xs text-white" value={newExpense.day} onChange={e => setNewExpense({...newExpense, day: e.target.value})} />
                             <button type="submit" className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">add</span></button>
                           </div>
                        </form>

                        <div className="overflow-hidden rounded-2xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[8px] font-black uppercase text-slate-500 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Concepto</th>
                                        <th className="px-6 py-4 text-center">Día Pago</th>
                                        <th className="px-6 py-4 text-right">Monto</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 text-xs font-bold text-white uppercase">{e.name}</td>
                                            <td className="px-6 py-4 text-center text-[10px] text-slate-500 font-black tracking-widest">{e.date}</td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-rose-500">-${Number(e.amount).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => deleteExpense(e.id)} className="p-2 text-rose-500/30 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </td>
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
             <div className="space-y-12 animate-in">
                <div className="glass-panel rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5">
                        <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Emisión de Pagos y Logros Calificados</h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest border-b border-white/5">
                        <tr>
                            <th className="px-10 py-5">Socio</th>
                            <th className="px-10 py-5">Sueldo Base ($)</th>
                            <th className="px-10 py-5">Logros del Mes</th>
                            <th className="px-10 py-5 text-right">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {usersDB.map(u => {
                            const bonuses = calculateUserBonuses(u.id);
                            return (
                                <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-10 py-6 font-bold text-sm text-white uppercase tracking-tight">{u.firstName} {u.lastName}</td>
                                <td className="px-10 py-6">
                                    <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <input type="number" className="w-full bg-black/40 border border-white/5 text-white text-sm font-bold rounded-xl pl-6 pr-3 py-2 outline-none focus:border-primary" value={baseSalaries[u.id] || 0} onChange={e => updateBaseSalary(u.id, parseFloat(e.target.value) || 0)} />
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col items-center gap-1 group relative">
                                            <span className={`material-symbols-outlined text-3xl transition-all duration-300 ${bonuses.ninja ? 'text-blue-500 scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-slate-700 opacity-30'}`}>military_tech</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${bonuses.ninja ? 'text-blue-400' : 'text-slate-800'}`}>{bonuses.ninja ? 'Ninja +$10' : 'Ninja'}</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/5"></div>
                                        <div className="flex flex-col items-center gap-1 group relative">
                                            <span className={`material-symbols-outlined text-3xl transition-all duration-300 ${bonuses.master ? 'text-amber-500 scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-slate-700 opacity-30'}`}>verified</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${bonuses.master ? 'text-amber-400' : 'text-slate-800'}`}>{bonuses.master ? 'Master +$20' : 'Master'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button disabled={isProcessingPayment === u.id} onClick={() => handleProcessPayment(u)} className={`px-6 py-3 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-2xl shadow-lg active:scale-95 transition-all ${isProcessingPayment === u.id ? 'opacity-50 cursor-wait' : ''}`}>
                                    {isProcessingPayment === u.id ? 'PROCESANDO...' : 'EMITIR PAGO'}
                                    </button>
                                </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    </div>
                </div>
             </div>
          )}

          {activeView === 'clients' && (
            <div className="animate-in space-y-8">
              <div className="glass-panel rounded-[3rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-display text-white uppercase italic tracking-tight">Gestión de Honorarios por Marca</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest">
                    <tr><th className="px-10 py-5">Marca</th><th className="px-10 py-5">Honorario Mensual ($)</th><th className="px-10 py-5 text-right">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.01]">
                        <td className="px-10 py-6 font-bold text-white uppercase text-sm">{p.name}</td>
                        <td className="px-10 py-6">
                          <input type="number" className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-white font-bold outline-none focus:border-primary w-40" value={p.monthlyFee || 0} onChange={e => updateProject(p.id, { monthlyFee: Number(e.target.value) })} />
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button onClick={() => deleteProject(p.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><span className="material-symbols-outlined">delete_forever</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="animate-in space-y-12">
              <div className="glass-panel p-10 rounded-[3rem] space-y-8">
                <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Registro de Nuevo Socio</h3>
                <form onSubmit={handleCreateSocio} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Nombre</label>
                    <input className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Apellido</label>
                    <input className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.lastName} onChange={e => setNewSocio({...newSocio, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Email</label>
                    <input className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Puesto</label>
                    <input className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.role} onChange={e => setNewSocio({...newSocio, role: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Password</label>
                    <input className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase px-1">Cumpleaños</label>
                    <input type="date" className="w-full bg-background-dark border border-white/10 rounded-xl p-4 text-white text-sm" value={newSocio.birthDate} onChange={e => setNewSocio({...newSocio, birthDate: e.target.value})} />
                  </div>
                  <button type="submit" disabled={isRegistering} className="lg:col-span-3 py-5 bg-primary text-white font-black text-[11px] uppercase rounded-2xl shadow-xl transition-all active:scale-95">
                    {isRegistering ? 'Procesando...' : 'Dar de Alta Socio'}
                  </button>
                </form>
              </div>

              <div className="glass-panel rounded-[3rem] overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest">
                      <tr><th className="px-10 py-5">Socio</th><th className="px-10 py-5">Puesto</th><th className="px-10 py-5 text-right">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersDB.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01]">
                          <td className="px-10 py-6 text-sm font-bold text-white uppercase">{u.firstName} {u.lastName}</td>
                          <td className="px-10 py-6 text-xs text-slate-400 font-black uppercase tracking-widest">{u.role}</td>
                          <td className="px-10 py-6 text-right">
                            <button onClick={() => deleteUser(u.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><span className="material-symbols-outlined">person_remove</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="animate-in space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="glass-panel p-10 rounded-[3rem] space-y-8 flex flex-col items-center">
                    <h3 className="text-sm font-display text-white uppercase tracking-tight w-full">Identidad Visual Studio</h3>
                    <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center overflow-hidden">
                      {studioLogo ? <img src={studioLogo} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl opacity-20">image</span>}
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">Cambiar Logo</button>
                    <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={e => handleFileRead(e, updateStudioLogo)} />
                  </div>

                  <div className="glass-panel p-10 rounded-[3rem] space-y-8 flex flex-col items-center">
                    <h3 className="text-sm font-display text-white uppercase tracking-tight w-full">Ambiente de Acceso</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                      <img src={loginBackground} className="w-full h-full object-cover opacity-50" />
                    </div>
                    <button onClick={() => bgInputRef.current?.click()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">Cambiar Wallpaper</button>
                    <input type="file" hidden ref={bgInputRef} accept="image/*" onChange={e => handleFileRead(e, updateLoginBackground)} />
                  </div>
               </div>

               <div className="glass-panel p-10 rounded-[3rem] space-y-8">
                  <h3 className="text-sm font-display text-white uppercase italic tracking-tight">Textos de Bienvenida</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Título Principal</label>
                      <input className="w-full bg-background-dark border border-white/10 rounded-2xl p-5 text-white font-display text-xl outline-none" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Subtítulo Descriptivo</label>
                      <input className="w-full bg-background-dark border border-white/10 rounded-2xl p-5 text-white text-sm outline-none" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                    </div>
                    <button onClick={() => updateLoginTexts(localTitle, localSubtitle)} className="w-full py-5 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20">Sincronizar Textos</button>
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
