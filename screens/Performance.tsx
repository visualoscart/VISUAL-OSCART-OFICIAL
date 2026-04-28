
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { SocialPlatform, PerformanceMetric, ExtraWork, PerformanceReport, Project } from '../types';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Linkedin, 
  TrendingUp, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Rocket,
  Target,
  Smartphone,
  ChevronRight,
  Monitor,
  LayoutDashboard
} from 'lucide-react';

const PLATFORMS: { id: SocialPlatform; icon: any; color: string }[] = [
  { id: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'TikTok', icon: Smartphone, color: '#000000' },
  { id: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'YouTube', icon: Youtube, color: '#FF0000' }
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const safeFormat = (dateStr: string | undefined | null, formatStr: string) => {
  if (!dateStr) return 'Fecha pendiente';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return format(d, formatStr, { locale: es });
};

const getFreshDemographics = () => ({
  ageGender: [
    { age: '18-24', female: 0, male: 0 },
    { age: '25-34', female: 0, male: 0 },
    { age: '35-44', female: 0, male: 0 },
    { age: '45-54', female: 0, male: 0 },
    { age: '55-64', female: 0, male: 0 },
    { age: '65+', female: 0, male: 0 },
  ],
  topCities: [
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 }
  ]
});

const Performance: React.FC = () => {
  const { 
    projects, 
    campaigns, 
    performances, 
    tasks,
    addPerformance, 
    updatePerformance, 
    deletePerformance,
    studioLogo, 
    showToast 
  } = useProjects();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && projects.length > 0) {
      setSelectedProjectId(projectId);
      setIsViewingDashboard(true);
    }
  }, [searchParams, projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isViewingDashboard, setIsViewingDashboard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    let monthIndex = now.getMonth();
    // Si hoy es >= 20, el periodo "actual" es el que cierra el 19 del próximo mes
    if (now.getDate() >= 20) {
      monthIndex = (monthIndex + 1) % 12;
    }
    return MONTHS[monthIndex];
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const now = new Date();
    let year = now.getFullYear();
    if (now.getMonth() === 11 && now.getDate() >= 20) {
      year++;
    }
    return year;
  });
  const [activePlatforms, setActivePlatforms] = useState<SocialPlatform[]>(['Instagram']);
  const [metrics, setMetrics] = useState<Record<SocialPlatform, { followers: number; totalFollowers: number; reach: number; engagement: number; leads: number; interactions: number }>>({
    Instagram: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
    Facebook: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
    TikTok: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
    LinkedIn: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
    YouTube: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 }
  });
  const [demographics, setDemographics] = useState<{
    ageGender: { age: string; female: number; male: number }[];
    topCities: { name: string; value: number }[];
  }>(getFreshDemographics());

  const handleDemographicChange = (index: number, field: 'female' | 'male', value: string) => {
    const num = parseFloat(value) || 0;
    setDemographics(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      next.ageGender = [...next.ageGender];
      next.ageGender[index] = { ...next.ageGender[index], [field]: num };
      return next;
    });
  };

  const handleCityChange = (index: number, field: 'name' | 'value', value: string) => {
    setDemographics(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      next.topCities = [...next.topCities];
      next.topCities[index] = { ...next.topCities[index], [field]: field === 'value' ? (parseFloat(value) || 0) : value };
      return next;
    });
  };
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [bestPosts, setBestPosts] = useState<{ title: string; reach: number; reactions: number; imageUrl?: string }[]>([
    { title: '', reach: 0, reactions: 0 },
    { title: '', reach: 0, reactions: 0 },
    { title: '', reach: 0, reactions: 0 }
  ]);
  const [extraWorks, setExtraWorks] = useState<{ description: string; date: string }[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Vault/History for selected brand
  const brandReports = useMemo(() => {
    return performances.filter(p => p.projectId === selectedProjectId)
      .sort((a,b) => {
        const dateA = new Date(a.year, MONTHS.indexOf(a.month));
        const dateB = new Date(b.year, MONTHS.indexOf(b.month));
        return dateB.getTime() - dateA.getTime();
      });
  }, [selectedProjectId, performances]);

  // Auto-calculated data from campaigns
  const activeCampaign = useMemo(() => {
    if (!selectedProjectId) return null;
    return campaigns.find(c => 
      c.projectId === selectedProjectId && 
      c.month === selectedMonth && 
      c.year === selectedYear
    );
  }, [selectedProjectId, selectedMonth, selectedYear, campaigns]);

  // Find previous month report for comparison
  const prevMonthReport = useMemo(() => {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const prevMonthName = monthIndex === 0 ? MONTHS[11] : MONTHS[monthIndex - 1];
    const prevYear = monthIndex === 0 ? selectedYear - 1 : selectedYear;
    
    return performances.find(p => 
      p.projectId === selectedProjectId && 
      p.month === prevMonthName && 
      p.year === prevYear
    );
  }, [selectedProjectId, selectedMonth, selectedYear, performances]);

  const calculateMoM = (current: number, prev: number | undefined) => {
    if (!prev || prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    return {
      value: diff.toFixed(1),
      isPositive: diff >= 0
    };
  };

  const getPeriodRange = (monthName: string, year: number) => {
    const monthIndex = MONTHS.indexOf(monthName);
    // Periodo que cierra el 19 de 'monthName'
    const startDate = new Date(year, monthIndex - 1, 20, 0, 0, 0);
    const endDate = new Date(year, monthIndex, 19, 23, 59, 59);
    return { start: startDate, end: endDate };
  };

  const operationalLogs = useMemo(() => {
    if (!selectedProjectId || !activeCampaign) return [];
    
    // Solo mostrar contenido que pertenezca ESTRÍCTAMENTE a la campaña de este mes
    return tasks.filter(t => {
      return t.projectId === selectedProjectId && t.campaignId === activeCampaign.id;
    }).sort((a,b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [selectedProjectId, tasks, activeCampaign]);

  const autoData = useMemo(() => {
    if (!activeCampaign) return { posts: 0, productions: 0 };
    return {
      posts: activeCampaign.themes.length,
      productions: activeCampaign.productionDates.length
    };
  }, [activeCampaign]);

  // Load existing report data if any
  useEffect(() => {
    if (selectedProjectId) {
      const existing = performances.find(p => 
        p.projectId === selectedProjectId && 
        p.month === selectedMonth && 
        p.year === selectedYear
      );
      if (existing) {
        const newMetrics = { ...metrics };
        existing.metrics.forEach(m => {
          newMetrics[m.platform] = { 
            followers: m.followers, 
            totalFollowers: m.totalFollowers || 0,
            reach: m.reach,
            engagement: m.engagement || 0,
            leads: m.leads || 0,
            interactions: m.interactions || 0
          };
        });
        setMetrics(newMetrics);
        setActivePlatforms(existing.metrics.map(m => m.platform));
        setExtraWorks(existing.extraWorks);
        setExecutiveSummary(existing.executiveSummary || '');
        setDemographics(existing.demographics || getFreshDemographics());
        setBestPosts(existing.bestPosts || [
          { title: '', reach: 0, reactions: 0 },
          { title: '', reach: 0, reactions: 0 },
          { title: '', reach: 0, reactions: 0 }
        ]);
      } else if (!isEditing) {
        // Reset to zeros if no report exists and not in editing mode (which might be used to create new)
        setMetrics({
          Instagram: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
          Facebook: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
          TikTok: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
          LinkedIn: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
          YouTube: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 }
        });
        setActivePlatforms(['Instagram']);
        setExtraWorks([]);
        setExecutiveSummary('');
        setDemographics(getFreshDemographics());
        setBestPosts([
          { title: '', reach: 0, reactions: 0 },
          { title: '', reach: 0, reactions: 0 },
          { title: '', reach: 0, reactions: 0 }
        ]);
      }
    }
  }, [selectedProjectId, selectedMonth, selectedYear, performances, isEditing]);

  const handleTogglePlatform = (p: SocialPlatform) => {
    setActivePlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleMetricChange = (platform: SocialPlatform, field: keyof typeof metrics[SocialPlatform], value: string) => {
    const num = parseFloat(value) || 0;
    setMetrics(prev => {
      const next = {
        ...prev,
        [platform]: { ...prev[platform], [field]: num }
      };
      
      // Auto-calculate engagement: (Interactions / Reach) * 100
      if (field === 'interactions' || field === 'reach') {
        const reach = field === 'reach' ? num : next[platform].reach;
        const interactions = field === 'interactions' ? num : next[platform].interactions;
        if (reach > 0) {
          next[platform].engagement = parseFloat(((interactions / reach) * 100).toFixed(2));
        } else {
          next[platform].engagement = 0;
        }
      }
      
      return next;
    });
  };

  const handleAddExtraWork = () => {
    setExtraWorks(prev => [...prev, { description: '', date: new Date().toISOString().split('T')[0] }]);
  };

  const handleExtraWorkChange = (index: number, field: 'description' | 'date', value: string) => {
    const next = [...extraWorks];
    next[index] = { ...next[index], [field]: value };
    setExtraWorks(next);
  };

  const handleRemoveExtraWork = (index: number) => {
    setExtraWorks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveReport = async () => {
    if (!selectedProjectId) {
      showToast("Selecciona una marca primero", "error");
      return;
    }

    const payload = {
      projectId: selectedProjectId,
      month: selectedMonth,
      year: selectedYear,
      metrics: activePlatforms.map(p => ({
        platform: p,
        followers: metrics[p].followers,
        totalFollowers: metrics[p].totalFollowers,
        reach: metrics[p].reach,
        engagement: metrics[p].engagement,
        leads: metrics[p].leads,
        interactions: metrics[p].interactions
      })),
      extraWorks: extraWorks.map((ew, i) => ({ ...ew, id: `ew-${Date.now()}-${i}` })),
      manualPostsCount: autoData.posts,
      manualProductionsCount: autoData.productions,
      executiveSummary: executiveSummary,
      bestPosts: bestPosts.filter(p => p.title || p.reach || p.reactions),
      demographics: demographics
    };

    const existing = performances.find(p => 
      p.projectId === selectedProjectId && 
      p.month === selectedMonth && 
      p.year === selectedYear
    );

    if (existing) {
      await updatePerformance(existing.id, payload);
      showToast("Reporte actualizado correctamente");
    } else {
      await addPerformance(payload);
      showToast("Reporte creado en la bóveda");
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedProject) return;
    setIsDownloading(true);
    
    // Save first to ensure data is persistent
    await handleSaveReport();

    // Logic for PDF capture
    setTimeout(async () => {
      const element = document.getElementById('performance-pdf-content');
      if (!element) {
        setIsDownloading(false);
        return;
      }

      try {
        const html2canvasLib = (window as any).html2canvas;
        const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;

        if (!html2canvasLib || !jsPDFLib) {
          showToast("Librerías de PDF no cargadas. Reintenta.", "error");
          setIsDownloading(false);
          return;
        }

        // Pre-load logo to base64
        let logoData = null;
        if (studioLogo) {
          try {
            if (studioLogo.startsWith('data:')) {
              logoData = studioLogo;
            } else {
              const response = await fetch(studioLogo);
              const blob = await response.blob();
              logoData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            }
          } catch (err) {
            console.error("Error loading studio logo:", err);
          }
        }

        const pdf = new jsPDFLib('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const capturePage = async (element: HTMLElement, pageNum: number) => {
          if (pageNum > 1) pdf.addPage();
          
          const canvas = await html2canvasLib(element, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFFFF',
            windowWidth: 1200,
            width: 1200
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        };

        const pages = ['pdf-page-1', 'pdf-page-2', 'pdf-page-3'];
        let capturedCount = 0;
        
        for (const pageId of pages) {
          const el = document.getElementById(pageId);
          if (el) {
            capturedCount++;
            await capturePage(el, capturedCount);
          }
        }

        // Add Official Footer to all pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          
          // White footer area
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
          
          // Separator Line
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.3);
          pdf.line(10, pageHeight - 16, pageWidth - 10, pageHeight - 16);
          
          if (logoData) {
             try {
                // Square logo on the left (matching image)
                pdf.addImage(logoData, 'PNG', 10, pageHeight - 13.5, 6, 6);
             } catch(e) {}
          }
          
          pdf.setFontSize(7);
          pdf.setTextColor(160, 160, 160);
          const footerLeftText = `Documento Confidencial - Reporte de Rendimiento ${selectedMonth} ${selectedYear} - ${selectedProject.name.toUpperCase()}`;
          pdf.text(footerLeftText, 18, pageHeight - 9.5);
          
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.setFont(undefined, 'bold');
          pdf.text(`PÁGINA ${i} DE ${totalPages}`, pageWidth - 10, pageHeight - 9.5, { align: 'right' });
          pdf.setFont(undefined, 'normal');
        }

        pdf.save(`PERFORMANCE_${selectedProject.name.toUpperCase()}_${selectedMonth.toUpperCase()}_${selectedYear}.pdf`);
      } catch (err) {
        console.error(err);
        showToast("Error generando PDF", "error");
      } finally {
        setIsDownloading(false);
      }
    }, 500);
  };

  const getComparison = (platform: SocialPlatform, field: 'followers' | 'reach' | 'interactions') => {
    const currentMetric = metrics[platform][field];
    const prevMonthIdx = MONTHS.indexOf(selectedMonth) - 1;
    const prevMonth = prevMonthIdx < 0 ? MONTHS[11] : MONTHS[prevMonthIdx];
    const prevYear = prevMonthIdx < 0 ? selectedYear - 1 : selectedYear;

    const prevReport = performances.find(p => 
      p.projectId === selectedProjectId && 
      p.month === prevMonth && 
      p.year === prevYear
    );

    if (!prevReport) return null;
    const prevMetric = prevReport.metrics.find(m => m.platform === platform)?.[field] || 0;
    if (prevMetric === 0) return null;

    const diff = currentMetric - prevMetric;
    const percent = ((diff / prevMetric) * 100).toFixed(1);
    return { diff, percent, increased: diff >= 0, prevValue: prevMetric };
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-32 bg-transparent relative pattern-orbital">
      {/* Luces ambientales refinadas */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-24 w-[350px] h-[350px] bg-primary/3 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="p-4 sm:p-10 space-y-12 max-w-[1600px] mx-auto relative z-10">
        {/* HEADER */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/strategy')}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black group shrink-0"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10 shrink-0">
                <TrendingUp className="text-primary w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  {isViewingDashboard && !new URLSearchParams(window.location.search).get('project') && (
                    <button 
                      onClick={() => setIsViewingDashboard(false)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all mr-2"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                    Rendimiento <span className="text-primary">{isViewingDashboard ? 'Dashboard' : 'Maestro'}</span>
                  </h1>
                </div>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2">
                {isViewingDashboard ? `Gestionando reportes de ${selectedProject?.name}` : 'Análisis estratégico y reporte de impacto mensual'}
              </p>
            </div>
          </div>
        </div>
      </div>

        <AnimatePresence mode="wait">
          {!isViewingDashboard ? (
            <motion.div 
              key="brand-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setIsViewingDashboard(true);
                    setIsEditing(false);
                  }}
                  className="group relative glass-panel p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/30 transition-all text-left overflow-hidden hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all">
                    <Trophy className="w-20 h-20 text-primary" />
                  </div>
                  
                  <div className="relative space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-background-dark border border-white/10 flex items-center justify-center overflow-hidden shadow-inner shadow-black/50">
                      {p.logoUrl ? (
                         <img src={p.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                      ) : (
                         <Users className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{p.client}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-500 uppercase">Reportes</span>
                          <span className="text-sm font-black text-white">{performances.filter(perf => perf.projectId === p.id).length}</span>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                       </div>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {/* VAULT: BÓVEDA DE REPORTES */}
              <section className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Bóveda de Rendimiento
                  </h3>
                  <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                    {brandReports.length} Periodos Guardados
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   <button
                     onClick={() => {
                       setSelectedMonth(MONTHS[new Date().getMonth()]);
                       setSelectedYear(new Date().getFullYear());
                       setMetrics({
                          Instagram: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
                          Facebook: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
                          TikTok: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
                          LinkedIn: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 },
                          YouTube: { followers: 0, totalFollowers: 0, reach: 0, engagement: 0, leads: 0, interactions: 0 }
                       });
                       setActivePlatforms(['Instagram']);
                       setExtraWorks([]);
                       setDemographics(getFreshDemographics());
                       setIsEditing(true);
                       showToast("Iniciando nuevo periodo...");
                     }}
                     className="shrink-0 p-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-2 min-w-[120px] group"
                   >
                     <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">Crear Periodo</span>
                   </button>

                   {brandReports.map(report => (
                     <div key={report.id} className="relative group/item shrink-0">
                       <button
                         onClick={() => {
                           setSelectedMonth(report.month);
                           setSelectedYear(report.year);
                           setIsEditing(true);
                         }}
                         className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 min-w-[120px] h-full ${
                            selectedMonth === report.month && selectedYear === report.year && isEditing
                              ? 'bg-primary/20 border-primary/50 shadow-xl shadow-primary/10'
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                         }`}
                       >
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{report.year}</span>
                         <span className="text-sm font-black text-white italic uppercase tracking-tighter">{report.month}</span>
                         <CheckCircle2 className={`w-4 h-4 ${selectedMonth === report.month && selectedYear === report.year && isEditing ? 'text-primary' : 'text-emerald-500/30'}`} />
                       </button>
                       
                       <button
                         onClick={async (e) => {
                           e.stopPropagation();
                           if (reportIdToDelete === report.id) {
                             await deletePerformance(report.id);
                             setReportIdToDelete(null);
                           } else {
                             setReportIdToDelete(report.id);
                             // Auto-reset if not confirmed within 4 seconds
                             setTimeout(() => setReportIdToDelete(null), 4000);
                           }
                         }}
                         className={`absolute top-2 right-2 h-7 rounded-xl flex items-center justify-center transition-all shadow-xl z-20 group/delete ${
                           reportIdToDelete === report.id 
                             ? 'bg-amber-500 text-white px-3 w-auto scale-100 opacity-100 ring-2 ring-amber-400/50' 
                             : 'bg-rose-500 text-white w-7 opacity-0 group-hover/item:opacity-100 hover:bg-rose-600 hover:scale-110 active:scale-95'
                         }`}
                       >
                         {reportIdToDelete === report.id ? (
                           <span className="text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                             ¿Confirmar?
                           </span>
                         ) : (
                           <Trash2 className="w-3.5 h-3.5" />
                         )}
                       </button>
                     </div>
                   ))}
                </div>
              </section>

              {/* FOCUSED EDITOR */}
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="active-editor"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-10"
                  >
                    <div className="flex items-center justify-between py-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                         </div>
                         <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Gestionando: {selectedMonth} {selectedYear}</h2>
                      </div>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 hover:border-rose-500/30 transition-all text-slate-300"
                      >
                        Cerrar Periodo
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                      <div className="lg:col-span-8 space-y-10">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <section className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                               <CalendarIcon className="w-4 h-4 text-primary" />
                               Periodo de Análisis
                             </h3>
                             <div className="grid grid-cols-2 gap-4">
                               <select 
                                 value={selectedMonth}
                                 onChange={(e) => setSelectedMonth(e.target.value)}
                                 className="bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold transition-all"
                               >
                                 {MONTHS.map(m => <option key={m} value={m} className="bg-background-dark">{m}</option>)}
                               </select>
                               <select 
                                 value={selectedYear}
                                 onChange={(e) => setSelectedYear(Number(e.target.value))}
                                 className="bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold transition-all"
                               >
                                 {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-background-dark">{y}</option>)}
                               </select>
                             </div>
                           </section>
                           <section className="glass-panel p-8 rounded-[2.5rem] space-y-6">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                               <Plus className="w-4 h-4 text-primary" />
                               Canales a Reportar
                             </h3>
                             <div className="flex flex-wrap gap-3">
                               {PLATFORMS.map(p => (
                                 <button
                                   key={p.id}
                                   onClick={() => handleTogglePlatform(p.id)}
                                   className={`p-3 rounded-xl transition-all border flex items-center justify-center ${
                                     activePlatforms.includes(p.id)
                                       ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                       : 'bg-white/5 border-transparent text-slate-600 grayscale opacity-50'
                                   }`}
                                 >
                                   <p.icon className="w-5 h-5 transition-all" style={{ color: activePlatforms.includes(p.id) ? p.color : undefined }} />
                                 </button>
                               ))}
                             </div>
                           </section>
                        </div>

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                             <Users className="w-4 h-4 text-primary" />
                             Carga de Datos Demográficos (Manual)
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-6">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Público por Edad (%)</p>
                                 <div className="space-y-4">
                                    {demographics.ageGender.map((ag, i) => (
                                       <div key={ag.age} className="grid grid-cols-12 gap-3 items-center">
                                          <div className="col-span-3 text-[10px] font-black text-white italic uppercase">{ag.age}</div>
                                          <div className="col-span-4">
                                             <input 
                                                type="number" 
                                                placeholder="Mujer %" 
                                                value={ag.female || ''} 
                                                onChange={(e) => handleDemographicChange(i, 'female', e.target.value)}
                                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg p-2 text-white text-[10px] font-bold text-center"
                                             />
                                          </div>
                                          <div className="col-span-4">
                                             <input 
                                                type="number" 
                                                placeholder="Hombre %" 
                                                value={ag.male || ''} 
                                                onChange={(e) => handleDemographicChange(i, 'male', e.target.value)}
                                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg p-2 text-white text-[10px] font-bold text-center"
                                             />
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                              <div className="space-y-6">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Top 5 Ciudades (%)</p>
                                 <div className="space-y-4">
                                    {demographics.topCities.map((city, i) => (
                                       <div key={i} className="grid grid-cols-12 gap-3 items-center">
                                          <div className="col-span-7">
                                             <input 
                                                type="text" 
                                                placeholder="Ciudad" 
                                                value={city.name} 
                                                onChange={(e) => handleCityChange(i, 'name', e.target.value)}
                                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg p-2 text-white text-[10px] font-bold"
                                             />
                                          </div>
                                          <div className="col-span-5">
                                             <input 
                                                type="number" 
                                                placeholder="%" 
                                                value={city.value || ''} 
                                                onChange={(e) => handleCityChange(i, 'value', e.target.value)}
                                                className="w-full bg-background-dark/50 border border-white/10 rounded-lg p-2 text-white text-[10px] font-bold text-center"
                                             />
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </section>

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Carga de Datos Mensuales
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activePlatforms.map(platform => {
                              const pInfo = PLATFORMS.find(x => x.id === platform)!;
                              const fComp = getComparison(platform, 'followers');
                              const rComp = getComparison(platform, 'reach');
                              return (
                                <div key={platform} className="p-8 rounded-[2.5rem] bg-[#0f172a]/40 border border-white/5 space-y-8 hover:bg-[#0f172a]/60 transition-all group shadow-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    <pInfo.icon className="w-20 h-20" />
                                  </div>
                                  <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3.5 rounded-[1.2rem] bg-background-dark border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
                                      <pInfo.icon className="w-6 h-6" style={{ color: pInfo.color }} />
                                    </div>
                                    <span className="text-base font-black text-white uppercase italic tracking-tighter">{platform}</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-8 relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Followers Nuevos</label>
                                        <div className="space-y-2">
                                          <input type="number" value={metrics[platform].followers || ''} onChange={(e) => handleMetricChange(platform, 'followers', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-white text-base font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                          {fComp && (
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${fComp.increased ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                              <span className="text-[10px] font-black">{fComp.increased ? '▲' : '▼'} {fComp.percent}%</span>
                                              <span className="text-[8px] font-bold opacity-50 uppercase">MoM</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Comunidad Total</label>
                                        <input type="number" value={metrics[platform].totalFollowers || ''} onChange={(e) => handleMetricChange(platform, 'totalFollowers', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-white text-base font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Alcance Mensual</label>
                                      <div className="space-y-2">
                                        <input type="number" value={metrics[platform].reach || ''} onChange={(e) => handleMetricChange(platform, 'reach', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-white text-base font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                        {rComp && (
                                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${rComp.increased ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            <span className="text-[10px] font-black">{rComp.increased ? '▲' : '▼'} {rComp.percent}%</span>
                                            <span className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-3">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Interacciones</label>
                                          <input type="number" value={metrics[platform].interactions || ''} onChange={(e) => handleMetricChange(platform, 'interactions', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-white text-base font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                       </div>
                                       <div className="space-y-3">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 text-right">Leads</label>
                                          <input type="number" value={metrics[platform].leads || ''} onChange={(e) => handleMetricChange(platform, 'leads', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-white text-base font-bold text-right focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                       </div>
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Engagement Rate (%)</label>
                                      <input type="number" step="0.1" value={metrics[platform].engagement || ''} onChange={(e) => handleMetricChange(platform, 'engagement', e.target.value)} className="w-full bg-background-dark/80 border border-white/10 rounded-2xl p-4 text-primary text-base font-black focus:outline-none focus:border-primary/50 transition-all shadow-inner" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Trophy className="w-4 h-4 text-primary" />
                            Top 3 Publicaciones del Mes
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[0, 1, 2].map((idx) => (
                              <div key={idx} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-5 group relative">
                                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs italic shadow-lg shadow-primary/20 z-10">
                                  #{idx + 1}
                                </div>
                                
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] px-1">Miniatura (4:5)</label>
                                  <div className="relative aspect-[4/5] rounded-[2rem] bg-background-dark border border-white/5 overflow-hidden group/thumb shadow-inner">
                                    {bestPosts[idx]?.imageUrl ? (
                                      <img src={bestPosts[idx].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600 group-hover:text-primary transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                           <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Subir Imagen</span>
                                      </div>
                                    )}
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            const next = [...bestPosts];
                                            next[idx] = { ...next[idx], imageUrl: reader.result as string };
                                            setBestPosts(next);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer" 
                                    />
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] px-1">Título</label>
                                    <input 
                                      type="text" 
                                      placeholder="Nombre del post..."
                                      value={bestPosts[idx]?.title || ''}
                                      onChange={(e) => {
                                        const next = [...bestPosts];
                                        next[idx] = { ...next[idx], title: e.target.value };
                                        setBestPosts(next);
                                      }}
                                      className="w-full bg-background-dark/30 border border-white/5 rounded-xl p-4 text-white text-xs font-bold"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] px-1">Alcance</label>
                                      <input 
                                        type="number" 
                                        placeholder="0"
                                        value={bestPosts[idx]?.reach || ''}
                                        onChange={(e) => {
                                          const next = [...bestPosts];
                                          next[idx] = { ...next[idx], reach: parseInt(e.target.value) || 0 };
                                          setBestPosts(next);
                                        }}
                                        className="w-full bg-background-dark/30 border border-white/5 rounded-xl p-4 text-white text-xs font-bold"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] px-1">Reacc.</label>
                                      <input 
                                        type="number" 
                                        placeholder="0"
                                        value={bestPosts[idx]?.reactions || ''}
                                        onChange={(e) => {
                                          const next = [...bestPosts];
                                          next[idx] = { ...next[idx], reactions: parseInt(e.target.value) || 0 };
                                          setBestPosts(next);
                                        }}
                                        className="w-full bg-background-dark/30 border border-white/5 rounded-xl p-4 text-white text-xs font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Target className="w-4 h-4 text-primary" />
                            Análisis Estratégico (Resumen Ejecutivo)
                          </h3>
                          <textarea
                            value={executiveSummary}
                            onChange={(e) => setExecutiveSummary(e.target.value)}
                            placeholder="Escribe aquí tus conclusiones del mes, hitos logrados y recomendaciones para el siguiente periodo..."
                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white text-base min-h-[200px] focus:outline-none focus:border-primary/50 transition-all font-medium leading-[1.8]"
                          />
                        </section>

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                              <Plus className="w-4 h-4 text-primary" />
                              Valor Añadido
                            </h3>
                            <button onClick={handleAddExtraWork} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                               <Plus className="w-4 h-4" /> Nuevo Item
                            </button>
                          </div>
                          <div className="space-y-4">
                            {extraWorks.map((work, idx) => (
                              <div key={idx} className="flex gap-4 items-center">
                                <div className="grow grid grid-cols-12 gap-4">
                                  <div className="col-span-8">
                                    <input type="text" value={work.description} onChange={(e) => handleExtraWorkChange(idx, 'description', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] font-bold focus:outline-none focus:border-primary/50 transition-all text-xs" />
                                  </div>
                                  <div className="col-span-4">
                                    <input type="date" value={work.date} onChange={(e) => handleExtraWorkChange(idx, 'date', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[11px] font-bold focus:outline-none focus:border-primary/50 transition-all text-xs" />
                                  </div>
                                </div>
                                <button onClick={() => handleRemoveExtraWork(idx)} className="p-3 text-slate-600 hover:text-rose-500 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="lg:col-span-4 space-y-8 sticky top-10">
                        {/* KPI COMPARATIVE VS PREVIOUS MONTH */}
                        {prevMonthReport && (
                          <section className="glass-panel p-8 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10 space-y-6">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                              <TrendingUp className="w-4 h-4" />
                              Comparativa vs Mes Anterior
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase">Alcance Prev.</p>
                                <p className="text-sm font-black text-white italic">{prevMonthReport.metrics.reduce((acc, m) => acc + (m.reach || 0), 0).toLocaleString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase">Interac. Prev.</p>
                                <p className="text-sm font-black text-white italic">{prevMonthReport.metrics.reduce((acc, m) => acc + (m.interactions || 0), 0).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-indigo-500/10">
                               <p className="text-[9px] font-bold text-indigo-300/50 uppercase tracking-widest italic">Comparando con {prevMonthReport.month} {prevMonthReport.year}</p>
                            </div>
                          </section>
                        )}

                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8 bg-[#0f172a]/40">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Monitor className="w-4 h-4 text-primary" />
                            Resumen Operativo
                          </h3>
                          <div className="space-y-6">
                            <div className="p-8 rounded-[2rem] bg-background-dark/50 border border-white/5 relative overflow-hidden group shadow-inner">
                              <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-all"></div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Impactos Digitales</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white italic tracking-tighter">{autoData.posts}</span>
                                <span className="text-[11px] font-bold text-primary uppercase italic">Contenidos</span>
                              </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-background-dark/50 border border-white/5 relative overflow-hidden group shadow-inner">
                              <div className="absolute top-0 left-0 w-1 h-full bg-slate-500/30 group-hover:bg-slate-500 transition-all"></div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Producciones</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white italic tracking-tighter">{autoData.productions}</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase italic">Jornadas</span>
                              </div>
                            </div>
                          </div>

                          {/* PREVIEW OF BITACORA IN EDITOR */}
                          <div className="pt-8 border-t border-white/5 space-y-6">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Bitácora Detectada ({operationalLogs.length})
                             </h4>
                             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                               {operationalLogs.length > 0 ? operationalLogs.slice(0, 10).map((log, i) => (
                                 <div key={i} className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 gap-1">
                                   <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-primary uppercase italic">{log.title}</span>
                                      <span className="text-[8px] font-mono text-slate-500 italic">{log.date ? format(new Date(log.date + 'T12:00:00'), 'dd MMM') : 'S/F'}</span>
                                   </div>
                                 </div>
                               )) : (
                                 <p className="text-[9px] font-bold text-slate-600 uppercase italic py-4 text-center">Sin actividad registrada este mes</p>
                               )}
                             </div>
                          </div>

                          <div className="pt-8 border-t border-white/5 space-y-4">
                            <button onClick={handleSaveReport} className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-lg shadow-emerald-500/20" /> Sincronizar Bóveda
                            </button>
                            <button disabled={isDownloading} onClick={handleDownloadPDF} className="w-full py-6 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-dark text-white font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_20px_50px_rgba(225,48,108,0.3)]">
                               {isDownloading ? 'Generando Inteligencia...' : 'Descargar Reporte Pro'}
                            </button>
                          </div>
                        </section>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-32 flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/10 opacity-30 shadow-2xl">
                       <LayoutDashboard className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Bóveda Seleccionada: {selectedProject?.name}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] max-w-[400px]">
                        Haz clic en un reporte guardado para editarlo o pulsa "Crear Periodo" para iniciar un nuevo registro mensual.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HIDDEN PDF CONTENT: PROFESSIONAL DASHBOARD STYLE */}
      <div className="fixed left-[-9999px] top-0">
        <div id="performance-pdf-content" className="w-[1240px] bg-[#f8fafc] text-slate-900 font-sans">
          {selectedProject && (() => {
            const totalLeads = activePlatforms.reduce((acc, p) => acc + (metrics[p].leads || 0), 0);
            const totalInteractions = activePlatforms.reduce((acc, p) => acc + (metrics[p].interactions || 0), 0);
            const totalReach = activePlatforms.reduce((acc, p) => acc + (metrics[p].reach || 0), 0);
            const totalNewFollowers = activePlatforms.reduce((acc, p) => acc + (metrics[p].followers || 0), 0);
            const totalCommunity = activePlatforms.reduce((acc, p) => acc + (metrics[p].totalFollowers || 0), 0);
            const totalEngagement = totalReach > 0 ? (totalInteractions / totalReach) * 100 : 0;

            // Prev month totals
            const prevMetrics = prevMonthReport?.metrics || [];
            const prevTotalInteractions = prevMetrics.reduce((acc, m) => acc + (m.interactions || 0), 0);
            const prevTotalReach = prevMetrics.reduce((acc, m) => acc + (m.reach || 0), 0);
            const prevTotalLeads = prevMetrics.reduce((acc, m) => acc + (m.leads || 0), 0);
            const prevTotalNewFollowers = prevMetrics.reduce((acc, m) => acc + (m.followers || 0), 0);
            const prevTotalEngagement = prevTotalReach > 0 ? (prevTotalInteractions / prevTotalReach) * 100 : 0;

            const momInteractions = calculateMoM(totalInteractions, prevTotalInteractions);
            const momReach = calculateMoM(totalReach, prevTotalReach);
            const momLeads = calculateMoM(totalLeads, prevTotalLeads);
            const momFollowers = calculateMoM(totalNewFollowers, prevTotalNewFollowers);
            const momEngagement = calculateMoM(totalEngagement, prevTotalEngagement);
            const hasLeads = totalLeads > 0;
            const hasInteractions = totalInteractions > 0;

            return (
              <div className="bg-white font-sans text-slate-900">
                {/* PAGE 1: REFINED COVER & SUMMARY */}
                <div id="pdf-page-1" className="p-20 min-h-[1754px] w-[1200px] bg-white relative flex flex-col border-[20px] border-slate-50">
                    <div className="flex items-center gap-10 border-b border-slate-200 pb-12 mb-16">
                       {selectedProject.logoUrl && (
                          <img src={selectedProject.logoUrl} crossOrigin="anonymous" className="h-24 w-auto object-contain" alt="" />
                       )}
                       <div className="space-y-3">
                          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900">REPORTE DE RENDIMIENTO</h1>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="px-5 py-1.5 bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest rounded-sm">{selectedMonth} {selectedYear}</span>
                             <div className="h-[1px] w-12 bg-slate-300"></div>
                             <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                               Ciclo: {safeFormat(getPeriodRange(selectedMonth, selectedYear).start.toISOString(), 'dd/MM')} - {safeFormat(getPeriodRange(selectedMonth, selectedYear).end.toISOString(), 'dd/MM')}
                             </span>
                          </div>
                       </div>
                    </div>

                    {/* REFINED KPI GRID - RESUMEN DE MÉTRICAS */}
                    <div className="mb-12">
                       <div className="flex items-center gap-4 mb-8">
                          <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-widest">Resumen General de Métricas</h2>
                          <div className="h-[1px] grow bg-slate-100"></div>
                       </div>
                       <div className="grid grid-cols-5 gap-4">
                         {/* Card 1: Engagement */}
                         <div className="bg-[#dbdbdb] p-6 pt-5 space-y-4 rounded-2xl flex flex-col justify-between border border-slate-300 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Engagement</p>
                            <div className="space-y-1">
                               <p className="text-4xl font-black italic tracking-tighter text-slate-900">{totalEngagement.toFixed(1)}<span className="text-xl ml-0.5 text-slate-500">%</span></p>
                               {momEngagement && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momEngagement.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                     <span className="text-[11px] font-black uppercase font-bold">{momEngagement.isPositive ? '↑' : '↓'} {momEngagement.value}%</span>
                                     <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Card 2: Interacciones */}
                         <div className="bg-[#dbdbdb] p-6 pt-5 space-y-4 rounded-2xl flex flex-col justify-between border border-slate-300 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Interacciones</p>
                            <div className="space-y-1">
                               <p className="text-4xl font-black italic tracking-tighter text-slate-900">{totalInteractions.toLocaleString()}</p>
                               {momInteractions && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momInteractions.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                     <span className="text-[11px] font-black uppercase font-bold">{momInteractions.isPositive ? '↑' : '↓'} {momInteractions.value}%</span>
                                     <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Card 3: Alcance Neto */}
                         <div className="bg-[#dbdbdb] p-6 pt-5 space-y-4 rounded-2xl flex flex-col justify-between border border-slate-300 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Alcance Neto</p>
                            <div className="space-y-1">
                               <p className="text-4xl font-black italic tracking-tighter text-slate-900">{totalReach.toLocaleString()}</p>
                               {momReach && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momReach.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                     <span className="text-[11px] font-black uppercase font-bold">{momReach.isPositive ? '↑' : '↓'} {momReach.value}%</span>
                                     <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Card 4: Leads */}
                         <div className="bg-[#dbdbdb] p-6 pt-5 space-y-4 rounded-2xl flex flex-col justify-between border border-slate-300 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Leads Gen.</p>
                            <div className="space-y-1">
                               <p className="text-4xl font-black italic tracking-tighter text-slate-900">{totalLeads.toLocaleString()}</p>
                               {momLeads && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momLeads.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                     <span className="text-[11px] font-black uppercase font-bold">{momLeads.isPositive ? '↑' : '↓'} {momLeads.value}%</span>
                                     <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Card 5: Followers */}
                         <div className="bg-[#dbdbdb] p-6 pt-5 space-y-4 rounded-2xl flex flex-col justify-between border border-slate-300 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Crecimiento</p>
                            <div className="space-y-1">
                               <p className="text-4xl font-black italic tracking-tighter text-slate-900">+{totalNewFollowers.toLocaleString()}</p>
                               {momFollowers && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momFollowers.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                     <span className="text-[11px] font-black uppercase font-bold">{momFollowers.isPositive ? '↑' : '↓'} {momFollowers.value}%</span>
                                     <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                                  </div>
                               )}
                            </div>
                         </div>
                       </div>
                    </div>

                    {/* TOP CONTENT (HORIZONTAL 3-COLUMN, IMAGE LEFT DATA RIGHT) */}
                    {bestPosts.some(p => p.title || p.reach || p.reactions) && (
                       <div className="space-y-10">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                             <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">CONTENIDO DE ALTO IMPACTO</h3>
                             <Trophy className="text-slate-900 w-5 h-5" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                             {bestPosts.filter(p => p.title || p.reach || p.reactions).map((post, i) => (
                                <div key={i} className="flex flex-col bg-[#dbdbdb] p-5 rounded-2xl border border-slate-300">
                                   <div className="flex gap-4 items-center">
                                      <div className="aspect-[4/5] w-20 bg-slate-200 relative overflow-hidden border border-slate-300 rounded-lg flex-shrink-0">
                                         {post.imageUrl && <img src={post.imageUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="" />}
                                         <div className="absolute top-1 left-1 w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-black text-[8px] italic">0{i + 1}</div>
                                      </div>
                                      <div className="flex-grow space-y-2">
                                         <p className="text-[10px] font-black text-slate-900 uppercase italic leading-tight line-clamp-2 min-h-[2.5em]">{post.title || 'Post sin título'}</p>
                                         <div className="grid grid-cols-1 gap-1 pt-2 border-t border-slate-300">
                                            <div className="flex justify-between items-center">
                                               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">ALCANCE</p>
                                               <p className="text-xs font-black italic">{(post.reach || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">INT.</p>
                                               <p className="text-xs font-black italic">{(post.reactions || 0).toLocaleString()}</p>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* STRATEGIC SUMMARY (NOW RIGHT BELOW TOP 3) */}
                    {executiveSummary && (
                       <div className="mt-12 space-y-6">
                         <div className="bg-[#dbdbdb] p-10 border border-slate-300 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                              <Target className="w-24 h-24 text-slate-900" />
                            </div>
                            <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Análisis Estratégico y Conclusiones</p>
                            <p className="text-slate-700 text-xl leading-relaxed font-medium tracking-normal whitespace-pre-wrap relative z-10">{executiveSummary}</p>
                         </div>
                       </div>
                    )}
                </div>

                {/* PAGE 2: ANALYTICS & DEMOGRAPHICS */}
                <div id="pdf-page-2" className="p-20 min-h-[1754px] w-[1200px] bg-white relative space-y-12 flex flex-col border-[20px] border-slate-50" style={{ pageBreakBefore: 'always' }}>
                    <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                      <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Rendimiento por Canal</h3>
                      <Monitor className="text-slate-900 w-8 h-8" />
                    </div>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                            <th className="p-6 text-left">Plataforma</th>
                            <th className="p-6 text-right">Crecimiento Neto</th>
                            <th className="p-6 text-right">Comunidad Total</th>
                            <th className="p-6 text-right">Alcance Mensual</th>
                            <th className="p-6 text-right">Interacciones</th>
                            <th className="p-6 text-right">Engagement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activePlatforms.map(platform => {
                              const fComp = getComparison(platform, 'followers');
                              const rComp = getComparison(platform, 'reach');
                              const iComp = getComparison(platform, 'interactions');
                              return (
                                <tr key={platform} className="even:bg-slate-50 hover:bg-slate-100 transition-colors">
                                  <td className="p-6 flex items-center gap-6">
                                    <div className="p-3 bg-slate-100 rounded-xl">
                                      {PLATFORMS.find(p => p.id === platform)?.icon && React.createElement(PLATFORMS.find(p => p.id === platform)!.icon, { className: "w-5 h-5 text-slate-900" })}
                                    </div>
                                    <span className="font-black text-slate-900 text-base uppercase italic tracking-tight">{platform}</span>
                                  </td>
                                  <td className="p-6 text-right">
                                    <p className="text-lg font-black text-slate-900 leading-none">+{metrics[platform]?.followers?.toLocaleString() || '0'}</p>
                                    {fComp && (
                                       <p className={`text-[11px] font-black uppercase leading-none mt-2 ${fComp.increased ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {fComp.increased ? '↑' : '↓'} {fComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                       </p>
                                    )}
                                  </td>
                                  <td className="p-6 text-right font-black text-slate-700 text-lg leading-none">{metrics[platform]?.totalFollowers?.toLocaleString() || '-'}</td>
                                  <td className="p-6 text-right">
                                    <p className="font-black text-slate-700 text-lg leading-none">{metrics[platform]?.reach?.toLocaleString() || '0'}</p>
                                    {rComp && (
                                       <p className={`text-[11px] font-black uppercase leading-none mt-2 ${rComp.increased ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {rComp.increased ? '↑' : '↓'} {rComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                       </p>
                                    )}
                                  </td>
                                  <td className="p-6 text-right">
                                    <p className="font-black text-slate-700 text-lg">{metrics[platform]?.interactions?.toLocaleString() || '0'}</p>
                                    {iComp && (
                                       <p className={`text-[11px] font-black uppercase ${iComp.increased ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {iComp.increased ? '↑' : '↓'} {iComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                       </p>
                                    )}
                                  </td>
                                  <td className="p-6 text-right">
                                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{metrics[platform]?.engagement || '0'}%</p>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {prevMonthReport && (
                      <div className="grid grid-cols-3 gap-6 pt-2">
                        <div className="bg-[#dbdbdb] p-5 rounded-2xl border border-slate-300">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Alcance Global</p>
                          <div className="flex items-end gap-6">
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                               <p className="text-2xl font-black text-slate-600 italic tracking-tighter">{prevTotalReach.toLocaleString()}</p>
                            </div>
                            <div className="text-slate-300 text-3xl font-light">/</div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-900 uppercase tracking-tighter">Mes: {selectedMonth}</p>
                               <p className="text-4xl font-black text-slate-900 italic tracking-tighter">{totalReach.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#dbdbdb] p-5 rounded-2xl border border-slate-300">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Interacciones</p>
                          <div className="flex items-end gap-6">
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                               <p className="text-2xl font-black text-slate-600 italic tracking-tighter">{prevTotalInteractions.toLocaleString()}</p>
                            </div>
                            <div className="text-slate-300 text-3xl font-light">/</div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-900 uppercase tracking-tighter">Mes: {selectedMonth}</p>
                               <p className="text-4xl font-black text-slate-900 italic tracking-tighter">{totalInteractions.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#dbdbdb] p-5 rounded-2xl border border-slate-300">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Seguidores Totales</p>
                          <div className="flex items-end gap-6">
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                               <p className="text-2xl font-black text-slate-600 italic tracking-tighter">{(prevMetrics.reduce((acc, m) => acc + (m.totalFollowers || 0), 0)).toLocaleString()}</p>
                            </div>
                            <div className="text-slate-300 text-3xl font-light">/</div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-bold text-slate-900 uppercase tracking-tighter">Mes: {selectedMonth}</p>
                               <p className="text-4xl font-black text-slate-900 italic tracking-tighter">{totalCommunity.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {demographics && (() => {
                    const totalFemale = demographics.ageGender.reduce((acc, curr) => acc + curr.female, 0);
                    const totalMale = demographics.ageGender.reduce((acc, curr) => acc + curr.male, 0);
                    const totalSum = totalFemale + totalMale || 1;
                    const menPercent = (totalMale / totalSum) * 100;
                    const womenPercent = (totalFemale / totalSum) * 100;
                    const pieData = [
                      { name: 'Hombres', value: totalMale, color: '#334155' },
                      { name: 'Mujeres', value: totalFemale, color: '#94a3b8' }
                    ];
                    return (
                      <div className="space-y-8 mt-4">
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Análisis de Audiencia</h4>
                          <div className="h-[1px] grow bg-slate-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-10">
                           {/* GENDER & AGE SIDE BY SIDE */}
                           <div className="bg-[#dbdbdb] p-8 border border-slate-300 rounded-2xl flex flex-col items-center">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-6 self-start">Distribución por Género</p>
                              <div className="flex items-center gap-6 w-full">
                                <div className="w-[180px] h-[180px]">
                                   <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                         <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                         >
                                            {pieData.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                         </Pie>
                                      </PieChart>
                                   </ResponsiveContainer>
                                </div>
                                <div className="space-y-4">
                                   <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full bg-slate-700" />
                                         <span className="text-[8px] font-black uppercase text-slate-500">Hombres</span>
                                      </div>
                                      <p className="text-2xl font-black italic text-slate-900">{menPercent.toFixed(1)}%</p>
                                   </div>
                                   <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full bg-slate-400" />
                                         <span className="text-[8px] font-black uppercase text-slate-500">Mujeres</span>
                                      </div>
                                      <p className="text-2xl font-black italic text-slate-900">{womenPercent.toFixed(1)}%</p>
                                   </div>
                                </div>
                              </div>
                           </div>

                           <div className="bg-[#dbdbdb] p-8 border border-slate-300 rounded-2xl">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-6">Distribución por Edad</p>
                              <div className="w-full h-[180px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demographics.ageGender} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                       <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#c0c0c0" />
                                       <XAxis dataKey="age" fontSize={9} fontWeight="700" axisLine={false} tickLine={false} stroke="#64748b" />
                                       <YAxis fontSize={9} fontWeight="700" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} stroke="#64748b" />
                                       <Bar name="Hombres" dataKey="male" fill="#334155" radius={[2, 2, 0, 0]} barSize={16}>
                                          <LabelList dataKey="male" position="top" fontSize={8} formatter={(v: number) => `${v}%`} />
                                       </Bar>
                                       <Bar name="Mujeres" dataKey="female" fill="#64748b" radius={[2, 2, 0, 0]} barSize={16}>
                                          <LabelList dataKey="female" position="top" fontSize={8} formatter={(v: number) => `${v}%`} />
                                       </Bar>
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                        </div>

                        {/* CITIES */}
                        <div className="mt-4 space-y-8 pt-4 border-t border-slate-100">
                           <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Regiones con Mayor Alcance</h4>
                           <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                              {demographics.topCities.filter(c => c.name).map((city, idx) => (
                                 <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                       <span className="text-sm font-black uppercase italic tracking-tighter text-slate-900">{city.name}</span>
                                       <span className="text-sm font-bold text-slate-400">{(city.value || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                       <div style={{ width: `${city.value}%` }} className="h-full bg-slate-900 rounded-full" />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* PAGE 3: OPERATION & EXTRA LOG */}
                <div id="pdf-page-3" className="p-20 min-h-[1754px] w-[1200px] bg-white relative space-y-20 flex flex-col border-[20px] border-slate-50" style={{ pageBreakBefore: 'always' }}>
                   <div className="space-y-10">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Resumen Operativo Mensual</h3>
                        <LayoutDashboard className="text-slate-900 w-8 h-8" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-10">
                         <div className="bg-[#dbdbdb] p-4 flex flex-col justify-between h-[85px] relative overflow-hidden rounded-xl border border-slate-300 shadow-sm">
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 text-slate-900">Publicaciones Totales</p>
                            <div className="relative">
                               <p className="text-4xl font-black italic leading-none tracking-tighter text-slate-900">{autoData.posts}</p>
                            </div>
                            <div className="h-0.5 w-6 bg-slate-900"></div>
                         </div>
                         
                         <div className="bg-[#dbdbdb] p-4 border border-slate-300 flex flex-col justify-between h-[85px] relative overflow-hidden rounded-xl">
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Producciones Audiovisuales</p>
                            <div className="relative">
                               <p className="text-4xl font-black italic leading-none tracking-tighter text-slate-900">{autoData.productions}</p>
                            </div>
                            <div className="h-0.5 w-6 bg-slate-900"></div>
                         </div>
                      </div>

                      {/* RESTORED PUBLICATION LOG */}
                      <div className="mt-8 space-y-6">
                          <div className="flex items-center gap-4">
                             <p className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Bitácora de Contenido Publicado</p>
                             <div className="h-[1px] grow bg-slate-200"></div>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                              <table className="w-full text-left font-sans border-collapse">
                                  <thead className="bg-[#dbdbdb] border-b border-slate-300">
                                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                          <th className="p-4 border-r border-slate-200">Fecha de Publicación</th>
                                          <th className="p-4 uppercase italic">Identificador del Contenido / Tema</th>
                                          <th className="p-4 text-center">Estado</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {operationalLogs.length > 0 ? operationalLogs.slice(0, 30).map((task, i) => (
                                          <tr key={i} className={`text-[11px] font-bold text-slate-800 ${i % 2 !== 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                              <td className="p-4 border-r border-slate-100 text-slate-600 font-mono italic">
                                                {safeFormat(task.date, 'dd/MM/yyyy')}
                                              </td>
                                              <td className="p-4 uppercase italic tracking-tighter">{task.title}</td>
                                              <td className="p-4 text-center">
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black uppercase tracking-tighter text-[9px]">
                                                     Ejecutado
                                                  </span>
                                              </td>
                                          </tr>
                                      )) : (
                                         <tr>
                                            <td colSpan={3} className="p-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest py-20 italic">Sin registros operativos específicos detectados</td>
                                         </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                   </div>

                   {extraWorks.length > 0 && (
                     <div className="space-y-8 grow">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Bitácora de Valor Agregado</h3>
                          <Plus className="text-slate-900 w-4 h-4" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                           {extraWorks.map((work, i) => (
                             <div key={i} className="p-6 border border-slate-300 flex items-center gap-6 group bg-[#dbdbdb] rounded-lg">
                                <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-black text-xs italic rounded-full flex-shrink-0">0{i+1}</div>
                                <div className="space-y-1">
                                   <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{work.description}</p>
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{work.date}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   <div className="mt-auto pt-16 flex justify-between items-end border-t border-slate-100">
                     <div className="space-y-2">
                        
                        
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">© 2026 REPORTE DE RENDIMIENTO GLOBAL</p>
                     </div>
                   </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Performance;
