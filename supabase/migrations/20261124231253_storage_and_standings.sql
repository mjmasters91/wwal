-- Screenshot proof. The bucket is private. Confirmed scoreboards are readable
-- with the anon key; pending proof is limited to the two rosters and stewards.
-- Upsert needs select + insert + update, so all three policies exist.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'match-proof',
  'match-proof',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy match_proof_read_confirmed
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'match-proof'
    and exists (
      select 1
      from public.score_reports sr
      where sr.screenshot_path = name
        and sr.status = 'confirmed'
    )
  );

create policy match_proof_read_parties
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'match-proof'
    and (
      private.is_admin()
      or private.is_match_participant(private.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy match_proof_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'match-proof'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (
      private.is_admin()
      or private.is_match_staff(private.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy match_proof_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'match-proof'
    and (
      private.is_admin()
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
  with check (
    bucket_id = 'match-proof'
    and (
      private.is_admin()
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );

create policy match_proof_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'match-proof' and private.is_admin());

-- Mirrors the standings math in src/standings.ts. security_invoker keeps the
-- caller's RLS in force instead of the view owner's.
create view public.standings
with (security_invoker = true) as
with played as (
  select
    m.division_id,
    side.team_id,
    case when m.winner_team_id = side.team_id then 1 else 0 end as win,
    case
      when m.winner_team_id is not null and m.winner_team_id <> side.team_id then 1
      else 0
    end as loss,
    case
      when side.is_home then coalesce(m.home_rounds, 0)
      else coalesce(m.away_rounds, 0)
    end as rounds_for,
    case
      when side.is_home then coalesce(m.away_rounds, 0)
      else coalesce(m.home_rounds, 0)
    end as rounds_against
  from public.matches m
  join lateral (
    select m.home_team_id as team_id, true as is_home
    union all
    select m.away_team_id, false
  ) side on side.team_id is not null
  where m.stage = 'regular'
    and m.status in ('completed', 'forfeit')
),
agg as (
  select
    division_id,
    team_id,
    sum(win)::integer as wins,
    sum(loss)::integer as losses,
    sum(rounds_for)::integer as rounds_for,
    sum(rounds_against)::integer as rounds_against
  from played
  group by division_id, team_id
),
forfeits as (
  select m.division_id, fe.team_id, count(*)::integer as forfeits
  from public.forfeit_events fe
  join public.matches m on m.id = fe.match_id
  group by m.division_id, fe.team_id
),
joined as (
  select
    r.season_id,
    r.division_id,
    r.team_id,
    tm.name as team_name,
    tm.tag as team_tag,
    coalesce(a.wins, 0) as wins,
    coalesce(a.losses, 0) as losses,
    coalesce(a.rounds_for, 0) as rounds_for,
    coalesce(a.rounds_against, 0) as rounds_against,
    coalesce(a.rounds_for, 0) - coalesce(a.rounds_against, 0) as round_diff,
    coalesce(f.forfeits, 0) as forfeits,
    coalesce(f.forfeits, 0) >= 3 as inactive
  from public.registrations r
  join public.teams tm on tm.id = r.team_id
  left join agg a
    on a.division_id = r.division_id
   and a.team_id = r.team_id
  left join forfeits f
    on f.division_id = r.division_id
   and f.team_id = r.team_id
  where r.status = 'approved'
)
select
  j.season_id,
  j.division_id,
  j.team_id,
  j.team_name,
  j.team_tag,
  j.wins,
  j.losses,
  j.rounds_for,
  j.rounds_against,
  j.round_diff,
  j.forfeits,
  j.inactive,
  case
    when j.inactive then null
    else rank() over (
      partition by j.division_id
      order by j.inactive asc, j.wins desc, j.round_diff desc, j.rounds_for desc, j.team_name asc
    )
  end as place
from joined j;

grant select on public.standings to anon, authenticated, service_role;
