import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, BarChart3, ShieldCheck, Zap } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  onBack?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 w-full relative overflow-hidden px-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-slate-800 z-0"></div>
      
      <div className="z-10 w-full max-w-5xl mt-16 md:mt-0">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-medium tracking-wide uppercase">
            <Zap className="w-3 h-3" />
            Nova Versão 2.0 IA
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Análise Inteligente do <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Seu Negócio</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            Transforme dados brutos do seu ERP em inteligência de negócios.
            Basta arrastar sua planilha Excel exportada.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row mb-16 relative z-20">
          
          {/* Left: Upload Area */}
          <div className="flex-1 p-6 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <div
              className={`relative h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center cursor-pointer group
                ${dragActive 
                  ? "border-blue-500 bg-blue-50/50" 
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                }
                ${isProcessing ? "pointer-events-none opacity-80" : ""}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleChange}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center animate-pulse text-center p-4">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-lg font-semibold text-slate-700">Analisando Dados...</p>
                  <p className="text-sm text-slate-400 mt-2">Identificando padrões e KPIs</p>
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-slate-700 mb-1 text-center">
                    Arraste sua planilha aqui
                  </p>
                  <p className="text-sm text-slate-400 text-center">
                    ou clique para navegar nos arquivos
                  </p>
                </>
              )}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> .XLSX / .CSV</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Processamento Seguro</span>
            </div>
          </div>

          {/* Right: Features / Info */}
          <div className="bg-slate-50 p-6 md:p-12 w-full md:w-80 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Módulos Suportados</h3>
            
            <div className="space-y-4">
              {[
                { label: 'Faturamento & Vendas', color: 'bg-emerald-500' },
                { label: 'Estoque & Custos', color: 'bg-blue-500' },
                { label: 'Financeiro (Pagar/Receber)', color: 'bg-indigo-500' },
                { label: 'Controladoria & Fiscal', color: 'bg-violet-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-slate-600 font-medium text-sm">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                   <BarChart3 className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="font-semibold text-slate-900 text-sm">Dashboard Automático</p>
                   <p className="text-xs text-slate-500 mt-1">
                     A IA detecta colunas de data, valor e categoria automaticamente.
                   </p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center z-10 px-4">
        <p className="text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} <a href="https://www.linkedin.com/in/deividfcastro/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">Deivid Castro</a>. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;