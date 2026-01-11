-- Create a specific table for user profiles that extends the auth.users table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  first_name text,
  last_name text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create Policy: Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Create Policy: Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create Policy: Admins can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create Policy: Admins can update all profiles
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create Policy: Admins can delete profiles
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Make bhup0004@gmail.com an admin
-- Note: This requires the user to already exist in auth.users. 
-- If they don't exist yet, they will be 'user' on signup, so you might need to run an update later.
-- This block attempts to update if they exist.
do $$
begin
  if exists (select 1 from auth.users where email = 'bhup0004@gmail.com') then
    -- Ensure profile exists
    insert into public.profiles (id, email, role)
    select id, email, 'admin' 
    from auth.users 
    where email = 'bhup0004@gmail.com'
    on conflict (id) do update set role = 'admin';
  end if;
end $$;
