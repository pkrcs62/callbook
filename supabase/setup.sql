-- Callbook database (already applied to your LoanTracker Supabase project; kept here for reference / new projects)
create table if not exists public.chasr_team(email text primary key, name text, role text not null default 'member', created_at timestamptz default now());
create table if not exists public.chasr_leads(
  id uuid primary key default gen_random_uuid(),
  name text not null, mobile text, company text,
  segment text not null default 'Misc' check (segment in ('Car Loan','Personal Loan','Pension Loan','Misc')),
  amount numeric, status text not null default 'open' check (status in ('open','converted','not_interested','not_eligible')),
  followup date, source text, note text, remarks jsonb not null default '[]'::jsonb,
  created_by text, created_at timestamptz default now(), updated_at timestamptz default now());
create index if not exists chasr_leads_status_followup on public.chasr_leads(status, followup);
create or replace function public.chasr_is_team() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from chasr_team where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $$;
alter table public.chasr_team enable row level security;
alter table public.chasr_leads enable row level security;
create policy team_read on public.chasr_team for select to authenticated using (chasr_is_team());
create policy team_admin on public.chasr_team for all to authenticated using (exists(select 1 from chasr_team t where lower(t.email)=lower(auth.jwt()->>'email') and t.role='admin')) with check (exists(select 1 from chasr_team t where lower(t.email)=lower(auth.jwt()->>'email') and t.role='admin'));
create policy leads_all on public.chasr_leads for all to authenticated using (chasr_is_team()) with check (chasr_is_team());
alter publication supabase_realtime add table public.chasr_leads;
-- first admin:  insert into public.chasr_team(email,name,role) values ('you@example.com','Your name','admin');
