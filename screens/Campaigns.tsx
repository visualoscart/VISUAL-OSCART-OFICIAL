
import React, { useState, useMemo, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { Project, Campaign, CampaignTheme, CampaignProductionDate } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

declare var html2pdf: any;

const Campaigns: React.FC = () => {
  const { projects, campaigns, addCampaign, updateCampaign, deleteCampaign, showToast, studioLogo } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewBodega, setIsViewBodega] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  // Form State
  const [month, setMonth] = useState(format(new Date(), 'MMMM', { locale: es }));
  const [year, setYear] = useState(new Date().getFullYear());
  const [objective, setObjective] = useState('');
  const [themes, setThemes] = useState<CampaignTheme[]>([]);
  const [productionDates, setProductionDates] = useState<CampaignProductionDate[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // UI state for theme expansion
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCampaigns = useMemo(() => {
    if (!selectedProject) return [];
    return campaigns.filter(c => c.projectId === selectedProject.id);
  }, [campaigns, selectedProject]);

  const resetForm = () => {
    setMonth(format(new Date(), 'MMMM', { locale: es }));
    setYear(new Date().getFullYear());
    setObjective('');
    setThemes([]);
    setProductionDates([]);
    setIsCreating(false);
    setEditingCampaignId(null);
    setExpandedThemeId(null);
  };

  const handleEditCampaign = (camp: Campaign) => {
    setMonth(camp.month);
    setYear(camp.year);
    setObjective(camp.objective || '');
    setThemes(camp.themes);
    setProductionDates(camp.productionDates);
    setEditingCampaignId(camp.id);
    setIsCreating(true);
    setIsViewBodega(false);
  };

  const handleAddTheme = () => {
    const newTheme: CampaignTheme = {
      id: `theme-${Date.now()}`,
      title: '',
      format: '',
      content: '',
    };
    setThemes([...themes, newTheme]);
    setExpandedThemeId(newTheme.id);
  };

  const handleCopyContent = (content: string, id: string) => {
    if (!content) {
      showToast('No hay contenido para copiar', 'error');
      return;
    }
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      showToast('Contenido copiado al portapapeles', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAddDate = () => {
    const newDate: CampaignProductionDate = {
      id: `date-${Date.now()}`,
      date: format(new Date(), 'yyyy-MM-dd'),
    };
    setProductionDates([...productionDates, newDate]);
  };

  const handleSaveCampaign = async () => {
    if (!selectedProject) return;
    if (!month || themes.length === 0) {
      showToast("Por favor ingresa el mes y al menos un tema.", "error");
      return;
    }

    if (editingCampaignId) {
      await updateCampaign(editingCampaignId, {
        month,
        year,
        objective,
        themes,
        productionDates
      });
    } else {
      const newCampaign: Omit<Campaign, 'id' | 'createdAt'> = {
        projectId: selectedProject.id,
        month,
        year,
        objective,
        themes,
        productionDates,
      };
      await addCampaign(newCampaign);
    }

    resetForm();
    setIsViewBodega(true);
  };

  const handleDownloadPDF = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDownloading(true);
    
    // Wait for state update and render
    setTimeout(async () => {
      const pdfElement = document.getElementById('campaign-pdf');
      if (pdfElement) {
        const brand = projects.find(p => p.id === campaign.projectId);
        const fileName = `Campania_${brand?.name || 'Marca'}_${campaign.month}_${campaign.year}.pdf`;
        
        try {
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

          // Get libraries from window
          const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
          const html2canvasLib = (window as any).html2canvas;

          if (!jsPDFLib) {
            throw new Error("Librería PDF no detectada. Por favor, recarga la página completamente.");
          }

          if (!html2canvasLib) {
            throw new Error("Librería de captura no detectada. Por favor, recarga la página completamente.");
          }

          // Force use of jspdf namespace if available (standard for UMD)
          const pdf = (window as any).jspdf 
            ? new (window as any).jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
            : new jsPDFLib({ unit: 'mm', format: 'a4', orientation: 'portrait' });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const usableHeight = pageHeight - 15; // Increased usable area to avoid aggressive cutting
          const splitThreshold = 35; // Better threshold for pb-24 padding (~25mm)

          // 1. Capture the Summary Page
          const summaryEl = document.getElementById('pdf-summary-page');
          if (summaryEl) {
            const canvas = await html2canvasLib(summaryEl, {
              scale: 2,
              useCORS: true,
              width: 794,
              windowWidth: 794,
              logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            // Add first page
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
              scale: 2,
              useCORS: true,
              width: 794,
              windowWidth: 794,
              logging: false
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            // Always start a theme on a new page
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

          // 3. Add Footers to all pages
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // REMOVED FOOTER MASK: No more cutting lines in half
            
            // Footer Line
            pdf.setDrawColor(240, 240, 240);
            pdf.setLineWidth(0.5);
            pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
            
            // Footer Logo
            if (logoData) {
              try {
                // Drawing a circular clip path for the logo is complex in jsPDF direct, 
                // so we use a clean white background circle and fit the logo inside
                pdf.setFillColor(255, 255, 255);
                pdf.circle(15, pageHeight - 10, 5, 'F');
                // Use a slightly smaller image to ensure it stays within the circle's visual bounds
                pdf.addImage(logoData, 'PNG', 11.5, pageHeight - 13.5, 7, 7);
              } catch (e) {
                pdf.setFillColor(245, 245, 245);
                pdf.circle(15, pageHeight - 10, 4, 'F');
              }
            } else {
              pdf.setFillColor(245, 245, 245);
              pdf.circle(15, pageHeight - 10, 4, 'F');
            }
            
            // Footer Text
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(
              `Documento Confidencial - Estrategia de Campaña ${campaign.month} ${campaign.year} - ${brand?.name || 'Marca'}`, 
              22, 
              pageHeight - 9
            );
            
            // Page Number
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`PÁGINA ${i} DE ${totalPages}`, pageWidth - 35, pageHeight - 9);
          }

          pdf.save(fileName);
          showToast("PDF generado con éxito");
        } catch (e: any) {
          console.error("PDF Error:", e);
          showToast(`Error al generar PDF: ${e.message || 'Error desconocido'}`, "error");
        } finally {
          setIsDownloading(false);
          setSelectedCampaign(null);
        }
      }
    }, 500);
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
      
      {/* HEADER SECTION (Static) */}
      <header className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-background-dark/30 backdrop-blur-2xl shrink-0 z-20">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Gestión de Campañas</h1>
          </div>
          <p className="text-slate-600 font-black text-[7px] uppercase tracking-[0.3em] opacity-60">Planificación estratégica y ejecución de contenido</p>
        </div>
        
        {selectedProject && (
          <button 
            onClick={() => { setSelectedProject(null); setIsCreating(false); setIsViewBodega(false); }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver a Marcas
          </button>
        )}
      </header>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 pb-32 scrollbar-hide relative z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {!selectedProject ? (
            /* PROJECT SELECTOR */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { setSelectedProject(project); setIsViewBodega(true); }}
                  className="group relative flex flex-col p-8 rounded-[2.5rem] bg-card-dark border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden text-left shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 p-0 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-inner">
                      {project.logoUrl ? (
                        <img src={project.logoUrl} className="w-full h-full object-cover" alt={project.name} referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-slate-500">image</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight grow line-clamp-1 italic uppercase">{project.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        {project.niche}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Estrategias Guardadas</p>
                      <p className="text-2xl font-black text-white italic">
                        {campaigns.filter(c => c.projectId === project.id).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <span className="material-symbols-outlined">folder_open</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* BRAND NAV & ACTIONS */}
              <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 p-0 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                    <img src={selectedProject.logoUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{selectedProject.name}</h2>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setIsViewBodega(true); setIsCreating(false); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isViewBodega && !isCreating ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                  >
                    <span className="material-symbols-outlined">inventory_2</span>
                    Bodega
                  </button>
                  <button 
                    onClick={() => { setIsCreating(true); setIsViewBodega(false); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isCreating ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Crear Campaña
                  </button>
                </div>
              </div>

              {/* BODEGA VIEW */}
              {isViewBodega && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  {filteredCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-500">folder_off</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Bodega Vacía</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mt-2">Aún no has creado estrategias para {selectedProject.name}. ¡Empieza ahora!</p>
                      </div>
                      <button 
                        onClick={() => { setIsCreating(true); setIsViewBodega(false); }}
                        className="px-8 py-3 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
                      >
                        Crear Primera Campaña
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCampaigns.map(camp => (
                        <div key={camp.id} className="group bg-card-dark border border-white/5 p-6 rounded-[2rem] hover:border-white/20 transition-all flex flex-col gap-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{camp.month}</h3>
                              <p className="text-primary font-black tracking-widest text-xs">AÑO {camp.year}</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditCampaign(camp)}
                                className="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                              <button 
                                onClick={() => deleteCampaign(camp.id)}
                                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                             <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-white font-black text-lg">{camp.themes.length}</span>
                                <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Temas / Guiones</span>
                             </div>
                             <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-white font-black text-lg">{camp.productionDates.length}</span>
                                <span className="text-[7px] font-black uppercase text-slate-500 tracking-tighter">Fechas Prod.</span>
                             </div>
                          </div>

                          <button 
                            onClick={() => handleDownloadPDF(camp)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Descargar Estrategia PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CREATION FORM */}
              {isCreating && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-right-8 duration-500">
                  {/* LEFT BAR: CONFIG */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-8 rounded-[2rem] bg-card-dark border border-white/5 space-y-8 sticky top-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mes de Campaña</label>
                        <select 
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none ring-0 focus:border-primary transition-all"
                        >
                          {months.map(m => <option key={m} value={m} className="bg-background-dark">{m}</option>)}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Año</label>
                        <input 
                          type="number"
                          value={year}
                          onChange={(e) => setYear(parseInt(e.target.value))}
                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objetivo de la Campaña</label>
                        <textarea 
                          placeholder="Define el objetivo estratégico, tono o meta de esta campaña..."
                          value={objective}
                          onChange={(e) => setObjective(e.target.value)}
                          className="w-full h-32 p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm resize-none focus:border-primary transition-all outline-none"
                        />
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <button 
                          onClick={handleSaveCampaign}
                          className="w-full py-5 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          {editingCampaignId ? 'Actualizar y Guardar' : 'Finalizar y Guardar'}
                        </button>
                        <button 
                          onClick={resetForm}
                          className="w-full py-5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MAIN SECTION: THEMES, CONTENT & DATES */}
                  <div className="lg:col-span-3 space-y-8 pb-32">
                    {/* 1. FECHAS DE PRODUCCIÓN (FIRST) */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">01</div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Fechas de Producción</h3>
                        </div>
                        <button onClick={handleAddDate} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase border border-white/10 transition-all flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">add</span> Añadir Fecha
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        {productionDates.map((pdate, idx) => (
                          <div key={pdate.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card-dark border border-white/5">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Sesión {idx + 1}</span>
                               <input 
                                type="date"
                                value={pdate.date}
                                onChange={(e) => setProductionDates(productionDates.map(d => d.id === pdate.id ? {...d, date: e.target.value} : d))}
                                className="bg-transparent border-none text-white font-bold focus:ring-0 p-0"
                              />
                            </div>
                            <button onClick={() => setProductionDates(productionDates.filter(d => d.id !== pdate.id))} className="text-slate-600 hover:text-rose-500">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        ))}
                        {productionDates.length === 0 && (
                          <p className="text-slate-500 text-xs italic py-2">No se han definido fechas todavía.</p>
                        )}
                      </div>
                    </section>

                    {/* 2. TEMAS Y GUIONES (SECOND) */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">02</div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Temas y Desarrollo</h3>
                        </div>
                        <button onClick={handleAddTheme} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">add</span> Crear Tema
                        </button>
                      </div>

                      <div className="space-y-4">
                        {themes.map((theme, idx) => {
                          const isExpanded = expandedThemeId === theme.id;
                          return (
                            <div key={theme.id} className={`p-8 rounded-[2.5rem] bg-card-dark border ${isExpanded ? 'border-primary/40 shadow-2xl shadow-primary/5' : 'border-white/5'} space-y-8 animate-in slide-in-from-left-4 transition-all`}>
                              <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white">{idx + 1}</div>
                                
                                <div className="grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                  <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Título del Tema</label>
                                    <input 
                                      placeholder="Ej: Introducción a la Marca..."
                                      value={theme.title}
                                      onChange={(e) => setThemes(themes.map(t => t.id === theme.id ? {...t, title: e.target.value} : t))}
                                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Formato / Red</label>
                                    <input 
                                      placeholder="Ej: Reel, TikTok, Carrusel..."
                                      value={theme.format}
                                      onChange={(e) => setThemes(themes.map(t => t.id === theme.id ? {...t, format: e.target.value} : t))}
                                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
                                    />
                                  </div>
                                </div>

                                <button onClick={() => setThemes(themes.filter(t => t.id !== theme.id))} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                   <span className="material-symbols-outlined">delete</span>
                                </button>
                              </div>

                              <div className="pt-6 border-t border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                  <button 
                                    onClick={() => setExpandedThemeId(expandedThemeId === theme.id ? null : theme.id)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                                    {isExpanded ? 'Cerrar Guión' : 'Abrir para escribir guión y contenido'}
                                  </button>

                                  <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => handleCopyContent(theme.content, theme.id)}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9.5px] font-black uppercase tracking-wider ${
                                        copiedId === theme.id 
                                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        {copiedId === theme.id ? 'check_circle' : 'content_copy'}
                                      </span>
                                      {copiedId === theme.id ? 'Copiado' : 'Copiar Texto'}
                                    </button>

                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha Prod.</label>
                                    <select 
                                      value={theme.productionId || ''}
                                      onChange={(e) => setThemes(themes.map(t => t.id === theme.id ? {...t, productionId: e.target.value} : t))}
                                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold outline-none"
                                    >
                                      <option value="" className="bg-background-dark italic text-slate-500">Por definir</option>
                                      {productionDates.map((d, i) => <option key={d.id} value={d.id} className="bg-background-dark">Sesión {i + 1} ({d.date})</option>)}
                                    </select>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                     <textarea 
                                        placeholder="Escribe aquí el guión, guion técnico o desarrollo creativo de este tema..."
                                        value={theme.content}
                                        onChange={(e) => setThemes(themes.map(t => t.id === theme.id ? {...t, content: e.target.value} : t))}
                                        className="w-full h-64 p-6 rounded-3xl bg-white/5 border border-white/10 text-white text-sm resize-none scrollbar-hide focus:border-primary/50 transition-all font-sans"
                                     />
                                     <p className="mt-2 text-[9px] text-slate-500 italic">El contenido se guardará automáticamente dentro de este tema.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
 
      {/* PDF HIDDEN TEMPLATE - Must NOT be display:none for html2canvas to work */}
      <div style={{ position: 'fixed', left: '-5000px', top: '0', zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
        <div ref={pdfRef} id="campaign-pdf" className="p-0 bg-white text-slate-900 font-sans relative w-[794px]">
          {selectedCampaign && (
            <div className="w-full">
              {/* PAGE 1: HEADER & SUMMARY */}
              <div id="pdf-summary-page" className="p-10 pb-24 space-y-8 bg-white flex flex-col">
                <div className="grow space-y-8">
                  {/* LOGO & BRAND */}
                  <div className="flex items-center justify-between mb-4 border-b-2 border-slate-900 pb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                        {projects.find(p => p.id === selectedCampaign.projectId)?.logoUrl && (
                          <img 
                            src={projects.find(p => p.id === selectedCampaign.projectId)?.logoUrl} 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                            alt="" 
                          />
                        )}
                      </div>
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">
                          Campaña de Contenido
                        </h1>
                        <p className="text-xl font-bold text-slate-600 uppercase tracking-widest">
                          {projects.find(p => p.id === selectedCampaign.projectId)?.name} - {selectedCampaign.month} {selectedCampaign.year}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OBJECTIVE SECTION */}
                  {selectedCampaign.objective && (
                    <div className="space-y-4">
                       <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">Objetivo de la Campaña</h2>
                       <p className="text-[14px] leading-relaxed text-slate-700 italic">
                         {selectedCampaign.objective}
                       </p>
                    </div>
                  )}

                  {/* THEMES SUMMARY */}
                  <div className="space-y-4">
                     <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">Resumen de Pilares de Contenido</h2>
                     <div className="grid grid-cols-2 gap-3">
                        {selectedCampaign.themes.map((theme, i) => (
                          <div key={theme.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex justify-between items-center group">
                            <div className="flex gap-3 items-center">
                               <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-center font-bold text-[10px] leading-none">
                                 {i + 1}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[12px] font-black text-slate-900 uppercase leading-snug">{theme.title}</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{theme.format}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PROD.</div>
                               <div className="text-[10px] font-black text-slate-800">
                                 {selectedCampaign.productionDates.find(d => d.id === theme.productionId)?.date || 'Pte.'}
                               </div>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

              {/* DETAILED SCRIPTS: EACH ON NEW PAGE */}
              {selectedCampaign.themes.map((theme, i) => (
                <div key={theme.id} className="pdf-theme-page p-10 pb-24 pt-16 bg-white flex flex-col">
                    <div className="grow space-y-8">
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-2">
                         <h3 className="text-base font-black uppercase text-slate-900 leading-tight">
                           Pilar {i + 1}: {theme.title}
                         </h3>
                         <div className="flex items-center justify-center px-4 py-1.5 bg-slate-900 text-[7px] font-black text-white rounded-full tracking-[0.2em] leading-none">
                           FORMATO: {theme.format}
                         </div>
                      </div>
                      <div className="relative pt-1">
                         <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-900 tracking-tight">
                           {theme.content || 'Sin desarrollo redactado.'}
                         </pre>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

       <style>{`
          .avoid-break { page-break-inside: avoid; }
          .page-break-before { page-break-before: always; }
          #campaign-pdf pre { font-family: 'Plus Jakarta Sans', sans-serif; }
       `}</style>
    </div>
  );
};

export default Campaigns;
