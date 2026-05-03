# Studio Frontend

React + Vite + Tailwind + shadcn UI for **ClawStudio** — the AI agent
orchestration platform. Talks to the standalone API at
[`sunpratik1772/studio-backend`](https://github.com/sunpratik1772/studio-backend).

---

## Architecture

```
src/
├── main.tsx              # Entry; calls setBaseUrl(VITE_API_BASE_URL)
├── App.tsx               # Wouter router + ThemeProvider + QueryClient
├── index.css             # Tailwind v4 + theme tokens (4 themes)
├── components/
│   ├── layout.tsx              # Sidebar shell
│   ├── theme-provider.tsx      # 4-theme context + localStorage persistence
│   ├── theme-toggle.tsx        # Dropdown picker
│   ├── parallel-execution-map.tsx
│   └── ui/                     # shadcn components
├── pages/
│   ├── dashboard.tsx           # Gateway dashboard, charts, fan-out widget
│   ├── run.tsx                 # Claude/ChatGPT-style chat with thinking trace
│   ├── skills.tsx              # Skills matrix CRUD
│   ├── trace.tsx               # Per-session step inspector
│   └── logs.tsx                # Memory log explorer
└── lib/
    ├── utils.ts                # cn() helper
    └── api-client/             # Generated React Query hooks + Zod schemas
        ├── index.ts
        ├── custom-fetch.ts     # setBaseUrl, setAuthTokenGetter, ApiError
        └── generated/          # orval output (api.ts, api.schemas.ts)
```

### Tech

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Runtime      | Node 22 (build only); evergreen browsers (runtime)  |
| Bundler      | Vite 7 + `@vitejs/plugin-react`                     |
| Styling      | Tailwind CSS v4 (Oxide engine via `@tailwindcss/vite`) |
| Components   | shadcn/ui (Radix primitives + CVA)                  |
| Routing      | Wouter (lightweight)                                |
| Data         | TanStack Query v5 + orval-generated hooks           |
| Validation   | Zod (shared schemas with backend)                   |
| Themes       | Dark / Light / Claude (warm cream) / Turquoise      |

### Themes

Four palettes live in `src/index.css`. The active theme is a class on `<html>`:

| Theme       | Class         | Vibe                                          |
| ----------- | ------------- | --------------------------------------------- |
| Dark        | `.dark`       | Vercel-style true black                       |
| Light       | (none)        | Pure white, minimal                           |
| Claude      | `.claude`     | Warm cream + amber, paper feel                |
| Turquoise   | `.turquoise`  | Pale mineral teal, matte                      |

The bootstrap script in `index.html` reads the saved theme synchronously
(no flash). User preference persists in `localStorage["clawstudio.theme"]`.

---

## Local development

### Prereqs

- Node 22+
- A running `studio-backend` instance (see that repo's README).

### Run

```bash
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL (or leave empty for same-origin)

npm install
npm run dev             # http://localhost:5173
```

`vite.config.ts` reads `PORT` (default `5173`) and `BASE_PATH` (default `/`)
from the environment. Both are optional.

### Production build

```bash
VITE_API_BASE_URL=https://studio-backend-xxxxx-uc.a.run.app npm run build
npm run preview         # serves dist/ on $PORT (default 4173)
```

The base URL is **baked in at build time** — there's no runtime discovery.
This keeps the bundle a pure static asset that any CDN can serve.

---

## Environment variables

All Vite env vars must start with `VITE_` to be exposed to the bundle.

| Variable             | Required | Default | Notes                                            |
| -------------------- | :------: | ------- | ------------------------------------------------ |
| `VITE_API_BASE_URL`  |          | `""`    | Backend origin (no trailing slash). Empty = same-origin. |
| `PORT`               |          | `5173`  | Local dev / `vite preview` port. Cloud Run overrides. |
| `BASE_PATH`          |          | `/`     | Subpath the SPA is mounted at.                   |

---

## Docker

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://studio-backend-xxxxx-uc.a.run.app \
  -t studio-frontend .

docker run --rm -p 8080:8080 -e PORT=8080 studio-frontend
```

The image is multi-stage:

1. `node:22-alpine` — installs deps, runs `vite build` → `dist/`.
2. `nginx:1.27-alpine` runtime — serves `dist/` via nginx with SPA fallback.

The nginx config is a **template**: at boot, nginx substitutes `${PORT}`
into the `listen` directive, so the same image works on Cloud Run (port
8080) and any other PaaS.

Final image is ~50 MB.

---

## Deploying to Google Cloud Run

```bash
BACKEND_URL=https://studio-backend-xxxxx-uc.a.run.app

# 1. Build with the backend URL baked in
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/studio/studio-frontend:latest \
  --substitutions=_VITE_API_BASE_URL=$BACKEND_URL \
  # OR equivalently using docker buildx + push:
  # docker buildx build --build-arg VITE_API_BASE_URL=$BACKEND_URL --push -t … .

# 2. Deploy
gcloud run deploy studio-frontend \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/studio/studio-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### Why a Cloud Build `--substitutions` flag isn't enough

`gcloud builds submit --tag …` builds a single image and **does not** forward
arbitrary substitutions into Docker `--build-arg`. Use one of these instead:

**Option A — buildx + Artifact Registry (one-liner):**

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL \
  --tag us-central1-docker.pkg.dev/$PROJECT_ID/studio/studio-frontend:latest \
  --push .
```

**Option B — `cloudbuild.yaml`:**

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - --build-arg
      - VITE_API_BASE_URL=${_VITE_API_BASE_URL}
      - -t
      - us-central1-docker.pkg.dev/$PROJECT_ID/studio/studio-frontend:latest
      - .
images:
  - us-central1-docker.pkg.dev/$PROJECT_ID/studio/studio-frontend:latest
substitutions:
  _VITE_API_BASE_URL: ""
```

Then:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_VITE_API_BASE_URL=$BACKEND_URL .
```

### CORS

The backend defaults to `CORS_ORIGIN=*`. In production, lock it down to
your frontend's Cloud Run URL:

```bash
gcloud run services update studio-backend \
  --update-env-vars CORS_ORIGIN=https://studio-frontend-xxxxx-uc.a.run.app
```

### Same-origin alternative

If you'd rather deploy both behind a single domain (no CORS needed),
front them with a Google HTTPS Load Balancer:

- `https://studio.example.com/api/*` → studio-backend
- `https://studio.example.com/*`     → studio-frontend

Then build the frontend with **no** `VITE_API_BASE_URL` so the client
issues relative `/api/...` requests.

---

## Troubleshooting

**Blank page in production but works in dev**
The browser is loading the bundle but every API call 404s. Check that
`VITE_API_BASE_URL` was actually passed at build time:
`docker run --rm studio-frontend grep -ro 'VITE_API_BASE_URL[^"]*' /usr/share/nginx/html | head -2`.

**CORS errors in the browser console**
The backend's `CORS_ORIGIN` doesn't include the frontend origin. Update the
backend env var (see above).

**Theme flashes dark before switching to your saved theme**
The inline script in `index.html` should run before React mounts.
If you've moved/removed it, restore the snippet that reads
`localStorage["clawstudio.theme"]` synchronously in `<head>`.

---

## Keeping in sync with the monorepo

This repo is a **published snapshot** of the monorepo. The directories below
are inlined copies of upstream packages:

| Path here                | Upstream in monorepo                    |
| ------------------------ | --------------------------------------- |
| `src/` (excl. `lib/`)    | `artifacts/clawstudio/src/`             |
| `src/lib/api-client/`    | `lib/api-client-react/src/`             |
| `index.html`, `components.json`, `public/` | `artifacts/clawstudio/`     |

The shared import path `@workspace/api-client-react` is preserved in the
source and resolved at both typecheck time (tsconfig `paths`) and build time
(Vite `resolve.alias`), so refreshing only requires recopying the files —
no source rewrites.

---

## License

MIT — internal demo project.
