# Helpdesk Ticketing System

## Overview

The **Helpdesk Ticketing System** is a centralized, enterprise-grade platform designed to manage and resolve support requests across departments with full auditability and structured workflows.

It enables users to submit tickets, agents to track and resolve issues, supervisors to oversee department queues, and administrators to manage the full lifecycle — from creation to verified closure.

> Built for scalability, transparency, and clean domain ownership across multi-department operations.

---

## Core Features

### 1. Ticket Creation
Users and agents can create support tickets with structured metadata:
- Agent Department
- Task Description
- Category
- Ticket Type
- Assigned Agent
- Priority Level
- Status

### 2. Smart Assignment
Tickets can be assigned to:
- A specific **agent**
- A **department queue** (unassigned pool)
- **Re-assigned** during any active stage

### 3. Full Lifecycle Tracking
Every ticket maintains a **chronological tracking log** capturing:
- Stage transitions
- Department handoffs
- Agent comments
- Verification checkpoints

### 4. Status Lifecycle

```
Open → Assigned → In Progress → Pending → Resolved → Verified → Closed
```

Edge states:
- `Reopened` — after resolution rejected
- `Escalated` — moved to higher authority
- `Cancelled` — withdrawn by requester or admin

### 5. Categorization
| Category         | Examples                        |
|------------------|---------------------------------|
| Software Issue   | App crash, bug, update failure  |
| Hardware Issue   | Device failure, peripheral      |
| Network Issue    | VPN, connectivity, DNS          |
| Account Access   | Password reset, permissions     |
| Service Request  | Onboarding, access provisioning |

### 6. Ticket Types
| Type           | Description                          |
|----------------|--------------------------------------|
| Incident       | Unplanned disruption to a service    |
| Request        | Standard service request             |
| Problem        | Root cause of recurring incidents    |
| Change Request | Planned modification to environment  |

### 7. Priority Levels
| Priority | SLA Target     |
|----------|----------------|
| Critical | 1 hour         |
| High     | 4 hours        |
| Medium   | 1 business day |
| Low      | 3 business days|

### 8. Analytics Dashboard *(Admin & Supervisor only)*

A live metrics dashboard available at `/admin/analytics`. Provides organization-wide visibility into ticket operations.

**Filters:** date range presets (7 days / 30 days / 90 days / this month), custom date range, department, and time granularity (day / week / month).

| Widget                    | Type             | Description                                                    |
|---------------------------|------------------|----------------------------------------------------------------|
| Open Tickets              | KPI card         | Total tickets in any active status                             |
| Created Today / Week / Month | KPI cards     | Volume counters for quick triage                               |
| Resolution Rate           | KPI card         | % of tickets resolved within the selected range                |
| Avg Resolution Time       | KPI card         | Mean hours from creation to resolved in the selected range     |
| Ticket Volume             | Bar chart        | Tickets created per time bucket                                |
| Status Distribution       | Donut chart      | Current count per ticket status                                |
| Priority Breakdown        | Horizontal bar   | Ticket count and % by priority                                 |
| Resolution Time Trend     | Area chart       | Average hours from creation → resolved over time               |
| Department Breakdown      | Horizontal bar   | Ticket volume per department                                   |
| Agent Load                | Sortable table   | Per-agent: active assigned count, resolved in range, avg resolution time |

**Architecture notes:**
- All data sourced from existing `Ticket` and `TrackingLog` tables — no new schema required
- Resolution time computed from `TrackingLog` (CREATED → RESOLVED), not `updatedAt`, for accuracy
- In-memory TTL cache per endpoint (2 min for KPIs, 5–15 min for charts) protects the database
- Raw SQL (`$queryRawUnsafe`) used only for `DATE_TRUNC` time-bucket aggregations; all values are parameterized

---

## Ticket Data Structure

| Field            | Type       | Description                              |
|------------------|------------|------------------------------------------|
| `ticket_id`      | string     | Unique identifier (e.g. `HD-1021`)       |
| `department`     | string     | Owning department                        |
| `description`    | text       | Full task or issue description           |
| `assigned_to`    | string     | Agent responsible for resolution         |
| `category`       | enum       | Issue classification                     |
| `ticket_type`    | enum       | Nature of request                        |
| `priority`       | enum       | Urgency level                            |
| `status`         | enum       | Current lifecycle stage                  |
| `tracking`       | array      | Ordered log of all actions and comments  |
| `created_at`     | timestamp  | Ticket creation time                     |
| `updated_at`     | timestamp  | Last modification timestamp              |

---

## Example Ticket

```
Ticket ID   : #HD-1021
Department  : IT Support
Description : Unable to connect to VPN from home network
Assigned To : John Doe
Category    : Network Issue
Ticket Type : Incident
Priority    : High
Status      : In Progress

Tracking Log:
─────────────────────────────────────────────────────
[2026-03-12 09:10] Ticket created by Jane Smith
[2026-03-12 09:15] Auto-assigned to IT Support queue
[2026-03-12 09:45] Picked up by John Doe
[2026-03-12 10:00] Investigation started — checking firewall rules
[2026-03-12 10:40] Escalated to Network Team (firewall config required)
[2026-03-12 11:15] Fix applied — VPN firewall rule updated
[2026-03-12 11:20] Status set to Resolved — pending verification
[2026-03-12 11:30] Verified by Supervisor — ticket closed
─────────────────────────────────────────────────────
```

---

## Tech Stack

### Frontend
| Layer        | Technology                       |
|--------------|----------------------------------|
| Framework    | Next.js 14 (App Router)          |
| Styling      | TailwindCSS                      |
| State        | Zustand + TanStack Query         |
| Forms        | React Hook Form + Zod            |
| Auth         | NextAuth.js                      |
| Charts       | Recharts                         |

### Backend
| Layer        | Technology                       |
|--------------|----------------------------------|
| Runtime      | Node.js                          |
| Framework    | NestJS (modular, scalable)       |
| API          | REST (OpenAPI documented)        |
| Auth         | JWT + Refresh Token rotation     |
| Queue        | BullMQ (Redis-backed)            |
| Validation   | class-validator + class-transformer |

### Database
| Layer        | Technology                       |
|--------------|----------------------------------|
| Primary DB   | PostgreSQL                       |
| ORM          | Prisma                           |
| Cache        | Redis                            |
| Search       | PostgreSQL full-text (phase 1)   |

### Infrastructure
| Layer        | Technology                       |
|--------------|----------------------------------|
| Containers   | Docker + Docker Compose          |
| CI/CD        | GitHub Actions                   |
| Reverse Proxy| Nginx                            |
| Monitoring   | (planned) Grafana + Prometheus   |

---

## Project Structure

```
helpdesk-ticketing/
│
├── frontend/                         # Next.js App
│   ├── app/
│   │   ├── (auth)/                   # Login
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/            # Agent/admin home
│   │   │   ├── tickets/              # Ticket CRUD views
│   │   │   └── admin/
│   │   │       ├── analytics/        # Analytics dashboard ← NEW
│   │   │       ├── agents/
│   │   │       ├── departments/
│   │   │       ├── categories/
│   │   │       └── ticket-types/
│   ├── components/
│   │   ├── analytics/                # Chart + table components ← NEW
│   │   │   ├── OverviewCards.tsx
│   │   │   ├── AnalyticsFilters.tsx
│   │   │   ├── TicketVolumeChart.tsx
│   │   │   ├── StatusDistributionChart.tsx
│   │   │   ├── PriorityDistributionChart.tsx
│   │   │   ├── ResolutionTimeChart.tsx
│   │   │   ├── DepartmentBreakdownChart.tsx
│   │   │   └── AgentLoadTable.tsx
│   │   ├── tickets/                  # Ticket-specific components
│   │   ├── tracking/                 # Tracking log renderer
│   │   ├── attachments/
│   │   └── layout/                   # Sidebar, Header
│   ├── hooks/
│   │   ├── useAnalytics.ts           # 6 TanStack Query hooks ← NEW
│   │   ├── useTickets.ts
│   │   ├── useAgents.ts
│   │   └── useDepartments.ts
│   ├── services/
│   │   ├── analytics.service.ts      # Axios calls to /api/analytics/* ← NEW
│   │   ├── tickets.service.ts
│   │   └── agents.service.ts
│   ├── types/
│   │   ├── analytics.types.ts        # Analytics response types ← NEW
│   │   ├── ticket.types.ts
│   │   └── api.types.ts
│   ├── stores/                       # Zustand stores
│   └── lib/                          # Utilities, validators, api-client
│
├── backend/                          # NestJS App
│   ├── src/
│   │   ├── analytics/                # Analytics module ← NEW
│   │   │   ├── analytics.controller.ts   (6 GET endpoints, ADMIN|SUPERVISOR)
│   │   │   ├── analytics.service.ts      (in-memory TTL cache 2–15 min)
│   │   │   ├── analytics.repository.ts   (Prisma groupBy + raw SQL)
│   │   │   └── dto/analytics-query.dto.ts
│   │   ├── tickets/                  # Ticket module
│   │   ├── tracking/                 # Immutable audit log
│   │   ├── agents/
│   │   ├── departments/
│   │   ├── categories/
│   │   ├── ticket-types/
│   │   ├── attachments/
│   │   ├── auth/                     # JWT + refresh token
│   │   ├── mail/                     # Nodemailer templates
│   │   ├── common/                   # Guards, decorators, filters, enums
│   │   └── prisma/
│   └── prisma/
│       ├── migrations/
│       ├── schema.prisma
│       └── seed.ts
│
├── docker-compose.yml
├── .env.example
├── CLAUDE.md
└── README.md
```

---

## Security Considerations

| Concern                 | Implementation                                      |
|-------------------------|-----------------------------------------------------|
| Authentication          | JWT with refresh token rotation                     |
| Authorization           | Role-Based Access Control (RBAC)                    |
| Input Validation        | Zod (frontend) + class-validator (backend)          |
| Audit Trail             | Immutable tracking log per ticket                   |
| Rate Limiting           | NestJS Throttler per route                          |
| SQL Injection           | Prisma parameterized queries                        |
| CORS                    | Strict origin allowlist                             |
| Secrets Management      | Environment variables, never committed              |

---

## RBAC Roles

| Role        | Capabilities                                                    |
|-------------|-----------------------------------------------------------------|
| Admin       | Full system access, user management, reports                    |
| Supervisor  | Verify tickets, reassign, view department queue                 |
| Agent       | Create, update, comment on assigned tickets                     |
| Requester   | Submit tickets, view own ticket status                          |

---

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/tanhoang0803/HelpDesk-Ticket.git
cd HelpDesk-Ticket
```

### 2. Start infrastructure
```bash
docker-compose up -d
```
> PostgreSQL runs on port **5433** to avoid conflicts with local PostgreSQL installations. Redis runs on port 6379.

### 3. Set up and start the backend
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

### 4. Start the frontend (new terminal)
```bash
cd frontend
npm run dev
```

### 5. Open the app
| Service      | URL                             |
|--------------|---------------------------------|
| Frontend     | http://localhost:3000           |
| Backend API  | http://localhost:3001/api       |
| Swagger docs | http://localhost:3001/api/docs  |

### Default login credentials

| Role       | Email                     | Password   |
|------------|---------------------------|------------|
| Admin      | admin@helpdesk.com        | Admin@1234 |
| Supervisor | supervisor@helpdesk.com   | Super@1234 |
| Agent      | agent@helpdesk.com        | Agent@1234 |

---

## Future Improvements

Items are grouped by domain. Each reflects a concrete gap in the current build — not wishlist thinking.

### Notifications & Real-time

- [ ] **WebSocket live updates** — Socket.io room per ticket; push status changes and new comments to open browser tabs without polling. The current architecture polls on a 30s stale-time.
- [ ] **Email on every transition** — `MailService` currently only fires on ticket creation. Every status change (ASSIGNED, RESOLVED, REOPENED, etc.) should notify the assigned agent and requester with role-appropriate templates.
- [ ] **BullMQ email queue** — Redis + BullMQ are already in the stack but the mail service calls Nodemailer synchronously. Move all email sends into a `mail` queue with retry logic so a failing SMTP provider never blocks the API response.
- [ ] **In-app notification bell** — Unread badge count in the sidebar header; notification feed showing mentions, assignments, and SLA warnings without leaving the app.
- [ ] **Slack / Microsoft Teams integration** — Webhook-based posting when a ticket is created, escalated, or breaches SLA. Configurable per department.

---

### SLA Management

- [ ] **SLA policies per priority** — Define target response and resolution hours per priority tier (Critical: 1h / High: 4h / Medium: 8h / Low: 24h) stored in the database, not hardcoded in the README.
- [ ] **SLA countdown timer on ticket detail** — Live countdown showing time remaining before breach; color shifts yellow → red as the deadline approaches.
- [ ] **Automatic breach detection** — Scheduled job (cron via NestJS `@Cron`) that queries open tickets past their SLA deadline and flags them `ESCALATED` or fires an alert.
- [ ] **SLA compliance KPI in Analytics** — Add an SLA breach rate card and trend chart to the existing analytics dashboard.

---

### Search & Filtering

- [ ] **Full-text search on description** — Current `search` param only matches `title` and `ticketNumber`. Add PostgreSQL `tsvector` index on `description` or migrate to Elasticsearch for relevance ranking.
- [ ] **Advanced filter panel** — Date range picker, multi-select status, department tree, and assignee filter directly on the tickets list page (currently only status and priority are filterable).
- [ ] **Saved filter presets** — Let agents save frequently used filter combinations (e.g., "My open critical tickets") as named bookmarks stored in `localStorage` or the database.

---

### Analytics & Reporting

- [ ] **CSV / Excel export** — Export button on every analytics chart and the dashboard tickets table. Stream the file from the backend (`/analytics/export?format=csv`) so large exports don't block memory.
- [ ] **Scheduled email reports** — Weekly or daily PDF summary (open count, SLA rate, top agents) delivered to supervisors and admins automatically via cron.
- [ ] **Custom date comparison** — Period-over-period view in Analytics (e.g., this month vs. last month) so managers can spot trends without manual calculation.
- [ ] **Agent performance scorecard** — Dedicated page per agent showing resolution rate, avg resolution time, SLA compliance, and open workload over selectable time ranges.
- [ ] **Requester satisfaction rating** — After a ticket reaches CLOSED, send a 1–5 star survey link. Store responses and surface average CSAT per agent and department in Analytics.

---

### Ticket Workflow

- [ ] **Bulk operations** — Checkbox selection on the tickets table to bulk-assign, bulk-transition, or bulk-export selected tickets in one action.
- [ ] **Ticket templates** — Pre-filled forms for common request types (e.g., "VPN access request", "New hardware setup") so requesters don't start from a blank form.
- [ ] **Internal notes** — A comment type visible only to agents and supervisors, separate from the public tracking log shown to the requester.
- [ ] **Ticket merging** — Identify and merge duplicate tickets raised for the same underlying issue; child tickets link to the parent and inherit its resolution.
- [ ] **Dependent / child tickets** — Split a complex ticket into sub-tasks assigned to different agents; the parent auto-resolves when all children close.
- [ ] **Requester self-service portal** — Dedicated low-friction UI where requesters submit, track, and comment on their own tickets without seeing the full agent dashboard.

---

### AI & Automation

- [ ] **Auto-categorization** — On ticket creation, call an LLM (Claude API or lightweight classifier) to suggest `category`, `ticketType`, and `priority` from the description. Agent can accept or override.
- [ ] **Smart routing** — Route new tickets to the best-available agent in the target department based on current workload (open assigned count) and historical resolution time per category.
- [ ] **Duplicate detection** — Before submission, embed the description and run cosine similarity against recent open tickets; warn the requester if a near-identical ticket already exists.
- [ ] **Resolution suggestion** — Surface the top 3 past resolved tickets with similar descriptions as suggested solutions inside the ticket detail panel.

---

### Auth & Access Control

- [ ] **Two-factor authentication (2FA)** — TOTP via authenticator app for Admin and Supervisor accounts; enforced at login with a QR code setup flow.
- [ ] **SSO / OAuth2** — Allow login via Google Workspace or Azure AD so organizations don't manage a separate password per user.
- [ ] **Fine-grained permissions** — Move beyond the four hard-coded roles to a permission matrix: custom roles with per-action grants (e.g., an agent who can verify but not assign).
- [ ] **Session management** — Active session listing in user profile settings; ability to revoke individual sessions (currently refresh tokens cannot be individually invalidated without flushing Redis).

---

### Performance & Infrastructure

- [ ] **Cursor-based pagination** — Replace `OFFSET`-based pagination with cursor (keyset) pagination on the tickets list to avoid slow queries when ticket volume exceeds 100k rows.
- [ ] **Redis cache for ticket lists** — The analytics service has an in-memory TTL cache; the tickets list API has none. Add Redis-backed cache with targeted invalidation on mutation to reduce database read load.
- [ ] **CDN for attachments** — Current file uploads are stored on the local filesystem inside the container. Move to S3-compatible object storage (AWS S3, MinIO) behind a CDN for durability and performance.
- [ ] **Horizontal scaling** — Stateless backend is already designed for this; add a `docker-compose.prod.yml` with Nginx upstream load balancing across multiple NestJS instances and shared Redis for session and cache.
- [ ] **Observability stack** — Wire Prometheus metrics (request latency, queue depth, error rate) into a Grafana dashboard; add distributed tracing with OpenTelemetry for cross-service request correlation.
- [ ] **Database read replicas** — Route analytics queries to a PostgreSQL read replica so heavy aggregation SQL doesn't contend with OLTP ticket writes on the primary.

---

### Developer Experience

- [ ] **API versioning** — Introduce `/api/v1/` prefix with a stable contract; add a deprecation header workflow so consumers have a migration window before breaking changes land.
- [ ] **End-to-end test suite** — Playwright tests covering the critical user journeys: create ticket → assign → resolve → verify → close, and RBAC gate checks (agent cannot verify, requester cannot assign).
- [ ] **Integration test database** — Currently no integration tests exist. Add a Jest + Prisma test setup that spins up a disposable PostgreSQL schema per test run and tears it down after.
- [ ] **OpenAPI SDK generation** — Auto-generate a typed API client from the Swagger spec (`@nestjs/swagger` + `openapi-generator`) and publish it as an internal package consumed by the frontend instead of hand-written service files.

---

## License

MIT
