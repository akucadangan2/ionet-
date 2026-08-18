import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const periode = req.nextUrl.searchParams.get("periode") || "harian";

    const { data: uplinkList } = await supabase.from("uplink").select("id, nama");

    let sejakTanggal = new Date();
    if (periode === "harian") sejakTanggal.setDate(sejakTanggal.getDate() - 1);
    else if (periode === "mingguan") sejakTanggal.setDate(sejakTanggal.getDate() - 7);
    else if (periode === "bulanan") sejakTanggal.setMonth(sejakTanggal.getMonth() - 1);

    const result: Record<string, any> = {};

    for (const uplink of uplinkList || []) {
      const { data: logs } = await supabase
        .from("log_uplink_traffic")
        .select("download_mbps, upload_mbps, recorded_at")
        .eq("uplink_id", uplink.id)
        .gte("recorded_at", sejakTanggal.toISOString())
        .order("recorded_at");

      if (!logs || logs.length === 0) {
        result[uplink.nama] = { avgDownload: 0, avgUpload: 0, maxDownload: 0, maxUpload: 0, dataPoints: 0, chartData: [] };
        continue;
      }

      const totalDownload = logs.reduce((sum, l) => sum + Number(l.download_mbps || 0), 0);
      const totalUpload = logs.reduce((sum, l) => sum + Number(l.upload_mbps || 0), 0);
      const maxDownload = Math.max(...logs.map((l) => Number(l.download_mbps || 0)));
      const maxUpload = Math.max(...logs.map((l) => Number(l.upload_mbps || 0)));

      const bucketSize = periode === "harian" ? 24 : periode === "mingguan" ? 7 : 30;
      const chunkSize = Math.max(1, Math.floor(logs.length / bucketSize));
      const chartData = [];
      for (let i = 0; i < logs.length; i += chunkSize) {
        const chunk = logs.slice(i, i + chunkSize);
        const avgD = chunk.reduce((s, l) => s + Number(l.download_mbps || 0), 0) / chunk.length;
        chartData.push({
          waktu: chunk[0].recorded_at,
          downloadMbps: Math.round(avgD * 10) / 10,
        });
      }

      result[uplink.nama] = {
        avgDownload: Math.round((totalDownload / logs.length) * 10) / 10,
        avgUpload: Math.round((totalUpload / logs.length) * 10) / 10,
        maxDownload: Math.round(maxDownload * 10) / 10,
        maxUpload: Math.round(maxUpload * 10) / 10,
        dataPoints: logs.length,
        chartData,
      };
    }

    return NextResponse.json({ periode, rekap: result });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}