# Supabase Setup

This is the planned low-budget backend for the shared garden calendar.

## Security Model

- The GitHub Pages frontend is public.
- Supabase database rows are private through Row Level Security.
- Users sign in with Google through Supabase Auth.
- Only rows in `app_members` with `status = 'approved'` can read/write the shared calendar state.
- Admin users have `role = 'admin'`.
- The browser uses only the Supabase publishable/anon key. This key is not a password; RLS policies protect the data.
- Never put Google client secrets, service-role keys, or private API keys into `src/`.

## Frontend Config

Edit:

```text
src/supabase-config.js
```

Set:

```js
export const SUPABASE_CONFIG = {
  enabled: true,
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
  appStateId: "main",
};
```

## Auth Redirect URLs

In Supabase Auth settings, add:

```text
https://artemtraino-code.github.io/garden-calendar-app/
http://localhost:5199/
```

Google provider must be enabled in Supabase Auth.

## Database SQL

Run this in Supabase SQL Editor.

Replace `admin@example.com` with the admin Google email.

```sql
create table if not exists public.app_members (
  email text primary key,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garden_app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_members enable row level security;
alter table public.garden_app_state enable row level security;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_approved_member()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_members
    where email = public.current_user_email()
      and status = 'approved'
  );
$$;

create or replace function public.is_admin_member()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_members
    where email = public.current_user_email()
      and status = 'approved'
      and role = 'admin'
  );
$$;

drop policy if exists "Approved members can read members" on public.app_members;
create policy "Approved members can read members"
  on public.app_members
  for select
  using (public.is_approved_member());

drop policy if exists "Admins can manage members" on public.app_members;
create policy "Admins can manage members"
  on public.app_members
  for all
  using (public.is_admin_member())
  with check (public.is_admin_member());

drop policy if exists "Approved members can read app state" on public.garden_app_state;
create policy "Approved members can read app state"
  on public.garden_app_state
  for select
  using (public.is_approved_member());

drop policy if exists "Approved members can update app state" on public.garden_app_state;
create policy "Approved members can update app state"
  on public.garden_app_state
  for insert
  with check (public.is_approved_member());

drop policy if exists "Approved members can change app state" on public.garden_app_state;
create policy "Approved members can change app state"
  on public.garden_app_state
  for update
  using (public.is_approved_member())
  with check (public.is_approved_member());

insert into public.app_members (email, role, status)
values ('admin@example.com', 'admin', 'approved')
on conflict (email) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.garden_app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
```

## Approving A User

After a new person signs in with Google, add or approve the email:

```sql
insert into public.app_members (email, role, status)
values ('second-user@example.com', 'member', 'approved')
on conflict (email) do update
set status = 'approved',
    updated_at = now();
```

Later the app can get an admin UI for this instead of manual SQL.
