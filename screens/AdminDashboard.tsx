import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProjects } from '../context/ProjectContext';
import { createCalendarMeeting, deleteCalendarEvent } from '../lib/calendarService';
import { Meeting, MeetingCategory, MeetingDuration } from '../types';
import receiptHeaderImg from '../RECIBO.png';
import quoteHeaderImg from '../COTIZACION.png';
import footerImg from '../PIE RECIBO COTI.png';


const AdminDashboard: React.FC = () => {
  const { 
    projects, usersDB, currentUser, sendReceiptToUser, deleteReceipt, updateBaseSalary, updateTaskRate, baseSalaries, taskRates,
    financeSettings, updateFinanceSettings, expenses, expenseTracking, toggleExpensePayment, addExpense, updateExpense, deleteExpense,
    incomes, addIncome, deleteIncome, updateIncome,
    studioLogo, updateStudioLogo, dashboardBanner, updateDashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle, updateDashboardBannerTexts, loginBackground, updateLoginBackground, 
    loginTitle, loginSubtitle, updateLoginTexts, showToast, register, updateUser, updateProject, deleteProject, deleteUser, tasks, receipts,
    customerReceipts, addCustomerReceipt, updateCustomerReceipt, deleteCustomerReceipt,
    customerQuotes, addCustomerQuote, deleteCustomerQuote,
    servicesCatalog, addServiceCatalogItem, deleteServiceCatalogItem,
    meetings, addMeeting, updateMeeting, deleteMeeting,
    personalTasks, addPersonalTask, updatePersonalTask, togglePersonalTask, deletePersonalTask, reorderPersonalTasks
  } = useProjects();
  
  const [passwordAuth, setPasswordAuth] = useState('');

  const isAuthenticatedManual = useMemo(() => {
    const email = currentUser?.email?.toLowerCase() || '';
    const role = currentUser?.role?.toLowerCase() || '';
    return email === 'oscartchavarria@gmail.com' || email === 'oscar@visual.com' || role.includes('director');
  }, [currentUser]);

  const [isManuallyAuthenticated, setIsManuallyAuthenticated] = useState(false);
  const isAuthenticated = isAuthenticatedManual || isManuallyAuthenticated;

  const [activeView, setActiveView] = useState<'analytics' | 'users' | 'settings' | 'rendimiento' | 'receipts' | 'meetings' | 'agenda'>('analytics');

  // --- AGENDA STATE ---
  type AgendaSubView = 'dia' | 'semana' | 'mes';
  const [agendaSubView, setAgendaSubView] = useState<AgendaSubView>('dia');
  const [agendaCurrentDate, setAgendaCurrentDate] = useState<Date>(new Date());
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [agendaForm, setAgendaForm] = useState({ title: '', description: '', date: '' });
  const [deletingAgendaId, setDeletingAgendaId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  // --- MEETINGS STATE ---
  const [meetCurrentDate, setMeetCurrentDate] = useState(new Date());
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [meetInitialDate, setMeetInitialDate] = useState('');
  const [activeCategory, setActiveCategory] = useState<MeetingCategory | null>(null);

  const CATEGORY_COLORS: Record<MeetingCategory, { bg: string; border: string; text: string; dot: string }> = {
    'Gestión de Redes Sociales': { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300', dot: 'bg-violet-500' },
    'Diseño de Marca':           { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300', dot: 'bg-orange-500' },
    'Diseño Web':                { bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-300',   dot: 'bg-blue-500'   },
    'Animación Digital':         { bg: 'bg-teal-500/20',   border: 'border-teal-500/40',   text: 'text-teal-300',   dot: 'bg-teal-500'  },
    'Otro':                      { bg: 'bg-slate-500/20',  border: 'border-slate-500/40',  text: 'text-slate-300',  dot: 'bg-slate-400'  },
  };

  const CATEGORIES: MeetingCategory[] = ['Gestión de Redes Sociales', 'Diseño de Marca', 'Diseño Web', 'Animación Digital', 'Otro'];
  const DURATIONS: { value: MeetingDuration; label: string }[] = [
    { value: 30, label: '30 min' }, { value: 60, label: '1 hora' },
    { value: 90, label: '1:30 h' }, { value: 120, label: '2 horas' }
  ];

  const emptyMeetForm = useCallback(() => ({
    title: '', projectId: '', date: meetInitialDate || new Date().toISOString().split('T')[0],
    time: '10:00', duration: 60 as MeetingDuration,
    category: 'Gestión de Redes Sociales' as MeetingCategory,
    notes: '', hasMeet: false
  }), [meetInitialDate]);

  const [meetForm, setMeetForm] = useState(emptyMeetForm);

  useEffect(() => {
    if (showMeetModal) setMeetForm(f => ({ ...f, date: meetInitialDate || new Date().toISOString().split('T')[0] }));
  }, [showMeetModal, meetInitialDate]);

  const meetMonthName = meetCurrentDate.toLocaleString('es-ES', { month: 'long' });
  const meetYear = meetCurrentDate.getFullYear();
  const meetMonth = meetCurrentDate.getMonth();
  const meetDaysInMonth = new Date(meetYear, meetMonth + 1, 0).getDate();
  const meetFirstDay = new Date(meetYear, meetMonth, 1).getDay();
  const meetToday = new Date();

  const getMeetingsForDay = useCallback((day: number) => {
    const m = String(meetMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return meetings.filter(mt =>
      mt.date === `${meetYear}-${m}-${d}` &&
      (activeCategory === null || mt.category === activeCategory)
    );
  }, [meetings, meetMonth, meetYear, activeCategory]);

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetForm.title || !meetForm.date || !meetForm.time) {
      showToast('Completa los campos obligatorios', 'error'); return;
    }
    setIsSavingMeeting(true);
    try {
      let meetLink: string | undefined;
      let googleEventId: string | undefined;
      if (meetForm.hasMeet) {
        const evt = await createCalendarMeeting({
          title: meetForm.title,
          date: meetForm.date,
          time: meetForm.time,
          duration: meetForm.duration,
          notes: meetForm.notes
        });
        meetLink = evt.meetLink;
        googleEventId = evt.id;
      }
      await addMeeting({ ...meetForm, meetLink, googleEventId });
      showToast(meetForm.hasMeet ? 'Reunión creada con Google Meet ✓' : 'Reunión agendada ✓');
      setShowMeetModal(false);
      setMeetInitialDate('');
    } catch (err: any) {
      showToast('Error: ' + (err?.message || 'No se pudo crear'), 'error');
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    setIsDeletingMeeting(true);
    try {
      if (meeting.googleEventId) {
        await deleteCalendarEvent(meeting.googleEventId).catch(() => {});
      }
      await deleteMeeting(meeting.id);
      setSelectedMeeting(null);
    } finally {
      setIsDeletingMeeting(false);
    }
  };

  const handleCopyInvite = (meeting: Meeting) => {
    const dateObj = new Date(meeting.date + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [h, min] = meeting.time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const durLabel = meeting.duration === 60 ? '1 hora' : meeting.duration === 90 ? '1 hora 30 min' : meeting.duration === 120 ? '2 horas' : `${meeting.duration} minutos`;
    const text = `Visual Oscart te está invitando a una videoconferencia 🎥\n\n📌 ${meeting.title}\n🗓️ ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} a las ${hour12}:${min} ${ampm}\n⏱️ Duración: ${durLabel}\n🏷️ ${meeting.category}${meeting.notes ? `\n📝 ${meeting.notes}` : ''}\n\n🔗 Únete aquí: ${meeting.meetLink}`;
    navigator.clipboard.writeText(text);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2500);
    showToast('Invitación copiada al portapapeles');
  };

  const [error, setError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [expandedIncomes, setExpandedIncomes] = useState<string[]>([]);

  const toggleIncomeExpansion = (id: string) => {
    setExpandedIncomes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
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
  const [userType, setUserType] = useState<'socio' | 'cliente'>('socio');
  const [viewUserType, setViewUserType] = useState<'socio' | 'cliente'>('socio');
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', day: '', incomeId: '', isOneTime: false });
  const [newIncome, setNewIncome] = useState({ source: '', amount: '', day: '', description: '' });
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);
  const [unlockedExpenses, setUnlockedExpenses] = useState<string[]>([]);

  const getUserAvatar = (u: any) => {
    const clientBrandCode = u.role?.toLowerCase().startsWith('cliente:') ? u.role.split(':')[1]?.trim().toUpperCase() : null;
    const clientProjectObj = clientBrandCode ? projects.find(p => p.brandCode?.toUpperCase() === clientBrandCode || p.typography?.brandCode?.toUpperCase() === clientBrandCode) : null;
    return (clientProjectObj && clientProjectObj.logoUrl) ? clientProjectObj.logoUrl : u.avatar;
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(loginTitle);
  const [localSubtitle, setLocalSubtitle] = useState(loginSubtitle);
  const [isSavingLoginTexts, setIsSavingLoginTexts] = useState(false);
  const [localBannerTitle, setLocalBannerTitle] = useState(dashboardBannerTitle);
  const [localBannerSubtitle, setLocalBannerSubtitle] = useState(dashboardBannerSubtitle);
    // CUSTOMER RECEIPTS & QUOTES STATE
  const [activeReceiptTab, setActiveReceiptTab] = useState<'recibos' | 'cotizaciones'>('recibos');
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isManagingCatalog, setIsManagingCatalog] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState<string | null>(null);
  const [isDownloadingQuote, setIsDownloadingQuote] = useState<string | null>(null);
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', basePrice: 0, currency: 'USD' as 'USD' | 'CRC', includes: '' });
  const [activePaymentReceipt, setActivePaymentReceipt] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [selectedReceiptPeriod, setSelectedReceiptPeriod] = useState<string>('');

  const [newCustomerReceipt, setNewCustomerReceipt] = useState({
    clientName: '',
    currency: 'USD' as 'USD' | 'CRC',
    items: [{ id: '1', description: '', details: '', quantity: 1, price: 0, total: 0 }],
    amountPaid: 0,
    notes: ''
  });

  const [newCustomerQuote, setNewCustomerQuote] = useState({
    clientName: '',
    currency: 'USD' as 'USD' | 'CRC',
    items: [{ id: '1', description: '', details: '', quantity: 1, price: 0, total: 0 }],
    ivaPercentage: 0,
    discountPercentage: 0,
    discountDescription: '',
    notes: ''
  });
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

  const groupedQuotes = useMemo(() => {
    const groups: Record<string, typeof customerQuotes> = {};
    const sorted = [...customerQuotes].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    sorted.forEach(quote => {
      const d = new Date(quote.date || quote.createdAt);
      const key = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(quote);
    });
    return groups;
  }, [customerQuotes]);

  const [selectedQuotePeriod, setSelectedQuotePeriod] = useState<string>('');

  useEffect(() => {
    const keys = Object.keys(groupedReceipts);
    if (keys.length > 0 && !keys.includes(selectedReceiptPeriod)) {
      setSelectedReceiptPeriod(keys[0]);
    }
  }, [groupedReceipts, selectedReceiptPeriod]);

  useEffect(() => {
    const keys = Object.keys(groupedQuotes);
    if (keys.length > 0 && !keys.includes(selectedQuotePeriod)) {
      setSelectedQuotePeriod(keys[0]);
    }
  }, [groupedQuotes, selectedQuotePeriod]);


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

  useEffect(() => {
    setLocalTitle(loginTitle);
    setLocalSubtitle(loginSubtitle);
  }, [loginTitle, loginSubtitle]);

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
    
    const byBrand = projects.filter(p => p.status !== 'Inactivo').map(p => {
      const brandTasks = periodTasks.filter(t => t.projectId === p.id);
      const completed = brandTasks.filter(t => t.status === 'Completada').length;
      const pending = brandTasks.filter(t => t.status === 'Pendiente').length;
      return { name: p.name, logo: p.logoUrl, completed, pending };
    });

    const byMember = usersDB
      .filter(u => !u.role?.toLowerCase().startsWith('cliente'))
      .map(u => {
      const memberTasks = periodTasks.filter(t => String(t.collaboratorId) === String(u.id));
      const completed = memberTasks.filter(t => t.status === 'Completada').length;
      const pending = memberTasks.filter(t => t.status === 'Pendiente').length;
      const rate = taskRates[String(u.id)] || 0;
      const basePay = Number(baseSalaries[String(u.id)] || 0);
      
      const bonuses = calculateUserBonuses(u.id);
      const ninjaBonusVal = bonuses.ninja ? 10 : 0;
      const masterBonusVal = bonuses.master ? 20 : 0;
      const totalPay = basePay + (completed * rate) + ninjaBonusVal + masterBonusVal;

      // Desglose por marca para este miembro
      const memberBrands = projects.filter(p => p.status !== 'Inactivo').map(p => {
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
        brands: memberBrands,
        bonuses,
        userObj: u
      };
    });

    return { totalCompleted, totalPending, byBrand, byMember };
  }, [tasks, projects, usersDB, taskRates, selectedPeriod]);

  const currentMonthName = useMemo(() => {
    return ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"][selectedPeriod.month];
  }, [selectedPeriod.month]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => r.month === currentMonthName && r.year === selectedPeriod.year);
  }, [receipts, currentMonthName, selectedPeriod.year]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordAuth === 'Chorseñor23') { setIsManuallyAuthenticated(true); } else { setError('Acceso Denegado'); }
  };

  const handleSaveBannerTexts = async () => {
    setIsSavingBanner(true);
    await updateDashboardBannerTexts(localBannerTitle, localBannerSubtitle);
    setIsSavingBanner(false);
  };

  const handleSaveLoginTexts = async () => {
    setIsSavingLoginTexts(true);
    try {
      await updateLoginTexts(localTitle, localSubtitle);
      showToast("Textos de bienvenida sincronizados correctamente", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al sincronizar textos", "error");
    } finally {
      setIsSavingLoginTexts(false);
    }
  };

  const handleCreateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'cliente') {
      if (!newSocio.firstName || !newSocio.email || !newSocio.password || !selectedBrandCode) {
        showToast("Nombre de marca, Email, Contraseña y Código de Marca son obligatorios", "error");
        return;
      }
    } else {
      if (!newSocio.firstName || !newSocio.email || !newSocio.password) {
        showToast("Nombre, Email y Contraseña son obligatorios", "error");
        return;
      }
    }

    setIsRegistering(true);
    try {
      const payload = userType === 'cliente' 
        ? {
            ...newSocio,
            lastName: '',
            role: `Cliente:${selectedBrandCode.trim().toUpperCase()}`,
            birthDate: ''
          }
        : newSocio;

      const result = await register(payload);
      if (result.success) {
        showToast(userType === 'cliente' ? "Perfil de cliente registrado con éxito" : result.message);
        setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
        setSelectedBrandCode('');
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
    const totalRevenue = projects.filter(p => p.status !== 'Inactivo').reduce((acc, p) => acc + (Number(p.monthlyFee) || 0), 0);
    const totalPayroll = performanceMetrics.byMember.reduce((acc, m) => acc + m.totalPay, 0);
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
    let currentTaxIncomeId = undefined;
    if (financeSettings.taxLinks) {
       let y = selectedPeriod.year;
       let m = selectedPeriod.month;
       while (y >= 2024) {
          const key = `${m}-${y}`;
          if (financeSettings.taxLinks[key] !== undefined) {
             currentTaxIncomeId = financeSettings.taxLinks[key];
             break;
          }
          m--;
          if (m < 0) { m = 11; y--; }
       }
    }

    // Combine paid receipts with planned payroll selections for this period
    const plannedPayroll = usersDB
        .filter(u => !u.role?.toLowerCase().startsWith('cliente'))
        .map(u => {
        const memberPerf = performanceMetrics.byMember.find(m => String(m.id) === String(u.id));
        return {
            userId: u.id,
            userName: `${u.firstName} ${u.lastName}`,
            amount: memberPerf ? memberPerf.totalPay : 0,
            incomeId: financeSettings.payrollLinks?.[u.id],
            day: financeSettings.payrollDays?.[u.id] || 20
        };
    }).filter(p => p.incomeId);

    const detailedIncomes = incomes.map(inc => {
        const linkedExpenses = periodTracking.filter(e => e.incomeId === inc.id);
        const linkedReceipts = periodReceipts.filter(r => {
          const rIncomeId = r.incomeId || financeSettings.receiptLinks?.[r.id] || financeSettings.payrollLinks?.[r.userId];
          return rIncomeId === inc.id;
        });
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
            periodLabel,
            isCarryOver: false
        };
    }).sort((a, b) => (Number(a.day) || 31) - (Number(b.day) || 31));

    const netProfit = totalRevenue - totalPayroll - totalExpenses - estTaxes;
    const realProfit = realRevenue - totalPayroll - totalExpenses - estTaxes;

    return { 
        totalRevenue, totalPayroll, totalExpenses, estTaxes, netProfit, 
        realRevenue, realProfit, paidExpenses: paidExpensesTotal, pendingExpenses: pendingExpensesTotal,
        detailedIncomes, periodTracking, currentTaxIncomeId
    };
  }, [projects, usersDB, baseSalaries, incomes, expenses, expenseTracking, financeSettings, selectedPeriod, receipts, performanceMetrics]);

  const handleProcessPayment = async (user: any) => {
    const base = Number(baseSalaries[String(user.id)] || 0);
    const memberPerf = performanceMetrics.byMember.find(m => String(m.id) === String(user.id));
    const completedTasks = memberPerf?.completed || 0;
    const tasksTotal = completedTasks * (taskRates[user.id] || 0);
    
    const bonuses = calculateUserBonuses(user.id);
    const ninjaBonusVal = bonuses.ninja ? 10 : 0;
    const masterBonusVal = bonuses.master ? 20 : 0;
    const totalPay = base + tasksTotal + ninjaBonusVal + masterBonusVal;

    if (totalPay <= 0) {
      showToast("El total a pagar debe ser mayor a $0 para procesar esta nómina", "error");
      return;
    }
    
    const incomeId = financeSettings.payrollLinks?.[user.id];
    if (!incomeId) {
      showToast("Selecciona el ingreso de donde se pagará esta nómina", "error");
      return;
    }
    const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const targetMonthName = monthNames[selectedPeriod.month];
    
    if (!window.confirm(`Estás a punto de liquidar la nómina correspondiente a ${targetMonthName} ${selectedPeriod.year} para ${user.firstName}. ¿Deseas continuar?`)) {
      return;
    }

    setIsProcessingPayment(user.id);

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
      total: totalPay, 
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `VO-${Math.floor(Math.random() * 90000) + 10000}`
    };
    
    const createdReceipt = await sendReceiptToUser(receiptData);
    setIsProcessingPayment(null);
    if (createdReceipt) {
      if (incomeId) {
        const nextReceiptLinks = {
          ...(financeSettings.receiptLinks || {}),
          [createdReceipt.id]: incomeId
        };
        await updateFinanceSettings({ receiptLinks: nextReceiptLinks });
      }
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

  const handleDownloadReceiptPDF = async (receipt: any) => {
    setIsDownloadingReceipt(receipt.id);
    setTimeout(async () => {
      const element = document.getElementById(`customer-pdf-content-${receipt.id}`);
      if (!element) {
        setIsDownloadingReceipt(null);
        showToast("Error: No se encontró el contenedor de impresión", "error");
        return;
      }
      try {
        const html2canvasLib = (window as any).html2canvas;
        const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (!html2canvasLib || !jsPDFLib) {
          showToast("Librerías de PDF no cargadas. Reintenta.", "error");
          setIsDownloadingReceipt(null);
          return;
        }

        const pdf = new jsPDFLib('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const canvas = await html2canvasLib(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 1240,
          width: 1240
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let drawWidth = imgWidth;
        let drawHeight = imgHeight;
        let xOffset = 0;
        let yOffset = 0;

        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          drawWidth = imgWidth * ratio;
          drawHeight = pageHeight;
          xOffset = (pageWidth - drawWidth) / 2;
        }

        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, drawWidth, drawHeight);
        pdf.save(`RECIBO_${receipt.receiptNumber}_${receipt.clientName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
        showToast("PDF descargado correctamente");
      } catch (err) {
        console.error(err);
        showToast("Error generando PDF", "error");
      } finally {
        setIsDownloadingReceipt(null);
      }
    }, 500);
  };

  const handleDownloadQuotePDF = async (quote: any) => {
    setIsDownloadingQuote(quote.id);
    setTimeout(async () => {
      const element = document.getElementById(`customer-quote-pdf-content-${quote.id}`);
      if (!element) {
        setIsDownloadingQuote(null);
        showToast("Error: No se encontró el contenedor de impresión", "error");
        return;
      }
      try {
        const html2canvasLib = (window as any).html2canvas;
        const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (!html2canvasLib || !jsPDFLib) {
          showToast("Librerías de PDF no cargadas. Reintenta.", "error");
          setIsDownloadingQuote(null);
          return;
        }

        const pdf = new jsPDFLib('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const canvas = await html2canvasLib(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 1240,
          width: 1240
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let drawWidth = imgWidth;
        let drawHeight = imgHeight;
        let xOffset = 0;
        let yOffset = 0;

        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          drawWidth = imgWidth * ratio;
          drawHeight = pageHeight;
          xOffset = (pageWidth - drawWidth) / 2;
        }

        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, drawWidth, drawHeight);
        pdf.save(`COTIZACION_${quote.quoteNumber}_${quote.clientName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
        showToast("PDF descargado correctamente");
      } catch (err) {
        console.error(err);
        showToast("Error generando PDF", "error");
      } finally {
        setIsDownloadingQuote(null);
      }
    }, 500);
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
                    <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] leading-none">Matriz de Acceso</h2>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.5em] mt-2 opacity-80">Director General Protocol</p>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <form onSubmit={handleLogin} className="w-full space-y-8 max-w-sm">
              <div className="space-y-4">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.4em] opacity-60">Sincronización Obligatoria</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                    <input 
                      type="password" 
                      autoFocus 
                      className="relative w-full bg-black/80 border border-white/5 rounded-xl p-6 text-white text-center text-3xl font-bold outline-none focus:border-primary/40 shadow-[inner_0_2px_10px_rgba(0,0,0,0.5)] tracking-[0.8em] transition-all" 
                      value={passwordAuth} 
                      onChange={e => setPasswordAuth(e.target.value)} 
                      placeholder="••••" 
                    />
                </div>
                {error && (
                    <div className="flex items-center justify-center gap-2 text-rose-500 animate-bounce">
                        <span className="material-symbols-outlined text-sm">report</span>
                        <p className="text-[11px] font-semibold uppercase tracking-widest">{error}</p>
                    </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-5 btn-premium text-white font-semibold uppercase rounded-xl text-xs tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
              >
                <span>Ejecutar Validación</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">key_visualizer</span>
              </button>
            </form>

            <div className="flex items-center gap-8 mt-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
               <p className="text-[7px] font-semibold text-slate-500 uppercase tracking-[0.3em]">Quantum Flow Engine v4.0</p>
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
                <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Control Maestro <span className="text-primary">.</span></h2>
                <p className="text-slate-500 text-[9px] font-semibold uppercase tracking-[0.3em] mt-1 opacity-60">Global Master Protocol</p>
            </div>
        </div>
        <nav className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5 backdrop-blur-md">
          {[ {id:'analytics', icon:'grid_view'}, {id:'rendimiento', icon:'monitoring'}, {id:'receipts', icon:'receipt_long'}, {id:'users', icon:'group'}, {id:'settings', icon:'tune'}, {id:'meetings', icon:'video_call'}, {id:'agenda', icon:'edit_note'} ].map(tab => (
            <button key={tab.id} title={tab.id} onClick={() => setActiveView(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeView === tab.id ? (tab.id === 'meetings' ? 'bg-orange-500 text-white shadow-xl' : tab.id === 'agenda' ? 'bg-violet-600 text-white shadow-xl' : 'bg-primary text-white shadow-xl') : 'text-slate-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="p-8 sm:p-12 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          
          {(activeView === 'rendimiento' || activeView === 'analytics') && (
            <div className="flex items-center justify-between glass-panel p-6 rounded-3xl border border-white/5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-xl">calendar_month</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Periodo de Gestión</h4>
                  <p className="text-xs font-semibold text-white uppercase">
                    {activeView === 'analytics' ? 'Mes Calendario: 1 al 31' : 'Corte: 20 al 19 del mes'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5">
                  <select 
                    className="bg-transparent text-white text-[11px] font-semibold uppercase tracking-widest outline-none px-4 py-2"
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
                  >
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                      <option key={m} value={i} className="bg-slate-900">{m}</option>
                    ))}
                  </select>
                  <select 
                    className="bg-transparent text-white text-[11px] font-semibold uppercase tracking-widest outline-none px-4 py-2 border-l border-white/5"
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


                {/* Dashboard Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {[ 
                      { label: 'Proyección Bruta', val: financeMetrics.totalRevenue, color: 'text-[#6100f9]', icon: 'payments' }, 
                      { label: 'Ingresos Percibidos', val: financeMetrics.realRevenue, color: 'text-[#9e6cff]', icon: 'account_balance' }, 
                      { label: 'Egresos Totales', val: financeMetrics.totalPayroll + financeMetrics.totalExpenses + (financeSettings.estTaxes || 0), color: 'text-[#f76319]', icon: 'data_usage' }, 
                      { label: 'Beneficio Real', val: financeMetrics.realProfit, color: 'text-[#f8f5ff]', icon: 'account_balance_wallet' } 
                    ].map((stat, i) => (
                    <div key={i} className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl transition-all hover:border-primary/20">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest opacity-60">{stat.label}</p>
                          <span className={`material-symbols-outlined text-lg ${stat.color} opacity-30`}>{stat.icon}</span>
                        </div>
                        <h4 className={`text-3xl sm:text-4xl font-bold ${stat.color} tracking-tighter mt-6`}>${stat.val.toLocaleString('es-ES', { minimumFractionDigits: 0 })}</h4>
                    </div>
                    ))}
                </div>

                {/* SECCIÓN DE INGRESOS PERCIBIDOS (RESTAURADA Y MEJORADA - AHORA ARRIBA) */}
                <div className="glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 border border-white/5 overflow-hidden shadow-xl text-left">
                    <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Ingresos Percibidos</h3>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Sincronización de flujo de caja para {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][selectedPeriod.month]} {selectedPeriod.year}</p>
                        </div>
                    </div>
                    
                    <form onSubmit={async (e) => { 
                      e.preventDefault(); 
                      await addIncome(newIncome.source, parseFloat(newIncome.amount), parseInt(newIncome.day), newIncome.description); 
                      setNewIncome({ source: '', amount: '', day: '', description: '' }); 
                    }} className="flex flex-wrap gap-4 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                       <input required placeholder="Origen / Cliente" className="flex-1 bg-transparent border-none px-5 py-3 text-xs text-white outline-none placeholder:text-slate-700 font-semibold min-w-[150px]" value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} />
                       <input placeholder="Nota (opcional)" className="flex-1 bg-transparent border-none px-5 py-3 text-xs text-white/50 outline-none placeholder:text-slate-700 font-semibold min-w-[150px]" value={newIncome.description} onChange={e => setNewIncome({...newIncome, description: e.target.value})} />
                       <input required type="number" placeholder="Monto $" className="w-24 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none font-semibold" value={newIncome.amount} onChange={e => setNewIncome({...newIncome, amount: e.target.value})} />
                       <input required type="number" min="1" max="31" placeholder="Día" className="w-20 bg-white/5 border border-white/5 rounded-xl px-3 py-3 text-xs text-white outline-none font-semibold text-center" value={newIncome.day} onChange={e => setNewIncome({...newIncome, day: e.target.value})} />
                       <button type="submit" className="px-6 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all text-sm font-semibold uppercase tracking-widest shrink-0">
                         <span className="material-symbols-outlined text-sm">add_circle</span>
                         Registrar Pago Fijo
                       </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {financeMetrics.detailedIncomes.map(inc => (
                            <div key={inc.id} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 hover:border-orange-500/20 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <p className="text-white font-bold text-lg tracking-tighter truncate w-40">{inc.source}</p>
                                        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">{inc.isCarryOver ? 'Recurrente' : `Ciclo: ${inc.periodLabel}`}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-orange-400 font-bold text-xl">${Number(inc.amount).toLocaleString('es-ES')}</p>
                                        {!inc.isCarryOver && <button onClick={() => deleteIncome(inc.id)} className="text-[10px] text-rose-500 font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Eliminar</button>}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div 
                                      className="flex flex-col bg-white/5 rounded-lg border border-white/5 overflow-hidden cursor-pointer group/exp"
                                      onClick={() => toggleIncomeExpansion(inc.id)}
                                    >
                                        <div className="flex justify-between items-center px-3 py-2.5 hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col text-left">
                                               <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Egresos Variables ({inc.linkedExpenses.length})</span>
                                               {inc.linkedExpenses.length > 0 && !expandedIncomes.includes(inc.id) && (
                                                   <span className="text-[7px] text-slate-600 uppercase font-semibold truncate w-32 border-l border-orange-500/30 pl-2">
                                                       {inc.linkedExpenses.map(le => le.name).join(', ')}
                                                   </span>
                                               )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-rose-400 font-semibold">-${Number(inc.expsAmount).toFixed(0)}</span>
                                              <span className={`material-symbols-outlined text-xs text-slate-600 transition-transform ${expandedIncomes.includes(inc.id) ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                                            </div>
                                        </div>
                                        
                                        {expandedIncomes.includes(inc.id) && (
                                          <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide bg-black/20">
                                            {inc.linkedExpenses.length > 0 ? inc.linkedExpenses.map((le: any) => (
                                              <div key={le.id} className="flex justify-between items-center py-2 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] px-1 rounded transition-colors group/row">
                                                <div className="flex flex-col text-left">
                                                  <span className="text-[11px] text-white font-semibold uppercase tracking-tight truncate w-32">{le.name}</span>
                                                  <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">Día {le.date ? le.date.replace(/[^0-9]/g, '') : 'S/F'}</span>
                                                </div>
                                                <span className="text-[11px] text-rose-400/80 font-semibold">-${Number(le.amount).toLocaleString('es-ES')}</span>
                                              </div>
                                            )) : (
                                              <p className="text-[10px] text-slate-700 font-semibold uppercase py-2 text-center">Sin egresos asociados</p>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-orange-400/80">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Nómina</span>
                                            {( [...inc.linkedReceipts.map(r => ({ ...r, day: r.date ? r.date.split('-')[2] : '20', isPaid: true })), ...inc.linkedPlannedPayroll] ).length > 0 && (
                                                <span className="text-[10px] text-slate-600 uppercase font-semibold truncate w-40">
                                                    {( [...inc.linkedReceipts.map(r => ({ ...r, day: r.date ? r.date.split('-')[2] : '20', isPaid: true })), ...inc.linkedPlannedPayroll] )
                                                       .sort((a, b: any) => (Number(a.day) || 20) - (Number(b.day) || 20))
                                                       .map((r: any) => `${r.userName} ${r.isPaid ? '(PAGADO)' : `(Día ${r.day})`}`)
                                                       .join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-semibold">-${Number(inc.payrollAmount).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5 text-amber-400/80">
                                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Impuestos (Prop)</span>
                                        <span className="text-[10px] font-semibold">-${Number(inc.taxShare).toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="text-left">
                                        <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Utilidad Neta de este Pago</p>
                                        <p className={`text-xl font-bold tracking-tighter ${inc.netAmount >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                                            ${inc.netAmount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-1 overflow-hidden rounded-full">
                                          <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                              <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, (inc.netAmount / inc.amount) * 100))}%` }}></div>
                                          </div>
                                        </div>
                                        <p className="text-[7px] font-semibold text-slate-600 uppercase tracking-widest">{inc.amount > 0 ? (Math.max(0, (inc.netAmount / inc.amount) * 100)).toFixed(0) : '0'}% remanente</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {financeMetrics.detailedIncomes.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                <span className="material-symbols-outlined text-4xl text-slate-700 mb-4 opacity-20">receipt_long</span>
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">No hay pagos registrados aún en este periodo</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
                    <div className="lg:col-span-4 glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 border border-white/5 shadow-xl text-left">
                        <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Retenciones Fiscales</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-lg">$</span>
                                <input type="number" className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-10 text-rose-500 font-bold text-2xl outline-none focus:border-rose-500/20" value={financeSettings.estTaxes} onChange={e => updateFinanceSettings({ estTaxes: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest px-1">Ligar a Ingreso</label>
                                <select 
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white font-semibold outline-none focus:border-primary/40"
                                    value={financeMetrics.currentTaxIncomeId || ''}
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
                        <p className="text-[9px] text-slate-600 uppercase font-semibold tracking-widest leading-relaxed">Provisión automática para carga fiscal mensual proyectada.</p>
                        
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">Balance de Egresos Variables</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl">
                                    <p className="text-xs font-semibold text-orange-500/60 uppercase tracking-widest mb-1">Ejecutado</p>
                                    <p className="text-xl font-bold text-orange-400">${financeMetrics.paidExpenses.toLocaleString('es-ES')}</p>
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl">
                                    <p className="text-xs font-semibold text-rose-500/60 uppercase tracking-widest mb-1">Por Pagar</p>
                                    <p className="text-xl font-bold text-rose-400">${financeMetrics.pendingExpenses.toLocaleString('es-ES')}</p>
                                </div>
                            </div>
                            <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Saldo Total Matriz</p>
                                <p className="text-sm font-semibold text-white">${financeMetrics.totalExpenses.toLocaleString('es-ES')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        {/* MATRIZ DE EGRESOS VARIABLES */}
                        <div className="glass-panel p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 border border-white/5 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Matriz de Egresos Variables</h3>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Sincronización mensual: {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][selectedPeriod.month]} {selectedPeriod.year}</p>
                                </div>
                            </div>
                            <form onSubmit={async (e) => { e.preventDefault(); await addExpense(newExpense.name, parseFloat(newExpense.amount), newExpense.day, newExpense.incomeId || undefined, newExpense.isOneTime, selectedPeriod.month, selectedPeriod.year); setNewExpense({ name:'', amount:'', day:'', incomeId: '', isOneTime: false }); }} className="flex flex-wrap items-center gap-4 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                               <input required placeholder="Concepto del gasto" className="flex-[2] bg-transparent border-none px-5 py-3 text-xs text-white outline-none placeholder:text-slate-700 font-semibold min-w-[150px]" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} />
                               <input required type="number" placeholder="Monto $" className="w-24 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                               <input required type="number" placeholder="Día" className="w-16 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none" value={newExpense.day} onChange={e => setNewExpense({...newExpense, day: e.target.value})} />
                               <select 
                                 className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none min-w-[130px] font-semibold"
                                 value={newExpense.incomeId}
                                 onChange={e => setNewExpense({...newExpense, incomeId: e.target.value})}
                               >
                                 <option value="" className="bg-slate-900">Sin Ligar</option>
                                 {financeMetrics.detailedIncomes.map(inc => (
                                   <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source} (${inc.amount})</option>
                                 ))}
                               </select>
                               <label className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-widest cursor-pointer hover:text-white transition-colors whitespace-nowrap px-2">
                                 <input type="checkbox" checked={newExpense.isOneTime} onChange={e => setNewExpense({...newExpense, isOneTime: e.target.checked})} className="accent-primary w-4 h-4" />
                                 Solo este mes
                               </label>
                               <button type="submit" className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform shrink-0"><span className="material-symbols-outlined text-xl">add</span></button>
                            </form>
                        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/10">
                            <table className="w-full text-left table-fixed">
                                <thead className="bg-white/5 text-xs font-semibold uppercase text-slate-600 tracking-widest">
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
                                    {financeMetrics.periodTracking.map(e => {
                                        const now = new Date();
                                        const currentActualMonth = now.getDate() >= 20 ? (now.getMonth() + 1) % 12 : now.getMonth();
                                        const currentActualYear = (now.getDate() >= 20 && now.getMonth() === 11) ? now.getFullYear() + 1 : now.getFullYear();
                                        const isPastPeriod = selectedPeriod.year < currentActualYear || (selectedPeriod.year === currentActualYear && selectedPeriod.month < currentActualMonth);
                                        const isLocked = !!((isPastPeriod || e.deletedAt) && !unlockedExpenses.includes(e.id));
                                        
                                        return (
                                        <tr key={e.id} className="hover:bg-white/[0.02] group transition-colors">
                                            <td className="px-6 py-5">
                                                <span className={`font-semibold uppercase tracking-tight truncate block ${isLocked ? 'text-white/50' : 'text-white'}`}>{e.name}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center px-1">
                                                <input 
                                                  type="number" min="1" max="31" 
                                                  disabled={isLocked}
                                                  className={`w-12 bg-black/40 border border-white/5 rounded-lg px-1 py-1 text-xs font-semibold text-center outline-none ${isLocked ? 'text-white/30 cursor-not-allowed' : 'text-white focus:border-primary/40'}`}
                                                  value={e.date ? e.date.replace(/[^0-9]/g, '') : ''}
                                                  onChange={val => updateExpense(e.id, { date: val.target.value ? `Día ${val.target.value}` : '' }, selectedPeriod.month, selectedPeriod.year)}
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <select 
                                                  disabled={isLocked}
                                                  className={`w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none ${isLocked ? 'text-white/30 cursor-not-allowed' : 'text-white focus:border-primary/40'}`}
                                                  value={e.incomeId || ''}
                                                  onChange={val => updateExpense(e.id, { incomeId: val.target.value }, selectedPeriod.month, selectedPeriod.year)}
                                                >
                                                    <option value="" className="bg-slate-900">Seleccionar...</option>
                                                    {incomes.map(inc => (
                                                        <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className={`px-6 py-5 text-right font-normal ${isLocked ? 'text-rose-400/50' : 'text-rose-400'}`}>-${Number(e.amount).toFixed(0)}</td>
                                            <td className="px-6 py-5 text-center">
                                              <button 
                                                onClick={() => toggleExpensePayment(e.id, selectedPeriod.month, selectedPeriod.year)}
                                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                                  e.paid 
                                                    ? `bg-orange-500/20 border border-orange-500/30 ${isLocked ? 'text-orange-400/50' : 'text-orange-400'}` 
                                                    : `bg-white/5 border border-white/10 ${isLocked ? 'text-slate-500/50' : 'text-slate-500 hover:border-primary/40 hover:text-white'}`
                                                }`}
                                              >
                                                {e.paid ? 'PAGADO' : 'PENDIENTE'}
                                              </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                              {isLocked ? (
                                                <button onClick={() => setUnlockedExpenses([...unlockedExpenses, e.id])} className="text-slate-500 hover:text-white transition-all hover:scale-110" title="Desbloquear para editar">
                                                  <span className="material-symbols-outlined text-xl">lock</span>
                                                </button>
                                              ) : (
                                                <div className="flex justify-end gap-2">
                                                  {unlockedExpenses.includes(e.id) && (
                                                    <button onClick={() => setUnlockedExpenses(unlockedExpenses.filter(id => id !== e.id))} className="text-primary hover:text-white transition-all hover:scale-110" title="Bloquear de nuevo">
                                                      <span className="material-symbols-outlined text-xl">lock_open</span>
                                                    </button>
                                                  )}
                                                  <button onClick={() => deleteExpense(e.id, selectedPeriod.month, selectedPeriod.year)} className="text-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110" title="Eliminar">
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                  </button>
                                                </div>
                                              )}
                                            </td>
                                        </tr>
                                        );
                                    })}
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
                <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Gestión de Recibos</h3>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em] mt-1">Control de facturación, cobros y cotizaciones externas</p>
              </div>

              {/* Selector de Pestañas (Recibos / Cotizaciones) */}
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5">
                <button 
                  onClick={() => {
                    setActiveReceiptTab('recibos');
                    setIsCreatingReceipt(false);
                    setIsCreatingQuote(false);
                    setIsManagingCatalog(false);
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all ${activeReceiptTab === 'recibos' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                  Recibos
                </button>
                <button 
                  onClick={() => {
                    setActiveReceiptTab('cotizaciones');
                    setIsCreatingReceipt(false);
                    setIsCreatingQuote(false);
                    setIsManagingCatalog(false);
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all ${activeReceiptTab === 'cotizaciones' ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                  Cotizaciones
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsManagingCatalog(!isManagingCatalog);
                    setIsCreatingReceipt(false);
                    setIsCreatingQuote(false);
                  }}
                  className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  Catálogo
                </button>
                {activeReceiptTab === 'recibos' ? (
                  <button 
                    onClick={() => {
                      setIsCreatingReceipt(true);
                      setIsCreatingQuote(false);
                      setIsManagingCatalog(false);
                    }}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Nuevo Recibo
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsCreatingQuote(true);
                      setIsCreatingReceipt(false);
                      setIsManagingCatalog(false);
                    }}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Nueva Cotización
                  </button>
                )}
              </div>
            </div>

            {isManagingCatalog && (
               <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-8 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center justify-between">
                     <h4 className="text-sm font-semibold text-primary uppercase tracking-widest">Configurar Catálogo de Servicios</h4>
                     <button onClick={() => setIsManagingCatalog(false)} className="text-slate-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                           <input 
                              placeholder="Nombre del servicio (Ej: Plan Mensual RRSS)"
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-normal outline-none"
                              value={newCatalogItem.name}
                              onChange={e => setNewCatalogItem({...newCatalogItem, name: e.target.value})}
                           />
                        </div>
                        <div>
                           <input 
                              type="number"
                              placeholder="Precio Base"
                              className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-normal outline-none"
                              value={newCatalogItem.basePrice || ''}
                              onChange={e => setNewCatalogItem({...newCatalogItem, basePrice: parseFloat(e.target.value) || 0})}
                           />
                        </div>
                        <div className="flex gap-2">
                           <select 
                              className="bg-black/40 border border-white/5 rounded-xl p-4 text-white font-normal outline-none grow"
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
                                 setNewCatalogItem({ name: '', basePrice: 0, currency: 'USD', includes: '' });
                              }}
                              className="p-4 bg-primary text-white rounded-xl"
                           >
                              <span className="material-symbols-outlined">add</span>
                           </button>
                        </div>
                     </div>
                     <textarea 
                        placeholder="Lo que incluye (puedes presionar Enter para escribir en un nuevo párrafo)"
                        rows={4}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-normal outline-none resize-y placeholder:text-slate-600"
                        value={newCatalogItem.includes || ''}
                        onChange={e => setNewCatalogItem({...newCatalogItem, includes: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {servicesCatalog.map(item => (
                        <div key={item.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group">
                           <div className="text-left">
                              <p className="text-xs font-semibold text-white uppercase">{item.name}</p>
                              <p className="text-[10px] font-semibold text-primary mb-2">{item.currency === 'USD' ? '$' : '₡'}{item.basePrice.toLocaleString()}</p>
                              {item.includes && (
                                 <p className="text-[10px] text-slate-400 whitespace-pre-line leading-relaxed border-t border-white/5 pt-2 mt-2">{item.includes}</p>
                              )}
                           </div>
                           <button onClick={() => deleteServiceCatalogItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500 shrink-0 self-start">
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
                   <h4 className="text-sm font-semibold text-primary uppercase tracking-widest">Configurar Nuevo Documento</h4>
                   <div className="flex items-center gap-6">
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                         <button 
                            onClick={() => setNewCustomerReceipt({...newCustomerReceipt, currency: 'USD'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-semibold transition-all ${newCustomerReceipt.currency === 'USD' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
                         >
                            USD ($)
                         </button>
                         <button 
                            onClick={() => setNewCustomerReceipt({...newCustomerReceipt, currency: 'CRC'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-semibold transition-all ${newCustomerReceipt.currency === 'CRC' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
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
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Nombre del Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Luis Mathieu Aguilar"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-normal outline-none focus:border-primary/40 transition-all"
                      value={newCustomerReceipt.clientName}
                      onChange={e => setNewCustomerReceipt({...newCustomerReceipt, clientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Fecha de Emisión</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-slate-400 font-normal opacity-60">
                      {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Servicios / Productos</label>
                     <button 
                        onClick={() => setNewCustomerReceipt({
                          ...newCustomerReceipt, 
                          items: [...newCustomerReceipt.items, { id: Date.now().toString(), description: '', details: '', quantity: 1, price: 0, total: 0 }]
                        })}
                        className="text-[10px] font-semibold text-primary uppercase tracking-widest hover:underline"
                     >
                        + Añadir Item Manual
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                    {newCustomerReceipt.items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 group">
                        <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                          <div className="flex gap-2 w-full">
                            <input 
                              placeholder="Descripción del servicio..."
                              className="grow bg-transparent border-none p-2 text-sm text-white font-semibold outline-none placeholder:text-slate-700"
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
                                    const list = e.currentTarget.nextElementSibling;
                                    if (list) list.classList.toggle('hidden');
                                 }}
                               >
                                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                               </button>
                               <div className="hidden absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1 min-w-[250px] max-h-48 overflow-y-auto">
                                  <p className="text-[8px] font-semibold text-slate-500 uppercase p-2 tracking-widest border-b border-white/5">Catálogo ({newCustomerReceipt.currency})</p>
                                  {servicesCatalog.filter(s => s.currency === newCustomerReceipt.currency).length > 0 ? (
                                     servicesCatalog.filter(s => s.currency === newCustomerReceipt.currency).map(svc => (
                                        <button 
                                           key={svc.id}
                                           onClick={(e) => {
                                              const next = [...newCustomerReceipt.items];
                                              next[idx].description = svc.name;
                                              next[idx].details = svc.includes || '';
                                              next[idx].price = svc.basePrice;
                                              next[idx].total = svc.basePrice * next[idx].quantity;
                                              setNewCustomerReceipt({...newCustomerReceipt, items: next});
                                              e.currentTarget.parentElement?.classList.add('hidden');
                                           }}
                                           className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-all flex justify-between items-center gap-4"
                                        >
                                           <span className="text-[10px] font-semibold text-white uppercase truncate">{svc.name}</span>
                                           <span className="text-[10px] font-semibold text-primary whitespace-nowrap">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{svc.basePrice.toLocaleString()}</span>
                                        </button>
                                     ))
                                  ) : (
                                     <p className="text-[9px] text-slate-600 p-2">No hay servicios registrados en esta moneda</p>
                                  )}
                               </div>
                            </div>
                          </div>
                          <textarea 
                            placeholder="Lo que incluye (puedes presionar Enter para escribir en un nuevo párrafo)"
                            rows={4}
                            className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-slate-300 outline-none placeholder:text-slate-700 resize-y"
                            value={item.details || ''}
                            onChange={e => {
                              const next = [...newCustomerReceipt.items];
                              next[idx].details = e.target.value;
                              setNewCustomerReceipt({...newCustomerReceipt, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                           <input 
                            type="number"
                            placeholder="Cant."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-center text-xs text-white font-semibold outline-none"
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
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-right text-xs text-white font-semibold outline-none"
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
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Monto de Abono ({newCustomerReceipt.currency === 'USD' ? '$' : '₡'})</label>
                    <input 
                      type="number" 
                      placeholder="¿Cuánto pagó hoy?"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-orange-400 font-bold text-xl outline-none focus:border-orange-500/20 transition-all"
                      value={newCustomerReceipt.amountPaid}
                      onChange={e => setNewCustomerReceipt({...newCustomerReceipt, amountPaid: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-end items-end space-y-2">
                    <div className="flex items-center gap-6 text-slate-500 font-semibold text-[10px] uppercase tracking-widest">
                       <span>Subtotal:</span>
                       <span className="text-white text-lg">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-6 text-primary font-semibold text-sm uppercase tracking-widest">
                       <span>Total Documento:</span>
                       <span className="text-3xl tracking-tighter">{newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</span>
                    </div>
                    {newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0) - newCustomerReceipt.amountPaid > 0 ? (
                      <div className="flex items-center gap-3 text-rose-500 font-semibold text-[10px] uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full">
                         <span className="material-symbols-outlined text-xs">pending</span>
                         Saldo Pendiente: {newCustomerReceipt.currency === 'USD' ? '$' : '₡'}{ (newCustomerReceipt.items.reduce((acc, curr) => acc + curr.total, 0) - newCustomerReceipt.amountPaid).toLocaleString() }
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-orange-500 font-semibold text-[10px] uppercase tracking-widest bg-orange-500/10 px-4 py-2 rounded-full">
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
                        items: [{ id: '1', description: '', details: '', quantity: 1, price: 0, total: 0 }],
                        amountPaid: 0,
                        notes: ''
                      });
                    }}
                    className="px-10 py-5 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     Guardar Recibo
                   </button>
                </div>
              </div>
            )}

            {isCreatingQuote && (
              <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 animate-in slide-in-from-top duration-500">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h4 className="text-sm font-semibold text-primary uppercase tracking-widest">Configurar Nueva Cotización</h4>
                   <div className="flex items-center gap-6">
                      <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                         <button 
                            onClick={() => setNewCustomerQuote({...newCustomerQuote, currency: 'USD'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-semibold transition-all ${newCustomerQuote.currency === 'USD' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
                         >
                            USD ($)
                         </button>
                         <button 
                            onClick={() => setNewCustomerQuote({...newCustomerQuote, currency: 'CRC'})}
                            className={`px-4 py-2 rounded-lg text-[10px] font-semibold transition-all ${newCustomerQuote.currency === 'CRC' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}
                         >
                            CRC (₡)
                         </button>
                      </div>
                      <button onClick={() => setIsCreatingQuote(false)} className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Nombre del Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Luis Mathieu Aguilar"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-normal outline-none focus:border-primary/40 transition-all"
                      value={newCustomerQuote.clientName}
                      onChange={e => setNewCustomerQuote({...newCustomerQuote, clientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Fecha de Emisión</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-slate-400 font-normal opacity-60">
                      {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Servicios / Productos</label>
                     <button 
                        onClick={() => setNewCustomerQuote({
                          ...newCustomerQuote, 
                          items: [...newCustomerQuote.items, { id: Date.now().toString(), description: '', details: '', quantity: 1, price: 0, total: 0 }]
                        })}
                        className="text-[10px] font-semibold text-primary uppercase tracking-widest hover:underline"
                     >
                        + Añadir Item Manual
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                    {newCustomerQuote.items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 group">
                        <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                          <div className="flex gap-2 w-full">
                            <input 
                              placeholder="Descripción del servicio..."
                              className="grow bg-transparent border-none p-2 text-sm text-white font-semibold outline-none placeholder:text-slate-700"
                              value={item.description}
                              onChange={e => {
                                const next = [...newCustomerQuote.items];
                                next[idx].description = e.target.value;
                                setNewCustomerQuote({...newCustomerQuote, items: next});
                              }}
                            />
                            <div className="relative">
                               <button 
                                 className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                                 title="Seleccionar del catálogo"
                                 onClick={(e) => {
                                    const list = e.currentTarget.nextElementSibling;
                                    if (list) list.classList.toggle('hidden');
                                 }}
                               >
                                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                               </button>
                               <div className="hidden absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1 min-w-[250px] max-h-48 overflow-y-auto">
                                  <p className="text-[8px] font-semibold text-slate-500 uppercase p-2 tracking-widest border-b border-white/5">Catálogo ({newCustomerQuote.currency})</p>
                                  {servicesCatalog.filter(s => s.currency === newCustomerQuote.currency).length > 0 ? (
                                     servicesCatalog.filter(s => s.currency === newCustomerQuote.currency).map(svc => (
                                        <button 
                                           key={svc.id}
                                           onClick={(e) => {
                                              const next = [...newCustomerQuote.items];
                                              next[idx].description = svc.name;
                                              next[idx].details = svc.includes || '';
                                              next[idx].price = svc.basePrice;
                                              next[idx].total = svc.basePrice * next[idx].quantity;
                                              setNewCustomerQuote({...newCustomerQuote, items: next});
                                              e.currentTarget.parentElement?.classList.add('hidden');
                                           }}
                                           className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-all flex justify-between items-center gap-4"
                                        >
                                           <span className="text-[10px] font-semibold text-white uppercase truncate">{svc.name}</span>
                                           <span className="text-[10px] font-semibold text-primary whitespace-nowrap">{newCustomerQuote.currency === 'USD' ? '$' : '₡'}{svc.basePrice.toLocaleString()}</span>
                                        </button>
                                     ))
                                  ) : (
                                     <p className="text-[9px] text-slate-600 p-2">No hay servicios registrados en esta moneda</p>
                                  )}
                               </div>
                            </div>
                          </div>
                          <textarea 
                            placeholder="Lo que incluye (puedes presionar Enter para escribir en un nuevo párrafo)"
                            rows={4}
                            className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-slate-300 outline-none placeholder:text-slate-700 resize-y"
                            value={item.details || ''}
                            onChange={e => {
                              const next = [...newCustomerQuote.items];
                              next[idx].details = e.target.value;
                              setNewCustomerQuote({...newCustomerQuote, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                           <input 
                            type="number"
                            placeholder="Cant."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-center text-xs text-white font-semibold outline-none"
                            value={item.quantity}
                            onChange={e => {
                              const next = [...newCustomerQuote.items];
                              const q = parseInt(e.target.value) || 0;
                              next[idx].quantity = q;
                              next[idx].total = q * next[idx].price;
                              setNewCustomerQuote({...newCustomerQuote, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                           <input 
                            type="number"
                            placeholder="Precio"
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-right text-xs text-white font-semibold outline-none"
                            value={item.price}
                            onChange={e => {
                              const next = [...newCustomerQuote.items];
                              const p = parseFloat(e.target.value) || 0;
                              next[idx].price = p;
                              next[idx].total = p * next[idx].quantity;
                              setNewCustomerQuote({...newCustomerQuote, items: next});
                            }}
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-end">
                           <button 
                            onClick={() => {
                              if (newCustomerQuote.items.length > 1) {
                                const next = newCustomerQuote.items.filter((_, i) => i !== idx);
                                setNewCustomerQuote({...newCustomerQuote, items: next});
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t border-white/5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Descuento (%)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-semibold text-sm outline-none"
                      value={newCustomerQuote.discountPercentage || ''}
                      onChange={e => setNewCustomerQuote({...newCustomerQuote, discountPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Detalle Descuento</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Descuento de temporada"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-semibold text-sm outline-none"
                      value={newCustomerQuote.discountDescription}
                      onChange={e => setNewCustomerQuote({...newCustomerQuote, discountDescription: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">IVA (%)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-semibold text-sm outline-none"
                      value={newCustomerQuote.ivaPercentage || ''}
                      onChange={e => setNewCustomerQuote({...newCustomerQuote, ivaPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex flex-col justify-end items-end space-y-2">
                    <div className="flex items-center gap-6 text-slate-500 font-semibold text-[10px] uppercase tracking-widest">
                       <span>Subtotal:</span>
                       <span className="text-white text-base">
                         {newCustomerQuote.currency === 'USD' ? '$' : '₡'}{newCustomerQuote.items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                       </span>
                    </div>
                    {newCustomerQuote.discountPercentage > 0 && (
                      <div className="flex items-center gap-6 text-rose-400 font-semibold text-[10px] uppercase tracking-widest">
                         <span>Descuento:</span>
                         <span>
                           -{newCustomerQuote.currency === 'USD' ? '$' : '₡'}{(newCustomerQuote.items.reduce((acc, curr) => acc + curr.total, 0) * (newCustomerQuote.discountPercentage / 100)).toLocaleString()}
                         </span>
                      </div>
                    )}
                    <div className="flex items-center gap-6 text-primary font-semibold text-sm uppercase tracking-widest">
                       <span>Total Cotizado:</span>
                       <span className="text-3xl tracking-tighter">
                         {newCustomerQuote.currency === 'USD' ? '$' : '₡'}{(() => {
                           const sub = newCustomerQuote.items.reduce((acc, curr) => acc + curr.total, 0);
                           const disc = sub * (newCustomerQuote.discountPercentage / 100);
                           const taxed = (sub - disc) * (newCustomerQuote.ivaPercentage / 100);
                           return (sub - disc + taxed).toLocaleString();
                         })()}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Notas y Condiciones</label>
                  <textarea 
                    placeholder="Escribe notas adicionales sobre la cotización..."
                    rows={4}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-normal outline-none resize-y placeholder:text-slate-600"
                    value={newCustomerQuote.notes}
                    onChange={e => setNewCustomerQuote({...newCustomerQuote, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                   <button 
                    onClick={async () => {
                      const subtotal = newCustomerQuote.items.reduce((acc, curr) => acc + curr.total, 0);
                      const disc = subtotal * (newCustomerQuote.discountPercentage / 100);
                      const taxed = (subtotal - disc) * (newCustomerQuote.ivaPercentage / 100);
                      const total = subtotal - disc + taxed;

                      await addCustomerQuote({
                        clientName: newCustomerQuote.clientName,
                        date: new Date().toISOString(),
                        quoteNumber: `COT-${Math.floor(1000 + Math.random() * 9000)}`,
                        currency: newCustomerQuote.currency,
                        items: newCustomerQuote.items,
                        subtotal: subtotal,
                        ivaPercentage: newCustomerQuote.ivaPercentage,
                        discountPercentage: newCustomerQuote.discountPercentage,
                        discountDescription: newCustomerQuote.discountDescription,
                        total: total,
                        notes: newCustomerQuote.notes
                      });
                      setIsCreatingQuote(false);
                      setNewCustomerQuote({
                        clientName: '',
                        currency: 'USD',
                        items: [{ id: '1', description: '', details: '', quantity: 1, price: 0, total: 0 }],
                        ivaPercentage: 0,
                        discountPercentage: 0,
                        discountDescription: '',
                        notes: ''
                      });
                    }}
                    className="px-10 py-5 bg-gradient-to-br from-primary to-purple-800 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     Guardar Cotización
                   </button>
                </div>
              </div>
            )}

            {activeReceiptTab === 'recibos' && !isCreatingReceipt && !isManagingCatalog && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Listado de Recibos</h3>
                  <div className="flex items-center gap-4">
                    <select
                      className="bg-black/40 text-white text-[11px] font-semibold uppercase tracking-widest outline-none px-4 py-2 rounded-xl border border-white/5"
                      value={selectedReceiptPeriod}
                      onChange={(e) => setSelectedReceiptPeriod(e.target.value)}
                    >
                      {Object.keys(groupedReceipts).length > 0 ? (
                        Object.keys(groupedReceipts).map(k => (
                          <option key={k} value={k} className="bg-slate-900">{k}</option>
                        ))
                      ) : (
                        <option value="" className="bg-slate-900">Sin registros</option>
                      )}
                    </select>
                  </div>
                </div>

                {Object.keys(groupedReceipts).length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-[2.5rem] border border-white/5">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">No hay recibos generados aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedReceipts[selectedReceiptPeriod]?.map(r => {
                      const isDeleting = deletingReceiptId === r.id;
                      const isPaying = activePaymentReceipt === r.id;
                      return (
                        <div key={r.id} className="bg-black/30 border border-white/5 rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group relative">
                          <div className="flex justify-between items-start">
                            <div className="text-left">
                              <span className="px-3 py-1 bg-black/40 rounded-xl text-[9px] font-mono text-primary border border-white/5 shadow-inner mr-2">{r.receiptNumber}</span>
                              <p className="text-white font-bold text-lg tracking-tighter truncate w-48 mt-2 uppercase">{r.clientName}</p>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                                {new Date(r.date || r.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest ${
                                r.status === 'Pagado' ? 'bg-orange-500/20 text-orange-400' :
                                r.status === 'Parcial' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-rose-500/20 text-rose-400'
                              }`}>
                                {r.status}
                              </span>
                              <p className="text-primary font-bold text-xl">${Number(r.total).toLocaleString('es-ES')}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                            <div className="flex justify-between text-slate-400">
                              <span>Abonado:</span>
                              <span className="font-normal text-white">${Number(r.amountPaid).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Pendiente:</span>
                              <span className="font-normal text-rose-400">${Number(r.balancePending).toLocaleString()}</span>
                            </div>
                          </div>

                          {isPaying ? (
                            <div className="mt-4 bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Registrar Abono / Pago</p>
                              <div className="flex gap-2">
                                <input 
                                  type="number"
                                  placeholder="Monto"
                                  className="bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white font-semibold outline-none grow"
                                  value={newPaymentAmount || ''}
                                  onChange={e => setNewPaymentAmount(parseFloat(e.target.value) || 0)}
                                />
                                <button 
                                  onClick={async () => {
                                    const nextPaid = Number(r.amountPaid) + Number(newPaymentAmount);
                                    const nextPending = Math.max(0, r.total - nextPaid);
                                    const nextStatus = nextPending <= 0 ? 'Pagado' : (nextPaid > 0 ? 'Parcial' : 'Pendiente');
                                    await updateCustomerReceipt(r.id, {
                                      amountPaid: nextPaid,
                                      balancePending: nextPending,
                                      status: nextStatus
                                    });
                                    setActivePaymentReceipt(null);
                                    setNewPaymentAmount(0);
                                    showToast("Abono registrado con éxito");
                                  }}
                                  className="px-4 py-3 bg-orange-500 text-white rounded-xl text-xs font-semibold uppercase tracking-widest"
                                >
                                  Confirmar
                                </button>
                                <button 
                                  onClick={() => {
                                    setActivePaymentReceipt(null);
                                    setNewPaymentAmount(0);
                                  }}
                                  className="px-4 py-3 bg-white/5 text-slate-400 rounded-xl text-xs font-semibold uppercase"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-4 border-t border-white/5">
                              {r.status !== 'Pagado' && (
                                <button 
                                  onClick={() => {
                                    setActivePaymentReceipt(r.id);
                                    setNewPaymentAmount(0);
                                  }}
                                  className="px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
                                >
                                  Abonar
                                </button>
                              )}
                              <button 
                                disabled={isDownloadingReceipt === r.id}
                                onClick={() => handleDownloadReceiptPDF(r)}
                                className="px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                                {isDownloadingReceipt === r.id ? 'Generando...' : 'Descargar PDF'}
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm("¿Seguro que deseas eliminar este recibo?")) {
                                    deleteCustomerReceipt(r.id);
                                    showToast("Recibo eliminado");
                                  }
                                }}
                                className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all ml-auto"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeReceiptTab === 'cotizaciones' && !isCreatingQuote && !isManagingCatalog && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Listado de Cotizaciones</h3>
                  <div className="flex items-center gap-4">
                    <select
                      className="bg-black/40 text-white text-[11px] font-semibold uppercase tracking-widest outline-none px-4 py-2 rounded-xl border border-white/5"
                      value={selectedQuotePeriod}
                      onChange={(e) => setSelectedQuotePeriod(e.target.value)}
                    >
                      {Object.keys(groupedQuotes).length > 0 ? (
                        Object.keys(groupedQuotes).map(k => (
                          <option key={k} value={k} className="bg-slate-900">{k}</option>
                        ))
                      ) : (
                        <option value="" className="bg-slate-900">Sin registros</option>
                      )}
                    </select>
                  </div>
                </div>

                {Object.keys(groupedQuotes).length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-[2.5rem] border border-white/5">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">No hay cotizaciones generadas aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedQuotes[selectedQuotePeriod]?.map(q => {
                      return (
                        <div key={q.id} className="bg-black/30 border border-white/5 rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group relative text-left">
                          <div className="flex justify-between items-start">
                            <div className="text-left">
                              <span className="px-3 py-1 bg-black/40 rounded-xl text-[9px] font-mono text-primary border border-white/5 shadow-inner mr-2">{q.quoteNumber}</span>
                              <p className="text-white font-bold text-lg tracking-tighter truncate w-48 mt-2 uppercase">{q.clientName}</p>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                                {new Date(q.date || q.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-primary font-bold text-xl">${Number(q.total).toLocaleString('es-ES')}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                            <div className="flex justify-between text-slate-400">
                              <span>Subtotal:</span>
                              <span className="font-normal text-white">${Number(q.subtotal).toLocaleString()}</span>
                            </div>
                            {q.discountPercentage ? (
                              <div className="flex justify-between text-slate-400">
                                <span>Descuento ({q.discountPercentage}%):</span>
                                <span className="font-normal text-rose-400">-${(q.subtotal * q.discountPercentage / 100).toLocaleString()}</span>
                              </div>
                            ) : null}
                            {q.ivaPercentage ? (
                              <div className="flex justify-between text-slate-400">
                                <span>IVA ({q.ivaPercentage}%):</span>
                                <span className="font-normal text-amber-400">+${((q.subtotal * (1 - (q.discountPercentage || 0) / 100)) * q.ivaPercentage / 100).toLocaleString()}</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex gap-2 pt-4 border-t border-white/5">
                            <button 
                              disabled={isDownloadingQuote === q.id}
                              onClick={() => handleDownloadQuotePDF(q)}
                              className="px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              {isDownloadingQuote === q.id ? 'Generando...' : 'Descargar PDF'}
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("¿Seguro que deseas eliminar esta cotización?")) {
                                  deleteCustomerQuote(q.id);
                                  showToast("Cotización eliminada");
                                }
                              }}
                              className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all ml-auto"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* HIDDEN PDF PRINT CONTAINERS */}
            <div className="fixed left-[-9999px] top-0">
              {customerReceipts.map(receipt => {
                const formatDateWithSpaces = (dateStr: string) => {
                  try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return '';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day} / ${month} / ${year}`;
                  } catch (e) {
                    return '';
                  }
                };

                const formatCurrency = (amount: number, currency: 'USD' | 'CRC') => {
                  const symbol = currency === 'CRC' ? '₡' : '$';
                  const locale = currency === 'USD' ? 'en-US' : 'es-CR';
                  const decimals = currency === 'USD' ? 2 : 0;
                  try {
                    const formatted = Number(amount).toLocaleString(locale, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals
                    });
                    return `${symbol}${formatted}`;
                  } catch (e) {
                    return `${symbol}${amount}`;
                  }
                };

                return (
                  <div 
                    key={receipt.id} 
                    id={`customer-pdf-content-${receipt.id}`} 
                    className="w-[1240px] min-h-[1754px] bg-white flex flex-col font-sans text-slate-900 text-left relative overflow-hidden pb-[120px]"
                    style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {/* HEADER - No stretched (Preserves 1404x292 aspect ratio) */}
                    <img 
                      src={receiptHeaderImg} 
                      style={{ width: '1240px', height: '257.89px', display: 'block' }} 
                      className="shrink-0" 
                      alt="Cabecera Recibo" 
                    />

                    <div className="px-16 py-8 flex-grow flex flex-col">
                      {/* DOCUMENT INFO ROW */}
                      <div className="flex justify-between items-start mb-8 shrink-0">
                        <div>
                          <span className="text-3xl font-bold text-slate-800 uppercase tracking-tight block leading-none">{receipt.clientName}</span>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Nombre del cliente</span>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="bg-[#6100f9] text-white px-8 py-3 rounded-none flex justify-between items-center w-80">
                            <span className="text-xs font-semibold uppercase tracking-widest">INVOICE#</span>
                            <span className="text-sm font-semibold tracking-wider">{receipt.receiptNumber}</span>
                          </div>
                          <div className="bg-[#6100f9] text-white px-8 py-3 rounded-none flex justify-between items-center w-80">
                            <span className="text-xs font-semibold uppercase tracking-widest">DATE</span>
                            <span className="text-sm font-semibold tracking-wider">{formatDateWithSpaces(receipt.date || receipt.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* TABLE HEADER STYLE ROW */}
                      <div className="bg-[#32363f] text-white rounded-none flex items-center px-10 py-4 mb-5 text-xs font-semibold uppercase tracking-[0.15em] shrink-0">
                        <div className="w-[70%] text-left">Descripción</div>
                        <div className="w-[15%] text-center">Cantidad</div>
                        <div className="w-[15%] text-right">Valor</div>
                      </div>

                      {/* ITEMS SECTION */}
                      <div className="space-y-4">
                        {receipt.items.map((item, idx) => (
                          <div key={item.id || idx} className="bg-[#cecece] rounded-none border border-[#cecece] flex items-center px-10 py-6" style={{ backgroundColor: '#cecece' }}>
                            <div className="w-[70%] text-left pr-4">
                              <span className="font-bold text-slate-900 uppercase text-lg leading-tight block">{item.description}</span>
                              {item.details && (
                                <span className="text-sm font-semibold text-slate-850 leading-relaxed whitespace-pre-line mt-1.5 block">{item.details}</span>
                              )}
                            </div>
                            <div className="w-[15%] text-center font-bold text-slate-800 text-lg">{item.quantity}</div>
                            <div className="w-[15%] text-right font-bold text-slate-900 text-lg">
                              {formatCurrency(item.total, receipt.currency)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* FLEXIBLE SPACER */}
                      <div className="flex-grow" />

                      {/* TOTALS & PAYMENT DETAILS */}
                      <div className="grid grid-cols-12 gap-8 items-end pt-6 border-t border-[#cecece] mt-8 shrink-0">
                        {/* Terms & Conditions Box */}
                        <div className="col-span-7 bg-[#cecece] rounded-none border border-[#cecece] border-l-4 border-l-[#6100f9] p-8 text-left space-y-4" style={{ backgroundColor: '#cecece' }}>
                          <div>
                            <h5 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Términos & Condiciones</h5>
                            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                              Para iniciar el proyecto se requiere un adelanto del 50% del monto total.<br />
                              El 50% restante se cancela al finalizar, junto con la entrega completa de los recursos y archivos correspondientes.
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Métodos de Pago</h5>
                            <div className="text-xs font-semibold text-slate-800 leading-relaxed space-y-2">
                              <div>
                                <span className="font-normal">SINPE MÓVIL:</span> 7275 4433
                              </div>
                              <div className="border-t border-slate-300 pt-1.5">
                                <span className="font-semibold block uppercase text-[10px] tracking-wider text-slate-700">Transferencia Bancaria BAC</span>
                                <div className="mt-1 pl-2 border-l border-slate-400">
                                  <span className="font-normal block text-slate-700">Dólares:</span>
                                  CUENTA IBAN: CR 8201 0200 0070 3993 6424<br />
                                  CUENTA BAC: 703993642
                                </div>
                                <div className="mt-1 pl-2 border-l border-slate-400">
                                  <span className="font-normal block text-slate-700">Colones:</span>
                                  CUENTA IBAN: CR 9201 0200 0070 3993 6341<br />
                                  CUENTA BAC: 703993634
                                </div>
                              </div>
                            </div>
                          </div>
                          {receipt.notes && (
                            <div className="text-sm font-semibold text-slate-900 border-l-4 border-slate-300 pl-4 whitespace-pre-line uppercase mt-2">
                              {receipt.notes}
                            </div>
                          )}
                        </div>

                        {/* Calculations Box */}
                        <div className="col-span-5 flex flex-col items-end">
                          <div className="bg-[#cecece] rounded-none border border-[#cecece] p-8 flex flex-col gap-4 w-full text-left font-normal mb-3" style={{ backgroundColor: '#cecece' }}>
                            <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider">
                              <span>Sub Total:</span>
                              <span className="text-slate-800 font-normal">{formatCurrency(receipt.subtotal || receipt.total, receipt.currency)}</span>
                            </div>
                            {(receipt as any).discountPercentage ? (
                              <div className="flex justify-between items-center text-sm text-rose-500 uppercase tracking-wider">
                                <span>Descuento ({(receipt as any).discountPercentage}%):</span>
                                <span className="font-normal">-{formatCurrency((receipt.subtotal || receipt.total) * (((receipt as any).discountPercentage || 0) / 100), receipt.currency)}</span>
                              </div>
                            ) : null}
                            {(receipt as any).ivaPercentage ? (
                              <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider">
                                <span>IVA ({(receipt as any).ivaPercentage}%):</span>
                                <span className="text-slate-800 font-normal">+{formatCurrency((receipt.subtotal || receipt.total) * (((receipt as any).ivaPercentage || 0) / 100), receipt.currency)}</span>
                              </div>
                            ) : null}
                            {receipt.amountPaid !== undefined && receipt.amountPaid > 0 && (
                              <>
                                <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider border-t border-[#cecece] pt-3 mt-1">
                                    <span>Monto Abonado:</span>
                                    <span className="text-orange-950 font-normal">{formatCurrency(receipt.amountPaid, receipt.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider">
                                    <span>Saldo Pendiente:</span>
                                    <span className="text-rose-950 font-normal">{formatCurrency(receipt.balancePending, receipt.currency)}</span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="bg-[#6100f9] text-white rounded-none flex justify-between items-center px-8 py-5 w-full shadow-md font-normal shrink-0">
                            <span className="text-xs uppercase tracking-widest">
                              {receipt.amountPaid > 0 ? "Saldo Pendiente:" : "Total:"}
                            </span>
                            <span className="text-2xl tracking-tight">
                              {formatCurrency(receipt.amountPaid > 0 ? receipt.balancePending : receipt.total, receipt.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER - No stretched (Preserves 3679x236 aspect ratio) */}
                    <img 
                      src={footerImg} 
                      style={{ width: '1240px', height: '79.54px', display: 'block' }} 
                      className="absolute bottom-0 left-0 shrink-0" 
                      alt="Pie de Página" 
                    />
                  </div>
                );
              })}

              {customerQuotes.map(quote => {
                const discountAmount = quote.subtotal * ((quote.discountPercentage || 0) / 100);
                const taxedAmount = (quote.subtotal - discountAmount) * ((quote.ivaPercentage || 0) / 100);

                const formatDateWithSpaces = (dateStr: string) => {
                  try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return '';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day} / ${month} / ${year}`;
                  } catch (e) {
                    return '';
                  }
                };

                const formatCurrency = (amount: number, currency: 'USD' | 'CRC') => {
                  const symbol = currency === 'CRC' ? '₡' : '$';
                  const locale = currency === 'USD' ? 'en-US' : 'es-CR';
                  const decimals = currency === 'USD' ? 2 : 0;
                  try {
                    const formatted = Number(amount).toLocaleString(locale, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals
                    });
                    return `${symbol}${formatted}`;
                  } catch (e) {
                    return `${symbol}${amount}`;
                  }
                };

                return (
                  <div 
                    key={quote.id} 
                    id={`customer-quote-pdf-content-${quote.id}`} 
                    className="w-[1240px] min-h-[1754px] bg-white flex flex-col font-sans text-slate-900 text-left relative overflow-hidden pb-[120px]"
                    style={{ boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    {/* HEADER - No stretched (Preserves 1404x292 aspect ratio) */}
                    <img 
                      src={quoteHeaderImg} 
                      style={{ width: '1240px', height: '257.89px', display: 'block' }} 
                      className="shrink-0" 
                      alt="Cabecera Cotización" 
                    />

                    <div className="px-16 py-8 flex-grow flex flex-col">
                      {/* DOCUMENT INFO ROW */}
                      <div className="flex justify-between items-start mb-8 shrink-0">
                        <div>
                          <span className="text-3xl font-bold text-slate-800 uppercase tracking-tight block leading-none">{quote.clientName}</span>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Nombre del cliente</span>
                        </div>
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="bg-[#6100f9] text-white px-8 py-3 rounded-none flex justify-between items-center w-80">
                            <span className="text-xs font-semibold uppercase tracking-widest">INVOICE#</span>
                            <span className="text-sm font-semibold tracking-wider">{quote.quoteNumber}</span>
                          </div>
                          <div className="bg-[#6100f9] text-white px-8 py-3 rounded-none flex justify-between items-center w-80">
                            <span className="text-xs font-semibold uppercase tracking-widest">DATE</span>
                            <span className="text-sm font-semibold tracking-wider">{formatDateWithSpaces(quote.date || quote.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* TABLE HEADER STYLE ROW */}
                      <div className="bg-[#32363f] text-white rounded-none flex items-center px-10 py-4 mb-5 text-xs font-semibold uppercase tracking-[0.15em] shrink-0">
                        <div className="w-[70%] text-left">Descripción</div>
                        <div className="w-[15%] text-center">Cantidad</div>
                        <div className="w-[15%] text-right">Valor</div>
                      </div>

                      {/* ITEMS SECTION */}
                      <div className="space-y-4">
                        {quote.items.map((item, idx) => (
                          <div key={item.id || idx} className="bg-[#cecece] rounded-none border border-[#cecece] flex items-center px-10 py-6" style={{ backgroundColor: '#cecece' }}>
                            <div className="w-[70%] text-left pr-4">
                              <span className="font-bold text-slate-900 uppercase text-lg leading-tight block">{item.description}</span>
                              {item.details && (
                                <span className="text-sm font-semibold text-slate-850 leading-relaxed whitespace-pre-line mt-1.5 block">{item.details}</span>
                              )}
                            </div>
                            <div className="w-[15%] text-center font-bold text-slate-800 text-lg">{item.quantity}</div>
                            <div className="w-[15%] text-right font-bold text-slate-900 text-lg">
                              {formatCurrency(item.total, quote.currency)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* FLEXIBLE SPACER */}
                      <div className="flex-grow" />

                      {/* TOTALS & TERMS */}
                      <div className="grid grid-cols-12 gap-8 items-end pt-6 border-t border-[#cecece] mt-8 shrink-0">
                        {/* Terms & Conditions Box */}
                        <div className="col-span-7 bg-[#cecece] rounded-none border border-[#cecece] border-l-4 border-l-[#6100f9] p-8 text-left space-y-4" style={{ backgroundColor: '#cecece' }}>
                          <div>
                            <h5 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Términos & Condiciones</h5>
                            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                              Para iniciar el proyecto se requiere un adelanto del 50% del monto total.<br />
                              El 50% restante se cancela al finalizar, junto con la entrega completa de los recursos y archivos correspondientes.
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Métodos de Pago</h5>
                            <div className="text-xs font-semibold text-slate-800 leading-relaxed space-y-2">
                              <div>
                                <span className="font-normal">SINPE MÓVIL:</span> 7275 4433
                              </div>
                              <div className="border-t border-slate-300 pt-1.5">
                                <span className="font-semibold block uppercase text-[10px] tracking-wider text-slate-700">Transferencia Bancaria BAC</span>
                                <div className="mt-1 pl-2 border-l border-slate-400">
                                  <span className="font-normal block text-slate-700">Dólares:</span>
                                  CUENTA IBAN: CR 8201 0200 0070 3993 6424<br />
                                  CUENTA BAC: 703993642
                                </div>
                                <div className="mt-1 pl-2 border-l border-slate-400">
                                  <span className="font-normal block text-slate-700">Colones:</span>
                                  CUENTA IBAN: CR 9201 0200 0070 3993 6341<br />
                                  CUENTA BAC: 703993634
                                </div>
                              </div>
                            </div>
                          </div>
                          {quote.notes && (
                            <div className="text-sm font-semibold text-slate-900 border-l-4 border-slate-300 pl-4 whitespace-pre-line uppercase mt-2">
                              {quote.notes}
                            </div>
                          )}
                        </div>

                        {/* Calculations Box */}
                        <div className="col-span-5 flex flex-col items-end">
                          <div className="bg-[#cecece] rounded-none border border-[#cecece] p-8 flex flex-col gap-4 w-full text-left font-normal mb-3" style={{ backgroundColor: '#cecece' }}>
                            <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider">
                              <span>Sub Total:</span>
                              <span className="text-slate-800 font-normal">{formatCurrency(quote.subtotal, quote.currency)}</span>
                            </div>
                            {quote.discountPercentage ? (
                              <div className="flex justify-between items-center text-sm text-rose-500 uppercase tracking-wider">
                                <span>Descuento ({quote.discountPercentage}%):</span>
                                <span className="font-normal">-{formatCurrency(discountAmount, quote.currency)}</span>
                              </div>
                            ) : null}
                            {quote.ivaPercentage ? (
                              <div className="flex justify-between items-center text-sm text-slate-700 uppercase tracking-wider">
                                <span>IVA ({quote.ivaPercentage}%):</span>
                                <span className="text-slate-800 font-normal">+{formatCurrency(taxedAmount, quote.currency)}</span>
                              </div>
                            ) : null}
                          </div>

                          <div className="bg-[#6100f9] text-white rounded-none flex justify-between items-center px-8 py-5 w-full shadow-md font-normal shrink-0">
                            <span className="text-xs uppercase tracking-widest">Total:</span>
                            <span className="text-2xl tracking-tight">{formatCurrency(quote.total, quote.currency)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER - No stretched (Preserves 3679x236 aspect ratio) */}
                    <img 
                      src={footerImg} 
                      style={{ width: '1240px', height: '79.54px', display: 'block' }} 
                      className="absolute bottom-0 left-0 shrink-0" 
                      alt="Pie de Página" 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'rendimiento' && (
        <div className="space-y-10 animate-in fade-in duration-700 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest opacity-60">Tareas Completadas Totales</p>
                <span className="material-symbols-outlined text-lg text-orange-400 opacity-30">task_alt</span>
              </div>
              <h4 className="text-4xl font-bold text-orange-400 tracking-tighter mt-6">{performanceMetrics.totalCompleted}</h4>
            </div>
            <div className="p-8 rounded-[2.5rem] border border-white/5 glass-panel flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest opacity-60">Tareas Pendientes Totales</p>
                <span className="material-symbols-outlined text-lg text-rose-400 opacity-30">pending_actions</span>
              </div>
              <h4 className="text-4xl font-bold text-rose-400 tracking-tighter mt-6">{performanceMetrics.totalPending}</h4>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl text-left">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Rendimiento por Miembro y Valorización</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs uppercase text-slate-600 font-semibold tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-8 py-5">Miembro</th>
                      <th className="px-8 py-5 text-center">Completadas</th>
                      <th className="px-8 py-5 text-center">Pendientes</th>
                      <th className="px-8 py-5 text-center">Bonos</th>
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
                              <span className="font-semibold text-white uppercase tracking-tight block">{m.name}</span>
                              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{m.role}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-normal text-orange-400">{m.completed}</td>
                          <td className="px-8 py-6 text-center font-normal text-rose-400">{m.pending}</td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex gap-3 items-center justify-center">
                              {m.bonuses?.ninja ? (
                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-semibold rounded-xl uppercase tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">military_tech</span> Ninja
                                </span>
                              ) : null}
                              {m.bonuses?.master ? (
                                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-semibold rounded-xl uppercase tracking-wider flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">verified</span> Master
                                </span>
                              ) : null}
                              {!m.bonuses?.ninja && !m.bonuses?.master && (
                                <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-primary text-lg">
                            ${m.totalPay.toLocaleString('es-ES')}
                          </td>
                        </tr>
                        {expandedMemberId === m.id && (
                          <tr className="bg-black/40 animate-in fade-in slide-in-from-top-2 duration-300">
                            <td colSpan={5} className="px-8 py-8">
                              <div className="space-y-8">
                                <div>
                                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Rendimiento por Canal</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {m.brands.length > 0 ? m.brands.map((b, bi) => (
                                      <div key={bi} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                        <img src={b.logo} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[9px] font-semibold text-white uppercase tracking-widest truncate mb-1">{b.name}</p>
                                          <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5">
                                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                              <span className="text-[10px] font-semibold text-orange-400">{b.completed}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                              <span className="text-[10px] font-semibold text-rose-400">{b.pending}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="col-span-full py-4 text-center">
                                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Sin actividad registrada en este periodo</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="border-t border-white/5 pt-8">
                                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Configuración de Nómina y Pago</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-end">
                                    <div className="space-y-2 text-left">
                                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Sueldo Base ($)</label>
                                      <div className="relative w-full">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-xs">$</span>
                                        <input 
                                          type="number" 
                                          className="w-full bg-black/40 border border-white/5 text-white text-sm font-semibold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-primary/40" 
                                          value={baseSalaries[m.id] || 0} 
                                          onChange={e => updateBaseSalary(m.id, parseFloat(e.target.value) || 0)} 
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2 text-left">
                                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Valor por Tarea ($)</label>
                                      <div className="relative w-full">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-xs">$</span>
                                        <input 
                                          type="number" 
                                          className="w-full bg-black/40 border border-white/5 text-white text-sm font-semibold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-primary/40" 
                                          value={m.rate} 
                                          onChange={e => updateTaskRate(m.id, parseFloat(e.target.value) || 0)} 
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-2 text-left">
                                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Día Pago</label>
                                      <input 
                                        type="number" min="1" max="31" 
                                        className="w-full bg-black/40 border border-white/5 text-white text-sm font-semibold rounded-xl px-3 py-2 outline-none focus:border-primary/40 text-center"
                                        value={financeSettings.payrollDays?.[m.id] || 20}
                                        onChange={e => {
                                          const payrollDays = { ...(financeSettings.payrollDays || {}), [m.id]: parseInt(e.target.value) || 20 };
                                          updateFinanceSettings({ payrollDays });
                                        }}
                                      />
                                    </div>

                                    <div className="space-y-2 text-left">
                                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Ligar Fondeo</label>
                                      <select 
                                        className="w-full bg-black/40 border border-white/5 text-white text-xs font-semibold rounded-xl px-4 py-2 outline-none focus:border-primary/40"
                                        value={financeSettings.payrollLinks?.[m.id] || ''}
                                        onChange={e => {
                                          const payrollLinks = { ...(financeSettings.payrollLinks || {}), [m.id]: e.target.value };
                                          updateFinanceSettings({ payrollLinks });
                                        }}
                                      >
                                        <option value="" className="bg-slate-900">Seleccionar...</option>
                                        {incomes.map(inc => (
                                          <option key={inc.id} value={inc.id} className="bg-slate-900">{inc.source}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="pt-2 sm:pt-0">
                                      <button 
                                        disabled={isProcessingPayment === m.id} 
                                        onClick={() => handleProcessPayment(m.userObj)} 
                                        className={`w-full py-2.5 bg-orange-500 text-white text-[10px] font-semibold uppercase rounded-xl shadow-xl active:scale-95 transition-all ${isProcessingPayment === m.id ? 'opacity-50' : 'hover:brightness-110'}`}
                                      >
                                        {isProcessingPayment === m.id ? 'Sincronizando...' : 'EJECUTAR PAGO'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
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



          <div className="space-y-6">
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className="w-full flex items-center justify-between glass-panel px-8 py-5 rounded-[2rem] border border-white/5 hover:bg-white/[0.02] transition-all shadow-xl text-left"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Historial de Operaciones Financieras</h3>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                    {filteredReceipts.length} registros en {currentMonthName} {selectedPeriod.year}
                  </p>
                </div>
              </div>
              <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}>
                keyboard_arrow_down
              </span>
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {filteredReceipts.length > 0 ? filteredReceipts.map(r => {
                  const isDeleting = deletingReceiptId === r.id;
                  return (
                    <div key={r.id} className={`glass-panel px-8 py-5 rounded-[2rem] border flex items-center justify-between transition-all duration-300 shadow-xl ${isDeleting ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 hover:bg-white/[0.02]'}`}>
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <span className="px-3 py-1 bg-black/40 rounded-xl text-[9px] font-mono text-primary border border-white/5 shrink-0 shadow-inner">{r.receiptNumber}</span>
                        <div>
                          <span className="text-sm font-semibold text-white uppercase tracking-tight block">{r.userName}</span>
                          <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest">{r.month} {r.year} • Ciclo Operativo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-orange-500 tracking-tighter block">${Number(r.total).toFixed(0)}</span>
                          <span className="text-[8px] font-semibold text-slate-700 uppercase tracking-widest">Liquidez Enviada</span>
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
                }) : (
                  <div className="py-8 text-center border border-dashed border-white/5 rounded-[2rem] bg-black/10">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">No hay pagos registrados para este periodo</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}


          {activeView === 'users' && (
            <div className="space-y-10 sm:space-y-12">
              <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] space-y-8 border border-white/5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Protocolo de Alta de Usuarios</h3>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Registra nuevos miembros o perfiles de clientes</p>
                  </div>
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setUserType('socio');
                        setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Colaborador', birthDate: '' });
                      }}
                      className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                        userType === 'socio' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      Socio / Colaborador
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserType('cliente');
                        setNewSocio({ firstName: '', lastName: '', email: '', password: '', role: 'Cliente', birthDate: '' });
                        setSelectedBrandCode('');
                      }}
                      className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                        userType === 'cliente' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      Perfil de Cliente
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateSocio} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {userType === 'socio' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Nombre</label>
                        <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold uppercase" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Apellido</label>
                        <input className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold uppercase" value={newSocio.lastName} onChange={e => setNewSocio({...newSocio, lastName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Email Corporativo</label>
                        <input required type="email" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Rol en el Workspace</label>
                        <input className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold uppercase" value={newSocio.role} onChange={e => setNewSocio({...newSocio, role: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Clave de Acceso</label>
                        <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Fecha Nacimiento</label>
                        <input type="date" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none" value={newSocio.birthDate} onChange={e => setNewSocio({...newSocio, birthDate: e.target.value})} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Nombre de la Marca</label>
                        <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold uppercase" value={newSocio.firstName} onChange={e => setNewSocio({...newSocio, firstName: e.target.value})} placeholder="EJ: COCA COLA" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Email del Cliente</label>
                        <input required type="email" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold" value={newSocio.email} onChange={e => setNewSocio({...newSocio, email: e.target.value})} placeholder="cliente@marca.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Clave de Acceso</label>
                        <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold" value={newSocio.password} onChange={e => setNewSocio({...newSocio, password: e.target.value})} placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Vincular Proyecto Existente</label>
                        <select
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold"
                          value={selectedBrandCode}
                          onChange={e => setSelectedBrandCode(e.target.value)}
                        >
                          <option value="">-- SELECCIONAR MARCA --</option>
                          {projects.map(p => {
                            const code = (p.brandCode || p.typography?.brandCode || '').toUpperCase();
                            return (
                              <option key={p.id} value={code}>
                                {p.name} ({code || 'SIN CÓDIGO'})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1">Código de Marca (Link)</label>
                        <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white outline-none font-semibold uppercase font-mono" value={selectedBrandCode} onChange={e => setSelectedBrandCode(e.target.value)} placeholder="EJ: COCA" />
                      </div>
                    </>
                  )}
                  <button type="submit" disabled={isRegistering} className={`lg:col-span-3 mt-4 btn-premium text-white font-semibold text-xs uppercase rounded-[2rem] h-16 shadow-2xl active:scale-95 transition-all ${userType === 'cliente' ? 'border-t border-cyan-500/20 shadow-cyan-500/5' : ''}`}>
                    {isRegistering 
                      ? 'Procesando Protocolo...' 
                      : userType === 'socio' 
                        ? 'Sincronizar Nuevo Socio al Sistema' 
                        : 'Crear Perfil de Cliente e Iniciar Protocolo'
                    }
                  </button>
                </form>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setViewUserType('socio')} 
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewUserType === 'socio' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Socios y Colaboradores
                  </button>
                  <button 
                    type="button"
                    onClick={() => setViewUserType('cliente')} 
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewUserType === 'cliente' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/10' : 'text-slate-500 hover:text-white'}`}
                  >
                    Perfiles de Clientes
                  </button>
                </div>
              </div>

              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                  <table className="w-full text-left">
                     <thead className="bg-white/5 text-[9px] uppercase text-slate-600 font-semibold tracking-widest border-b border-white/5">
                       <tr><th className="px-8 py-5">{viewUserType === 'cliente' ? 'Identidad del Cliente' : 'Identidad del Socio'}</th><th className="px-8 py-5">Gestión de Claves</th><th className="px-8 py-5 text-right">Administración</th></tr>
                     </thead>
                     <tbody className="divide-y divide-white/5 text-sm">
                       {usersDB.filter(u => {
                         const isClient = u.role?.toLowerCase().startsWith('cliente');
                         return viewUserType === 'cliente' ? isClient : !isClient;
                       }).map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] group transition-colors">
                          <td className="px-8 py-6 flex items-center gap-5">
                            <img src={getUserAvatar(u)} className="w-12 h-12 rounded-2xl object-cover shadow-xl border border-white/10" />
                            <div>
                               <div className="flex items-center gap-3">
                                 <span className="font-semibold text-white uppercase tracking-tight block">{u.firstName} {u.lastName}</span>
                                 <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                   u.role?.toLowerCase().startsWith('cliente') 
                                     ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5' 
                                     : 'bg-primary/10 text-primary border-primary/20'
                                 }`}>
                                   {u.role}
                                 </span>
                               </div>
                               <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">{u.email}</span>
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

              {/* Matriz de Honorarios por Marca */}
              <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Matriz de Honorarios por Marca</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[9px] uppercase text-slate-600 font-semibold tracking-widest">
                    <tr><th className="px-8 py-5">Identificador de Marca</th><th className="px-8 py-5">Fee Mensual Contratado ($)</th><th className="px-8 py-5 text-right">Gestión</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {projects.filter(p => p.status !== 'Inactivo').map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] group transition-colors">
                        <td className="px-8 py-6 flex items-center gap-5">
                          <img src={p.logoUrl} className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-white/10" />
                          <div>
                            <span className="font-semibold text-white uppercase tracking-tight block">{p.name}</span>
                            <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">{p.niche}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-semibold text-xs">$</span>
                            <input type="number" className="w-full bg-black/40 border border-white/5 rounded-xl px-7 py-3 text-orange-500 font-bold text-lg outline-none focus:border-orange-500/20" value={p.monthlyFee || 0} onChange={e => updateProject(p.id, { monthlyFee: Number(e.target.value) })} />
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

          {activeView === 'settings' && (
            <div className="space-y-10 sm:space-y-12 pb-24">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest w-full mb-10 text-center">Identidad de Agencia</h3>
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
                    <p className="mt-8 text-[9px] font-semibold text-slate-600 uppercase tracking-widest text-center">Tamaño sugerido: 512x512px • PNG/SVG</p>
                    <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateStudioLogo(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest w-full mb-6 text-center">Banner Dashboard</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all mb-6" onClick={() => bannerInputRef.current?.click()}>
                      <img src={dashboardBanner} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">add_photo_alternate</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                        <input className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white font-semibold text-[10px] uppercase outline-none focus:border-primary/20" value={localBannerTitle} onChange={e => setLocalBannerTitle(e.target.value)} placeholder="Título del Banner" />
                        <input className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-slate-500 text-[9px] font-semibold uppercase outline-none focus:border-primary/20" value={localBannerSubtitle} onChange={e => setLocalBannerSubtitle(e.target.value)} placeholder="Subtítulo del Banner" />
                        <button onClick={handleSaveBannerTexts} disabled={isSavingBanner} className="w-full py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white font-semibold rounded-xl uppercase text-[8px] tracking-widest transition-all">
                          {isSavingBanner ? 'Sincronizando...' : 'Sincronizar Textos Banner'}
                        </button>
                    </div>
                    <input type="file" hidden ref={bannerInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateDashboardBanner(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center border border-white/5 shadow-2xl group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest w-full mb-10 text-center">Ambiente Visual Login</h3>
                    <div className="w-full aspect-video bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative cursor-pointer group-hover:border-primary/30 transition-all" onClick={() => bgInputRef.current?.click()}>
                      <img src={loginBackground} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">wallpaper</span>
                      </div>
                    </div>
                    <p className="mt-8 text-[9px] font-semibold text-slate-600 uppercase tracking-widest text-center">Fondo panorámico de alta fidelidad</p>
                    <input type="file" hidden ref={bgInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (ev) => updateLoginBackground(ev.target?.result as string); r.readAsDataURL(file); }}} />
                  </div>

                  <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] space-y-6 border border-white/5 shadow-2xl flex flex-col justify-center relative overflow-hidden lg:col-span-3">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Textos de Bienvenida</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-semibold text-slate-700 uppercase tracking-widest">Título Principal</label>
                        <input className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-base uppercase outline-none focus:border-primary/20 shadow-inner" value={localTitle} onChange={e => setLocalTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-semibold text-slate-700 uppercase tracking-widest">Subtítulo Descriptivo</label>
                        <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-500 text-xs font-semibold uppercase outline-none focus:border-primary/20 h-24 resize-none shadow-inner" value={localSubtitle} onChange={e => setLocalSubtitle(e.target.value)} />
                      </div>
                    </div>
                    <button onClick={handleSaveLoginTexts} disabled={isSavingLoginTexts} className="w-full py-4 mt-4 bg-primary text-white font-semibold rounded-2xl uppercase text-[10px] tracking-widest hover:brightness-110 shadow-2xl active:scale-95 transition-all">{isSavingLoginTexts ? 'Sincronizando...' : 'Sincronizar Textos Maestros'}</button>
                  </div>
               </div>
            </div>
          )}
          {activeView === 'meetings' && (
            <div className="space-y-6 animate-in fade-in duration-500">

              {/* Header */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-lg">
                    <span className="material-symbols-outlined text-2xl">video_call</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white capitalize tracking-tight">{meetMonthName} <span className="text-orange-400">{meetYear}</span></h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{meetings.filter(m => m.date.startsWith(`${meetYear}-${String(meetMonth+1).padStart(2,'0')}`)).length} reuniones este mes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setMeetCurrentDate(new Date(meetYear, meetMonth - 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button onClick={() => setMeetCurrentDate(new Date())} className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 hover:text-white">Hoy</button>
                    <button onClick={() => setMeetCurrentDate(new Date(meetYear, meetMonth + 1, 1))} className="p-2 text-slate-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                  <button onClick={() => { setMeetInitialDate(''); setShowMeetModal(true); }} className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black text-[10px] uppercase rounded-xl shadow-2xl transition-all active:scale-95">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nueva Reunión
                  </button>
                </div>
              </div>

              {/* Filtros de categoría */}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    activeCategory === null
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-black/20 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}>
                  <span className="material-symbols-outlined text-[11px]">filter_list_off</span>
                  Todos
                </button>
                {CATEGORIES.map(cat => {
                  const c = CATEGORY_COLORS[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(isActive ? null : cat)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isActive
                          ? `${c.bg} ${c.border} ${c.text} shadow-lg scale-105`
                          : 'bg-black/20 border-white/10 text-slate-500 hover:text-white hover:border-white/20 opacity-60 hover:opacity-100'
                      }`}>
                      <span className={`w-2 h-2 rounded-full transition-all ${isActive ? c.dot : 'bg-slate-600'}`} />
                      {cat}
                      {isActive && <span className="material-symbols-outlined text-[10px] ml-0.5">close</span>}
                    </button>
                  );
                })}
              </div>

              {/* Calendario */}
              <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-7 bg-black/40">
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                    <div key={d} className="p-3 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-white/5">
                  {Array.from({ length: meetFirstDay }).map((_, i) => (
                    <div key={i} className="bg-black/30 min-h-[130px]" />
                  ))}
                  {Array.from({ length: meetDaysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const m = String(meetMonth + 1).padStart(2, '0');
                    const d = String(day).padStart(2, '0');
                    const dateStr = `${meetYear}-${m}-${d}`;
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = day === meetToday.getDate() && meetMonth === meetToday.getMonth() && meetYear === meetToday.getFullYear();
                    return (
                      <div key={day} className="bg-black/20 min-h-[130px] p-2 border-r border-b border-white/5 hover:bg-orange-500/5 transition-colors group relative">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isToday ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-600'}`}>{day}</span>
                          {dayMeetings.length > 2 && <span className="text-[7px] font-black text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded">+{dayMeetings.length - 2}</span>}
                        </div>
                        <div className="space-y-1">
                          {dayMeetings.slice(0, 2).map(mt => {
                            const c = CATEGORY_COLORS[mt.category];
                            return (
                              <button key={mt.id} onClick={() => setSelectedMeeting(mt)}
                                className={`w-full text-left p-1.5 rounded-lg border text-[9px] font-bold truncate transition-all hover:brightness-125 ${c.bg} ${c.border} ${c.text} flex items-center gap-1.5`}>
                                {mt.hasMeet && <span className="material-symbols-outlined text-[10px] shrink-0">videocam</span>}
                                <span className="truncate">{mt.time} · {mt.title}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => { setMeetInitialDate(dateStr); setShowMeetModal(true); }}
                          className="absolute bottom-2 right-2 w-6 h-6 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white border border-orange-500/20">
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Próximas reuniones (lista) */}
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const filtered = meetings
                  .filter(m => m.date >= today && (activeCategory === null || m.category === activeCategory))
                  .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
                  .slice(0, 5);
                if (filtered.length === 0) return null;
                return (
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximas Reuniones</h4>
                      {activeCategory && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${CATEGORY_COLORS[activeCategory].bg} ${CATEGORY_COLORS[activeCategory].border} ${CATEGORY_COLORS[activeCategory].text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[activeCategory].dot}`} />
                          {activeCategory}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {filtered.map(mt => {
                        const c = CATEGORY_COLORS[mt.category];
                        const proj = projects.find(p => p.id === mt.projectId);
                        return (
                          <button key={mt.id} onClick={() => setSelectedMeeting(mt)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:brightness-110 text-left ${c.bg} ${c.border}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mt.hasMeet ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                              <span className="material-symbols-outlined text-lg">{mt.hasMeet ? 'videocam' : 'event'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-black text-sm truncate ${c.text}`}>{mt.title}</p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{mt.date} · {mt.time} · {DURATIONS.find(d => d.value === mt.duration)?.label}</p>
                            </div>
                            {proj && <div className="flex items-center gap-2 shrink-0">
                              {proj.logoUrl && <img src={proj.logoUrl} className="w-6 h-6 rounded-full object-cover border border-white/20" />}
                              <span className="text-[8px] text-slate-500 uppercase hidden sm:block">{proj.name}</span>
                            </div>}
                            <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* MODAL: Nueva Reunión */}
              {showMeetModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowMeetModal(false)}>
                  <div className="max-w-lg w-full glass-panel border border-white/10 rounded-[2rem] shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/30">
                        <span className="material-symbols-outlined">video_call</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Nueva <span className="text-orange-400">Reunión</span></h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Agendar videoconferencia</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveMeeting} className="space-y-5">
                      {/* Título */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre de la Reunión *</label>
                        <input required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500/40" placeholder="Ej: Kickoff con Cliente X" value={meetForm.title} onChange={e => setMeetForm(f => ({ ...f, title: e.target.value }))} />
                      </div>

                      {/* Categoría */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
                        <div className="grid grid-cols-1 gap-2">
                          {CATEGORIES.map(cat => {
                            const c = CATEGORY_COLORS[cat];
                            const active = meetForm.category === cat;
                            return (
                              <button key={cat} type="button" onClick={() => setMeetForm(f => ({ ...f, category: cat }))}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${active ? `${c.bg} ${c.border} ${c.text}` : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'}`}>
                                <span className={`w-3 h-3 rounded-full shrink-0 ${active ? c.dot : 'bg-slate-700'}`} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{cat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Proyecto */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Proyecto / Marca (opcional)</label>
                        <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500/40" value={meetForm.projectId} onChange={e => setMeetForm(f => ({ ...f, projectId: e.target.value }))}>
                          <option value="">Sin proyecto</option>
                          {projects.filter(p => p.status !== 'Inactivo').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      {/* Fecha + Hora */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha *</label>
                          <input required type="date" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500/40" value={meetForm.date} onChange={e => setMeetForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Hora *</label>
                          <input required type="time" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500/40" value={meetForm.time} onChange={e => setMeetForm(f => ({ ...f, time: e.target.value }))} />
                        </div>
                      </div>

                      {/* Duración */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Duración</label>
                        <div className="grid grid-cols-4 gap-2">
                          {DURATIONS.map(dur => (
                            <button key={dur.value} type="button" onClick={() => setMeetForm(f => ({ ...f, duration: dur.value }))}
                              className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${meetForm.duration === dur.value ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-black/30 border-white/10 text-slate-500 hover:text-white'}`}>
                              {dur.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notas */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Agenda / Notas</label>
                        <textarea rows={3} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500/40 resize-none" placeholder="Temas a tratar..." value={meetForm.notes} onChange={e => setMeetForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>

                      {/* Toggle Google Meet */}
                      <div
                        onClick={() => setMeetForm(f => ({ ...f, hasMeet: !f.hasMeet }))}
                        className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${
                          meetForm.hasMeet ? 'bg-orange-500/15 border-orange-500/40' : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            meetForm.hasMeet ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-500'
                          }`}>
                            <span className="material-symbols-outlined text-xl">videocam</span>
                          </div>
                          <div>
                            <p className={`text-sm font-black uppercase tracking-tight ${meetForm.hasMeet ? 'text-orange-300' : 'text-slate-400'}`}>Agregar Google Meet</p>
                            <p className="text-[9px] text-slate-600 uppercase tracking-widest">Genera link de videoconferencia</p>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all relative ${
                          meetForm.hasMeet ? 'bg-orange-500' : 'bg-white/10'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                            meetForm.hasMeet ? 'left-6' : 'left-0.5'
                          }`} />
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowMeetModal(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black text-[10px] uppercase rounded-2xl hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSavingMeeting} className="flex-1 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                          {isSavingMeeting ? 'Creando...' : meetForm.hasMeet ? 'Crear + Meet' : 'Agendar Reunión'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: Detalle de Reunión */}
              {selectedMeeting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in" onClick={() => setSelectedMeeting(null)}>
                  <div className="max-w-md w-full glass-panel border border-white/10 rounded-[2rem] shadow-2xl p-8 space-y-6" onClick={e => e.stopPropagation()}>
                    {(() => {
                      const c = CATEGORY_COLORS[selectedMeeting.category];
                      const proj = projects.find(p => p.id === selectedMeeting.projectId);
                      const dateObj = new Date(selectedMeeting.date + 'T12:00:00');
                      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                      const durLabel = DURATIONS.find(d => d.value === selectedMeeting.duration)?.label;
                      return (
                        <>
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${selectedMeeting.hasMeet ? 'bg-orange-500 text-white border-orange-400' : `${c.bg} ${c.text} ${c.border}`}`}>
                                <span className="material-symbols-outlined text-2xl">{selectedMeeting.hasMeet ? 'videocam' : 'event'}</span>
                              </div>
                              <div>
                                <h3 className={`text-lg font-black uppercase tracking-tight ${c.text}`}>{selectedMeeting.title}</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{selectedMeeting.category}</p>
                              </div>
                            </div>
                            <button onClick={() => setSelectedMeeting(null)} className="w-8 h-8 bg-white/5 rounded-xl text-slate-500 hover:text-white flex items-center justify-center border border-white/5 transition-colors">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>

                          {/* Info */}
                          <div className="space-y-3">
                            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
                              <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
                              <div>
                                <p className={`text-sm font-black ${c.text} capitalize`}>{dayName}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">{selectedMeeting.time} · {durLabel}</p>
                              </div>
                            </div>
                            {proj && (
                              <div className="flex items-center gap-3 p-4 rounded-2xl border bg-white/5 border-white/5">
                                {proj.logoUrl && <img src={proj.logoUrl} className="w-8 h-8 rounded-xl object-cover border border-white/20" />}
                                <div>
                                  <p className="text-sm font-black text-white">{proj.name}</p>
                                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Proyecto relacionado</p>
                                </div>
                              </div>
                            )}
                            {selectedMeeting.notes && (
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Agenda</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{selectedMeeting.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Meet Actions */}
                          {selectedMeeting.hasMeet && selectedMeeting.meetLink && (
                            <div className="space-y-3">
                              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                                <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mb-2">Link de Videoconferencia</p>
                                <p className="text-xs text-orange-300 font-mono break-all">{selectedMeeting.meetLink}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <a href={selectedMeeting.meetLink} target="_blank" rel="noreferrer"
                                  className="flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black text-[10px] uppercase rounded-2xl shadow-2xl transition-all active:scale-95">
                                  <span className="material-symbols-outlined text-lg">videocam</span>
                                  Entrar
                                </a>
                                <button onClick={() => handleCopyInvite(selectedMeeting)}
                                  className={`flex items-center justify-center gap-2 py-4 font-black text-[10px] uppercase rounded-2xl border transition-all active:scale-95 ${
                                    copiedMeet ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                  }`}>
                                  <span className="material-symbols-outlined text-lg">{copiedMeet ? 'check' : 'content_copy'}</span>
                                  {copiedMeet ? 'Copiado!' : 'Copiar'}
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Eliminar */}
                          <button onClick={() => handleDeleteMeeting(selectedMeeting)} disabled={isDeletingMeeting}
                            className="w-full py-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-black text-[10px] uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-50">
                            {isDeletingMeeting ? 'Eliminando...' : 'Eliminar Reunión'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =========================================================
              AGENDA PERSONAL — Mi Diario de Quehaceres
          ========================================================= */}
          {activeView === 'agenda' && (() => {
            // ─── Helpers de fecha ──────────────────────────────────────
            // ⚠️ IMPORTANTE: usar métodos locales para evitar bug de timezone UTC vs local
            const fmtDate = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const todayStr = fmtDate(new Date());
            const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

            // ─── Semana: lunes de la semana actual ──────────────────
            const weekStart = (() => {
              const d = new Date(agendaCurrentDate);
              const day = d.getDay();
              const diff = day === 0 ? -6 : 1 - day;
              d.setDate(d.getDate() + diff);
              return d;
            })();
            const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

            // ─── Datos del día actual en vista ─────────────────────────
            const currentDateStr = fmtDate(agendaCurrentDate);
            const tasksForDay = (dateStr: string) =>
              personalTasks.filter(t => t.date === dateStr).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            // ─── Mes ─────────────────────────────────────────────────────
            const mesYear = agendaCurrentDate.getFullYear();
            const mesMonth = agendaCurrentDate.getMonth();
            const mesFirstDay = new Date(mesYear, mesMonth, 1).getDay();
            const mesDaysInMonth = new Date(mesYear, mesMonth + 1, 0).getDate();
            const mesOffset = mesFirstDay === 0 ? 6 : mesFirstDay - 1; // Lunes=0

            const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

            // ─── Abrir modal crear ──────────────────────────────────────
            const openCreate = (dateStr?: string) => {
              setEditingTask(null);
              setAgendaForm({ title: '', description: '', date: dateStr || currentDateStr });
              if (dateStr) (window as any)._agendaDateOverride = dateStr;
              setShowAgendaModal(true);
            };

            // ─── Abrir modal editar ─────────────────────────────────────
            const openEdit = (task: any) => {
              setEditingTask(task.id);
              setAgendaForm({ title: task.title, description: task.description || '', date: task.date });
              setShowAgendaModal(true);
            };

            // ─── Guardar (crear o editar) ───────────────────────────────
            const handleSaveAgenda = async () => {
              if (!agendaForm.title.trim()) { showToast('El título es obligatorio', 'error'); return; }
              if (editingTask) {
                const original = personalTasks.find(t => t.id === editingTask);
                const dateChanged = original && original.date !== agendaForm.date;
                await updatePersonalTask(editingTask, {
                  title: agendaForm.title,
                  description: agendaForm.description,
                  date: agendaForm.date,
                  ...(dateChanged ? { order: tasksForDay(agendaForm.date).length } : {})
                });
              } else {
                const dateOverride = (window as any)._agendaDateOverride || currentDateStr;
                delete (window as any)._agendaDateOverride;
                await addPersonalTask({
                  title: agendaForm.title,
                  description: agendaForm.description,
                  date: dateOverride,
                  completed: false,
                  order: tasksForDay(dateOverride).length,
                });
              }
              setShowAgendaModal(false);
            };

            // ─── Drag & Drop handlers ───────────────────────────────────
            const handleDragStart = (e: React.DragEvent, id: string) => {
              setDraggedTaskId(id);
              e.dataTransfer.effectAllowed = 'move';
            };
            const handleDragOver = (e: React.DragEvent, id: string) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (id !== draggedTaskId) setDragOverTaskId(id);
            };
            const handleDragLeave = () => setDragOverTaskId(null);
            const handleDrop = (targetId: string, dayTasks: any[]) => {
              if (!draggedTaskId || draggedTaskId === targetId) {
                setDraggedTaskId(null); setDragOverTaskId(null); return;
              }
              const arr = [...dayTasks];
              const fromIdx = arr.findIndex(t => t.id === draggedTaskId);
              const toIdx = arr.findIndex(t => t.id === targetId);
              if (fromIdx === -1 || toIdx === -1) { setDraggedTaskId(null); setDragOverTaskId(null); return; }
              const [moved] = arr.splice(fromIdx, 1);
              arr.splice(toIdx, 0, moved);
              reorderPersonalTasks(arr.map(t => t.id));
              setDraggedTaskId(null);
              setDragOverTaskId(null);
            };
            const handleDragEnd = () => { setDraggedTaskId(null); setDragOverTaskId(null); };

            // ─── Dot indicador para vista mes ───────────────────────────
            const dayDot = (dateStr: string) => {
              const t = tasksForDay(dateStr);
              if (t.length === 0) return null;
              const allDone = t.every(x => x.completed);
              const noneDone = t.every(x => !x.completed);
              const color = allDone ? 'bg-violet-400' : noneDone ? 'bg-rose-400' : 'bg-amber-400';
              return <div className={`w-1.5 h-1.5 rounded-full ${color} mx-auto mt-1`} />;
            };

            // ─── Task Card con número y drag ────────────────────────────
            const TaskCard = ({ task, index, dayTasks }: { task: any; index: number; dayTasks: any[] }) => (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(task.id, dayTasks)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all select-none
                  ${dragOverTaskId === task.id && draggedTaskId !== task.id
                    ? 'border-violet-500 bg-violet-500/10 scale-[1.01] shadow-lg shadow-violet-500/10'
                    : draggedTaskId === task.id
                      ? 'opacity-30 scale-[0.98] border-white/5'
                      : task.completed
                        ? 'bg-white/[0.02] border-white/5 opacity-55'
                        : 'bg-black/30 border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
              >
                {/* Número */}
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border transition-colors
                  ${task.completed ? 'bg-violet-500/20 border-violet-500/30 text-violet-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  {index + 1}
                </div>

                {/* Drag handle */}
                <span className="material-symbols-outlined text-slate-700 group-hover:text-slate-400 transition-colors text-lg shrink-0 cursor-grab active:cursor-grabbing">
                  drag_indicator
                </span>

                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePersonalTask(task.id); }}
                  className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                    ${task.completed ? 'bg-violet-500 border-violet-500' : 'border-white/20 hover:border-violet-500'}`}
                >
                  {task.completed && <span className="material-symbols-outlined text-white text-xs icon-fill">check</span>}
                </button>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  {task.completed && task.completedAt && (
                    <p className="text-[9px] text-violet-600 font-semibold uppercase tracking-widest mt-0.5">
                      ✓ {new Date(task.completedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(task); }}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deletingAgendaId === task.id) {
                        deletePersonalTask(task.id);
                        setDeletingAgendaId(null);
                      } else {
                        setDeletingAgendaId(task.id);
                        setTimeout(() => setDeletingAgendaId(null), 3000);
                      }
                    }}
                    className={`p-1.5 rounded-xl transition-all ${deletingAgendaId === task.id ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {deletingAgendaId === task.id ? 'delete_forever' : 'delete'}
                    </span>
                  </button>
                </div>
              </div>
            );

            return (
              <div className="space-y-6 animate-in fade-in duration-500">

                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
                      <span className="material-symbols-outlined text-violet-400 text-2xl">edit_note</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight">Mi Agenda Personal</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Solo visible para ti · Director General</p>
                    </div>
                  </div>
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5">
                    {([['dia', 'today', 'Día'], ['semana', 'view_week', 'Semana'], ['mes', 'calendar_month', 'Mes']] as const).map(([v, icon, label]) => (
                      <button key={v} onClick={() => setAgendaSubView(v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                          ${agendaSubView === v ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        <span className="material-symbols-outlined text-base">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── PROGRESO DEL DÍA ────────────────────────────────── */}
                {(() => {
                  const todayTasks = tasksForDay(todayStr);
                  const done = todayTasks.filter(t => t.completed).length;
                  const total = todayTasks.length;
                  if (total === 0) return null;
                  const pct = Math.round((done / total) * 100);
                  return (
                    <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 flex items-center gap-5">
                      <div className="relative w-14 h-14 shrink-0">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                          <circle cx="28" cy="28" r="22" fill="none" stroke="#8c2bee" strokeWidth="5"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-violet-400">{pct}%</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">{done} de {total} completadas hoy</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                          {pct === 100 ? '🎉 ¡Día completado!' : `${total - done} pendiente${total - done !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* ══════════ VISTA DÍA ══════════════════════════════════ */}
                {agendaSubView === 'dia' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl border border-white/5">
                      <button onClick={() => setAgendaCurrentDate(d => addDays(d, -1))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg capitalize">
                          {agendaCurrentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{agendaCurrentDate.getFullYear()}</p>
                      </div>
                      <button onClick={() => setAgendaCurrentDate(d => addDays(d, 1))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>

                    {currentDateStr !== todayStr && (
                      <button onClick={() => setAgendaCurrentDate(new Date())}
                        className="text-[10px] text-violet-400 font-black uppercase tracking-widest hover:text-violet-300 transition-colors">
                        ← Volver a hoy
                      </button>
                    )}

                    {tasksForDay(currentDateStr).length > 1 && (
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold text-center flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">drag_indicator</span>
                        Arrastra para reordenar
                      </p>
                    )}

                    <div className="space-y-2">
                      {tasksForDay(currentDateStr).length === 0 ? (
                        <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
                          <span className="material-symbols-outlined text-4xl text-slate-600">inbox</span>
                          <p className="text-slate-500 mt-3 text-sm">Sin tareas para este día</p>
                          <p className="text-slate-600 text-xs mt-1">Agrega tus quehaceres del día</p>
                        </div>
                      ) : (() => {
                        const dayTasks = tasksForDay(currentDateStr);
                        return dayTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} dayTasks={dayTasks} />);
                      })()}
                    </div>

                    <button onClick={() => openCreate(currentDateStr)}
                      className="w-full py-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 text-slate-500 hover:text-violet-400 hover:border-violet-500/40 transition-all text-sm font-semibold">
                      <span className="material-symbols-outlined">add_circle</span>
                      Agregar tarea para este día
                    </button>
                  </div>
                )}
                {/* ══════════ VISTA SEMANA ═══════════════════════════════ */}
                {agendaSubView === 'semana' && (
                  <div className="space-y-4">
                    {/* Navegador semana */}
                    <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl border border-white/5">
                      <button onClick={() => setAgendaCurrentDate(d => addDays(d, -7))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <div className="text-center">
                        <p className="text-white font-bold capitalize">
                          {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} —{' '}
                          {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Semana</p>
                      </div>
                      <button onClick={() => setAgendaCurrentDate(d => addDays(d, 7))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>

                    {/* Grid visual de 7 días */}
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((wd, i) => {
                        const ds = fmtDate(wd);
                        const wTasks = tasksForDay(ds);
                        const isToday = ds === todayStr;
                        const done = wTasks.filter(t => t.completed).length;
                        return (
                          <div key={ds} onClick={() => { setAgendaCurrentDate(wd); setAgendaSubView('dia'); }}
                            className={`cursor-pointer p-3 rounded-2xl border text-center transition-all hover:border-violet-500/30 hover:bg-violet-500/5
                              ${isToday ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/5 glass-panel'}`}>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{dayLabels[i]}</p>
                            <p className={`text-xl font-black mt-1 ${isToday ? 'text-violet-400' : 'text-white'}`}>{wd.getDate()}</p>
                            {wTasks.length > 0 ? (
                              <>
                                <div className="mt-2 space-y-1">
                                  {wTasks.slice(0, 3).map((t, ti) => (
                                    <div key={t.id} className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold truncate
                                      ${t.completed ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-slate-300'}`}>
                                      {ti + 1}. {t.title}
                                    </div>
                                  ))}
                                  {wTasks.length > 3 && <p className="text-[8px] text-slate-600">+{wTasks.length - 3} más</p>}
                                </div>
                                <p className="text-[9px] text-slate-500 mt-2">{done}/{wTasks.length} ✓</p>
                              </>
                            ) : (
                              <p className="text-[9px] text-slate-700 mt-3">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Lista detallada por día */}
                    <div className="space-y-6 mt-2">
                      {weekDays.map((wd, i) => {
                        const ds = fmtDate(wd);
                        const wTasks = tasksForDay(ds);
                        const isToday = ds === todayStr;
                        if (wTasks.length === 0) return null;
                        return (
                          <div key={ds}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm
                                  ${isToday ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400'}`}>{wd.getDate()}</div>
                              <span className={`text-xs font-black uppercase tracking-widest
                                ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                                {dayLabels[i]}{isToday ? ' · Hoy' : ''}
                              </span>
                            </div>
                            <div className="space-y-2 pl-2">
                              {wTasks.map((task, idx) => <TaskCard key={task.id} task={task} index={idx} dayTasks={wTasks} />)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button onClick={() => openCreate(todayStr)}
                      className="w-full py-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 text-slate-500 hover:text-violet-400 hover:border-violet-500/40 transition-all text-sm font-semibold">
                      <span className="material-symbols-outlined">add_circle</span>
                      Agregar tarea para hoy
                    </button>
                  </div>
                )}

                {/* ══════════ VISTA MES ══════════════════════════════════ */}

                {agendaSubView === 'mes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl border border-white/5">
                      <button onClick={() => setAgendaCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg capitalize">{monthNames[mesMonth]}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{mesYear}</p>
                      </div>
                      <button onClick={() => setAgendaCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {dayLabels.map(dl => (
                        <p key={dl} className="text-[9px] font-black uppercase tracking-widest text-slate-600 py-2">{dl}</p>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: mesOffset }).map((_, i) => <div key={`e-${i}`} />)}
                      {Array.from({ length: mesDaysInMonth }, (_, i) => {
                        const day = i + 1;
                        const ds = `${mesYear}-${String(mesMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const mTasks = tasksForDay(ds);
                        const isToday = ds === todayStr;
                        return (
                          <div key={day}
                            onClick={() => { setAgendaCurrentDate(new Date(mesYear, mesMonth, day)); setAgendaSubView('dia'); }}
                            className={`cursor-pointer p-2 rounded-xl text-center min-h-[56px] transition-all hover:bg-violet-500/10
                              ${isToday ? 'border border-violet-500/40 bg-violet-500/10' : 'border border-white/5 hover:border-violet-500/30'}`}>
                            <p className={`text-sm font-bold ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>{day}</p>
                            {dayDot(ds)}
                            {mTasks.length > 0 && (
                              <p className="text-[8px] text-slate-600 font-semibold mt-0.5">{mTasks.length}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-6 justify-center pt-2">
                      {[['bg-violet-400', 'Todas hechas'], ['bg-amber-400', 'En progreso'], ['bg-rose-400', 'Pendientes']].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                          <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-widest">{l}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => openCreate(todayStr)}
                      className="w-full py-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 text-slate-500 hover:text-violet-400 hover:border-violet-500/40 transition-all text-sm font-semibold">
                      <span className="material-symbols-outlined">add_circle</span>
                      Agregar tarea para hoy
                    </button>
                  </div>
                )}

                {/* ══════════ MODAL CREAR / EDITAR ═══════════════════════ */}
                {showAgendaModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    onClick={() => setShowAgendaModal(false)}>
                    <div className="bg-[#0d0d14] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6"
                      onClick={e => e.stopPropagation()}>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-500/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
                          <span className="material-symbols-outlined text-violet-400">{editingTask ? 'edit' : 'add_task'}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Mi Agenda Personal</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Tarea *</label>
                        <input
                          autoFocus
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-600 font-semibold"
                          placeholder="¿Qué vas a hacer?"
                          value={agendaForm.title}
                          onChange={e => setAgendaForm(f => ({ ...f, title: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveAgenda(); }}
                        />
                      </div>

                      {/* Cambiar fecha — solo al editar */}
                      {editingTask && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-violet-500">calendar_today</span>
                            Mover a otra fecha
                          </label>
                          <input
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-violet-500/40 transition-all font-semibold cursor-pointer"
                            value={agendaForm.date}
                            onChange={e => setAgendaForm(f => ({ ...f, date: e.target.value }))}
                          />
                          {agendaForm.date !== personalTasks.find(t => t.id === editingTask)?.date && (
                            <p className="text-[9px] text-amber-400 font-semibold uppercase tracking-widest mt-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">move_down</span>
                              Tarea se moverá a {new Date(agendaForm.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Nota (opcional)</label>
                        <textarea
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-violet-500/40 transition-all placeholder:text-slate-600 font-semibold resize-none"
                          placeholder="Detalles adicionales..."
                          value={agendaForm.description}
                          onChange={e => setAgendaForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowAgendaModal(false)}
                          className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-white hover:border-white/20 transition-all">
                          Cancelar
                        </button>
                        <button onClick={handleSaveAgenda}
                          className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
                          {editingTask ? 'Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
