-- Lupa dibikin policy-nya waktu 0001_init.sql - RLS nyala tanpa policy = semua akses ditolak
create policy "staff_all_lokasi" on lokasi for all to authenticated using (true);
create policy "staff_all_router" on router for all to authenticated using (true);
create policy "staff_all_transaksi_voucher" on transaksi_voucher for all to authenticated using (true);
create policy "staff_all_pembayaran_bulanan" on pembayaran_bulanan for all to authenticated using (true);
create policy "staff_all_tiket_gangguan" on tiket_gangguan for all to authenticated using (true);
create policy "staff_all_staff" on staff for all to authenticated using (true);