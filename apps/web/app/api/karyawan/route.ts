import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET() {
  const { data: karyawanList, error } = await supabase.from("karyawan").select("*").order("nama");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data: staffList } = await supabase
    .from("staff")
    .select("nama, karyawan_id")
    .not("karyawan_id", "is", null);

  const linkedMap: Record<string, string> = {};
  (staffList || []).forEach((s) => {
    if (s.karyawan_id) linkedMap[s.karyawan_id] = s.nama;
  });

  const data = (karyawanList || []).map((k) => ({
    ...k,
    staffTerhubung: linkedMap[k.id] || null,
  }));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    nama: body.nama,
    jabatan: body.jabatan,
    no_hp: body.no_hp || null,
    gaji_pokok: body.gaji_pokok || 0,
    status: body.status || "aktif",
    shift: body.shift || null,
    potongan_alpa: body.potongan_alpa === "" || body.potongan_alpa === undefined ? null : body.potongan_alpa,
  };

  const { error } = body.id
    ? await supabase.from("karyawan").update(payload).eq("id", body.id)
    : await supabase.from("karyawan").insert(payload);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil disimpan" });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id diperlukan" }, { status: 400 });

  const { data: staffTerkait } = await supabase
    .from("staff")
    .select("id, nama")
    .eq("karyawan_id", id)
    .maybeSingle();

  if (staffTerkait) {
    return NextResponse.json(
      {
        message: `Tidak bisa dihapus - karyawan ini sudah terhubung ke akun staff "${staffTerkait.nama}". Putuskan link-nya dulu di halaman Pengguna sebelum menghapus.`,
      },
      { status: 400 }
    );
  }

  // Cek juga riwayat data di tabel lain - hapus paksa bisa merusak riwayat itu
  const [absensiCount, kasbonCount, payrollCount, komisiCount] = await Promise.all([
    supabase.from("absensi").select("id", { count: "exact", head: true }).eq("karyawan_id", id),
    supabase.from("kasbon").select("id", { count: "exact", head: true }).eq("karyawan_id", id),
    supabase.from("payroll").select("id", { count: "exact", head: true }).eq("karyawan_id", id),
    supabase.from("komisi").select("id", { count: "exact", head: true }).eq("karyawan_id", id),
  ]);

  const riwayat: string[] = [];
  if ((absensiCount.count || 0) > 0) riwayat.push(`${absensiCount.count} data absensi`);
  if ((kasbonCount.count || 0) > 0) riwayat.push(`${kasbonCount.count} data kasbon`);
  if ((payrollCount.count || 0) > 0) riwayat.push(`${payrollCount.count} data payroll`);
  if ((komisiCount.count || 0) > 0) riwayat.push(`${komisiCount.count} data komisi`);

  if (riwayat.length > 0) {
    return NextResponse.json(
      {
        message: `Tidak bisa dihapus - karyawan ini masih punya riwayat: ${riwayat.join(", ")}. Kalau karyawan sudah tidak aktif, ubah statusnya jadi "Nonaktif" saja lewat tombol Edit, jangan dihapus - biar riwayatnya tetap aman buat laporan.`,
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("karyawan").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "berhasil dihapus" });
}