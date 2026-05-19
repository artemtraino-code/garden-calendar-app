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

grant usage on schema public to authenticated;
grant select on public.app_members to authenticated;
grant select, insert, update on public.garden_app_state to authenticated;
grant execute on function public.current_user_email() to authenticated;
grant execute on function public.is_approved_member() to authenticated;
grant execute on function public.is_admin_member() to authenticated;

insert into public.app_members (email, role, status)
values ('artemtraino@gmail.com', 'admin', 'approved')
on conflict (email) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();
