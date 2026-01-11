
-- Create performance_stats table for gym/exercise data
create table if not exists public.performance_stats (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  exercise text not null,
  pr_1 numeric,
  pr_2 numeric,
  pr_3 numeric,
  pr_4 numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add constraint to avoid duplicates if needed, e.g. player + exercise + day? 
  -- For now, just player+exercise might be unique IF the file is a snapshot. 
  -- But if they upload history, we might want multiple rows.
  -- The user file looks like a snapshot ("1.PR", "2.PR" etc imply history in columns).
  -- So getting a new file usually means "Update this player's stats".
  unique(player_name, exercise)
);

-- RLS Policies (Optional but good practice)
alter table public.performance_stats enable row level security;

create policy "Enable read access for all users" on public.performance_stats
    for select using (true);

create policy "Enable insert for authenticated users only" on public.performance_stats
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.performance_stats
    for update using (auth.role() = 'authenticated');
