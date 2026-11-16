-- Solo si necesitas recrear la tabla/políticas en un proyecto nuevo.
-- En tu proyecto actual ya comprobaste que la tabla y las tres políticas existen.
create table if not exists public.habit_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.habit_sync enable row level security;

drop policy if exists "Read own habits" on public.habit_sync;
drop policy if exists "Insert own habits" on public.habit_sync;
drop policy if exists "Update own habits" on public.habit_sync;

create policy "Read own habits" on public.habit_sync
for select to authenticated using (auth.uid() = user_id);

create policy "Insert own habits" on public.habit_sync
for insert to authenticated with check (auth.uid() = user_id);

create policy "Update own habits" on public.habit_sync
for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);
