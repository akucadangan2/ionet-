-- Tabel radacct standar FreeRADIUS - buat tracking sesi aktif (accounting)
create table if not exists radacct (
  radacctid bigserial primary key,
  acctsessionid text not null,
  username text,
  nasipaddress text not null,
  framedipaddress text,
  acctstarttime timestamptz,
  acctstoptime timestamptz,
  acctinputoctets bigint,
  acctoutputoctets bigint
);

create index if not exists idx_radacct_active on radacct (nasipaddress) where acctstoptime is null;