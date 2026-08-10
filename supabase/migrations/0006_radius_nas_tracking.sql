-- Tracking NAS (Mikrotik) yang terdaftar di FreeRADIUS pusat
alter table router add column radius_nas_secret text; -- shared secret NAS ini ke FreeRADIUS
alter table router add column radius_registered boolean default false;
alter table lokasi add column wireguard_public_key text;
alter table lokasi add column wireguard_status text check (wireguard_status in ('connected', 'disconnected')) default 'disconnected';