# Setup WireGuard: Lokasi Baru -> Server Pusat

## Di server pusat (sekali setup, bukan per lokasi):
1. Generate keypair server: `wg genkey | tee server_private.key | wg pubkey > server_public.key`
2. Buat interface WireGuard di server pusat (misal `wg0`), assign IP (misal `10.100.0.1/24`)
3. Tiap lokasi baru dapat IP client berikutnya (10.100.0.2, 10.100.0.3, dst)

## Di Mikrotik tiap lokasi (RouterOS 7+, WireGuard built-in):
1. `/interface wireguard add name=wg-pusat listen-port=13231`
2. Generate keypair di Mikrotik: `/interface wireguard print` (lihat public-key yang otomatis dibuat)
3. Tambahkan peer ke server pusat:

/interface wireguard peers add interface=wg-pusat
public-key="<public key server pusat>"
endpoint-address=<IP publik server pusat>
endpoint-port=13231
allowed-address=10.100.0.0/24

4. Assign IP lokasi ini: `/ip address add address=10.100.0.X/24 interface=wg-pusat`
5. Tambahkan peer BALIK di server pusat, pakai public-key dari Mikrotik lokasi ini

## Setelah tunnel connect:
- Update kolom `wireguard_public_key` & `wireguard_status` di tabel `lokasi` (manual dulu, atau lewat script cek status nanti)
- Daftarkan Mikrotik ini sebagai NAS RADIUS lewat `registerNas()` di `lib/radius/client.ts`, pakai IP tunnel (10.100.0.X) sebagai `nasIp`