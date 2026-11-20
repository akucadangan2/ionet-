import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

function hitungRentang(periode: string) {
  const sekarang = new Date();
  const akhir = sekarang;
  const WIB_MS = 7 * 60 * 60 * 1000;
  const wib = new Date(sekarang.getTime() + WIB_MS); // batas hari/bulan/tahun dihitung dari tengah malam WIB, bukan UTC
  let awal: Date;

  if (periode === "harian") {
    awal = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB_MS);
  } else if (periode === "mingguan") {
    awal = new Date(sekarang);
    awal.setDate(awal.getDate() - 7);
  } else if (periode === "bulanan") {
    awal = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - WIB_MS);
  } else {
    // tahunan
    awal = new Date(Date.UTC(wib.getUTCFullYear(), 0, 1) - WIB_MS);
  }

  return { awal: awal.toISOString(), akhir: akhir.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const periode = req.nextUrl.searchParams.get("periode") || "harian";
    const { awal, akhir } = hitungRentang(periode);

    const { data, error } = await supabase.rpc("rekap_kuota_uplink", {
      p_awal: awal,
      p_akhir: akhir,
    });

    if (error) throw new Error(error.message);

    const hasil = (data || []).map((row: any) => ({
      uplinkId: row.uplink_id,
      nama: row.nama,
      totalDownloadGb: Number(row.total_download_gb) || 0,
      totalUploadGb: Number(row.total_upload_gb) || 0,
      totalGb: (Number(row.total_download_gb) || 0) + (Number(row.total_upload_gb) || 0),
    }));

    const grandTotal = hasil.reduce(
      (acc: any, r: any) => ({
        totalDownloadGb: acc.totalDownloadGb + r.totalDownloadGb,
        totalUploadGb: acc.totalUploadGb + r.totalUploadGb,
        totalGb: acc.totalGb + r.totalGb,
      }),
      { totalDownloadGb: 0, totalUploadGb: 0, totalGb: 0 }
    );

    return NextResponse.json({
      periode,
      awal,
      akhir,
      perIsp: hasil,
      grandTotal: {
        totalDownloadGb: Math.round(grandTotal.totalDownloadGb * 100) / 100,
        totalUploadGb: Math.round(grandTotal.totalUploadGb * 100) / 100,
        totalGb: Math.round(grandTotal.totalGb * 100) / 100,
      },
    });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}