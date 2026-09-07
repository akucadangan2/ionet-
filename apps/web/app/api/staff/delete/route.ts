// app/api/staff/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { staffId, authUserId } = await req.json();
    if (!staffId || !authUserId) {
      return NextResponse.json({ message: "staffId dan authUserId diperlukan" }, { status: 400 });
    }

    // Hapus baris di tabel staff dulu
    const { error: staffError } = await supabase.from("staff").delete().eq("id", staffId);
    if (staffError) {
      return NextResponse.json({ message: "Gagal hapus data staff: " + staffError.message }, { status: 500 });
    }

    // Baru hapus akun login-nya (Supabase Auth) - kalau ini gagal, data staff
    // udah kehapus tapi akun login masih ada, jadi dilaporkan jelas ke user
    // biar ketauan perlu dibersihin manual dari Supabase dashboard
    const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);
    if (authError) {
      return NextResponse.json(
        { message: "Data staff terhapus, tapi akun login gagal dihapus: " + authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Staff berhasil dihapus" });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}