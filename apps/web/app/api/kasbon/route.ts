import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabase
    .from("kasbon")
    .select("*, karyawan(nama, jabatan)")
    .order("tanggal_pengajuan", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { error } = await supabase.from("kasbon").insert({
    karyawan_id: body.karyawanId,
    jumlah: body.jumlah,
    alasan: body.alasan || null,
    cicilan_per_bulan: body.cicilanPerBulan || null,
    sisa_saldo: body.jumlah,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "pengajuan kasbon berhasil dikirim" });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const payload: any = {
    status: body.status,
    tanggal_diproses: new Date().toISOString(),
  };
  if (body.status === "disetujui") {
    payload.sisa_saldo = body.jumlah;
  }

  const { error } = await supabase.from("kasbon").update(payload).eq("id", body.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "status kasbon berhasil diupdate" });
}