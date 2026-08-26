# ReachInbox Email Job Scheduler

Production-slice email scheduler: Express + BullMQ + Redis + Postgres backend, Next.js dashboard frontend.

complete and verified end to end against real Postgres/Redis/Ethereal.

## Project layout

```
.
├── docker-compose.yml     # Postgres + Redis
├── backend/                # Express + TypeScript API + BullMQ worker
│   └── src/
│       ├── config/         # env loading, per-sender SMTP config
│       ├── db/             # Drizzle schema + client
│       ├── queues/         # BullMQ queue + Redis connection
│       ├── workers/        # BullMQ worker process
│       ├── services/       # business logic (scheduling, rate limiting, SMTP)
│       ├── routes/         # Express route handlers
│       └── middleware/     # auth middleware
└── frontend/                # Next.js + Tailwind + TypeScript dashboard
```
## Setup

```bash
docker compose up -d
```

```bash
cd backend
cp .env.example .env   
npm install
npm run db:migrate     
npm run dev           
npm run worker         
```


```bash
node -e "require('nodemailer').createTestAccount().then(a => console.log(a.user, a.pass))"
```

```bash
npm run dev:seed-user
```

```bash
cd frontend
npm install
npm run dev            # dashboard on :3000
```

### Docker port setup
## Google OAuth setup (Phase 3)

Login is real Google OAuth (`google-auth-library`, server-side authorization-code flow) — there's no mock path.
1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Application type: **Web application**).
2. Added an **Authorized redirect URI**: `http://localhost:/api/auth/google/callback`
3. Added an **Authorized JavaScript origin**: `http://localhost:3000`
4. I then Copied the generated Client ID and Client Secret into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=http://localhost:/api/auth/google/callback
   ```
5. Restart the backend (`npm run dev`), open `http://localhost:3000`, click "Sign in with Google".

## Configuration


 `WORKER_CONCURRENCY`  -BullMQ worker concurrency (jobs processed in parallel) 
 `MIN_DELAY_BETWEEN_EMAILS_MS`  Minimum delay enforced between individual email sends 
 `MAX_EMAILS_PER_HOUR` Global cap on emails sent per rolling hour window (here 0 = disabled) 
 `MAX_EMAILS_PER_HOUR_PER_SENDER` -Per-sender cap on emails sent per rolling hour window (same 0 = disabled) 
 `SMTP_SENDER_IDS` + `SENDER_<ID>_*` -Multiple Ethereal SMTP sender identities 

## API

## Throughput, rate limiting & concurrency (implemented)

### 1. Neon (Postgres)

### 2. Redis Cloud (Redis)

### 3. Google Cloud Console — add production URLs

### 4. Render (backend + worker)

### 5. Vercel (frontend)
