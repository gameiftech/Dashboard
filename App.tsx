import React, { useState } from 'react';
import { parseExcelFile } from './services/excelService';
import { analyzeData } from './services/geminiService';
import { AppState, ViewMode, AnalysisResult } from './types';
import FileUpload from './components/FileUpload';
import DashboardView from './components/DashboardView';
import DataTableView from './components/DataTableView';
import ExecutiveSummary from './components/ExecutiveSummary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Security: State to control visibility of sensitive data (LGPD)
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);

  // Refresh Control
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.PROCESSING);
      setErrorMsg(null);
      
      // 1. Parse Excel
      const rawData = await parseExcelFile(file);
      
      // 2. Analyze with Gemini
      const result = await analyzeData(rawData);
      
      setAnalysisResult(result);
      setAppState(AppState.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Ocorreu um erro desconhecido.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAppState(AppState.UPLOAD);
    setViewMode(ViewMode.DASHBOARD);
    setErrorMsg(null);
    setIsPrivacyMode(false);
  };

  const handleRefresh = () => {
    if (!analysisResult) return;
    
    setIsRefreshing(true);
    
    // Simulate data fetching/re-processing delay for UI feedback (Power BI feel)
    setTimeout(() => {
      setRefreshKey(prev => prev + 1); // Forces DashboardView and ExecutiveSummary to remount and re-animate
      setIsRefreshing(false);
    }, 800);
  };

  if (appState === AppState.UPLOAD || appState === AppState.PROCESSING || appState === AppState.ERROR) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        {appState === AppState.ERROR && (
           <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 max-w-md animate-fade-in shadow-sm">
             <AlertCircle className="w-6 h-6 flex-shrink-0" />
             <div>
               <p className="font-bold">Erro no processamento</p>
               <p className="text-sm">{errorMsg}</p>
             </div>
             <button onClick={() => setAppState(AppState.UPLOAD)} className="ml-auto text-sm font-semibold underline">Tentar novamente</button>
           </div>
        )}
        <FileUpload 
          onFileSelect={handleFileSelect} 
          isProcessing={appState === AppState.PROCESSING} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar 
        currentView={viewMode} 
        onViewChange={setViewMode} 
        onReset={handleReset} 
      />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 relative">
        <Header 
          data={analysisResult!} 
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isPrivacyMode={isPrivacyMode}
          onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
        />

        <main className="p-8 flex-1 overflow-y-auto" id="main-content">
          <div className="max-w-7xl mx-auto">
            {viewMode === ViewMode.DASHBOARD && (
              <DashboardView 
                key={`dash-${refreshKey}`} // Changing this key triggers a full re-render/animation
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
                key={`summary-${refreshKey}`} // Also re-render summary on refresh to replay animations
                summary={analysisResult!.executiveSummary} 
              />
            )}
          </div>
        </main>

        <footer className="py-4 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
          <p>
            &copy; {new Date().getFullYear()} <a href="https://gameiftech2026.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors font-medium">GameIfTech</a>. Todos os direitos reservados.
          </p>
        </footer>

        {/* 
            HIDDEN REPORT CONTAINER FOR PDF GENERATION 
            Width set to 1600px for High Res Capture
        */}
        {analysisResult && (
          <div id="hidden-report-container" className="fixed top-0 left-[-10000px] w-[1600px] bg-white z-[-10]">
             
             {/* Page 1: Dashboard */}
             <div id="report-dashboard-section" className="p-16 min-h-screen bg-white">
                <div className="mb-10 border-b border-slate-200 pb-6">
                  <h1 className="text-4xl font-extrabold text-slate-900">Dashboard Analítico</h1>
                  <p className="text-slate-500 text-xl mt-2">Relatório: {analysisResult.reportName}</p>
                </div>
                <DashboardView 
                  data={analysisResult} 
                  isPrivacyMode={isPrivacyMode} 
                  hideControls={true} 
                />
             </div>

             {/* Page 2: Executive Summary */}
             <div id="report-summary-section" className="p-16 min-h-screen bg-white">
                <div className="mb-10 border-b border-slate-200 pb-6">
                  <h1 className="text-4xl font-extrabold text-slate-900">Resumo Executivo & Plano de Ação</h1>
                  <p className="text-slate-500 text-xl mt-2">Diagnóstico Inteligente</p>
                </div>
                <ExecutiveSummary summary={analysisResult.executiveSummary} />
             </div>

          </div>
        )}

      </div>
    </div>
  );
}