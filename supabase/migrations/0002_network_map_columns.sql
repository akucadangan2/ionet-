-- Kolom tambahan buat fitur peta jaringan + sinyal OLT
alter table router add column latitude double precision;
alter table router add column longitude double precision;
alter table router add column status text check (status in ('online', 'offline')) default 'online';
alter table router add column last_seen_at timestamptz;

alter table pelanggan add column onu_index integer;
alter table pelanggan add column olt_ip text;