import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project, Task, Campaign, PerformanceReport, TextAsset, MediaAsset, CampaignTheme, CampaignProductionDate, CampaignProductionLocation } from '../types';
import { 
  Folder, Palette, Calendar as CalendarIcon, Target, BarChart3, 
  Download, Copy, ExternalLink, LogOut, Check, ChevronRight, 
  ChevronLeft, FileText, Sparkles, User, Info, Image as ImageIcon, 
  Video, Eye, Heart, Users, MessageSquare, TrendingUp, Menu, X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Instagram, Facebook, Youtube, Linkedin, Monitor, LayoutDashboard, Trophy, Plus, CheckCircle2, Smartphone
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LabelList, XAxis, YAxis, CartesianGrid
} from 'recharts';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const PLATFORMS = [
  { id: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'TikTok', icon: Smartphone, color: '#000000' },
  { id: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'YouTube', icon: Youtube, color: '#FF0000' }
];

const safeFormat = (dateStr: string | undefined | null, formatStr: string) => {
  if (!dateStr) return 'Fecha pendiente';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return format(d, formatStr, { locale: es });
};

const ClientHub: React.FC = () => {
  const { 
    projects, 
    tasks, 
    campaigns, 
    performances, 
    currentUser, 
    logout, 
    isAppReady, 
    studioLogo 
  } = useProjects();
  const navigate = useNavigate();

  // Control de vistas (pestañas) e interfaz móvil
  const [activeTab, setActiveTab] = useState<'adn' | 'vault' | 'calendar' | 'campaigns' | 'performance'>('adn');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para copiado rápido
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [copiedColorHex, setCopiedColorHex] = useState<string | null>(null);

  // Estados para selección de mes/año en Campañas y Rendimiento (Separados)
  const currentMonthName = useMemo(() => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return monthNames[new Date().getMonth()];
  }, []);
  
  const [selectedCampaignMonth, setSelectedCampaignMonth] = useState<string>(currentMonthName);
  const [selectedCampaignYear, setSelectedCampaignYear] = useState<number>(new Date().getFullYear());

  const [selectedPerfMonth, setSelectedPerfMonth] = useState<string>(currentMonthName);
  const [selectedPerfYear, setSelectedPerfYear] = useState<number>(new Date().getFullYear());

  // Estados para el calendario interactivo
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarTask, setSelectedCalendarTask] = useState<Task | null>(null);
  
  // Estado para la subpestaña de la Bóveda de Activos
  const [vaultSubTab, setVaultSubTab] = useState<'media' | 'text'>('media');
  const [selectedClientClassification, setSelectedClientClassification] = useState<string>('');

  // Estados para descarga de PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportPdfRef = useRef<HTMLDivElement>(null);

  // Estados para descarga de PDF de campaña
  const [isDownloadingCampaignPdf, setIsDownloadingCampaignPdf] = useState(false);
  const [selectedCampaignForPdf, setSelectedCampaignForPdf] = useState<Campaign | null>(null);
  const campaignPdfRef = useRef<HTMLDivElement>(null);

  // Estados para selección interactiva de pilares de contenido
  const [selectedCampaignThemeId, setSelectedCampaignThemeId] = useState<string | null>(null);

  // Validar sesión y rol
  useEffect(() => {
    if (isAppReady) {
      if (!currentUser) {
        navigate('/login');
      } else if (!currentUser.role?.toLowerCase().startsWith('cliente')) {
        navigate('/');
      }
    }
  }, [currentUser, isAppReady, navigate]);

  // Extraer código de marca
  const brandCode = useMemo(() => {
    if (!currentUser?.role) return '';
    const parts = currentUser.role.split(':');
    return parts.length > 1 ? parts[1].trim().toUpperCase() : '';
  }, [currentUser]);

  // Obtener el proyecto correspondiente
  const clientProject = useMemo(() => {
    if (!brandCode) return null;
    return projects.find(p => 
      p.brandCode?.toUpperCase() === brandCode || 
      p.typography?.brandCode?.toUpperCase() === brandCode
    );
  }, [projects, brandCode]);

  // Filtrar datos específicos de este proyecto
  const clientTasks = useMemo(() => {
    if (!clientProject) return [];
    return tasks.filter(t => t.projectId === clientProject.id && t.visibleToClient);
  }, [tasks, clientProject]);

  const clientCampaigns = useMemo(() => {
    if (!clientProject) return [];
    return campaigns.filter(c => c.projectId === clientProject.id);
  }, [campaigns, clientProject]);

  const clientPerformances = useMemo(() => {
    if (!clientProject) return [];
    return performances.filter(p => p.projectId === clientProject.id);
  }, [performances, clientProject]);

  const activeCampaign = useMemo(() => {
    return clientCampaigns.find(c => 
      c.month.toLowerCase() === selectedCampaignMonth.toLowerCase() && 
      Number(c.year) === selectedCampaignYear
    );
  }, [clientCampaigns, selectedCampaignMonth, selectedCampaignYear]);

  // Sincronizar pilar de contenido inicial al cambiar de campaña
  useEffect(() => {
    if (activeCampaign?.themes && activeCampaign.themes.length > 0) {
      setSelectedCampaignThemeId(activeCampaign.themes[0].id);
    } else {
      setSelectedCampaignThemeId(null);
    }
  }, [activeCampaign]);

  const activePerformance = useMemo(() => {
    return clientPerformances.find(p => 
      p.month.toLowerCase() === selectedPerfMonth.toLowerCase() && 
      Number(p.year) === selectedPerfYear
    );
  }, [clientPerformances, selectedPerfMonth, selectedPerfYear]);

  // Calcular el mes y año del último registro creado por sección (campaña o rendimiento) para esta marca
  const latestCampaignMonthAndYear = useMemo(() => {
    const monthMap: Record<string, number> = {
      "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5,
      "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
    };

    let latestRecord = { month: '', year: 0, order: -1 };
    clientCampaigns.forEach(c => {
      const mIdx = monthMap[c.month.toLowerCase()];
      const order = Number(c.year) * 12 + (mIdx !== undefined ? mIdx : 0);
      if (order > latestRecord.order) {
        latestRecord = { month: c.month, year: Number(c.year), order };
      }
    });

    if (latestRecord.order !== -1) {
      return { month: latestRecord.month, year: latestRecord.year };
    }
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return {
      month: monthNames[new Date().getMonth()],
      year: new Date().getFullYear()
    };
  }, [clientCampaigns]);

  const latestPerfMonthAndYear = useMemo(() => {
    const monthMap: Record<string, number> = {
      "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5,
      "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
    };

    let latestRecord = { month: '', year: 0, order: -1 };
    clientPerformances.forEach(p => {
      const mIdx = monthMap[p.month.toLowerCase()];
      const order = Number(p.year) * 12 + (mIdx !== undefined ? mIdx : 0);
      if (order > latestRecord.order) {
        latestRecord = { month: p.month, year: Number(p.year), order };
      }
    });

    if (latestRecord.order !== -1) {
      return { month: latestRecord.month, year: latestRecord.year };
    }
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return {
      month: monthNames[new Date().getMonth()],
      year: new Date().getFullYear()
    };
  }, [clientPerformances]);

  // Sincronizar mes y año correspondientes para cada pestaña al cargar
  useEffect(() => {
    if (clientProject) {
      setSelectedCampaignMonth(latestCampaignMonthAndYear.month);
      setSelectedCampaignYear(latestCampaignMonthAndYear.year);
    }
  }, [clientProject, latestCampaignMonthAndYear]);

  useEffect(() => {
    if (clientProject) {
      setSelectedPerfMonth(latestPerfMonthAndYear.month);
      setSelectedPerfYear(latestPerfMonthAndYear.year);
    }
  }, [clientProject, latestPerfMonthAndYear]);

  // Obtener la lista de meses y años con datos reales para las Campañas
  const availableCampaignYears = useMemo(() => {
    const yearsSet = new Set<number>();
    clientCampaigns.forEach(c => {
      if (c.year) yearsSet.add(Number(c.year));
    });
    if (yearsSet.size === 0) {
      return [new Date().getFullYear()];
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [clientCampaigns]);

  const availableCampaignMonthsForSelectedYear = useMemo(() => {
    const monthsSet = new Set();
    const standardMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    clientCampaigns.forEach(c => {
      if (Number(c.year) === selectedCampaignYear) {
        const found = standardMonths.find(m => m.toLowerCase() === c.month.toLowerCase());
        if (found) monthsSet.add(found);
      }
    });
    if (monthsSet.size === 0) {
      const currentMonthName = standardMonths[new Date().getMonth()];
      return [currentMonthName];
    }
    return standardMonths.filter(m => monthsSet.has(m));
  }, [clientCampaigns, selectedCampaignYear]);

  useEffect(() => {
    if (availableCampaignMonthsForSelectedYear.length > 0) {
      const isValid = availableCampaignMonthsForSelectedYear.includes(selectedCampaignMonth);
      if (!isValid) {
        setSelectedCampaignMonth(availableCampaignMonthsForSelectedYear[availableCampaignMonthsForSelectedYear.length - 1]);
      }
    }
  }, [selectedCampaignYear, availableCampaignMonthsForSelectedYear, selectedCampaignMonth]);

  // Obtener la lista de meses y años con datos reales para el Rendimiento
  const availablePerfYears = useMemo(() => {
    const yearsSet = new Set<number>();
    clientPerformances.forEach(p => {
      if (p.year) yearsSet.add(Number(p.year));
    });
    if (yearsSet.size === 0) {
      return [new Date().getFullYear()];
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [clientPerformances]);

  const availablePerfMonthsForSelectedYear = useMemo(() => {
    const monthsSet = new Set();
    const standardMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    clientPerformances.forEach(p => {
      if (Number(p.year) === selectedPerfYear) {
        const found = standardMonths.find(m => m.toLowerCase() === p.month.toLowerCase());
        if (found) monthsSet.add(found);
      }
    });
    if (monthsSet.size === 0) {
      const currentMonthName = standardMonths[new Date().getMonth()];
      return [currentMonthName];
    }
    return standardMonths.filter(m => monthsSet.has(m));
  }, [clientPerformances, selectedPerfYear]);

  useEffect(() => {
    if (availablePerfMonthsForSelectedYear.length > 0) {
      const isValid = availablePerfMonthsForSelectedYear.includes(selectedPerfMonth);
      if (!isValid) {
        setSelectedPerfMonth(availablePerfMonthsForSelectedYear[availablePerfMonthsForSelectedYear.length - 1]);
      }
    }
  }, [selectedPerfYear, availablePerfMonthsForSelectedYear, selectedPerfMonth]);

  // Sincronizar clasificación inicial de la bóveda
  useEffect(() => {
    if (clientProject) {
      const cats = Array.from(new Set([
        ...(clientProject.mediaClassifications || []),
        ...(clientProject.typography?.mediaClassifications || []),
        ...(clientProject.mediaRepository || []).map(m => m.classification).filter(Boolean)
      ]));
      if (cats.length > 0 && (!selectedClientClassification || !cats.includes(selectedClientClassification))) {
        setSelectedClientClassification(cats[0]);
      }
    }
  }, [clientProject, selectedClientClassification]);

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
    const startDate = new Date(year, monthIndex - 1, 20, 0, 0, 0);
    const endDate = new Date(year, monthIndex, 19, 23, 59, 59);
    return { start: startDate, end: endDate };
  };

  const prevMonthReport = useMemo(() => {
    if (!clientProject?.id) return null;
    const prevMonthIdx = MONTHS.indexOf(selectedPerfMonth) - 1;
    const prevMonth = prevMonthIdx < 0 ? MONTHS[11] : MONTHS[prevMonthIdx];
    const prevYear = prevMonthIdx < 0 ? selectedPerfYear - 1 : selectedPerfYear;
    return performances.find(p => 
      p.projectId === clientProject.id && 
      p.month === prevMonth && 
      p.year === prevYear
    );
  }, [clientProject, selectedPerfMonth, selectedPerfYear, performances]);

  const activePlatforms = useMemo(() => {
    if (!activePerformance?.metrics) return [];
    return activePerformance.metrics.map(m => m.platform);
  }, [activePerformance]);

  const metricsDict = useMemo(() => {
    const dict: Record<string, any> = {};
    // pre-populate with default metrics to avoid undefined references
    ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube'].forEach(p => {
      dict[p] = { followers: 0, totalFollowers: 0, reach: 0, interactions: 0, engagement: 0, leads: 0 };
    });
    if (activePerformance?.metrics) {
      activePerformance.metrics.forEach(m => {
        dict[m.platform] = {
          followers: m.followers || 0,
          totalFollowers: m.totalFollowers || 0,
          reach: m.reach || 0,
          interactions: m.interactions || 0,
          engagement: m.reach > 0 ? Number((((m.interactions || 0) / m.reach) * 100).toFixed(1)) : 0,
          leads: m.leads || 0
        };
      });
    }
    return dict;
  }, [activePerformance]);

  const getComparison = (platform: string, field: 'followers' | 'reach' | 'interactions') => {
    const currentMetric = metricsDict[platform]?.[field] || 0;
    const prevMonthIdx = MONTHS.indexOf(selectedPerfMonth) - 1;
    const prevMonth = prevMonthIdx < 0 ? MONTHS[11] : MONTHS[prevMonthIdx];
    const prevYear = prevMonthIdx < 0 ? selectedPerfYear - 1 : selectedPerfYear;

    const prevReport = performances.find(p => 
      p.projectId === clientProject?.id && 
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

  const operationalLogs = useMemo(() => {
    if (!clientProject?.id || !activeCampaign) return [];
    
    return tasks.filter(t => {
      return t.projectId === clientProject.id && t.campaignId === activeCampaign.id;
    }).sort((a,b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [clientProject, tasks, activeCampaign]);

  const autoData = useMemo(() => {
    if (!activeCampaign) return { posts: 0, productions: 0 };
    return {
      posts: activeCampaign.themes?.length || 0,
      productions: activeCampaign.productionDates?.length || 0
    };
  }, [activeCampaign]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColorHex(hex);
    setTimeout(() => setCopiedColorHex(null), 2000);
  };

  const handleTabClick = (tab: 'adn' | 'vault' | 'calendar' | 'campaigns' | 'performance') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Cuadrícula del calendario
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const days: { dayNumber: number; isCurrentMonth: boolean; dateString: string; tasks: Task[] }[] = [];
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({
        dayNumber: prevDay,
        isCurrentMonth: false,
        dateString,
        tasks: clientTasks.filter(t => t.date === dateString)
      });
    }
    
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateString,
        tasks: clientTasks.filter(t => t.date === dateString)
      });
    }
    
    const remainingCells = 42 - days.length;
    for (let nextD = 1; nextD <= remainingCells; nextD++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
      days.push({
        dayNumber: nextD,
        isCurrentMonth: false,
        dateString,
        tasks: clientTasks.filter(t => t.date === dateString)
      });
    }
    
    return days;
  }, [calendarDate, clientTasks]);

  const changeMonth = (direction: 'next' | 'prev') => {
    const newDate = new Date(calendarDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCalendarDate(newDate);
  };

  const handleDownloadPDF = async (action: 'download' | 'view' = 'download') => {
    if (!activePerformance || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const html2canvasLib = (window as any).html2canvas;
      const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
      if (!html2canvasLib || !jsPDFLib) {
        alert("Librerías de generación de PDF no están listas. Por favor, reintenta en un momento.");
        setIsGeneratingPdf(false);
        return;
      }

      // Pre-load logo to base64
      let logoData = null;
      if (studioLogo && typeof window !== "undefined") {
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
          console.error("Error loading studio logo for report:", err);
        }
      }

      const pdf = new jsPDFLib('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const capturePage = async (element: HTMLElement, pageNum: number) => {
        if (pageNum > 1) pdf.addPage();
        
        const canvas = await html2canvasLib(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#202020',
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
        
        // Dark footer area matching template
        pdf.setFillColor(32, 32, 32);
        pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
        
        // Separator Line
        pdf.setDrawColor(60, 60, 60);
        pdf.setLineWidth(0.3);
        pdf.line(10, pageHeight - 16, pageWidth - 10, pageHeight - 16);
        
        if (logoData) {
          try {
            pdf.addImage(logoData, 'PNG', 10, pageHeight - 13.5, 6, 6);
          } catch (e) {}
        }
        
        pdf.setFontSize(7);
        pdf.setTextColor(200, 200, 200);
        const footerLeftText = `Documento Confidencial - Reporte de Rendimiento ${selectedPerfMonth} ${selectedPerfYear} - ${clientProject?.name?.toUpperCase() || 'MARCA'}`;
        pdf.text(footerLeftText, 18, pageHeight - 9.5);
        
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.setFont(undefined, 'bold');
        pdf.text(`PÁGINA ${i} DE ${totalPages}`, pageWidth - 10, pageHeight - 9.5, { align: 'right' });
        pdf.setFont(undefined, 'normal');
      }

      const code = (clientProject?.typography?.brandCode || clientProject?.name || 'MARCA').toUpperCase();
      const filename = `${selectedPerfMonth.toUpperCase()} ${selectedPerfYear} - ${code} RENDIMIENTO.pdf`;
      
      if (action === 'view') {
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl);
      } else {
        pdf.save(filename);
      }
    } catch (e) {
      console.error("PDF generation error:", e);
      alert("Ocurrió un error generando el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadCampaignPDF = async (campaign: Campaign, action: 'download' | 'view' = 'download') => {
    setSelectedCampaignForPdf(campaign);
    setIsDownloadingCampaignPdf(true);

    setTimeout(async () => {
      const pdfElement = document.getElementById('campaign-pdf');
      if (pdfElement) {
        const code = (clientProject?.typography?.brandCode || clientProject?.name || 'MARCA').toUpperCase();
        const fileName = `${campaign.month.toUpperCase()} ${campaign.year} - ${code} CONTENIDO.pdf`;
        
        try {
          let logoData = null;
          if (studioLogo && typeof window !== "undefined") {
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

          const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
          const html2canvasLib = (window as any).html2canvas;

          if (!jsPDFLib || !html2canvasLib) {
            alert("Librerías de generación de PDF no están listas. Por favor, reintenta en un momento.");
            setIsDownloadingCampaignPdf(false);
            setSelectedCampaignForPdf(null);
            return;
          }

          const pdf = (window as any).jspdf 
            ? new (window as any).jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            : new jsPDFLib({ unit: 'mm', format: 'a4', orientation: 'portrait' });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const usableHeight = pageHeight - 25;
          const splitThreshold = 25;

          if ((document as any).fonts && (document as any).fonts.ready) {
            await (document as any).fonts.ready;
          }
          await new Promise(resolve => setTimeout(resolve, 800));

          // 1. Capture the Summary Page
          const summaryEl = document.getElementById('pdf-summary-page');
          if (summaryEl) {
            const canvas = await html2canvasLib(summaryEl, {
              scale: 3,
              useCORS: true,
              width: 1200,
              windowWidth: 1200,
              logging: false,
              backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= usableHeight;
            
            while (heightLeft > splitThreshold) {
              position -= usableHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= usableHeight;
            }
          }

          // 2. Capture each Theme Page
          const themeEls = document.querySelectorAll('.pdf-theme-page');
          for (let i = 0; i < themeEls.length; i++) {
            const canvas = await html2canvasLib(themeEls[i] as HTMLElement, {
              scale: 3,
              useCORS: true,
              width: 1200,
              windowWidth: 1200,
              logging: false,
              backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= usableHeight;

            while (heightLeft > splitThreshold) {
              position -= usableHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= usableHeight;
            }
          }

          // 3. Capture Calendar Page
          const calendarHeader = document.querySelector('#pdf-calendar-page .grid');
          const calendarRows = document.querySelectorAll('.pdf-calendar-row');
          const calendarTitle = document.querySelector('#pdf-calendar-page .border-b-4');
          
          if (calendarTitle && calendarHeader && calendarRows.length > 0) {
            pdf.addPage();
            let currentY = 15;
            const margin = 15;
            const pageLimit = pageHeight - 25;

            const titleCanvas = await html2canvasLib(calendarTitle as HTMLElement, { scale: 2, useCORS: true, logging: false });
            const titleW = pageWidth - (margin * 2);
            const titleH = (titleCanvas.height * titleW) / titleCanvas.width;
            pdf.addImage(titleCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, titleW, titleH);
            currentY += titleH + 10;

            const headerCanvas = await html2canvasLib(calendarHeader as HTMLElement, { scale: 2, useCORS: true, logging: false });
            const headerW = pageWidth - (margin * 2);
            const headerH = (headerCanvas.height * headerW) / headerCanvas.width;
            pdf.addImage(headerCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, headerW, headerH);
            currentY += headerH + 5;

            for (let i = 0; i < calendarRows.length; i++) {
              const rowEl = calendarRows[i] as HTMLElement;
              const rowCanvas = await html2canvasLib(rowEl, { scale: 2, useCORS: true, logging: false });
              const rowW = pageWidth - (margin * 2);
              const rowH = (rowCanvas.height * rowW) / rowCanvas.width;

              if (currentY + rowH > pageLimit) {
                pdf.addPage();
                currentY = margin;
                pdf.addImage(headerCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, headerW, headerH);
                currentY += headerH + 5;
              }

              pdf.addImage(rowCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, rowW, rowH);
              currentY += rowH + 3;
            }
          }

          // 4. Add Footers
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
            pdf.setDrawColor(240, 240, 240);
            pdf.setLineWidth(0.3);
            pdf.line(10, pageHeight - 16, pageWidth - 10, pageHeight - 16);
            
            if (logoData) {
              try {
                pdf.addImage(logoData, 'PNG', 10, pageHeight - 13.5, 6, 6);
              } catch (e) {}
            }
            
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.setFont(undefined, 'normal');
            const footerLabel = `Documento Confidencial - Estrategia de Campaña ${campaign.month} ${campaign.year} - ${clientProject?.name?.toUpperCase() || 'MARCA'}`;
            pdf.text(footerLabel, 18, pageHeight - 9.5);
            
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            pdf.setFont(undefined, 'bold');
            pdf.text(`PÁGINA ${i} DE ${totalPages}`, pageWidth - 10, pageHeight - 9.5, { align: 'right' });
            pdf.setFont(undefined, 'normal');
          }

          if (action === 'view') {
            const blobUrl = pdf.output('bloburl');
            window.open(blobUrl);
          } else {
            pdf.save(fileName);
          }
        } catch (e: any) {
          console.error("PDF Error:", e);
          alert(`Error al generar PDF: ${e.message || 'Error desconocido'}`);
        } finally {
          setIsDownloadingCampaignPdf(false);
          setSelectedCampaignForPdf(null);
        }
      }
    }, 500);
  };

  if (!isAppReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark text-white pattern-orbital">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Cargando Portal de Cliente...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!clientProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark p-6 pattern-orbital">
        <div className="max-w-md w-full glass-panel border border-white/5 p-10 rounded-[2.5rem] text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <Info className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Acceso Restringido</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Tu usuario no tiene asignada ninguna marca activa o el código de vinculación (`{brandCode}`) no corresponde a ningún proyecto en nuestro sistema.
          </p>
          <button 
            onClick={() => { logout(); window.location.hash = '/login'; }}
            className="w-full py-4 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 border border-white/10 rounded-2xl text-xs font-bold uppercase transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background-dark text-white pattern-orbital overflow-hidden relative font-sans">
      
      {/* Overlay para menú móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR A LA IZQUIERDA (Igual que la plataforma regular) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0
        bg-background-dark border-r border-white/5 flex flex-col shrink-0 h-full
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col gap-10 h-full">
          
          {/* Logo y Encabezado de Marca */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-orange flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden shrink-0 border border-white/10">
              {clientProject.logoUrl ? (
                <img src={clientProject.logoUrl} className="w-full h-full object-cover" alt="Brand Logo" />
              ) : (
                <span className="material-symbols-outlined text-white text-3xl">shutter_speed</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-white text-base font-black leading-none tracking-tighter truncate uppercase">{clientProject.name}</h1>
              <p className="text-accent-orange text-[9px] font-black uppercase tracking-[0.2em] mt-1 truncate">Portal Cliente</p>
            </div>
          </div>

          {/* Menú de Navegación Lateral */}
          <nav className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => handleTabClick('adn')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activeTab === 'adn'
                  ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white font-black'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">ADN de Marca</span>
            </button>

            <button
              onClick={() => handleTabClick('vault')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white font-black'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Folder className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Recursos</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white font-black'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Calendario</span>
            </button>

            <button
              onClick={() => handleTabClick('campaigns')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white font-black'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Target className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Campañas</span>
            </button>

            <button
              onClick={() => handleTabClick('performance')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
                activeTab === 'performance'
                  ? 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 text-white font-black'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">Rendimiento</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            
            <button
              onClick={() => { logout(); window.location.hash = '/login'; }}
              className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[11px] uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4 text-xl" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL (Derecha) ── */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Cabecera Superior */}
        <header className="h-20 px-6 sm:px-8 border-b border-white/5 flex items-center justify-between bg-background-dark/30 backdrop-blur-2xl shrink-0 z-40">
          <div className="flex items-center gap-4 min-w-0">
            {/* Botón hamburguesa móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-white uppercase tracking-tight leading-none truncate">
                {activeTab === 'adn' && 'ADN de Marca'}
                {activeTab === 'vault' && 'RECURSOS DE MARCA'}
                {activeTab === 'calendar' && 'Calendario de Contenido'}
                {activeTab === 'campaigns' && 'Gestión de Campañas'}
                {activeTab === 'performance' && 'Rendimiento & Métricas'}
              </h2>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1.5 opacity-60 truncate">
                {clientProject.name} • Protocolo de Marca
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded-lg uppercase">
              Brand ID: {brandCode}
            </span>
          </div>
        </header>

        {/* Zona de Desplazamiento (SCROLL INTERNO) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full pb-16">
            
            {/* CONTENIDO ADN DE MARCA */}
            {activeTab === 'adn' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                  <div className="h-40 w-full bg-slate-850 relative">
                    <img src={clientProject.coverUrl || clientProject.typography?.coverUrl || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-8 -mt-20 relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-slate-900 overflow-hidden border-[6px] border-[#0a090c] shadow-2xl shrink-0">
                      <img src={clientProject.logoUrl} className="w-full h-full object-cover" alt="Brand Logo" />
                    </div>
                    <div className="space-y-2 mt-4 md:mt-16">
                      <h2 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">{clientProject.name}</h2>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{clientProject.niche || 'Nicho no especificado'}</p>
                    </div>
                    {clientProject.brandManualUrl && (
                      <a 
                        href={clientProject.brandManualUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="md:ml-auto md:mt-16 btn-premium text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar Manual
                      </a>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl text-left">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Resumen Ejecutivo</h3>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tight">Brief / ADN de Marca</h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line font-sans">
                    {clientProject.brief || "No se ha documentado un brief o resumen de marca todavía."}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Paleta de Colores Oficial
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {clientProject.brandColors && clientProject.brandColors.length > 0 ? (
                        clientProject.brandColors.map((color, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleCopyColor(color)}
                            className="bg-white/[0.01] border border-white/5 p-2 rounded-2xl flex flex-col items-center gap-2.5 cursor-pointer group hover:bg-white/[0.03] transition-all w-24 shrink-0"
                          >
                            <div 
                              className="w-full aspect-square rounded-xl shadow-inner border border-white/10" 
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex items-center gap-1 justify-center w-full min-w-0">
                              <span className="font-mono text-[10px] text-slate-400 group-hover:text-white transition-colors truncate">{color}</span>
                              {copiedColorHex === color ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 py-4 text-center">No hay colores registrados.</p>
                      )}
                    </div>
                  </div>

                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Sistema Tipográfico
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Títulos principales</p>
                          <p className="text-sm font-bold text-white mt-1 uppercase tracking-tight">
                            {clientProject.typography?.titles?.name || "Sin definir"}
                          </p>
                        </div>
                        {clientProject.typography?.titles?.url && (
                          <a href={clientProject.typography.titles.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-white transition-all border border-white/10"><ExternalLink className="w-4 h-4" /></a>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Subtítulos</p>
                          <p className="text-sm font-bold text-white mt-1 uppercase tracking-tight">
                            {clientProject.typography?.subtitles?.name || "Sin definir"}
                          </p>
                        </div>
                        {clientProject.typography?.subtitles?.url && (
                          <a href={clientProject.typography.subtitles.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-white transition-all border border-white/10"><ExternalLink className="w-4 h-4" /></a>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Cuerpo de Texto</p>
                          <p className="text-sm font-bold text-white mt-1 uppercase tracking-tight">
                            {clientProject.typography?.body?.name || "Sin definir"}
                          </p>
                        </div>
                        {clientProject.typography?.body?.url && (
                          <a href={clientProject.typography.body.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-white transition-all border border-white/10"><ExternalLink className="w-4 h-4" /></a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO BÓVEDA DE ACTIVOS */}
            {activeTab === 'vault' && (
              <div className="space-y-8 animate-in fade-in duration-500 text-left">
                {/* Switcher selector premium */}
                <div className="flex justify-center mb-2">
                  <div className="glass-panel p-1.5 rounded-2xl border border-white/5 flex gap-2 bg-black/40 shadow-inner">
                    <button
                      onClick={() => setVaultSubTab('media')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                        vaultSubTab === 'media'
                          ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Recursos Multimedia
                    </button>
                    <button
                      onClick={() => setVaultSubTab('text')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                        vaultSubTab === 'text'
                          ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Contraseñas
                    </button>
                  </div>
                </div>

                {/* Subpestaña: Recursos Multimedia */}
                {vaultSubTab === 'media' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          Recursos Multimedia
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Archivos, creativos y recursos de marca</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {clientProject.mediaRepository?.length || 0} recursos
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                      {/* Menú lateral izquierdo de clasificaciones */}
                      <div className="w-full lg:w-60 shrink-0 space-y-3">
                        <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-background-dark/30 space-y-4 text-left">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Clasificaciones</h4>
                          <div className="flex flex-col gap-1.5">
                            {Array.from(new Set([
                              ...(clientProject.mediaClassifications || []),
                              ...(clientProject.typography?.mediaClassifications || []),
                              ...(clientProject.mediaRepository || []).map(m => m.classification).filter(Boolean)
                            ])).map(c => {
                              const count = (clientProject.mediaRepository || []).filter(m => m.classification === c).length;
                              return (
                                <button
                                  key={c}
                                  onClick={() => setSelectedClientClassification(c)}
                                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between cursor-pointer ${
                                    selectedClientClassification === c
                                      ? 'bg-primary text-white shadow-md font-black'
                                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  <span className="truncate pr-2">{c}</span>
                                  <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-400 font-mono shrink-0">
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Grilla de recursos (derecha) */}
                      <div className="flex-1 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                          {((clientProject.mediaRepository || []).filter(media => {
                            return media.classification === selectedClientClassification;
                          })).map((media: MediaAsset) => (
                            <div key={media.id} className="glass-panel p-5 rounded-[2rem] border border-white/5 flex flex-col justify-between hover:border-primary/20 transition-all shadow-xl bg-slate-900/40">
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-inner">
                                    {media.type === 'Imagen' ? <ImageIcon className="w-4 h-4" /> : media.type === 'Video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                  </div>
                                  <span className="px-2 py-0.5 bg-black/40 border border-white/5 text-slate-500 text-[8px] font-bold rounded-md uppercase">
                                    {media.platform || 'Drive'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">{media.name}</h4>
                                {media.description && <p className="text-[10px] text-slate-500 mt-2 leading-relaxed line-clamp-3">{media.description}</p>}
                                {media.size && <p className="text-[9px] font-mono text-slate-600 mt-1">{media.size}</p>}
                              </div>
                              <div className="mt-5 pt-4 border-t border-white/5">
                                <a href={media.url} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all text-slate-400 hover:shadow-lg">
                                  <ExternalLink className="w-3.5 h-3.5" /> Acceder Recurso
                                </a>
                              </div>
                            </div>
                          ))}
                          {((clientProject.mediaRepository || []).filter(media => {
                            return media.classification === selectedClientClassification;
                          })).length === 0 && (
                            <div className="col-span-full py-20 text-center glass-panel rounded-[2.5rem] border border-white/5">
                              <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No hay recursos cargados en esta categoría.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subpestaña: Textos & Copys */}
                {vaultSubTab === 'text' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Contraseñas
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Accesos, credenciales y contraseñas compartidas</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {clientProject.textRepository?.length || 0} activos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2">
                      {clientProject.textRepository && clientProject.textRepository.length > 0 ? (
                        clientProject.textRepository.map((text: TextAsset) => (
                          <div key={text.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-4 hover:border-primary/20 transition-all shadow-xl group flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded-lg uppercase tracking-wider">
                                  {text.tag}
                                </span>
                                <button onClick={() => handleCopyText(text.id, text.content)} className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-white transition-colors cursor-pointer shrink-0">
                                  {copiedTextId === text.id ? (
                                    <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-bold uppercase text-[9px]">Copiado</span></>
                                  ) : (
                                    <><Copy className="w-3.5 h-3.5" /><span className="uppercase text-[9px]">Copiar</span></>
                                  )}
                                </button>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight mb-2">{text.title}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/5 font-sans">
                                  {text.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center glass-panel rounded-[2.5rem] border border-white/5">
                          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest font-sans">No hay copys registrados en la bóveda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO CALENDARIO */}
            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      Calendario Mensual
                    </h3>
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      <button onClick={() => changeMonth('prev')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest px-2 min-w-32 text-center">{calendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => changeMonth('next')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="glass-panel border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
                    <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <div>Dom</div><div>Lun</div><div>Mar</div><div>Mie</div><div>Jue</div><div>Vie</div><div>Sab</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, idx) => {
                        const hasTasks = day.tasks.length > 0;
                        const isSelected = selectedCalendarTask && day.tasks.some(t => t.id === selectedCalendarTask.id);
                        return (
                          <div 
                            key={idx}
                            onClick={() => { if (hasTasks) setSelectedCalendarTask(day.tasks[0]); }}
                            className={`aspect-square p-2 rounded-2xl flex flex-col justify-between transition-all border text-left cursor-pointer ${
                              !day.isCurrentMonth 
                                ? 'bg-black/10 border-transparent text-slate-700' 
                                : isSelected 
                                ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                                : hasTasks 
                                ? 'bg-primary/5 border-primary/20 hover:border-primary/40 text-white' 
                                : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] text-slate-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold">{day.dayNumber}</span>
                            {hasTasks && (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="w-2 h-2 bg-accent-orange rounded-full animate-pulse shadow-md shadow-accent-orange/50" />
                                <span className="hidden sm:block text-[8px] font-black uppercase text-accent-orange truncate tracking-tight">{day.tasks[0].title}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Detalle del Entregable</h3>
                  {selectedCalendarTask ? (
                    <div className="glass-panel p-6 rounded-[2.5rem] border border-primary/20 bg-primary/[0.01] shadow-2xl space-y-6 animate-in fade-in duration-300">
                      <div>
                        <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded-lg uppercase tracking-wider">Fecha: {selectedCalendarTask.date}</span>
                        <h4 className="text-lg font-bold text-white uppercase tracking-tight mt-4">{selectedCalendarTask.title}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          Estado: <span className={selectedCalendarTask.status === 'Completada' ? 'text-emerald-400' : 'text-orange-400'}>{selectedCalendarTask.status}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Copia Limpia</p>
                        <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5 whitespace-pre-line max-h-48 overflow-y-auto scrollbar-hide font-sans">{selectedCalendarTask.description || "Sin descripción adicional."}</p>
                      </div>
                      {selectedCalendarTask.driveLink ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">cloud_download</span>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Entregable Listo</p>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">Los recursos finales se encuentran listos para ser descargados y publicados.</p>
                          <a href={selectedCalendarTask.driveLink} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all hover:shadow-lg"><ExternalLink className="w-3.5 h-3.5" /> Acceder a Drive</a>
                        </div>
                      ) : (
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Procesando Activos</p>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">El equipo creativo está preparando las piezas correspondientes.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center glass-panel rounded-[2.5rem] border border-white/5 text-slate-500 flex flex-col items-center justify-center p-6 gap-3">
                      <CalendarIcon className="w-10 h-10 text-slate-800" />
                      <p className="text-xs font-bold uppercase tracking-widest">Selecciona un día del calendario con entregas programadas.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENIDO CAMPAÑAS */}
            {activeTab === 'campaigns' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Periodo de Campaña</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Consulta los planes mensuales</p>
                  </div>
                  <div className="flex gap-3">
                    <select value={selectedCampaignMonth} onChange={e => setSelectedCampaignMonth(e.target.value)} className="bg-black/40 border border-white/5 text-white text-xs font-bold rounded-xl pl-6 pr-10 py-2.5 outline-none focus:border-primary/40 [color-scheme:dark]">
                      {availableCampaignMonthsForSelectedYear.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                    </select>
                    <select value={selectedCampaignYear} onChange={e => setSelectedCampaignYear(Number(e.target.value))} className="bg-black/40 border border-white/5 text-white text-xs font-bold rounded-xl pl-6 pr-10 py-2.5 outline-none focus:border-primary/40 [color-scheme:dark]">
                      {availableCampaignYears.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                    </select>
                  </div>
                </div>

                {activeCampaign ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                    {/* COLUMNA IZQUIERDA: Fechas de Producción y Descarga PDF */}
                    <div className="lg:col-span-4 space-y-6">
                      {activeCampaign.productionDates?.length > 0 && (
                        <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
                          <h4 className="text-xs font-bold text-white uppercase tracking-widest px-2">Fechas de Producción</h4>
                          <div className="space-y-3">
                            {activeCampaign.productionDates.map((prod) => {
                              const loc = activeCampaign.productionLocations?.find(l => l.id === prod.locationId);
                              return (
                                <div key={prod.id} className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                                  <span className="text-xs font-bold text-white">
                                    {format(new Date(prod.date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }).toUpperCase()}
                                  </span>
                                  {loc && <span className="px-2.5 py-0.5 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-[8px] font-bold rounded-lg uppercase">{loc.name}</span>}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Botón de Descarga y Vista PDF debajo de las fechas */}
                          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleDownloadCampaignPDF(activeCampaign, 'view')}
                              disabled={isDownloadingCampaignPdf}
                              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" /> Ver PDF
                            </button>
                            <button 
                              onClick={() => handleDownloadCampaignPDF(activeCampaign, 'download')}
                              disabled={isDownloadingCampaignPdf}
                              className="w-full btn-premium text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-xl transition-all"
                            >
                              <Download className="w-3.5 h-3.5" /> Descargar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COLUMNA DERECHA: Pilares de contenido interactivos */}
                    <div className="lg:col-span-8 space-y-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest px-2">Temáticas & Ejes de Contenido</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Selector de Pilares (Izquierda en el módulo) */}
                        <div className="md:col-span-5 space-y-2.5">
                          {activeCampaign.themes?.map((theme, themeIdx) => {
                            const isSelected = selectedCampaignThemeId === theme.id;
                            return (
                              <button
                                key={theme.id}
                                onClick={() => setSelectedCampaignThemeId(theme.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                  isSelected 
                                    ? 'bg-primary/10 border-primary text-white shadow-lg shadow-primary/5 font-black' 
                                    : 'bg-white/[0.01] hover:bg-white/5 border-white/5 text-slate-400'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                                    Pilar {themeIdx + 1} • {theme.format || 'Formato'}
                                  </p>
                                  <h4 className={`text-xs uppercase tracking-tight truncate ${isSelected ? 'text-white font-bold' : 'group-hover:text-white transition-colors'}`}>
                                    {theme.title}
                                  </h4>
                                </div>
                                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-primary translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                              </button>
                            );
                          })}
                        </div>

                        {/* Visor de Contenido (Derecha en el módulo) */}
                        <div className="md:col-span-7">
                          {(() => {
                            const selectedTheme = activeCampaign.themes?.find(t => t.id === selectedCampaignThemeId) || activeCampaign.themes?.[0];
                            if (!selectedTheme) {
                              return (
                                <div className="py-16 text-center glass-panel rounded-[2rem] border border-white/5 text-slate-500">
                                  <p className="text-xs font-bold uppercase tracking-widest">No hay temas disponibles.</p>
                                </div>
                              );
                            }
                            return (
                              <div className="glass-panel p-6 rounded-[2rem] border border-primary/20 bg-primary/[0.01] shadow-2xl space-y-6 animate-in fade-in duration-300">
                                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                  <div className="min-w-0">
                                    <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold rounded-md uppercase tracking-wider">
                                      Formato: {selectedTheme.format}
                                    </span>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight mt-2.5 truncate" title={selectedTheme.title}>{selectedTheme.title}</h4>
                                  </div>
                                  <button 
                                    onClick={() => handleCopyText(selectedTheme.id, selectedTheme.content)} 
                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                                  >
                                    {copiedTextId === selectedTheme.id ? (
                                      <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-bold uppercase text-[9px]">Copiado</span></>
                                    ) : (
                                      <><Copy className="w-3.5 h-3.5" /><span className="uppercase text-[9px]">Copiar</span></>
                                    )}
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guión y Desarrollo</p>
                                  <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-5 rounded-xl border border-white/5 whitespace-pre-line font-sans max-h-96 overflow-y-auto scrollbar-hide">
                                    {selectedTheme.content || "Sin guión desarrollado."}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center glass-panel rounded-[2.5rem] border border-white/5 max-w-xl mx-auto">
                    <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Sin Plan de Campaña</h4>
                    <p className="text-xs text-slate-500 mt-2">No hay una campaña configurada para {selectedCampaignMonth} del {selectedCampaignYear}.</p>
                  </div>
                )}
              </div>
            )}

            {/* CONTENIDO RENDIMIENTO */}
            {activeTab === 'performance' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Periodo de Métricas</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Reportes mensuales de rendimiento</p>
                  </div>
                  <div className="flex gap-3">
                    <select value={selectedPerfMonth} onChange={e => setSelectedPerfMonth(e.target.value)} className="bg-black/40 border border-white/5 text-white text-xs font-bold rounded-xl pl-6 pr-10 py-2.5 outline-none focus:border-primary/40 [color-scheme:dark]">
                      {availablePerfMonthsForSelectedYear.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                    </select>
                    <select value={selectedPerfYear} onChange={e => setSelectedPerfYear(Number(e.target.value))} className="bg-black/40 border border-white/5 text-white text-xs font-bold rounded-xl pl-6 pr-10 py-2.5 outline-none focus:border-primary/40 [color-scheme:dark]">
                      {availablePerfYears.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                    </select>
                  </div>
                </div>

                {activePerformance && (
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button 
                      onClick={() => handleDownloadPDF('view')} 
                      disabled={isGeneratingPdf} 
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Eye className="w-4 h-4 text-primary" /> {isGeneratingPdf ? 'Generando...' : 'Ver Reporte PDF'}
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF('download')} 
                      disabled={isGeneratingPdf} 
                      className="w-full btn-premium text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-xl shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4" /> {isGeneratingPdf ? 'Generando...' : 'Descargar Reporte PDF'}
                    </button>
                  </div>
                )}

                {activePerformance ? (
                  <div className="space-y-10 text-left" ref={reportPdfRef} id="client-performance-pdf-section">
                    
                    {/* SECCIÓN 1: Métricas por Canal */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest px-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> Métricas por Canal
                      </h3>
                      <div className={`grid gap-6 ${
                        activePerformance.metrics?.length === 1 ? 'grid-cols-1' :
                        activePerformance.metrics?.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        activePerformance.metrics?.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                      }`}>
                        {activePerformance.metrics?.map((metric, idx) => (
                          <div key={idx} className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                            <div className="flex justify-between items-center">
                              <span className="px-3 py-1 bg-white/5 border border-white/10 text-white text-[9px] font-black rounded-lg uppercase tracking-wider">{metric.platform}</span>
                              <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
                            </div>
                            <div className="space-y-1.5 pt-2">
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Seguidores Ganados</p>
                              <p className="text-3xl font-black text-white tracking-tighter">+{metric.followers.toLocaleString('es-ES')}</p>
                              {metric.totalFollowers && <p className="text-[9px] text-slate-600 font-bold">Total: {metric.totalFollowers.toLocaleString('es-ES')}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                              <div>
                                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Alcance</p>
                                <p className="text-xs font-black text-slate-300">{metric.reach.toLocaleString('es-ES')}</p>
                              </div>
                              {metric.interactions && (
                                <div>
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Interacciones</p>
                                  <p className="text-xs font-black text-slate-300">{metric.interactions.toLocaleString('es-ES')}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECCIÓN 2: Análisis Estratégico (Completo y Ancho) */}
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-4 w-full">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resumen Estratégico</h4>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight mt-0.5">Análisis Mensual</h4>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                        {activePerformance.executiveSummary || "No se ha documentado un resumen ejecutivo."}
                      </p>
                    </div>

                    {/* SECCIÓN 3: Publicaciones Destacadas (Distribuidas Horizontalmente) */}
                    <div className="space-y-4 w-full">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest px-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Publicaciones Destacadas
                      </h3>
                      <div className={`grid gap-6 ${
                        activePerformance.bestPosts?.length === 1 ? 'grid-cols-1' :
                        activePerformance.bestPosts?.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        activePerformance.bestPosts?.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                      }`}>
                        {activePerformance.bestPosts && activePerformance.bestPosts.length > 0 ? (
                          activePerformance.bestPosts.map((post, idx) => (
                            <div key={idx} className="flex flex-col bg-white/[0.01] border border-white/5 p-4 rounded-2xl hover:border-primary/20 transition-all shadow-xl justify-between h-full">
                              <div className="flex gap-4 items-center">
                                {post.imageUrl && (
                                  <div className="w-16 h-16 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-inner">
                                    <img src={post.imageUrl} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-black text-white uppercase truncate tracking-tight">{post.title}</h5>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                      <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Alcance</p>
                                      <p className="text-xs font-bold text-primary">{post.reach.toLocaleString('es-ES')}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Reacciones</p>
                                      <p className="text-xs font-bold text-accent-orange">{post.reactions.toLocaleString('es-ES')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {post.postUrl && (
                                <div className="mt-4 pt-3 border-t border-white/5">
                                  <a 
                                    href={post.postUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-full py-2.5 bg-[#8c2bee]/20 hover:bg-[#8c2bee] text-primary hover:text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg shadow-[#8c2bee]/10"
                                  >
                                    <span className="material-symbols-outlined text-xs">open_in_new</span> Ver Post
                                  </a>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-8 text-center glass-panel rounded-[2rem] border border-white/5 text-slate-500">
                            <p className="text-xs text-slate-500 py-4 text-center font-bold uppercase tracking-widest">No hay publicaciones destacadas registradas.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECCIÓN 4: Servicios de Diseño Gráfico (Último y Horizontal) */}
                    {activePerformance.extraWorks && activePerformance.extraWorks.length > 0 && (
                      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-4 w-full">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest px-2">Servicios de Diseño Gráfico</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activePerformance.extraWorks.map((work) => (
                            <div key={work.id} className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl shadow-sm">
                              <span className="text-xs font-bold text-white uppercase tracking-tight">{work.description}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{work.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-20 text-center glass-panel rounded-[2.5rem] border border-white/5 max-w-xl mx-auto">
                    <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Sin Reporte de Rendimiento</h4>
                    <p className="text-xs text-slate-500 mt-2">No hay un reporte mensual generado para {selectedPerfMonth} del {selectedPerfYear}.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
      
      {/* ── MENÚ MÓVIL DESPLEGABLE (Sidebar Móvil) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-64 bg-background-dark border-r border-white/5 flex flex-col shrink-0 h-full
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col gap-10 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent-orange flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                {clientProject.logoUrl ? <img src={clientProject.logoUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white text-2xl">shutter_speed</span>}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-white text-sm font-black leading-none tracking-tighter truncate uppercase">{clientProject.name}</h1>
                <p className="text-accent-orange text-[8px] font-black uppercase tracking-[0.2em] mt-1 truncate">Portal Cliente</p>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white bg-white/5 rounded-xl border border-white/10 shrink-0"><X className="w-4 h-4" /></button>
          </div>

          <nav className="flex flex-col gap-2 flex-1 mt-6">
            <button onClick={() => handleTabClick('adn')} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'adn' ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Palette className="w-5 h-5 shrink-0" /><span className="text-[11px] font-black uppercase tracking-widest">ADN de Marca</span>
            </button>
            <button onClick={() => handleTabClick('vault')} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'vault' ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Folder className="w-5 h-5 shrink-0" /><span className="text-[11px] font-black uppercase tracking-widest">Recursos</span>
            </button>
            <button onClick={() => handleTabClick('calendar')} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'calendar' ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <CalendarIcon className="w-5 h-5 shrink-0" /><span className="text-[11px] font-black uppercase tracking-widest">Calendario</span>
            </button>
            <button onClick={() => handleTabClick('campaigns')} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'campaigns' ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Target className="w-5 h-5 shrink-0" /><span className="text-[11px] font-black uppercase tracking-widest">Campañas</span>
            </button>
            <button onClick={() => handleTabClick('performance')} className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'performance' ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <BarChart3 className="w-5 h-5 shrink-0" /><span className="text-[11px] font-black uppercase tracking-widest">Rendimiento</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-[1.5rem] border border-white/5 bg-white/[0.01]">
              <img src={clientProject.logoUrl || currentUser.avatar} className="w-10 h-10 rounded-2xl object-cover border border-white/10 bg-slate-900" />
              <div className="flex flex-col min-w-0">
                <span className="text-white text-xs font-black truncate">{currentUser.firstName}</span>
                <span className="text-[8px] text-accent-orange font-black uppercase truncate">Cliente</span>
              </div>
            </div>
            <button onClick={() => { logout(); window.location.hash = '/login'; }} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[11px] uppercase tracking-widest">
              <LogOut className="w-4 h-4" /><span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── TEMPLATE OCULTO PARA PDF DE CAMPAÑA ── */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={campaignPdfRef} id="campaign-pdf" className="p-0 bg-white text-slate-900 font-sans relative w-[1200px]">
          {selectedCampaignForPdf && (
            <div className="w-full">
              {/* PAGE 1: HEADER & SUMMARY */}
              <div id="pdf-summary-page" className="p-10 pb-24 space-y-8 bg-white flex flex-col">
                <div className="grow space-y-8">
                  {/* LOGO & BRAND */}
                  <div className="flex items-center justify-between mb-4 border-b-2 border-slate-200 pb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                        {clientProject?.logoUrl && (
                          <img 
                            src={clientProject.logoUrl} 
                            className="w-full h-full object-contain rounded-2xl" referrerPolicy="no-referrer" alt=""
                          />
                        )}
                      </div>
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">
                          Campaña de Contenido
                        </h1>
                        <p className="text-xl font-bold text-slate-600 uppercase tracking-widest">
                          {clientProject?.name} - {selectedCampaignForPdf.month} {selectedCampaignForPdf.year}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OBJECTIVE SECTION */}
                  {selectedCampaignForPdf.objective && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 border-b border-slate-200 pb-2">Objetivo de la Campaña</h2>
                      <p className="text-[14px] leading-relaxed text-slate-700">
                        {selectedCampaignForPdf.objective}
                      </p>
                    </div>
                  )}

                  {/* THEMES SUMMARY BY PRODUCTION DATE */}
                  <div className="space-y-6 text-left">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 border-b-2 border-slate-200 pb-3">Fechas de Producción</h2>

                    {(() => {
                      const accentColor = clientProject?.brandColors?.[0] || '#8c2bee';
                      const sortedDates = [...selectedCampaignForPdf.productionDates].sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                      );
                      const assignedDateIds = new Set(selectedCampaignForPdf.productionDates.map(d => d.id));

                      const sections: { dateObj: CampaignProductionDate | null; themes: CampaignTheme[] }[] = 
                        sortedDates.map(d => ({
                          dateObj: d,
                          themes: selectedCampaignForPdf.themes.filter(t => t.productionId === d.id)
                        })).filter(s => s.themes.length > 0);

                      const unassigned = selectedCampaignForPdf.themes.filter(
                        t => !t.productionId || !assignedDateIds.has(t.productionId)
                      );
                      if (unassigned.length > 0) {
                        sections.push({ dateObj: null, themes: unassigned });
                      }

                      return sections.map((section, sIdx) => {
                        const dateLabel = section.dateObj
                          ? format(new Date(section.dateObj.date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }).toUpperCase()
                          : 'POR DEFINIR';

                        const globalOffset = sections.slice(0, sIdx).reduce((acc, s) => acc + s.themes.length, 0);
                        const sectionLocation = section.dateObj
                          ? (selectedCampaignForPdf.productionLocations?.find(l => l.id === section.dateObj!.locationId) || null)
                          : null;

                        return (
                          <div key={section.dateObj?.id || 'unassigned'} className="space-y-3">
                            <div className="py-3 px-5 rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#222] border border-white/10" style={{ borderLeft: `4px solid ${section.dateObj ? accentColor : '#94a3b8'}` }}>
                              <span className="text-[14px] font-black uppercase tracking-[0.25em] block" style={{ color: section.dateObj ? accentColor : '#94a3b8' }}>
                                {dateLabel}
                              </span>
                              {sectionLocation && (
                                <span className="text-[11px] font-bold mt-1 block text-slate-400">📍 {sectionLocation.name}</span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pl-2">
                              {section.themes.map((theme, i) => (
                                <div key={theme.id} className="p-4 border border-white/10 bg-gradient-to-br from-[#2e2e2e]/80 to-[#222]/80 rounded-2xl flex gap-4 items-center">
                                  <div className="text-2xl font-black text-white tracking-tighter shrink-0 border-r-2 border-slate-600 pr-4">
                                    {globalOffset + i + 1}
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <span className="text-[17px] font-black text-white uppercase leading-tight mb-1" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{theme.title}</span>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{theme.format}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* DETAILED SCRIPTS: EACH ON NEW PAGE */}
              {selectedCampaignForPdf.themes.map((theme, i) => (
                <div key={theme.id} className="pdf-theme-page p-10 pb-24 pt-16 bg-white flex flex-col text-left">
                  <div className="grow space-y-8">
                    <div className="flex items-end justify-between border-b-4 border-slate-200 pb-4 mb-8">
                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase tracking-[0.4em]" style={{ color: clientProject?.brandColors?.[0] || '#8c2bee' }}>Pilar {i + 1}</span>
                        <h3 className="text-4xl font-black uppercase text-slate-900 leading-tight">
                          {theme.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1">Formato</span>
                        <div className="text-[16px] font-black text-slate-900 uppercase tracking-[0.2em]">
                          {theme.format}
                        </div>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-slate-800 tracking-tight">
                        {theme.content || 'Sin desarrollo redactado.'}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}

              {/* CALENDARIO DE CONTENIDO PAGE */}
              <div id="pdf-calendar-page" className="p-10 pb-24 pt-16 bg-white flex flex-col min-h-[1100px] text-left">
                <div className="grow space-y-10">
                  <div className="border-b-4 border-slate-200 pb-6 mb-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                      Calendario de Contenido
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                      Hoja de ruta y programación de lanzamientos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-8 px-8 py-5 bg-[#2a2a2a] rounded-3xl text-white font-display font-black text-[10px] uppercase tracking-widest shadow-xl">
                      <div className="col-span-3">Fecha de publicación</div>
                      <div className="col-span-6">Pilar de Contenido</div>
                      <div className="col-span-3 text-right">Formato</div>
                    </div>

                    <div className="space-y-3">
                      {clientTasks
                        .filter(t => t.campaignId === selectedCampaignForPdf.id)
                        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((task) => (
                          <div key={task.id} className="pdf-calendar-row grid grid-cols-12 gap-4 px-6 py-5 border border-white/5 border-t-white/15 bg-gradient-to-br from-[#363636] to-[#2a2a2a] shadow-xl shadow-black/40 rounded-[2rem] items-center relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: clientProject?.brandColors?.[0] || '#8c2bee' }}></div>
                            <div className="col-span-3 flex flex-col">
                              <span className="text-[16px] font-black text-white">{format(new Date(task.date + 'T12:00:00'), 'dd MMM', { locale: es }).toUpperCase()}</span>
                              <span className="text-[12px] font-bold text-slate-500 uppercase">{format(new Date(task.date + 'T12:00:00'), 'eeee', { locale: es })}</span>
                            </div>
                            <div className="col-span-6">
                              <h4 className="text-[19px] font-black text-white uppercase leading-none mb-1">{task.title}</h4>
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="text-[14px] font-black text-slate-300 uppercase tracking-tighter">
                                {selectedCampaignForPdf.themes.find(th => th.id === task.campaignThemeId)?.format || 'Video'}
                              </span>
                            </div>
                          </div>
                        ))}

                      {clientTasks.filter(t => t.campaignId === selectedCampaignForPdf.id).length === 0 && (
                        <div className="py-20 text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-white/5 border-t-white/15">
                          <div className="material-symbols-outlined text-4xl text-slate-300">calendar_today</div>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No hay misiones agendadas para generar el calendario</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-20 pt-10 border-t border-slate-200 text-[11px] text-slate-500 text-center">
                    Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')} - Sistema Visual Oscart
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TEMPLATE OCULTO PARA PDF DE RENDIMIENTO (IDÉNTICO A PERFORMANCE.TSX) ── */}
      <div className="fixed left-[-9999px] top-0">
        <div id="performance-pdf-content" className="w-[1240px] bg-[#202020] text-white font-sans">
          {clientProject && activePerformance && (() => {
            const selectedMonth = selectedPerfMonth;
            const selectedYear = selectedPerfYear;
            const totalLeads = activePerformance.metrics?.reduce((acc, p) => acc + (p.leads || 0), 0) || 0;
            const totalInteractions = activePerformance.metrics?.reduce((acc, p) => acc + (p.interactions || 0), 0) || 0;
            const totalReach = activePerformance.metrics?.reduce((acc, p) => acc + (p.reach || 0), 0) || 0;
            const totalNewFollowers = activePerformance.metrics?.reduce((acc, p) => acc + (p.followers || 0), 0) || 0;
            const totalCommunity = activePerformance.metrics?.reduce((acc, p) => acc + (p.totalFollowers || 0), 0) || 0;
            const totalEngagement = totalReach > 0 ? (totalInteractions / totalReach) * 100 : 0;

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
            
            const bestPosts = activePerformance.bestPosts || [];
            const extraWorks = activePerformance.extraWorks || [];
            const executiveSummary = activePerformance.executiveSummary || '';
            const demographics = activePerformance.demographics;

            return (
              <div className="bg-[#202020] font-sans text-white text-left">
                {/* PAGE 1: COVER & SUMMARY */}
                <div id="pdf-page-1" className="p-20 min-h-[1754px] w-[1200px] bg-[#202020] relative flex flex-col border-[20px] border-[#202020]">
                  <div className="flex items-center gap-10 border-b border-white/10 pb-12 mb-16">
                    {clientProject.logoUrl && (
                      <img src={clientProject.logoUrl} crossOrigin="anonymous" className="h-24 w-auto object-contain rounded-2xl" alt=""/>
                    )}
                    <div className="space-y-3">
                      <h1 className="text-5xl font-black uppercase tracking-tighter leading-[1.1] text-white whitespace-nowrap">REPORTE DE RENDIMIENTO</h1>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[22px] font-black uppercase tracking-[0.3em] text-white border-b-4 border-slate-900 pb-1">{selectedMonth} {selectedYear}</span>
                        <div className="h-[1px] w-16 bg-slate-200"></div>
                        <span className="text-[14px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Ciclo: {safeFormat(getPeriodRange(selectedMonth, selectedYear).start.toISOString(), 'dd/MM')} - {safeFormat(getPeriodRange(selectedMonth, selectedYear).end.toISOString(), 'dd/MM')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KPI GRID */}
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Resumen General de Métricas</h2>
                      <div className="h-[1px] grow bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {/* Card 1: Engagement */}
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 pt-6 space-y-6 rounded-[2rem] flex flex-col justify-between border border-white/5 border-t-white/15 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Engagement</p>
                        <div className="space-y-1">
                          <p className="text-4xl font-black tracking-tighter text-white">{totalEngagement.toFixed(1)}<span className="text-xl ml-0.5 text-slate-500">%</span></p>
                          {momEngagement && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momEngagement.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              <span className="text-[11px] font-black uppercase font-bold">{momEngagement.isPositive ? '↑' : '↓'} {momEngagement.value}%</span>
                              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 2: Interacciones */}
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 pt-6 space-y-6 rounded-[2rem] flex flex-col justify-between border border-white/5 border-t-white/15 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Interacciones</p>
                        <div className="space-y-1">
                          <p className="text-4xl font-black tracking-tighter text-white">{totalInteractions.toLocaleString()}</p>
                          {momInteractions && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momInteractions.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              <span className="text-[11px] font-black uppercase font-bold">{momInteractions.isPositive ? '↑' : '↓'} {momInteractions.value}%</span>
                              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 3: Alcance Neto */}
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 pt-6 space-y-6 rounded-[2rem] flex flex-col justify-between border border-white/5 border-t-white/15 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Alcance Neto</p>
                        <div className="space-y-1">
                          <p className="text-4xl font-black tracking-tighter text-white">{totalReach.toLocaleString()}</p>
                          {momReach && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momReach.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              <span className="text-[11px] font-black uppercase font-bold">{momReach.isPositive ? '↑' : '↓'} {momReach.value}%</span>
                              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 4: Leads */}
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 pt-6 space-y-6 rounded-[2rem] flex flex-col justify-between border border-white/5 border-t-white/15 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Leads Gen.</p>
                        <div className="space-y-1">
                          <p className="text-4xl font-black tracking-tighter text-white">{totalLeads.toLocaleString()}</p>
                          {momLeads && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momLeads.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              <span className="text-[11px] font-black uppercase font-bold">{momLeads.isPositive ? '↑' : '↓'} {momLeads.value}%</span>
                              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 5: Followers */}
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 pt-6 space-y-6 rounded-[2rem] flex flex-col justify-between border border-white/5 border-t-white/15 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Crecimiento</p>
                        <div className="space-y-1">
                          <p className="text-4xl font-black tracking-tighter text-white">+{totalNewFollowers.toLocaleString()}</p>
                          {momFollowers && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit ${momFollowers.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              <span className="text-[11px] font-black uppercase font-bold">{momFollowers.isPositive ? '↑' : '↓'} {momFollowers.value}%</span>
                              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Best posts */}
                  {bestPosts.length > 0 && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">CONTENIDO DE ALTO IMPACTO</h3>
                        <Trophy className="text-white w-5 h-5"/>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        {bestPosts.slice(0, 3).map((post, i) => (
                          <div key={i} className="flex flex-col bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-5 rounded-2xl border border-white/5 border-t-white/15 shadow-xl shadow-black/40">
                            <div className="flex gap-4 items-center">
                              <div className="aspect-[4/5] w-20 bg-[#202020] relative overflow-hidden border border-white/5 border-t-white/15 rounded-lg flex-shrink-0">
                                {post.imageUrl && <img src={post.imageUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt=""/>}
                              </div>
                              <div className="flex-grow space-y-2">
                                <p className="text-[10px] font-black text-white uppercase leading-tight"><span className="mr-1" style={{ color: clientProject.brandColors?.[0] || '#8c2bee' }}>#{i + 1}</span>{post.title || 'Post sin título'}</p>
                                <div className="grid grid-cols-1 gap-1 pt-2 border-t border-white/10">
                                  <div className="flex justify-between items-center">
                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">ALCANCE</p>
                                    <p className="text-xs font-black">{(post.reach || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">INT.</p>
                                    <p className="text-xs font-black">{(post.reactions || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {post.postUrl && (
                              <div className="mt-4 pt-3 border-t border-white/5">
                                <a 
                                  href={post.postUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="w-full py-2 bg-white/5 hover:bg-primary hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all text-slate-400"
                                >
                                  <span className="material-symbols-outlined text-[10px]">open_in_new</span> Ver Publicación
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategic Summary */}
                  {executiveSummary && (
                    <div className="mt-12 space-y-6">
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] shadow-xl shadow-black/40 p-10 border border-white/5 border-t-white/15 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                          <Target className="w-24 h-24 text-white"/>
                        </div>
                        <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Análisis Estratégico y Conclusiones</p>
                        <p className="text-slate-200 text-xl leading-relaxed font-medium tracking-normal whitespace-pre-wrap relative z-10">{executiveSummary}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAGE 2: ANALYTICS */}
                <div id="pdf-page-2" className="p-20 min-h-[1754px] w-[1200px] bg-[#202020] relative space-y-12 flex flex-col border-[20px] border-[#202020]" style={{ pageBreakBefore: 'always' }}>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                      <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Rendimiento por Canal</h3>
                      <Monitor className="text-white w-8 h-8"/>
                    </div>
                    
                    <div className="border border-white/5 border-t-white/15 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/[0.08] text-white text-[10px] font-black uppercase tracking-widest">
                            <th className="p-6 text-left">Plataforma</th>
                            <th className="p-6 text-right">Crecimiento Neto</th>
                            <th className="p-6 text-right">Comunidad Total</th>
                            <th className="p-6 text-right">Alcance Mensual</th>
                            <th className="p-6 text-right">Interacciones</th>
                            <th className="p-6 text-right">Engagement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {activePlatforms.map(platform => {
                            const fComp = getComparison(platform, 'followers');
                            const rComp = getComparison(platform, 'reach');
                            const iComp = getComparison(platform, 'interactions');
                            const pData = PLATFORMS.find(p => p.id === platform);
                            return (
                              <tr key={platform} className="even:bg-[#252525] hover:bg-[#2d2d2d] transition-colors">
                                <td className="p-8 flex items-center gap-6">
                                  <div className="p-3 bg-[#333333] rounded-xl border border-white/5">
                                    {pData?.icon && React.createElement(pData.icon, { className: "w-5 h-5 text-white" })}
                                  </div>
                                  <span className="font-black text-white text-base uppercase tracking-tight">{platform}</span>
                                </td>
                                <td className="p-6 text-right">
                                  <p className="text-lg font-black text-white leading-none">+{metricsDict[platform]?.followers?.toLocaleString() || '0'}</p>
                                  {fComp && (
                                    <p className={`text-[11px] font-black uppercase leading-none mt-2 ${fComp.increased ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {fComp.increased ? '↑' : '↓'} {fComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                    </p>
                                  )}
                                </td>
                                <td className="p-6 text-right font-black text-slate-200 text-lg leading-none">{metricsDict[platform]?.totalFollowers?.toLocaleString() || '-'}</td>
                                <td className="p-6 text-right">
                                  <p className="font-black text-slate-200 text-lg leading-none">{metricsDict[platform]?.reach?.toLocaleString() || '0'}</p>
                                  {rComp && (
                                    <p className={`text-[11px] font-black uppercase leading-none mt-2 ${rComp.increased ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {rComp.increased ? '↑' : '↓'} {rComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                    </p>
                                  )}
                                </td>
                                <td className="p-6 text-right">
                                  <p className="font-black text-slate-200 text-lg">{(metricsDict[platform]?.interactions || 0).toLocaleString()}</p>
                                  {iComp && (
                                    <p className={`text-[11px] font-black uppercase mt-2 ${iComp.increased ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {iComp.increased ? '↑' : '↓'} {iComp.percent}% {MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}
                                    </p>
                                  )}
                                </td>
                                <td className="p-6 text-right">
                                  <p className="text-2xl font-black text-white tracking-tighter">{metricsDict[platform]?.engagement || '0'}%</p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {prevMonthReport && (
                    <div className="grid grid-cols-3 gap-6 pt-2">
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-5 rounded-2xl border border-white/5 border-t-white/15">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Alcance Global</p>
                        <div className="flex items-end gap-6">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                            <p className="text-2xl font-black text-slate-300 tracking-tighter">{prevTotalReach.toLocaleString()}</p>
                          </div>
                          <div className="text-slate-300 text-3xl font-light">/</div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-white uppercase tracking-tighter">Mes: {selectedMonth}</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{totalReach.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-5 rounded-2xl border border-white/5 border-t-white/15">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Interacciones</p>
                        <div className="flex items-end gap-6">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                            <p className="text-2xl font-black text-slate-300 tracking-tighter">{prevTotalInteractions.toLocaleString()}</p>
                          </div>
                          <div className="text-slate-300 text-3xl font-light">/</div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-white uppercase tracking-tighter">Mes: {selectedMonth}</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{totalInteractions.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-5 rounded-2xl border border-white/5 border-t-white/15">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Seguidores Totales</p>
                        <div className="flex items-end gap-6">
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{MONTHS[(MONTHS.indexOf(selectedMonth) - 1 + 12) % 12]}</p>
                            <p className="text-2xl font-black text-slate-300 tracking-tighter">{(prevMetrics.reduce((acc, m) => acc + (m.totalFollowers || 0), 0)).toLocaleString()}</p>
                          </div>
                          <div className="text-slate-300 text-3xl font-light">/</div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-white uppercase tracking-tighter">Mes: {selectedMonth}</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{totalCommunity.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {demographics && (() => {
                    const totalFemale = demographics.ageGender.reduce((acc, curr) => acc + curr.female, 0);
                    const totalMale = demographics.ageGender.reduce((acc, curr) => acc + curr.male, 0);
                    const totalSum = totalFemale + totalMale || 1;
                    const menPercent = (totalMale / totalSum) * 100;
                    const womenPercent = (totalFemale / totalSum) * 100;
                    const pieData = [
                      { name: 'Hombres', value: totalMale, color: clientProject.brandColors?.[0] || '#8c2bee' },
                      { name: 'Mujeres', value: totalFemale, color: clientProject.brandColors?.[1] || '#f97316' }
                    ];
                    return (
                      <div className="space-y-8 mt-4">
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-[14px] font-black text-slate-100 uppercase tracking-widest">Análisis de Audiencia</h4>
                          <div className="h-[1px] grow bg-slate-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-10">
                          <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 border border-white/5 border-t-white/15 rounded-[2rem] flex flex-col items-center">
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
                                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
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
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clientProject.brandColors?.[0] || '#8c2bee' }}/>
                                    <span className="text-[8px] font-black uppercase text-slate-500">Hombres</span>
                                  </div>
                                  <p className="text-2xl font-black text-white">{menPercent.toFixed(1)}%</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clientProject.brandColors?.[1] || '#f97316' }}/>
                                    <span className="text-[8px] font-black uppercase text-slate-500">Mujeres</span>
                                  </div>
                                  <p className="text-2xl font-black text-white">{womenPercent.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-8 border border-white/5 border-t-white/15 rounded-2xl">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-6">Distribución por Edad</p>
                            <div className="w-full h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={demographics.ageGender} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#222"/>
                                  <XAxis dataKey="age" fontSize={9} fontWeight="700" axisLine={false} tickLine={false} stroke="#64748b"/>
                                  <YAxis fontSize={9} fontWeight="700" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} stroke="#64748b"/>
                                  <Bar name="Hombres" dataKey="male" fill={clientProject.brandColors?.[0] || "#8c2bee"} radius={[4, 4, 0, 0]} barSize={16}>
                                    <LabelList dataKey="male" position="top" fontSize={8} fill="#ffffff" formatter={(v: any) => `${v}%`} />
                                  </Bar>
                                  <Bar name="Mujeres" dataKey="female" fill={clientProject.brandColors?.[1] || "#f97316"} radius={[4, 4, 0, 0]} barSize={16}>
                                    <LabelList dataKey="female" position="top" fontSize={8} fill="#ffffff" formatter={(v: any) => `${v}%`} />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* CITIES */}
                        <div className="mt-4 space-y-8 pt-4 border-t border-white/10">
                          <h4 className="text-[14px] font-black text-slate-100 uppercase tracking-widest">Regiones con Mayor Alcance</h4>
                          <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                            {demographics.topCities.filter(c => c.name).map((city, idx) => (
                              <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-sm font-black uppercase tracking-tighter text-white">{city.name}</span>
                                  <span className="text-sm font-bold text-slate-500">{(city.value || 0).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${city.value}%`, backgroundColor: clientProject.brandColors?.[0] || "#8c2bee" }} className="h-full rounded-full"/>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* PAGE 3: OPERATION */}
                <div id="pdf-page-3" className="p-20 min-h-[1754px] w-[1200px] bg-[#202020] relative space-y-20 flex flex-col border-[20px] border-[#202020]" style={{ pageBreakBefore: 'always' }}>
                  <div className="space-y-10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                      <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Resumen Operativo Mensual</h3>
                      <LayoutDashboard className="text-white w-8 h-8"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10">
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-4 flex flex-col justify-between h-[85px] relative overflow-hidden rounded-xl border border-white/5 border-t-white/15 shadow-sm">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 text-white">Publicaciones Totales</p>
                        <div className="relative">
                          <p className="text-4xl font-black leading-none tracking-tighter text-white">{autoData.posts}</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] p-4 border border-white/5 border-t-white/15 flex flex-col justify-between h-[85px] relative overflow-hidden rounded-xl">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">Producciones Audiovisuales</p>
                        <div className="relative">
                          <p className="text-4xl font-black leading-none tracking-tighter text-white">{autoData.productions}</p>
                        </div>
                      </div>
                    </div>

                    {/* PUBLICATION LOG */}
                    <div className="mt-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <p className="text-[14px] font-black text-slate-100 uppercase tracking-widest">Bitácora de Contenido Publicado</p>
                        <div className="h-[1px] grow bg-slate-200"></div>
                      </div>
                      <div className="border border-white/5 border-t-white/15 rounded-xl overflow-hidden shadow-sm bg-[#202020]">
                        <table className="w-full text-left font-sans border-collapse">
                          <thead className="bg-gradient-to-br from-[#363636] to-[#2a2a2a] border-b border-white/10">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                              <th className="p-4 border-r border-white/10">Fecha de Publicación</th>
                              <th className="p-4 uppercase">Identificador del Contenido / Tema</th>
                              <th className="p-4 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {operationalLogs.length > 0 ? operationalLogs.slice(0, 30).map((task, i) => (
                              <tr key={i} className={`text-[11px] font-bold text-slate-100 ${i % 2 !== 0 ? 'bg-[#252525]' : 'bg-[#202020]'}`}>
                                <td className="p-4 border-r border-white/10 text-slate-300 font-mono">
                                  {safeFormat(task.date, 'dd/MM/yyyy')}
                                </td>
                                <td className="p-4 uppercase tracking-tighter">{task.title}</td>
                                <td className="p-4 text-center">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase tracking-tighter text-[9px]">
                                    Ejecutado
                                  </span>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="p-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest py-20">Sin registros operativos específicos detectados</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {extraWorks.length > 0 && (
                    <div className="space-y-8 grow">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Bitácora de Valor Agregado</h3>
                        <Plus className="text-white w-4 h-4"/>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {extraWorks.map((work, i) => (
                          <div key={i} className="p-6 border border-white/5 border-t-white/15 flex items-center gap-6 group bg-gradient-to-br from-[#363636] to-[#2a2a2a] shadow-xl shadow-black/40 rounded-lg">
                            <div className="text-white font-black text-xl flex-shrink-0 min-w-[40px]">0{i+1}</div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-white uppercase tracking-tighter">{work.description}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{work.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-16 flex justify-between items-end border-t border-white/10">
                    <div className="text-right w-full">
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

export default ClientHub;
