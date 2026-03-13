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
| Styling      | TailwindCSS + shadcn/ui          |
| State        | Zustand + TanStack Query         |
| Forms        | React Hook Form + Zod            |
| Auth         | NextAuth.js                      |

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
│   │   ├── (auth)/                   # Login, register
│   │   ├── dashboard/                # Agent/admin dashboard
│   │   ├── tickets/                  # Ticket CRUD views
│   │   └── admin/                    # Admin panel
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── tickets/                  # Ticket-specific components
│   │   └── tracking/                 # Tracking log renderer
│   ├── hooks/                        # Custom React hooks
│   ├── services/                     # API client layer
│   ├── stores/                       # Zustand stores
│   └── lib/                          # Utilities, validators
│
├── backend/                          # NestJS App
│   ├── src/
│   │   ├── tickets/                  # Ticket module
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.service.ts
│   │   │   ├── tickets.repository.ts
│   │   │   └── dto/
│   │   ├── agents/                   # Agent module
│   │   ├── departments/              # Department module
│   │   ├── tracking/                 # Tracking log module
│   │   ├── auth/                     # Auth module (JWT)
│   │   ├── common/                   # Guards, interceptors, pipes
│   │   └── prisma/                   # Prisma service
│   └── test/
│
├── database/
│   ├── migrations/                   # Prisma migration files
│   ├── seeders/                      # Seed data for dev/staging
│   └── schema.prisma                 # Prisma schema
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── er-diagram.png
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

```bash
# Clone repository
git clone <repo-url>
cd helpdesk-ticketing

# Configure environment
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
cd backend && npx prisma migrate dev

# Seed database
npx prisma db seed

# Start frontend
cd ../frontend && npm run dev

# Start backend
cd ../backend && npm run start:dev
```

---

## Future Improvements

- [ ] SLA enforcement with breach alerts
- [ ] Automated ticket routing by category/keyword
- [ ] Email & Slack notifications
- [ ] AI-assisted categorization and priority suggestion
- [ ] Analytics dashboard (ticket volume, resolution time, agent load)
- [ ] Elasticsearch integration for full-text ticket search
- [ ] Mobile-responsive PWA

---

## License

MIT
