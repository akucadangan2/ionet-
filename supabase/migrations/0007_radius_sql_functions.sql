-- Tabel radcheck standar FreeRADIUS (kalau numpang di Postgres yang sama)
create table if not exists radcheck (
  id serial primary key,
  username text not null,
  attribute text not null default 'Cleartext-Password',
  op text not null default ':=',
  value text not null
);

create table if not exists nas (
  id serial primary key,
  nasname text not null,
  shortname text,
  secret text not null
);

-- Function buat insert/update NAS
create or replace function insert_radius_nas(p_nasname text, p_shortname text, p_secret text)
returns void as $$
begin
  insert into nas (nasname, shortname, secret)
  values (p_nasname, p_shortname, p_secret)
  on conflict do nothing; -- sesuaikan constraint unique nasname kalau perlu
end;
$$ language plpgsql security definer;

-- Function buat upsert user RADIUS
create or replace function upsert_radius_user(p_username text, p_password text)
returns void as $$
begin
  delete from radcheck where username = p_username and attribute = 'Cleartext-Password';
  insert into radcheck (username, attribute, op, value)
  values (p_username, 'Cleartext-Password', ':=', p_password);
end;
$$ language plpgsql security definer;

-- Function buat hapus user RADIUS
create or replace function delete_radius_user(p_username text)
returns void as $$
begin
  delete from radcheck where username = p_username;
end;
$$ language plpgsql security definer;