# Backend deployment (Anantvarma11)

Deploy the FastAPI backend so your Vercel frontend can call it.

## Option 1: Render (recommended, free tier)

1. **Create a Web Service**
   - Go to [render.com](https://render.com) → Dashboard → **New** → **Web Service**.
   - Connect **GitHub** and select repo **Anantvarma11/peer-review-calpine**.
   - Branch: **main**.

2. **Configure the service**
   - **Name:** `peer-review-backend` (or any name).
   - **Root Directory:** set to **`peer-review-backend-one`** (required).
   - **Runtime:** **Docker** (use the existing Dockerfile) **or** Python:
     - If **Python:** Build Command: `pip install -r requirements.txt`, Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   - **Instance type:** Free.

3. **Environment variables** (in Render dashboard → Environment)
   Add at least:

   | Key | Value |
   |-----|--------|
   | `PROJECT_NAME` | Energy Intelligence Dashboard |
   | `SECRET_KEY` | (generate a random string, e.g. `openssl rand -hex 32`) |
   | `USE_MOCK_DATA` | `true` (or `false` if you have Databricks/Snowflake credentials) |
   | `DATABASE_TYPE` | `databricks` or `snowflake` |
   | `BACKEND_CORS_ORIGINS` | `https://peer-review-calpine-two.vercel.app` (your Vercel frontend URL) |

   If **not** using mock data, also set your DB credentials (e.g. `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, etc.). Do **not** commit these; set them only in Render.

4. **Deploy**
   - Click **Create Web Service**. Render will build and deploy.
   - Copy the service URL (e.g. `https://peer-review-backend-xxxx.onrender.com`).

5. **Point the frontend to your backend**
   - In **Vercel** → your project **peer-review-calpine** → **Settings** → **Environment Variables**.
   - Add: **`VITE_API_BASE_URL`** = `https://peer-review-backend-xxxx.onrender.com` (your Render URL, no `/api`).
   - **Redeploy** the frontend so the new env var is used.

After this, the app at `peer-review-calpine-two.vercel.app` will call your backend on Render.

---

## Option 2: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → **Anantvarma11/peer-review-calpine**.
2. Set **Root Directory** to `peer-review-backend-one`, use the Dockerfile.
3. Add the same env vars as above; set **BACKEND_CORS_ORIGINS** to your Vercel URL.
4. Copy the generated URL and set **VITE_API_BASE_URL** in Vercel, then redeploy the frontend.

---

## CORS

Your backend must allow your frontend origin. Set:

- **BACKEND_CORS_ORIGINS** = `https://peer-review-calpine-two.vercel.app`

(Add more URLs if you use preview URLs or a custom domain.)

## Summary

| Step | Where | What |
|------|--------|------|
| 1 | Render (or Railway) | Deploy backend from repo, root dir `peer-review-backend-one` |
| 2 | Render env | Set `BACKEND_CORS_ORIGINS` = your Vercel URL |
| 3 | Vercel env | Set `VITE_API_BASE_URL` = your backend URL |
| 4 | Vercel | Redeploy frontend |
