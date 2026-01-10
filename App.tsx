import React, { useState, useEffect } from 'react';
import { parseExcelFile } from './services/excelService';
import { analyzeData } from './services/geminiService';
import { STATIC_DEMO_DATA } from './services/demoData';
import { supabase, isConfigured } from './services/supabaseClient';
import { AppState, ViewMode, AnalysisResult, HistoryItem } from './types';
import FileUpload from './components/FileUpload';
import DashboardView from './components/DashboardView';
import DataTableView from './components/DataTableView';
import ExecutiveSummary from './components/ExecutiveSummary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import { AlertCircle, MessageSquarePlus, X, Sparkles, LogOut, PlayCircle, Settings, Key, Database, Clock, Trash2, ChevronRight, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawDataCache, setRawDataCache] = useState<any[]>([]); 
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Security & Auth
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);

  // Password Recovery State
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Refresh Control
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Layout Control
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State Control
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // --- HELPER: USER SPECIFIC STORAGE KEY ---
  const getHistoryStorageKey = (userId?: string) => {
    if (!userId) return null;
    return `analysis_history_${userId}`;
  };

  // --- SCROLL TO TOP ON NAVIGATION ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewMode, appState]);

  // --- LOAD HISTORY BASED ON ACTIVE USER ---
  useEffect(() => {
    if (session?.user?.id) {
      const key = getHistoryStorageKey(session.user.id);
      if (key) {
        const savedHistory = localStorage.getItem(key);
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch (e) {
            console.error("Failed to parse history", e);
            setHistory([]);
          }
        } else {
          setHistory([]); // Reset history if new user has no data
        }
      }
    } else {
      setHistory([]);
    }
  }, [session]);

  // --- SUPABASE CONFIG CHECK & AUTH LISTENER ---
  useEffect(() => {
    if (!isConfigured) return; 

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setAnalysisResult(STATIC_DEMO_DATA);
        setRawDataCache(STATIC_DEMO_DATA.cleanData);
        setAppState(AppState.DASHBOARD);
      }
    }).catch(err => {
      console.warn("Supabase auth check failed.", err);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN') {
        setAnalysisResult(STATIC_DEMO_DATA);
        setRawDataCache(STATIC_DEMO_DATA.cleanData);
        setAppState(AppState.DASHBOARD);
      } else if (event === 'SIGNED_OUT') {
        setAppState(AppState.LANDING);
        setAnalysisResult(null);
        setRawDataCache([]);
        setHistory([]); 
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordResetOpen(true);
        setAppState(AppState.DASHBOARD);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveToHistory = (result: AnalysisResult, fileName: string) => {
    if (!session?.user?.id) return;

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      fileName: fileName,
      reportName: result.reportName,
      reportType: result.reportType,
      result: result
    };

    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);

    const key = getHistoryStorageKey(session.user.id);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn("Storage full", e);
        alert("Atenção: O armazenamento do seu navegador está cheio. Tente limpar itens antigos.");
      }
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setAnalysisResult(item.result);
    setRawDataCache(item.result.cleanData);
    setAppState(AppState.DASHBOARD);
    setViewMode(ViewMode.DASHBOARD);
    setIsHistoryModalOpen(false); 
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    const key = getHistoryStorageKey(session.user.id);
    if (key) {
      localStorage.setItem(key, JSON.stringify(newHistory));
    }
  };

  const clearHistory = () => {
    if (!session?.user?.id) return;
    if (window.confirm("Tem certeza que deseja apagar todo o histórico deste usuário?")) {
      setHistory([]);
      const key = getHistoryStorageKey(session.user.id);
      if (key) {
        localStorage.removeItem(key);
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.PROCESSING);
      setErrorMsg(null);
      const rawData = await parseExcelFile(file);
      setRawDataCache(rawData); 
      const result = await analyzeData(rawData);
      setAnalysisResult(result);
      saveToHistory(result, file.name); 
      setAppState(AppState.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Ocorreu um erro desconhecido.");
      setAppState(AppState.ERROR);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setErrorMsg(null);
      const rawData = STATIC_DEMO_DATA.cleanData;
      setRawDataCache(rawData);
      setAnalysisResult(STATIC_DEMO_DATA);
      setAppState(AppState.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setErrorMsg("Erro ao carregar demonstração: " + error.message);
      setAppState(AppState.ERROR);
    }
  };

  const handleSubmitCustomAnalysis = async () => {
    if (!rawDataCache || rawDataCache.length === 0 || !customPrompt.trim()) return;
    setIsAnalysisModalOpen(false);
    try {
      setAppState(AppState.PROCESSING);
      const result = await analyzeData(rawDataCache, customPrompt);
      setAnalysisResult(result);
      saveToHistory(result, "Análise Personalizada");
      setAppState(AppState.DASHBOARD);
      setViewMode(ViewMode.DASHBOARD);
      setCustomPrompt('');
    } catch (error: any) {
      console.error("Re-analysis failed:", error);
      setErrorMsg(error.message || "Falha na reanálise personalizada.");
      setAppState(AppState.ERROR);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setPasswordResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Senha atualizada com sucesso!");
      setIsPasswordResetOpen(false);
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      alert("Erro ao atualizar senha: " + error.message);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setRawDataCache([]);
    setAppState(AppState.UPLOAD);
    setViewMode(ViewMode.DASHBOARD);
    setErrorMsg(null);
    setIsPrivacyMode(false);
  };

  const handleLogout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
  };

  const handleRefresh = () => {
    if (!analysisResult) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1); 
      setIsRefreshing(false);
    }, 800);
  };

  const handleExportPDF = async () => {
    if (!analysisResult) return;
    setIsExporting(true);

    try {
      const page1 = document.getElementById('report-page-1');
      const page2 = document.getElementById('report-page-2');
      const page3 = document.getElementById('report-page-3');
      const page4 = document.getElementById('report-page-4');

      if (!page1 || !page2 || !page3) {
        throw new Error("Elementos do relatório não encontrados.");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const options = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, 
        onclone: (clonedDoc: Document) => {
           const pages = ['report-page-1', 'report-page-2', 'report-page-3', 'report-page-4'];
           pages.forEach(id => {
             const el = clonedDoc.getElementById(id);
             if (el) el.style.backgroundColor = '#ffffff';
           });
        }
      };

      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 297;
      
      const captureAndAddPage = async (element: HTMLElement, isFirst: boolean) => {
        if (!element) return;
        if (!isFirst) pdf.addPage();
        const canvas = await html2canvas(element, options);
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        const printWidth = pdfWidth;
        const printHeight = pdfWidth / ratio;
        pdf.addImage(imgData, 'PNG', 0, 0, printWidth, printHeight);
      };

      await captureAndAddPage(page1, true);
      await captureAndAddPage(page2, false);
      await captureAndAddPage(page3, false);
      if (page4) await captureAndAddPage(page4, false);

      const safeDate = new Date().toISOString().slice(0,10);
      const fileName = `Analise_Completa_${analysisResult.reportType}_${safeDate}.pdf`;
      pdf.save(fileName);

    } catch (e) {
      console.error("Erro na exportação PDF:", e);
      alert("Erro ao gerar o relatório completo. Tente novamente em alguns segundos.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper formatting for History
  const formatHistoryDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Settings className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configuração Pendente</h1>
              <p className="text-slate-400">Conexão com Banco de Dados</p>
            </div>
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Você executou o script SQL com sucesso! Agora, para o sistema funcionar, ele precisa saber 
            <strong> qual projeto Supabase</strong> deve acessar.
          </p>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 mb-8 space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold shrink-0">1</span>
              <p className="text-sm text-slate-300">Abra o arquivo <code className="text-cyan-400 font-mono bg-slate-800 px-1 py-0.5 rounded">services/supabaseClient.ts</code></p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold shrink-0">2</span>
              <p className="text-sm text-slate-300">Cole sua <strong>Project URL</strong> e <strong>Anon Key</strong> (obtidas em Supabase {'>'} Settings {'>'} API).</p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold shrink-0">3</span>
              <p className="text-sm text-slate-300">Salve o arquivo. Esta tela atualizará automaticamente.</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-slate-500 bg-slate-900 p-4 rounded-lg border border-slate-800">
             <Key className="w-4 h-4 shrink-0 mt-0.5" />
             <p>Suas chaves são salvas apenas no seu código local e nunca são compartilhadas.</p>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.LANDING && !session) {
    return <LandingPage onStart={handleLoadDemo} />;
  }

  if (appState === AppState.UPLOAD || appState === AppState.PROCESSING || appState === AppState.ERROR) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative p-4">
        {appState === AppState.UPLOAD && (
           <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
             <button 
               onClick={handleLogout}
               className="pointer-events-auto flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 text-sm font-medium transition-all bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-red-100 shadow-sm group"
             >
               <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="hidden sm:inline">Sair do Sistema</span>
             </button>

             <button 
               onClick={handleLoadDemo}
               className="pointer-events-auto flex items-center gap-2 text-indigo-600 hover:text-white hover:bg-indigo-600 text-sm font-bold transition-all bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-indigo-100 shadow-lg shadow-indigo-100/50 hover:shadow-indigo-500/30 group animate-fade-in-up"
             >
               <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
               <span className="hidden sm:inline">Carregar Demonstração</span>
               <span className="sm:hidden">Demo</span>
             </button>
           </div>
        )}

        {appState === AppState.ERROR && (
           <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 max-w-md animate-fade-in shadow-sm relative z-10">
             <AlertCircle className="w-6 h-6 flex-shrink-0" />
             <div>
               <p className="font-bold">Erro no processamento</p>
               <p className="text-sm break-words">{errorMsg}</p>
             </div>
             <button onClick={() => setAppState(AppState.UPLOAD)} className="ml-auto text-sm font-semibold underline whitespace-nowrap">Tentar novamente</button>
           </div>
        )}
        <FileUpload 
          onFileSelect={handleFileSelect} 
          isProcessing={appState === AppState.PROCESSING} 
          onBack={handleLogout}
        />
      </div>
    );
  }

  // --- VIEW: MAIN APP (DASHBOARD) ---
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentView={viewMode} 
        onViewChange={setViewMode} 
        onReset={handleReset} 
        onLogout={handleLogout}
        onImport={() => setAppState(AppState.UPLOAD)}
        onOpenAnalysisModal={() => setIsAnalysisModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onExport={handleExportPDF}
        isExporting={isExporting}
      />

      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        <Header 
          data={analysisResult!} 
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isPrivacyMode={isPrivacyMode}
          onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentUser={session?.user}
        />

        <main className="p-4 md:p-8 flex-1 overflow-y-auto" id="main-content">
          <div className="max-w-7xl mx-auto">
            {viewMode === ViewMode.DASHBOARD && (
              <DashboardView 
                key={`dash-${refreshKey}`} 
                data={analysisResult!} 
                isPrivacyMode={isPrivacyMode} 
              />
            )}
            {viewMode === ViewMode.TABLE && (
              <DataTableView 
                data={analysisResult!} 
                isPrivacyMode={isPrivacyMode}
              />
            )}
            {viewMode === ViewMode.SUMMARY && (
              <ExecutiveSummary 
                key={`summary-${refreshKey}`}
                summary={analysisResult!.executiveSummary} 
              />
            )}
          </div>
        </main>

        <footer className="py-4 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
          <p>
            &copy; {new Date().getFullYear()} <a href="https://www.linkedin.com/in/deividfcastro/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors font-medium">Deivid Castro</a>. Todos os direitos reservados.
          </p>
        </footer>

        {/* HIDDEN REPORT CONTAINER FOR PDF GENERATION */}
        {analysisResult && (
          <div id="hidden-report-container" className="fixed top-0 left-[-9999px] w-[1200px] z-[-50] opacity-0 pointer-events-none bg-white text-black font-sans">
             
             {/* PAGE 1: Overview */}
             <div id="report-page-1" className="p-12 min-h-[850px] bg-white text-black flex flex-col">
                <div className="mb-8 border-b-2 border-slate-900 pb-6">
                  <h1 className="text-4xl font-black text-black uppercase tracking-tight">Relatório de Performance</h1>
                  <p className="text-slate-600 text-xl mt-2 font-medium">Ciclo de Análise: {analysisResult.reportName}</p>
                </div>
                <DashboardView 
                  data={analysisResult} 
                  isPrivacyMode={isPrivacyMode} 
                  hideControls={true}
                  disableAnimations={true}
                  showKPIs={true}
                  customCharts={analysisResult.charts.slice(0, 4)} 
                />
             </div>

             {/* PAGE 2: Detailed Charts */}
             <div id="report-page-2" className="p-12 min-h-[850px] bg-white text-black flex flex-col mt-4">
               <div className="mb-8 border-b-2 border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold text-slate-800">Detalhamento Analítico</h2>
                </div>
                <DashboardView 
                  data={analysisResult} 
                  isPrivacyMode={isPrivacyMode} 
                  hideControls={true}
                  disableAnimations={true}
                  showKPIs={false}
                  customCharts={analysisResult.charts.slice(4)}
                />
             </div>

             {/* PAGE 3: Executive Summary */}
             <div id="report-page-3" className="p-12 min-h-[850px] bg-white text-black flex flex-col mt-4">
                <div className="mb-8 border-b-2 border-slate-900 pb-6">
                  <h1 className="text-3xl font-black text-black uppercase tracking-tight">Resumo Executivo</h1>
                </div>
                <ExecutiveSummary summary={analysisResult.executiveSummary} />
             </div>

             {/* PAGE 4: Data Table (New) */}
             <div id="report-page-4" className="p-12 min-h-[850px] bg-white text-black flex flex-col mt-4">
                <div className="mb-8 border-b-2 border-slate-900 pb-6">
                  <h1 className="text-3xl font-black text-black uppercase tracking-tight">Dados Processados (Amostra)</h1>
                  <p className="text-slate-500 mt-2">Visualização tabular dos dados sanitizados pela IA.</p>
                </div>
                <DataTableView 
                  data={analysisResult} 
                  isPrivacyMode={isPrivacyMode} 
                  printMode={true}
                />
             </div>

          </div>
        )}

        {/* Custom Analysis Modal */}
        {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAnalysisModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-scale-in">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <MessageSquarePlus className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-800">Análise Personalizada</h3>
                   <p className="text-sm text-slate-500">O que você gostaria de aprofundar?</p>
                </div>
              </div>
              <button onClick={() => setIsAnalysisModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Ex: Foque apenas nas vendas..." className="w-full h-32 p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"></textarea>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> A IA reprocessará todos os dados focando no seu pedido.</p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsAnalysisModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleSubmitCustomAnalysis} disabled={!customPrompt.trim()} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"><Sparkles className="w-4 h-4" /> Gerar Nova Análise</button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setIsHistoryModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[85vh] animate-scale-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-cyan-50 rounded-lg text-cyan-600 border border-cyan-100">
                      <Clock className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Histórico de Análises</h3>
                      <p className="text-sm text-slate-500">Recupere relatórios anteriores salvos localmente</p>
                   </div>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                       <Clock className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-600">Nenhum histórico encontrado</p>
                    <p className="text-sm text-slate-400 max-w-xs mt-1">As análises que você gerar ficarão salvas aqui automaticamente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleHistorySelect(item)}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      >
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                               <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">{item.reportName}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wide">
                                    {item.reportType}
                                  </span>
                               </div>
                               <span className="text-xs text-slate-400 flex items-center gap-1">
                                  {formatHistoryDate(item.timestamp)} • {item.fileName}
                               </span>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir do histórico"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
             {history.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-between items-center">
                   <button 
                     onClick={clearHistory}
                     className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                   >
                     <Trash2 className="w-4 h-4" /> Limpar Tudo
                   </button>
                   <span className="text-xs text-slate-400 font-medium">
                     Armazenado localmente no navegador
                   </span>
                </div>
             )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}