# Helpdesk Ticketing — Backend

NestJS REST API for the Helpdesk Ticketing System. Handles authentication, ticket lifecycle management, role-based access control, file attachments, and analytics aggregation.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Runtime    | Node.js 18+                             |
| Framework  | NestJS                                  |
| ORM        | Prisma                                  |
| Database   | PostgreSQL                              |
| Cache      | Redis (analytics in-memory TTL cache)  |
| Auth       | JWT + Refresh Token rotation            |
| Email      | Nodemailer (fire-and-forget)            |
| Validation | class-validator + class-transformer     |
| API Docs   | Swagger / OpenAPI (`/api/docs`)         |

---

## Local Development

### Prerequisites
- Docker Desktop (for PostgreSQL + Redis)
- Node.js 18+

### 1. Start infrastructure
```bash
# from repo root
docker-compose up -d
```
PostgreSQL runs on port **5433** (not 5432) to avoid conflicts.

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env if needed — defaults work with docker-compose
```

### 4. Run migrations and seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start dev server
```bash
npm run start:dev
```

API is available at `http://localhost:3001/api`
Swagger docs at `http://localhost:3001/api/docs`

---

## Module Structure

```
src/
├── analytics/        # KPI aggregations (ADMIN|SUPERVISOR only)
├── tickets/          # Core ticket CRUD + state machine
├── tracking/         # Append-only audit log
├── attachments/      # File upload/download (local disk)
├── agents/           # Agent management
├── departments/      # Department reference data
├── categories/       # Category reference data
├── ticket-types/     # Ticket type reference data
├── auth/             # JWT strategy, guards, refresh rotation
├── mail/             # Nodemailer templates (fire-and-forget)
├── common/           # Enums, guards, filters, pipes
└── prisma/           # PrismaService singleton
```

---

## Key Commands

```bash
npm run start:dev       # Dev server with hot reload
npm run build           # Compile to dist/
npm run start:prod      # Run compiled output

npx prisma migrate dev  # Create + apply migration
npx prisma db seed      # Seed demo data (idempotent)
npx prisma studio       # GUI database browser

npm run test            # Unit tests
npm run test:e2e        # E2E tests
npm run test:cov        # Coverage report
```

---

## Production (Railway)

The backend is deployed via Dockerfile on Railway. On every push to `master`:

1. Railway builds the Docker image (`npm run build` inside multi-stage Dockerfile)
2. `start.sh` runs on container start:
   - `prisma migrate deploy` — apply pending migrations
   - `node dist/prisma/seed.js` — seed reference data (idempotent)
   - `exec node dist/src/main.js` — start the API

> `nest build` outputs to `dist/src/` (not `dist/`) because `prisma.config.ts` at the backend root shifts the TypeScript `rootDir`. This is documented in `CLAUDE.md`.

Health check: `GET /api/health` → `{"status":"ok","timestamp":"...","uptime":42}`

### Required environment variables (Railway Variables tab)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Injected automatically by Railway PostgreSQL |
| `REDIS_HOST` | From Railway Redis service |
| `REDIS_PORT` | From Railway Redis service |
| `REDIS_PASSWORD` | From Railway Redis service |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` (different value) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Vercel production URL (for CORS) |
| `NODE_ENV` | `production` |
| `PORT` | Injected automatically by Railway — do not set |

---

## Default Demo Credentials

| Role       | Email                    | Password   |
|------------|--------------------------|------------|
| Admin      | admin@helpdesk.com       | Admin@1234 |
| Supervisor | supervisor@helpdesk.com  | Super@1234 |
| Agent      | agent@helpdesk.com       | Agent@1234 |

---

## License

MIT
