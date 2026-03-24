create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  job_title text,
  department text,
  role text not null default 'viewer',
  locale text not null default 'ar',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.risk_registry (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  severity int,
  likelihood int,
  status text not null default 'open',
  owner_id uuid references public.profiles(id),
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permits_to_work (
  id uuid primary key default gen_random_uuid(),
  permit_no text not null unique,
  work_type text not null,
  area text,
  requested_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  status text not null default 'draft',
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employees_contractors (
  id uuid primary key default gen_random_uuid(),
  employee_no text,
  full_name text not null,
  employer_type text not null,
  department text,
  compliance_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chemical_inventory (
  id uuid primary key default gen_random_uuid(),
  chemical_name text not null,
  sds_url text,
  location text,
  quantity numeric,
  hazard_class text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees_contractors(id) on delete cascade,
  course_name text not null,
  completion_date date,
  expiry_date date,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  incident_no text unique,
  title text not null,
  incident_date timestamptz,
  severity text,
  location text,
  root_cause text,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clinic_records (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  visit_date timestamptz not null default timezone('utc', now()),
  case_type text,
  diagnosis text,
  treatment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_ehs_reports (
  id uuid primary key default gen_random_uuid(),
  report_month date not null,
  total_incidents int not null default 0,
  total_trainings int not null default 0,
  open_risks int not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists risk_registry_set_updated_at on public.risk_registry;
create trigger risk_registry_set_updated_at before update on public.risk_registry
for each row execute function public.set_updated_at();

drop trigger if exists permits_to_work_set_updated_at on public.permits_to_work;
create trigger permits_to_work_set_updated_at before update on public.permits_to_work
for each row execute function public.set_updated_at();

drop trigger if exists employees_contractors_set_updated_at on public.employees_contractors;
create trigger employees_contractors_set_updated_at before update on public.employees_contractors
for each row execute function public.set_updated_at();

drop trigger if exists chemical_inventory_set_updated_at on public.chemical_inventory;
create trigger chemical_inventory_set_updated_at before update on public.chemical_inventory
for each row execute function public.set_updated_at();

drop trigger if exists training_records_set_updated_at on public.training_records;
create trigger training_records_set_updated_at before update on public.training_records
for each row execute function public.set_updated_at();

drop trigger if exists incident_reports_set_updated_at on public.incident_reports;
create trigger incident_reports_set_updated_at before update on public.incident_reports
for each row execute function public.set_updated_at();

drop trigger if exists clinic_records_set_updated_at on public.clinic_records;
create trigger clinic_records_set_updated_at before update on public.clinic_records
for each row execute function public.set_updated_at();

drop trigger if exists monthly_ehs_reports_set_updated_at on public.monthly_ehs_reports;
create trigger monthly_ehs_reports_set_updated_at before update on public.monthly_ehs_reports
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.risk_registry enable row level security;
alter table public.permits_to_work enable row level security;
alter table public.employees_contractors enable row level security;
alter table public.chemical_inventory enable row level security;
alter table public.training_records enable row level security;
alter table public.incident_reports enable row level security;
alter table public.clinic_records enable row level security;
alter table public.monthly_ehs_reports enable row level security;
