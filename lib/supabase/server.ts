import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

export const isServiceRoleConfigured = Boolean(
  isSupabaseConfigured &&
    serviceRoleKey &&
    !serviceRoleKey.includes("your-service-role") &&
    serviceRoleKey.length > 20
);

/**
 * Cria cliente Supabase utilizando anonKey pública (respeita regras RLS padrão)
 */
export function createServerClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Cria cliente Supabase administrativo com service_role (bypassa RLS para operações internas e administrativas).
 * Retorna null explicitamente se SUPABASE_SERVICE_ROLE_KEY não estiver configurada no ambiente.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured || !isServiceRoleConfigured) {
    return null;
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
