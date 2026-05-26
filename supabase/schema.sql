-- LifeOS Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================
-- snapshots table
-- Single-row per user — stores the entire app state as JSONB
-- Simple, fast, perfect for a single-user personal app
-- ============================================================
create table if not exists public.snapshots (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  payload    jsonb        not null default '{}'::jsonb,
  synced_at  timestamptz  not null default now()
);

-- Row Level Security — user can only read/write their own row
alter table public.snapshots enable row level security;

create policy "Users can manage their own snapshot"
  on public.snapshots
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Allow realtime (optional — useful if you open on Mac + iPhone)
-- ============================================================
alter publication supabase_realtime add table public.snapshots;

-- ============================================================
-- Done! Your schema is ready.
-- ============================================================
