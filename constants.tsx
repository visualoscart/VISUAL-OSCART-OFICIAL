
import { NavItem, Achievement } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', to: '/', icon: 'dashboard', label: 'Dashboard' },
  { id: 'projects', to: '/projects', icon: 'folder_open', label: 'Marcas' },
  { id: 'calendar', to: '/calendar', icon: 'calendar_month', label: 'Calendario' },
  { id: 'users', to: '/users', icon: 'account_circle', label: 'Mi Perfil' },
  { id: 'achievements', to: '/achievements', icon: 'emoji_events', label: 'Logros' },
  { id: 'admin', to: '/admin', icon: 'admin_panel_settings', label: 'Control Maestro' },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Speed Demon', icon: 'speed', earned: true, description: 'Completa 5 tareas antes de su fecha de vencimiento.' },
  { id: 'a2', title: 'Strategy Master', icon: 'psychology', earned: true, description: 'Desarrolla una estrategia de marca integral.' },
];
