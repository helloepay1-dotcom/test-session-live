import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function getPublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Client côté serveur avec clé secrète (bypass RLS). */
export function createServiceClient() {
  const secretKey = getSecretKey();
  if (secretKey) {
    return createClient(getSupabaseUrl(), secretKey);
  }
  return createClient(getSupabaseUrl(), getPublishableKey());
}

/**
 * Client pour les insertions API (ex: /api/receive-message).
 * Utilise la clé publishable car les politiques RLS sont permissives
 * et l'accès est protégé par API_SECRET_KEY.
 */
export function createApiClient() {
  return createClient(getSupabaseUrl(), getPublishableKey());
}
