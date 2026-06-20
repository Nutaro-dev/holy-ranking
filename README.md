# Holy Ranking

Community ranking app for HOLY Energy, Iced Tea & Hydration flavors.

## Stack

- Next.js 14 (App Router, standalone output)
- Tailwind CSS + Framer Motion
- Supabase Cloud (Auth + Postgres + RLS)
- Wilson-Score + weighted rank aggregation (0.6 / 0.4)

## Quick Start (Local Dev — Supabase Cloud)

No Docker required for local development. The app talks directly to your hosted Supabase project.

### 1. Create a Supabase Cloud project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://abcdefgh.supabase.co`)
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Open **API Keys** and copy the **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY` (server-only).

> **Note:** The new `sb_publishable_*` / `sb_secret_*` keys replace the legacy `anon` / `service_role` JWT keys. They work as drop-in replacements in `@supabase/supabase-js` — pass them to `createClient(url, key)` as usual; no extra headers or JWKS config needed (JWKS is fetched from `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json` automatically).

### 2. Environment setup

```powershell
# Windows
Copy-Item .env.example .env.local
```

```bash
# macOS / Linux
cp .env.example .env.local
```

Edit `.env.local` and set your real values:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard → API Keys → Publishable key |
| `SUPABASE_SECRET_KEY` | Dashboard → API Keys → Secret key |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev |

Never commit `.env.local` or real secret keys to git.

### 3. Run database migrations & seed products

Add your **Database connection string** to `.env.local` (Dashboard → Project Settings → Database → URI, Transaction pooler):

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

Then run (applies migrations + fetches all HOLY flavors with real images from holy.de):

```bash
npm run setup-db
```

Or step by step:

```bash
npm run apply-migrations   # schema + RLS + Wilson scoring
npm run seed-products        # ~77 Sorten mit Shopify-Bildern
```

**Alternative — SQL Editor:** paste `supabase/cloud-setup.sql` in Dashboard → SQL Editor, then `npm run seed-products`.

Product lines seeded: **Energy (35)**, **Iced Tea (16)**, **Hydration (20)**, **Milkshake (6)** — images from `cdn.shopify.com` (official HOLY shop).

### 4. Configure Auth redirects

In **Dashboard → Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

Enable **Email** provider under **Authentication → Providers** if not already on.

### 5. Install & run Next.js

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Register & Login

- **Register:** `/register` — email + password (`supabase.auth.signUp`)
- **Login:** `/login` — email + password (`supabase.auth.signInWithPassword`)
- **Magic Link:** optional tab on `/login` for passwordless OTP login

If email confirmation is enabled in Supabase, new users must click the confirmation link before signing in.

## Admin Setup

1. Register or sign in at `/login` or `/register`
2. Promote your account:

```bash
npm run promote-admin -- your@email.com
```

Requires `SUPABASE_SECRET_KEY` in `.env.local`.

## Cloudflare Tunnel

See `cloudflared/config.example.yml`. Point tunnel to `localhost:3000` and set:

- `NEXT_PUBLIC_SITE_URL`
- Supabase Auth redirect URLs to your public domain + `/auth/callback`

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/` | Pages & routes |
| `src/app/login/`, `src/app/register/` | Auth (sign in / sign up) |
| `src/lib/supabase/` | Supabase clients & env helpers |
| `src/lib/actions/` | Server actions |
| `supabase/migrations/` | SQL schema, RLS, scoring |
| `supabase/seed.sql` | 3 lines, 21 flavors |
| `supabase/config.toml` | Supabase CLI project link |
| `scripts/promote-admin.ts` | Admin promotion |
| `docker-compose.yml` | Optional self-hosted Supabase stack |

## Scoring

Global score = `0.6 × Wilson lower bound (likes) + 0.4 × normalized avg rank`

Sort options: score, product_line, newest, most_voted

## Optional: Self-Hosted Supabase (Docker)

The repo still includes `docker-compose.yml` for a local Supabase stack. This is **not required** when using Supabase Cloud. See `.env.example` comments and `scripts/generate-env.ps1` / `generate-env.sh` for Docker-specific variables.

## Troubleshooting

### `fetch failed` / connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Dashboard project URL (`https://xxx.supabase.co`).
- Confirm publishable and secret keys are from the same project.
- Restart `npm run dev` after changing `.env.local`.

### Login returns "Invalid login credentials"

- Check email/password, or confirm the account via email if confirmation is required.
- In Dashboard → Authentication → Providers, ensure Email is enabled.

### Rankings empty after setup

- Migrations not applied — run `supabase db push` or SQL files manually.
- Seed not run — execute `supabase/seed.sql` in SQL Editor.

### Auth redirect fails

- Add `http://localhost:3000/auth/callback` to **Authentication → URL Configuration → Redirect URLs**.

### Legacy env var names

The app accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` as fallbacks, but new projects should use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`.
