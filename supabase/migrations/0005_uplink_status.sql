-- Status & tracking per sumber uplink (buat load balancing multi-ISP+Starlink)
alter table uplink add column status text check (status in ('online', 'offline')) default 'online';
alter table uplink add column last_seen_at timestamptz;
alter table uplink add column interface_gateway text; -- IP gateway uplink ini di Mikrotik, buat ping test