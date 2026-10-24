-- Compatibility checkpoint for the parallel health-backend branch.
-- These tables and their stricter RLS/grants are created by
-- 20261024091605_connected_health_records_realtime.sql.
-- Do not recreate them or replace their policies with the parallel definitions.
do $$
begin
  if to_regclass('public.growth_measurements') is null
    or to_regclass('public.vaccination_records') is null
    or to_regclass('public.clinic_appointments') is null
    or to_regclass('public.nutrition_messages') is null then
    raise exception 'Apply the connected health records migration first';
  end if;
end;
$$;
