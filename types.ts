
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
  completedTasks?: number;
  tasksTotal?: number;
  total: number;
  date: string;
  receiptNumber: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface ExpenseTracking {
  id: string; // expenseId
  month: number;
  year: number;
  paid: boolean;
  paidAt?: string;
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
  campaignId?: string;
  campaignThemeId?: string;
}

export interface TypographySetting {
  name: string;
  url?: string;
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
  typography?: {
    titles: TypographySetting;
    subtitles: TypographySetting;
    body: TypographySetting;
  };
}

export interface CampaignProductionDate {
  id: string;
  date: string;
}

export interface CampaignTheme {
  id: string;
  title: string;
  format: string;
  content: string; // descripciones, diálogos o guiones integrados
  productionId?: string; // Link to CampaignProductionDate
}

export interface Campaign {
  id: string;
  projectId: string;
  month: string;
  year: number;
  objective?: string;
  themes: CampaignTheme[];
  productionDates: CampaignProductionDate[];
  createdAt: string;
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

export type SocialPlatform = 'Instagram' | 'Facebook' | 'TikTok' | 'LinkedIn' | 'YouTube';

export interface PerformanceMetric {
  platform: SocialPlatform;
  followers: number;
  totalFollowers?: number;
  reach: number;
  engagement?: number;
  leads?: number;
  interactions?: number;
}

export interface ExtraWork {
  id: string;
  description: string;
  date: string;
}

export interface PerformanceReport {
  id: string;
  projectId: string;
  month: string;
  year: number;
  metrics: PerformanceMetric[];
  extraWorks: ExtraWork[];
  manualPostsCount?: number;
  manualProductionsCount?: number;
  executiveSummary?: string;
  bestPosts?: { 
    title: string; 
    reach: number; 
    reactions: number; 
    imageUrl?: string;
  }[];
  demographics?: {
    ageGender: { age: string; female: number; male: number }[];
    topCities: { name: string; value: number }[];
  };
  createdAt: string;
}
