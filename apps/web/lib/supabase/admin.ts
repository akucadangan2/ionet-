// lib/supabase/admin.ts
// Client khusus dipakai di server (API routes) - pakai service role key,
// bukan anon key, karena API route adalah backend kita sendiri (trusted),
// bukan browser session yang perlu dibatasi RLS
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);