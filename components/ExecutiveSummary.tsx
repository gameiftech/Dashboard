import React, { useState, useRef, useEffect } from 'react';
import { StructuredSummary, SummaryHighlight, ActionPlanItem } from '../types';
import { streamAudioBriefing } from '../services/geminiService';
import { 
  Trophy, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Target, 
  BrainCircuit,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Rocket,
  ThumbsUp,
  PlayCircle,
  StopCircle,
  Loader2,
  Volume2,
  Download
} from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: StructuredSummary;
  // Prop 'onRequestCustomAnalysis' removida daqui pois agora é global no App
}

// --- Audio Helper Functions (Streaming Support) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Components ---

const HighlightCard: React.FC<{ data: SummaryHighlight, icon: React.ReactNode, index: number }> = ({ data, icon, index }) => {
  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return { border: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' };
      case 'danger': return { border: 'border-l-rose-500', iconBg: 'bg-rose-100', iconColor: 'text-rose-700' };
      case 'warning': return { border: 'border-l-amber-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' };
      default: return { border: 'border-l-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-700' };
    }
  };

  const styles = getStyles(data.type);

  return (
    <div 
      className={`bg-white p-5 rounded-r-xl rounded-l-md border-l-4 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up ${styles.border}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mt-1">{data.title}</h4>
        <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.iconColor}`}>
          {icon}
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-2xl font-black text-slate-800 leading-none tracking-tight break-words">{data.value}</p>
      </div>
      
      <p className="text-sm font-medium text-slate-600 leading-snug border-t border-slate-100 pt-3 mt-1">
        {data.description}
      </p>
    </div>
  );
};

const ActionPlanRow: React.FC<{ action: ActionPlanItem, index: number }> = ({ action, index }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'ALTO': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MÉDIO': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="flex-shrink-0 mt-1 hidden sm:block">
        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white group-hover:bg-emerald-500 transition-colors">
          {index + 1}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 sm:hidden">
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
            {index + 1}
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase">Ação Recomendada</span>
        </div>
        <p className="text-slate-200 font-medium text-sm leading-relaxed mb-2">{action.text}</p>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getImpactColor(action.impact)} uppercase`}>
            Impacto {action.impact}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-600 bg-slate-700 text-slate-300 uppercase">
            {action.effort}
          </span>
        </div>
      </div>
    </div>
  );
};

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  // Refs for audio control
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);

  const stopAudio = () => {
    isCancelledRef.current = true;
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsPlaying(false);
    setIsAudioLoading(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsAudioLoading(true);
      isCancelledRef.current = false;
      
      // Initialize Audio Context immediately on click
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      nextStartTimeRef.current = ctx.currentTime + 0.1; // Small buffer for first chunk
      
      // Start Streaming
      const stream = streamAudioBriefing(summary);
      let chunkCount = 0;

      for await (const base64Chunk of stream) {
        if (isCancelledRef.current) break;

        // Decode Chunk
        const audioBuffer = await decodeAudioData(
          decode(base64Chunk),
          ctx,
          24000, 
          1      
        );

        // Schedule Playback
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        // Ensure gapless playback by scheduling next chunk at end of previous
        // If system lagged, start immediately (max logic)
        const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
        source.start(startAt);
        
        nextStartTimeRef.current = startAt + audioBuffer.duration;
        sourcesRef.current.push(source);

        // Clean up finished sources (optional optimization)
        source.onended = () => {
             const idx = sourcesRef.current.indexOf(source);
             if (idx > -1) sourcesRef.current.splice(idx, 1);
        };

        if (chunkCount === 0) {
          setIsPlaying(true);
          setIsAudioLoading(false); // First sound playing!
        }
        chunkCount++;
      }

      // Handle natural end of stream
      if (!isCancelledRef.current) {
         // Create a dummy source that ends at the very end to trigger state cleanup
         // Or simpler: set a timeout for the remaining duration
         const remainingTime = (nextStartTimeRef.current - ctx.currentTime) * 1000;
         setTimeout(() => {
           if(!isCancelledRef.current) setIsPlaying(false);
         }, remainingTime + 200);
      }

    } catch (error) {
      console.error(error);
      alert("Não foi possível reproduzir o áudio.");
      setIsPlaying(false);
      setIsAudioLoading(false);
    }
  };
  
  const handleExportActionPlan = () => {
    if (!summary.actionPlan || summary.actionPlan.length === 0) return;

    // Cabeçalho do CSV
    const headers = ["Ação Recomendada", "Impacto", "Esforço Estimado"];
    
    // Linhas de dados
    const rows = summary.actionPlan.map(item => [
      `"${item.text.replace(/"/g, '""')}"`, // Escape de aspas duplas para CSV
      item.impact,
      item.effort
    ]);

    // Monta o conteúdo CSV
    const csvContent = [
      headers.join(';'), // Usando ponto e vírgula para melhor compatibilidade com Excel PT-BR
      ...rows.map(r => r.join(';'))
    ].join('\n');

    // Cria o Blob com BOM para UTF-8 (importante para Excel abrir acentos corretamente)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Cria link temporário e clica
    const link = document.createElement('a');
    link.href = url;
    const safeDate = new Date().toISOString().slice(0,10);
    link.setAttribute('download', `Plano_de_Acao_${safeDate}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Limpeza
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Análise Executiva</h2>
            <p className="text-slate-500 text-sm md:text-lg">Diagnóstico crítico por inteligência artificial</p>
          </div>
        </div>

        {/* AI Audio Assistant Button */}
        <button
          onClick={handlePlayAudio}
          disabled={isAudioLoading}
          className={`
            w-full md:w-auto flex items-center justify-center gap-3 px-5 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95
            ${isPlaying 
              ? 'bg-rose-100 text-rose-600 border border-rose-200 hover:bg-rose-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
            }
          `}
        >
          {isAudioLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <StopCircle className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs font-normal opacity-80 uppercase tracking-wide">
              {isPlaying ? 'Parar Áudio' : 'Ouvir Assistente'}
            </span>
            <span className="text-sm font-bold">
              {isPlaying ? 'Reproduzindo...' : 'Análise de Voz'}
            </span>
          </div>

          {isPlaying && (
            <div className="flex gap-0.5 items-end h-4 ml-1">
              <span className="w-1 bg-rose-500 h-2 animate-[pulse_0.5s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-rose-500 h-4 animate-[pulse_0.7s_ease-in-out_infinite]"></span>
              <span className="w-1 bg-rose-500 h-3 animate-[pulse_0.6s_ease-in-out_infinite]"></span>
            </div>
          )}
        </button>
      </div>

      {/* Best Decision Banner */}
      {summary.bestDecision && (
        <div 
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
             <Rocket className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Rocket className="w-6 h-6 text-white" />
              </span>
              <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-100">Melhor Tomada de Decisão</h3>
            </div>
            <p className="text-xl md:text-2xl md:text-3xl font-bold leading-tight max-w-4xl">
              "{summary.bestDecision}"
            </p>
          </div>
        </div>
      )}

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <HighlightCard 
          index={1}
          data={{...summary.highlights.best, type: 'success'}} 
          icon={<Trophy className="w-5 h-5" />} 
        />
        <HighlightCard 
          index={2}
          data={{...summary.highlights.worst, type: 'danger'}} 
          icon={<AlertOctagon className="w-5 h-5" />} 
        />
        <HighlightCard 
          index={3}
          data={{...summary.highlights.highest, type: 'info'}} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <HighlightCard 
          index={4}
          data={{...summary.highlights.lowest, type: 'warning'}} 
          icon={<TrendingDown className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Diagnosis Column (Wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Situational Diagnosis */}
          <div 
            className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Lightbulb className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Parecer da Auditoria</h3>
                 <p className="text-xs text-slate-400">Análise de consistência e eficiência</p>
              </div>
            </div>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-justify text-sm md:text-base">
              {summary.situationalDiagnosis.split('\n').map((paragraph, i) => (
                 <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Positive Points */}
            <div 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in-up"
              style={{ animationDelay: '600ms' }}
            >
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Pontos Positivos</h3>
              </div>
              <div className="space-y-3">
                {summary.positivePoints?.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{point}</span>
                  </div>
                ))}
                {(!summary.positivePoints || summary.positivePoints.length === 0) && (
                  <p className="text-slate-400 text-sm italic">Nenhum ponto positivo destacado.</p>
                )}
              </div>
            </div>

            {/* Root Causes */}
            <div 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in-up"
              style={{ animationDelay: '700ms' }}
            >
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Target className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Pontos de Atenção</h3>
              </div>
              <div className="space-y-3">
                {summary.rootCauses.map((cause, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{cause}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan Column (Narrow) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div 
            className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex-grow animate-fade-in-up flex flex-col"
            style={{ animationDelay: '800ms' }}
          >
             <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                  <h3 className="text-xl font-bold">Plano de Ação</h3>
                  <p className="text-xs text-slate-400">Passos recomendados</p>
               </div>
             </div>
             
             <div className="space-y-4 flex-grow">
                {summary.actionPlan.map((action, idx) => (
                  <ActionPlanRow key={idx} action={action} index={idx} />
                ))}
             </div>

             <div className="mt-8 pt-6 border-t border-slate-800">
               <button 
                onClick={handleExportActionPlan}
                className="w-full flex items-center justify-between gap-2 text-slate-400 text-xs hover:text-white transition-colors cursor-pointer group bg-transparent border-none p-0"
               >
                  <span>Exportar Plano de Ação</span>
                  <div className="p-1.5 rounded bg-slate-800 group-hover:bg-emerald-600 transition-colors">
                    <Download className="w-3 h-3 text-slate-400 group-hover:text-white" />
                  </div>
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;