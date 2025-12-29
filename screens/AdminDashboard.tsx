
import React, { useState, useMemo, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';

const AdminDashboard: React.FC = () => {
  const { 
    projects, usersDB, sendReceiptToUser, deleteReceipt, updateBaseSalary, baseSalaries, 
    financeSettings, updateFinanceSettings, expenses, addExpense, deleteExpense,
    studioLogo, updateStudioLogo, loginBackground, updateLoginBackground, 
    loginTitle, loginSubtitle, updateLoginTexts, showToast, register, updateUser, updateProject, deleteUser, tasks, receipts
  } = useProjects();
  
  const [passwordAuth, setPasswordAuth] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'analytics' | 'payroll' | 'clients' | 'users' | 'settings'>('analytics');
  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [receiptToDeleteId, setReceiptToDeleteId] = useState<string | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Estados para nuevo socio
  const [newSocio, setNewSocio] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    role: 'Colaborador', 
    birthDate: '' 
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados para nuevo gasto
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '' });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { 
      setIsAuthenticated(true); 
    } else { 
      setError('Acceso Denegado'); 
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

  const handleCreateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocio.birthDate) {
      showToast("La fecha de cumpleaños es obligatoria", "error");
      return;
    }
    setIsRegistering(true);
    const res = await register(newSocio);
    if (res.success) {
      showToast("¡Socio creado con éxito!");
      setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
    } else {
      showToast(res.message, "error");
    }
    setIsRegistering(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount || !newExpense.day) return;
    await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day);
    setNewExpense({ name: '', amount: '', day: '' });
  };

  const handleDeleteExpenseStep = async (id: string) => {
    if (expenseToDeleteId === id) {
      await deleteExpense(id);
      setExpenseToDeleteId(null);
    } else {
      setExpenseToDeleteId(id);
      setTimeout(() => setExpenseToDeleteId(null), 3000);
    }
  };

  const handleProcessPayment = async (user: any) => {
    const base = Number(baseSalaries[user.id] || 0);
    if (base <= 0) {
      showToast("Asigna un salario base primero", "error");
      return;
    }

    setIsProcessingPayment(user.id);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    
    const userTasks = tasks.filter(t => 
      String(t.collaboratorId) === String(user.id) && 
      new Date(t.date).getMonth() === currentMonth && 
      new Date(t.date).getFullYear() === currentYear
    );
    const allDone = userTasks.length > 0 && userTasks.every(t => t.status === 'Completada');
    
    let ninjaBonus = 0;
    let masterBonus = 0;
    
    if (allDone) {
      const allOnTime = userTasks.every(t => t.completedAt && new Date(t.completedAt) <= new Date(t.date));
      if (allOnTime) ninjaBonus = 10;
      
      const allAnticipated = userTasks.every(t => {
        if (!t.completedAt) return false;
        const diff = (new Date(t.date).getTime() - new Date(t.completedAt).getTime()) / (1000 * 3600 * 24);
        return diff >= 7;
      });
      if (allAnticipated) masterBonus = 20;
    }

    const receiptData = {
      id: '',
      userId: String(user.id),
      userName: `${user.firstName} ${user.lastName}`,
      month: monthNames[currentMonth],
      year: currentYear,
      baseSalary: base,
      ninjaBonus: ninjaBonus,
      masterBonus: masterBonus,
      total: base + ninjaBonus + masterBonus,
      date: now.toLocaleDateString('es-ES'),
      receiptNumber: `VO-${Math.floor(Math.random() * 90000) + 10000}`
    };

    const success = await sendReceiptToUser(receiptData);
    setIsProcessingPayment(null);

    if (success) {
      showToast(`Liquidación enviada a ${user.firstName}`);
    } else {
      showToast("Error crítico de persistencia", "error");
    }
  };

  const handleDeleteReceiptStep = async (id: string) => {
    if (receiptToDeleteId === id) {
      await deleteReceipt(id);
      setReceiptToDeleteId(null);
    } else {
      setReceiptToDeleteId(id);
      setTimeout(() => setReceiptToDeleteId(null), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-dark p-6">
        <div className="w-full max-sm glass-panel rounded-[2.5rem] p-10 text-center animate-in shadow-2xl">
          <span className="material-symbols-outlined text-4xl text-primary mb-6">lock_person</span>
          <h2 className="text-xl font-display text-white mb-8 uppercase tracking-tight italic">Consola Maestra</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              autoFocus 
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-center text-2xl font-bold outline-none focus:border-primary transition-all" 
              value={passwordAuth} 
              onChange={e => setPasswordAuth(e.target.value)} 
              placeholder="••••" 
            />
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
            <button 
              key={tab.id} 
              onClick={() => setActiveView(tab.id as any)} 
              className={`px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="p-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* VISTA MÉTRICAS */}
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
                                <input 
                                    type="number" 
                                    className="w-full bg-background-dark border border-white/10 rounded-2xl p-5 pl-10 text-rose-500 font-display text-xl outline-none focus:border-rose-500 transition-all" 
                                    value={financeSettings.estTaxes} 
                                    onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })}
                                />
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
                             <button type="submit" className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"><span className="material-symbols-outlined">add</span></button>
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
                                    {expenses.length > 0 ? expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 text-xs font-bold text-white uppercase">{e.name}</td>
                                            <td className="px-6 py-4 text-center text-[10px] text-slate-500 font-black tracking-widest">{e.date}</td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-rose-500">-${Number(e.amount).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteExpenseStep(e.id)}
                                                    className={`px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto ${
                                                        expenseToDeleteId === e.id 
                                                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {expenseToDeleteId === e.id ? 'warning' : 'delete'}
                                                    </span>
                                                    {expenseToDeleteId === e.id && "¿BORRAR?"}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-[10px] text-slate-600 uppercase italic">Sin gastos fijos registrados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeView === 'clients' && (
            <div className="glass-panel rounded-[3rem] overflow-hidden animate-in shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Gestión de Rentabilidad</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-10 py-5">Marca / Cliente</th>
                      <th className="px-10 py-5">Nicho</th>
                      <th className="px-10 py-5">Monthly Fee ($)</th>
                      <th className="px-10 py-5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                             <img src={p.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} className="w-10 h-10 rounded-xl object-cover" />
                             <div>
                               <p className="text-sm font-bold text-white uppercase">{p.name}</p>
                               <p className="text-[10px] text-slate-500 uppercase font-black">{p.client}</p>
                             </div>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-xs text-slate-400 font-bold uppercase">{p.niche}</td>
                        <td className="px-10 py-6">
                           <div className="relative group w-36">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                             <input 
                               type="number" 
                               className="w-full bg-black/40 border border-white/5 text-white text-sm font-bold rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-primary transition-all" 
                               defaultValue={p.monthlyFee || 0} 
                               onBlur={async (e) => {
                                 const val = parseFloat(e.target.value) || 0;
                                 await updateProject(p.id, { monthlyFee: val });
                                 showToast(`Fee de ${p.name} actualizado`);
                               }} 
                             />
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">Activa</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="space-y-10 animate-in">
              <div className="glass-panel p-10 rounded-[3rem] space-y-8 shadow-2xl">
                <h3 className="text-xl font-display text-white uppercase italic tracking-tight border-b border-white/5 pb-4">Registrar Nuevo Socio</h3>
                <form onSubmit={handleCreateSocio} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Apellido</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.lastName} onChange={e => setNewSocio({...newSocio, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Corporativo</label>
                    <input required type="email" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Password Temporal</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Puesto / Rol</label>
                    <input required className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.role} onChange={e => setNewSocio({...newSocio, role: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Cumpleaños 🎂</label>
                    <input required type="date" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary" value={newSocio.birthDate} onChange={e => setNewSocio({...newSocio, birthDate: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <button disabled={isRegistering} type="submit" className="w-full h-14 bg-primary text-white font-display uppercase rounded-2xl text-[11px] shadow-xl active:scale-95 transition-all">
                      {isRegistering ? 'Sincronizando...' : 'Añadir al Equipo'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="glass-panel rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Directorio del Estudio</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest border-b border-white/5">
                      <tr>
                        <th className="px-10 py-5">Socio</th>
                        <th className="px-10 py-5">Cumpleaños</th>
                        <th className="px-10 py-5">Contraseña / Rol</th>
                        <th className="px-10 py-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersDB.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-4">
                                <img src={u.avatar} className="w-10 h-10 rounded-2xl object-cover border border-white/10" />
                                <div>
                                  <p className="text-sm font-bold text-white uppercase tracking-tight">{u.firstName} {u.lastName}</p>
                                  <input 
                                    className="bg-transparent border-none text-[10px] text-primary font-black uppercase p-0 focus:ring-0 w-32"
                                    defaultValue={u.role}
                                    onBlur={async (e) => {
                                      await updateUser(u.id, { role: e.target.value });
                                      showToast("Rol actualizado");
                                    }}
                                  />
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-6">
                             <input 
                                type="date"
                                className="bg-black/40 border border-white/5 text-white text-[10px] font-bold rounded-xl px-4 py-2 w-40 outline-none"
                                defaultValue={u.birthDate || ''}
                                onBlur={async (e) => {
                                  await updateUser(u.id, { birthDate: e.target.value });
                                  showToast("Cumpleaños actualizado");
                                }}
                             />
                          </td>
                          <td className="px-10 py-6">
                             <input 
                                type="text" 
                                className="bg-black/40 border border-white/5 text-white text-[10px] font-bold rounded-xl px-4 py-2 w-40 outline-none focus:border-primary transition-all" 
                                defaultValue={u.password || ''} 
                                onBlur={async (e) => {
                                  await updateUser(u.id, { password: e.target.value });
                                  showToast(`Password actualizada`);
                                }} 
                             />
                          </td>
                          <td className="px-10 py-6 text-right">
                             <button 
                                onClick={() => { if(confirm(`¿Eliminar a ${u.firstName}?`)) deleteUser(u.id); }} 
                                className="text-rose-500 hover:text-rose-400 p-2 bg-rose-500/10 rounded-xl border border-rose-500/20"
                              >
                               <span className="material-symbols-outlined">delete_forever</span>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'payroll' && (
             <div className="space-y-12 animate-in">
                <div className="glass-panel rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Emisión de Pagos</h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest border-b border-white/5">
                        <tr>
                            <th className="px-10 py-5">Socio</th>
                            <th className="px-10 py-5">Honorario Base ($)</th>
                            <th className="px-10 py-5 text-right">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {usersDB.map(u => (
                            <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-10 py-6 font-bold text-sm text-white uppercase tracking-tight">{u.firstName} {u.lastName}</td>
                            <td className="px-10 py-6">
                                <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-black/40 border border-white/5 text-white text-sm font-bold rounded-xl pl-6 pr-3 py-2 outline-none focus:border-primary" 
                                    value={baseSalaries[u.id] || 0} 
                                    onChange={e => updateBaseSalary(u.id, parseFloat(e.target.value) || 0)} 
                                />
                                </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <button 
                                disabled={isProcessingPayment === u.id}
                                onClick={() => handleProcessPayment(u)} 
                                className={`px-6 py-3 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-2xl shadow-lg active:scale-95 transition-all ${isProcessingPayment === u.id ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                {isProcessingPayment === u.id ? 'PROCESANDO...' : 'EMITIR PAGO'}
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                <div className="glass-panel rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xl font-display text-white uppercase italic tracking-tight">Registro Histórico de Liquidaciones</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[9px] uppercase text-slate-500 font-bold tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="px-10 py-5">Recibo</th>
                                    <th className="px-10 py-5">Socio</th>
                                    <th className="px-10 py-5">Periodo</th>
                                    <th className="px-10 py-5">Monto Total</th>
                                    <th className="px-10 py-5 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {receipts.length > 0 ? receipts.map(r => (
                                    <tr key={r.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-10 py-6 font-mono text-xs text-slate-400">{r.receiptNumber}</td>
                                        <td className="px-10 py-6 text-sm font-bold text-white uppercase">{r.userName}</td>
                                        <td className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase">{r.month} {r.year}</td>
                                        <td className="px-10 py-6 font-display text-emerald-400 font-bold">${(Number(r.total) || 0).toFixed(0)}</td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => handleDeleteReceiptStep(r.id)}
                                                className={`px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                    receiptToDeleteId === r.id 
                                                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {receiptToDeleteId === r.id ? 'warning' : 'delete_forever'}
                                                </span>
                                                {receiptToDeleteId === r.id && "¿CONFIRMAR BORRADO?"}
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="px-10 py-16 text-center text-[10px] font-black text-slate-600 uppercase italic">No hay liquidaciones registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
          )}

          {activeView === 'settings' && (
             <div className="glass-panel p-12 rounded-[3rem] space-y-16 animate-in shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <h3 className="text-2xl font-display text-white uppercase italic tracking-tight">Imagen Corporativa</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4 text-center">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Logo Identitario</label>
                      <div onClick={() => logoInputRef.current?.click()} className="aspect-video bg-black/40 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden p-8 group relative">
                         {studioLogo ? <img src={studioLogo} className="w-full h-full object-contain group-hover:scale-105 transition-transform" /> : <span className="material-symbols-outlined text-5xl opacity-20">cloud_upload</span>}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all text-white font-bold text-[10px] uppercase">Cambiar Logo</div>
                      </div>
                      <input type="file" hidden ref={logoInputRef} onChange={(e) => {
                        const file = e.target.files?.[0]; 
                        if(file) { 
                          const fr=new FileReader(); 
                          fr.onload=(ev)=>updateStudioLogo(ev.target?.result as string); 
                          fr.readAsDataURL(file); 
                        }
                      }} accept="image/*" />
                   </div>
                   <div className="space-y-4 text-center">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Portal Background</label>
                      <div onClick={() => bgInputRef.current?.click()} className="aspect-video bg-black/40 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden group relative">
                         {loginBackground ? <img src={loginBackground} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <span className="material-symbols-outlined text-5xl opacity-20">panorama</span>}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all text-white font-bold text-[10px] uppercase">Cambiar Fondo</div>
                      </div>
                      <input type="file" hidden ref={bgInputRef} onChange={(e) => {
                         const file = e.target.files?.[0]; 
                         if(file) { 
                           const fr=new FileReader(); 
                           fr.onload=(ev)=>updateLoginBackground(ev.target?.result as string); 
                           fr.readAsDataURL(file); 
                         }
                      }} accept="image/*" />
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                   <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-500 uppercase px-2 tracking-widest">Eslogan Maestro</label>
                     <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold focus:border-primary" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-500 uppercase px-2 tracking-widest">Descripción Operativa</label>
                     <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none font-bold focus:border-primary" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                   </div>
                </div>
                <button onClick={async () => { await updateLoginTexts(localTitle, localSubtitle); showToast("Portal Maestro Actualizado"); }} className="w-full py-5 bg-primary text-white font-display text-[12px] uppercase rounded-2xl shadow-2xl tracking-widest active:scale-95 transition-all">Guardar Configuración Visual</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
