-- SuwaDaru presentation data. All names, clinics and health records are fictional.
-- Checked against the hosted public schema on 2026-10-24.
-- Target account: mchithna@gmail.com (existing, confirmed Auth user).
-- Run this ENTIRE file in Supabase SQL Editor as postgres.
-- This seeds application data; it does not create/change login credentials.
-- Existing records are preserved. Re-running with the same emails adds no duplicates.
-- Shared clinical reference tables are intentionally untouched.

begin;
set local timezone = 'Asia/Colombo';

create temporary table presentation_accounts (
  account_no integer primary key,
  email text unique not null,
  display_name text not null,
  user_id uuid unique
) on commit drop;

insert into presentation_accounts (account_no, email, display_name) values
  (2, 'mchithna@gmail.com', 'Demo Parent - Nimal');

do $$
declare a record;
begin
  for a in select * from presentation_accounts loop
    if (select count(*) from auth.users u where lower(u.email) = lower(a.email)) <> 1 then
      raise exception 'Create exactly one Auth user for % first, or correct the email in this script.', a.email;
    end if;
    if not exists (select 1 from auth.users u where lower(u.email) = lower(a.email)
                   and u.email_confirmed_at is not null) then
      raise exception 'Confirm the Auth user % before preparing the presentation.', a.email;
    end if;
  end loop;
end $$;

update presentation_accounts a set user_id = u.id
from auth.users u where lower(u.email) = lower(a.email);

-- Preserve existing profile names; add a profile only if one is missing.
insert into public.user_profiles (id, full_name)
select user_id, display_name from presentation_accounts
on conflict (id) do nothing;

create temporary table presentation_children on commit drop as
select a.user_id,
       md5('suwadaru-presentation-v1:child:' || a.user_id::text || ':' || c.child_no)::uuid as child_id,
       c.child_no, c.name, c.sex, c.age_months, c.birth_weight_kg, c.clinic_name
from presentation_accounts a
join (values
  (2, 1, 'Demo - Dinuka',  'male',   18, 3.3::numeric, 'Demo Kandy Family Clinic'),
  (2, 2, 'Demo - Tharushi','female',  9, 2.9::numeric, 'Demo Kandy Family Clinic')
) as c(account_no, child_no, name, sex, age_months, birth_weight_kg, clinic_name)
on c.account_no = a.account_no;

insert into public.children
  (id, name, date_of_birth, sex, birth_weight_kg, created_by, clinic_name)
select child_id, name, (current_date - make_interval(months => age_months))::date,
       sex, birth_weight_kg, user_id, clinic_name
from presentation_children
on conflict (id) do nothing;

insert into public.child_caregivers (child_id, user_id, relationship, access_level)
select child_id, user_id, 'parent', 'owner' from presentation_children
on conflict (child_id, user_id) do nothing;

-- Six fictional measurements per child, spread from birth to their seeded age.
-- Use the saved DOB on repeat runs, so existing timelines do not drift.
insert into public.growth_measurements
  (id, child_id, measured_on, weight_kg, length_height_cm,
   head_circumference_cm, source, created_by)
select md5('suwadaru-presentation-v1:growth:' || p.child_id::text || ':' || n)::uuid,
       p.child_id,
       (c.date_of_birth + make_interval(months => (p.age_months * n / 5)))::date,
       round(p.birth_weight_kg + (p.age_months * n / 5)::numeric * 0.38, 2),
       round(49.5 + (p.age_months * n / 5)::numeric * 1.25, 1),
       round(34.0 + (p.age_months * n / 5)::numeric * 0.45, 1),
       'parent_reported', p.user_id
from presentation_children p join public.children c on c.id = p.child_id
cross join generate_series(0, 5) as s(n)
on conflict (id) do nothing;

-- DEMO codes are fictional record examples, NOT an official immunization schedule.
insert into public.vaccination_records
  (id, child_id, vaccine_code, administered_on, source, created_by)
select md5('suwadaru-presentation-v1:vaccine:' || p.child_id::text || ':' || v.n)::uuid,
       p.child_id, v.code, (c.date_of_birth + make_interval(months => v.months))::date,
       'parent_reported', p.user_id
from presentation_children p join public.children c on c.id = p.child_id
cross join (values (1, 'DEMO-DOSE-1', 0), (2, 'DEMO-DOSE-2', 2),
                   (3, 'DEMO-DOSE-3', 4)) as v(n, code, months)
on conflict (child_id, vaccine_code) do nothing;

-- A completed visit, an upcoming visit, and a cancelled visit for each child.
insert into public.clinic_appointments
  (id, child_id, scheduled_at, clinic_name, purpose, status, created_by)
select md5('suwadaru-presentation-v1:appointment:' || p.child_id::text || ':' || v.n)::uuid,
       p.child_id, ((current_date + v.days) + time '09:30') at time zone 'Asia/Colombo',
       p.clinic_name, v.purpose, v.status, p.user_id
from presentation_children p
cross join (values
  (1, -14, 'DEMO: completed growth recording visit', 'completed'),
  (2,   7, 'DEMO: upcoming routine clinic visit', 'scheduled'),
  (3,  -7, 'DEMO: cancelled visit; replacement appointment booked', 'cancelled')
) as v(n, days, purpose, status)
on conflict (id) do nothing;

-- Prepared conversation examples, explicitly labelled; not real AI/clinical advice.
insert into public.nutrition_messages
  (id, child_id, sender, body, created_by, created_at)
select md5('suwadaru-presentation-v1:message:' || p.child_id::text || ':' || v.n)::uuid,
       p.child_id, v.sender, v.body, p.user_id,
       now() - interval '2 days' + v.n * interval '1 minute'
from presentation_children p
cross join (values
  (1, 'user', 'DEMO: I want to record our feeding questions before the next clinic visit.'),
  (2, 'assistant', 'DEMO scripted response: You can use this conversation to organize questions for your healthcare professional.'),
  (3, 'user', 'DEMO: Please include a reminder to discuss our meal diary at the visit.'),
  (4, 'assistant', 'DEMO scripted response: Meal diary discussion is shown here as a presentation example; no reminder has been sent.')
) as v(n, sender, body)
on conflict (id) do nothing;

insert into public.todos (id, user_id, title, completed)
select md5('suwadaru-presentation-v1:todo:' || a.user_id::text || ':' || v.n)::uuid,
       a.user_id, v.title, v.completed
from presentation_accounts a
cross join (values
  (1, 'DEMO: Pack the child health record for the clinic', false),
  (2, 'DEMO: Prepare questions about the meal diary', false),
  (3, 'DEMO: Record the latest growth measurements', true)
) as v(n, title, completed)
on conflict (id) do nothing;

-- Expected per account: 2 children, 12 measurements, 6 doses,
-- 6 appointments, 8 messages and 3 demo tasks.
select a.email,
  (select count(*) from presentation_children p where p.user_id = a.user_id) as demo_children,
  (select count(*) from public.growth_measurements g join presentation_children p
     on p.child_id = g.child_id where p.user_id = a.user_id) as growth_records,
  (select count(*) from public.vaccination_records v join presentation_children p
     on p.child_id = v.child_id where p.user_id = a.user_id) as vaccinations,
  (select count(*) from public.clinic_appointments v join presentation_children p
     on p.child_id = v.child_id where p.user_id = a.user_id) as appointments,
  (select count(*) from public.nutrition_messages v join presentation_children p
     on p.child_id = v.child_id where p.user_id = a.user_id) as nutrition_messages,
  (select count(*) from public.todos t where t.user_id = a.user_id and t.id in
     (select md5('suwadaru-presentation-v1:todo:' || a.user_id::text || ':' || n)::uuid
        from generate_series(1,3) as s(n))) as demo_tasks
from presentation_accounts a order by a.account_no;

commit;
