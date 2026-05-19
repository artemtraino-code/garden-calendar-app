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

grant usage on schema public to authenticated;
grant select on public.app_members to authenticated;
grant select, insert, update on public.garden_app_state to authenticated;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(coalesce(
    (select email from auth.users where id = auth.uid()),
    auth.jwt() ->> 'email',
    ''
  ));
$$;

create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth
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
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.app_members
    where email = public.current_user_email()
      and status = 'approved'
      and role = 'admin'
  );
$$;

grant execute on function public.current_user_email() to authenticated;
grant execute on function public.is_approved_member() to authenticated;
grant execute on function public.is_admin_member() to authenticated;

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
values ('artemtraino@gmail.com', 'admin', 'approved')
on conflict (email) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.garden_app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
