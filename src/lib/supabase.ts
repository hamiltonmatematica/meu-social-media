import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
=======
// # PROTEÇÃO MÁXIMA - ContentPlatformCore
// Configurações de acesso ao banco de dados com isolamento total.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * CLIENT-SIDE SUPABASE (PROTEÇÃO MÁXIMA)
 * Este cliente opera sob Row Level Security (RLS).
 * É o ÚNICO que deve ser usado em componentes do frontend.
 * Ele respeita as políticas de 'Strict Ownership' definidas em SQL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ADMIN-SIDE SUPABASE (BYPASS RLS - CUIDADO!)
 * Este cliente usa a SERVICE_ROLE_KEY e ignora RLS.
 * DEVE ser usado apenas em:
 * 1. API Routes (Serverless Functions)
 * 2. Background Workers (CRON / Queues)
 * 3. Operações administrativas críticas onde o RLS bloqueia o fluxo legítimo do sistema.
 * 
 * NUNCA EXPOR ESTE CLIENTE NO FRONTEND.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Função Utilitária para garantir que o RLS seja respeitado no servidor
 * quando o usuário está autenticado, mas o ADMIN_KEY é necessário por outros motivos.
 */
export const getSupabaseClientByAuth = (jwt?: string) => {
  if (jwt) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });
  }
  return supabase;
};
>>>>>>> 3983e56 (feat: implementada Proteção Máxima e Tutorial PT-BR)
