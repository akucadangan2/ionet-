# SOP Onboarding Lokasi Baru

1. Setup WireGuard di Mikrotik lokasi baru, tunnel ke server pusat
2. Daftarkan Mikrotik sebagai NAS client di `apps/radius-server/config/clients.conf`
3. Deploy `local-backup-agent` di perangkat lokal lokasi tsb
4. Tambahkan lokasi baru di dashboard (`/jaringan/lokasi`)
5. Test: generate voucher, cek status di peta, cek sync backup lokal
