import { createClient } from "@supabase/supabase-js";

// Single browser client; Supabase RLS enforces per-user access.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
