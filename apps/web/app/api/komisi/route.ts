import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("komisi")
    .select("*, karyawan(nama, jabatan), pelanggan(nama)")
    .order("tanggal", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const jumlahKomisi = (body.nilaiDasar * body.persentase) / 100;

  const { error } = await supabase.from("komisi").insert({
    karyawan_id: body.karyawanId,
    pelanggan_id: body.pelangganId || null,
    jenis: body.jenis,
    nilai_dasar: body.nilaiDasar,
    persentase: body.persentase,
    jumlah_komisi: jumlahKomisi,
    keterangan: body.keterangan || null,
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "komisi berhasil dicatat" });
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabase.from("komisi").update({ status: "dibayar" }).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil ditandai dibayar" });
}