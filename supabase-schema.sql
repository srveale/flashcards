-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Decks table
create table public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  created_at timestamptz default now() not null
);

-- Cards table
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  repetitions integer default 0 not null,
  ease_factor real default 2.5 not null,
  interval integer default 0 not null,
  next_review timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Indexes for performance
create index idx_cards_deck_id on public.cards(deck_id);
create index idx_cards_next_review on public.cards(next_review);
create index idx_decks_user_id on public.decks(user_id);

-- Row Level Security: only the owner can see/modify their decks and cards
alter table public.decks enable row level security;
alter table public.cards enable row level security;

create policy "Users can manage their own decks"
  on public.decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage cards in their own decks"
  on public.cards for all
  using (deck_id in (select id from public.decks where user_id = auth.uid()))
  with check (deck_id in (select id from public.decks where user_id = auth.uid()));
