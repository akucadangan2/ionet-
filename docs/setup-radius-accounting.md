markdown
# Setup RADIUS Accounting (buat data sesi aktif)

Tabel `radacct` di Supabase itu cuma wadah kosong sampai FreeRADIUS beneran
dikonfigurasi buat nulis data accounting ke situ. Ini bukan kerjaan kode
aplikasi, tapi konfigurasi server FreeRADIUS:

1. Di `radiusd.conf`, aktifkan module `sql` (arahkan koneksinya ke database
   Supabase Postgres yang sama, pakai connection string dari Settings → Database)
2. Di `sites-enabled/default`, pastikan section `accounting` include `sql`
3. Pastikan Mikrotik tiap lokasi dikonfigurasi kirim **accounting packets**
   ke RADIUS pusat, bukan cuma authentication:

/radius add service=ppp address=<IP server RADIUS pusat via VPN>
secret=<secret NAS ini> accounting-port=1813

4. Test: konek 1 client PPPoE, cek tabel `radacct` — harusnya muncul baris baru
   dengan `acctstoptime` masih kosong (artinya sesi aktif)