-- Connected records. No sample people or clinical reference data are seeded.
begin;

create table public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  measured_on date not null check (isfinite(measured_on)),
  weight_kg numeric check (weight_kg > 0 and weight_kg < 'Infinity'::numeric),
  length_height_cm numeric check (length_height_cm > 0 and length_height_cm < 'Infinity'::numeric),
  head_circumference_cm numeric check (head_circumference_cm > 0 and head_circumference_cm < 'Infinity'::numeric),
  source text not null default 'parent_reported' check (source = 'parent_reported'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(weight_kg, length_height_cm, head_circumference_cm) > 0)
);
create table public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  vaccine_code text not null check (length(btrim(vaccine_code)) between 1 and 120),
  administered_on date not null check (isfinite(administered_on)),
  source text not null default 'parent_reported' check (source = 'parent_reported'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, vaccine_code)
);
create table public.clinic_appointments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  scheduled_at timestamptz not null check (isfinite(scheduled_at)),
  clinic_name text not null check (length(btrim(clinic_name)) between 1 and 200),
  purpose text check (length(purpose) <= 2000),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.nutrition_messages (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  sender text not null default 'user' check (sender in ('user','assistant')),
  body text not null check (length(btrim(body)) between 1 and 8000),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reference content is curated by a trusted administrator, not generated from
-- sample values or editable by caregivers. Empty tables mean unavailable.
create table public.vaccination_schedule (
  id uuid primary key default gen_random_uuid(),
  vaccine_code text not null,
  vaccine_name text not null,
  age_months integer not null check (age_months between 0 and 240),
  schedule_version text not null,
  source_url text not null check (source_url like 'https://%'),
  active boolean not null default false,
  unique (schedule_version, vaccine_code)
);
create unique index vaccination_schedule_active_code on public.vaccination_schedule(vaccine_code) where active;
create table public.growth_references (
  id uuid primary key default gen_random_uuid(),
  sex text not null check (sex in ('male','female')),
  age_months integer not null check (age_months between 0 and 240),
  sd_minus2_kg numeric not null,
  sd_minus1_kg numeric not null,
  median_kg numeric not null,
  sd_plus1_kg numeric not null,
  sd_plus2_kg numeric not null,
  source_url text not null check (source_url like 'https://%'),
  source_version text not null,
  active boolean not null default false,
  check (0 < sd_minus2_kg and sd_minus2_kg < sd_minus1_kg and sd_minus1_kg < median_kg
    and median_kg < sd_plus1_kg and sd_plus1_kg < sd_plus2_kg and sd_plus2_kg < 'Infinity'::numeric),
  unique (source_version, sex, age_months)
);
create unique index growth_references_active_age on public.growth_references(sex,age_months) where active;

create function private.validate_health_date() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare recorded_on date; born_on date;
begin
  recorded_on := case when tg_table_name = 'growth_measurements' then (to_jsonb(new)->>'measured_on')::date
    else (to_jsonb(new)->>'administered_on')::date end;
  select date_of_birth into born_on from public.children where id = new.child_id for share;
  if born_on is null or recorded_on < born_on or recorded_on > (now() at time zone 'Asia/Colombo')::date then
    raise exception 'Record date must be between birth and today' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function private.validate_health_date() from public,anon,authenticated;

create function private.validate_child_health_chronology() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.date_of_birth <> old.date_of_birth and (
    exists(select 1 from public.growth_measurements where child_id=new.id and measured_on<new.date_of_birth)
    or exists(select 1 from public.vaccination_records where child_id=new.id and administered_on<new.date_of_birth)
  ) then
    raise exception 'Birth date cannot be later than existing health records' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.validate_child_health_chronology() from public,anon,authenticated;
create trigger children_health_chronology before update of date_of_birth on public.children
for each row execute function private.validate_child_health_chronology();

do $$
declare t text;
begin
  foreach t in array array['growth_measurements','vaccination_records','clinic_appointments','nutrition_messages'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('create index %I on public.%I(child_id,created_at,id)',t||'_child_created_idx',t);
    execute format('create index %I on public.%I(created_by)',t||'_creator_idx',t);
    execute format('create policy caregiver_read on public.%I for select to authenticated using (child_id in (select child_id from public.child_caregivers where user_id=(select auth.uid())))',t);
    execute format('create policy caregiver_insert on public.%I for insert to authenticated with check (created_by=(select auth.uid()) and child_id in (select child_id from public.child_caregivers where user_id=(select auth.uid()) and access_level in (''owner'',''editor'')))',t);
    execute format('create policy caregiver_update on public.%I for update to authenticated using (child_id in (select child_id from public.child_caregivers where user_id=(select auth.uid()) and access_level in (''owner'',''editor''))) with check (child_id in (select child_id from public.child_caregivers where user_id=(select auth.uid()) and access_level in (''owner'',''editor'')))',t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t);
  end loop;
  foreach t in array array['growth_measurements','vaccination_records'] loop
    execute format('create trigger validate_health_date before insert or update on public.%I for each row execute function private.validate_health_date()',t);
  end loop;
  foreach t in array array['vaccination_schedule','growth_references'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('create policy active_reference_read on public.%I for select to authenticated using (active)',t);
  end loop;
end $$;
grant insert (child_id,measured_on,weight_kg,length_height_cm,head_circumference_cm) on public.growth_measurements to authenticated;
grant update (measured_on,weight_kg,length_height_cm,head_circumference_cm) on public.growth_measurements to authenticated;
grant insert (child_id,vaccine_code,administered_on) on public.vaccination_records to authenticated;
grant update (administered_on) on public.vaccination_records to authenticated;
grant insert (child_id,scheduled_at,clinic_name,purpose) on public.clinic_appointments to authenticated;
grant update (scheduled_at,clinic_name,purpose,status) on public.clinic_appointments to authenticated;
grant insert (child_id,body) on public.nutrition_messages to authenticated;
-- Assistant messages require a trusted server. No browser can impersonate one.
alter table public.todos enable row level security;
revoke all on public.todos from public,anon,authenticated;
grant select on public.todos to authenticated;
grant insert (title) on public.todos to authenticated;
grant update (title,completed) on public.todos to authenticated;
create index todos_user_created_idx on public.todos(user_id,created_at);
create policy own_todos_read on public.todos for select to authenticated using (user_id=(select auth.uid()));
create policy own_todos_insert on public.todos for insert to authenticated with check (user_id=(select auth.uid()));
create policy own_todos_update on public.todos for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create trigger touch_updated_at before update on public.todos for each row execute function private.touch_updated_at();

-- Apply on hosted Supabase; isolated SQL tests do not have a publication.
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['user_profiles','children','child_caregivers','growth_measurements','vaccination_records','clinic_appointments','nutrition_messages','todos','vaccination_schedule','growth_references'] loop
      if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end loop;
  end if;
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
  end if;
end $$;
commit;
