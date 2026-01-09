import { createClient } from '@supabase/supabase-js';

// ⚠️ INSTRUÇÕES DE CONFIGURAÇÃO (PASSO FINAL):
// 1. Acesse https://supabase.com/dashboard/project/_/settings/api
// 2. Copie a "Project URL" e a chave "anon public".
// 3. Cole abaixo entre as aspas.

const projectUrl = 
  process.env.REACT_APP_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://fdjohynzjkpzhqnzmwsu.supabase.co'; 

const projectKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkam9oeW56amtwemhxbnptd3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTAyNzYsImV4cCI6MjA4MzQ4NjI3Nn0.CVDTJ2UbZkqILtKdCkPyIWyeqw6taC3FBrSt88Gjne0';

// Verificação de segurança para a UI
export const isConfigured = 
  projectUrl !== 'https://sua-url-do-projeto.supabase.co' && 
  !projectUrl.includes('sua-url') &&
  projectKey !== 'sua-chave-anonima-publica' &&
  !projectKey.includes('sua-chave');

// Cria o cliente. Se não estiver configurado, cria um cliente "dummy" para não quebrar a aplicação imediatamente.
export const supabase = createClient(
  projectUrl, 
  projectKey
);