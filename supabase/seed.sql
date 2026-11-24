-- Sample Ashen Oath ledger for local `supabase db reset`.
-- Every seeded account signs in with the password ashen-oath.
-- Change those passwords before any public deploy. Sender is the steward.

create extension if not exists pgcrypto with schema extensions;

create or replace function pg_temp.seed_user(uid uuid, email text, username text, display_name text)
returns void
language plpgsql
as $$
declare
  colname text;
  cols text := '';
  vals text := '';
  expr text;
  meta jsonb := jsonb_build_object('username', username, 'display_name', display_name);
  ident_cols text := '';
  ident_vals text := '';
begin
  for colname in
    select c.column_name
    from information_schema.columns c
    where c.table_schema = 'auth'
      and c.table_name = 'users'
      and c.is_generated = 'NEVER'
  loop
    expr := case colname
      when 'instance_id' then quote_literal('00000000-0000-0000-0000-000000000000') || '::uuid'
      when 'id' then quote_literal(uid::text) || '::uuid'
      when 'aud' then quote_literal('authenticated')
      when 'role' then quote_literal('authenticated')
      when 'email' then quote_literal(email)
      when 'encrypted_password' then format('extensions.crypt(%L, extensions.gen_salt(''bf''))', 'ashen-oath')
      when 'email_confirmed_at' then 'now()'
      when 'last_sign_in_at' then 'now()'
      when 'raw_app_meta_data' then '''{"provider":"email","providers":["email"]}''::jsonb'
      when 'raw_user_meta_data' then quote_literal(meta::text) || '::jsonb'
      when 'created_at' then 'now()'
      when 'updated_at' then 'now()'
      when 'confirmation_token' then quote_literal('')
      when 'recovery_token' then quote_literal('')
      when 'email_change' then quote_literal('')
      when 'email_change_token_new' then quote_literal('')
      when 'email_change_token_current' then quote_literal('')
      when 'phone' then quote_literal('')
      when 'phone_change' then quote_literal('')
      when 'phone_change_token' then quote_literal('')
      when 'reauthentication_token' then quote_literal('')
      when 'email_change_confirm_status' then '0'
      when 'is_sso_user' then 'false'
      when 'is_anonymous' then 'false'
      when 'is_super_admin' then 'false'
      else null
    end;
    if expr is not null then
      cols := cols || quote_ident(colname) || ',';
      vals := vals || expr || ',';
    end if;
  end loop;

  execute 'insert into auth.users (' || left(cols, -1) || ') values (' || left(vals, -1) || ')';

  for colname in
    select c.column_name
    from information_schema.columns c
    where c.table_schema = 'auth'
      and c.table_name = 'identities'
      and c.is_generated = 'NEVER'
  loop
    expr := case colname
      when 'id' then 'gen_random_uuid()'
      when 'user_id' then quote_literal(uid::text) || '::uuid'
      when 'provider_id' then quote_literal(uid::text)
      when 'identity_data' then format(
        '%L::jsonb',
        jsonb_build_object('sub', uid::text, 'email', email)::text
      )
      when 'provider' then quote_literal('email')
      when 'last_sign_in_at' then 'now()'
      when 'created_at' then 'now()'
      when 'updated_at' then 'now()'
      else null
    end;
    if expr is not null then
      ident_cols := ident_cols || quote_ident(colname) || ',';
      ident_vals := ident_vals || expr || ',';
    end if;
  end loop;

  if ident_cols <> '' then
    execute 'insert into auth.identities (' || left(ident_cols, -1) || ') values (' || left(ident_vals, -1) || ')';
  end if;
end;
$$;

do $$
declare
  person record;
  n int := 0;
begin
  for person in
    select *
    from (values
      ('Sender', 'Steward of the Wizard & Witch Amateur League. Keeps the book and does not play.'),
      ('Sootfinger', 'Suspended from the Hall and from the queue.'),
      ('Marrow', 'Calls the slow round and means it.'),
      ('Quill', 'Second voice for Coven of Ash.'),
      ('Sable', 'Holds the sites other covens give away.'),
      ('Ivy', 'Trades on time.'),
      ('Gilt', 'Captain of Gilded Sigil.'),
      ('Lumen', 'Utility caller.'),
      ('Cass', 'Opens sites.'),
      ('Briony', 'Anchor.'),
      ('Vesper', 'Captain of Nightglass.'),
      ('Nox', 'Keeps the veto card.'),
      ('Pell', 'Entry.'),
      ('Orla', 'Closes rounds.'),
      ('Briar', 'Captain of Thornhex.'),
      ('Hexa', 'Officer.'),
      ('Rue', 'Contact player.'),
      ('Camber', 'Support.'),
      ('Selune', 'Captain of Moonwell Vanguard.'),
      ('Well', 'Officer.'),
      ('Arden', 'Holds angles.'),
      ('Pico', 'Fifth.'),
      ('Cinder', 'Captain of Emberquill.'),
      ('Quilla', 'Officer.'),
      ('Ashen', 'Rifler.'),
      ('Moth', 'New to the roster.'),
      ('Astra', 'Captain of Starwell Circle.'),
      ('Coil', 'Officer.'),
      ('Nyx', 'Lurk.'),
      ('Pim', 'Support.'),
      ('Rune', 'Captain of Rune & Ruin.'),
      ('Ruin', 'Officer.'),
      ('Keel', 'Anchor.'),
      ('Dara', 'Entry.'),
      ('Lantern', 'Captain of Hexlantern.'),
      ('Wick', 'Officer.'),
      ('Soot', 'Closer.'),
      ('Gale', 'Wide player.'),
      ('Velvet', 'Captain of Velvet Pyre.'),
      ('Pyre', 'Officer.'),
      ('Moss', 'Lurk.'),
      ('Juniper', 'Rifler.'),
      ('Salt', 'Captain of Saltcircle.'),
      ('Brine', 'Officer.'),
      ('Kelp', 'Anchor.'),
      ('Ness', 'Fifth.'),
      ('Iron', 'Captain of Iron Familiar.'),
      ('Familiar', 'Officer.'),
      ('Anvil', 'Anchor.'),
      ('Pip', 'Fifth.'),
      ('Bramble', 'Captain of Bramble Court.'),
      ('Court', 'Officer.'),
      ('Thorn', 'Punisher.'),
      ('Liss', 'Support.'),
      ('Low', 'Captain of Low Lantern.'),
      ('Wicklow', 'Officer.'),
      ('Fern', 'Entry.'),
      ('Hap', 'Fifth.'),
      ('Pond', 'Captain of Pondwitch Union.'),
      ('Reed', 'Officer.'),
      ('Toad', 'Player.'),
      ('Minnow', 'Player.'),
      ('Glass', 'Captain of Glass Cat.'),
      ('Catmint', 'Officer.'),
      ('Shard', 'Entry.'),
      ('Pounce', 'Closer.'),
      ('Broom', 'Captain of Second Broom.'),
      ('Sweep', 'Officer.'),
      ('Dusty', 'Anchor.'),
      ('Cob', 'Fifth.'),
      ('Kitchen', 'Captain of Kitchen Hex.'),
      ('Ladle', 'Officer.'),
      ('Spoon', 'Trader.'),
      ('Crumb', 'Lurk.')
    ) as t(username, bio)
  loop
    n := n + 1;
    perform pg_temp.seed_user(
      ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
      lower(person.username) || '@wwal.league',
      person.username,
      person.username
    );
    update public.profiles
      set bio = person.bio,
          steam_name = lower(person.username),
          is_admin = person.username = 'Sender'
      where username = person.username;
  end loop;
end $$;

-- Covens. The insert trigger seats the captain.
insert into public.teams (name, tag, slug, motto, about, accent, region, created_by)
select v.name, v.tag, v.slug, v.motto, v.about, v.accent, 'NA', p.id
from (values
  ('Coven of Ash', 'ASH', 'coven-of-ash', 'We burn the clock, not the roster.', 'A four-stack from the river towns who treat defaults like liturgy.', '#d4655d', 'Marrow'),
  ('Gilded Sigil', 'GILD', 'gilded-sigil', 'Gold is just a color we answer to.', 'Showmatch manners and a mid-round that does not panic.', '#e6c56a', 'Gilt'),
  ('Nightglass', 'NG', 'nightglass', 'See it late. Call it once.', 'They give map control on purpose.', '#8eb4ff', 'Vesper'),
  ('Thornhex', 'THX', 'thornhex', 'Nothing pretty grows without a point.', 'Aggressive takes and a captain who keeps them honest.', '#5ee0cb', 'Briar'),
  ('Moonwell Vanguard', 'MWV', 'moonwell-vanguard', 'Hold the well. Trade the rest.', 'Utility first.', '#d7c4ff', 'Selune'),
  ('Emberquill', 'EQ', 'emberquill', 'Write it down before it goes out.', 'Two forfeits from the quiet list.', '#ff8a4c', 'Cinder'),
  ('Starwell Circle', 'STAR', 'starwell-circle', 'Five players, one orbit.', 'Challenger regulars who scrim more than they post.', '#f0d9ff', 'Astra'),
  ('Rune & Ruin', 'RUIN', 'rune-and-ruin', 'Old calls, new ruins.', 'A rebuilt roster with one caller.', '#c9b59a', 'Rune'),
  ('Hexlantern', 'HEX', 'hexlantern', 'Light the angle, then the fight.', 'Fast defaults, slower tempers.', '#ffd27a', 'Lantern'),
  ('Velvet Pyre', 'VEL', 'velvet-pyre', 'Soft hands, loud rounds.', 'Contact play.', '#e28bb8', 'Velvet'),
  ('Saltcircle', 'SALT', 'saltcircle', 'Draw the ring. Stay inside it.', 'Contender discipline.', '#9fd7e8', 'Salt'),
  ('Iron Familiar', 'IRON', 'iron-familiar', 'The pet does the trading.', 'Trades first, names second.', '#c5c1b8', 'Iron'),
  ('Bramble Court', 'BRAM', 'bramble-court', 'Let them push. The hedge holds.', 'Retake was the plan.', '#8fbf7a', 'Bramble'),
  ('Low Lantern', 'LOW', 'low-lantern', 'We play under the light, not in it.', 'Thursday is sacred.', '#f0a36b', 'Low'),
  ('Pondwitch Union', 'POND', 'pondwitch-union', 'Three forfeits and the pond goes still.', 'Open, then the quiet list.', '#6fbfa8', 'Pond'),
  ('Glass Cat', 'GLAS', 'glass-cat', 'Nine lives, thirteen rounds.', 'The cleanest Open roster.', '#d5e2ff', 'Glass'),
  ('Second Broom', 'BRM', 'second-broom', 'Sweep mid, then the site.', 'They sweep, then they stop arguing.', '#e7d3a1', 'Broom'),
  ('Kitchen Hex', 'KIT', 'kitchen-hex', 'Dinner can wait. The execute cannot.', 'Friends who learned the veto by losing it.', '#f2b8a0', 'Kitchen')
) as v(name, tag, slug, motto, about, accent, captain)
join public.profiles p on p.username = v.captain;

insert into public.team_members (team_id, profile_id, role)
select t.id, p.id, m.role
from (values
  ('coven-of-ash', 'Quill', 'officer'), ('coven-of-ash', 'Sable', 'player'), ('coven-of-ash', 'Ivy', 'player'),
  ('gilded-sigil', 'Lumen', 'officer'), ('gilded-sigil', 'Cass', 'player'), ('gilded-sigil', 'Briony', 'player'),
  ('nightglass', 'Nox', 'officer'), ('nightglass', 'Pell', 'player'), ('nightglass', 'Orla', 'player'),
  ('thornhex', 'Hexa', 'officer'), ('thornhex', 'Rue', 'player'), ('thornhex', 'Camber', 'player'),
  ('moonwell-vanguard', 'Well', 'officer'), ('moonwell-vanguard', 'Arden', 'player'), ('moonwell-vanguard', 'Pico', 'player'),
  ('emberquill', 'Quilla', 'officer'), ('emberquill', 'Ashen', 'player'), ('emberquill', 'Moth', 'player'),
  ('starwell-circle', 'Coil', 'officer'), ('starwell-circle', 'Nyx', 'player'), ('starwell-circle', 'Pim', 'player'),
  ('rune-and-ruin', 'Ruin', 'officer'), ('rune-and-ruin', 'Keel', 'player'), ('rune-and-ruin', 'Dara', 'player'),
  ('hexlantern', 'Wick', 'officer'), ('hexlantern', 'Soot', 'player'), ('hexlantern', 'Gale', 'player'),
  ('velvet-pyre', 'Pyre', 'officer'), ('velvet-pyre', 'Moss', 'player'), ('velvet-pyre', 'Juniper', 'player'),
  ('saltcircle', 'Brine', 'officer'), ('saltcircle', 'Kelp', 'player'), ('saltcircle', 'Ness', 'player'),
  ('iron-familiar', 'Familiar', 'officer'), ('iron-familiar', 'Anvil', 'player'), ('iron-familiar', 'Pip', 'player'),
  ('bramble-court', 'Court', 'officer'), ('bramble-court', 'Thorn', 'player'), ('bramble-court', 'Liss', 'player'),
  ('low-lantern', 'Wicklow', 'officer'), ('low-lantern', 'Fern', 'player'), ('low-lantern', 'Hap', 'player'),
  ('pondwitch-union', 'Reed', 'officer'), ('pondwitch-union', 'Toad', 'player'), ('pondwitch-union', 'Minnow', 'player'),
  ('glass-cat', 'Catmint', 'officer'), ('glass-cat', 'Shard', 'player'), ('glass-cat', 'Pounce', 'player'),
  ('second-broom', 'Sweep', 'officer'), ('second-broom', 'Dusty', 'player'), ('second-broom', 'Cob', 'player'),
  ('kitchen-hex', 'Ladle', 'officer'), ('kitchen-hex', 'Spoon', 'player'), ('kitchen-hex', 'Crumb', 'player')
) as m(slug, username, role)
join public.teams t on t.slug = m.slug
join public.profiles p on p.username = m.username;

insert into public.seasons (id, name, slug, region, status, starts_on, weeks, summary)
values (
  '00000000-0000-4000-8000-000000000201',
  'Season I — The Ashen Oath',
  'ashen-oath',
  'NA',
  'regular',
  '2026-10-27',
  7,
  'Seven weeks, two best-of-ones a week, then a bracket. North America only.'
);

insert into public.divisions (id, season_id, name, tier, playoff_slots, blurb)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', 'Apex', 1, 4, 'The sharpest six covens. Four advance.'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000201', 'Challenger', 2, 2, 'The playoff line is two.'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000201', 'Contender', 3, 2, 'A full season for covens who already have a default.'),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000201', 'Open', 4, 2, 'Three forfeits and you go quiet.');

insert into public.registrations (season_id, division_id, team_id, status, registered_by)
select
  '00000000-0000-4000-8000-000000000201',
  d.id,
  t.id,
  'approved',
  t.created_by
from public.teams t
join public.divisions d on d.season_id = '00000000-0000-4000-8000-000000000201'
 and (
    (d.name = 'Apex' and t.slug in ('coven-of-ash','gilded-sigil','nightglass','thornhex','moonwell-vanguard','emberquill'))
    or (d.name = 'Challenger' and t.slug in ('starwell-circle','rune-and-ruin','hexlantern','velvet-pyre'))
    or (d.name = 'Contender' and t.slug in ('saltcircle','iron-familiar','bramble-court','low-lantern'))
    or (d.name = 'Open' and t.slug in ('pondwitch-union','glass-cat','second-broom','kitchen-hex'))
  );

-- Weeks 1–3 of Apex, plus the live week-four rooms. Lower divisions get two finished weeks.
do $$
declare
  spec record;
  home_id uuid;
  away_id uuid;
  winner uuid;
  forfeit_id uuid;
  match_id uuid;
  apex uuid := '00000000-0000-4000-8000-000000000301';
  season uuid := '00000000-0000-4000-8000-000000000201';
  tags text[] := array['ASH','GILD','NG','THX','MWV','EQ'];
begin
  for spec in
    select * from (values
      (1, 1, 0, 1, 'completed', 13, 7, 'Mirage', null::text),
      (1, 2, 2, 3, 'completed', 13, 11, 'Inferno', null),
      (1, 3, 4, 5, 'completed', 13, 9, 'Ancient', null),
      (1, 4, 0, 2, 'completed', 13, 5, 'Nuke', null),
      (1, 5, 1, 4, 'completed', 13, 10, 'Anubis', null),
      (1, 6, 3, 5, 'completed', 13, 6, 'Dust II', null),
      (2, 1, 0, 3, 'completed', 13, 8, 'Cache', null),
      (2, 2, 1, 2, 'completed', 13, 11, 'Mirage', null),
      (2, 3, 4, 5, 'completed', 13, 11, 'Inferno', null),
      (2, 4, 0, 4, 'completed', 13, 9, 'Ancient', null),
      (2, 5, 1, 5, 'forfeit', 0, 0, null, 'away'),
      (2, 6, 2, 3, 'completed', 13, 10, 'Nuke', null),
      (3, 1, 1, 0, 'completed', 13, 10, 'Dust II', null),
      (3, 2, 2, 5, 'completed', 13, 7, 'Cache', null),
      (3, 3, 3, 4, 'completed', 13, 11, 'Mirage', null),
      (3, 4, 0, 5, 'forfeit', 0, 0, null, 'away'),
      (3, 5, 1, 3, 'completed', 13, 8, 'Inferno', null),
      (3, 6, 2, 4, 'completed', 13, 9, 'Anubis', null),
      (4, 2, 2, 3, 'scheduled', null, null, 'Mirage', null),
      (4, 3, 4, 5, 'scheduled', null, null, 'Inferno', null),
      (4, 4, 0, 5, 'scheduled', null, null, null, null),
      (4, 5, 1, 3, 'scheduled', null, null, null, null),
      (4, 6, 2, 4, 'scheduled', null, null, null, null),
      (5, 1, 0, 3, 'scheduled', null, null, null, null),
      (5, 2, 1, 2, 'scheduled', null, null, null, null),
      (5, 3, 4, 5, 'scheduled', null, null, null, null),
      (6, 1, 0, 2, 'scheduled', null, null, null, null),
      (6, 2, 1, 4, 'scheduled', null, null, null, null),
      (7, 1, 0, 3, 'scheduled', null, null, null, null),
      (7, 2, 1, 4, 'scheduled', null, null, null, null)
    ) as s(week, slot, home_i, away_i, status, hr, ar, map, forfeit_side)
  loop
    select id into home_id from public.teams where tag = tags[spec.home_i + 1];
    select id into away_id from public.teams where tag = tags[spec.away_i + 1];
    forfeit_id := case
      when spec.forfeit_side = 'away' then away_id
      when spec.forfeit_side = 'home' then home_id
      else null
    end;
    winner := case
      when spec.status = 'forfeit' and spec.forfeit_side = 'away' then home_id
      when spec.status = 'forfeit' and spec.forfeit_side = 'home' then away_id
      when spec.status = 'completed' and spec.hr > spec.ar then home_id
      when spec.status = 'completed' then away_id
      else null
    end;
    insert into public.matches (
      code, season_id, division_id, stage, week, slot, round_name,
      home_team_id, away_team_id, scheduled_at, status, played_map,
      home_rounds, away_rounds, winner_team_id, forfeit_team_id, ct_team_id
    ) values (
      'apex-' || spec.week || '-' || spec.slot,
      season, apex, 'regular', spec.week, spec.slot, 'Week ' || spec.week,
      home_id, away_id,
      timestamp '2026-10-26 00:00+00' + ((spec.week - 1) * 7 + spec.slot) * interval '1 day',
      spec.status, spec.map, spec.hr, spec.ar, winner, forfeit_id,
      case when spec.status = 'completed' then home_id else null end
    )
    returning id into match_id;

    if forfeit_id is not null then
      insert into public.forfeit_events (match_id, team_id, recorded_by, reason)
      select match_id, forfeit_id, t.created_by, 'No five at the scheduled time.'
      from public.teams t where t.id = forfeit_id;
    end if;
  end loop;
end $$;

-- Featured veto: inserted as scheduled so the ban trigger can open the seal.
insert into public.matches (
  code, season_id, division_id, stage, week, slot, round_name,
  home_team_id, away_team_id, scheduled_at, status, server_info
)
select
  'apex-4-1',
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000301',
  'regular', 4, 1, 'Week 4',
  h.id, a.id,
  '2026-11-24 20:00:00-05',
  'scheduled',
  E'connect 151.80.22.14:27015; password oath-week4\nGOTV 151.80.22.14:27020'
from public.teams h, public.teams a
where h.slug = 'coven-of-ash' and a.slug = 'gilded-sigil';

insert into public.map_actions (match_id, team_id, actor_id, step, action, map_name)
select m.id, t.id, t.created_by, s.step, 'ban', s.map
from public.matches m
join (values
  (1, 'coven-of-ash', 'Ancient'),
  (2, 'gilded-sigil', 'Nuke'),
  (3, 'coven-of-ash', 'Dust II')
) as s(step, slug, map) on true
join public.teams t on t.slug = s.slug
where m.code = 'apex-4-1';

insert into public.reschedule_proposals (match_id, proposed_by, proposed_by_team, proposed_time, message, status)
select m.id, t.created_by, t.id, '2026-11-27 21:00:00-05',
  'Friday at 9pm ET. Our fifth is on a shift Thursday.',
  'pending'
from public.matches m
join public.teams t on t.slug = 'gilded-sigil'
where m.code = 'apex-4-1';

insert into public.score_reports (match_id, reporter_id, team_id, home_rounds, away_rounds, screenshot_path, note, status)
select m.id, t.created_by, t.id, 13, 11, 'seed/apex-4-2.svg', 'Regulation. Waiting on Thornhex.', 'pending'
from public.matches m
join public.teams t on t.slug = 'nightglass'
where m.code = 'apex-4-2';

insert into public.score_reports (match_id, reporter_id, team_id, home_rounds, away_rounds, screenshot_path, note, status)
select m.id, t.created_by, t.id, 13, 6, 'seed/apex-4-3.svg', 'They left after the second half pistol.', 'pending'
from public.matches m
join public.teams t on t.slug = 'moonwell-vanguard'
where m.code = 'apex-4-3';

insert into public.disputes (match_id, opened_by, reason, status)
select m.id, t.created_by,
  'Our fifth dropped and the other coven kept playing. The filed score is not a map we agreed to finish.',
  'open'
from public.matches m
join public.teams t on t.slug = 'emberquill'
where m.code = 'apex-4-3';

-- Open quiet-list forfeits and a few real maps.
insert into public.matches (
  code, season_id, division_id, stage, week, slot, round_name,
  home_team_id, away_team_id, scheduled_at, status, played_map,
  home_rounds, away_rounds, winner_team_id, forfeit_team_id
)
select
  v.code,
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000304',
  'regular', v.week, v.slot, 'Week ' || v.week,
  h.id, a.id, '2026-11-01 20:00:00-04', v.status, v.map,
  v.hr, v.ar,
  case when v.forfeit = 'away' then h.id when v.status = 'completed' and v.hr > v.ar then h.id when v.status = 'completed' then a.id else null end,
  case when v.forfeit = 'away' then a.id else null end
from (values
  ('open-1-1', 1, 1, 'glass-cat', 'pondwitch-union', 'forfeit', null::text, 0, 0, 'away'),
  ('open-1-2', 1, 2, 'second-broom', 'kitchen-hex', 'completed', 'Dust II', 13, 8, null),
  ('open-1-3', 1, 3, 'second-broom', 'pondwitch-union', 'forfeit', null, 0, 0, 'away'),
  ('open-1-4', 1, 4, 'glass-cat', 'kitchen-hex', 'completed', 'Inferno', 13, 10, null),
  ('open-2-1', 2, 1, 'kitchen-hex', 'pondwitch-union', 'forfeit', null, 0, 0, 'away'),
  ('open-2-2', 2, 2, 'glass-cat', 'second-broom', 'completed', 'Mirage', 13, 7, null),
  ('open-2-3', 2, 3, 'second-broom', 'kitchen-hex', 'completed', 'Ancient', 13, 9, null)
) as v(code, week, slot, home_slug, away_slug, status, map, hr, ar, forfeit)
join public.teams h on h.slug = v.home_slug
join public.teams a on a.slug = v.away_slug;

insert into public.forfeit_events (match_id, team_id, recorded_by, reason)
select m.id, m.forfeit_team_id, t.created_by, 'Pondwitch did not field five.'
from public.matches m
join public.teams t on t.id = m.forfeit_team_id
where m.code like 'open-%' and m.status = 'forfeit';

-- A light slate so Challenger and Contender are not empty.
insert into public.matches (
  code, season_id, division_id, stage, week, slot, round_name,
  home_team_id, away_team_id, scheduled_at, status, played_map,
  home_rounds, away_rounds, winner_team_id, ct_team_id
)
select
  v.code,
  '00000000-0000-4000-8000-000000000201',
  d.id,
  'regular', v.week, v.slot, 'Week ' || v.week,
  h.id, a.id,
  '2026-11-04 20:00:00-05',
  'completed',
  v.map,
  13, v.away_rounds,
  h.id, h.id
from (values
  ('challenger-1-1', 'Challenger', 1, 1, 'starwell-circle', 'rune-and-ruin', 'Mirage', 9),
  ('challenger-1-2', 'Challenger', 1, 2, 'hexlantern', 'velvet-pyre', 'Inferno', 7),
  ('challenger-2-1', 'Challenger', 2, 1, 'starwell-circle', 'hexlantern', 'Nuke', 11),
  ('challenger-2-2', 'Challenger', 2, 2, 'rune-and-ruin', 'velvet-pyre', 'Ancient', 8),
  ('contender-1-1', 'Contender', 1, 1, 'saltcircle', 'iron-familiar', 'Dust II', 6),
  ('contender-1-2', 'Contender', 1, 2, 'bramble-court', 'low-lantern', 'Cache', 10),
  ('contender-2-1', 'Contender', 2, 1, 'saltcircle', 'bramble-court', 'Anubis', 8),
  ('contender-2-2', 'Contender', 2, 2, 'iron-familiar', 'low-lantern', 'Mirage', 11)
) as v(code, division_name, week, slot, home_slug, away_slug, map, away_rounds)
join public.divisions d on d.name = v.division_name
join public.teams h on h.slug = v.home_slug
join public.teams a on a.slug = v.away_slug;

insert into public.matches (code, season_id, division_id, stage, slot, round_name, scheduled_at, status, advances_to, advances_as)
values
  ('apex-final', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', 'playoff', 3, 'Final', '2026-12-23 20:00:00-05', 'scheduled', null, null);

insert into public.matches (code, season_id, division_id, stage, slot, round_name, scheduled_at, status, advances_to, advances_as)
select
  code,
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000301',
  'playoff',
  slot,
  'Semifinal',
  '2026-12-22 20:00:00-05',
  'scheduled',
  (select id from public.matches where code = 'apex-final'),
  side
from (values ('apex-sf-1', 1, 'home'), ('apex-sf-2', 2, 'away')) as v(code, slot, side);

insert into public.news_posts (slug, title, excerpt, body, author_id, published, published_at)
select
  v.slug, v.title, v.excerpt, v.body, p.id, true, v.published_at::timestamptz
from (values
  (
    'ashen-oath-opens',
    'The Ashen Oath is open',
    'Eighteen covens, four divisions, and a seven-week book.',
    E'Season I of the Wizard & Witch Amateur League is a schedule, a veto, and a steward who answers.\n\nNorth America is the only region on the book. Every coven plays two best-of-ones a week for seven weeks.',
    '2026-10-20 12:00:00-04'
  ),
  (
    'how-the-veto-seal-works',
    'How the veto seal works',
    'Six bans, one map left standing, and the home coven chooses the opening side.',
    E'The pool is Ancient, Anubis, Cache, Dust II, Inferno, Mirage, and Nuke.\n\nHome bans first. The covens alternate until one map remains. Home then chooses CT or T.',
    '2026-10-22 12:00:00-04'
  ),
  (
    'quiet-list',
    'The quiet list, explained',
    'Three forfeits and a coven is inactive. They stay on the table and leave the playoff line.',
    E'A forfeit is a loss with no rounds attached.\n\nPondwitch Union reached the list in week two. The rest of their Open slate was pulled.',
    '2026-11-12 12:00:00-05'
  ),
  (
    'week-four-note',
    'Week four: Apex is a one-match room',
    'Coven of Ash and Gilded Sigil meet again with the veto still open.',
    E'Both covens sit at five and one. The seal is still open on Tuesday.\n\nNightglass have a score waiting. Moonwell and Emberquill are in a dispute.',
    '2026-11-24 15:00:00-05'
  )
) as v(slug, title, excerpt, body, published_at)
join public.profiles p on p.username = 'Sender';

insert into public.forum_boards (slug, name, description, sort_order)
values
  ('hall', 'The Hall', 'Schedule chatter and introductions.', 1),
  ('workshop', 'The Workshop', 'Defaults and veto talk.', 2);

insert into public.forum_threads (board_id, author_id, title, body, pinned)
select b.id, p.id, 'Week four server sheet',
  'Passwords live in the match room, not in this thread. If the box dies, file a ticket.',
  true
from public.forum_boards b
join public.profiles p on p.username = 'Sender'
where b.slug = 'hall';

insert into public.forum_threads (board_id, author_id, title, body, pinned)
select b.id, p.id, 'Defaulting Ancient when you are opening T',
  'Two go mid. The other three wait for ramp or the donut contact. It is the version we stopped losing.',
  false
from public.forum_boards b
join public.profiles p on p.username = 'Marrow'
where b.slug = 'workshop';

insert into public.tickets (id, author_id, subject, status)
select '00000000-0000-4000-8000-000000000501', p.id, 'GOTV password on the Tuesday box', 'waiting'
from public.profiles p where p.username = 'Marrow';

insert into public.ticket_messages (ticket_id, author_id, body)
select '00000000-0000-4000-8000-000000000501', p.id, v.body
from (values
  ('Marrow', 'GOTV asks for a password the room does not list. Our coach needs the feed.'),
  ('Sender', 'GOTV password matches the server password this week. I will add the line to the room.')
) as v(username, body)
join public.profiles p on p.username = v.username;

insert into public.bans (profile_id, issued_by, reason, ends_at)
select target.id, steward.id,
  'Repeated slurs in the Hall after a warning. Suspended through the end of the regular season.',
  '2026-12-20 23:59:00-05'
from public.profiles target
join public.profiles steward on steward.username = 'Sender'
where target.username = 'Sootfinger';
