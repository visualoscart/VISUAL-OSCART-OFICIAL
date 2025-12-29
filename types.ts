
export type TextAssetTag = 'CTA' | 'Hooks' | 'Copys' | 'Otros';

export interface TextAsset {
  id: string;
  tag: TextAssetTag;
  title: string;
  content: string;
}

export interface MediaAsset {
  id: string;
  type: 'Imagen' | 'Video' | 'Archivo';
  name: string;
  url: string;
  size?: string;
  description?: string;
  platform?: 'Drive' | 'Canva' | 'Dropbox' | 'Web';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export interface Receipt {
  id: string;
  userId: string;
  userName: string;
  month: string;
  year: number;
  baseSalary: number;
  ninjaBonus: number;
  masterBonus: number;
  total: number;
  date: string;
  receiptNumber: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  avatar: string;
  banner?: string;
  birthDate?: string;
  joinedAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Task {
  id: string;
  projectId: string;
  collaboratorId: string;
  title: string;
  description: string;
  date: string; 
  status: 'Pendiente' | 'Completada';
  completedAt?: string;
  driveLink?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string; 
  niche: string; 
  client: string;
  date: string;
  status: 'En Progreso' | 'Revisión' | 'Completado';
  progress: number;
  logoUrl?: string; 
  brandManualUrl?: string; 
  brief: string; 
  collaborators: Collaborator[];
  textRepository: TextAsset[];
  mediaRepository: MediaAsset[];
  monthlyFee?: number;
  hell?: string;
  heaven?: string;
  brandColors?: string[];
}

export interface NavItem {
  to: string;
  icon: string;
  label: string;
  id: string;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
  description: string;
}
