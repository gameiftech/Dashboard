import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { ChevronLeft, ChevronRight, Search, Filter, EyeOff } from 'lucide-react';

interface DataTableViewProps {
  data: AnalysisResult;
  isPrivacyMode: boolean;
}

const DataTableView: React.FC<DataTableViewProps> = ({ data, isPrivacyMode }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  const rowsPerPage = 20;
  const headers = data.cleanData.length > 0 ? Object.keys(data.cleanData[0]) : [];

  const handleFilterChange = (header: string, value: string) => {
    setFilters(prev => ({ ...prev, [header]: value }));
    setCurrentPage(1);
  };

  const filteredData = data.cleanData.filter(row => {
    return headers.every(header => {
      const filterVal = filters[header]?.toLowerCase() || '';
      if (!filterVal) return true;
      const cellVal = String(row[header] || '').toLowerCase();
      return cellVal.includes(filterVal);
    });
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Security Helper: Mask sensitive data
  const renderCell = (header: string, value: any) => {
    if (!isPrivacyMode) return value;

    const lowerHeader = header.toLowerCase();
    const sensitiveKeywords = ['cpf', 'cnpj', 'salario', 'salário', 'valor', 'preço', 'total', 'custo', 'margem', 'telefone', 'email'];
    
    // Check if column is potentially sensitive
    const isSensitive = sensitiveKeywords.some(keyword => lowerHeader.includes(keyword));

    if (isSensitive) {
      return <span className="text-slate-300 select-none">••••••••</span>;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Table Status Bar */}
      <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-700">Dados Detalhados</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {filteredData.length} registros
            </span>
            {isPrivacyMode && (
              <span className="ml-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                <EyeOff className="w-3 h-3" />
                Mascaramento Ativo
              </span>
            )}
        </div>
        <div className="text-xs text-slate-400 italic">
            Use a segunda linha do cabeçalho para filtrar colunas específicas
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 z-20 shadow-sm">
            {/* 1st Line: Titles */}
            <tr className="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider">
              {headers.map(header => (
                <th key={header} className="px-4 py-3 border-b border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
            {/* 2nd Line: Filters */}
            <tr className="bg-slate-50">
              {headers.map(header => (
                <th key={`filter-${header}`} className="p-1 border-b border-r border-slate-200 last:border-r-0">
                  <div className="relative">
                    <input 
                        type="text" 
                        placeholder={`Filtrar...`}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-normal text-slate-700 bg-white"
                        value={filters[header] || ''}
                        onChange={(e) => handleFilterChange(header, e.target.value)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                {headers.map(header => (
                  <td key={`${i}-${header}`} className="px-4 py-2 whitespace-nowrap text-slate-600 text-xs border-r border-slate-100 last:border-r-0 group-hover:border-blue-100">
                    {renderCell(header, row[header])}
                  </td>
                ))}
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p>Nenhum dado encontrado com os filtros atuais.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-2 border-t border-slate-200 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500 font-medium">
          Página {currentPage} de {totalPages || 1}
        </span>
        <div className="flex gap-1">
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 1}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-transparent hover:border-slate-200 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-transparent hover:border-slate-200 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTableView;