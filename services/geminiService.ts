import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ReportType } from "../types";

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
      // Truncate very long strings to save tokens
      const val = row[key];
      if (typeof val === 'string' && val.length > 50) {
        newRow[key] = val.substring(0, 50) + "...";
      } else {
        newRow[key] = val;
      }
    });
    return newRow;
  });
};

export const analyzeData = async (rawData: any[]): Promise<AnalysisResult> => {
  // Performance: Reduced sample size from 150 to 50. 
  const sampleSize = 50; 
  const rawSample = rawData.slice(0, sampleSize);
  
  // Optimization: Clean data to remove empty columns and truncate massive texts
  const optimizedSample = optimizePayload(rawSample);
  
  const prompt = `
    Atue como um **CFO, Auditor e Cientista de Dados Sênior** especialista em Protheus (TOTVS).
    
    Dados (Amostra 50 linhas):
    ${JSON.stringify(optimizedSample)}

    DIRETRIZES ESTRATÉGICAS:
    1. **Identificação**: Módulo exato do Protheus.
    2. **KPIs**: 4 indicadores cruciais.
    3. **Gráficos (Expandido)**: Gere entre **8 a 10 gráficos distintos**. 
       - Varie os tipos: Barra, Linha, Pizza, Área.
       - Explore correlações (Ex: Vendas x Custo, Curva ABC, Sazonalidade, Top 10 Clientes, Top 10 Produtos, Performance por Filial, etc).
    4. **Resumo Executivo**:
       - **Highlights**: Campeão, Gargalo, Maior Ticket, Oportunidade.
       - **Diagnóstico**: Análise situacional profunda (3 parágrafos).
       - **Pontos Positivos**: O que a empresa está fazendo certo? (Lista).
       - **Causas Raiz**: Problemas identificados.
       - **Melhor Decisão**: UMA única frase de impacto estratégico recomendando a decisão mais importante a ser tomada agora.
       - **Plano de Ação**: Impacto/Esforço.

    Retorne JSON estrito.
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
            type: { type: Type.STRING, enum: ['bar', 'line', 'pie', 'area'] },
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        thinkingConfig: { thinkingBudget: 0 } 
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