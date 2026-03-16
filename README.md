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

- [ ] SLA enforcement with breach alerts
- [ ] Automated ticket routing by category/keyword
- [ ] AI-assisted categorization and priority suggestion
- [ ] Analytics export to CSV
- [ ] Real-time dashboard updates via WebSocket
- [ ] Elasticsearch integration for full-text ticket search
- [ ] Mobile-responsive PWA

---

## License

MIT
