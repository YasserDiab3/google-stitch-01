alter table if exists public.permits_to_work
  add column if not exists description text,
  add column if not exists contractor_name text,
  add column if not exists current_step text not null default 'area_manager',
  add column if not exists area_manager_status text not null default 'pending',
  add column if not exists quality_status text not null default 'pending',
  add column if not exists safety_status text not null default 'pending',
  add column if not exists permit_approver_status text not null default 'pending',
  add column if not exists rejection_reason text,
  add column if not exists opened_at timestamptz,
  add column if not exists opened_by uuid references public.profiles(id),
  add column if not exists final_approved_at timestamptz,
  add column if not exists exported_at timestamptz;

alter table if exists public.permits_to_work
  alter column status set default 'submitted';

update public.permits_to_work
set
  status = case
    when status = 'draft' then 'submitted'
    when status = 'active' then 'approved'
    else status
  end,
  current_step = case
    when status in ('approved', 'closed') then 'completed'
    else coalesce(current_step, 'area_manager')
  end;

create table if not exists public.permit_notifications (
  id uuid primary key default gen_random_uuid(),
  permit_id uuid not null references public.permits_to_work(id) on delete cascade,
  event_type text not null,
  recipient_role text not null,
  message text not null,
  created_by uuid references public.profiles(id),
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.permit_notifications enable row level security;
