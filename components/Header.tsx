import React from 'react';
import { Share2, Download, RefreshCw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AnalysisResult } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface HeaderProps {
  data: AnalysisResult;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
}

const Header: React.FC<HeaderProps> = ({ data, onRefresh, isRefreshing = false, isPrivacyMode, onTogglePrivacy }) => {
  
  const handleExportPDF = async () => {
    // Busca os elementos ocultos renderizados no App.tsx
    const dashboardElement = document.getElementById('report-dashboard-section');
    const summaryElement = document.getElementById('report-summary-section');
    
    if (!dashboardElement || !summaryElement) {
      alert("Erro: Elementos do relatório não encontrados.");
      return;
    }
    
    // Feedback visual no botão
    const btn = document.getElementById('export-btn');
    const originalContent = btn ? btn.innerHTML : 'PDF';
    if(btn) btn.innerHTML = '<span class="animate-pulse">Gerando HQ...</span>';

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // A4 Width in mm (approx 210)
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Configurações Comuns para Alta Qualidade
      const canvasOptions = { 
        scale: 3, // Aumenta a resolução (3x para nitidez)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Garante fundo branco puro
        windowWidth: 1600 // Força a largura de renderização
      };

      // --- PÁGINA 1: DASHBOARD ---
      const canvasDashboard = await html2canvas(dashboardElement, canvasOptions);
      
      const imgDataDash = canvasDashboard.toDataURL('image/png');
      const imgPropsDash = pdf.getImageProperties(imgDataDash);
      const imgHeightDash = (imgPropsDash.height * pdfWidth) / imgPropsDash.width;
      
      pdf.addImage(imgDataDash, 'PNG', 0, 0, pdfWidth, imgHeightDash);
      
      // --- PÁGINA 2: RESUMO EXECUTIVO ---
      pdf.addPage(); // Adiciona nova página
      
      const canvasSummary = await html2canvas(summaryElement, canvasOptions);

      const imgDataSum = canvasSummary.toDataURL('image/png');
      const imgPropsSum = pdf.getImageProperties(imgDataSum);
      const imgHeightSum = (imgPropsSum.height * pdfWidth) / imgPropsSum.width;

      // Se o resumo for muito longo, pode cortar, mas ajustamos para começar no topo
      pdf.addImage(imgDataSum, 'PNG', 0, 0, pdfWidth, imgHeightSum);

      // --- RODAPÉ EM TODAS AS PÁGINAS ---
      const totalPages = (pdf.internal as any).getNumberOfPages();
      const dateStr = new Date().toLocaleDateString('pt-BR');
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`GameIfTech AI Analysis - ${dateStr} - Pág ${i}/${totalPages}`, 10, pdfHeight - 10);
      }

      pdf.save(`Relatorio_Inteligente_${data.reportType}_${new Date().getTime()}.pdf`);
      
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar o PDF completo.");
    } finally {
      if(btn) btn.innerHTML = originalContent;
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copiado para a área de transferência!");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{data.reportName}</h2>
        <div className="flex items-center gap-2">
           <span className="px-2 py-0.5 rounded text-xs font-semibold bg-totvs-100 text-totvs-600 border border-totvs-200 uppercase tracking-wide">
             {data.reportType}
           </span>
           <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
             <ShieldCheck className="w-3 h-3" />
             Ambiente Seguro
           </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePrivacy}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all border ${
            isPrivacyMode 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : 'text-slate-500 hover:bg-slate-50 border-transparent hover:border-slate-200'
          }`}
          title={isPrivacyMode ? "Desativar Modo Privacidade" : "Ativar Modo Privacidade (Ocultar Valores)"}
        >
          {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden md:inline">{isPrivacyMode ? "Oculto" : "Visível"}</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-totvs-600 hover:bg-totvs-50 rounded-lg transition-colors group"
          title="Atualizar Visualização"
        >
          <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180'}`} />
        </button>
        
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </button>

        <button 
          id="export-btn"
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          PDF Completo
        </button>
      </div>
    </header>
  );
};

export default Header;