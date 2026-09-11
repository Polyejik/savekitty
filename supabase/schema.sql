-- Save Pushok / Спаси Пушка
-- Minimal Supabase backend for free pilot campaigns.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id text primary key,
  sponsor_name text not null,
  title text not null,
  rate_rub numeric(10,2) not null default 10,
  budget_rub numeric(12,2) not null default 500000,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.game_runs (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null default gen_random_uuid() unique,
  campaign_id text not null references public.campaigns(id) on update cascade,
  player_id uuid not null,
  player_name text,
  language text not null default 'ru' check (language in ('ru','en')),
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  duration_seconds integer not null check (duration_seconds >= 0),
  locks_opened integer not null default 9 check (locks_opened between 0 and 9),
  examples_solved integer not null default 9 check (examples_solved between 0 and 9),
  game_version text not null default '1.0',
  client_fingerprint text,
  user_agent_hash text,
  status text not null default 'pending' check (status in ('pending','confirmed','duplicate','too_fast','rejected')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_runs_campaign_completed on public.game_runs(campaign_id, completed_at desc);
create index if not exists idx_runs_player_completed on public.game_runs(player_id, completed_at desc);
create index if not exists idx_runs_status on public.game_runs(status);

insert into public.campaigns(id,sponsor_name,title,rate_rub,budget_rub,starts_at,ends_at)
values ('save-pushok-pilot','Demo Sponsor','Спаси Пушка — пилот',10,500000,now(),now()+interval '30 days')
on conflict (id) do nothing;

-- Public aggregate only: never expose raw identifiers in sponsor dashboard.
create or replace view public.campaign_dashboard as
select
  c.id as campaign_id,
  count(*) filter (where r.status='confirmed')::bigint as confirmed_rescues,
  coalesce(count(*) filter (where r.status='confirmed') * c.rate_rub,0)::numeric as donation_rub,
  c.budget_rub,
  c.rate_rub,
  greatest(0,ceil(extract(epoch from (c.ends_at-now()))/86400))::int as days_left,
  count(distinct r.player_id) filter (where r.status='confirmed')::bigint as unique_players,
  count(*) filter (where r.status='confirmed' and r.completed_at::date=current_date)::bigint as today_runs,
  coalesce(round(avg(r.duration_seconds) filter (where r.status='confirmed')),0)::int as avg_seconds,
  case when count(distinct r.player_id) filter (where r.status='confirmed')=0 then 0 else
    round(100.0 * count(*) filter (where r.status='confirmed') / nullif(count(distinct r.player_id) filter (where r.status='confirmed'),0) - 100,1)
  end as repeat_rate,
  count(r.*)::bigint as raw_runs,
  count(*) filter (where r.status='duplicate')::bigint as duplicates,
  count(*) filter (where r.status='too_fast')::bigint as too_fast
from public.campaigns c
left join public.game_runs r on r.campaign_id=c.id
group by c.id,c.rate_rub,c.budget_rub,c.ends_at;

create or replace view public.campaign_daily as
select
  campaign_id,
  completed_at::date as day,
  count(*) filter (where status='confirmed')::bigint as confirmed_rescues
from public.game_runs
group by campaign_id,completed_at::date
order by day;

-- Public-safe latest runs. Name is intentionally masked.
create or replace view public.confirmed_runs_public as
select
  id,
  campaign_id,
  completed_at,
  case
    when coalesce(player_name,'')='' then 'Игрок'
    when length(player_name)=1 then left(player_name,1)||'***'
    else left(player_name,1)||repeat('*',least(6,greatest(1,length(player_name)-1)))
  end as player_name,
  duration_seconds,
  game_version,
  status
from public.game_runs
where status='confirmed';

-- Lightweight server-side validation.
create or replace function public.validate_game_run()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_count integer;
begin
  if new.locks_opened <> 9 or new.examples_solved <> 9 then
    new.status := 'rejected';
    new.reason := 'incomplete_game';
    return new;
  end if;

  if new.duration_seconds < 45 then
    new.status := 'too_fast';
    new.reason := 'duration_below_45s';
    return new;
  end if;

  select count(*) into recent_count
  from public.game_runs
  where campaign_id=new.campaign_id
    and player_id=new.player_id
    and status='confirmed'
    and completed_at > now()-interval '24 hours';

  if recent_count >= 3 then
    new.status := 'duplicate';
    new.reason := 'daily_limit';
    return new;
  end if;

  new.status := 'confirmed';
  new.reason := null;
  return new;
end;
$$;

drop trigger if exists trg_validate_game_run on public.game_runs;
create trigger trg_validate_game_run
before insert on public.game_runs
for each row execute function public.validate_game_run();

alter table public.campaigns enable row level security;
alter table public.game_runs enable row level security;

-- Anonymous game client may only insert; it cannot read raw runs.
drop policy if exists "anon_insert_game_runs" on public.game_runs;
create policy "anon_insert_game_runs"
on public.game_runs
for insert
to anon
with check (
  campaign_id is not null
  and player_id is not null
  and locks_opened=9
  and examples_solved=9
);

-- No select policy on raw game_runs for anon.

-- Views use invoker privileges in modern Postgres/Supabase when security_invoker is enabled.
alter view public.campaign_dashboard set (security_invoker = true);
alter view public.campaign_daily set (security_invoker = true);
alter view public.confirmed_runs_public set (security_invoker = true);

grant select on public.campaign_dashboard to anon, authenticated;
grant select on public.campaign_daily to anon, authenticated;
grant select on public.confirmed_runs_public to anon, authenticated;
grant insert on public.game_runs to anon, authenticated;

-- Dashboard should only read the safe views above. For production sponsor login,
-- replace anon grants on views with authenticated-only grants after Auth is enabled.
