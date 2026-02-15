-- 1) tables exist
select tablename from pg_tables where schemaname='public' and tablename in ('projects');

-- 2) RLS flags
select relname, relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and relname in ('projects');

-- 3) policies
select tablename, policyname from pg_policies
where schemaname='public' and tablename='projects'
order by policyname;

-- 4) triggers
select tgname, relname
from pg_trigger t join pg_class c on c.oid=t.tgrelid
where not t.tgisinternal and tgname in ('trg_projects_updated_at');
