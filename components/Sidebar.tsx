import React from 'react';
import { ViewMode } from '../types';
import { LayoutDashboard, FileText, Table2, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onReset }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewMode.TABLE, label: 'Tabela Tratada', icon: Table2 },
    { id: ViewMode.SUMMARY, label: 'Resumo Executivo', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-totvs-500 rounded-lg flex items-center justify-center font-bold text-white">
            P
          </div>
          <span className="font-bold text-lg tracking-tight">Seu Negócio <span className="text-totvs-500">AI</span></span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
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
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Configurações</span>
        </button>
        <button 
          onClick={onReset}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sair / Novo</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;