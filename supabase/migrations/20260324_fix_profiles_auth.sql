alter table if exists public.profiles
  add column if not exists email text unique,
  add column if not exists phone text,
  add column if not exists job_title text,
  add column if not exists department text,
  add column if not exists locale text not null default 'ar',
  add column if not exists is_active boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role, locale, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'executive',
    'ar',
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    locale = public.profiles.locale,
    is_active = public.profiles.is_active;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
