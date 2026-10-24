-- Health records for vaccination doses, growth measurements, and clinic appointments.
--
-- Depends on Member 3 (feature/backend-auth), which is not in this branch:
--   public.children(id uuid)
--   public.child_caregivers(child_id, user_id, access_level)
--   auth.uid()
-- Apply their phase 2 and phase 3 migrations first. This file does not edit them.
--
-- The vaccination schedule stays in the TypeScript engine
-- (getDemonstrationEpiSchedule). No schedule-version table is created.
-- The browser must use the publishable key. service_role bypasses RLS and
-- is not granted here.

begin;

create schema if not exists private;

create table public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete restrict,
  vaccine_code text not null,
  administered_on date not null,
  source text not null default 'parent_reported',
  verified_by text,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint vaccination_records_vaccine_code_nonblank
    check (pg_catalog.length(pg_catalog.btrim(vaccine_code)) > 0),
  constraint vaccination_records_administered_on_finite
    check (pg_catalog.isfinite(administered_on)),
  constraint vaccination_records_source_valid
    check (source in ('demo', 'parent_reported', 'health_worker_verified')),
  constraint vaccination_records_verified_by_nonblank
    check (verified_by is null or pg_catalog.length(pg_catalog.btrim(verified_by)) > 0),
  constraint vaccination_records_child_vaccine_unique unique (child_id, vaccine_code)
);

create table public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete restrict,
  measured_on date not null,
  weight_kg numeric,
  length_height_cm numeric,
  head_circumference_cm numeric,
  source text not null default 'parent_reported',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint growth_measurements_measured_on_finite
    check (pg_catalog.isfinite(measured_on)),
  constraint growth_measurements_weight_positive
    check (weight_kg is null or weight_kg > 0),
  constraint growth_measurements_length_positive
    check (length_height_cm is null or length_height_cm > 0),
  constraint growth_measurements_head_positive
    check (head_circumference_cm is null or head_circumference_cm > 0),
  constraint growth_measurements_one_quantity
    check (pg_catalog.num_nonnulls(weight_kg, length_height_cm, head_circumference_cm) >= 1),
  constraint growth_measurements_source_valid
    check (source in ('demo', 'parent_reported', 'health_worker_verified'))
);

create table public.clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete restrict,
  scheduled_at timestamptz not null,
  clinic_name text not null,
  purpose text,
  status text not null default 'scheduled',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint clinic_appointments_scheduled_at_finite
    check (pg_catalog.isfinite(scheduled_at)),
  constraint clinic_appointments_clinic_name_nonblank
    check (pg_catalog.length(pg_catalog.btrim(clinic_name)) > 0),
  constraint clinic_appointments_purpose_nonblank
    check (purpose is null or pg_catalog.length(pg_catalog.btrim(purpose)) > 0),
  constraint clinic_appointments_status_valid
    check (status in ('scheduled', 'completed', 'cancelled'))
);

create index growth_measurements_child_measured_on_idx
  on public.growth_measurements (child_id, measured_on);

create index clinic_appointments_child_scheduled_at_idx
  on public.clinic_appointments (child_id, scheduled_at);

alter table public.vaccination_records enable row level security;
alter table public.growth_measurements enable row level security;
alter table public.clinic_appointments enable row level security;

revoke all on table public.vaccination_records, public.growth_measurements, public.clinic_appointments
  from public, anon, authenticated;

grant select on public.vaccination_records, public.growth_measurements, public.clinic_appointments
  to authenticated;

grant insert (child_id, vaccine_code, administered_on)
  on public.vaccination_records to authenticated;
grant update (administered_on)
  on public.vaccination_records to authenticated;

grant insert (child_id, measured_on, weight_kg, length_height_cm, head_circumference_cm)
  on public.growth_measurements to authenticated;

grant insert (child_id, scheduled_at, clinic_name, purpose)
  on public.clinic_appointments to authenticated;
grant update (scheduled_at, clinic_name, purpose, status)
  on public.clinic_appointments to authenticated;

create function private.touch_health_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;

revoke all on function private.touch_health_updated_at()
  from public, anon, authenticated, service_role;

create function private.prepare_vaccination_record()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dob date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.source := 'parent_reported';
    new.verified_by := null;
  else
    new.child_id := old.child_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.vaccine_code := old.vaccine_code;
    new.source := old.source;
    new.verified_by := old.verified_by;
  end if;

  if new.administered_on > (pg_catalog.statement_timestamp() at time zone 'Asia/Colombo')::date then
    raise exception 'administered_on must not be in the future' using errcode = '23514';
  end if;

  select c.date_of_birth into v_dob
  from public.children c
  where c.id = new.child_id;

  if v_dob is null then
    raise exception 'child not found' using errcode = '23503';
  end if;

  if new.administered_on < v_dob then
    raise exception 'administered_on cannot be before the child date of birth'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_vaccination_record()
  from public, anon, authenticated, service_role;

create trigger vaccination_records_prepare
before insert or update on public.vaccination_records
for each row execute function private.prepare_vaccination_record();

create trigger vaccination_records_touch_updated_at
before update on public.vaccination_records
for each row execute function private.touch_health_updated_at();

create function private.prepare_growth_measurement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dob date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  new.created_by := auth.uid();
  new.source := 'parent_reported';

  if new.measured_on > (pg_catalog.statement_timestamp() at time zone 'Asia/Colombo')::date then
    raise exception 'measured_on must not be in the future' using errcode = '23514';
  end if;

  select c.date_of_birth into v_dob
  from public.children c
  where c.id = new.child_id;

  if v_dob is null then
    raise exception 'child not found' using errcode = '23503';
  end if;

  if new.measured_on < v_dob then
    raise exception 'measured_on cannot be before the child date of birth'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_growth_measurement()
  from public, anon, authenticated, service_role;

create trigger growth_measurements_prepare
before insert on public.growth_measurements
for each row execute function private.prepare_growth_measurement();

create function private.prepare_clinic_appointment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    if new.status is distinct from 'scheduled' then
      new.status := 'scheduled';
    end if;
  else
    new.child_id := old.child_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_clinic_appointment()
  from public, anon, authenticated, service_role;

create trigger clinic_appointments_prepare
before insert or update on public.clinic_appointments
for each row execute function private.prepare_clinic_appointment();

create trigger clinic_appointments_touch_updated_at
before update on public.clinic_appointments
for each row execute function private.touch_health_updated_at();

create policy vaccination_records_select on public.vaccination_records
for select to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = vaccination_records.child_id
      and cc.user_id = (select auth.uid())
  )
);

create policy vaccination_records_insert on public.vaccination_records
for insert to authenticated
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = vaccination_records.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

create policy vaccination_records_update on public.vaccination_records
for update to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = vaccination_records.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = vaccination_records.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

create policy growth_measurements_select on public.growth_measurements
for select to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = growth_measurements.child_id
      and cc.user_id = (select auth.uid())
  )
);

create policy growth_measurements_insert on public.growth_measurements
for insert to authenticated
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = growth_measurements.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

create policy clinic_appointments_select on public.clinic_appointments
for select to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = clinic_appointments.child_id
      and cc.user_id = (select auth.uid())
  )
);

create policy clinic_appointments_insert on public.clinic_appointments
for insert to authenticated
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = clinic_appointments.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

create policy clinic_appointments_update on public.clinic_appointments
for update to authenticated
using (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = clinic_appointments.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1 from public.child_caregivers cc
    where cc.child_id = clinic_appointments.child_id
      and cc.user_id = (select auth.uid())
      and cc.access_level in ('owner', 'editor')
  )
);

comment on table public.vaccination_records is
  'Caregiver-reported administered doses. source is forced to parent_reported for authenticated inserts. Schedule due dates are not stored.';
comment on table public.growth_measurements is
  'Append-only parent-reported measurements in kilograms and centimetres. No z-score is stored.';
comment on table public.clinic_appointments is
  'Clinic visit instants. scheduled_at is not an EPI due date. No reminder delivery flag.';

commit;
