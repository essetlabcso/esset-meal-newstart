-- Gate 2 Verification: Check tables, RLS, policies, triggers
-- Run against: supabase db push target (remote)

-- 1) Check tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','organizations','org_memberships')
order by table_name;

-- 2) Check RLS enabled
select relname, relrowsecurity
from pg_class
join pg_namespace n on n.oid = pg_class.relnamespace
where n.nspname = 'public'
  and relname in ('profiles','organizations','org_memberships');

-- 3) Check policies exist
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','organizations','org_memberships')
order by tablename, policyname;

-- 4) Check triggers exist
select tgname, relname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and tgname in ('on_auth_user_created','on_org_created_add_owner','trg_profiles_updated_at');
