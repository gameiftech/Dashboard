import React from 'react';
import { RefreshCw, Eye, EyeOff, ShieldCheck, Menu, User } from 'lucide-react';
import { AnalysisResult } from '../types';

interface HeaderProps {
  data: AnalysisResult;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenSidebar: () => void; 
  currentUser?: any;
}

const Header: React.FC<HeaderProps> = ({ 
  data, 
  onRefresh, 
  isRefreshing = false, 
  isPrivacyMode, 
  onTogglePrivacy,
  onOpenSidebar,
  currentUser
}) => {
  
  // Extração segura do nome do usuário
  const userInitial = currentUser?.email ? currentUser.email[0].toUpperCase() : 'U';
  const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Usuário';
  const userEmail = currentUser?.email || 'N/A';

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

        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-totvs-600 hover:bg-totvs-50 rounded-lg transition-colors group"
          title="Atualizar Visualização"
        >
          <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180'}`} />
        </button>

        {/* Divisor Vertical */}
        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

        {/* Perfil do Usuário */}
        <div className="flex items-center gap-3 pl-1">
           <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-700 leading-none mb-1">{userName}</p>
              <p className="text-xs text-slate-400 leading-none">{userEmail}</p>
           </div>
           <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm relative group cursor-default">
              {userInitial}
              {/* Tooltip Mobile */}
              <div className="absolute top-full right-0 mt-2 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap md:hidden z-50">
                 {userEmail}
              </div>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;