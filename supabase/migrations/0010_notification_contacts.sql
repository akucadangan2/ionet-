create table notification_contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  no_hp text not null,
  kategori text check (kategori in ('admin', 'teknisi')) not null,
  aktif boolean default true,
  created_at timestamptz default now()
);

alter table notification_contacts enable row level security;
create policy "staff_all_notification_contacts" on notification_contacts for all to authenticated using (true);