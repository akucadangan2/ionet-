// app/api/staff/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Client khusus pakai service role - cuma dipakai di server, JANGAN pernah expose ke browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { nama, email, noHp, role, password } = await req.json();
  const tempPassword = password && password.length >= 6 ? password : Math.random().toString(36).slice(-10);

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ message: `gagal bikin auth user: ${authError?.message}` }, { status: 500 });
  }

  const { error: staffError } = await supabaseAdmin.from("staff").insert({
    auth_user_id: authUser.user.id,
    nama,
    role,
    no_hp: noHp,
  });

  if (staffError) {
    return NextResponse.json({ message: `gagal simpan data staff: ${staffError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    message: `Staff berhasil dibuat. Password sementara: ${tempPassword} (kirim manual ke staff, minta ganti pas login pertama)`,
  });
}