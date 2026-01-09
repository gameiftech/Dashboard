import { AnalysisResult, ReportType } from "../types";

export const STATIC_DEMO_DATA: AnalysisResult = {
  reportType: ReportType.SALES,
  reportName: "Relatório Estratégico de Performance Comercial - Ciclo 2025/2026",
  kpis: [
    {
      label: "Receita Total Bruta",
      value: "R$ 2.846.512,18",
      trend: "up",
      trendValue: "12.4%",
      description: "Somatório total de pedidos com status faturado no período analisado."
    },
    {
      label: "Ticket Médio por Venda",
      value: "R$ 24.329,16",
      trend: "up",
      trendValue: "5.1%",
      description: "Média de valor por transação concluída."
    },
    {
      label: "Churn de Pedidos (Cancelados)",
      value: "5.6%",
      trend: "down",
      trendValue: "2.3%",
      description: "Taxa de cancelamento sobre o volume total transacionado."
    },
    {
      label: "Líder do Mix de Produtos",
      value: "Licença ERP Enterprise",
      trend: "neutral",
      trendValue: "Estável",
      description: "Produto com maior participação na receita acumulada."
    }
  ],
  charts: [
    {
      title: "Top 5 Produtos por Receita",
      type: "bar",
      dataKey: "Valor Total",
      categoryKey: "Produto / Serviço",
      data: [
        { name: "Licença ERP Enterprise", value: 850000 },
        { name: "Consultoria SAP", value: 620000 },
        { name: "Servidor Dell PowerEdge", value: 450000 },
        { name: "Implantação Cloud AWS", value: 380000 },
        { name: "Notebook Latitude", value: 210000 }
      ]
    },
    {
      title: "Distribuição Regional de Vendas",
      type: "pie",
      dataKey: "Valor Total",
      categoryKey: "Região",
      data: [
        { name: "Centro-Oeste", value: 845000 },
        { name: "Sudeste", value: 695000 },
        { name: "Sul", value: 720000 },
        { name: "Nordeste", value: 586512 }
      ]
    },
    {
      title: "Evolução Temporal de Vendas",
      type: "area",
      dataKey: "Valor Total",
      categoryKey: "Data Emissão",
      data: [
        { name: "Jan", value: 180000 },
        { name: "Fev", value: 220000 },
        { name: "Mar", value: 190000 },
        { name: "Abr", value: 280000 },
        { name: "Mai", value: 310000 },
        { name: "Jun", value: 250000 }
      ]
    },
    {
      title: "Performance por Vendedor",
      type: "bar",
      dataKey: "Valor Total",
      categoryKey: "Vendedor",
      data: [
        { name: "Roberto Silva", value: 920000 },
        { name: "Ana Paula", value: 880000 },
        { name: "Carlos Eduardo", value: 650000 },
        { name: "Fernanda Lima", value: 396512 }
      ]
    },
    {
      title: "Status dos Pedidos",
      type: "pie",
      dataKey: "count",
      categoryKey: "Status",
      data: [
        { name: "Faturado", value: 94 },
        { name: "Cancelado", value: 6 }
      ]
    },
    {
      title: "Pareto de Clientes (Curva ABC)",
      type: "bar",
      dataKey: "Valor Total",
      categoryKey: "Cliente",
      data: [
        { name: "Grupo Tech", value: 450000 },
        { name: "Indústrias Metal", value: 320000 },
        { name: "Varejo Express", value: 280000 },
        { name: "Consultoria Alpha", value: 150000 }
      ]
    },
    {
      title: "Sazonalidade Semanal",
      type: "line",
      dataKey: "Valor Total",
      categoryKey: "DiaSemana",
      data: [
        { name: "Seg", value: 120000 },
        { name: "Ter", value: 180000 },
        { name: "Qua", value: 250000 },
        { name: "Qui", value: 210000 },
        { name: "Sex", value: 190000 }
      ]
    },
    {
      title: "Ticket Médio por Região",
      type: "bar",
      dataKey: "Ticket",
      categoryKey: "Região",
      data: [
        { name: "Sul", value: 28000 },
        { name: "Sudeste", value: 26500 },
        { name: "Centro-Oeste", value: 22000 },
        { name: "Nordeste", value: 19500 }
      ]
    },
    {
      title: "Dispersão de Valores",
      type: "area",
      dataKey: "Pedidos",
      categoryKey: "Faixa",
      data: [
        { name: "Até 10k", value: 45 },
        { name: "10k-50k", value: 80 },
        { name: "50k-100k", value: 20 },
        { name: "+100k", value: 5 }
      ]
    }
  ],
  executiveSummary: {
    highlights: {
      best: {
        title: "Destaque de Vendas",
        value: "Roberto Silva",
        description: "Superou a meta em 15% com foco em grandes contas.",
        type: "success"
      },
      worst: {
        title: "Ponto Crítico",
        value: "Churn Nordeste",
        description: "Aumento de 2% na taxa de cancelamento na região.",
        type: "danger"
      },
      highest: {
        title: "Maior Venda",
        value: "R$ 158.000",
        description: "Pedido único de Licenciamento Enterprise para Grupo Tech.",
        type: "info"
      },
      lowest: {
        title: "Estoque em Risco",
        value: "Servidor Legacy",
        description: "Giro de estoque abaixo de 2.0 nos últimos 90 dias.",
        type: "warning"
      }
    },
    situationalDiagnosis: "A performance comercial do ciclo 2025/2026 demonstra uma robusta tendência de crescimento (CAGR estimado de 12%), impulsionada principalmente pela alta adesão às novas Licenças ERP Enterprise e Serviços de Consultoria SAP. O faturamento total de R$ 2.8M valida a estratégia de up-selling em clientes da base.\n\nEntretanto, observa-se uma disparidade regional significativa. Enquanto Sul e Centro-Oeste performam acima da média histórica, o Nordeste enfrenta desafios de retenção, com taxa de churn atingindo picos de 7% em meses específicos. A análise de Pareto indica que 4 vendedores concentram 80% do resultado, sugerindo risco operacional em caso de turnover.\n\nFinanceiramente, o Ticket Médio saudável de R$ 24k protege a margem bruta, mas a dependência de poucos produtos 'Carro-Chefe' (Licença ERP) exige diversificação imediata do portfólio ofertado para mitigar riscos de mercado.",
    bestDecision: "Intensificar o treinamento da força de vendas 'B' e 'C' para equilibrar a dependência dos Top Performers e lançar campanha de retenção focalizada no Nordeste.",
    positivePoints: [
      "Crescimento de 12.4% na Receita Total vs. Período Anterior.",
      "Ticket Médio elevado (R$ 24k) indicando vendas de alto valor agregado.",
      "Baixa taxa de devolução de produtos físicos (hardware).",
      "Alta penetração no setor de Serviços e Consultoria."
    ],
    rootCauses: [
      "Dependência excessiva de 2 produtos principais (Pareto de Mix).",
      "Churn elevado na região Nordeste sem causa logística aparente.",
      "Concentração de resultados em apenas 30% da equipe comercial.",
      "Sazonalidade negativa acentuada nas primeiras semanas do mês."
    ],
    actionPlan: [
      {
        text: "Implementar programa de Mentoria onde Top Performers treinam Juniores.",
        impact: "ALTO",
        effort: "MÉDIO PRAZO"
      },
      {
        text: "Revisar política de preços e frete para a região Nordeste.",
        impact: "ALTO",
        effort: "IMEDIATO"
      },
      {
        text: "Criar bundles de produtos (Hardware + Software) para elevar ticket dos itens de cauda.",
        impact: "MÉDIO",
        effort: "CURTO PRAZO"
      },
      {
        text: "Automatizar follow-up de orçamentos abertos via CRM.",
        impact: "MÉDIO",
        effort: "CURTO PRAZO"
      }
    ]
  },
  columnMapping: {
    "Data Emissão": "Data Emissão",
    "Produto / Serviço": "Produto / Serviço",
    "Vendedor": "Vendedor",
    "Região": "Região",
    "Valor Total": "Valor Total",
    "Status": "Status",
    "Quantidade": "Quantidade"
  },
  cleanData: Array.from({ length: 50 }, (_, i) => ({
    "Data Emissão": new Date(2025, i % 6, (i % 28) + 1).toISOString().split('T')[0],
    "Produto / Serviço": i % 3 === 0 ? "Licença ERP Enterprise" : (i % 2 === 0 ? "Consultoria SAP" : "Servidor Dell PowerEdge"),
    "Vendedor": i % 4 === 0 ? "Roberto Silva" : (i % 3 === 0 ? "Ana Paula" : "Carlos Eduardo"),
    "Região": i % 4 === 0 ? "Sul" : (i % 3 === 0 ? "Sudeste" : "Centro-Oeste"),
    "Quantidade": Math.floor(Math.random() * 10) + 1,
    "Valor Total": (Math.random() * 50000 + 5000).toFixed(2),
    "Status": i % 10 === 0 ? "Cancelado" : "Faturado"
  }))
};
