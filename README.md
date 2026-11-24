# Wizard & Witch Amateur League

A static site for an original North American Counter-Strike 2 amateur league. The browser talks to Supabase for accounts, the ledger, and scoreboard screenshots. With no environment variables, the same UI runs on a built-in demo ledger so you can click through a season without a backend.

Season I is **the Ashen Oath**: seven weeks, two best-of-ones a week, then a playoff bracket. Divisions are Open, Contender, Challenger, and Apex. The steward account is **Sender**. Admin power is the `is_admin` flag on `profiles`, enforced by row level security and `SECURITY DEFINER` helpers in the unexposed `private` schema. The browser never decides who is a steward.

## Demo mode

```bash
npm install
npm run dev
```

Open http://127.0.0.1:41721 . If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, the site stays on the sample season. Seeded demo accounts all use the password `ashen-oath`:

| Email | Who |
| --- | --- |
| sender@wwal.league | Sender, the steward |
| marrow@wwal.league | Captain of Coven of Ash |
| gilt@wwal.league | Captain of Gilded Sigil |
| cinder@wwal.league | Captain of Emberquill |
| pond@wwal.league | Captain of Pondwitch Union |

`/?as=Sender` signs that demo profile in before the first paint. It does nothing once Supabase is connected. **Reset the book** on the demo bar clears the browser copy of the ledger.

## Connect Supabase

Do this on a project you create yourself. This repository does not ship a hosted project.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and the publishable or anon key.
3. Never put a `service_role` key or an `sb_secret_` key in a `VITE_` variable. The app refuses to boot if it detects one.

Apply the SQL in order, then the seed. From the Supabase SQL editor that is four migration files plus `supabase/seed.sql`. With the CLI, from this directory:

```bash
supabase start
supabase db reset
```

`db reset` runs `supabase/migrations/` and then `supabase/seed.sql`. Local auth has email confirmation off. Sign in as `sender@wwal.league` / `ashen-oath`, then change that password before anyone else can reach the project.

To name a different steward, create their account and run this in the SQL editor (it bypasses the client, which is the point):

```sql
update public.profiles
set is_admin = true
where username = 'Sender';
```

A signed-in player cannot set `is_admin` on themselves. A trigger puts the flag back.

### Migration files

- `supabase/migrations/20261124231250_schema.sql`
- `supabase/migrations/20261124231251_guards.sql`
- `supabase/migrations/20261124231252_policies.sql`
- `supabase/migrations/20261124231253_storage_and_standings.sql`
- `supabase/seed.sql`

Every public table has row level security. Screenshot proof goes in the private `match-proof` bucket. Confirmed scoreboards can be read with the anon key. Pending proof is limited to the two rosters and stewards. The `public.standings` view uses `security_invoker` and matches the table on the site: wins, round difference, rounds for, then name. Three forfeits mark a coven inactive and drop them under the playoff line.

## Production build

```bash
npm run build
npm run preview
```

`dist/` is a static site. Host it on any static host. The Supabase URL and anon key are baked in at build time, so set the `VITE_` variables in the host's build environment, then rebuild. Demo mode is what you get when those variables are absent at build time.

Auth redirects in `supabase/config.jsonc` point at `http://127.0.0.1:41721` for local CLI use. Set the hosted project's site URL to wherever you deploy `dist/`.
