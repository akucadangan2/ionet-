-- Kolom tambahan buat tracking durasi gangguan + kontak staff
alter table pelanggan add column sinyal_lemah_since timestamptz;
alter table staff add column no_hp text;