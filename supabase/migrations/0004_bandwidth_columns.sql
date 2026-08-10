-- Limit bandwidth per pelanggan (buat ditampilkan & diedit di dashboard)
alter table pelanggan add column bandwidth_upload_limit text default '2M';
alter table pelanggan add column bandwidth_download_limit text default '5M';
alter table pelanggan add column mikrotik_queue_target text; -- IP atau identifier queue di Mikrotik