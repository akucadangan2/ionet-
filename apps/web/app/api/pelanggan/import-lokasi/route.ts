import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

function normalizeNama(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/(.)\1+/g, "$1");
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = [];
  for (let i = 0; i <= a.length; i++) dp[i] = [i];
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

function wordOverlapScore(nama1: string, nama2: string): number {
  const words1 = nama1.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const words2 = nama2.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matchCount = 0;
  for (const w1 of words1) {
    if (words2.some((w2) => w2 === w1)) matchCount++;
  }

  const minWords = Math.min(words1.length, words2.length);
  return matchCount / minWords;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: { nama: string; lat: number; lng: number }[] = body.rows;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ message: "Format data tidak valid" }, { status: 400 });
    }

    const { data: pelangganList } = await supabase
      .from("pelanggan")
      .select("id, nama, pppoe_username");

    const candidates: { id: string; normalized: string; original: string }[] = [];
    (pelangganList || []).forEach((p) => {
      if (p.nama) candidates.push({ id: p.id, normalized: normalizeNama(p.nama), original: p.nama });
      if (p.pppoe_username) candidates.push({ id: p.id, normalized: normalizeNama(p.pppoe_username), original: p.pppoe_username });
    });

    let matched = 0;
    let matchedExact = 0;
    let matchedFuzzy = 0;
    const unmatched: string[] = [];

    for (const row of rows) {
      const key = normalizeNama(row.nama);

      let bestMatch: { id: string; distance: number } | null = null;
      for (const c of candidates) {
        if (c.normalized === key) {
          bestMatch = { id: c.id, distance: 0 };
          break;
        }
        const distance = levenshtein(key, c.normalized);
        const threshold = Math.max(2, Math.floor(key.length * 0.15));
        if (distance <= threshold) {
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { id: c.id, distance: distance };
          }
        }
      }

      if (!bestMatch) {
        let bestWordScore = 0;
        let bestWordMatchId: string | null = null;
        for (const c of candidates) {
          const score = wordOverlapScore(row.nama, c.original);
          if (score >= 0.67 && score > bestWordScore) {
            bestWordScore = score;
            bestWordMatchId = c.id;
          }
        }
        if (bestWordMatchId) {
          bestMatch = { id: bestWordMatchId, distance: 1 };
        }
      }

      if (!bestMatch) {
        const isHotspotPoint = row.nama.toLowerCase().indexOf("hotspot") !== -1;

        if (isHotspotPoint && body.createMissingHotspot) {
          const { data: lokasiDefault } = await supabase.from("lokasi").select("id").limit(1).single();
          const { error: insertError } = await supabase.from("pelanggan").insert({
            nama: row.nama,
            tipe_langganan: "hotspot_voucher",
            lokasi_id: lokasiDefault ? lokasiDefault.id : null,
            latitude: row.lat,
            longitude: row.lng,
            status: "aktif",
          });

          if (!insertError) {
            matched++;
            matchedFuzzy++;
            continue;
          }
        }

        unmatched.push(row.nama);
        continue;
      }

      const { error } = await supabase
        .from("pelanggan")
        .update({ latitude: row.lat, longitude: row.lng })
        .eq("id", bestMatch.id);

      if (!error) {
        matched++;
        if (bestMatch.distance === 0) matchedExact++;
        else matchedFuzzy++;
      } else {
        unmatched.push(row.nama);
      }
    }

    return NextResponse.json({ matched, matchedExact, matchedFuzzy, unmatched, total: rows.length });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}