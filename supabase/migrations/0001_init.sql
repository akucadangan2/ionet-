-- ============================================
-- 0001_init.sql — Skema inti RTRW Net Platform
-- ============================================

-- Lokasi (site/cabang)
create table lokasi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text,
  latitude double precision,
  longitude double precision,
  vpn_ip text,              -- IP WireGuard lokasi ini ke server pusat
  created_at timestamptz default now()
);

-- Router Mikrotik per lokasi
create table router (
  id uuid primary key default gen_random_uuid(),
  lokasi_id uuid references lokasi(id) on delete cascade,
  nama text not null,
  ip_address text not null,
  api_username text not null,
  api_password text not null,  -- simpan terenkripsi di app layer, jangan plaintext
  tipe text check (tipe in ('hotspot', 'pppoe')) not null,
  created_at timestamptz default now()
);

-- Sumber uplink per lokasi (ISP / Starlink / dll)
create table uplink (
  id uuid primary key default gen_random_uuid(),
  lokasi_id uuid references lokasi(id) on delete cascade,
  nama text not null,        -- misal "ISP Utama", "Starlink"
  interface_mikrotik text,   -- nama interface di RouterOS
  created_at timestamptz default now()
);

-- Pelanggan
create table pelanggan (
  id uuid primary key default gen_random_uuid(),
  lokasi_id uuid references lokasi(id),
  nama text not null,
  no_hp text,
  alamat text,
  latitude double precision,
  longitude double precision,
  tipe_langganan text check (tipe_langganan in ('hotspot_voucher', 'pppoe_bulanan')) not null,
  pppoe_username text,       -- kalau tipe pppoe_bulanan
  paket_bulanan_id uuid,

  
  tanggal_jatuh_tempo date,
  status text check (status in ('aktif', 'nonaktif', 'suspend')) default 'aktif',
  disable_otomatis boolean default true,  -- exception per pelanggan buat auto-disable
  created_at timestamptz default now()
);

-- Paket harga bulanan
create table paket_bulanan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  harga_per_bulan numeric not null,
  kecepatan text
);
alter table pelanggan add constraint fk_paket_bulanan foreign key (paket_bulanan_id) references paket_bulanan(id);

-- Paket voucher hotspot
create table paket_voucher (
  id uuid primary key default gen_random_uuid(),
  nama text not null,        -- misal "1 Hari", "1 Minggu"
  harga numeric not null,
  durasi_menit integer not null,
  profile_mikrotik text not null
);

-- Transaksi voucher
create table transaksi_voucher (
  id uuid primary key default gen_random_uuid(),
  lokasi_id uuid references lokasi(id),
  paket_voucher_id uuid references paket_voucher(id),
  no_hp_pembeli text,
  nominal_dibayar numeric not null,   -- termasuk kode unik (misal 10017)
  metode text check (metode in ('qris_statis', 'tunai')) not null,
  status text check (status in ('pending', 'lunas', 'expired')) default 'pending',
  kode_voucher text,                  -- hasil generate ke Mikrotik
  dibayar_at timestamptz,
  created_at timestamptz default now()
);

-- Pembayaran langganan bulanan
create table pembayaran_bulanan (
  id uuid primary key default gen_random_uuid(),
  pelanggan_id uuid references pelanggan(id),
  jumlah_bulan integer not null default 1,
  nominal numeric not null,
  metode text check (metode in ('doku', 'tunai')) not null,
  doku_reference_id text,
  status text check (status in ('pending', 'menunggu_validasi', 'lunas', 'ditolak')) default 'pending',
  divalidasi_oleh uuid,       -- admin yang validasi manual
  divalidasi_at timestamptz,
  periode_mulai date,
  periode_selesai date,       -- dihitung otomatis sesuai jumlah_bulan
  created_at timestamptz default now()
);

-- Struk
create table struk (
  id uuid primary key default gen_random_uuid(),
  transaksi_voucher_id uuid references transaksi_voucher(id),
  pembayaran_bulanan_id uuid references pembayaran_bulanan(id),
  nomor_struk text not null,
  created_at timestamptz default now()
);

-- Tiket gangguan
create table tiket_gangguan (
  id uuid primary key default gen_random_uuid(),
  lokasi_id uuid references lokasi(id),
  router_id uuid references router(id),
  pelanggan_id uuid references pelanggan(id),
  jenis text check (jenis in ('offline', 'sinyal_lemah', 'bandwidth')) not null,
  sumber_uplink_id uuid references uplink(id),  -- kalau gangguan bandwidth, ketahuan dari uplink mana
  status text check (status in ('baru', 'ditangani', 'selesai')) default 'baru',
  assigned_to uuid,           -- teknisi
  terdeteksi_at timestamptz default now(),
  selesai_at timestamptz
);

-- Log sinyal OLT (laser) per ONU/modem
create table log_sinyal_olt (
  id uuid primary key default gen_random_uuid(),
  pelanggan_id uuid references pelanggan(id),
  rx_power numeric,
  tx_power numeric,
  recorded_at timestamptz default now()
);

-- Log bandwidth usage
create table log_bandwidth (
  id uuid primary key default gen_random_uuid(),
  pelanggan_id uuid references pelanggan(id),
  upload_bytes bigint,
  download_bytes bigint,
  recorded_at timestamptz default now()
);

-- User staff (Super Admin, Admin, Teknisi)
create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  nama text not null,
  role text check (role in ('super_admin', 'admin', 'teknisi')) not null,
  created_at timestamptz default now()
);

-- ============================================
-- RLS (target anon & authenticated, sesuai lesson dari Butik Antam)
-- ============================================
alter table lokasi enable row level security;
alter table router enable row level security;
alter table pelanggan enable row level security;
alter table transaksi_voucher enable row level security;
alter table pembayaran_bulanan enable row level security;
alter table tiket_gangguan enable row level security;
alter table staff enable row level security;

-- Contoh policy dasar (perlu disesuaikan lagi per role nanti):
create policy "staff_read_all" on pelanggan for select to authenticated using (true);
create policy "staff_write_all" on pelanggan for all to authenticated using (true);