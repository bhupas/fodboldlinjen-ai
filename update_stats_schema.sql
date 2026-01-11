-- Migration to add new statistics columns to player_stats
alter table if exists public.player_stats
add column if not exists goals integer default 0,
add column if not exists assists integer default 0,
add column if not exists minutes_played integer default 0,
add column if not exists yellow_cards integer default 0,
add column if not exists red_cards integer default 0,
add column if not exists distance_km numeric(5,2) default 0.00;
