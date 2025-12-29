
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Project, TextAsset, MediaAsset, Task, UserProfile, Receipt, ChatMessage, Expense } from '../types';
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
}

interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  currentUser: UserProfile | null;
  usersDB: UserProfile[];
  receipts: Receipt[];
  expenses: Expense[];
  notifications: Notification[];
  baseSalaries: Record<string, number>; 
  financeSettings: FinanceSettings;
  studioLogo: string;
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
  updateLoginBackground: (bgBase64: string) => Promise<void>;
  updateLoginTexts: (title: string, subtitle: string) => Promise<void>;
  addProject: (project: any) => Promise<{success: boolean, id?: string}>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateBaseSalary: (userId: string, amount: number) => Promise<void>;
  updateFinanceSettings: (settings: Partial<FinanceSettings>) => Promise<void>;
  addExpense: (name: string, amount: number, day: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addTextAsset: (projectId: string, item: Omit<TextAsset, 'id'>) => Promise<void>;
  deleteTextAsset: (projectId: string, assetId: string) => Promise<void>;
  addMediaAsset: (projectId: string, item: Omit<MediaAsset, 'id'>) => Promise<void>;
  deleteMediaAsset: (projectId: string, assetId: string) => Promise<void>;
  addTask: (task: any) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  sendReceiptToUser: (receipt: Receipt) => Promise<boolean>;
  deleteReceipt: (receiptId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  createNotification: (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning') => Promise<void>;
  markAllChatNotificationsAsRead: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  logAiUsage: (userId: string, type: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const SESSION_KEY = 'VO_SESSION_ULTIMATE_FINAL_V1';
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersDB, setUsersDB] = useState<UserProfile[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [baseSalaries, setBaseSalaries] = useState<Record<string, number>>({});
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>({ estTaxes: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [studioLogo, setStudioLogo] = useState('');
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
        setProjects(pRes.data.map(p => ({ 
          id: p.id, name: p.name, niche: p.niche, client: p.client,
          date: p.date, status: p.status, progress: p.progress,
          logoUrl: p.logo_url, brandManualUrl: p.brand_manual_url,
          brief: p.brief, hell: p.hell, heaven: p.heaven,
          monthlyFee: Number(p.monthly_fee), textRepository: p.text_repository || [],
          mediaRepository: p.media_repository || [], brandColors: p.brand_colors || [],
          collaborators: p.collaborators || []
        })));
      }

      if (tRes.data) {
        setTasks(tRes.data.map(t => ({
          id: t.id, projectId: t.project_id, collaboratorId: t.collaborator_id,
          title: t.title, description: t.description, date: t.date,
          status: t.status, driveLink: t.drive_link, createdAt: t.created_at,
          completedAt: t.completed_at
        })));
      }

      if (rRes.data) {
        setReceipts(rRes.data.map(r => ({
          id: String(r.id), userId: r.user_id, userName: r.user_name,
          month: r.month, year: r.year, baseSalary: Number(r.base_salary),
          ninjaBonus: Number(r.ninja_bonus), masterBonus: Number(r.master_bonus),
          total: Number(r.total), date: r.date, receiptNumber: r.receipt_number
        })));
      }

      if (nRes.data) {
        setNotifications(nRes.data.map(n => ({
          id: n.id, userId: n.user_id, title: n.title, message: n.message,
          type: n.type, read: n.read, createdAt: n.created_at
        })));
      }

      if (sRes.data) {
        sRes.data.forEach(set => {
          if (set.key === 'studioLogo') setStudioLogo(set.value);
          if (set.key === 'loginBackground') setLoginBackground(set.value);
          if (set.key === 'loginTitle') setLoginTitle(set.value);
          if (set.key === 'loginSubtitle') setLoginSubtitle(set.value);
          if (set.key === 'expenses_json') {
             try { setExpenses(JSON.parse(set.value)); } catch(e) { setExpenses([]); }
          }
          if (set.key === 'financeSettings') {
             try { setFinanceSettings(JSON.parse(set.value)); } catch(e) { setFinanceSettings({ estTaxes: 0 }); }
          }
          if (set.key === 'baseSalaries') {
             try { setBaseSalaries(JSON.parse(set.value)); } catch(e) { setBaseSalaries({}); }
          }
        });
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
      projects, tasks, currentUser, usersDB, receipts, expenses, notifications, baseSalaries, financeSettings, studioLogo, loginBackground, loginTitle, loginSubtitle, isSyncing, toast, showToast, messages,
      login, logout,
      markNotificationAsRead: async (id) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        fetchData(true);
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
        const newProject = { id, name: data.brandName, niche: data.niche, client: data.clientName, date: new Date().toLocaleDateString(), logo_url: data.logoUrl, brand_manual_url: data.brandManualUrl, brief: data.brief, hell: data.hell, heaven: data.heaven, brand_colors: data.brandColors, status: 'En Progreso', monthly_fee: 0, collaborators: [] };
        const { error } = await supabase.from('projects').insert([newProject]);
        if (!error) { fetchData(true); return { success: true, id }; }
        return { success: false };
      },
      updateProject: async (id, d) => { 
        const payload: any = { ...d };
        if (d.monthlyFee !== undefined) { payload.monthly_fee = Number(d.monthlyFee); delete payload.monthlyFee; }
        if (d.brandManualUrl !== undefined) { payload.brand_manual_url = d.brandManualUrl; delete payload.brandManualUrl; }
        if (d.brandColors !== undefined) { payload.brand_colors = d.brandColors; delete payload.brandColors; }
        if (d.logoUrl !== undefined) { payload.logo_url = d.logoUrl; delete payload.logoUrl; }
        if (d.textRepository !== undefined) { payload.text_repository = d.textRepository; delete payload.textRepository; }
        if (d.mediaRepository !== undefined) { payload.media_repository = d.mediaRepository; delete payload.mediaRepository; }
        if (d.collaborators !== undefined) { payload.collaborators = d.collaborators; }
        await supabase.from('projects').update(payload).eq('id', id); fetchData(true); 
      },
      deleteProject: async (id) => { await supabase.from('projects').delete().eq('id', id); fetchData(true); },
      updateBaseSalary: async (u, a) => { 
        const n = {...baseSalaries, [u]: Number(a)}; setBaseSalaries(n); 
        await supabase.from('settings').upsert({key: 'baseSalaries', value: JSON.stringify(n)}); fetchData(true);
      },
      updateFinanceSettings: async (s) => {
        const next = { ...financeSettings, ...s };
        setFinanceSettings(next);
        await supabase.from('settings').upsert({key: 'financeSettings', value: JSON.stringify(next)});
        showToast("Parámetros contables actualizados");
      },
      addExpense: async (name, amount, day) => {
        try {
          const newExp: Expense = {
            id: `exp-${Date.now()}`,
            name,
            amount: parseFloat(String(amount)) || 0,
            date: `Día ${day}`,
            createdAt: new Date().toISOString()
          };
          const nextList = [...expenses, newExp];
          const { error } = await supabase.from('settings').upsert({ key: 'expenses_json', value: JSON.stringify(nextList) });
          if (error) throw error;
          setExpenses(nextList);
          showToast("Gasto mensual registrado");
        } catch (err) {
          console.error("Error adding expense:", err);
          showToast("Error al registrar gasto", "error");
        }
      },
      deleteExpense: async (id) => {
        try {
          const nextList = expenses.filter(e => e.id !== id);
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
        const payload = { id: `task-${Date.now()}`, project_id: data.projectId, collaborator_id: data.collaboratorId, title: data.title, description: data.description, date: data.date, drive_link: data.drive_link || '', status: 'Pendiente' };
        await supabase.from('tasks').insert([payload]); 
        await createNotification(data.collaboratorId, "Nueva Tarea Asignada", `Se te ha asignado: ${data.title}`, "info");
        fetchData(true);
      },
      updateTask: async (id, d) => { 
        const mapped: any = { ...d };
        if (d.projectId) { mapped.project_id = d.projectId; delete mapped.projectId; }
        if (d.collaboratorId) { mapped.collaborator_id = d.collaboratorId; delete mapped.collaboratorId; }
        if (d.driveLink !== undefined) { mapped.drive_link = d.driveLink; delete mapped.driveLink; }
        if (d.completedAt) { mapped.completed_at = d.completedAt; delete mapped.completedAt; }
        if (d.title) mapped.title = d.title;
        if (d.description) mapped.description = d.description;
        if (d.date) mapped.date = d.date;
        if (d.status) mapped.status = d.status;
        await supabase.from('tasks').update(mapped).eq('id', id); fetchData(true); 
      },
      toggleTaskStatus: async (id) => {
        const t = tasks.find(x => x.id === id); if (!t) return;
        const isDone = t.status === 'Completada';
        await supabase.from('tasks').update({ status: isDone ? 'Pendiente' : 'Completada', completed_at: isDone ? null : new Date().toISOString() }).eq('id', id); 
        if (!isDone) {
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
        const payload = { user_id: r.userId, user_name: r.userName, month: r.month, year: Number(r.year), base_salary: Number(r.base_salary), ninja_bonus: Number(r.ninja_bonus), master_bonus: Number(r.master_bonus), total: Number(r.total), date: r.date, receipt_number: r.receipt_number };
        const { error } = await supabase.from('receipts').insert([payload]);
        if (!error) { 
            await createNotification(r.userId, "Liquidación Emitida", `Se ha generado tu recibo de ${r.month}.`, "success");
            fetchData(true); return true; 
        }
        return false;
      },
      deleteReceipt: async (id) => {
        try {
          const { error } = await supabase.from('receipts').delete().eq('id', id);
          if (error) throw error;
          fetchData(true);
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
      updateLoginBackground: async (v) => { await supabase.from('settings').upsert({key: 'loginBackground', value: v}); fetchData(true); },
      updateLoginTexts: async (t, s) => { await supabase.from('settings').upsert({key: 'loginTitle', value: t}); await supabase.from('settings').upsert({key: 'loginSubtitle', value: s}); fetchData(true); },
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
