-- Wizard & Witch Amateur League
-- Tables for the public Data API. Row Level Security is enabled here and
-- policies are added in the policies migration. No policy means no access.

create schema if not exists private;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

-- Profiles are created by private.handle_new_user (see guards). is_admin is
-- never copied from auth user metadata; that jsonb is user-editable.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text not null default '',
  steam_name text not null default '',
  region text not null default 'NA' check (region = 'NA'),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

create trigger profiles_touch
  before update on public.profiles
  for each row execute function private.touch_updated_at();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  slug text not null,
  motto text not null default '',
  about text not null default '',
  accent text not null default '#e6c56a',
  region text not null default 'NA' check (region = 'NA'),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_len check (char_length(name) between 3 and 40),
  constraint teams_tag_format check (tag ~ '^[A-Z0-9]{2,5}$'),
  constraint teams_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint teams_accent_format check (accent ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index teams_name_lower_idx on public.teams (lower(name));
create unique index teams_tag_idx on public.teams (tag);
create unique index teams_slug_idx on public.teams (slug);

create trigger teams_touch
  before update on public.teams
  for each row execute function private.touch_updated_at();

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('captain', 'officer', 'player')),
  joined_at timestamptz not null default now(),
  primary key (team_id, profile_id)
);

-- One coven per player for this MVP.
create unique index team_members_one_team_idx on public.team_members (profile_id);

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id),
  invitee_id uuid not null references public.profiles (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint team_invites_not_self check (inviter_id <> invitee_id)
);

create unique index team_invites_one_pending_idx
  on public.team_invites (team_id, invitee_id)
  where status = 'pending';

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  region text not null default 'NA' check (region = 'NA'),
  status text not null default 'draft' check (status in ('draft', 'registration', 'regular', 'playoffs', 'completed')),
  starts_on date not null,
  weeks integer not null default 7 check (weeks = 7),
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  name text not null check (name in ('Open', 'Contender', 'Challenger', 'Apex')),
  tier integer not null check (tier between 1 and 4),
  playoff_slots integer not null check (playoff_slots in (2, 4)),
  blurb text not null default '',
  unique (season_id, name)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  division_id uuid not null references public.divisions (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  registered_by uuid not null references public.profiles (id),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (season_id, team_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  season_id uuid not null references public.seasons (id) on delete cascade,
  division_id uuid not null references public.divisions (id) on delete cascade,
  stage text not null default 'regular' check (stage in ('regular', 'playoff')),
  week integer,
  slot integer not null default 1 check (slot >= 1),
  round_name text not null default '',
  home_team_id uuid references public.teams (id),
  away_team_id uuid references public.teams (id),
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'veto', 'reported', 'disputed', 'forfeit', 'completed')),
  server_info text not null default '',
  played_map text,
  ct_team_id uuid references public.teams (id),
  home_rounds integer,
  away_rounds integer,
  winner_team_id uuid references public.teams (id),
  forfeit_team_id uuid references public.teams (id),
  advances_to uuid references public.matches (id),
  advances_as text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_week_shape check (
    (stage = 'regular' and week between 1 and 7)
    or (stage = 'playoff' and week is null)
  ),
  constraint matches_distinct_teams check (home_team_id is distinct from away_team_id),
  constraint matches_map_pool check (
    played_map is null
    or played_map in ('Ancient', 'Anubis', 'Cache', 'Dust II', 'Inferno', 'Mirage', 'Nuke')
  ),
  constraint matches_rounds_nonneg check (
    (home_rounds is null or home_rounds >= 0)
    and (away_rounds is null or away_rounds >= 0)
  ),
  constraint matches_winner_playing check (
    winner_team_id is null
    or winner_team_id = home_team_id
    or winner_team_id = away_team_id
  ),
  constraint matches_forfeit_playing check (
    forfeit_team_id is null
    or forfeit_team_id = home_team_id
    or forfeit_team_id = away_team_id
  ),
  constraint matches_ct_playing check (
    ct_team_id is null
    or ct_team_id = home_team_id
    or ct_team_id = away_team_id
  ),
  constraint matches_advance_shape check (
    advances_to is null or advances_as in ('home', 'away')
  ),
  constraint matches_server_len check (char_length(server_info) <= 500),
  constraint matches_code_format check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index matches_division_week_idx on public.matches (division_id, week, slot);

create trigger matches_touch
  before update on public.matches
  for each row execute function private.touch_updated_at();

create table public.map_actions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  actor_id uuid not null references public.profiles (id),
  step integer not null check (step >= 1),
  action text not null check (action in ('ban', 'side')),
  map_name text,
  side text,
  created_at timestamptz not null default now(),
  unique (match_id, step),
  constraint map_actions_shape check (
    (action = 'ban' and map_name in ('Ancient', 'Anubis', 'Cache', 'Dust II', 'Inferno', 'Mirage', 'Nuke') and side is null)
    or (action = 'side' and side in ('CT', 'T'))
  )
);

create table public.reschedule_proposals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  proposed_by uuid not null references public.profiles (id),
  proposed_by_team uuid not null references public.teams (id),
  proposed_time timestamptz not null,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint reschedule_message_len check (char_length(message) <= 500)
);

create table public.score_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id),
  team_id uuid not null references public.teams (id),
  home_rounds integer not null,
  away_rounds integer not null,
  screenshot_path text,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'superseded')),
  created_at timestamptz not null default now(),
  constraint score_reports_note_len check (char_length(note) <= 500)
);

create unique index score_reports_one_pending_idx
  on public.score_reports (match_id)
  where status = 'pending';

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  opened_by uuid not null references public.profiles (id),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution text not null default '',
  resolved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint disputes_reason_len check (char_length(reason) between 10 and 2000)
);

create table public.forfeit_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  recorded_by uuid not null references public.profiles (id),
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (match_id, team_id)
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null,
  author_id uuid not null references public.profiles (id),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger news_touch
  before update on public.news_posts
  for each row execute function private.touch_updated_at();

create table public.forum_boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0
);

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.forum_boards (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint forum_threads_title_len check (char_length(title) between 3 and 120),
  constraint forum_threads_body_len check (char_length(body) between 1 and 8000)
);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint forum_replies_body_len check (char_length(body) between 1 and 8000)
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'waiting', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_subject_len check (char_length(subject) between 3 and 140)
);

create trigger tickets_touch
  before update on public.tickets
  for each row execute function private.touch_updated_at();

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint ticket_messages_body_len check (char_length(body) between 1 and 8000)
);

create table public.bans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  issued_by uuid not null references public.profiles (id),
  reason text not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  constraint bans_reason_len check (char_length(reason) between 3 and 500)
);

create index bans_profile_idx on public.bans (profile_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.seasons enable row level security;
alter table public.divisions enable row level security;
alter table public.registrations enable row level security;
alter table public.matches enable row level security;
alter table public.map_actions enable row level security;
alter table public.reschedule_proposals enable row level security;
alter table public.score_reports enable row level security;
alter table public.disputes enable row level security;
alter table public.forfeit_events enable row level security;
alter table public.news_posts enable row level security;
alter table public.forum_boards enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.bans enable row level security;

comment on column public.profiles.is_admin is
  'Steward flag. Set from the SQL editor or by an existing steward. Never trust the client or auth user metadata for this.';
