# Catatan Arsitektur

- Payment: DOKU (checkout + webhook + fallback poller check-status)
- Voucher: DOKU paid -> trigger langsung ke Mikrotik RouterOS API (add hotspot user)
- Monitoring: polling Mikrotik (status PPPoE/wireless) + SNMP ke OLT (sinyal laser)
- Alert: threshold offline/sinyal lemah > 7 menit -> auto tiket + WA admin & teknisi
- RADIUS: FreeRADIUS pusat, tiap Mikrotik lokasi jadi NAS client (via VPN WireGuard)
- Backup lokal: tiap lokasi punya local-backup-agent (SQLite), sync ke Supabase
  saat online, tetap operasional walau koneksi pusat putus
