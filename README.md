# RTRW Net Platform

Platform billing + NMS untuk RT RW Net: voucher hotspot, langganan bulanan PPPoE,
monitoring jaringan (peta, sinyal OLT, bandwidth), RADIUS terpusat multi-lokasi,
dan backup data lokal per lokasi.

## Struktur
- `apps/web` — dashboard utama (Next.js 15 App Router + Supabase)
- `apps/local-backup-agent` — server lokal per lokasi (Node.js + SQLite), jalan
  walau koneksi ke server pusat putus, lalu sync otomatis saat online lagi
- `apps/radius-server` — konfigurasi FreeRADIUS pusat buat autentikasi PPPoE/hotspot
  lintas Mikrotik & lokasi
- `supabase/migrations` — skema database
- `docs` — SOP & catatan arsitektur

## Mulai dev
```
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Lihat `docs/arsitektur.md` untuk detail alur tiap modul, dan
`docs/onboarding-lokasi-baru.md` untuk SOP nambah lokasi baru.
