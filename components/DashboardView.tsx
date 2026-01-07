import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart 
} from 'recharts';
import { AnalysisResult, KPI } from '../types';
import { ArrowUpRight, ArrowDownRight, Minus, Filter, Calendar, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface DashboardViewProps {
  data: AnalysisResult;
  isPrivacyMode: boolean;
  hideControls?: boolean; // New prop for PDF generation
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

// --- Helper Functions ---

const formatValue = (val: number, isPrivacy: boolean) => {
  if (isPrivacy) return "••••";
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, notation: "compact", compactDisplay: "short" }).format(val);
};

// Robust Number Parsing (PT-BR support)
const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  const str = String(val).trim();
  
  // Handle PT-BR currency (e.g. 1.234,56)
  if (str.includes(',') && !str.toLowerCase().includes('e')) { 
     const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
     const parsed = parseFloat(clean);
     return isNaN(parsed) ? 0 : parsed;
  }
  
  const clean = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// Robust Date Parsing
const parseDate = (value: any): Date | null => {
  if (!value) return null;
  
  // Excel Serial
  if (typeof value === 'number') {
    if (value < 10000) return null; 
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    const userOffset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() + userOffset); 
  }

  // String Parsing
  if (typeof value === 'string') {
    const v = value.trim();
    // PT-BR format DD/MM/YYYY
    if (v.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
      const parts = v.split('/');
      if (parts.length === 3) {
         // Create date treating as local time (Year, MonthIndex, Day)
         const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
         if (!isNaN(d.getTime())) return d;
      }
    }
    // Try ISO or other formats
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  
  return null;
};

const formatDateToLocalISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Components ---

const KPICard: React.FC<{ kpi: KPI, isPrivacy: boolean, index: number }> = ({ kpi, isPrivacy, index }) => {
  const getTrendIcon = () => {
    if (kpi.trend === 'up') return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
    if (kpi.trend === 'down') return <ArrowDownRight className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (kpi.trend === 'up') return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (kpi.trend === 'down') return 'text-red-700 bg-red-50 border-red-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  return (
    <div 
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getTrendColor()}`}>
          {getTrendIcon()}
          {kpi.trendValue}
        </span>
      </div>
      <h3 
        className={`text-3xl font-extrabold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-all ${isPrivacy ? 'blur-md select-none opacity-50' : ''}`}
        title={isPrivacy ? "Oculto pelo modo de privacidade" : kpi.value}
      >
        {kpi.value}
      </h3>
      <p className="text-xs text-slate-400 font-medium">{kpi.description}</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, isPrivacy }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl backdrop-blur-sm border border-slate-700 z-50">
        <p className="text-sm font-medium text-slate-300 mb-2 border-b border-slate-700 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color || entry.fill}}></div>
             <span className="text-xs text-slate-300">{entry.name}:</span>
             <span className={`text-sm font-bold ${isPrivacy ? 'blur-sm' : ''}`}>
               {isPrivacy ? '••••' : new Intl.NumberFormat('pt-BR').format(entry.value)}
             </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardView: React.FC<DashboardViewProps> = ({ data, isPrivacyMode, hideControls = false }) => {
  // Filters State
  const [dateRangeLabel, setDateRangeLabel] = useState('Todo o Período');
  const [showDateMenu, setShowDateMenu] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Intelligent Column Detection
  const columns = useMemo(() => {
    if (!data.cleanData || data.cleanData.length === 0) return { dateCol: '' };
    const keys = Object.keys(data.cleanData[0]);
    
    const dateCol = keys.find(k => /data|date|dt_|emissao|emissão|periodo/i.test(k)) || '';
    
    return { dateCol };
  }, [data]);


  // Date Presets Logic
  const handlePresetDate = (preset: string, label: string) => {
    setDateRangeLabel(label);
    setShowDateMenu(false);
    
    const end = new Date();
    let start = new Date();

    if (preset === 'all') {
        setStartDate('');
        setEndDate('');
        return;
    }

    if (preset === '30d') start.setDate(end.getDate() - 30);
    else if (preset === 'current_month') start = new Date(end.getFullYear(), end.getMonth(), 1);
    else if (preset === 'last_month') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); 
    } else if (preset === 'ytd') {
      start = new Date(end.getFullYear(), 0, 1);
    } 

    setStartDate(formatDateToLocalISO(start));
    setEndDate(formatDateToLocalISO(end));
  };

  // --- Filter Status ---
  const isFiltered = !!(columns.dateCol && (startDate || endDate));

  // 2. Centralized Data Filtering (Source of Truth)
  const filteredRows = useMemo(() => {
    // If no filters active, return everything (optimization)
    if (!isFiltered) return data.cleanData;

    return data.cleanData.filter(row => {
      let pass = true;

      // Date Filter
      if (columns.dateCol && (startDate || endDate)) {
        const rowDate = parseDate(row[columns.dateCol]);
        if (rowDate) {
          rowDate.setHours(0,0,0,0);
          
          if (startDate) {
            const [sy, sm, sd] = startDate.split('-').map(Number);
            const start = new Date(sy, sm - 1, sd); // Local 00:00
            if (rowDate < start) pass = false;
          }
          if (endDate) {
            const [ey, em, ed] = endDate.split('-').map(Number);
            const end = new Date(ey, em - 1, ed); // Local 00:00
            end.setHours(23, 59, 59, 999);
            if (rowDate > end) pass = false;
          }
        }
      }

      return pass;
    });
  }, [data.cleanData, startDate, endDate, columns, isFiltered]);


  // 4. Existing Dynamic Charts (Hybrid Logic)
  const dynamicCharts = useMemo(() => {
    if (!isFiltered) {
      return data.charts;
    }

    return data.charts.map(chart => {
      if (!chart.categoryKey || !chart.dataKey) return chart;

      const groupingMap = new Map<string, number>();

      filteredRows.forEach(row => {
        const catRaw = row[chart.categoryKey];
        const category = catRaw ? String(catRaw) : 'N/A';
        const val = parseNumber(row[chart.dataKey]);
        if (!isNaN(val)) {
          groupingMap.set(category, (groupingMap.get(category) || 0) + val);
        }
      });

      let newData = Array.from(groupingMap.entries()).map(([name, value]) => ({ name, value }));

      if (chart.type === 'bar' || chart.type === 'pie') {
        newData.sort((a, b) => b.value - a.value);
        if (chart.type === 'pie') newData = newData.slice(0, 8); 
        else newData = newData.slice(0, 15); // Limit bars
      }

      return { ...chart, data: newData };
    });
  }, [data.charts, filteredRows, isFiltered]);


  const dateOptions = [
    { label: 'Todo o Período', value: 'all' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Este Mês', value: 'current_month' },
    { label: 'Mês Anterior', value: 'last_month' },
    { label: 'Este Ano (YTD)', value: 'ytd' },
  ];

  return (
    <div className="space-y-8 p-2">
      
      {/* --- Filter Bar --- */}
      {/* Render only if controls are not hidden (for PDF export) */}
      {!hideControls && (
      <div className="relative z-30 flex flex-col xl:flex-row items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up gap-4 xl:gap-0">
         <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            {columns.dateCol ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowDateMenu(!showDateMenu)}
                    className="flex items-center gap-2 text-slate-700 bg-white px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 w-48 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{dateRangeLabel}</span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDateMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showDateMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-fade-in-up">
                        <div className="py-1">
                          {dateOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handlePresetDate(opt.value, opt.label)}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                                ${dateRangeLabel === opt.label ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}
                              `}
                            >
                              {opt.label}
                              {dateRangeLabel === opt.label && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">De</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDateRangeLabel('Personalizado');
                      }}
                      className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 p-0 outline-none w-28 font-medium"
                    />
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Até</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDateRangeLabel('Personalizado');
                      }}
                      className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 p-0 outline-none w-28 font-medium"
                    />
                  </div>
                </div>
              </>
            ) : (
               <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs italic">
                 <AlertCircle className="w-3 h-3" />
                 Filtro de data indisponível
               </div>
            )}
         </div>
         
         <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFiltered ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            Visão Geral / {data.reportType}
         </div>
      </div>
      )}

      {/* --- KPI Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {data.kpis.map((kpi, idx) => (
          <KPICard key={idx} kpi={kpi} isPrivacy={isPrivacyMode} index={idx} />
        ))}
      </div>

      {/* --- Dynamic AI Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-0">
        {dynamicCharts.map((chart, idx) => {
          const totalValue = chart.type === 'pie' ? chart.data.reduce((acc, curr) => acc + curr.value, 0) : 0;
          const hasData = chart.data.length > 0 && chart.data.some(d => d.value > 0);

          return (
            <div 
              key={idx} 
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col transition-colors animate-fade-in-up"
              style={{ animationDelay: `${(idx + 4) * 100}ms` }}
            >
              <div className="mb-6">
                 <h4 className="text-lg font-bold text-slate-900">{chart.title}</h4>
                 {!hideControls && (
                 <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 mt-1">
                      {isFiltered ? 'Dados filtrados dinamicamente' : 'Visão consolidada'}
                    </p>
                    {isFiltered && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-medium">Filtrado</span>
                    )}
                 </div>
                 )}
              </div>
              
              <div className={`h-80 w-full flex-grow transition-all duration-500 ${isPrivacyMode ? 'filter blur-[3px] opacity-80' : ''}`}>
                {!hasData ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Filter className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Sem dados para este filtro</p>
                    {isFiltered && <p className="text-xs mt-1 opacity-50">Tente ajustar as datas</p>}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'bar' ? (
                    <ComposedChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`gradBar-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(v) => formatValue(v, false)} />
                      <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip isPrivacy={false} />} />
                      <Bar dataKey="value" name={data.reportType === 'Vendas' ? 'Valor' : 'Qtd'} fill={`url(#gradBar-${idx})`} radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" opacity={0.5} />
                    </ComposedChart>
                  ) : chart.type === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip isPrivacy={false} />} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        formatter={(value, entry: any) => {
                          const percent = totalValue > 0 ? ((entry.payload.value / totalValue) * 100).toFixed(1) : 0;
                          return (
                            <span className="text-slate-600 text-xs font-medium ml-2">
                              {value} 
                              <span className="text-slate-400 ml-1">
                                ({formatValue(entry.payload.value, false)} • {percent}%)
                              </span>
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  ) : (
                    <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`colorValue-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(v) => formatValue(v, false)} />
                      <Tooltip content={<CustomTooltip isPrivacy={false} />} />
                      <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fill={`url(#colorValue-${idx})`} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardView;