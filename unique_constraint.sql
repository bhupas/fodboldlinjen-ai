-- Create a unique constraint to prevent duplicate player stats for the same match
-- This allows us to use 'upsert' functionality to update existing records instead of creating duplicates
alter table public.player_stats
add constraint player_stats_match_player_unique unique (match_id, player_name);
