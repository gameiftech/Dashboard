import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sparkles, ArrowRight, BarChart3, ShieldCheck, Zap, BrainCircuit, FileSpreadsheet, X, Mail, Lock, User, Building2, Loader2, LogIn, AlertCircle, Check } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

type AuthMode = 'none' | 'login' | 'register';

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('none');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  
  // Feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    // Sanitize input to remove accidental whitespace
    const cleanEmail = email.trim();

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        // Success: App.tsx listener will handle redirection
      } else {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              company: company,
            },
          },
        });
        if (error) throw error;
        setAuthSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta ou faça login.");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let msg = error.message || "Falha na autenticação.";
      
      // Normalize to lowercase to catch "Invalid" vs "invalid"
      const msgLower = msg.toLowerCase();

      // Better error message translations
      if (msg === "Failed to fetch") {
        msg = "Erro de Conexão: Verifique sua internet ou as credenciais no arquivo services/supabaseClient.ts";
      } else if (msgLower.includes("invalid login credentials")) {
         msg = "E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente.";
      } else if (msgLower.includes("user already registered")) {
         msg = "Este e-mail já possui cadastro. Tente fazer login.";
      } else if (msgLower.includes("invalid email") || msgLower.includes("validate")) {
         msg = "O formato do e-mail é inválido.";
      } else if (msgLower.includes("password should be at least")) {
         msg = "A senha deve ter pelo menos 6 caracteres.";
      } else if (msgLower.includes("rate limit")) {
         msg = "Muitas tentativas. Aguarde um momento antes de tentar novamente.";
      }
      
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative selection:bg-cyan-500 selection:text-white font-sans">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center animate-fade-in-up">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => switchMode('none')}>
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            E
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100 hidden sm:block">
            Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI Analyst</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
              onClick={() => switchMode('login')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 hover:bg-slate-800 rounded-lg"
          >
              Entrar
          </button>
          <button 
              onClick={() => switchMode('register')}
              className="hidden sm:flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-50 transition-all shadow-lg shadow-white/5 active:scale-95"
          >
              Criar Conta Grátis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={`relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16 pb-32 transition-all duration-500 ${authMode !== 'none' ? 'blur-sm scale-95 opacity-50' : 'opacity-100'}`}>
        
        {/* Badge */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-8 hover:bg-slate-800 transition-colors cursor-default">
            <Sparkles className="w-3 h-3" />
            Inteligência Artificial Generativa 2.0
          </div>
        </div>

        {/* Headline */}
        <h1 
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl mx-auto leading-[1.1] animate-fade-in-up" 
          style={{ animationDelay: '200ms' }}
        >
          Transforme dados brutos do <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
            seu ERP em Decisões
          </span>
        </h1>

        {/* Subheadline */}
        <p 
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          Abandone as planilhas estáticas. Nossa IA audita, analisa e gera insights estratégicos 
          automáticos a partir dos seus relatórios de qualquer sistema de gestão.
        </p>

        {/* CTA Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button 
              onClick={() => switchMode('register')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-cyan-50 transition-all transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              Começar Análise Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-full ring-2 ring-white/50 group-hover:ring-cyan-400/50 animate-pulse"></div>
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">Não requer cartão de crédito • Processamento Seguro</p>
        </div>

        {/* Features Grid */}
        <div 
            className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left animate-fade-in-up"
            style={{ animationDelay: '600ms' }}
        >
            <FeatureCard 
                icon={<FileSpreadsheet className="w-6 h-6 text-emerald-400" />}
                title="Compatibilidade Universal"
                description="Suporte otimizado para relatórios exportados de ERPs de mercado (Vendas, Estoque, Financeiro e RH)."
                delay={600}
            />
            <FeatureCard 
                icon={<BrainCircuit className="w-6 h-6 text-purple-400" />}
                title="Auditoria com IA"
                description="Identificação automática de anomalias, tendências de ruptura e oportunidades de margem."
                delay={700}
            />
             <FeatureCard 
                icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
                title="Dashboards Automáticos"
                description="Transformamos linhas e colunas em gráficos visuais e KPIs executivos em segundos."
                delay={800}
            />
        </div>

        {/* --- PRICING SECTION --- */}
        <div className="mt-32 w-full max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: '800ms' }}>
           <div className="mb-16">
             <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que escalam com seu negócio</h2>
             <p className="text-slate-400">Escolha a potência de análise ideal para o seu momento.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              
              {/* STARTER */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 transition-colors relative group">
                 <h3 className="text-xl font-bold text-slate-300 mb-2">Starter</h3>
                 <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">R$ 0</span>
                    <span className="text-slate-500">/mês</span>
                 </div>
                 <p className="text-sm text-slate-400 mb-6 border-b border-slate-700 pb-6">
                    Perfeito para testar o poder da IA em relatórios simples.
                 </p>
                 <ul className="space-y-4 mb-8 text-left">
                    <PricingFeature text="3 Análises por mês" />
                    <PricingFeature text="Arquivos de até 5MB" />
                    <PricingFeature text="KPIs Básicos" />
                    <PricingFeature text="Exportação Limitada" muted />
                 </ul>
                 <button 
                   onClick={() => switchMode('register')}
                   className="w-full py-3 rounded-xl border border-slate-600 text-white font-semibold hover:bg-slate-700 transition-colors"
                 >
                    Começar Grátis
                 </button>
              </div>

              {/* PRO ANALYST (Featured) */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10 relative transform md:-translate-y-4 z-10">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                    Mais Popular
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    Pro Analyst <Sparkles className="w-4 h-4 text-cyan-400" />
                 </h3>
                 <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">R$ 97</span>
                    <span className="text-slate-400">/mês</span>
                 </div>
                 <p className="text-sm text-slate-300 mb-6 border-b border-slate-700 pb-6">
                    Para analistas e gestores que precisam de profundidade estratégica.
                 </p>
                 <ul className="space-y-4 mb-8 text-left">
                    <PricingFeature text="Análises Ilimitadas" highlight />
                    <PricingFeature text="Arquivos de até 50MB" />
                    <PricingFeature text="IA Modelo Gemini 2.0 Pro" highlight />
                    <PricingFeature text="Detecção de Anomalias" />
                    <PricingFeature text="Exportação PDF HD" />
                 </ul>
                 <button 
                   onClick={() => switchMode('register')}
                   className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-105"
                 >
                    Assinar Pro Agora
                 </button>
              </div>

              {/* ENTERPRISE */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 transition-colors">
                 <h3 className="text-xl font-bold text-slate-300 mb-2">Enterprise</h3>
                 <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-bold text-white">Sob Consulta</span>
                 </div>
                 <p className="text-sm text-slate-400 mb-6 border-b border-slate-700 pb-6">
                    Infraestrutura dedicada para grandes corporações.
                 </p>
                 <ul className="space-y-4 mb-8 text-left">
                    <PricingFeature text="Múltiplos Usuários" />
                    <PricingFeature text="API de Integração" />
                    <PricingFeature text="Fine-Tuning da IA" />
                    <PricingFeature text="SSO & Segurança Avançada" />
                    <PricingFeature text="Gerente de Conta Dedicado" />
                 </ul>
                 <button 
                   onClick={() => window.location.href = 'mailto:sales@enterpriseai.com'}
                   className="w-full py-3 rounded-xl border border-slate-600 text-white font-semibold hover:bg-slate-700 transition-colors"
                 >
                    Falar com Consultor
                 </button>
              </div>

           </div>
        </div>

      </main>

      {/* Footer Strip - Added Z-20 for clickability */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm py-8 text-center text-slate-500 text-sm absolute bottom-0 z-20">
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 opacity-70">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Dados Criptografados</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Análise em Tempo Real</span>
            </div>
            
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} <a href="https://www.linkedin.com/in/deividfcastro/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors font-medium">Deivid Castro</a>. Todos os direitos reservados.
            </p>
        </div>
      </footer>

      {/* AUTH MODAL OVERLAY */}
      {authMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" onClick={() => switchMode('none')}></div>
          
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 animate-scale-in">
            <button 
              onClick={() => switchMode('none')}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
               <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 mx-auto mb-4">
                {authMode === 'login' ? <LogIn className="w-6 h-6" /> : <User className="w-6 h-6" />}
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">
                 {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta gratuita'}
               </h2>
               <p className="text-slate-400 text-sm">
                 {authMode === 'login' 
                    ? 'Acesse seus painéis e relatórios salvos.' 
                    : 'Comece a analisar seus dados em segundos.'}
               </p>
            </div>

            {/* Error / Success Messages */}
            {authError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{authError}</p>
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-200">{authSuccess}</p>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Nome Completo</label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        required
                        placeholder="Seu nome" 
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Empresa</label>
                    <div className="relative">
                      <Building2 className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        placeholder="Nome da sua empresa" 
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="email" 
                    required
                    placeholder="voce@empresa.com" 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1">Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    placeholder="••••••••" 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {authMode === 'login' ? 'Acessar Dashboard' : 'Cadastrar e Começar'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                {authMode === 'login' ? 'Ainda não tem uma conta? ' : 'Já possui uma conta? '}
                <button 
                  onClick={() => switchMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
                >
                  {authMode === 'login' ? 'Cadastre-se grátis' : 'Fazer login'}
                </button>
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, delay: number }> = ({ icon, title, description, delay }) => (
    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-colors group">
        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">
            {description}
        </p>
    </div>
);

const PricingFeature: React.FC<{ text: string, highlight?: boolean, muted?: boolean }> = ({ text, highlight, muted }) => (
    <li className={`flex items-center gap-3 text-sm ${muted ? 'opacity-50 line-through' : ''}`}>
        <div className={`p-1 rounded-full ${highlight ? 'bg-cyan-500/20' : 'bg-slate-700'}`}>
            <Check className={`w-3 h-3 ${highlight ? 'text-cyan-400' : 'text-slate-400'}`} />
        </div>
        <span className={`${highlight ? 'text-white font-medium' : 'text-slate-300'}`}>{text}</span>
    </li>
);

export default LandingPage;