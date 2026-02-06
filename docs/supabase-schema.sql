-- Word Rung schema
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.puzzles (
  id uuid primary key default gen_random_uuid(),
  puzzle_date date not null unique,
  name text not null,
  seed integer not null,
  ladders jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists puzzles_puzzle_date_idx on public.puzzles (puzzle_date);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  puzzle_date date not null,
  participant_key text not null,
  user_id uuid null references auth.users(id) on delete set null,
  display_name text not null,
  total_score integer not null,
  total_seconds integer not null,
  ladders_solved integer not null,
  used_hints integer not null,
  moves_over_par integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint submissions_unique_participant_per_day unique (puzzle_date, participant_key)
);

create index if not exists submissions_date_score_idx
  on public.submissions (puzzle_date, total_score desc, total_seconds asc);

create index if not exists submissions_participant_idx on public.submissions (participant_key);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.puzzles enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles enable row level security;

-- Gameplay needs public puzzle reads.
drop policy if exists "Public read puzzles" on public.puzzles;
create policy "Public read puzzles"
  on public.puzzles
  for select
  using (true);

-- Leaderboard reads + score writes (if you ever post directly from client).
drop policy if exists "Public read submissions" on public.submissions;
create policy "Public read submissions"
  on public.submissions
  for select
  using (true);

drop policy if exists "Public insert submissions" on public.submissions;
create policy "Public insert submissions"
  on public.submissions
  for insert
  with check (true);

drop policy if exists "Public update submissions" on public.submissions;
create policy "Public update submissions"
  on public.submissions
  for update
  using (true)
  with check (true);

-- Profile ownership policies.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
