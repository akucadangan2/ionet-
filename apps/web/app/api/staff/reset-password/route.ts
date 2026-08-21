import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { authUserId, newPassword } = await req.json();

  if (!authUserId || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: "Password minimal 6 karakter" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ message: `Gagal reset password: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ message: "Password berhasil direset" });
}