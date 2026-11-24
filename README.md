# Wizard & Witch Amateur League

A static site for an original North American Counter-Strike 2 amateur league. The browser talks to Supabase for accounts, the ledger, and scoreboard screenshots. Add `?demo=1` to any URL to use the built-in sample ledger instead.

Season I is **the Ashen Oath**: seven weeks, two best-of-ones a week, then a playoff bracket. Divisions are Open, Contender, Challenger, and Apex. The steward account is **Sender**. Admin power is the `is_admin` flag on `profiles`, enforced by row level security and `SECURITY DEFINER` helpers in the unexposed `private` schema. The browser never decides who is a steward.

## Demo mode

```bash
npm install
npm run dev
```

Open http://127.0.0.1:41721/wwal/?demo=1 . The path starts with `/wwal/` because that is the GitHub Pages project base. Seeded demo accounts all use the password `ashen-oath`:

| Email | Who |
| --- | --- |
| sender@wwal.league | Sender, the steward |
| marrow@wwal.league | Captain of Coven of Ash |
| gilt@wwal.league | Captain of Gilded Sigil |
| cinder@wwal.league | Captain of Emberquill |
| pond@wwal.league | Captain of Pondwitch Union |

`/wwal/?demo=1&as=Sender` signs that demo profile in before the first paint. The `as` switch does nothing unless demo mode is on. **Reset the book** on the demo bar clears the browser copy of the ledger.

## Supabase

The site defaults to the public project `https://ifgokhaadkhjtdtbqzjg.supabase.co` and the publishable key in `.env.example`. Those values are safe to commit. A Pages build uses the same defaults unless the repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Never put a `service_role` key or an `sb_secret_` key in a `VITE_` variable. The app refuses to boot if it detects one.

Auth email links redirect to `https://mjmasters91.github.io/wwal/`. That URL has to be allowed in the Supabase Auth redirect list. Apply the SQL yourself before expecting the live ledger to load. From the SQL editor, run the migration files in order, then `supabase/seed.sql`. With the CLI, from this directory:

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

`dist/` is the GitHub Pages artifact. Assets are prefixed with `/wwal/`, and `dist/404.html` is a copy of `index.html` so a direct visit to a route such as `/standings` still loads the app. Preview it at http://127.0.0.1:41721/wwal/ .

Pushing `main` runs `.github/workflows/pages.yml`, which builds with Vite and deploys `dist/` using `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`. The live site is https://mjmasters91.github.io/wwal/ . Add `?demo=1` there to browse the sample season without the database.
