# Deploying to Vercel

**Deploy frontend and backend on Vercel in under 30 min:** see **[VERCEL_30MIN_DEPLOY.md](./VERCEL_30MIN_DEPLOY.md)** for step-by-step instructions (two Vercel projects, same repo).

**Want to run frontend + backend together with Docker?** See [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md) for a single `docker compose up` and deployment options (VPS, Railway, Render, Fly.io).

---

## Can Vercel deploy frontend and backend together via Docker?

**No.** Vercel does **not** support deploying Docker containers. You cannot run a single Docker image (or docker-compose) that serves both frontend and backend on Vercel.

- **Vercel** is a serverless/static hosting platform: it builds your app (e.g. Vite) and serves the output; it does not run your own Docker images.
- **Backend on Vercel** would require converting the FastAPI app to serverless functions (e.g. Vercel Python serverless or Mangum), which is a different architecture and has limits (timeouts, cold starts, DB connection pooling). Your backend uses Snowflake/Databricks, startup logic, and long-lived connections—better suited to a long-running server (e.g. Render, Railway, Fly.io).
- **Recommended**: Deploy **frontend on Vercel** and keep **backend on Render** (or another host). The repo is already set up for this: the frontend calls `https://peer-review-backend-oed9.onrender.com/api` in production.

If you need frontend + backend in one place with Docker, use a platform that supports containers (e.g. **Railway**, **Render** with multiple services, **Fly.io**, or a VPS with docker-compose).

---

## Project overview

| Part | Path | Stack | Where to deploy |
|------|------|--------|------------------|
| **Frontend** | `peer-review-frontend-one/` | React, Vite, TypeScript | **Vercel** |
| **Backend** | `peer-review-backend-one/` | FastAPI (Python), Snowflake/Databricks | **Render** (already at `https://peer-review-backend-oed9.onrender.com`) |

The frontend uses `src/lib/api.ts`: in production it uses the Render API URL unless overridden by `VITE_API_BASE_URL`.

---

## Project audit (Vercel readiness)

### Frontend (`peer-review-frontend-one/`)

| Check | Status |
|-------|--------|
| **vercel.json** | Present: build command, output `dist`, SPA rewrites |
| **API base URL** | Uses `VITE_API_BASE_URL` or fallback to Render URL in prod |
| **No relative `/api` in browser** | Fixed: `AskPage.tsx` now uses `textToSpeech()` from `api.ts` instead of `fetch('/api/ai/tts')` |
| **Node** | `package.json` has `"engines": { "node": "20" }` — Vercel compatible |
| **Build** | `npm run build` runs `tsc && vite build` → output in `dist/` |

### Backend (for CORS when frontend is on Vercel)

| Check | Status |
|-------|--------|
| **CORS** | `main.py` uses dev origins + `settings.BACKEND_CORS_ORIGINS`; add your Vercel URL on Render (see below) |

### Inconsistencies fixed

1. **AskPage.tsx** previously used `fetch('/api/ai/tts', ...)`. On Vercel, `/api` would hit the frontend (and SPA rewrite), so TTS would fail. It now uses `textToSpeech()` from `@/lib/api`, which uses the correct backend base URL.
2. **Backend CORS** was hardcoded to localhost only. It now merges `BACKEND_CORS_ORIGINS` from config so you can set the Vercel frontend URL in production (e.g. on Render) without code changes.

---

## Deploy steps (frontend on Vercel)

### 1. Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → import this repository.
3. Set **Root Directory** to **`peer-review-frontend-one`** (not the repo root).
4. Framework: **Vite** (auto-detected).
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: `npm install`

### 2. Environment variables (optional)

To override the API URL:

- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://peer-review-backend-oed9.onrender.com` (no trailing slash; the app adds `/api`).

Redeploy after changing env vars so they are baked into the build.

### 3. Deploy

Click **Deploy**. Vercel will build and serve the frontend with SPA rewrites from `vercel.json`.

### 4. Backend CORS (after you have the Vercel URL)

Once the frontend is live (e.g. `https://your-app.vercel.app`), add that origin to the backend so the browser allows API requests.

**On Render** (or wherever the backend runs):

- Set env var **`BACKEND_CORS_ORIGINS`** to include the Vercel URL. The app expects a JSON array, e.g.:
  - `["https://your-app.vercel.app"]`
  - or multiple: `["https://your-app.vercel.app","https://preview-xxx.vercel.app"]`

Then redeploy the backend. No code change is needed; `main.py` already uses `settings.BACKEND_CORS_ORIGINS`.

---

## Summary

| Item | Action |
|------|--------|
| **Vercel + Docker** | Not supported; deploy frontend on Vercel, backend elsewhere (e.g. Render). |
| **Frontend** | Deploy from Vercel with root directory `peer-review-frontend-one`. |
| **Backend** | Keep on Render; set `BACKEND_CORS_ORIGINS` to your Vercel URL(s). |
| **Env** | Optionally set `VITE_API_BASE_URL` on Vercel if you use a different API. |
