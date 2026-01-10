
export enum ReportType {
  SALES = 'Vendas',
  STOCK = 'Estoque',
  FINANCE = 'Financeiro',
  PURCHASE = 'Compras',
  HR = 'RH',
  LOGISTICS = 'Logística',
  FISCAL = 'Fiscal',
  PCP = 'PCP',
  UNKNOWN = 'Geral'
}

export interface KPI {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  description: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'horizontalBar';
  data: ChartDataPoint[];
  dataKey: string;
  categoryKey: string;
}

export interface SummaryHighlight {
  title: string;
  value: string;
  description: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

export interface ActionPlanItem {
  text: string;
  impact: 'ALTO' | 'MÉDIO' | 'BAIXO';
  effort: 'IMEDIATO' | 'CURTO PRAZO' | 'MÉDIO PRAZO';
}

export interface StructuredSummary {
  highlights: {
    best: SummaryHighlight;
    worst: SummaryHighlight;
    highest: SummaryHighlight;
    lowest: SummaryHighlight;
  };
  situationalDiagnosis: string;
  rootCauses: string[];
  positivePoints: string[]; // New: Pontos Positivos
  bestDecision: string;     // New: Melhor Tomada de Decisão
  actionPlan: ActionPlanItem[];
}

export interface AnalysisResult {
  reportType: ReportType;
  reportName: string;
  kpis: KPI[];
  charts: ChartConfig[];
  executiveSummary: StructuredSummary; 
  columnMapping: Record<string, string>;
  cleanData: Record<string, any>[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  fileName: string;
  reportName: string;
  reportType: ReportType;
  result: AnalysisResult; // Armazena o resultado completo para recarregar
}

export enum AppState {
  LANDING = 'LANDING',
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  TABLE = 'TABLE',
  SUMMARY = 'SUMMARY'
}