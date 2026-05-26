
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';

const AdminDashboard: React.FC = () => {
  const { 
    projects, usersDB, currentUser, sendReceiptToUser, deleteReceipt, updateBaseSalary, updateTaskRate, baseSalaries, taskRates,
    financeSettings, updateFinanceSettings, expenses, expenseTracking, toggleExpensePayment, addExpense, updateExpense, deleteExpense,
    incomes, addIncome, deleteIncome, updateIncome,
    studioLogo, updateStudioLogo, dashboardBanner, updateDashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle, updateDashboardBannerTexts, loginBackground, updateLoginBackground, 
    loginTitle, loginSubtitle, updateLoginTexts, showToast, register, updateUser, updateProject, deleteProject, deleteUser, tasks, receipts,
    customerReceipts, addCustomerReceipt, updateCustomerReceipt, deleteCustomerReceipt,
    servicesCatalog, addServiceCatalogItem, deleteServiceCatalogItem
  } = useProjects();
  
  const [passwordAuth, setPasswordAuth] = useState('');

  const isAuthenticatedManual = useMemo(() => {
    const email = currentUser?.email?.toLowerCase() || '';
    const role = currentUser?.role?.toLowerCase() || '';
    return email === 'oscartchavarria@gmail.com' || email === 'oscar@visual.com' || role.includes('director');
  }, [currentUser]);

  const [isManuallyAuthenticated, setIsManuallyAuthenticated] = useState(false);
  const isAuthenticated = isAuthenticatedManual || isManuallyAuthenticated;

  const [activeView, setActiveView] = useState<'analytics' | 'payroll' | 'clients' | 'users' | 'settings' | 'rendimiento' | 'receipts'>('analytics');
  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [expandedIncomes, setExpandedIncomes] = useState<string[]>([]);

  const toggleIncomeExpansion = (id: string) => {
    setExpandedIncomes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();
    
    // Si hoy es >= 20, el periodo activo es el que cierra el 19 del próximo mes
    if (now.getDate() >= 20) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    return { month, year };
  });

  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [newSocio, setNewSocio] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '', incomeId: '', isOneTime: false });
  const [newIncome, setNewIncome] = useState({ source: '', amount: '', day: '', description: '' });
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);
  const [localBannerTitle, setLocalBannerTitle] = useState(dashboardBannerTitle);
  const [localBannerSubtitle, setLocalBannerSubtitle] = useState(dashboardBannerSubtitle);
  
  // CUSTOMER RECEIPTS STATE
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [isManagingCatalog, setIsManagingCatalog] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState<string | null>(null);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', basePrice: 0, currency: 'USD' as 'USD' | 'CRC' });
  const [activePaymentReceipt, setActivePaymentReceipt] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [selectedReceiptPeriod, setSelectedReceiptPeriod] = useState<string>('');

  const groupedReceipts = useMemo(() => {
    const groups: Record<string, typeof customerReceipts> = {};
    const sorted = [...customerReceipts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    sorted.forEach(receipt => {
      const d = new Date(receipt.date || receipt.createdAt);
      const key = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(receipt);
    });
    return groups;
  }, [customerReceipts]);
  useEffect(() => {
    const keys = Object.keys(groupedReceipts);
    if (keys.length > 0 && !keys.includes(selectedReceiptPeriod)) {
      setSelectedReceiptPeriod(keys[0]);
    }
  }, [groupedReceipts, selectedReceiptPeriod]);


  const [newCustomerReceipt, setNewCustomerReceipt] = useState({
    clientName: '',
    currency: 'USD' as 'USD' | 'CRC',
    items: [{ id: '1', description: '', quantity: 1, price: 0, total: 0 }],
    amountPaid: 0,
    notes: ''
  });

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

  const getPeriodRange = (month: number, year: number, isCalendar = false) => {
    if (isCalendar) {
      // Periodo calendario: 1 al último día del mes
      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      return { start: startDate, end: endDate };
    }
    // Periodo operativo: 20 Ene a 19 Feb para "Febrero"
    const startDate = new Date(year, month - 1, 20, 0, 0, 0);
    const endDate = new Date(year, month, 19, 23, 59, 59);
    return { start: startDate, end: endDate };
  };

  const isDateInPeriod = (dateStr: string, month: number, year: number, isCalendar = false) => {
    if (!dateStr) return false;
    try {
      const { start, end } = getPeriodRange(month, year, isCalendar);
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return false;
      return d >= start && d <= end;
    } catch (e) {
      return false;
    }
  };

  const calculateUserBonuses = (userId: string) => {
    try {
      const userTasks = tasks.filter(t => 
        String(t.collaboratorId) === String(userId) &&
        t.date && isDateInPeriod(t.date, selectedPeriod.month, selectedPeriod.year)
      );
      if (userTasks.length === 0) return { ninja: false, master: false };
      
      const allDone = userTasks.every(t => t.status === 'Completada');
      if (!allDone) return { ninja: false, master: false };

      const isNinja = userTasks.every(t => {
        if (!t.completedAt || !t.date) return false;
        const taskDate = new Date(t.date + 'T12:00:00');
        const completedDate = new Date(t.completedAt);
        if (isNaN(taskDate.getTime()) || isNaN(completedDate.getTime())) return false;

        const d1 = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        const d2 = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
        return d2 <= d1;
      });

      const isMaster = userTasks.every(t => {
        if (!t.completedAt || !t.date) return false;
        const taskDate = new Date(t.date + 'T12:00:00');
        const completedDate = new Date(t.completedAt);
        if (isNaN(taskDate.getTime()) || isNaN(completedDate.getTime())) return false;
        
        const d1 = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        const d2 = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
        
        const diffTime = d1.getTime() - d2.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        
        return diffDays >= 7;
      });

      return { ninja: isNinja, master: isMaster };
    } catch (e) {
      return { ninja: false, master: false };
    }
  };

  const performanceMetrics = useMemo(() => {
    const periodTasks = tasks.filter(t => isDateInPeriod(t.date, selectedPeriod.month, selectedPeriod.year));
    const totalCompleted = periodTasks.filter(t => t.status === 'Completada').length;
    const totalPending = periodTasks.filter(t => t.status === 'Pendiente').length;
    
    const byBrand = projects.map(p => {
      const brandTasks = periodTasks.filter(t => t.projectId === p.id);
      const completed = brandTasks.filter(t => t.status === 'Completada').length;
      const pending = brandTasks.filter(t => t.status === 'Pendiente').length;
      return { name: p.name, logo: p.logoUrl, completed, pending };
    });

    const byMember = usersDB.map(u => {
      const memberTasks = periodTasks.filter(t => String(t.collaboratorId) === String(u.id));
      const completed = memberTasks.filter(t => t.status === 'Completada').length;
      const pending = memberTasks.filter(t => t.status === 'Pendiente').length;
      const rate = taskRates[String(u.id)] || 0;
      const totalPay = completed * rate;

      // Desglose por marca para este miembro
      const memberBrands = projects.map(p => {
        const brandTasks = memberTasks.filter(t => t.projectId === p.id);
        const bCompleted = brandTasks.filter(t => t.status === 'Completada').length;
        const bPending = brandTasks.filter(t => t.status === 'Pendiente').length;
        return { name: p.name, logo: p.logoUrl, completed: bCompleted, pending: bPending };
      }).filter(b => b.completed > 0 || b.pending > 0);

      return { 
        id: u.id, 
        name: `${u.firstName} ${u.lastName}`, 
        avatar: u.avatar,
        role: u.role,
        completed, 
        pending, 
        rate, 
        totalPay,
        brands: memberBrands
      };
    });

    return { totalCompleted, totalPending, byBrand, byMember };
  }, [tasks, projects, usersDB, taskRates, selectedPeriod]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { setIsManuallyAuthenticated(true); } else { setError('Acceso Denegado'); }
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
    const realRevenue = incomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const estTaxes = Number(financeSettings.estTaxes || 0);

    // Filter receipts for current period
    const rMonth = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"][selectedPeriod.month];
    const periodReceipts = receipts.filter(r => r.month === rMonth && r.year === selectedPeriod.year);

    // Tracking group by expense
    const periodTracking = expenses
      .filter(e => {
         const cDate = new Date(e.createdAt);
         const cYear = cDate.getFullYear();
         const cMonth = cDate.getMonth();
         const sYear = selectedPeriod.year;
         const sMonth = selectedPeriod.month;
         if (cYear > sYear || (cYear === sYear && cMonth > sMonth)) return false;
         if (e.isOneTime && (cYear !== sYear || cMonth !== sMonth)) return false;
         if (e.deletedAt) {
             const dDate = new Date(e.deletedAt);
             const dYear = dDate.getFullYear();
             const dMonth = dDate.getMonth();
             if (sYear > dYear || (sYear === dYear && sMonth >= dMonth)) return false;
         }
         return true;
      })
      .map(e => {
        const tracking = expenseTracking.find(t => t.id === e.id && t.month === selectedPeriod.month && t.year === selectedPeriod.year);
        return { 
          ...e, 
          paid: tracking?.paid || false,
          incomeId: tracking?.incomeId || e.incomeId || undefined
        };
      })
      .sort((a, b) => {
        const dayA = parseInt(String(a.date).replace(/[^0-9]/g, '')) || 0;
        const dayB = parseInt(String(b.date).replace(/[^0-9]/g, '')) || 0;
        return dayA - dayB;
      });

    const paidExpensesTotal = periodTracking.filter(e => e.paid).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const pendingExpensesTotal = periodTracking.filter(e => !e.paid).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    // Detailed Income tracking (Manual Association)
    const currentTaxIncomeId = financeSettings.taxLinks?.[`${selectedPeriod.month}-${selectedPeriod.year}`];

    // Combine paid receipts with planned payroll selections for this period
    const plannedPayroll = usersDB.map(u => ({
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        amount: Number(baseSalaries[u.id] || 0) + (calculateUserBonuses(u.id).ninja ? 10 : 0) + (calculateUserBonuses(u.id).master ? 20 : 0),
        incomeId: financeSettings.payrollLinks?.[u.id],
        day: financeSettings.payrollDays?.[u.id] || 20
    })).filter(p => p.incomeId);

    const detailedIncomes = incomes.map(inc => {
        const linkedExpenses = periodTracking.filter(e => e.incomeId === inc.id);
        const linkedReceipts = periodReceipts.filter(r => r.incomeId === inc.id);
        const linkedPlannedPayroll = plannedPayroll.filter(p => p.incomeId === inc.id && !periodReceipts.some(r => r.userId === p.userId));
        
        const isTaxLinked = currentTaxIncomeId === inc.id;

        const expsAmount = linkedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        const paidPayrollAmount = linkedReceipts.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
        const plannedPayrollAmount = linkedPlannedPayroll.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        
        const payrollAmount = paidPayrollAmount + plannedPayrollAmount;
        const taxShare = isTaxLinked ? estTaxes : 0;
        const incomeAmount = Number(inc.amount) || 0;
        const periodLabel = `Día ${inc.day}`;

        return {
            ...inc,
            linkedExpenses,
            linkedReceipts,
            linkedPlannedPayroll,
            expsAmount,
            payrollAmount,
            taxShare,
            amount: incomeAmount,
            netAmount: incomeAmount - (expsAmount + payrollAmount + taxShare),
            periodLabel
        };
    }).sort((a, b) => (Number(a.day) || 31) - (Number(b.day) || 31));

    const netProfit = totalRevenue - totalPayroll - totalExpenses - estTaxes;
    const realProfit = realRevenue - totalPayroll - totalExpenses - estTaxes;

    return { 
        totalRevenue, totalPayroll, totalExpenses, estTaxes, netProfit, 
        realRevenue, realProfit, paidExpenses: paidExpensesTotal, pendingExpenses: pendingExpensesTotal,
        detailedIncomes, periodTracking
    };
  }, [projects, usersDB, baseSalaries, incomes, expenses, expenseTracking, financeSettings, selectedPeriod, receipts]);

  const handleProcessPayment = async (user: any) => {
    const base = Number(baseSalaries[String(user.id)] || 0);
    if (base <= 0) { showToast("Sueldo base no definido", "error"); return; }
    
    const incomeId = financeSettings.payrollLinks?.[user.id];
    if (!incomeId) {
      showToast("Selecciona el ingreso de donde se pagará esta nómina", "error");
      return;
    }

    setIsProcessingPayment(user.id);
    const bonuses = calculateUserBonuses(user.id);
    const ninjaBonusVal = bonuses.ninja ? 10 : 0;
    const masterBonusVal = bonuses.master ? 20 : 0;
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const memberPerf = performanceMetrics.byMember.find(m => String(m.id) === String(user.id));
    
    const completedTasks = memberPerf?.completed || 0;
    const tasksTotal = memberPerf?.totalPay || 0;

    const receiptData = {
      id: '', 
      userId: String(user.id), 
      userName: `${user.firstName} ${user.lastName}`,
      month: monthNames[selectedPeriod.month], 
      year: selectedPeriod.year,
      baseSalary: base, 
      ninjaBonus: ninjaBonusVal, 
      masterBonus: masterBonusVal,
      completedTasks, 
      tasksTotal,
      incomeId,
      total: base + ninjaBonusVal + masterBonusVal, 
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `VO-${Math.floor(Math.random() * 90000) + 10000}`
    };
    const success = await sendReceiptToUser(receiptData);
    setIsProcessingPayment(null);
    if (success) {
      showToast(`Pago enviado a ${user.firstName}`);
    } else {
      showToast("Error al procesar el pago. Verifica la consola.", "error");
    }
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
        
        <div className="w-full max-w-xl glass-panel rounded-xl p-12 lg:p-16 text-center relative z-10 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_30px_rgba(140,43,238,0.4)]">
                    <span className="material-symbols-outlined text-3xl">terminal</span>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] italic leading-none">Matriz de Acceso</h2>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mt-2 opacity-80">Director General Protocol</p>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <form onSubmit={handleLogin} className="w-full space-y-8 max-w-sm">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">Sincronización Obligatoria</label>
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
                        <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
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
                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Control Maestro <span className="text-primary">.</span></h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Master Protocol</p>
            </div>
        </div>
        <nav className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5 backdrop-blur-md">
          {[ {id:'analytics', icon:'grid_view'}, {id:'rendimiento', icon:'monitoring'}, {id:'receipts', icon:'receipt_long'}, {id:'clients', icon:'handshake'}, {id:'users', icon:'group'}, {id:'payroll', icon:'payments'}, {id:'settings', icon:'tune'} ].map(tab => (
            <button key={tab.id} title={tab.id} onClick={() => setActiveView(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeView === tab.id ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="p-8 sm:p-12 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          {(activeView === 'rendimiento' || activeView === 'payroll' || activeView === 'analytics') && (
            <div className="flex items-center justify-between glass-panel p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-xl">calendar_month</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Periodo de Gestión</h4>
                  <p className="text-xs font-bold text-white uppercase italic">
                    {activeView === 'analytics' ? 'Mes Calendario: 1 al 31' : 'Corte: 20 al 19 del mes'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5">
                  <select 
                    className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest outline-none px-4 py-2"
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
                  >
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                      <option key={m} value={i} className="bg-slate-900">{m}</option>
                    ))}
                  </select>
                  <select 
                    className="bg-transparent text-white text-[11px] font-black uppercase tracking-widest outline-none px-4 py-2 border-l border-white/5"
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(e.target.value) })}
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y} className="bg-slate-900">{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Dashboard Superior Banner */}
                <div className="w-full h-32 lg:h-44 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 relative group bg-slate-900">
                   <img src={dashboardBanner} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt="Dashboard Hub" />
                   <div className="absolute inset-0 bg-gradient-to-r from-background-dark/60 to-transparent flex items-center px-12">
                      <div className="max-w-md">
                         <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg leading-tight">{dashboardBannerTitle || 'Intelligence Hub'}</h1>
                         <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mt-2 leading-relaxed">{dashboardBannerSubtitle || 'Sincronización global de activos y métricas de rendimiento'}</p>
                      </div>
                   </div>
                </div>

                {/* Dashboard Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {[ 
                      { label: 'Proyección Bruta', val: financeMetrics.totalRevenue, color: 'text-amber-400', icon: 'payments' }, 
                      { label: 'Ingresos Percibidos', val: financeMetrics.realRevenue, color: 'text-emerald-400', icon: 'account_balance' }, 
                      { label: 'Egresos Totales', val: financeMetrics.totalPayroll + financeMetrics.totalExpenses + (financeSettings.estTaxes || 0), color: 'text-rose-400', icon: 'data_usage' }, 
                      { label: 'Beneficio Real', val: financeMetrics.realProfit, color: 'text-purple-400', icon: 'account_balance_wallet' } 
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

                {/* SECCIÓN DE INGRESOS PERCIBIDOS (RESTAURADA Y MEJORADA - AHORA ARRIBA) */}
                <div className="glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 border border-white/5 overflow-hidden shadow-xl text-left">
                    <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Ingresos Percibidos</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronización de flujo de caja para {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][selectedPeriod.month]} {selectedPeriod.year}</p>
                        </div>
                    </div>
                    
                    <form onSubmit={async (e) => { 
                      e.preventDefault(); 
                      await addIncome(newIncome.source, parseFloat(newIncome.amount), parseInt(newIncome.day), newIncome.description); 
                      setNewIncome({ source: '', amount: '', day: '', description: '' }); 
                    }} className="flex flex-wrap gap-4 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                       <input required placeholder="Origen / Cliente" className="flex-1 bg-transparent border-none px-5 py-3 text-xs text-white outline-none placeholder:text-slate-700 font-bold min-w-[150px]" value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} />
                       <input placeholder="Nota (opcional)" className="flex-1 bg-transparent border-none px-5 py-3 text-xs text-white/50 outline-none placeholder:text-slate-700 font-medium min-w-[150px]" value={newIncome.description} onChange={e => setNewIncome({...newIncome, description: e.target.value})} />
                       <input required type="number" placeholder="Monto $" className="w-24 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none font-bold" value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} />
                       <input required type="number" min="1" max="31" placeholder="Día" className="w-20 bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs text-white outline-none font-black text-center" value={newIncome.day} onChange={e => setNewIncome({...newIncome, day: e.target.value})} />
                       <button type="submit" className="px-6 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all text-sm font-black uppercase tracking-widest shrink-0">
                         <span className="material-symbols-outlined text-sm">add_circle</span>
                         Registrar Pago Fijo
                       </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {financeMetrics.detailedIncomes.map(inc => (
                            <div key={inc.id} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-emerald-500/20 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <p className="text-white font-black italic text-lg tracking-tighter truncate w-40">{inc.source}</p>
                                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">{inc.isCarryOver ? 'Recurrente' : `Ciclo: ${inc.periodLabel}`}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-black text-xl italic">${Number(inc.amount).toLocaleString('es-ES')}</p>
                                        {!inc.isCarryOver && <button onClick={() => deleteIncome(inc.id)} className="text-[10px] text-rose-500 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Eliminar</button>}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div 
                                      className="flex flex-col bg-white/5 rounded-lg border border-white/5 overflow-hidden cursor-pointer group/exp"
                                      onClick={() => toggleIncomeExpansion(inc.id)}
                                    >
                                        <div className="flex justify-between items-center px-3 py-2.5 hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col text-left">
                                               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Egresos Variables ({inc.linkedExpenses.length})</span>
                                               {inc.linkedExpenses.length > 0 && !expandedIncomes.includes(inc.id) && (
                                                   <span className="text-[7px] text-slate-600 uppercase font-bold truncate w-32 border-l border-emerald-500/30 pl-2">
                                                       {inc.linkedExpenses.map(le => le.name).join(', ')}
                                                   </span>
                                               )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-rose-400 font-black">-${Number(inc.expsAmount).toFixed(0)}</span>
                                              <span className={`material-symbols-outlined text-xs text-slate-600 transition-transform ${expandedIncomes.includes(inc.id) ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                                            </div>
                                        </div>
                                        
                                        {expandedIncomes.includes(inc.id) && (
                                          <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide bg-black/20">
                                            {inc.linkedExpenses.length > 0 ? inc.linkedExpenses.map((le: any) => (
                                              <div key={le.id} className="flex justify-between items-center py-2 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] px-1 rounded transition-colors group/row">
                                                <div className="flex flex-col text-left">
                                                  <span className="text-[11px] text-white font-black uppercase tracking-tight truncate w-32">{le.name}</span>
                                                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Día {le.date ? le.date.replace(/[^0-9]/g, '') : 'S/F'}</span>
                                                </div>
                                                <span className="text-[11px] text-rose-400/80 font-black">-${Number(le.amount).toLocaleString('es-ES')}</span>
                                              </div>
                                            )) : (
                                              <p className="text-[10px] text-slate-700 font-black uppercase py-2 text-center">Sin egresos asociados</p>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-emerald-400/80">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Nómina</span>
                                            {( [...inc.linkedReceipts.map(r => ({ ...r, day: r.date ? r.date.split('-')[2] : '20' })), ...inc.linkedPlannedPayroll] ).length > 0 && (
                                                <span className="text-[10px] text-slate-600 uppercase font-bold truncate w-40">
                                                    {( [...inc.linkedReceipts.map(r => ({ ...r, day: r.date ? r.date.split('-')[2] : '20' })), ...inc.linkedPlannedPayroll] )
                                                       .sort((a, b: any) => (Number(a.day) || 20) - (Number(b.day) || 20))
                                                       .map((r: any) => `${r.userName} (Día ${r.day})`)
                                                       .join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black">-${Number(inc.payrollAmount).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-amber-400/80">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Impuestos (Prop)</span>
                                        <span className="text-[10px] font-black">-${Number(inc.taxShare).toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="text-left">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Utilidad Neta de este Pago</p>
                                        <p className={`text-xl font-black italic tracking-tighter ${inc.netAmount >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                                            ${inc.netAmount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-1 overflow-hidden rounded-full">
                                          <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, (inc.netAmount / inc.amount) * 100))}%` }}></div>
                                          </div>
                                        </div>
                                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{inc.amount > 0 ? (Math.max(0, (inc.netAmount / inc.amount) * 100)).toFixed(0) : '0'}% remanente</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {financeMetrics.detailedIncomes.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                <span className="material-symbols-outlined text-4xl text-slate-700 mb-4 opacity-20">receipt_long</span>
                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No hay pagos registrados aún en este periodo</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
                    <div className="lg:col-span-4 glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 border border-white/5 shadow-xl text-left">
                        <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Retenciones Fiscales</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 font-black text-lg">$</span>
                                <input type="number" className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-10 text-rose-500 font-black text-2xl outline-none focus:border-rose-500/20" value={financeSettings.estTaxes} onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Ligar a Ingreso</label>
                                <select 
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white font-bold outline-none focus:border-primary/40"
                                    value={financeSettings.taxLinks?.[`${selectedPeriod.month}-${selectedPeriod.year}`] || ''}
                                    onChange={e => {
                                        const periodKey = `${selectedPeriod.month}-${selectedPeriod.year}`;
                                        const taxLinks = { ...(financeSettings.taxLinks || {}), [periodKey]: e.target.value };
                                        updateFinanceSettings({ taxLinks });
                                    }}
                                >
                                    <option value="" className="bg-slate-900">Sin Ligar</option>
                                    {incomes.map(inc => (
                                        <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source} (${inc.amount})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic leading-relaxed">Provisión automática para carga fiscal mensual proyectada.</p>
                        
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Balance de Egresos Variables</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                                    <p className="text-xs font-black text-emerald-500/60 uppercase tracking-widest mb-1">Ejecutado</p>
                                    <p className="text-xl font-black text-emerald-400 italic">${financeMetrics.paidExpenses.toLocaleString('es-ES')}</p>
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl">
                                    <p className="text-xs font-black text-rose-500/60 uppercase tracking-widest mb-1">Por Pagar</p>
                                    <p className="text-xl font-black text-rose-400 italic">${financeMetrics.pendingExpenses.toLocaleString('es-ES')}</p>
                                </div>
                            </div>
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Saldo Total Matriz</p>
                                <p className="text-sm font-black text-white italic">${financeMetrics.totalExpenses.toLocaleString('es-ES')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        {/* MATRIZ DE EGRESOS VARIABLES */}
                        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 border border-white/5 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Matriz de Egresos Variables</h3>
                                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Sincronización mensual: {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][selectedPeriod.month]} {selectedPeriod.year}</p>
                                </div>
                            </div>
                            <form onSubmit={async (e) => { e.preventDefault(); await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day, newExpense.incomeId || undefined, newExpense.isOneTime, selectedPeriod.month, selectedPeriod.year); setNewExpense({ name:'', amount:'', day:'', incomeId: '', isOneTime: false }); }} className="flex flex-wrap items-center gap-4 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                               <input required placeholder="Concepto del gasto" className="flex-[2] bg-transparent border-none px-5 py-3 text-xs text-white outline-none placeholder:text-slate-700 font-bold min-w-[150px]" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                               <input required type="number" placeholder="Monto $" className="w-24 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                               <input required type="number" placeholder="Día" className="w-16 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.day} onChange={e => setNewExpense({...newExpense, day: e.target.value})} />
                               <select 
                                 className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none min-w-[130px] font-bold"
                                 value={newExpense.incomeId}
                                 onChange={e => setNewExpense({...newExpense, incomeId: e.target.value})}
                               >
                                 <option value="" className="bg-slate-900">Sin Ligar</option>
                                 {financeMetrics.detailedIncomes.map(inc => (
                                   <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source} (${inc.amount})</option>
                                 ))}
                               </select>
                               <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-white transition-colors whitespace-nowrap px-2">
                                 <input type="checkbox" checked={newExpense.isOneTime} onChange={e => setNewExpense({...newExpense, isOneTime: e.target.checked})} className="accent-primary w-4 h-4" />
                                 Solo este mes
                               </label>
                               <button type="submit" className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform shrink-0"><span className="material-symbols-outlined text-xl">add</span></button>
                            </form>
                        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/10">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-white/5 text-xs font-black uppercase text-slate-600 tracking-widest">
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 w-1/3">Item Operativo</th>
                                        <th className="px-6 py-4 text-center w-24">Día Ciclo</th>
                                        <th className="px-6 py-4 text-center w-32">Ligar Ingreso</th>
                                        <th className="px-6 py-4 text-right w-24">Monto</th>
                                        <th className="px-6 py-4 text-center w-24">Estado</th>
                                        <th className="px-6 py-4 text-right w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {financeMetrics.periodTracking.map(e => (
                                        <tr key={e.id} className="hover:bg-white/[0.02] group transition-colors">
                                            <td className="px-6 py-5">
                                                <span className="text-white font-bold uppercase tracking-tight truncate block">{e.name}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center px-1">
                                                <input 
                                                  type="number" min="1" max="31" 
                                                  className="w-12 bg-black/40 border border-white/5 rounded-lg px-1 py-1 text-xs text-white font-black text-center outline-none focus:border-primary/40"
                                                  value={e.date ? e.date.replace(/[^0-9]/g, '') : ''}
                                                  onChange={val => updateExpense(e.id, { date: val.target.value ? `Día ${val.target.value}` : '' }, selectedPeriod.month, selectedPeriod.year)}
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <select 
                                                  className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-bold outline-none focus:border-primary/40"
                                                  value={e.incomeId || ''}
                                                  onChange={val => toggleExpensePayment(e.id, selectedPeriod.month, selectedPeriod.year, val.target.value)}
                                                >
                                                    <option value="" className="bg-slate-900">Seleccionar...</option>
                                                    {incomes.map(inc => (
                                                        <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-5 text-right text-rose-400 font-black italic">-${Number(e.amount).toFixed(0)}</td>
                                            <td className="px-6 py-5 text-center">
                                              <button 
                                                onClick={() => toggleExpensePayment(e.id, selectedPeriod.month, selectedPeriod.year)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                                  e.paid 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                    : 'bg-white/5 text-slate-500 border border-white/10 hover:border-primary/40 hover:text-white'
                                                }`}
                                              >
                                                {e.paid ? 'PAGADO' : 'PENDIENTE'}
                                              </button>
                                            </td>
                                            <td className="px-6 py-5 text-right"><button onClick={() => deleteExpense(e.id, selectedPeriod.month, selectedPeriod.year)} className="text-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><span className="material-symbols-outlined text-xl">close</span></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

        {/* NUEVA VISTA DE RECIBOS DE CLIENTES */}
        {activeView === 'receipts' && (
          <div className="space-y-10 animate-in fade-in duration-700 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Gestión de Recibos</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Control de facturación, cobros y cotizaciones externas</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsManagingCatalog(!isManagingCatalog)}
                  className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  Catálogo
                </button>
                <button 
                  onClick={() => {
                    setIsCreatingReceipt(true);
                    setIsManagingCatalog(false);
                  }}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Nuevo Recibo
                </button>
              </div>
            </div>

            {isManagingCatalog && (
               <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-8 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center justify-between">
                     <h4 className="text-sm font-black text-primary uppercase italic tracking-widest">Configurar Catálogo de Servicios</h4>
                     <button onClick={() => setIsManagingCatalog(false)} className="text-slate-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                     <div className="md:col-span-2">
                        <input 
                           placeholder="Nombre del servicio (Ej: Plan Mensual RRSS)"
                           className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-bold outline-none"
                           value={newCatalogItem.name}
                           onChange={e => setNewCatalogItem({...newCatalogItem, name: e.target.value})}
                        />
                     </div>
                     <div>
                        <input 
                           type="number"
                           placeholder="Precio Base"
                           className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-bold outline-none"
                           value={newCatalogItem.basePrice || ''}
                           onChange={e => setNewCatalogItem({...newCatalogItem, basePrice: parseFloat(e.target.value) || 0})}
                        />
                     </div>
                     <div className="flex gap-2">
                        <select 
                           className="bg-black/40 border border-white/5 rounded-xl p-4 text-white font-bold outline-none grow"
                           value={newCatalogItem.currency}
                           onChange={e => setNewCatalogItem({...newCatalogItem, currency: e.target.value as any})}
                        >
                           <option value="USD">USD ($)</option>
                           <option value="CRC">CRC (₡)</option>
                        </select>
                        <button 
                           onClick={async () => {
                              if (!newCatalogItem.name) return;
                              await addServiceCatalogItem(newCatalogItem);
                              setNewCatalogItem({ name: '', basePrice: 0, currency: 'USD' });
                           }}
                           className="p-4 bg-primary text-white rounded-xl"
                        >
                           <span className="material-symbols-outlined">add</span>
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {servicesCatalog.map(item => (
                        <div key={item.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group">
                           <div>
                              <p className="text-xs font-black text-white uppercase italic">{item.name}</p>
                              <p className="text-[10px] font-bold text-primary">{item.currency === 'USD' ? '$' : '₡'}{item.basePrice.toLocaleString()}</p>
                           </div>
                           <button onClick={() => deleteServiceCatalogItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500">
                              <span className="material-symbols-outlined text-sm">delete</span>
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {isCreatingReceipt && (
              <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 animate-in slide-in-from-top duration-500">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h4 className="text-sm font-black text-primary uppercase italic tracking-widest">Configurar Nuevo Documento</h4>
                   <div className="flex items-center gap-6">
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                         <button 
                            onClick={() => setNewCustomerReceipt({...newCustomerReceipt, currency: 'USD'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${newCustomerReceipt.currency === 'USD' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
                         >
                            USD ($)
                         </button>
                         <button 
                            onClick={() => setNewCustomerReceipt({...newCustomerReceipt, currency: 'CRC'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${newCustomerReceipt.currency === 'CRC' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
                         >
                            CRC (₡)
                         </button>
                      </div>
                      <button onClick={() => setIsCreatingReceipt(false)} className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre del Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Luis Mathieu Aguilar"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/40 transition-all"
                      value={newCustomerReceipt.clientName}
                      onChange={e => setNewCustomerReceipt({...newCustomerReceipt, clientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Emisión</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-slate-400 font-bold opacity-60">
                      {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Servicios / Productos</label>
                     <button 
                        onClick={() => setNewCustomerReceipt({
                          ...newCustomerReceipt, 
                          items: [...newCustomerReceipt.items, { id: Date.now().toString(), description: '', quantity: 1, price: 0, total: 0 }]
                        })}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                     >
                        + Añadir Item Manual
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                    {newCustomerReceipt.items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 group">
                        <div className="col-span-12 md:col-span-6 flex gap-2">
                          <input 
                            placeholder="Descripción del servicio..."
                            className="grow bg-transparent border-none p-2 text-sm text-white font-bold outline-none placeholder:text-slate-700"
                            value={item.description}
                            onChange={e => {
                              const next = [...newCustomerReceipt.items];
                              next[idx].description = e.target.value;
                              setNewCustomerReceipt({...newCustomerReceipt, items: next});
                            }}
                          />
                          <div className="relative">
                             <button 
                               className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                               title="Seleccionar del catálogo"
                               onClick={(e) => {
                                  // Toggle a local flag or just show the list
                                  const list = e.currentTarget.nextElementSibling;
                                  if (list) list.classList.toggle('hidden');
                               }}
                             >
                                <span className="material-symbols-outlined text-lg">inventory_2</span>
                             </button>
                             <div className="hidden absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1 min-w-[250px] max-h-48 overflow-y-auto">
                                <p className="text-[8px] font-black text-slate-500 uppercase p-2 tracking-widest border-b border-white/5">Catálogo ({newCustomerReceipt.currency})</p>
                                {servicesCatalog.filter(s => s.currency === newCustomerReceipt.currency).length > 0 ? (
                                   servicesCatalog.filter(s => s.currency === newCustomerReceipt.currency).map(svc => (
                                      <button 
                                         key={svc.id}
                                         onClick={(e) => {
                                            const next = [...newCustomerReceipt.items];
                                            next[idx].description = svc.name;
                                            next[idx].price = svc.basePrice;
                                            next[idx].total = svc.basePrice * next[idx].quantity;
                                            setNewCustomerReceipt({...newCustomerReceipt, items: next});
                                            e.currentTarget.parentElement?.classList.add('hidden');
                                         }}
                                         className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-all flex justify-between items-center gap-4"
                                      >
                                         <span className="text-[10px] font-bold text-white uppercase italic truncate">{svc.name}</span>
                                         <span className="text-[10px] font-black text-primary whitespace-nowrap">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{svc.basePrice.toLocaleString()}</span>
                                      </button>
                                   ))
                                ) : (
                                   <p className="text-[9px] text-slate-600 p-2 italic">No hay servicios registrados en esta moneda</p>
                                )}
                             </div>
                          </div>
                        </div>
                        <div className="col-span-4 md:col-span-2">
                           <input 
                            type="number"
                            placeholder="Cant."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-center text-xs text-white font-bold outline-none"
                            value={item.quantity}
                            onChange={e => {
                              const next = [...newCustomerReceipt.items];
                              const q = parseInt(e.target.value) || 0;
                              next[idx].quantity = q;
                              next[idx].total = q * next[idx].price;
                              setNewCustomerReceipt({...newCustomerReceipt, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                           <input 
                            type="number"
                            placeholder="Precio"
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-right text-xs text-white font-bold outline-none"
                            value={item.price}
                            onChange={e => {
                              const next = [...newCustomerReceipt.items];
                              const p = parseFloat(e.target.value) || 0;
                              next[idx].price = p;
                              next[idx].total = p * next[idx].quantity;
                              setNewCustomerReceipt({...newCustomerReceipt, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-end">
                           <button 
                            onClick={() => {
                              if (newCustomerReceipt.items.length > 1) {
                                const next = newCustomerReceipt.items.filter((_, i) => i !== idx);
                                setNewCustomerReceipt({...newCustomerReceipt, items: next});
                              }
                            }}
                            className="p-3 text-rose-500/30 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                           >
                              <span className="material-symbols-outlined text-lg">delete</span>
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Monto de Abono ({newCustomerReceipt.currency === 'USD' ? '$' : '₡'})</label>
                    <input 
                      type="number" 
                      placeholder="¿Cuánto pagó hoy?"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-emerald-400 font-black text-xl outline-none focus:border-emerald-500/20 transition-all"
                      value={newCustomerReceipt.amountPaid}
                      onChange={e => setNewCustomerReceipt({...newCustomerReceipt, amountPaid: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-end items-end space-y-2">
                    <div className="flex items-center gap-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                       <span>Subtotal:</span>
                       <span className="text-white text-lg">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-6 text-primary font-black text-sm uppercase tracking-widest">
                       <span>Total Documento:</span>
                       <span className="text-3xl italic tracking-tighter">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</span>
                    </div>
                    {newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0) - newCustomerReceipt.amountPaid > 0 ? (
                      <div className="flex items-center gap-3 text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full">
                         <span className="material-symbols-outlined text-xs">pending</span>
                         Saldo Pendiente: {newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{ (newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0) - newCustomerReceipt.amountPaid).toLocaleString() }
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full">
                         <span className="material-symbols-outlined text-xs">verified</span>
                         TOTALMENTE CANCELADO
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                   <button 
                    onClick={async () => {
                      const total = newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0);
                      const pending = total - newCustomerReceipt.amountPaid;
                      const status = pending <= 0 ? 'Pagado' : (newCustomerReceipt.amountPaid > 0 ? 'Parcial' : 'Pendiente');
                      
                      await addCustomerReceipt({
                        clientName: newCustomerReceipt.clientName,
                        date: new Date().toISOString(),
                        receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
                        currency: newCustomerReceipt.currency,
                        items: newCustomerReceipt.items,
                        subtotal: total,
                        total: total,
                        amountPaid: newCustomerReceipt.amountPaid,
                        balancePending: pending,
                        status: status,
                        notes: newCustomerReceipt.notes
                      });
                      setIsCreatingReceipt(false);
                      setNewCustomerReceipt({
                        clientName: '',
                        currency: 'USD',
                        items: [{ id: '1', description: '', quantity: 1, price: 0, total: 0 }],
                        amountPaid: 0,
                        notes: ''
                      });
                    }}
                    className="px-10 py-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     Guardar Recibo
                   </button>
                </div>
              </div>
            )}

            {Object.keys(groupedReceipts).length > 0 && (
              <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-8">
                 <span className="material-symbols-outlined text-slate-500">calendar_month</span>
                 <select 
                    value={selectedReceiptPeriod}
                    onChange={(e) => setSelectedReceiptPeriod(e.target.value)}
                    className="bg-transparent text-white font-black uppercase tracking-widest text-xl outline-none cursor-pointer appearance-none"
                 >
                    {Object.keys(groupedReceipts).map(p => (
                       <option key={p} value={p} className="bg-slate-900">{p}</option>
                    ))}
                 </select>
                 <span className="material-symbols-outlined text-slate-500 text-sm ml-[-10px] pointer-events-none">expand_more</span>
              </div>
            )}
            
            <div className="space-y-12">
               {Object.keys(groupedReceipts).length > 0 ? (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {(groupedReceipts[selectedReceiptPeriod] || []).map(receipt => (
                          <div key={receipt.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 hover:border-primary/30 transition-all group relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                       <span className="material-symbols-outlined text-6xl">receipt_long</span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{receipt.receiptNumber}</p>
                          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter truncate w-48">{receipt.clientName}</h4>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         receipt.status === 'Pagado' ? 'bg-emerald-500/20 text-emerald-400' : 
                         receipt.status === 'Parcial' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                       }`}>
                          {receipt.status}
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                          <p className="text-2xl font-black text-white italic tracking-tighter">{receipt.currency === 'USD' ? '$' : '₡'}{receipt.total.toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Abonado</p>
                          <p className="text-sm font-bold text-emerald-400 italic">{receipt.currency === 'USD' ? '$' : '₡'}{receipt.amountPaid.toLocaleString()}</p>
                       </div>
                    </div>

                    {receipt.balancePending > 0 && (
                      <div className="space-y-2">
                         <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 flex justify-between items-center">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Saldo: {receipt.currency === 'USD' ? '$' : '₡'}{receipt.balancePending.toLocaleString()}</p>
                            <button 
                              onClick={() => {
                                setActivePaymentReceipt(receipt.id);
                                setNewPaymentAmount(receipt.balancePending);
                              }}
                              className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[8px] font-black uppercase hover:bg-rose-500/40 transition-colors"
                            >
                               + Abono
                            </button>
                         </div>
                         {activePaymentReceipt === receipt.id && (
                            <div className="flex gap-2">
                               <input 
                                 type="number"
                                 className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-bold text-xs outline-none"
                                 value={newPaymentAmount}
                                 onChange={e => setNewPaymentAmount(parseFloat(e.target.value) || 0)}
                                 placeholder="Monto"
                               />
                               <button 
                                 onClick={async () => {
                                   const totalPaid = receipt.amountPaid + newPaymentAmount;
                                   const newBalance = receipt.total - totalPaid;
                                   const newStatus = newBalance <= 0 ? 'Pagado' : 'Parcial';
                                   await updateCustomerReceipt(receipt.id, {
                                     amountPaid: totalPaid,
                                     balancePending: newBalance,
                                     status: newStatus
                                   });
                                   setActivePaymentReceipt(null);
                                 }}
                                 className="px-4 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-colors"
                               >
                                 OK
                               </button>
                               <button onClick={() => setActivePaymentReceipt(null)} className="px-2 text-slate-500 hover:text-white">
                                 <span className="material-symbols-outlined text-sm">close</span>
                               </button>
                            </div>
                         )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                       <button 
                        disabled={isDownloadingReceipt === receipt.id}
                        onClick={async () => {
                          setIsDownloadingReceipt(receipt.id);
                          // @ts-ignore
                          const html2canvas = (await import('html2canvas')).default;
                          // @ts-ignore
                          const { jsPDF } = await import('jspdf');
                          
                          const element = document.getElementById(`customer-pdf-content-${receipt.id}`);
                          if (!element) return;

                          const canvas = await html2canvas(element, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                            logging: false
                          });

                          const imgData = canvas.toDataURL('image/png');
                          const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'px',
                            format: [1240, 1754]
                          });

                          pdf.addImage(imgData, 'PNG', 0, 0, 1240, 1754);
                          pdf.save(`RECIBO_${receipt.clientName.replace(/\s+/g, '_').toUpperCase()}_${receipt.receiptNumber}.pdf`);
                          setIsDownloadingReceipt(null);
                        }}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                       >
                          <span className="material-symbols-outlined text-xs">download</span>
                          {isDownloadingReceipt === receipt.id ? 'Generando...' : 'Descargar'}
                       </button>
                       <button 
                        onClick={() => deleteCustomerReceipt(receipt.id)}
                        className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                       >
                          <span className="material-symbols-outlined text-lg">delete</span>
                       </button>
                    </div>

                    {/* HIDDEN PDF CONTENT FOR EACH RECEIPT - INVOICE DESIGN */}
                    <div className="fixed left-[-9999px] top-0">
                       <div id={`customer-pdf-content-${receipt.id}`} className="w-[1240px] min-h-[1754px] bg-white flex flex-col font-sans text-slate-900 text-left relative overflow-hidden">
                          
                          {/* HEADER STRAIGHT & LOGO */}
                          <div className="relative w-full bg-[#5c00ff] h-[250px] flex justify-between items-center px-24">
                            <div className="flex items-center gap-10">
                              {studioLogo ? (
                                  <img src={studioLogo} className="h-32 w-auto rounded-3xl object-cover" crossOrigin="anonymous" alt="Logo" />
                              ) : (
                                  <div className="text-4xl font-black tracking-tighter text-white">VISUAL OSCART</div>
                              )}
                              <div className="text-white space-y-2">
                                 <h1 className="text-7xl font-black uppercase tracking-widest">RECIBO</h1>
                                 <p className="text-2xl font-bold opacity-80 tracking-[0.2em] uppercase">Documento Oficial</p>
                              </div>
                            </div>
                            <div className="text-right text-white space-y-1">
                              <p className="text-xl font-bold tracking-tight">digital@visualoscart.com</p>
                              <p className="text-xl font-bold tracking-tight">+506 6107 8028</p>
                              <p className="text-xl font-bold tracking-tight">www.visualoscart.com</p>
                            </div>
                          </div>

                          <div className="px-24 pb-20 flex flex-col flex-grow z-10 pt-16">
                            {/* INVOICE INFO */}
                            <div className="flex justify-between items-start mb-16">
                              <div className="space-y-2">
                                <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Facturar A:</p>
                                <h2 className="text-3xl font-black uppercase text-slate-900 leading-tight">{receipt.clientName}</h2>
                                <div className="mt-4 text-slate-600 text-xl">
                                  {receipt.notes ? <p className="max-w-md italic opacity-80">Ref: {receipt.notes}</p> : <p>Cliente Oficial</p>}
                                </div>
                              </div>
                              
                              <div className="text-right mt-4">
                                <table className="ml-auto text-xl">
                                  <tbody>
                                    <tr>
                                      <td className="pr-6 font-bold text-slate-500 py-1 uppercase tracking-widest text-sm">Número:</td>
                                      <td className="font-black text-slate-900">{receipt.receiptNumber}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-6 font-bold text-slate-500 py-1 uppercase tracking-widest text-sm">Fecha:</td>
                                      <td className="font-black text-slate-900">{new Date(receipt.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</td>
                                    </tr>
                                    <tr>
                                      <td className="pr-6 font-bold text-slate-500 py-1 uppercase tracking-widest text-sm">Estado:</td>
                                      <td className={`font-black pt-2 text-2xl uppercase tracking-widest ${receipt.status === 'Pagado' ? 'text-emerald-500' : (receipt.status === 'Parcial' ? 'text-amber-500' : 'text-rose-500')}`}>
                                        {receipt.status}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* TABLE */}
                            <div className="flex-grow mt-10">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#5c00ff] text-white">
                                    <th className="py-6 px-8 text-sm font-black uppercase tracking-widest w-24 text-center">N°</th>
                                    <th className="py-6 px-8 text-sm font-black uppercase tracking-widest">Descripción del Servicio</th>
                                    <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-center">Precio</th>
                                    <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-center">Cant.</th>
                                    <th className="py-6 px-8 text-sm font-black uppercase tracking-widest text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {receipt.items.map((item, idx) => (
                                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-[#5c00ff]/5' : 'bg-white'}>
                                      <td className="py-10 px-8 text-center text-2xl font-bold text-slate-400">{idx + 1}</td>
                                      <td className="py-10 px-8 text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{item.description}</td>
                                      <td className="py-10 px-8 text-center text-xl font-bold text-slate-500">{receipt.currency === 'USD' ? '$' : '₡'}{item.price.toLocaleString()}</td>
                                      <td className="py-10 px-8 text-center text-2xl font-bold text-slate-500">{item.quantity}</td>
                                      <td className="py-10 px-8 text-right text-3xl font-black text-slate-900 tracking-tighter">{receipt.currency === 'USD' ? '$' : '₡'}{item.total.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* TOTALS AND FOOTER */}
                              <div className="flex justify-between items-start mt-12">
                                {/* TERMS AND PAYMENT */}
                                <div className="w-[500px] space-y-12 mt-4">

                                  <div>
                                     <p className="text-xl font-black text-slate-900 mb-3 uppercase tracking-widest">Información de Pago</p>
                                     <div className="text-slate-500 text-lg space-y-2">
                                       <p><span className="font-bold text-slate-700">Abonado a la Fecha:</span> {receipt.currency === 'USD' ? '$' : '₡'}{receipt.amountPaid.toLocaleString()}</p>
                                       <p><span className="font-bold text-slate-700">Moneda Base:</span> {receipt.currency}</p>
                                       {receipt.balancePending > 0 && (
                                         <p className="text-rose-500 font-bold mt-2">Atención: Este recibo refleja un saldo pendiente.</p>
                                       )}
                                     </div>
                                  </div>
                                </div>

                                {/* TOTALS BOX */}
                                <div className="w-[450px]">
                                  <div className="bg-[#5c00ff]/5 p-8 flex justify-between items-center text-2xl font-bold text-slate-600">
                                     <span className="uppercase tracking-widest text-sm">Subtotal</span>
                                     <span>{receipt.currency === 'USD' ? '$' : '₡'}{receipt.subtotal.toLocaleString()}</span>
                                  </div>
                                  <div className="bg-[#5c00ff] p-12 flex justify-between items-center text-5xl font-black text-white shadow-2xl">
                                     <span className="uppercase tracking-widest text-lg">Total</span>
                                     <span className="italic tracking-tighter">{receipt.currency === 'USD' ? '$' : '₡'}{receipt.total.toLocaleString()}</span>
                                  </div>
                                  {receipt.amountPaid > 0 && (
                                    <div className="bg-emerald-500/10 p-8 flex justify-between items-center text-2xl font-bold text-emerald-600 mt-4">
                                       <span className="uppercase tracking-widest text-sm">Abono Realizado</span>
                                       <span>-{receipt.currency === 'USD' ? '$' : '₡'}{receipt.amountPaid.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {receipt.balancePending > 0 && (
                                    <div className="bg-rose-500 p-8 flex justify-between items-center text-3xl font-black text-white shadow-xl mt-4">
                                      <span className="uppercase tracking-widest text-sm">Saldo Pendiente</span>
                                      <span className="italic tracking-tighter">{receipt.currency === 'USD' ? '$' : '₡'}{receipt.balancePending.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                          </div>
                       </div>
</div>
                 </div>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 text-left">
                    <span className="material-symbols-outlined text-6xl mb-4">receipt_long</span>
                    <p className="text-sm font-black uppercase tracking-widest">No hay recibos generados aún</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeView === 'rendimiento' && (
        <div className="space-y-10 animate-in fade-in duration-700 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-60">Tareas Completadas Totales</p>
                <span className="material-symbols-outlined text-lg text-emerald-400 opacity-30">task_alt</span>
              </div>
              <h4 className="text-4xl font-black text-emerald-400 italic tracking-tighter mt-6">{performanceMetrics.totalCompleted}</h4>
            </div>
            <div className="p-8 rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-60">Tareas Pendientes Totales</p>
                <span className="material-symbols-outlined text-lg text-rose-400 opacity-30">pending_actions</span>
              </div>
              <h4 className="text-4xl font-black text-rose-400 italic tracking-tighter mt-6">{performanceMetrics.totalPending}</h4>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl text-left">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Rendimiento por Miembro y Valorización</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs uppercase text-slate-600 font-black tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-8 py-5">Miembro</th>
                      <th className="px-8 py-5 text-center">Completadas</th>
                      <th className="px-8 py-5 text-center">Pendientes</th>
                      <th className="px-8 py-5 text-center">Valor por Tarea ($)</th>
                      <th className="px-8 py-5 text-right">Total a Pagar ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {performanceMetrics.byMember.map(m => (
                      <React.Fragment key={m.id}>
                        <tr className="hover:bg-white/[0.02] group transition-colors cursor-pointer" onClick={() => setExpandedMemberId(expandedMemberId === m.id ? null : m.id)}>
                          <td className="px-8 py-6 flex items-center gap-5">
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${expandedMemberId === m.id ? 'rotate-90' : ''}`}>chevron_right</span>
                              <img src={m.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-xl border border-white/10" />
                            </div>
                            <div>
                              <span className="font-bold text-white uppercase tracking-tight block">{m.name}</span>
                              <span className="text-xs text-slate-500 font-black uppercase tracking-widest">{m.role}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-black text-emerald-400">{m.completed}</td>
                          <td className="px-8 py-6 text-center font-black text-rose-400">{m.pending}</td>
                          <td className="px-8 py-6 text-center" onClick={e => e.stopPropagation()}>
                            <div className="relative w-24 mx-auto">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-xs">$</span>
                              <input 
                                type="number" 
                                className="w-full bg-black/40 border border-white/5 text-white text-sm font-black rounded-xl pl-7 pr-2 py-2 outline-none text-center" 
                                value={m.rate} 
                                onChange={e => updateTaskRate(m.id, parseFloat(e.target.value) || 0)} 
                              />
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-primary text-lg italic">
                            ${m.totalPay.toLocaleString('es-ES')}
                          </td>
                        </tr>
                        {expandedMemberId === m.id && (
                          <tr className="bg-black/40 animate-in fade-in slide-in-from-top-2 duration-300">
                            <td colSpan={5} className="px-8 py-8">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {m.brands.length > 0 ? m.brands.map((b, bi) => (
                                  <div key={bi} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                    <img src={b.logo} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] font-black text-white uppercase tracking-widest truncate mb-1">{b.name}</p>
                                      <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                          <span className="text-[10px] font-bold text-emerald-400">{b.completed}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                          <span className="text-[10px] font-bold text-rose-400">{b.pending}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <div className="col-span-full py-4 text-center">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin actividad registrada en este periodo</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
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
                          <tr>
                            <th className="px-8 py-5">Socio</th>
                            <th className="px-8 py-5">Sueldo Base ($)</th>
                            <th className="px-8 py-5 text-center">Incentivos/Bonos</th>
                            <th className="px-8 py-5 text-center w-24">Día Pago</th>
                            <th className="px-8 py-5 text-center">Ligar Fondeo</th>
                            <th className="px-8 py-5 text-right">Protocolo</th>
                          </tr>
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
                                  <td className="px-8 py-6 text-center">
                                     <input 
                                       type="number" min="1" max="31" 
                                       className="w-16 bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] text-white font-black text-center outline-none focus:border-primary/40"
                                       value={financeSettings.payrollDays?.[u.id] || 20}
                                       onChange={e => {
                                         const payrollDays = { ...(financeSettings.payrollDays || {}), [u.id]: parseInt(e.target.value) || 20 };
                                         updateFinanceSettings({ payrollDays });
                                       }}
                                     />
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <select 
                                       className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-primary/40 w-40"
                                       value={financeSettings.payrollLinks?.[u.id] || ''}
                                       onChange={e => {
                                         const payrollLinks = { ...(financeSettings.payrollLinks || {}), [u.id]: e.target.value };
                                         updateFinanceSettings({ payrollLinks });
                                       }}
                                     >
                                        <option value="" className="bg-slate-900">Seleccionar...</option>
                                        {incomes.map(inc => (
                                            <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source}</option>
                                        ))}
                                     </select>
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
            <div className="space-y-10 sm:space-y-12">
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
            <div className="space-y-10 sm:space-y-12 pb-24">
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