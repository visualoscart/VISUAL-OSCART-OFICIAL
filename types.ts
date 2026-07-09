
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
  fileId?: string;
  previewUrl?: string;
  classification?: string;
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
  incomeId?: string; // Manual link to an income
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  day: number; // Day of the month (1-31)
  description?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  createdAt: string;
  incomeId?: string; // Link to an income
  isOneTime?: boolean;
  deletedAt?: string;
}

export interface ExpenseTracking {
  id: string; // expenseId
  month: number;
  year: number;
  paid: boolean;
  paidAt?: string;
  incomeId?: string; // Manual link to an income for this specific month
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
  visibleToClient?: boolean;
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
  status: 'En Progreso' | 'Revisión' | 'Completado' | 'Inactivo';
  progress: number;
  logoUrl?: string; 
  brandManualUrl?: string; 
  coverUrl?: string; 
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
    brandCode?: string;
    driveFolderId?: string;
    inactiveAt?: string;
    mediaClassifications?: string[];
    coverUrl?: string;
  };
  driveFolderId?: string;
  brandCode?: string;
  mediaClassifications?: string[];
}

export interface CampaignProductionDate {
  id: string;
  date: string;
  locationId?: string; // Link to CampaignProductionLocation
}

export interface CampaignProductionLocation {
  id: string;
  name: string;
}

export interface CampaignTheme {
  id: string;
  title: string;
  format: string;
  content: string;
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
  productionLocations: CampaignProductionLocation[];
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
    postUrl?: string;
  }[];
  demographics?: {
    ageGender: { age: string; female: number; male: number }[];
    topCities: { name: string; value: number }[];
  };
  createdAt: string;
}
export interface CustomerReceiptItem {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  basePrice: number;
  currency: 'USD' | 'CRC';
  includes?: string;
}

export interface CustomerReceipt {
  id: string;
  clientName: string;
  date: string;
  receiptNumber: string;
  items: CustomerReceiptItem[];
  currency: 'USD' | 'CRC';
  subtotal: number;
  total: number;
  amountPaid: number;
  balancePending: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado';
  notes?: string;
  createdAt: string;
}

export interface CustomerQuoteItem {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerQuote {
  id: string;
  clientName: string;
  date: string;
  quoteNumber: string;
  items: CustomerQuoteItem[];
  currency: 'USD' | 'CRC';
  subtotal: number;
  ivaPercentage?: number;
  discountPercentage?: number;
  discountDescription?: string;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface PersonalTask {
  id: string;
  title: string;
  description?: string;
  date: string;          // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
}

export type MeetingCategory =
  | 'Gestión de Redes Sociales'
  | 'Diseño de Marca'
  | 'Diseño Web'
  | 'Animación Digital'
  | 'Otro';

export type MeetingDuration = 30 | 60 | 90 | 120;

export interface Meeting {
  id: string;
  title: string;
  projectId?: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  duration: MeetingDuration;
  category: MeetingCategory;
  notes?: string;
  hasMeet: boolean;
  meetLink?: string;
  googleEventId?: string;
  createdAt: string;
}
