# Deploy Frontend + Backend on Vercel in Under 30 Minutes

Use **two Vercel projects** (same repo): one for the frontend, one for the backend. Then connect them with one environment variable.

---

## Prerequisites

- GitHub (or GitLab/Bitbucket) account
- [Vercel account](https://vercel.com/signup) (free)
- This repo pushed to a Git remote

---

## Part 1: Deploy the backend (~10 min)

### 1.1 Create the backend project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your Git repository (this repo).
3. **Configure:**
   - **Project Name:** e.g. `peer-review-backend`
   - **Root Directory:** Click **Edit** and set to **`peer-review-backend-one`**
   - **Framework Preset:** Other (or leave as detected)
   - **Build Command:** leave empty (Vercel runs the Python runtime)
   - **Output Directory:** leave empty
4. **Environment variables:** Add at least these (you can add more later from `peer-review-backend-one/app.env`):

   | Name | Value |
   |------|--------|
   | `PROJECT_NAME` | `Energy Intelligence Dashboard` |
   | `SECRET_KEY` | Any long random string (e.g. from [randomkeygen.com](https://randomkeygen.com)) |
   | `USE_MOCK_DATA` | `true` *(use `false` and set DB/AI vars for real data)* |

   For **real** data, also add from `peer-review-backend-one/app.env`:  
   `DATABASE_TYPE`, `DATABRICKS_*` or `SNOWFLAKE_*`, `OPENAI_API_KEY` or `AZURE_*` / `GEMINI_API_KEY`, etc.

5. Click **Deploy**. Wait for the build to finish.

### 1.2 Get the backend URL

- After deploy, open the project → **Settings** → **Domains**, or use the deployment URL shown (e.g. `https://peer-review-backend-xxx.vercel.app`).
- Copy this URL — you need it for the frontend. Example: `https://peer-review-backend-xxx.vercel.app`

### 1.3 Allow the frontend origin (CORS)

- In the **same** backend project on Vercel, go to **Settings** → **Environment Variables**.
- Add:
  - **Name:** `BACKEND_CORS_ORIGINS`
  - **Value:** `["https://YOUR-FRONTEND-URL.vercel.app"]`  
    Replace with your actual frontend URL (you’ll get it after deploying the frontend in Part 2).  
    For multiple URLs (e.g. previews): `["https://your-app.vercel.app","https://your-app-*.vercel.app"]`
- **Redeploy** the backend once so the new env var is applied.

---

## Part 2: Deploy the frontend (~10 min)

### 2.1 Create the frontend project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) again (new project).
2. **Import** the **same** Git repository.
3. **Configure:**
   - **Project Name:** e.g. `peer-review-frontend`
   - **Root Directory:** **`peer-review-frontend-one`**
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment variables:** Add one variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** Your **backend** URL from Part 1 (no trailing slash), e.g. `https://peer-review-backend-xxx.vercel.app`
5. Click **Deploy**. Wait for the build to finish.

### 2.2 Get the frontend URL

- Copy the deployment URL (e.g. `https://peer-review-frontend-xxx.vercel.app`).

---

## Part 3: Connect backend CORS to frontend (~5 min)

1. Open the **backend** project on Vercel.
2. **Settings** → **Environment Variables**.
3. Set or update **`BACKEND_CORS_ORIGINS`** to include your **frontend** URL, e.g.  
   `["https://peer-review-frontend-xxx.vercel.app"]`
4. Go to **Deployments** → open the **⋮** on the latest deployment → **Redeploy** (use existing build cache is fine).

---

## Part 4: Verify (~5 min)

1. Open the **frontend** URL in the browser (e.g. `https://peer-review-frontend-xxx.vercel.app`).
2. Log in or use the app; it should call the backend (e.g. `/api/...`) on the backend URL.
3. If you see **CORS** errors in the browser console, double-check:
   - `BACKEND_CORS_ORIGINS` on the backend includes the exact frontend origin (with `https://`, no trailing slash).
   - You redeployed the backend after changing env vars.

---

## Quick reference

| Step | Where | What |
|------|--------|------|
| 1 | Vercel → New project | Import repo, **Root Directory** = `peer-review-backend-one`, add env vars, deploy |
| 2 | Backend project | Copy deployment URL |
| 3 | Vercel → New project | Import same repo, **Root Directory** = `peer-review-frontend-one`, set **`VITE_API_BASE_URL`** = backend URL, deploy |
| 4 | Backend project | Set **`BACKEND_CORS_ORIGINS`** = `["https://your-frontend-url.vercel.app"]`, redeploy |

---

## Optional: Same repo, one dashboard

- Both projects can point to the **same** GitHub repo; only **Root Directory** differs (`peer-review-backend-one` vs `peer-review-frontend-one`).
- Every push can auto-deploy both if you connected the repo twice (once per project).

---

## Troubleshooting

- **Backend build fails:** Ensure **Root Directory** is `peer-review-backend-one` and required env vars are set (at least `PROJECT_NAME`, `SECRET_KEY`, `USE_MOCK_DATA`).
- **Frontend shows “Failed to fetch” / CORS:** Add the frontend URL to `BACKEND_CORS_ORIGINS` on the backend and redeploy.
- **API 404:** Backend is deployed as a single serverless function; all routes (e.g. `/api/usage/...`) are handled by the same app. If you see 404, check the backend deployment logs.
- **Slow first request:** Normal on serverless (cold start). Subsequent requests are faster.
