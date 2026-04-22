
import React, { useState, useMemo, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { SocialPlatform, PerformanceMetric, ExtraWork, PerformanceReport, Project } from '../types';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
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

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isViewingDashboard, setIsViewingDashboard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activePlatforms, setActivePlatforms] = useState<SocialPlatform[]>(['Instagram']);
  const [metrics, setMetrics] = useState<Record<SocialPlatform, { followers: number; reach: number }>>({
    Instagram: { followers: 0, reach: 0 },
    Facebook: { followers: 0, reach: 0 },
    TikTok: { followers: 0, reach: 0 },
    LinkedIn: { followers: 0, reach: 0 },
    YouTube: { followers: 0, reach: 0 }
  });
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

  const autoData = useMemo(() => {
    if (!activeCampaign) return { posts: 0, productions: 0 };
    return {
      posts: activeCampaign.themes.length,
      productions: activeCampaign.productionDates.length
    };
  }, [activeCampaign]);

  // Load existing report data if any
  useEffect(() => {
    if (selectedProjectId && isEditing) {
      const existing = performances.find(p => 
        p.projectId === selectedProjectId && 
        p.month === selectedMonth && 
        p.year === selectedYear
      );
      if (existing) {
        const newMetrics = { ...metrics };
        existing.metrics.forEach(m => {
          newMetrics[m.platform] = { followers: m.followers, reach: m.reach };
        });
        setMetrics(newMetrics);
        setActivePlatforms(existing.metrics.map(m => m.platform));
        setExtraWorks(existing.extraWorks);
      }
    }
  }, [selectedProjectId, selectedMonth, selectedYear, performances, isEditing]);

  const handleTogglePlatform = (p: SocialPlatform) => {
    setActivePlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleMetricChange = (platform: SocialPlatform, field: 'followers' | 'reach', value: string) => {
    const num = parseInt(value) || 0;
    setMetrics(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: num }
    }));
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
        reach: metrics[p].reach
      })),
      extraWorks: extraWorks.map((ew, i) => ({ ...ew, id: `ew-${Date.now()}-${i}` })),
      manualPostsCount: autoData.posts,
      manualProductionsCount: autoData.productions
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
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFFFF',
            windowWidth: 1000
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        };

        const page1 = document.getElementById('pdf-page-1');
        const page2 = document.getElementById('pdf-page-2');

        if (page1) await capturePage(page1, 1);
        if (page2) await capturePage(page2, 2);

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

  const getComparison = (platform: SocialPlatform, field: 'followers' | 'reach') => {
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
    <div className="h-full overflow-y-auto scrollbar-hide pb-32">
      <div className="p-4 sm:p-10 space-y-12 max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                {isViewingDashboard && (
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
                          Instagram: { followers: 0, reach: 0 },
                          Facebook: { followers: 0, reach: 0 },
                          TikTok: { followers: 0, reach: 0 },
                          LinkedIn: { followers: 0, reach: 0 },
                          YouTube: { followers: 0, reach: 0 }
                       });
                       setActivePlatforms(['Instagram']);
                       setExtraWorks([]);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                               <Rocket className="w-4 h-4 text-primary" />
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
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Carga de Datos Mensuales
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activePlatforms.map(platform => {
                              const pInfo = PLATFORMS.find(x => x.id === platform)!;
                              const fComp = getComparison(platform, 'followers');
                              const rComp = getComparison(platform, 'reach');
                              return (
                                <div key={platform} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6 hover:bg-white/[0.04] transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-background-dark border border-white/5 group-hover:border-primary/20 transition-all">
                                      <pInfo.icon className="w-5 h-5" style={{ color: pInfo.color }} />
                                    </div>
                                    <span className="text-sm font-black text-white uppercase italic tracking-tighter">{platform}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Followers</label>
                                      <input type="number" value={metrics[platform].followers || ''} onChange={(e) => handleMetricChange(platform, 'followers', e.target.value)} className="w-full bg-background-dark/50 border border-white/10 rounded-xl p-3 text-white text-sm font-bold" />
                                      {fComp && (
                                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${fComp.increased ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                          {fComp.increased ? '▲' : '▼'} {fComp.percent}%
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Alcance</label>
                                      <input type="number" value={metrics[platform].reach || ''} onChange={(e) => handleMetricChange(platform, 'reach', e.target.value)} className="w-full bg-background-dark/50 border border-white/10 rounded-xl p-3 text-white text-sm font-bold" />
                                      {rComp && (
                                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${rComp.increased ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                          {rComp.increased ? '▲' : '▼'} {rComp.percent}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
                        <section className="glass-panel p-8 rounded-[2.5rem] space-y-8">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Monitor className="w-4 h-4 text-primary" />
                            Resumen Operativo
                          </h3>
                          <div className="space-y-6">
                            <div className="p-6 rounded-[2rem] bg-background-dark/50 border border-white/5 relative overflow-hidden group">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Publicaciones</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic tracking-tighter">{autoData.posts}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Posts</span>
                              </div>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-background-dark/50 border border-white/5 relative overflow-hidden group">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Producciones</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white italic tracking-tighter">{autoData.productions}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase italic">Days</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-white/5 space-y-4">
                            <button onClick={handleSaveReport} className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Sincronizar
                            </button>
                            <button disabled={isDownloading} onClick={handleDownloadPDF} className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-primary to-primary-dark text-white font-black text-xs uppercase transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-primary/20">
                               {isDownloading ? 'Certificando...' : 'Generar Reporte Pro'}
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

      {/* HIDDEN PDF CONTENT */}
      <div className="fixed left-[-9999px] top-0">
        <div id="performance-pdf-content" className="w-[1000px] bg-white text-slate-900">
          {selectedProject && (
            <>
              {/* PAGE 1: OVERVIEW */}
              <div id="pdf-page-1" className="p-10 space-y-12 pb-24">
                {/* PDF HEADER: REFINED & TIGHTER */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                     <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                       RENDIMIENTO <span className="text-slate-400">ESTRATÉGICO</span>
                     </h1>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-full">{selectedMonth} {selectedYear}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-slate-900 italic uppercase tracking-widest leading-none">Confidencial</p>
                     <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">SISTEMA VISUAL OSCART</p>
                  </div>
                </div>

                {/* PROJECT INFO: MORE COMPACT */}
                <div className="grid grid-cols-12 gap-5">
                   <div className="col-span-8 p-8 bg-slate-900 rounded-[2rem] text-white flex items-center gap-6 relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                         <Trophy className="w-16 h-16 text-white" />
                      </div>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                         {selectedProject.logoUrl ? (
                           <img src={selectedProject.logoUrl} className="w-full h-full object-contain" crossOrigin="anonymous" alt="" />
                         ) : (
                           <Users className="w-8 h-8" />
                         )}
                      </div>
                      <div className="relative">
                         <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">{selectedProject.name}</h2>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{selectedProject.niche}</p>
                      </div>
                   </div>
                   <div className="col-span-4 grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PUBLICACIONES</p>
                         <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{autoData.posts}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PRODUCCIONES</p>
                         <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{autoData.productions}</span>
                      </div>
                   </div>
                </div>

                {/* MAIN METRICS: HORIZONTAL LIST */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">ANÁLISIS DE IMPACTO POR RED SOCIAL</h3>
                    <div className="grow h-[1px] bg-slate-100"></div>
                  </div>

                  <div className="flex flex-col gap-4">
                     {activePlatforms.map(platform => {
                       const pInfo = PLATFORMS.find(x => x.id === platform)!;
                       const fComp = getComparison(platform, 'followers');
                       const rComp = getComparison(platform, 'reach');

                       return (
                         <div key={platform} className="p-5 border border-slate-100 rounded-[2rem] bg-slate-50/10 flex items-center gap-8">
                            {/* PLATFORM LABEL */}
                            <div className="w-40 flex items-center gap-3 shrink-0 border-r border-slate-100 pr-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                  <pInfo.icon className="w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">{platform}</h4>
                                  <span className="text-[8px] font-black text-emerald-500 uppercase italic">Activa</span>
                               </div>
                            </div>

                            {/* FOLLOWERS COLUMN */}
                            <div className="grow grid grid-cols-12 items-center gap-6">
                               <div className="col-span-5 flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seguidores</p>
                                    {fComp && (
                                      <span className={`text-[8px] font-black ${fComp.increased ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {fComp.increased ? '▲' : '▼'} {fComp.percent}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-end gap-3 pt-1 border-t border-slate-50">
                                     <div className="flex flex-col">
                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Ant.</span>
                                        <span className="text-sm font-black text-slate-400 tabular-nums">{fComp ? fComp.prevValue.toLocaleString() : '--'}</span>
                                     </div>
                                     <ChevronRight className="w-3 h-3 text-slate-200 mb-1" />
                                     <div className="flex flex-col">
                                        <span className="text-[7px] font-bold text-slate-900 uppercase">Act.</span>
                                        <p className={`text-xl font-black tabular-nums tracking-tighter leading-none ${(!fComp || fComp.increased) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                           {metrics[platform].followers.toLocaleString()}
                                        </p>
                                     </div>
                                  </div>
                               </div>

                               {/* REACH COLUMN */}
                               <div className="col-span-7 flex flex-col gap-1.5 pl-6 border-l border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alcance Efectivo</p>
                                    {rComp && (
                                      <span className={`text-[8px] font-black ${rComp.increased ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {rComp.increased ? '▲' : '▼'} {rComp.percent}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-end gap-4 pt-1 border-t border-slate-50">
                                     <div className="flex flex-col">
                                        <span className="text-[7px] font-bold text-slate-400 uppercase">Historial</span>
                                        <span className="text-sm font-black text-slate-400 tabular-nums">{rComp ? rComp.prevValue.toLocaleString() : '--'}</span>
                                     </div>
                                     <ChevronRight className="w-3 h-3 text-slate-200 mb-1" />
                                     <div className="flex flex-col">
                                        <span className="text-[7px] font-bold text-slate-900 uppercase">Pico Mensual</span>
                                        <p className={`text-xl font-black tabular-nums tracking-tighter leading-none ${(!rComp || rComp.increased) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                           {metrics[platform].reach.toLocaleString()}
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                </div>

                {extraWorks.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">ACCIONES ADICIONALES</h3>
                      <div className="grow h-[1px] bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {extraWorks.map((work, idx) => (
                        <div key={idx} className="p-4 border border-slate-100 rounded-2xl flex items-center gap-3 bg-slate-50/10">
                           <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <Plus className="text-white w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">{work.description}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic">{safeFormat(work.date, 'dd MMMM yyyy')}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PAGE 2: EXECUTION DETAIL (BITÁCORA) */}
              {(activeCampaign && (activeCampaign.themes.length > 0 || activeCampaign.productionDates.length > 0)) && (
                <div id="pdf-page-2" className="p-10 pt-20 space-y-12 pb-24">
                   <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6">
                      <div className="space-y-1">
                         <h3 className="text-4xl font-black italic uppercase tracking-tighter">Bitácora de Ejecución</h3>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Registro Mensual</span>
                      </div>
                   </div>

                   <div className="space-y-12">
                      {/* THEMES / POSTS LIST */}
                      <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            {activeCampaign.themes.map((theme, i) => {
                               const themeTask = tasks.find(t => t.campaignId === activeCampaign.id && t.campaignThemeId === theme.id);
                               return (
                                 <div key={i} className="p-5 bg-slate-900 rounded-[1.5rem] flex gap-4 items-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                       <Target className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white shrink-0 border border-white/10">
                                       {i + 1}
                                    </div>
                                    <div className="grow">
                                       <p className="text-[11px] font-black text-white uppercase italic tracking-tight leading-tight mb-1">{theme.title}</p>
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                             <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{safeFormat(themeTask?.date, 'dd MMM')}</span>
                                          </div>
                                          <span className="text-[7px] font-black text-emerald-500 uppercase italic tracking-widest">Publicado</span>
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </div>

                      {/* PRODUCTION DATES */}
                      {activeCampaign.productionDates.length > 0 && (
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center">
                                 <CalendarIcon className="w-5 h-5 text-slate-900" />
                              </div>
                              <h4 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 italic">Calendario de Producción</h4>
                              <div className="grow h-[2px] bg-slate-900/5"></div>
                           </div>
                           <div className="flex flex-wrap gap-3">
                              {activeCampaign.productionDates.map((pDate, i) => (
                                 <div key={i} className="px-6 py-4 border-2 border-slate-900 rounded-2xl flex items-center gap-3 bg-white shadow-sm">
                                    <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[9px] font-black italic">
                                       0{i + 1}
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-[0.1em]">
                                       {safeFormat(pDate.date, 'dd MMMM')}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
