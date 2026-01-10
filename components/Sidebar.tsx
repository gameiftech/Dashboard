import React from 'react';
import { ViewMode } from '../types';
import { LayoutDashboard, FileText, Table2, Settings, LogOut, Sparkles, Upload, X, Clock, History, FileOutput, Loader2 } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset: () => void;
  onLogout: () => void;
  onImport: () => void;
  onOpenAnalysisModal?: () => void;
  isOpen: boolean;
  onClose: () => void;
  // History Props
  historyCount?: number;
  onOpenHistory?: () => void;
  // Export Props
  onExport?: () => void;
  isExporting?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onReset, 
  onLogout, 
  onImport, 
  onOpenAnalysisModal,
  isOpen,
  onClose,
  historyCount = 0,
  onOpenHistory,
  onExport,
  isExporting = false
}) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewMode.TABLE, label: 'Tabela Tratada', icon: Table2 },
    { id: ViewMode.SUMMARY, label: 'Resumo Executivo', icon: FileText },
  ];

  const handleItemClick = (id: ViewMode) => {
    onViewChange(id);
    onClose();
  };

  return (
    <>
      {/* Overlay Escuro para Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white z-50 
          transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:sticky md:top-0 md:flex md:flex-col
        `}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20 shrink-0">
              E
            </div>
            <div className="flex flex-col">
               <span className="font-bold text-lg text-white leading-none tracking-tight">Enterprise</span>
               <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5">AI Analyst</span>
            </div>
          </div>
          {/* Botão Fechar (Mobile Apenas) */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Principal - Área Scrollável */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
                <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${currentView === item.id 
                    ? 'bg-totvs-600 text-white shadow-lg shadow-totvs-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
                </button>
            ))}

            <button
                onClick={() => { onImport(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-all duration-200"
            >
                <Upload className="w-5 h-5" />
                <span className="font-medium text-sm">Importar Excel</span>
            </button>

            {/* Botão Histórico (Popup) */}
            {onOpenHistory && (
              <button
                  onClick={() => { onOpenHistory(); onClose(); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all duration-200 group"
              >
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-medium text-sm">Histórico</span>
                  </div>
                  {historyCount > 0 && (
                    <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600">
                      {historyCount}
                    </span>
                  )}
              </button>
            )}

            {/* Botão Exportar PDF */}
            {onExport && (
              <button
                onClick={() => { onExport(); onClose(); }}
                disabled={isExporting}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mt-1
                  ${isExporting 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                ) : (
                  <FileOutput className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                )}
                <span className="font-medium text-sm">
                  {isExporting ? 'Gerando PDF...' : 'Exportar Análise'}
                </span>
              </button>
            )}

            {onOpenAnalysisModal && (
                <div className="pt-4 border-t border-slate-800 mt-2">
                <button 
                    onClick={() => { onOpenAnalysisModal(); onClose(); }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-blue-900/50 flex items-center gap-3 group transition-all transform hover:-translate-y-1 border border-blue-500/30"
                >
                    <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                    <p className="font-bold text-xs">Nova Análise IA</p>
                    <p className="text-blue-100 opacity-80 text-[10px]">Pedir algo específico</p>
                    </div>
                </button>
                </div>
            )}
            </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Configurações</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all mt-2 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;