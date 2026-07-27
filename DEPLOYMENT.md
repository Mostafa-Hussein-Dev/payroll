# Deployment — Vercel + Supabase

This guide deploys the app with **PostgreSQL on Supabase** and the **Next.js app on
Vercel**. Migrations are run from your machine; Vercel only builds and serves the app.

> Do not commit real secrets. The values below are placeholders — keep the real
> connection strings, `AUTH_SECRET`, and admin password in your local `.env`
> (which is git-ignored) and in Vercel's Environment Variables.

---

## 1. Create the database (Supabase)

1. **supabase.com** → **New project**. Choose a region and set a **strong database
   password** — save it.
2. After provisioning, open **Project Settings → Database → Connection string** and
   copy **two** connection strings:
   - **Pooled** (Transaction mode, port **6543**) → used at runtime → `DATABASE_URL`
   - **Direct / Session** (port **5432**) → used for migrations → `DIRECT_URL`

They look like this (replace `[PROJECT-REF]`, `[PASSWORD]`, `[REGION]`):

```
# DATABASE_URL — pooled, port 6543, add ?pgbouncer=true
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# DIRECT_URL — session/direct, port 5432
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Why two: Vercel's serverless functions use the **pooled** connection, but Prisma
migrations require a **direct** connection. The Prisma schema declares both via
`url` (`DATABASE_URL`) and `directUrl` (`DIRECT_URL`).

---

## 2. Initialize the schema in Supabase (run once, from your machine)

Point the two env vars at Supabase and apply the committed migrations + seed the
admin user. In the project folder:

**PowerShell (Windows):**

```powershell
$env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="a-strong-password"

npx prisma migrate deploy   # creates all tables in Supabase
npm run db:seed             # creates the admin user (+ a demo company)
```

**bash:**

```bash
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="a-strong-password"

npx prisma migrate deploy
npm run db:seed
```

Verify in Supabase → **Table Editor** that `User`, `Company`, `Employee`,
`PayrollRun`, `Payslip` exist.

> If the direct host `db.[PROJECT-REF].supabase.co:5432` refuses to connect from
> your network (some setups are IPv6-only), use the **Session pooler** host on port
> 5432 shown in the dashboard for `DIRECT_URL` — it is IPv4-friendly.

---

## 3. Deploy the app (Vercel)

1. **vercel.com** → sign in with GitHub → **Add New… → Project** → import this repo.
2. Framework preset auto-detects **Next.js**. Leave build settings default — the
   `build` script already runs `prisma generate`.
3. Add these **Environment Variables** (Production, and Preview if desired):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **pooled** 6543 string (with `?pgbouncer=true`) |
   | `DIRECT_URL` | the **direct** 5432 string |
   | `AUTH_SECRET` | a long random string (see below) |
   | `ADMIN_EMAIL` | same email you seeded |
   | `ADMIN_PASSWORD` | same password you seeded |

   Generate `AUTH_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy**. When the build finishes, open the URL and log in with your admin
   email + password.

---

## Operations

### Change the admin password

The seed resets the admin password hash on every run. Set a new `ADMIN_PASSWORD`
(with the Supabase env vars set) and re-seed:

```bash
export DATABASE_URL="...6543...?pgbouncer=true"
export DIRECT_URL="...5432..."
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="new-strong-password"
npm run db:seed
```

No redeploy needed — login reads the database live.

### Apply a new schema change

1. Edit `prisma/schema.prisma`, then locally: `npx prisma migrate dev --name <change>`
   (this runs against your **local** DB and writes a migration file).
2. Apply it to Supabase: with the Supabase env vars set, run
   `npx prisma migrate deploy`.
3. `git push` — Vercel auto-redeploys.

### Rotate the database password

Supabase → **Settings → Database → Reset password**, then update `DATABASE_URL` and
`DIRECT_URL` in both your local `.env` and Vercel's Environment Variables.

---

## Notes / gotchas

- **Migrations never run automatically on deploy** — always apply them yourself
  (step 2 / operations above) before or right after pushing schema changes.
- **`AUTH_SECRET` must be set on Vercel**, or login sessions won't verify.
- Session cookies are `secure` in production (handled in `src/lib/auth.ts`) — works
  automatically over Vercel's HTTPS.
- The seed creates a **"Demo Company"** on first run; delete it from the UI in prod.
- Keep real values out of git: `.env` is git-ignored; use `.env.example` as the
  template.
