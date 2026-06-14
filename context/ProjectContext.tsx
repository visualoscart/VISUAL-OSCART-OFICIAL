
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Project, TextAsset, MediaAsset, Task, UserProfile, Receipt, ChatMessage, Expense, ExpenseTracking, Campaign, PerformanceReport, CustomerReceipt, CustomerQuote, ServiceCatalogItem, Income, Meeting, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

interface FinanceSettings {
  estTaxes: number;
  taxLinks?: Record<string, string>; // "MM-YYYY" -> incomeId
  payrollLinks?: Record<string, string>; // userId -> incomeId
  payrollDays?: Record<string, number>; // userId -> day (1-31)
  receiptLinks?: Record<string, string>; // receiptId -> incomeId
}

interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  currentUser: UserProfile | null;
  usersDB: UserProfile[];
  receipts: Receipt[];
  expenses: Expense[];
  expenseTracking: ExpenseTracking[];
  campaigns: Campaign[];
  performances: PerformanceReport[];
  customerReceipts: CustomerReceipt[];
  customerQuotes: CustomerQuote[];
  addCustomerQuote: (quote: Omit<CustomerQuote, 'id' | 'createdAt'>) => Promise<void>;
  deleteCustomerQuote: (id: string) => Promise<void>;
  servicesCatalog: ServiceCatalogItem[];
  notifications: Notification[];
  incomes: Income[];
  baseSalaries: Record<string, number>; 
  taskRates: Record<string, number>;
  financeSettings: FinanceSettings;
  studioLogo: string;
  dashboardBanner: string;
  dashboardBannerTitle: string;
  dashboardBannerSubtitle: string;
  loginBackground: string;
  loginTitle: string;
  loginSubtitle: string;
  isSyncing: boolean;
  toast: { message: string; type: 'success' | 'error' | '' };
  showToast: (msg: string, type?: 'success' | 'error') => void;
  login: (email: string, pass: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  register: (data: any) => Promise<{ success: boolean, message: string }>;
  updateUser: (userId: string, data: Partial<UserProfile>) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updateStudioLogo: (logoBase64: string) => Promise<void>;
  updateDashboardBanner: (bannerBase64: string) => Promise<void>;
  updateDashboardBannerTexts: (title: string, subtitle: string) => Promise<void>;
  updateLoginBackground: (bgBase64: string) => Promise<void>;
  updateLoginTexts: (title: string, subtitle: string) => Promise<void>;
  addProject: (project: any) => Promise<{success: boolean, id?: string}>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateBaseSalary: (userId: string, amount: number) => Promise<void>;
  updateTaskRate: (userId: string, amount: number) => Promise<void>;
  updateFinanceSettings: (settings: Partial<FinanceSettings>) => Promise<void>;
  addIncome: (source: string, amount: number, day: number, description?: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  updateIncome: (id: string, data: Partial<Income>) => Promise<void>;
  addExpense: (name: string, amount: number, day: string, incomeId?: string, isOneTime?: boolean, vMonth?: number, vYear?: number) => Promise<void>;
  toggleExpensePayment: (expenseId: string, month: number, year: number, incomeId?: string) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>, vMonth?: number, vYear?: number) => Promise<void>;
  deleteExpense: (id: string, vMonth?: number, vYear?: number) => Promise<void>;
  addTextAsset: (projectId: string, item: Omit<TextAsset, 'id'>) => Promise<void>;
  deleteTextAsset: (projectId: string, assetId: string) => Promise<void>;
  addMediaAsset: (projectId: string, item: Omit<MediaAsset, 'id'>) => Promise<void>;
  deleteMediaAsset: (projectId: string, assetId: string) => Promise<void>;
  addTask: (task: any) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  sendReceiptToUser: (receipt: Receipt) => Promise<Receipt | null>;
  deleteReceipt: (receiptId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  createNotification: (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning') => Promise<void>;
  markAllChatNotificationsAsRead: () => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (campaignId: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  addPerformance: (data: Omit<PerformanceReport, 'id' | 'createdAt'>) => Promise<void>;
  updatePerformance: (performanceId: string, data: Partial<PerformanceReport>) => Promise<void>;
  deletePerformance: (performanceId: string) => Promise<void>;
  addCustomerReceipt: (data: Omit<CustomerReceipt, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomerReceipt: (id: string, data: Partial<CustomerReceipt>) => Promise<void>;
  deleteCustomerReceipt: (id: string) => Promise<void>;
  addServiceCatalogItem: (data: Omit<ServiceCatalogItem, 'id'>) => Promise<void>;
  updateServiceCatalogItem: (id: string, data: Partial<ServiceCatalogItem>) => Promise<void>;
  deleteServiceCatalogItem: (id: string) => Promise<void>;
  meetings: Meeting[];
  addMeeting: (data: Omit<Meeting, 'id' | 'createdAt'>) => Promise<Meeting | null>;
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  personalTasks: PersonalTask[];
  addPersonalTask: (data: Omit<PersonalTask, 'id' | 'createdAt'>) => Promise<void>;
  updatePersonalTask: (id: string, data: Partial<PersonalTask>) => Promise<void>;
  togglePersonalTask: (id: string) => Promise<void>;
  deletePersonalTask: (id: string) => Promise<void>;
  reorderPersonalTasks: (orderedIds: string[]) => Promise<void>;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  logAiUsage: (userId: string, type: string) => void;
  celebrationQuote: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const SESSION_KEY = 'VO_SESSION_ULTIMATE_FINAL_V1';
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersDB, setUsersDB] = useState<UserProfile[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTracking, setExpenseTracking] = useState<ExpenseTracking[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [performances, setPerformances] = useState<PerformanceReport[]>([]);
  const [customerReceipts, setCustomerReceipts] = useState<CustomerReceipt[]>([]);
  const [customerQuotes, setCustomerQuotes] = useState<CustomerQuote[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [baseSalaries, setBaseSalaries] = useState<Record<string, number>>({});
  const [taskRates, setTaskRates] = useState<Record<string, number>>({});
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>({ estTaxes: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [celebrationQuote, setCelebrationQuote] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [studioLogo, setStudioLogo] = useState('');
  const [dashboardBanner, setDashboardBanner] = useState('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200');
  const [dashboardBannerTitle, setDashboardBannerTitle] = useState('Intelligence Hub');
  const [dashboardBannerSubtitle, setDashboardBannerSubtitle] = useState('Sincronización global de activos y métricas de rendimiento');
  const [loginBackground, setLoginBackground] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1600');
  const [loginTitle, setLoginTitle] = useState('Marketing Flow Intelligence');
  const [loginSubtitle, setLoginSubtitle] = useState('Visual Oscart: Sistema de Gestión Maestra');

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  }, []);

  const createNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning') => {
    try {
      await supabase.from('notifications').insert([{
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (e) { console.error("Notif Error:", e); }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [uRes, pRes, tRes, rRes, sRes, nRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('receipts').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false })
      ]);

      if (uRes.data) {
        setUsersDB(uRes.data.map(u => ({
          id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email,
          password: u.password, role: u.role, avatar: u.avatar, banner: u.banner,
          birthDate: u.birth_date, joinedAt: u.joined_at
        })));
      }
      
      if (pRes.data) {
        const now = new Date();
        const validProjects: any[] = [];

        for (const p of pRes.data) {
          if (p.status === 'Inactivo' && p.typography?.inactiveAt) {
            const inactiveDate = new Date(p.typography.inactiveAt);
            const diffDays = Math.ceil(Math.abs(now.getTime() - inactiveDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 60) {
              // Fire and forget delete
              supabase.from('projects').delete().eq('id', p.id).then();
              continue;
            }
          }
          validProjects.push({ 
            id: p.id, name: p.name, niche: p.niche, client: p.client,
            date: p.date, status: p.status, progress: p.progress,
            logoUrl: p.logo_url, brandManualUrl: p.brand_manual_url,
            brandCode: p.typography?.brandCode,
            brief: p.brief, hell: p.hell, heaven: p.heaven,
            monthlyFee: Number(p.monthly_fee), textRepository: p.text_repository || [],
            mediaRepository: p.media_repository || [], brandColors: p.brand_colors || [],
            typography: p.typography || undefined,
            driveFolderId: p.typography?.driveFolderId,
            collaborators: p.collaborators || []
          });
        }
        setProjects(validProjects);
      }

      if (tRes.data) {
        setTasks(tRes.data.map(t => {
          let campaignId = undefined;
          let campaignThemeId = undefined;
          let cleanDescription = t.description || '';

          // Parse metadata tag [REF:campaignId:themeId]
          const refMatch = cleanDescription.match(/\[REF:(camp-[^:]+):(theme-[^\]]+)\]/);
          if (refMatch) {
            campaignId = refMatch[1];
            campaignThemeId = refMatch[2];
            // Remove the tag from the displayed description to keep it clean
            cleanDescription = cleanDescription.replace(/\n\n\[REF:.*\]/, '').trim();
          }

          return {
            id: t.id, projectId: t.project_id, collaboratorId: t.collaborator_id,
            title: t.title, description: cleanDescription, date: t.date,
            status: t.status, driveLink: t.drive_link, createdAt: t.created_at,
            completedAt: t.completed_at,
            campaignId,
            campaignThemeId
          };
        }));
      }

      let parsedFinanceSettings: FinanceSettings = { estTaxes: 0 };
      if (sRes.data) {
        const found = sRes.data.find(set => set.key === 'financeSettings');
        if (found) {
          try { parsedFinanceSettings = JSON.parse(found.value); } catch(e) {}
        }
      }

      if (rRes.data) {
        console.log("Fetched receipts from DB:", rRes.data.length);
        setReceipts(rRes.data.map(r => ({
          id: String(r.id), userId: r.user_id, userName: r.user_name,
          month: r.month, year: r.year, baseSalary: Number(r.base_salary),
          ninjaBonus: Number(r.ninja_bonus), masterBonus: Number(r.master_bonus),
          completedTasks: r.completed_tasks,
          tasksTotal: r.tasks_total,
          total: Number(r.total), date: r.date, receiptNumber: r.receipt_number,
          incomeId: parsedFinanceSettings?.receiptLinks?.[String(r.id)] || r.income_id
        })));
      }

      if (nRes.data) {
        setNotifications(nRes.data.map(n => ({
          id: n.id, userId: n.user_id, title: n.title, message: n.message,
          type: n.type, read: n.read, createdAt: n.created_at
        })));
      }

      if (sRes.data) {
        let loadedExpenses: any[] = [];
        let loadedTracking: any[] = [];
        sRes.data.forEach(set => {
          if (set.key === 'studioLogo') setStudioLogo(set.value);
          if (set.key === 'dashboardBanner') setDashboardBanner(set.value);
          if (set.key === 'dashboardBannerTitle') setDashboardBannerTitle(set.value);
          if (set.key === 'dashboardBannerSubtitle') setDashboardBannerSubtitle(set.value);
          if (set.key === 'loginBackground') setLoginBackground(set.value);
          if (set.key === 'loginTitle') setLoginTitle(set.value);
          if (set.key === 'loginSubtitle') setLoginSubtitle(set.value);
          if (set.key === 'expenses_json') {
             try { loadedExpenses = JSON.parse(set.value); setExpenses(loadedExpenses); } catch(e) { setExpenses([]); }
          }
          if (set.key === 'expense_tracking_json') {
             try { loadedTracking = JSON.parse(set.value); setExpenseTracking(loadedTracking); } catch(e) { setExpenseTracking([]); }
          }
          if (set.key === 'financeSettings') {
             try { setFinanceSettings(JSON.parse(set.value)); } catch(e) { setFinanceSettings({ estTaxes: 0 }); }
          }
          if (set.key === 'baseSalaries') {
             try { setBaseSalaries(JSON.parse(set.value)); } catch(e) { setBaseSalaries({}); }
          }
          if (set.key === 'taskRates') {
             try { setTaskRates(JSON.parse(set.value)); } catch(e) { setTaskRates({}); }
          }
          if (set.key === 'campaigns_json') {
             try { setCampaigns(JSON.parse(set.value)); } catch(e) { setCampaigns([]); }
          }
          if (set.key === 'performances_json') {
             try { setPerformances(JSON.parse(set.value)); } catch(e) { setPerformances([]); }
          }
          if (set.key === 'customer_receipts_json') {
             try { setCustomerReceipts(JSON.parse(set.value)); } catch(e) { setCustomerReceipts([]); }
          }
          if (set.key === 'customerQuotes') {
             try { setCustomerQuotes(JSON.parse(set.value)); } catch(e) { setCustomerQuotes([]); }
          }
          if (set.key === 'services_catalog_json') {
             try { setServicesCatalog(JSON.parse(set.value)); } catch(e) { setServicesCatalog([]); }
          }
          if (set.key === 'incomes_json') {
             try { setIncomes(JSON.parse(set.value)); } catch(e) { setIncomes([]); }
          }
          if (set.key === 'meetings_json') {
             try { setMeetings(JSON.parse(set.value)); } catch(e) { setMeetings([]); }
          }
          if (set.key === 'personal_agenda_json') {
             try { setPersonalTasks(JSON.parse(set.value)); } catch(e) { setPersonalTasks([]); }
          }
        });
        
        if (loadedExpenses.length > 0 && loadedTracking.length > 0) {
           let needsMigration = false;
           loadedTracking.forEach(t => {
              if (t.incomeId) {
                 const exp = loadedExpenses.find(e => e.id === t.id);
                 if (exp && !exp.incomeId) {
                    exp.incomeId = t.incomeId;
                    needsMigration = true;
                 }
              }
           });
           if (needsMigration) {
              setExpenses([...loadedExpenses]);
              supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(loadedExpenses) }).then();
           }
        }
      }
    } catch (e) { console.error("Critical Sync Failure:", e); } finally { if (!silent) setIsSyncing(false); }
  }, []);

  useEffect(() => {
    const channel = supabase.channel('vo-realtime').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData(true)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if ((cleanEmail === 'oscar@visual.com' || cleanEmail === 'oscartchavarria@gmail.com') && pass === 'Chorseñor23') {
       const { data: user } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
       if (user) {
         const mappedUser = { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, avatar: user.avatar, banner: user.banner, birthDate: user.birth_date, joinedAt: user.joined_at };
         setCurrentUser(mappedUser);
         localStorage.setItem(SESSION_KEY, JSON.stringify(mappedUser));
         return { success: true, message: 'Acceso Maestro' };
       }
    }
    try {
      const { data: user } = await supabase.from('users').select('*').eq('email', cleanEmail).eq('password', pass).maybeSingle();
      if (user) { 
        const mappedUser = { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, avatar: user.avatar, banner: user.banner, birthDate: user.birth_date, joinedAt: user.joined_at };
        setCurrentUser(mappedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(mappedUser));
        return { success: true, message: 'Bienvenido' }; 
      }
      return { success: false, message: 'Acceso Denegado' };
    } catch (err) { return { success: false, message: 'Error de servidor' }; }
  };

  const logout = () => { setCurrentUser(null); localStorage.removeItem(SESSION_KEY); };

  return (
    <ProjectContext.Provider value={{
      projects, tasks, currentUser, usersDB, receipts, expenses, expenseTracking, incomes, campaigns, performances, customerReceipts, customerQuotes, servicesCatalog, notifications, baseSalaries, taskRates, financeSettings, studioLogo, dashboardBanner, dashboardBannerTitle, dashboardBannerSubtitle, loginBackground, loginTitle, loginSubtitle, isSyncing, toast, showToast, messages, celebrationQuote, meetings, personalTasks,
      login, logout,
      addServiceCatalogItem: async (data) => {
        try {
          const newItem: ServiceCatalogItem = { ...data, id: `svc-${Date.now()}` };
          const nextList = [...servicesCatalog, newItem];
          const { error } = await supabase.from('settings').upsert({ key: 'services_catalog_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setServicesCatalog(nextList);
          showToast("Servicio agregado al catálogo");
        } catch (err) {
          showToast("Error al guardar servicio", "error");
        }
      },
      updateServiceCatalogItem: async (id, data) => {
        try {
          const nextList = servicesCatalog.map(s => s.id === id ? { ...s, ...data } : s);
          const { error } = await supabase.from('settings').upsert({ key: 'services_catalog_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setServicesCatalog(nextList);
          showToast("Servicio actualizado");
        } catch (err) {
          showToast("Error al actualizar servicio", "error");
        }
      },
      deleteServiceCatalogItem: async (id) => {
        try {
          const nextList = servicesCatalog.filter(s => s.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'services_catalog_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setServicesCatalog(nextList);
          showToast("Servicio eliminado del catálogo");
        } catch (err) {
          showToast("Error al eliminar servicio", "error");
        }
      },
      markNotificationAsRead: async (id) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        fetchData(true);
      },
      addIncome: async (source: string, amount: number, day: number, description?: string) => {
        try {
          const newInc: Income = {
            id: `inc-${Date.now()}`,
            source,
            amount: Number(amount),
            day: Number(day),
            description,
            createdAt: new Date().toISOString()
          };
          const nextList = [...incomes, newInc].sort((a,b) => a.day - b.day);
          const { error } = await supabase.from('settings').upsert({ key: 'incomes_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setIncomes(nextList);
          showToast("Ingreso recurrente registrado");
        } catch (err) {
          showToast("Error al registrar ingreso", "error");
        }
      },
      deleteIncome: async (id) => {
        try {
          const nextIncomes = incomes.filter(i => i.id !== id);
          const nextExpenses = expenses.map(e => e.incomeId === id ? { ...e, incomeId: undefined } : e);
          const nextTracking = expenseTracking.map(t => t.incomeId === id ? { ...t, incomeId: undefined } : t);
          
          // Clear links in financeSettings
          const nextFinanceSettings = { ...financeSettings };
          if (nextFinanceSettings.taxLinks) {
            Object.keys(nextFinanceSettings.taxLinks).forEach(k => {
              if (nextFinanceSettings.taxLinks![k] === id) delete nextFinanceSettings.taxLinks![k];
            });
          }
          if (nextFinanceSettings.payrollLinks) {
            Object.keys(nextFinanceSettings.payrollLinks).forEach(k => {
              if (nextFinanceSettings.payrollLinks![k] === id) delete nextFinanceSettings.payrollLinks![k];
            });
          }

          await Promise.all([
            supabase.from('settings').upsert({ key: 'incomes_json', value: JSON.stringify(nextIncomes) }),
            supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(nextExpenses) }),
            supabase.from('settings').upsert({ key: 'expense_tracking_json', value: JSON.stringify(nextTracking) }),
            supabase.from('settings').upsert({ key: 'financeSettings', value: JSON.stringify(nextFinanceSettings) })
          ]);
          
          setIncomes(nextIncomes);
          setExpenses(nextExpenses);
          setExpenseTracking(nextTracking);
          setFinanceSettings(nextFinanceSettings);
          showToast("Ingreso eliminado");
        } catch (err) {
          showToast("Error al eliminar ingreso", "error");
        }
      },
      updateIncome: async (id, data) => {
        try {
          const nextList = incomes.map(i => i.id === id ? { ...i, ...data } : i);
          const { error } = await supabase.from('settings').upsert({ key: 'incomes_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setIncomes(nextList);
          showToast("Ingreso actualizado");
        } catch (err) {
          showToast("Error al actualizar ingreso", "error");
        }
      },
      addCampaign: async (data) => {
        try {
          const newCamp: Campaign = {
            ...data,
            id: `camp-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...campaigns, newCamp];
          const { error } = await supabase.from('settings').upsert({ key: 'campaigns_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCampaigns(nextList);
          showToast("Campaña creada correctamente");
        } catch (err) {
          console.error("Error adding campaign:", err);
          showToast("Error al crear campaña", "error");
        }
      },
      updateCampaign: async (id, data) => {
        try {
          const nextList = campaigns.map(c => c.id === id ? { ...c, ...data } : c);
          const { error } = await supabase.from('settings').upsert({ key: 'campaigns_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCampaigns(nextList);
          showToast("Campaña actualizada");
        } catch (err) {
          showToast("Error al actualizar campaña", "error");
        }
      },
      deleteCampaign: async (id) => {
        try {
          const nextList = campaigns.filter(c => c.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'campaigns_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCampaigns(nextList);
          showToast("Campaña eliminada");
        } catch (err) {
          showToast("Error al eliminar campaña", "error");
        }
      },
      addPerformance: async (data) => {
        try {
          const newItem: PerformanceReport = {
            ...data,
            id: `perf-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...performances, newItem];
          const { error } = await supabase.from('settings').upsert({ key: 'performances_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPerformances(nextList);
          showToast("Reporte de rendimiento creado");
        } catch (err) {
          showToast("Error al crear reporte", "error");
        }
      },
      updatePerformance: async (id, data) => {
        try {
          const nextList = performances.map(p => p.id === id ? { ...p, ...data } : p);
          const { error } = await supabase.from('settings').upsert({ key: 'performances_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPerformances(nextList);
          showToast("Reporte actualizado");
        } catch (err) {
          showToast("Error al actualizar reporte", "error");
        }
      },
      deletePerformance: async (id) => {
        try {
          const nextList = performances.filter(p => p.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'performances_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPerformances(nextList);
          showToast("Reporte eliminado");
        } catch (err) {
          showToast("Error al eliminar reporte", "error");
        }
      },
      
      addCustomerQuote: async (data) => {
        try {
          const newItem = {
            ...data,
            id: `quote-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...customerQuotes, newItem];
          setCustomerQuotes(nextList);
          await supabase.from('settings').upsert({ key: 'customerQuotes', value: JSON.stringify(nextList) });
          showToast("Cotización guardada", "success");
        } catch (error) {
          console.error("Error saving quote:", error);
          showToast("Error al guardar cotización", "error");
        }
      },
      deleteCustomerQuote: async (id) => {
        try {
          const nextList = customerQuotes.filter(c => c.id !== id);
          setCustomerQuotes(nextList);
          await supabase.from('settings').upsert({ key: 'customerQuotes', value: JSON.stringify(nextList) });
          showToast("Cotización eliminada", "success");
        } catch (error) {
          showToast("Error al eliminar cotización", "error");
        }
      },
      addCustomerReceipt: async (data) => {

        try {
          const newItem: CustomerReceipt = {
            ...data,
            id: `crec-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...customerReceipts, newItem];
          const { error } = await supabase.from('settings').upsert({ key: 'customer_receipts_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCustomerReceipts(nextList);
          showToast("Recibo guardado correctamente");
        } catch (err) {
          showToast("Error al guardar recibo", "error");
        }
      },
      updateCustomerReceipt: async (id, data) => {
        try {
          const nextList = customerReceipts.map(r => r.id === id ? { ...r, ...data } : r);
          const { error } = await supabase.from('settings').upsert({ key: 'customer_receipts_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCustomerReceipts(nextList);
          showToast("Recibo actualizado");
        } catch (err) {
          showToast("Error al actualizar recibo", "error");
        }
      },
      deleteCustomerReceipt: async (id) => {
        try {
          const nextList = customerReceipts.filter(r => r.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'customer_receipts_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setCustomerReceipts(nextList);
          showToast("Recibo eliminado");
        } catch (err) {
          showToast("Error al eliminar recibo", "error");
        }
      },

      createNotification,
      markAllChatNotificationsAsRead: () => {},
      logAiUsage: (u, t) => console.log(`IA Usage: ${u} - ${t}`),
      updateProfile: async (d) => {
        if (!currentUser) return false;
        try {
          const mapped = { first_name: d.firstName, last_name: d.lastName, role: d.role, birth_date: d.birthDate, avatar: d.avatar, banner: d.banner };
          const { error } = await supabase.from('users').update(mapped).eq('id', currentUser.id);
          if (error) throw error;
          const nextUser = { ...currentUser, ...d };
          setCurrentUser(nextUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
          fetchData(true); return true; 
        } catch (err) { return false; }
      },
      updateUser: async (id, d) => {
        const mapped: any = {};
        if (d.firstName !== undefined) mapped.first_name = d.firstName;
        if (d.lastName !== undefined) mapped.last_name = d.lastName;
        if (d.birthDate !== undefined) mapped.birth_date = d.birthDate;
        if (d.role !== undefined) mapped.role = d.role;
        if (d.password !== undefined) mapped.password = d.password;
        const { error } = await supabase.from('users').update(mapped).eq('id', id);
        if (!error) { fetchData(true); return true; }
        return false;
      },
      addProject: async (data) => {
        const id = `proj-${Date.now()}`;
        const newProject = { 
          id, 
          name: data.brandName, 
          niche: data.niche, 
          client: data.clientName, 
          date: new Date().toLocaleDateString(), 
          logo_url: data.logoUrl, 
          brand_manual_url: data.brandManualUrl, 
          brief: data.brief, 
          hell: data.hell, 
          heaven: data.heaven, 
          brand_colors: data.brandColors, 
          status: 'En Progreso', 
          monthly_fee: 0, 
          collaborators: [],
          typography: data.typography ? {
            titles: data.typography.titles || { name: '', url: '' },
            subtitles: data.typography.subtitles || { name: '', url: '' },
            body: data.typography.body || { name: '', url: '' },
            brandCode: data.brandCode || ''
          } : {
            titles: { name: '', url: '' },
            subtitles: { name: '', url: '' },
            body: { name: '', url: '' },
            brandCode: data.brandCode || ''
          }
        };
        const { error } = await supabase.from('projects').insert([newProject]);
        if (!error) { fetchData(true); return { success: true, id }; }
        return { success: false };
      },
      updateProject: async (id, d) => { 
        const payload: any = { ...d };
        
        // Handle brandCode mapping: store inside typography if typography is being updated
        if (d.brandCode !== undefined) {
           if (payload.typography) {
             payload.typography = { ...payload.typography, brandCode: d.brandCode };
           } else {
             payload.typography = { brandCode: d.brandCode };
           }
           delete payload.brandCode;
        }
        
        if (d.driveFolderId !== undefined) {
           if (payload.typography) {
             payload.typography = { ...payload.typography, driveFolderId: d.driveFolderId };
           } else {
             // Retrieve existing typography to not overwrite it if we only update driveFolderId
             // But usually it's fine since we spread. Wait, if payload.typography isn't there, we should merge.
             // It's safer to let Supabase merge JSON or just fetch it. 
             // Actually, we can fetch the existing project from context:
             const existingProj = projects.find(p => String(p.id) === String(id));
             payload.typography = { ...(existingProj?.typography || {}), driveFolderId: d.driveFolderId };
           }
           delete payload.driveFolderId;
        }

        if (d.monthlyFee !== undefined) { payload.monthly_fee = Number(d.monthlyFee); delete payload.monthlyFee; }
        if (d.brandManualUrl !== undefined) { payload.brand_manual_url = d.brandManualUrl; delete payload.brandManualUrl; }
        if (d.brandColors !== undefined) { payload.brand_colors = d.brandColors; delete payload.brandColors; }
        if (d.logoUrl !== undefined) { payload.logo_url = d.logoUrl; delete payload.logoUrl; }
        if (d.textRepository !== undefined) { payload.text_repository = d.textRepository; delete payload.textRepository; }
        if (d.mediaRepository !== undefined) { payload.media_repository = d.mediaRepository; delete payload.mediaRepository; }
        if (d.collaborators !== undefined) { payload.collaborators = d.collaborators; }
        if (d.typography !== undefined) { 
           payload.typography = { ...payload.typography, ...d.typography };
           // If d.brandCode was also set, it's already in payload.typography from logic above
        }
        
        const { error } = await supabase.from('projects').update(payload).eq('id', id); 
        if (error) {
          console.error("Update Project Error:", error);
          showToast("Error al guardar en base de datos. Verifica si la columna 'typography' existe.", "error");
        } else {
          fetchData(true); 
          showToast("Cambios sincronizados correctamente");
        }
      },
      deleteProject: async (id) => { await supabase.from('projects').delete().eq('id', id); fetchData(true); },
      updateBaseSalary: async (u, a) => { 
        const n = {...baseSalaries, [u]: Number(a)}; setBaseSalaries(n); 
        await supabase.from('settings').upsert({key: 'baseSalaries', value: JSON.stringify(n)}); fetchData(true);
      },
      updateTaskRate: async (u, a) => { 
        const n = {...taskRates, [u]: Number(a)}; setTaskRates(n); 
        await supabase.from('settings').upsert({key: 'taskRates', value: JSON.stringify(n)}); fetchData(true);
      },
      updateFinanceSettings: async (s) => {
        const next = { ...financeSettings, ...s };
        setFinanceSettings(next);
        await supabase.from('settings').upsert({key: 'financeSettings', value: JSON.stringify(next)});
        showToast("Parámetros contables actualizados");
      },
      addExpense: async (name, amount, day, incomeId, isOneTime, vMonth, vYear) => {
        try {
          const m = vMonth !== undefined ? vMonth : new Date().getMonth();
          const y = vYear !== undefined ? vYear : new Date().getFullYear();
          const newExp: Expense = {
            id: `exp-${Date.now()}`,
            name,
            amount: parseFloat(String(amount)) || 0,
            date: `Día ${day}`,
            incomeId,
            isOneTime,
            createdAt: new Date(y, m, 1).toISOString()
          };
          const nextList = [...expenses, newExp].sort((a, b) => {
            const dayA = parseInt(String(a.date).replace(/[^0-9]/g, '')) || 0;
            const dayB = parseInt(String(b.date).replace(/[^0-9]/g, '')) || 0;
            return dayA - dayB;
          });
          const { error } = await supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setExpenses(nextList);
          showToast("Gasto mensual registrado");
        } catch (err) {
          console.error("Error adding expense:", err);
          showToast("Error al registrar gasto", "error");
        }
      },
      updateExpense: async (id, data, vMonth, vYear) => {
        try {
          const m = vMonth !== undefined ? vMonth : new Date().getMonth();
          const y = vYear !== undefined ? vYear : new Date().getFullYear();
          const existing = expenses.find(e => e.id === id);
          if (!existing) return;
          const created = new Date(existing.createdAt);
          let nextList;
          let nextTracking = [...expenseTracking];
          if (created.getFullYear() === y && created.getMonth() === m) {
             nextList = expenses.map(e => e.id === id ? { ...e, ...data } : e);
          } else {
             const deletedAt = new Date(y, m, 1).toISOString();
             const softDeleted = { ...existing, deletedAt };
             const newId = `exp-${Date.now()}`;
             const newExp = { ...existing, ...data, id: newId, createdAt: new Date(y, m, 1).toISOString() };
             nextList = [...expenses.filter(e => e.id !== id), softDeleted, newExp];
             
             const tIdx = nextTracking.findIndex(t => t.id === id && t.month === m && t.year === y);
             if (tIdx > -1) {
                nextTracking[tIdx] = { ...nextTracking[tIdx], id: newId };
                await supabase.from('settings').upsert({ key: 'expense_tracking_json', value: JSON.stringify(nextTracking) });
                setExpenseTracking(nextTracking);
             }
          }
          const { error } = await supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setExpenses(nextList);
          showToast("Gasto actualizado");
        } catch (err) {
          showToast("Error al actualizar gasto", "error");
        }
      },
      toggleExpensePayment: async (expenseId, month, year, incomeId) => {
        try {
          const existingIndex = expenseTracking.findIndex(t => t.id === expenseId && t.month === month && t.year === year);
          let nextList = [...expenseTracking];
          
          if (existingIndex > -1) {
            const current = nextList[existingIndex];
            // If incomeId is provided as a string (could be empty string for unlinking)
            if (typeof incomeId === 'string') {
              nextList[existingIndex] = {
                ...current,
                incomeId: incomeId || undefined
              };
            } else {
              // Standard toggle behavior
              const isPaid = !current.paid;
              nextList[existingIndex] = { 
                ...current, 
                paid: isPaid, 
                paidAt: isPaid ? (current.paidAt || new Date().toISOString()) : undefined 
              };
            }
          } else {
            // New record: if incomeId is provided, we mark as paid or just track the link
            nextList.push({ 
              id: expenseId, 
              month, 
              year, 
              paid: typeof incomeId === 'string' ? false : true, 
              paidAt: typeof incomeId === 'string' ? undefined : new Date().toISOString(), 
              incomeId: typeof incomeId === 'string' ? (incomeId || undefined) : undefined
            });
          }

          const { error } = await supabase.from('settings').upsert({ key: 'expense_tracking_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setExpenseTracking(nextList);
          showToast("Registro de egreso actualizado");
          fetchData(true);
        } catch (err) {
          console.error("Error toggling expense payment:", err);
          showToast("Error al actualizar pago", "error");
        }
      },
      deleteExpense: async (id, vMonth, vYear) => {
        try {
          const m = vMonth !== undefined ? vMonth : new Date().getMonth();
          const y = vYear !== undefined ? vYear : new Date().getFullYear();
          const deletedAt = new Date(y, m, 1).toISOString();
          const existing = expenses.find(e => e.id === id);
          if (!existing) return;
          const created = new Date(existing.createdAt);
          let nextList;
          if (created.getFullYear() === y && created.getMonth() === m) {
             nextList = expenses.filter(e => e.id !== id);
          } else {
             nextList = expenses.map(e => e.id === id ? { ...e, deletedAt } : e);
          }
          const { error } = await supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setExpenses(nextList);
          showToast("Gasto eliminado");
        } catch (err) {
          console.error("Error deleting expense:", err);
          showToast("Error al eliminar gasto", "error");
        }
      },
      addTextAsset: async (p, i) => { 
        const pr = projects.find(x => x.id === p); if(pr) {
          const nextRepo = [...(pr.textRepository || []), {...i, id: 'tx_'+Date.now()}];
          await supabase.from('projects').update({text_repository: nextRepo}).eq('id', p); fetchData(true);
        }
      },
      deleteTextAsset: async (p, assetId) => {
        const pr = projects.find(x => x.id === p); if(pr) {
          const nextRepo = (pr.textRepository || []).filter((x:any)=>x.id!==assetId);
          await supabase.from('projects').update({text_repository: nextRepo}).eq('id', p); fetchData(true);
        }
      },
      addMediaAsset: async (p, i) => {
        const pr = projects.find(x => x.id === p); if(pr) {
          const nextRepo = [...(pr.mediaRepository || []), {...i, id: 'md_'+Date.now()}];
          await supabase.from('projects').update({media_repository: nextRepo}).eq('id', p); fetchData(true);
        }
      },
      deleteMediaAsset: async (p, assetId) => {
        const pr = projects.find(x => x.id === p); if(pr) {
          const nextRepo = (pr.mediaRepository || []).filter((x:any)=>x.id!==assetId);
          await supabase.from('projects').update({media_repository: nextRepo}).eq('id', p); fetchData(true);
        }
      },
      addTask: async (data) => {
        // Embed campaign metadata in description for relation tracking since we don't have columns
        let finalDescription = data.description;
        if (data.campaignId && data.campaignThemeId) {
          finalDescription += `\n\n[REF:${data.campaignId}:${data.campaignThemeId}]`;
        }

        const payload = { 
          id: `task-${Date.now()}`, 
          project_id: data.projectId, 
          collaborator_id: data.collaboratorId, 
          title: data.title, 
          description: finalDescription, 
          date: data.date, 
          drive_link: data.driveLink || '', 
          status: 'Pendiente'
        };
        const { error } = await supabase.from('tasks').insert([payload]); 
        if (error) {
          console.error("Task Insert Error:", error);
          showToast("Error al crear tarea", "error");
          return;
        }
        await createNotification(data.collaboratorId, "Nueva Tarea Asignada", `Se te ha asignado: ${data.title}`, "info");
        await fetchData(true);
      },
      updateTask: async (id, d) => { 
        const t = tasks.find(x => x.id === id);
        const oldRefMatch = t?.description?.match(/\[REF:(camp-[^:]+):(theme-[^\]]+)\]/);

        const mapped: any = { ...d };
        if (d.projectId) { mapped.project_id = d.projectId; delete mapped.projectId; }
        if (d.collaboratorId) { mapped.collaborator_id = d.collaboratorId; delete mapped.collaboratorId; }
        if (d.driveLink !== undefined) { mapped.drive_link = d.driveLink; delete mapped.driveLink; }
        if (d.completedAt) { mapped.completed_at = d.completedAt; delete mapped.completedAt; }
        
        // We cannot store campaignId/ThemeId in the tasks table as columns don't exist
        delete mapped.campaignId;
        delete mapped.campaignThemeId;
        
        if (d.title !== undefined) mapped.title = d.title;
        if (d.description !== undefined) {
          let finalDesc = d.description;
          if (oldRefMatch && !finalDesc.match(/\[REF:/)) {
            finalDesc += `\n\n${oldRefMatch[0]}`;
          }
          mapped.description = finalDesc;
        }
        if (d.date !== undefined) mapped.date = d.date;
        if (d.status !== undefined) mapped.status = d.status;
        
        const { error } = await supabase.from('tasks').update(mapped).eq('id', id);
        if (error) {
          console.error("Task Update Error:", error);
          showToast("Error al actualizar tarea", "error");
          return;
        }

        // Sincronizar fecha con la campaña si cambió y la tarea está vinculada
        if (d.date !== undefined && t && t.date !== d.date && oldRefMatch) {
          const campaignId = oldRefMatch[1];
          const themeId = oldRefMatch[2];
          const campaign = campaigns.find(c => c.id === campaignId);
          if (campaign) {
            const theme = campaign.themes.find(th => th.id === themeId);
            if (theme && theme.productionId) {
              const prodDateIndex = campaign.productionDates.findIndex(pd => pd.id === theme.productionId);
              if (prodDateIndex !== -1) {
                const newProdDates = [...campaign.productionDates];
                newProdDates[prodDateIndex] = { ...newProdDates[prodDateIndex], date: d.date };
                
                const nextList = campaigns.map(c => c.id === campaignId ? { ...c, productionDates: newProdDates } : c);
                const { error: syncError } = await supabase.from('settings').upsert({ key: 'campaigns_json', value: JSON.stringify(nextList) });
                if (!syncError) {
                   setCampaigns(nextList);
                }
              }
            }
          }
        }

        await fetchData(true); 
      },
      toggleTaskStatus: async (id) => {
        const t = tasks.find(x => x.id === id); if (!t) return;
        const isDone = t.status === 'Completada';
        await supabase.from('tasks').update({ status: isDone ? 'Pendiente' : 'Completada', completed_at: isDone ? null : new Date().toISOString() }).eq('id', id); 
        if (!isDone) {
            const quotes = [
              "Cree en tu luz, nadie puede apagarla.",
              "El éxito empieza en tu mente.",
              "Liderar es inspirar, no mandar.",
              "Tu valor no depende de la opinión ajena.",
              "Haz de cada día un paso hacia tu meta.",
              "El ejemplo es la voz más fuerte.",
              "La confianza es tu mejor traje.",
              "La disciplina abre puertas que el talento no.",
              "Un líder crea caminos, no excusas.",
              "Ámate primero, el resto se acomoda.",
              "El fracaso es solo ensayo para el triunfo.",
              "La humildad sostiene al verdadero liderazgo.",
              "Tu autenticidad es tu poder.",
              "Sueña grande, actúa constante.",
              "Motivar es más poderoso que imponer.",
              "La seguridad nace de aceptarte tal cual eres.",
              "El éxito es la suma de pequeños hábitos.",
              "Tu visión es tu mapa hacia la victoria.",
              "Eres suficiente, siempre lo has sido.",
              "El liderazgo auténtico transforma equipos en familia."
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            setCelebrationQuote(randomQuote);
            setTimeout(() => setCelebrationQuote(null), 4000);

            const userTasks = tasks.filter(x => x.collaboratorId === t.collaboratorId);
            const doneCount = userTasks.filter(x => x.status === 'Completada').length + 1;
            if (doneCount === userTasks.length) {
                await createNotification(t.collaboratorId, "¡Logro Alcanzado!", "Has completado todas tus tareas. ¡Eres un King!", "success");
            }
        }
        fetchData(true);
      },
      deleteTask: async (id) => { 
        try {
          const { error } = await supabase.from('tasks').delete().eq('id', id); 
          if (error) throw error;
          fetchData(true); 
          showToast("Tarea eliminada con éxito");
        } catch (err) {
          console.error("Delete Error:", err);
          showToast("Error al eliminar la tarea de la base de datos", "error");
        }
      },
      deleteUser: async (id) => { await supabase.from('users').delete().eq('id', id); fetchData(true); },
      sendReceiptToUser: async (r) => {
        try {
          const payload = { 
            user_id: r.userId, 
            user_name: r.userName, 
            month: r.month, 
            year: Number(r.year), 
            base_salary: Number(r.baseSalary), 
            ninja_bonus: Number(r.ninjaBonus), 
            master_bonus: Number(r.masterBonus),
            completed_tasks: r.completedTasks,
            tasks_total: r.tasksTotal,
            total: Number(r.total), 
            date: r.date, 
            receipt_number: r.receiptNumber,
            income_id: r.incomeId 
          };
          console.log("Sending receipt payload:", payload);
          const { data, error } = await supabase.from('receipts').insert([payload]).select();
          if (error) {
            console.error("Supabase Receipt Insert Error:", error);
            // Fallback: try without the new columns if they were the cause
            const fallbackPayload = { 
              user_id: r.userId, 
              user_name: r.userName, 
              month: r.month, 
              year: Number(r.year), 
              base_salary: Number(r.baseSalary), 
              ninja_bonus: Number(r.ninjaBonus), 
              master_bonus: Number(r.masterBonus),
              total: Number(r.total), 
              date: r.date, 
              receipt_number: r.receiptNumber 
            };
            console.log("Sending fallback payload:", fallbackPayload);
            const { data: data2, error: error2 } = await supabase.from('receipts').insert([fallbackPayload]).select();
            if (error2) {
              console.error("Supabase Receipt Fallback Insert Error:", error2);
              return null;
            }
            console.log("Fallback Receipt inserted successfully");
            await createNotification(r.userId, "Liquidación Emitida", `Se ha generado tu recibo de ${r.month}.`, "success");
            await fetchData(true); 
            return data2?.[0] ? { ...r, id: String(data2[0].id) } : r;
          }
          console.log("Receipt inserted successfully");
          await createNotification(r.userId, "Liquidación Emitida", `Se ha generado tu recibo de ${r.month}.`, "success");
          await fetchData(true); 
          return data?.[0] ? { ...r, id: String(data[0].id) } : r;
        } catch (err) {
          console.error("sendReceiptToUser Exception:", err);
          return null;
        }
      },
      deleteReceipt: async (id) => {
        try {
          const { error } = await supabase.from('receipts').delete().eq('id', id);
          if (error) throw error;
          
          // Clear receipt link in financeSettings
          const nextFinanceSettings = { ...financeSettings };
          if (nextFinanceSettings.receiptLinks && nextFinanceSettings.receiptLinks[id]) {
            delete nextFinanceSettings.receiptLinks[id];
            await supabase.from('settings').upsert({key: 'financeSettings', value: JSON.stringify(nextFinanceSettings)});
            setFinanceSettings(nextFinanceSettings);
          }

          await fetchData(true);
          showToast("Registro de pago eliminado");
        } catch (err) {
          showToast("Error al eliminar el recibo", "error");
        }
      },
      register: async (d) => {
        const newUser = { id: `user-${Date.now()}`, first_name: d.firstName, last_name: d.lastName, email: d.email, password: d.password, role: d.role, birth_date: d.birthDate, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.email}` };
        const { error } = await supabase.from('users').insert([newUser]);
        if (!error) { fetchData(true); return { success: true, message: 'Socio Registrado' }; }
        return { success: false, message: 'Error de SQL' };
      },
      updateStudioLogo: async (v) => { await supabase.from('settings').upsert({key: 'studioLogo', value: v}); fetchData(true); },
      updateDashboardBanner: async (v) => { await supabase.from('settings').upsert({key: 'dashboardBanner', value: v}); fetchData(true); },
      updateDashboardBannerTexts: async (t, s) => { 
        try {
          await Promise.all([
            supabase.from('settings').upsert({key: 'dashboardBannerTitle', value: t}),
            supabase.from('settings').upsert({key: 'dashboardBannerSubtitle', value: s})
          ]);
          await fetchData(true);
          showToast("Textos del banner actualizados");
        } catch (e) {
          showToast("Error al guardar textos", "error");
        }
      },
      updateLoginBackground: async (v) => { await supabase.from('settings').upsert({key: 'loginBackground', value: v}); fetchData(true); },
      updateLoginTexts: async (t, s) => { await supabase.from('settings').upsert({key: 'loginTitle', value: t}); await supabase.from('settings').upsert({key: 'loginSubtitle', value: s}); fetchData(true); },
      addMeeting: async (data) => {
        try {
          const newMeeting: Meeting = {
            ...data,
            id: `meet-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...meetings, newMeeting].sort((a, b) =>
            `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
          );
          const { error } = await supabase.from('settings').upsert({ key: 'meetings_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setMeetings(nextList);
          return newMeeting;
        } catch (err) {
          showToast('Error al guardar la reunión', 'error');
          return null;
        }
      },
      updateMeeting: async (id, data) => {
        try {
          const nextList = meetings.map(m => m.id === id ? { ...m, ...data } : m);
          const { error } = await supabase.from('settings').upsert({ key: 'meetings_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setMeetings(nextList);
        } catch (err) {
          showToast('Error al actualizar la reunión', 'error');
        }
      },
      addPersonalTask: async (data) => {
        try {
          const maxOrder = Math.max(-1, ...personalTasks.filter(t => t.date === data.date).map(t => t.order ?? 0));
          const newTask: PersonalTask = {
            ...data,
            id: `ptask-${Date.now()}`,
            order: maxOrder + 1,
            createdAt: new Date().toISOString()
          };
          const nextList = [...personalTasks, newTask];
          const { error } = await supabase.from('settings').upsert({ key: 'personal_agenda_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPersonalTasks(nextList);
          showToast('Tarea agregada a la agenda ✓');
        } catch (err) {
          showToast('Error al guardar la tarea', 'error');
        }
      },
      updatePersonalTask: async (id, data) => {
        try {
          const nextList = personalTasks.map(t => t.id === id ? { ...t, ...data } : t);
          const { error } = await supabase.from('settings').upsert({ key: 'personal_agenda_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPersonalTasks(nextList);
          showToast('Tarea actualizada');
        } catch (err) {
          showToast('Error al actualizar la tarea', 'error');
        }
      },
      togglePersonalTask: async (id) => {
        try {
          const task = personalTasks.find(t => t.id === id);
          if (!task) return;
          const isNowDone = !task.completed;
          const nextList = personalTasks.map(t =>
            t.id === id
              ? { ...t, completed: isNowDone, completedAt: isNowDone ? new Date().toISOString() : undefined }
              : t
          );
          const { error } = await supabase.from('settings').upsert({ key: 'personal_agenda_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPersonalTasks(nextList);
        } catch (err) {
          showToast('Error al actualizar la tarea', 'error');
        }
      },
      deletePersonalTask: async (id) => {
        try {
          const nextList = personalTasks.filter(t => t.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'personal_agenda_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPersonalTasks(nextList);
          showToast('Tarea eliminada');
        } catch (err) {
          showToast('Error al eliminar la tarea', 'error');
        }
      },
      reorderPersonalTasks: async (orderedIds) => {
        try {
          const nextList = personalTasks.map(t => {
            const idx = orderedIds.indexOf(t.id);
            return idx !== -1 ? { ...t, order: idx } : t;
          });
          const { error } = await supabase.from('settings').upsert({ key: 'personal_agenda_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setPersonalTasks(nextList);
        } catch (err) {
          showToast('Error al reordenar', 'error');
        }
      },
      deleteMeeting: async (id) => {
        try {
          const nextList = meetings.filter(m => m.id !== id);
          const { error } = await supabase.from('settings').upsert({ key: 'meetings_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setMeetings(nextList);
          showToast('Reunión eliminada');
        } catch (err) {
          showToast('Error al eliminar la reunión', 'error');
        }
      },
      sendMessage: async (content) => {
        if (!currentUser) return;
        const msg = { id: `msg-${Date.now()}`, senderId: currentUser.id, senderName: `${currentUser.firstName} ${currentUser.lastName}`, senderAvatar: currentUser.avatar, content, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, msg]);
      }
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects missing Provider');
  return context;
};
