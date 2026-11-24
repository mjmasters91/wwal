-- Security definer helpers live in the private schema, which is not exposed
-- through the Data API. Policies in the next migration call these. Admin
-- authority is profiles.is_admin, read here, never a client-supplied claim.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.is_admin
      from public.profiles p
      where p.id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function private.is_banned(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bans b
    where b.profile_id = uid
      and b.lifted_at is null
      and (b.ends_at is null or b.ends_at > pg_catalog.now())
  );
$$;

create or replace function private.team_role(team uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select tm.role
  from public.team_members tm
  where tm.team_id = team
    and tm.profile_id = (select auth.uid());
$$;

create or replace function private.is_team_staff(team uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.team_role(team) in ('captain', 'officer');
$$;

create or replace function private.is_on_team(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members tm where tm.profile_id = uid
  );
$$;

create or replace function private.is_match_staff(match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.team_members tm
      on tm.team_id in (m.home_team_id, m.away_team_id)
    where m.id = match_id
      and tm.profile_id = (select auth.uid())
      and tm.role in ('captain', 'officer')
  );
$$;

create or replace function private.is_match_participant(match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.team_members tm
      on tm.team_id in (m.home_team_id, m.away_team_id)
    where m.id = match_id
      and tm.profile_id = (select auth.uid())
  );
$$;

create or replace function private.is_opposing_staff(match_id uuid, proposer_team uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.team_members tm
      on tm.profile_id = (select auth.uid())
     and tm.role in ('captain', 'officer')
     and tm.team_id in (m.home_team_id, m.away_team_id)
     and tm.team_id is distinct from proposer_team
    where m.id = match_id
  );
$$;

create or replace function private.valid_map_score(home integer, away integer)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  hi integer;
  lo integer;
begin
  if home is null or away is null then
    return false;
  end if;
  if home < 0 or away < 0 or home > 99 or away > 99 or home = away then
    return false;
  end if;
  hi := greatest(home, away);
  lo := least(home, away);
  if hi = 13 and lo <= 11 then
    return true;
  end if;
  if hi > 13 and lo >= 12 and hi - lo >= 2 then
    return true;
  end if;
  return false;
end;
$$;

create or replace function private.safe_uuid(raw text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return raw::uuid;
exception when others then
  return null;
end;
$$;

-- Dashboard and seed sessions have no JWT. Data API sessions do.
create or replace function private.request_role()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.role();
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desired text;
  base text;
  final_name text;
  n integer := 0;
begin
  -- Username is a label. is_admin stays false no matter what the metadata says.
  desired := nullif(pg_catalog.btrim(new.raw_user_meta_data->>'username'), '');
  if desired is null then
    desired := split_part(coalesce(new.email, 'player'), '@', 1);
  end if;
  base := regexp_replace(desired, '[^a-zA-Z0-9_]', '', 'g');
  if char_length(base) < 3 then
    base := 'player';
  end if;
  base := left(base, 16);
  final_name := base;
  while exists (
    select 1 from public.profiles p where lower(p.username) = lower(final_name)
  ) loop
    n := n + 1;
    final_name := left(base, 14) || n::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_name,
    coalesce(nullif(pg_catalog.btrim(new.raw_user_meta_data->>'display_name'), ''), final_name)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- SQL editor and migrations have no request role, so the owner can be flagged.
  if private.request_role() is null or private.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_admin := false;
    return new;
  end if;
  new.is_admin := old.is_admin;
  return new;
end;
$$;

create trigger profiles_protect
  before insert or update on public.profiles
  for each row execute function private.protect_profile();

create or replace function private.after_team_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_members (team_id, profile_id, role)
  values (new.id, new.created_by, 'captain');
  return new;
end;
$$;

create trigger teams_add_captain
  after insert on public.teams
  for each row execute function private.after_team_insert();

create or replace function private.before_member_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.team_id is distinct from old.team_id or new.profile_id is distinct from old.profile_id then
    raise exception 'Roster rows cannot be retargeted';
  end if;
  if new.role = 'captain' and old.role is distinct from 'captain' then
    perform set_config('wwal.internal', 'on', true);
    update public.team_members
      set role = 'officer'
      where team_id = new.team_id
        and role = 'captain'
        and profile_id <> new.profile_id;
  end if;
  if old.role = 'captain' and new.role <> 'captain' then
    if current_setting('wwal.internal', true) = 'on' then
      return new;
    end if;
    if not exists (
      select 1
      from public.team_members tm
      where tm.team_id = new.team_id
        and tm.role = 'captain'
        and tm.profile_id <> old.profile_id
    ) then
      raise exception 'Name another captain first';
    end if;
  end if;
  return new;
end;
$$;

create trigger team_members_guard
  before update on public.team_members
  for each row execute function private.before_member_update();

create or replace function private.before_member_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'captain' and private.request_role() is not null and not private.is_admin() then
    raise exception 'A captain cannot walk off. Name another captain or ask a steward to disband the coven.';
  end if;
  return old;
end;
$$;

create trigger team_members_delete_guard
  before delete on public.team_members
  for each row execute function private.before_member_delete();

create or replace function private.after_invite_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from 'pending' then
    return new;
  end if;
  if private.request_role() is not null and not private.is_admin() then
    if new.status in ('accepted', 'declined') and (select auth.uid()) is distinct from new.invitee_id then
      raise exception 'Only the invited player can answer this';
    end if;
    if new.status = 'revoked' and not private.is_team_staff(new.team_id) then
      raise exception 'Only coven staff can revoke an invite';
    end if;
  end if;
  new.responded_at := coalesce(new.responded_at, pg_catalog.now());
  if new.status = 'accepted' then
    if private.is_banned(new.invitee_id) then
      raise exception 'Suspended players cannot join a coven';
    end if;
    if exists (select 1 from public.team_members tm where tm.profile_id = new.invitee_id) then
      raise exception 'This player is already on a coven';
    end if;
    insert into public.team_members (team_id, profile_id, role)
    values (new.team_id, new.invitee_id, 'player');
    update public.team_invites
      set status = 'declined', responded_at = pg_catalog.now()
      where invitee_id = new.invitee_id
        and status = 'pending'
        and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger team_invites_answer
  before update on public.team_invites
  for each row execute function private.after_invite_update();

create or replace function private.before_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select d.season_id from public.divisions d where d.id = new.division_id) is distinct from new.season_id then
    raise exception 'That division is not part of this season';
  end if;
  if private.request_role() is not null and not private.is_admin() and new.status is distinct from 'pending' then
    raise exception 'Registrations start as pending';
  end if;
  return new;
end;
$$;

create trigger registrations_guard
  before insert on public.registrations
  for each row execute function private.before_registration_insert();

create or replace function private.guard_match_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('wwal.internal', true) = 'on'
     or private.request_role() is null
     or private.is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - 'server_info' - 'updated_at')
     = (to_jsonb(old) - 'server_info' - 'updated_at') then
    if not private.is_match_staff(old.id) then
      raise exception 'Only a captain or officer on this match can edit server info';
    end if;
    return new;
  end if;
  raise exception 'Match fields are locked';
end;
$$;

create trigger matches_guard_update
  before update on public.matches
  for each row execute function private.guard_match_update();

create or replace function private.after_match_advance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.advances_to is null or new.winner_team_id is null then
    return new;
  end if;
  if new.status not in ('completed', 'forfeit') then
    return new;
  end if;
  if old.winner_team_id is not distinct from new.winner_team_id
     and old.status is not distinct from new.status then
    return new;
  end if;
  perform set_config('wwal.internal', 'on', true);
  if new.advances_as = 'home' then
    update public.matches
      set home_team_id = new.winner_team_id
      where id = new.advances_to;
  else
    update public.matches
      set away_team_id = new.winner_team_id
      where id = new.advances_to;
  end if;
  return new;
end;
$$;

create trigger matches_advance_winner
  after update on public.matches
  for each row execute function private.after_match_advance();

create or replace function private.before_map_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
  bans integer;
  expected_team uuid;
  pool text[] := array['Ancient', 'Anubis', 'Cache', 'Dust II', 'Inferno', 'Mirage', 'Nuke'];
begin
  select * into m from public.matches where id = new.match_id;
  if not found then
    raise exception 'Match not found';
  end if;
  select count(*) into bans
  from public.map_actions
  where match_id = new.match_id and action = 'ban';

  if private.request_role() is not null then
    if private.is_banned((select auth.uid())) then
      raise exception 'Suspended players cannot do that';
    end if;
    if not private.is_admin() and not private.is_team_staff(new.team_id) then
      raise exception 'Only a captain or officer can touch the veto';
    end if;
    if new.team_id is distinct from m.home_team_id and new.team_id is distinct from m.away_team_id then
      raise exception 'That coven is not in this match';
    end if;
    if m.status not in ('scheduled', 'veto') then
      raise exception 'The veto is closed on this match';
    end if;
    if new.action = 'ban' then
      if bans >= 6 then
        raise exception 'All six bans are in';
      end if;
      expected_team := case when bans % 2 = 0 then m.home_team_id else m.away_team_id end;
      if not private.is_admin() and new.team_id is distinct from expected_team then
        raise exception 'It is not your coven''s turn to ban';
      end if;
      if new.map_name is null or not (new.map_name = any (pool)) then
        raise exception 'That map is not in the active pool';
      end if;
      if exists (
        select 1 from public.map_actions a
        where a.match_id = new.match_id and a.map_name = new.map_name
      ) then
        raise exception 'That map is already banned';
      end if;
    elsif new.action = 'side' then
      if bans < 6 then
        raise exception 'The map is not sealed yet';
      end if;
      if exists (
        select 1 from public.map_actions a
        where a.match_id = new.match_id and a.action = 'side'
      ) then
        raise exception 'Opening side is already chosen';
      end if;
      if not private.is_admin() and new.team_id is distinct from m.home_team_id then
        raise exception 'The home coven chooses the opening side';
      end if;
      if new.side not in ('CT', 'T') then
        raise exception 'Choose CT or T';
      end if;
    else
      raise exception 'Unknown veto action';
    end if;
  end if;

  new.step := coalesce(
    (select max(step) from public.map_actions where match_id = new.match_id),
    0
  ) + 1;
  return new;
end;
$$;

create trigger map_actions_validate
  before insert on public.map_actions
  for each row execute function private.before_map_action();

create or replace function private.after_map_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bans integer;
  remaining text;
  pool text[] := array['Ancient', 'Anubis', 'Cache', 'Dust II', 'Inferno', 'Mirage', 'Nuke'];
begin
  perform set_config('wwal.internal', 'on', true);
  select count(*) into bans
  from public.map_actions
  where match_id = new.match_id and action = 'ban';

  if new.action = 'ban' and bans >= 6 then
    select p into remaining
    from unnest(pool) as p
    where not exists (
      select 1
      from public.map_actions a
      where a.match_id = new.match_id
        and a.action = 'ban'
        and a.map_name = p
    )
    limit 1;
    update public.matches
      set played_map = remaining,
          status = 'veto'
      where id = new.match_id;
  elsif new.action = 'ban' then
    update public.matches
      set status = 'veto'
      where id = new.match_id
        and status = 'scheduled';
  elsif new.action = 'side' then
    update public.matches
      set ct_team_id = case
            when new.side = 'CT' then new.team_id
            when new.team_id = home_team_id then away_team_id
            else home_team_id
          end,
          status = 'scheduled'
      where id = new.match_id;
  end if;
  return new;
end;
$$;

create trigger map_actions_apply
  after insert on public.map_actions
  for each row execute function private.after_map_action();

create or replace function private.before_reschedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
begin
  select * into m from public.matches where id = new.match_id;
  if not found then
    raise exception 'Match not found';
  end if;
  if private.request_role() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if private.is_banned((select auth.uid())) then
      raise exception 'Suspended players cannot do that';
    end if;
    if not private.is_team_staff(new.proposed_by_team) and not private.is_admin() then
      raise exception 'Only coven staff can propose a time';
    end if;
    if new.proposed_by_team is distinct from m.home_team_id
       and new.proposed_by_team is distinct from m.away_team_id then
      raise exception 'That coven is not in this match';
    end if;
    if m.status not in ('scheduled', 'veto', 'reported') then
      raise exception 'This match is no longer on the clock';
    end if;
    return new;
  end if;
  if old.status is distinct from 'pending' then
    raise exception 'That proposal is already answered';
  end if;
  if new.status = 'accepted' and not private.is_admin()
     and not private.is_opposing_staff(new.match_id, new.proposed_by_team) then
    raise exception 'Only the other coven can accept a new time';
  end if;
  return new;
end;
$$;

create trigger reschedule_guard
  before insert or update on public.reschedule_proposals
  for each row execute function private.before_reschedule();

create or replace function private.after_reschedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform set_config('wwal.internal', 'on', true);
    update public.matches
      set scheduled_at = new.proposed_time
      where id = new.match_id;
    update public.reschedule_proposals
      set status = 'declined'
      where match_id = new.match_id
        and id <> new.id
        and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger reschedule_apply
  after update on public.reschedule_proposals
  for each row execute function private.after_reschedule();

create or replace function private.before_score_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
begin
  if tg_op = 'UPDATE' then
    if private.request_role() is not null and not private.is_admin() then
      if new.home_rounds is distinct from old.home_rounds
         or new.away_rounds is distinct from old.away_rounds
         or new.team_id is distinct from old.team_id
         or new.match_id is distinct from old.match_id
         or new.reporter_id is distinct from old.reporter_id
         or new.screenshot_path is distinct from old.screenshot_path then
        raise exception 'Only a steward can edit a filed score';
      end if;
      if new.status = 'confirmed' and old.status = 'pending'
         and not private.is_opposing_staff(new.match_id, new.team_id) then
        raise exception 'The reporting coven cannot confirm its own score';
      end if;
    end if;
    return new;
  end if;

  if not private.valid_map_score(new.home_rounds, new.away_rounds) then
    raise exception 'That score does not fit regulation or overtime';
  end if;
  if private.request_role() is null then
    return new;
  end if;
  select * into m from public.matches where id = new.match_id;
  if m.status not in ('scheduled', 'veto') then
    raise exception 'This match is not waiting on a score';
  end if;
  if private.is_banned((select auth.uid())) then
    raise exception 'Suspended players cannot do that';
  end if;
  if not private.is_admin() and not private.is_team_staff(new.team_id) then
    raise exception 'Only coven staff can file a score';
  end if;
  if new.team_id is distinct from m.home_team_id and new.team_id is distinct from m.away_team_id then
    raise exception 'That coven is not in this match';
  end if;
  if new.screenshot_path is null or char_length(new.screenshot_path) < 3 then
    raise exception 'Attach a screenshot of the scoreboard';
  end if;
  return new;
end;
$$;

create trigger score_reports_guard
  before insert or update on public.score_reports
  for each row execute function private.before_score_report();

create or replace function private.after_score_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
  winner uuid;
begin
  select * into m from public.matches where id = new.match_id;
  perform set_config('wwal.internal', 'on', true);

  if tg_op = 'INSERT' then
    if m.status in ('completed', 'forfeit', 'disputed') then
      return new;
    end if;
    update public.matches set status = 'reported' where id = new.match_id;
    return new;
  end if;

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    winner := case
      when new.home_rounds > new.away_rounds then m.home_team_id
      else m.away_team_id
    end;
    update public.matches
      set home_rounds = new.home_rounds,
          away_rounds = new.away_rounds,
          winner_team_id = winner,
          status = 'completed'
      where id = new.match_id;
    update public.score_reports
      set status = 'superseded'
      where match_id = new.match_id
        and id <> new.id
        and status = 'pending';
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    if m.status = 'reported' then
      update public.matches set status = 'scheduled' where id = new.match_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger score_reports_apply
  after insert or update on public.score_reports
  for each row execute function private.after_score_report();

create or replace function private.before_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
begin
  if tg_op = 'UPDATE' then
    return new;
  end if;
  if private.request_role() is null then
    return new;
  end if;
  select * into m from public.matches where id = new.match_id;
  if m.status not in ('reported', 'completed', 'disputed') then
    raise exception 'There is no filed result to dispute yet';
  end if;
  if not private.is_admin() and not private.is_match_staff(new.match_id) then
    raise exception 'Only coven staff can open a dispute';
  end if;
  if private.is_banned((select auth.uid())) then
    raise exception 'Suspended players cannot do that';
  end if;
  return new;
end;
$$;

create trigger disputes_guard
  before insert or update on public.disputes
  for each row execute function private.before_dispute();

create or replace function private.after_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'open' then
    perform set_config('wwal.internal', 'on', true);
    update public.matches set status = 'disputed' where id = new.match_id;
  end if;
  return new;
end;
$$;

create trigger disputes_apply
  after insert on public.disputes
  for each row execute function private.after_dispute();

create or replace function private.before_forfeit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
begin
  select * into m from public.matches where id = new.match_id;
  if not found then
    raise exception 'Match not found';
  end if;
  if m.status in ('completed', 'forfeit') then
    -- Seed and the SQL editor may record an event against a forfeit already booked.
    if private.request_role() is null and m.status = 'forfeit' then
      return new;
    end if;
    raise exception 'This match is already in the book';
  end if;
  if new.team_id is distinct from m.home_team_id and new.team_id is distinct from m.away_team_id then
    raise exception 'That coven is not in this match';
  end if;
  if private.request_role() is not null and not private.is_admin() then
    if not private.is_team_staff(new.team_id) then
      raise exception 'Only that coven''s staff can forfeit';
    end if;
    if private.is_banned((select auth.uid())) then
      raise exception 'Suspended players cannot do that';
    end if;
  end if;
  return new;
end;
$$;

create trigger forfeits_guard
  before insert on public.forfeit_events
  for each row execute function private.before_forfeit();

create or replace function private.after_forfeit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.matches%rowtype;
  winner uuid;
begin
  select * into m from public.matches where id = new.match_id;
  if m.status = 'forfeit' and m.forfeit_team_id = new.team_id then
    return new;
  end if;
  winner := case
    when new.team_id = m.home_team_id then m.away_team_id
    else m.home_team_id
  end;
  perform set_config('wwal.internal', 'on', true);
  update public.matches
    set status = 'forfeit',
        forfeit_team_id = new.team_id,
        winner_team_id = winner,
        home_rounds = 0,
        away_rounds = 0
    where id = new.match_id;
  return new;
end;
$$;

create trigger forfeits_apply
  after insert on public.forfeit_events
  for each row execute function private.after_forfeit();

create or replace function private.guard_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.request_role() is null or private.is_admin() then
    return new;
  end if;
  new.status := old.status;
  new.author_id := old.author_id;
  return new;
end;
$$;

create trigger tickets_guard
  before update on public.tickets
  for each row execute function private.guard_ticket();

create or replace function private.guard_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.request_role() is null or private.is_admin() then
    return new;
  end if;
  new.pinned := old.pinned;
  new.locked := old.locked;
  new.author_id := old.author_id;
  new.board_id := old.board_id;
  return new;
end;
$$;

create trigger forum_threads_guard
  before update on public.forum_threads
  for each row execute function private.guard_thread();

-- End-user roles may call the helpers from policies. They are not RPCs:
-- the private schema is not in the exposed API schemas.
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

do $$
declare
  sig regprocedure;
begin
  for sig in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
  loop
    execute format('revoke all on function %s from public', sig);
    execute format(
      'grant execute on function %s to anon, authenticated, service_role',
      sig
    );
  end loop;
end $$;
