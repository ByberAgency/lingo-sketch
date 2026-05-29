# Lingo Sketch

Turborepo monorepo with a NestJS API, React dashboard, Drizzle ORM, and site30-style OpenAPI codegen.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Google Cloud SQL PostgreSQL (`lingo-sketch` at `34.18.21.85`) — used for local dev and production
- Firebase project with Google and Email/Password sign-in enabled

## Database (live Cloud SQL everywhere)

Local development uses the **same live Cloud SQL instance** as production — there is no separate local Postgres.

| Setting | Value |
|---------|-------|
| Instance | `lingo-sketch` (me-central1) |
| Public IP | `34.18.21.85` |
| Database | `lingo_sketch` |
| SSL | required (`DATABASE_SSL=true`) |

### One-time setup

1. In GCP → **SQL → lingo-sketch → Connections → Networking:**
   - Enable **Public IP**
   - Add your machine's IP under **Authorized networks** (required for local dev)
2. Create the app database (once):

```bash
psql "postgresql://postgres:YOUR_PASSWORD@34.18.21.85:5432/postgres?sslmode=require" \
  -c "CREATE DATABASE lingo_sketch;"
```

3. Set `DATABASE_URL` in `.env` and `apps/api/.env`:

```bash
postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@34.18.21.85:5432/lingo_sketch?sslmode=require
DATABASE_SSL=true
```

4. Run migrations against the live database:

```bash
pnpm db:migrate
```

**Note:** If connection times out, your current IP is not authorized in Cloud SQL yet — add it in GCP and retry.

## Firebase setup

1. Create a Firebase project at https://console.firebase.google.com
2. **Authentication:** open the **Authentication** section and click **Get started** (required once per project)
3. **Authentication → Sign-in method:** enable **Email/Password** (and **Google** if you want Google sign-in)
4. **Project settings → Your apps:** add a **Web app** and copy the config values into `apps/dashboard/.env` and `apps/mobile/.env`
5. **Project settings → Service accounts:** generate a **new private key** (JSON)
6. Store the JSON outside the repo (e.g. `~/secrets/lingo-sketch-firebase-adminsdk.json`) and set `FIREBASE_SERVICE_ACCOUNT_PATH` in `apps/api/.env`
7. **Authentication → Settings → Authorized domains:** ensure `localhost` is listed

Do not commit the service account JSON or real API keys.

### Keeping secrets out of git

- Real values belong in `.env` files (gitignored) or Secret Manager — never in tracked files.
- Copy from [`.env.example`](.env.example) and fill in locally: `.env`, `apps/api/.env`, `apps/dashboard/.env`, `apps/mobile/.env`.
- Install the pre-commit guard (blocks `.env`, Firebase admin JSON, and obvious keys in staged diffs):

```bash
pnpm hooks:install
```

- Run manually before pushing: `pnpm secrets:check`

If a secret was ever pushed, rotate it in Firebase/GCP and treat the old value as compromised.

## Setup

1. Copy env files and fill in Cloud SQL + Firebase values:

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/dashboard/.env
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate OpenAPI spec and API client:

```bash
pnpm api:generate
```

4. Run Drizzle migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

5. Start dev servers:

```bash
pnpm dev
```

- API: http://localhost:3000/health
- Dashboard: http://localhost:5173 (redirects to `/login` when signed out)
- Mobile: `pnpm --filter @lingo-sketch/mobile dev` (Expo)

## Docker (API)

Build from the monorepo root:

```bash
docker build -f apps/api/Dockerfile -t lingo-sketch-api .
```

Run locally (uses `apps/api/.env` or root `.env`):

```bash
docker run --rm -p 3000:3000 --env-file apps/api/.env lingo-sketch-api
```

The container runs database migrations on startup, then starts the API on port `3000` (override with `PORT`).

### Deploy to Google Cloud Run

1. Build and push to Artifact Registry:

```bash
export PROJECT_ID=your-gcp-project
export REGION=me-central1

gcloud auth configure-docker ${REGION}-docker.pkg.dev

docker tag lingo-sketch-api ${REGION}-docker.pkg.dev/${PROJECT_ID}/lingo-sketch/api:latest
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/lingo-sketch/api:latest
```

2. Store secrets in Secret Manager (`DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON`, etc.).

3. Deploy (WebSockets need session affinity and a longer timeout):

```bash
gcloud run deploy lingo-sketch-api \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/lingo-sketch/api:latest \
  --region ${REGION} \
  --platform managed \
  --port 3000 \
  --session-affinity \
  --timeout 3600 \
  --set-env-vars DATABASE_SSL=true,FIREBASE_PROJECT_ID=your-firebase-project-id \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,FIREBASE_SERVICE_ACCOUNT_JSON=FIREBASE_SERVICE_ACCOUNT_JSON:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:lingo-sketch
```

For Cloud SQL over the public IP (as in local dev), omit `--add-cloudsql-instances` and point `DATABASE_URL` at the instance IP with `sslmode=require`.

In production, prefer `FIREBASE_SERVICE_ACCOUNT_JSON` (Secret Manager) over `FIREBASE_SERVICE_ACCOUNT_PATH`. Set `ALLOWED_ORIGINS` to your dashboard and mobile origins.

## Mobile app

The React Native app lives in `apps/mobile` (Expo + expo-router). It uses the same Firebase Auth project and talks to the NestJS API — **not** Postgres directly. User data is stored in Cloud SQL via the API.

1. Copy Firebase config into `apps/mobile/.env` (same values as dashboard, prefixed with `EXPO_PUBLIC_`)
2. For a **physical device**, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.10:3000`)
3. Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` from Firebase Console for Google sign-in
4. Start Expo:

```bash
pnpm --filter @lingo-sketch/mobile dev
```

## Authentication

Firebase Auth handles sign-in (Google + email/password). The dashboard sends Firebase ID tokens as `Authorization: Bearer` headers. The API verifies tokens with `firebase-admin` and upserts users into Postgres.

Protected route: `GET /auth/me` (requires Bearer token).

## AI grammar guard

The API uses **Google Gemini** to check and correct user English in game chat (solo and 1:1). Without `GEMINI_API_KEY`, the API falls back to built-in rule-based checks.

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to `apps/api/.env`:

```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

3. Endpoint: `POST /grammar/check` (Bearer auth) — used by the mobile app while typing and enforced server-side for 1v1 chat

## OpenAPI workflow

When changing an API endpoint:

1. Update the NestJS controller
2. Add matching Zod schema + `registry.registerPath(...)` in `apps/api/src/openapi/generate-openapi.ts`
3. Run `pnpm api:generate`
4. Commit `apps/api/openapi.json` and `packages/api-client/src/generated/**`
5. Update dashboard hooks in `apps/dashboard/src/dashboard-api/` if needed

UI code imports from `@dashboard-api`, not directly from `@lingo-sketch/api-client`.

## Project structure

```
apps/
  api/          NestJS + Drizzle + Zod OpenAPI
  dashboard/    React + Vite + TanStack Query
  mobile/       React Native + Expo + Firebase Auth
packages/
  api-client/   Generated @hey-api/openapi-ts client
  typescript-config/
```
