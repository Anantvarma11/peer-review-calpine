# Docker: Run and Deploy Frontend + Backend Together

You can run both the frontend and backend in one place using Docker. One entrypoint (port 80) serves the app; the frontend’s nginx proxies `/api/*` to the backend.

---

## Quick start (local)

1. **Backend env**  
   Create `peer-review-backend-one/.env` (e.g. copy from `peer-review-backend-one/app.env` and set real secrets). The backend needs DB and API keys; without a valid `.env`, the backend may fail to start or use mock data.

2. **From repo root:**

   ```bash
   docker compose up --build
   ```

3. Open **http://localhost** in your browser. The UI is served by the frontend container; API calls go to the same host and nginx forwards them to the backend.

---

## How it works

- **Root `docker-compose.yml`** defines two services: `backend` (FastAPI) and `frontend` (Vite build + nginx).
- The frontend is built with **`VITE_API_BASE_URL=same`** so the SPA uses relative `/api`; nginx proxies `/api/` to the backend. No CORS setup is needed when both are behind the same host.
- Only port **80** is exposed (frontend). The backend is not exposed on the host.

---

## Deploying the same stack (one place, two containers)

These options let you deploy the **same** Docker setup (frontend + backend together, one public URL).

### Option A: Railway

- Connect the repo and add a **root** `Dockerfile` that Railway will use, **or** use a service per app (see below).
- **Single-service approach:** Use a root Dockerfile that runs both (e.g. nginx + backend via a process manager). That requires adding a custom root Dockerfile.
- **Two services:** Create two services from the same repo: one with **Root Directory** `peer-review-frontend-one` and Dockerfile, one with **Root Directory** `peer-review-backend-one` and Dockerfile. Set the frontend’s env `VITE_API_BASE_URL` to the backend’s Railway URL (e.g. `https://your-backend.up.railway.app`). Then you have two URLs (frontend + API); for true “one URL” you’d put a proxy in front (e.g. Cloudflare).

Railway also has **Docker Compose** support (e.g. import from `docker-compose.yml`); check their docs for the current flow.

### Option B: Single server (VPS)

- On a VPS (DigitalOcean, Linode, AWS EC2, etc.):

  ```bash
  git clone <your-repo>
  cd peer-review-calpine
  # Create peer-review-backend-one/.env
  docker compose up -d --build
  ```

- Point your domain to the server and open port 80 (and 443 if you add TLS, e.g. with Caddy or nginx on the host or in front of Docker).

### Option C: Render (two services, one app URL via custom domain)

- Create two **Web Services** from the same repo:
  - **Backend:** Root directory `peer-review-backend-one`, type **Docker**, add env vars (DB, secrets).
  - **Frontend:** Root directory `peer-review-frontend-one`, type **Docker**, add build env **`VITE_API_BASE_URL`** = backend’s Render URL (e.g. `https://your-backend.onrender.com`).
- Use a **single custom domain** for the frontend and keep the backend on its `*.onrender.com` URL; the frontend will call the backend via that URL. For “one URL” for both UI and API, you’d need a reverse proxy (e.g. Cloudflare) or Render’s private networking + a single public service that proxies.

### Option D: Fly.io

- Fly.io runs one or more **apps** (containers). To mimic “one URL” with this repo you can:
  - Use **one app** with a Dockerfile that runs both nginx (frontend) and the backend (e.g. with `supervisord` or a small script), **or**
  - Use **two apps** (frontend + backend) and set the frontend’s `VITE_API_BASE_URL` to the backend app’s URL.

---

## Summary

| Goal | Approach |
|------|----------|
| **Local** | `docker compose up --build` from repo root; create `peer-review-backend-one/.env`. |
| **One URL, same host** | Deploy the root `docker-compose` to a VPS and expose port 80 (and optionally 443). |
| **Managed PaaS** | Use Railway / Render / Fly.io with two services (frontend + backend), set `VITE_API_BASE_URL` to the backend URL; or use a single custom Dockerfile that runs both for one app. |

The root **`docker-compose.yml`** is the reference for “run both together”; adapt the same idea to your chosen platform (compose on a server, or two services + env var for the API URL).
