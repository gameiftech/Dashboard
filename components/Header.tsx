import React, { useState } from 'react';
import { RefreshCw, Eye, EyeOff, ShieldCheck, Loader2, FileText, Download, Menu } from 'lucide-react';
import { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HeaderProps {
  data: AnalysisResult;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenSidebar: () => void; // Novo prop
}

const Header: React.FC<HeaderProps> = ({ 
  data, 
  onRefresh, 
  isRefreshing = false, 
  isPrivacyMode, 
  onTogglePrivacy,
  onOpenSidebar
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      // 1. Identificar os elementos das páginas
      const page1 = document.getElementById('report-page-1');
      const page2 = document.getElementById('report-page-2');
      const page3 = document.getElementById('report-page-3');

      if (!page1 || !page2 || !page3) {
        throw new Error("Elementos do relatório não encontrados.");
      }

      // 2. Delay de segurança
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Configuração do HTML2Canvas
      // Usamos scale 2 para boa qualidade em A4
      const options = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Largura fixa do container no App.tsx
        onclone: (clonedDoc: Document) => {
           // Forçar background branco no clone
           const p1 = clonedDoc.getElementById('report-page-1');
           const p2 = clonedDoc.getElementById('report-page-2');
           const p3 = clonedDoc.getElementById('report-page-3');
           if (p1) p1.style.backgroundColor = '#ffffff';
           if (p2) p2.style.backgroundColor = '#ffffff';
           if (p3) p3.style.backgroundColor = '#ffffff';
        }
      };

      // Inicializa PDF em Paisagem (Landscape) - A4
      // A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 297;
      const pdfHeight = 210;

      // Função helper para adicionar página
      const captureAndAddPage = async (element: HTMLElement, isFirst: boolean) => {
        if (!isFirst) pdf.addPage();
        
        const canvas = await html2canvas(element, options);
        const imgData = canvas.toDataURL('image/png');
        
        // Ajustar a imagem para caber na largura do A4 (297mm)
        // A altura será proporcional
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        
        // Se a imagem for mais alta que o PDF (muito vertical), ajustamos pela altura
        // Mas como nosso layout é landscape, ajustamos pela largura
        const printWidth = pdfWidth;
        const printHeight = pdfWidth / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, printWidth, printHeight);
      };

      // --- Captura Sequencial ---
      await captureAndAddPage(page1, true);
      await captureAndAddPage(page2, false);
      await captureAndAddPage(page3, false);

      // 4. Salvar Arquivo
      const safeDate = new Date().toISOString().slice(0,10);
      const fileName = `Relatorio_Completo_${data.reportType}_${safeDate}.pdf`;
      pdf.save(fileName);

    } catch (e) {
      console.error("Erro na exportação PDF:", e);
      alert("Erro ao gerar o arquivo PDF. Tente novamente em alguns segundos.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800 hidden lg:block truncate max-w-[200px] xl:max-w-none">{data.reportName}</h2>
          <h2 className="text-lg font-bold text-slate-800 lg:hidden block">Enterprise AI</h2>
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold bg-totvs-100 text-totvs-600 border border-totvs-200 uppercase tracking-wide">
               {data.reportType}
             </span>
             <span className="hidden sm:flex items-center gap-1 text-[10px] md:text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium whitespace-nowrap">
               <ShieldCheck className="w-3 h-3" />
               <span>Seguro</span>
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onTogglePrivacy}
          className={`flex items-center gap-2 px-2 md:px-3 py-2 text-sm font-medium rounded-lg transition-all border ${
            isPrivacyMode 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : 'text-slate-500 hover:bg-slate-50 border-transparent hover:border-slate-200'
          }`}
          title={isPrivacyMode ? "Desativar Modo Privacidade" : "Ativar Modo Privacidade (Ocultar Valores)"}
        >
          {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden md:inline">{isPrivacyMode ? "Oculto" : "Visível"}</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-totvs-600 hover:bg-totvs-50 rounded-lg transition-colors group"
          title="Atualizar Visualização"
        >
          <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180'}`} />
        </button>

        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed md:min-w-[140px] justify-center shadow-slate-200`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden md:inline">Gerando...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Baixar PDF</span>
              <span className="md:hidden">PDF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;