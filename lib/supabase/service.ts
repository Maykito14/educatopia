import { createClient } from "@supabase/supabase-js";

/** Cliente con service_role — omite RLS. Solo usar en server actions / route handlers. */
export function createServiceClient() {
  // Sin generic <Database>: supabase-js v2 tiene constraints estrictos en sus tipos
  // que difieren de @supabase/ssr. Usamos `any` aquí y tipamos explícitamente en cada uso.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
