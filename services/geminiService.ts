import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ReportType, StructuredSummary } from "../types";

// Security Check: Validate Environment Variable
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.includes("INSERT_KEY")) {
    throw new Error("Configuração de segurança ausente: API_KEY não detectada no ambiente seguro.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to remove noise from data before sending to AI (Performance Optimization)
const optimizePayload = (data: any[]) => {
  if (data.length === 0) return [];
  
  // 1. Identify empty columns
  const keys = Object.keys(data[0]);
  const nonEmptyKeys = keys.filter(key => {
    // Check if column has at least one non-empty value in the sample
    return data.some(row => row[key] !== undefined && row[key] !== "" && row[key] !== null);
  });

  // 2. Return new objects with only useful columns
  return data.map(row => {
    const newRow: any = {};
    nonEmptyKeys.forEach(key => {
      // Relaxed truncation: Allow up to 120 chars to capture full product names/descriptions
      const val = row[key];
      if (typeof val === 'string' && val.length > 120) {
        newRow[key] = val.substring(0, 120) + "...";
      } else {
        newRow[key] = val;
      }
    });
    return newRow;
  });
};

export const analyzeData = async (rawData: any[], customInstruction?: string): Promise<AnalysisResult> => {
  // UPGRADE: Increased sample size significantly to allow deep pattern recognition
  // Gemini 1.5/2.0 Flash has a massive context window, handling 500-1000 rows is easy and yields better "memory" of the dataset.
  const sampleSize = 500; 
  const rawSample = rawData.slice(0, sampleSize);
  
  // Optimization: Clean data to remove empty columns
  const optimizedSample = optimizePayload(rawSample);
  
  const prompt = `
    Você é um **Consultor Sênior de ERP e Cientista de Dados** (Especialista em SAP, Oracle, TOTVS, Microsoft Dynamics).
    Sua missão é realizar uma **Auditoria Profunda** nos dados fornecidos e gerar inteligência de negócio acionável.

    **CONTEXTO DOS DADOS (Amostra de até 500 registros):**
    ${JSON.stringify(optimizedSample)}

    ${customInstruction ? `
    ⚠️ **SOLICITAÇÃO DE ANÁLISE PERSONALIZADA (ALTA PRIORIDADE)**:
    O usuário solicitou explicitamente: "${customInstruction}"
    
    > REFAÇA TODA A ANÁLISE (KPIs, Gráficos e Resumo) FOCANDO NESTE PEDIDO.
    > Se o usuário pediu para focar em um produto, cliente ou período, ajuste os KPIs e Gráficos para refletir isso.
    > No 'Resumo Executivo', destaque explicitamente a resposta para essa solicitação.
    ` : ''}

    **INSTRUÇÕES DE RACIONÍNIO (MEMÓRIA E ANÁLISE):**
    1. **Identificação do ERP**: Tente inferir a origem (Ex: Tabelas SA1/SB1 indicam ERP Totvs; SKUs longos podem ser SAP; Planilhas simples podem ser Bling/Omie).
    2. **Analise Coluna por Coluna**: Identifique padrões de datas (Sazonalidade), Valores (Outliers) e Categorias (Pareto 80/20).
    3. **Precisão Cirúrgica**: Ao citar um problema ou destaque, VOCÊ DEVE CITAR O VALOR EXATO, A DATA OU O NOME DO CLIENTE/PRODUTO que está nos dados. Não seja genérico.
    4. **Contexto de Negócio**: Se encontrar "Impostos", analise a carga tributária. Se encontrar "Estoque", analise giro. Se for "Vendas", analise ticket médio e churn.
    
    **DIRETRIZES DO RELATÓRIO JSON:**

    1. **Identificação**: Determine o módulo (Financeiro, Vendas, Estoque, RH, etc.).
    2. **KPIs (4 Indicadores)**: 
       - Calcule métricas reais (Soma total, Ticket Médio, Maior Valor, Margem estimada).
       - Compare o início da amostra com o fim para determinar a tendência ('up'/'down').
    3. **Gráficos (GERE EXATAMENTE 14 GRÁFICOS)**: 
       - **Diversidade Visual**: Utilize tipos variados ('bar', 'line', 'pie', 'area', 'donut', 'horizontalBar').
       - **Gráficos 1-8 (Visão Geral)**: Top 5, Evolução temporal, Distribuição Geográfica ou Categórica (Use 'pie' ou 'bar').
       - **Gráficos 9-12 (Avançados)**: 
          * *Obrigatório*: Curva ABC/Pareto (80/20).
          * *Obrigatório*: Sazonalidade (Dia da Semana ou Semana do Mês).
          * *Obrigatório*: Dispersão ou Frequência (Ex: Faixas de valor).
       - **Gráficos 13-14 (Especiais)**:
          * *Gráfico 13 (Donut)*: Uma análise de proporção detalhada (Ex: Share de Mercado, Status de Pedidos, Categorias de Despesa). Use type: 'donut'.
          * *Gráfico 14 (Barras Horizontais)*: Um ranking extenso ou comparativo de performance (Ex: Top 10 Clientes, Performance por Vendedor). Use type: 'horizontalBar'.
       - IMPORTANTE: Use 'dataKey' e 'categoryKey' correspondentes exatamente aos nomes das colunas 'clean' geradas no mapping.
    4. **Resumo Executivo (O MAIS IMPORTANTE)**:
       - **Highlights**: O melhor e o pior desempenho com NOMES REAIS dos dados.
       - **Diagnóstico Situacional**: Escreva um texto EXTENSO, TÉCNICO e DETALHADO (Mínimo de 3 parágrafos robustos e informativos).
         * Parágrafo 1 (Macro & Performance): Analise o volume total transacionado, a saúde geral dos indicadores e a tendência primária (crescimento/retração) observada no período. Seja descritivo sobre os montantes.
         * Parágrafo 2 (Eficiência Operacional & Gargalos): Aprofunde-se nos desvios. Identifique concentrações de risco (Pareto), ineficiências em processos específicos, outliers negativos e sazonalidades que afetam a operação. Cite valores e datas.
         * Parágrafo 3 (Impacto Financeiro & Projeção): Conclua com a visão estratégica. Qual o impacto financeiro real dos problemas encontrados? Qual a projeção de curto prazo se nada for feito? Avalie riscos de liquidez, estoque obsoleto ou perda de margem.
       - **Melhor Decisão**: Uma ordem direta e estratégica para o CEO baseada nos números.
       - **Pontos Positivos**: Gere uma lista de 3 A 5 pontos fortes encontrados nos dados.
       - **Causas Raiz (Pontos de Atenção)**: Gere uma lista de 3 A 5 problemas críticos ou ineficiências encontradas.
       - **Plano de Ação**: Crie um plano com 3 A 5 ações práticas e diretas para resolver os problemas citados.

    Retorne APENAS JSON seguindo este schema estrito.
  `;

  // Helper definition for highlight object schema
  const highlightSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      value: { type: Type.STRING },
      description: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['success', 'danger', 'warning', 'info'] }
    },
    required: ['title', 'value', 'description', 'type']
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      reportType: { type: Type.STRING },
      reportName: { type: Type.STRING },
      kpis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            trend: { type: Type.STRING },
            trendValue: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      charts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['bar', 'line', 'pie', 'area', 'donut', 'horizontalBar'] },
            dataKey: { type: Type.STRING },
            categoryKey: { type: Type.STRING },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      },
      executiveSummary: {
        type: Type.OBJECT,
        properties: {
          highlights: {
            type: Type.OBJECT,
            properties: {
              best: highlightSchema,
              worst: highlightSchema,
              highest: highlightSchema,
              lowest: highlightSchema
            },
            required: ['best', 'worst', 'highest', 'lowest']
          },
          situationalDiagnosis: { type: Type.STRING },
          bestDecision: { type: Type.STRING, description: "A decisão estratégica número 1 a ser tomada." },
          positivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionPlan: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ['ALTO', 'MÉDIO', 'BAIXO'] },
                effort: { type: Type.STRING, enum: ['IMEDIATO', 'CURTO PRAZO', 'MÉDIO PRAZO'] }
              } 
            } 
          }
        },
        required: ['highlights', 'situationalDiagnosis', 'bestDecision', 'positivePoints', 'rootCauses', 'actionPlan']
      },
      columnMapping: { 
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            clean: { type: Type.STRING }
          }
        }
      }
    },
    required: ['reportType', 'reportName', 'kpis', 'charts', 'executiveSummary', 'columnMapping']
  };

  try {
    const ai = getClient();

    // UPGRADE: Using 'thinkingBudget' to force the model to Reason deeply before answering.
    // This simulates "saving to memory" by allowing the model to process the 500 rows 
    // in its hidden chain-of-thought before outputting the JSON.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        maxOutputTokens: 8192, // Increased to allow for detailed JSON
        thinkingConfig: { thinkingBudget: 4096 } // High budget for deep analysis/context retention
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Sem resposta da IA");

    const parsedResult = JSON.parse(resultText);

    const columnMappingRecord: Record<string, string> = {};
    if (Array.isArray(parsedResult.columnMapping)) {
      parsedResult.columnMapping.forEach((item: any) => {
        if (item.original && item.clean) {
          columnMappingRecord[item.original] = item.clean;
        }
      });
    }

    const cleanData = rawData.map((row) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = columnMappingRecord[key] || key;
        newRow[cleanKey] = row[key];
      });
      return newRow;
    });

    return {
      ...parsedResult,
      columnMapping: columnMappingRecord,
      cleanData
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error(error.message || "Falha na análise inteligente dos dados.");
  }
};

// Streaming Version for Lower Latency
export async function* streamAudioBriefing(summary: StructuredSummary) {
  try {
    const ai = getClient();

    // Contextualizing the speech script to be more professional based on the deeper analysis
    const script = `
      Olá. Analisei profundamente os dados do seu relatório ${summary.highlights.best.title ? 'de ' + summary.highlights.best.title.split(' ')[0] : ''}.
      
      A decisão estratégica recomendada é: ${summary.bestDecision}
      
      No diagnóstico detalhado: ${summary.situationalDiagnosis.split('.')[0]}.
      
      O ponto crítico identificado foi: ${summary.highlights.worst.title}, atingindo ${summary.highlights.worst.value}.
      
      Em contrapartida, o destaque positivo é: ${summary.highlights.best.title} com ${summary.highlights.best.value}.
      
      Minha recomendação imediata: ${summary.actionPlan[0]?.text || 'Siga o plano de ação detalhado na tela'}.
    `;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
           if (part.inlineData?.data) {
             yield part.inlineData.data;
           }
        }
      }
    }

  } catch (error: any) {
    console.error("Audio Streaming Failed:", error);
    throw new Error("Não foi possível gerar o áudio do briefing.");
  }
}