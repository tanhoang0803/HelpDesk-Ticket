# CLAUDE.md

## Local Development Setup

### Prerequisites
- Docker Desktop running
- Node.js 18+

### 1. Start infrastructure (PostgreSQL on port 5433 + Redis)
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

### 3. Frontend (new terminal)
```bash
cd frontend
npm run dev
```

### URLs
| Service       | URL                              |
|---------------|----------------------------------|
| Frontend      | http://localhost:3000            |
| Backend API   | http://localhost:3001/api        |
| Swagger docs  | http://localhost:3001/api/docs   |

### Default credentials
| Role       | Email                        | Password    |
|------------|------------------------------|-------------|
| Admin      | admin@helpdesk.com           | Admin@1234  |
| Supervisor | supervisor@helpdesk.com      | Super@1234  |
| Agent      | agent@helpdesk.com           | Agent@1234  |

> **Note:** PostgreSQL runs on port **5433** (not 5432) to avoid conflict with any local PostgreSQL installation.

---

## Project Purpose

This file guides AI-assisted development for the **Helpdesk Ticketing System** — a production-grade, multi-department support platform.

Priorities:
- Clean domain modeling with strict boundaries
- Modular, service-layer architecture
- Immutable audit trail for every ticket transition
- Maintainable, testable, scalable codebase

---

## ⚠️ Critical: Prisma Column Naming Rule

This is the single most important rule to understand before writing any raw SQL in this codebase.

**Table names are snake_case. Column names are camelCase.**

Prisma's `@@map()` decorator is present on every model, which maps the Prisma model name to a snake_case table name in PostgreSQL (e.g. `tickets`, `tracking_logs`, `agents`). However, **individual fields have NO `@map` decorator**, so PostgreSQL column names mirror the Prisma camelCase field names exactly — they are stored as quoted identifiers.

```sql
-- WRONG — snake_case column names do not exist
SELECT created_at, ticket_id, department_id FROM tracking_logs

-- CORRECT — always quote camelCase column names in raw SQL
SELECT "createdAt", "ticketId", "departmentId" FROM tracking_logs
```

**Full list of affected column names:**

| Prisma field   | PostgreSQL column (raw SQL) |
|----------------|-----------------------------|
| `createdAt`    | `"createdAt"`               |
| `updatedAt`    | `"updatedAt"`               |
| `deletedAt`    | `"deletedAt"`               |
| `ticketId`     | `"ticketId"`                |
| `departmentId` | `"departmentId"`            |
| `assignedToId` | `"assignedToId"`            |
| `agentId`      | `"agentId"`                 |
| `ticketNumber` | `"ticketNumber"`            |
| `ticketTypeId` | `"ticketTypeId"`            |
| `categoryId`   | `"categoryId"`              |
| `isActive`     | `"isActive"`                |

This rule applies everywhere `$queryRaw` or `$queryRawUnsafe` is used — currently in `analytics.repository.ts`. Failure to quote these names causes queries to return empty results silently (PostgreSQL resolves unquoted identifiers to lowercase and finds no matching column).

---

## Domain Model

### Ticket
Core entity. Represents one support request.

```ts
{
  id: string                  // UUID
  ticketNumber: string        // Human-readable: HD-2026-00042 (HD-{YYYY}-{seq:5})
  title: string               // Short subject line (required, 5–200 chars)
  description: string         // Full issue details (required)
  departmentId: string
  assignedToId: string | null // agent id or null (unassigned queue)
  categoryId: string
  ticketTypeId: string
  priority: Priority          // CRITICAL | HIGH | MEDIUM | LOW
  status: TicketStatus
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null  // Soft delete only — never hard delete
}
```

---

### Agent
```ts
{
  id: string
  name: string
  email: string               // Unique
  departmentId: string
  role: AgentRole             // ADMIN | SUPERVISOR | AGENT | REQUESTER
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### Department
```ts
{
  id: string
  name: string                // IT | HR | Finance | Infrastructure | Operations
  description: string | null
  createdAt: DateTime
}
```

---

### Category
```ts
{
  id: string
  name: string                // Software Issue | Hardware Issue | Network Issue | ...
  departmentId: string | null // null = applies to all departments
}
```

---

### TicketType
```ts
{
  id: string
  name: string                // Incident | Request | Problem | Change Request
}
```

---

### TrackingLog
Immutable record of every state change or agent action on a ticket.

```ts
{
  id: string
  ticketId: string
  action: TrackingAction      // Enum of all actions
  comment: string | null
  departmentId: string | null
  agentId: string | null
  verified: boolean           // true only when action = VERIFIED
  createdAt: DateTime         // Never mutated after creation
}
```

**TrackingAction enum:**
```
CREATED | ASSIGNED | REASSIGNED | IN_PROGRESS | PENDING
COMMENTED | ESCALATED | RESOLVED | VERIFIED | REOPENED | CANCELLED | CLOSED
```

---

### Attachment
```ts
{
  id: string
  ticketId: string
  filename: string            // Stored filename on disk (UUID-based)
  originalName: string        // Original filename from the upload
  mimeType: string
  size: number                // Bytes
  uploadedById: string        // Agent who uploaded
  createdAt: DateTime
}
```

---

### TicketCounter
Used for sequential ticket number generation. One row per calendar year.

```ts
{
  year: number   // e.g. 2026  (primary key)
  seq: number    // Monotonically incrementing — never reset
}
```

Ticket number format: `HD-{year}-{seq padded to 5 digits}` → `HD-2026-00042`

---

## Ticket Status Lifecycle

```
OPEN
 ↓
ASSIGNED
 ↓
IN_PROGRESS
 ↓
PENDING          ← waiting on requester or third party
 ↓
RESOLVED
 ↓
VERIFIED         ← supervisor confirms resolution
 ↓
CLOSED
```

Allowed edge transitions:
```
RESOLVED  → REOPENED    (requester rejects resolution)
ANY       → ESCALATED   (moved up chain)
ANY       → CANCELLED   (admin/requester withdraws)
ESCALATED → IN_PROGRESS (after escalation handled)
```

Forbidden transitions must throw a domain error — never silently allow.

---

## Enforced Status Transition Rules

**Backend** — `TicketService.transition()` enforces this map:
```ts
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:    ['IN_PROGRESS', 'ESCALATED', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'ESCALATED'],
  PENDING:     ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED:    ['VERIFIED', 'REOPENED'],
  VERIFIED:    ['CLOSED'],
  REOPENED:    ['ASSIGNED', 'IN_PROGRESS'],
  ESCALATED:   ['IN_PROGRESS', 'CANCELLED'],
  CLOSED:      [],
  CANCELLED:   [],
}
```

**Frontend** — `lib/utils/ticket-status.ts` exports `getTransitionsForRole()` which filters the allowed list by the current user's role and whether the ticket is assigned to them:

```ts
// Statuses only ADMIN or SUPERVISOR can set
const PRIVILEGED_TARGETS = new Set(['ASSIGNED', 'VERIFIED', 'CLOSED']);

export function getTransitionsForRole(
  status: TicketStatus,
  role: string,
  isAssignedToMe: boolean,
): TicketStatus[] {
  const all = ALLOWED_TRANSITIONS[status] ?? [];
  if (role === 'ADMIN' || role === 'SUPERVISOR') return all;
  if (role === 'AGENT') {
    if (!isAssignedToMe) return [];           // Agents can't act on others' tickets
    return all.filter((s) => !PRIVILEGED_TARGETS.has(s));
  }
  return all.filter((s) => s === 'CANCELLED'); // REQUESTER: cancel only
}
```

Both layers must stay in sync. If the backend adds a new transition, update `ALLOWED_TRANSITIONS` in **both** `backend/src/common/enums/ticket-status.enum.ts` and `frontend/src/lib/utils/ticket-status.ts`.

---

## Backend Architecture

```
HTTP Request
     ↓
Controller         (validates DTO, calls service, returns response)
     ↓
Service            (business logic, enforces rules, emits events)
     ↓
Repository         (data access only, no business logic)
     ↓
Prisma ORM
     ↓
PostgreSQL
```

### Module Structure (NestJS)

```
src/
├── analytics/                            ← metrics aggregation (ADMIN|SUPERVISOR)
│   ├── analytics.module.ts
│   ├── analytics.controller.ts           (6 GET endpoints)
│   ├── analytics.service.ts             (in-memory TTL cache 2–15 min)
│   ├── analytics.repository.ts          (Prisma groupBy + $queryRawUnsafe for DATE_TRUNC)
│   └── dto/
│       └── analytics-query.dto.ts       (startDate, endDate, departmentId, granularity)
│
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   ├── tickets.repository.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       ├── list-tickets.dto.ts
│       ├── update-ticket.dto.ts
│       ├── transition-ticket.dto.ts
│       ├── assign-ticket.dto.ts
│       └── comment-ticket.dto.ts
│
├── tracking/
│   ├── tracking.module.ts
│   ├── tracking.service.ts              (log() method — called by TicketsService only)
│   └── tracking.repository.ts
│
├── attachments/
│   ├── attachments.module.ts
│   ├── attachments.controller.ts        (POST /tickets/:id/attachments, GET, DELETE)
│   ├── attachments.service.ts
│   └── attachments.repository.ts
│
├── agents/
│   ├── agents.module.ts
│   ├── agents.controller.ts
│   ├── agents.service.ts
│   └── agents.repository.ts
│
├── departments/
│   ├── departments.module.ts
│   ├── departments.controller.ts
│   └── departments.service.ts
│
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   └── categories.service.ts
│
├── ticket-types/
│   ├── ticket-types.module.ts
│   ├── ticket-types.controller.ts
│   └── ticket-types.service.ts
│
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts                  (Nodemailer; fire-and-forget; called by TicketsService)
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       └── roles.decorator.ts
│
├── common/
│   ├── enums/
│   │   ├── ticket-status.enum.ts        (ALLOWED_TRANSITIONS map lives here)
│   │   ├── priority.enum.ts
│   │   ├── agent-role.enum.ts
│   │   └── tracking-action.enum.ts      (statusToAction() mapping lives here)
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts
│   └── pipes/
│       └── validation.pipe.ts
│
└── prisma/
    └── prisma.service.ts
```

---

## Database Schema (Prisma)

```prisma
model Ticket {
  id            String         @id @default(uuid())
  ticketNumber  String         @unique
  title         String
  description   String
  department    Department     @relation(fields: [departmentId], references: [id])
  departmentId  String
  assignedTo    Agent?         @relation("AssignedTickets", fields: [assignedToId], references: [id])
  assignedToId  String?
  category      Category       @relation(fields: [categoryId], references: [id])
  categoryId    String
  ticketType    TicketType     @relation(fields: [ticketTypeId], references: [id])
  ticketTypeId  String
  priority      Priority       @default(MEDIUM)
  status        TicketStatus   @default(OPEN)
  trackingLogs  TrackingLog[]
  attachments   Attachment[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?

  @@index([status])
  @@index([assignedToId])
  @@index([departmentId])
  @@index([createdAt])
  @@index([priority])
  @@map("tickets")
}

model TrackingLog {
  id           String          @id @default(uuid())
  ticket       Ticket          @relation(fields: [ticketId], references: [id])
  ticketId     String
  action       TrackingAction
  comment      String?
  department   Department?     @relation(fields: [departmentId], references: [id])
  departmentId String?
  agent        Agent?          @relation(fields: [agentId], references: [id])
  agentId      String?
  verified     Boolean         @default(false)
  createdAt    DateTime        @default(now())

  @@index([ticketId])
  @@index([createdAt])
  @@map("tracking_logs")
}

model Attachment {
  id           String   @id @default(uuid())
  ticket       Ticket   @relation(fields: [ticketId], references: [id])
  ticketId     String
  filename     String
  originalName String
  mimeType     String
  size         Int
  uploadedBy   Agent    @relation(fields: [uploadedById], references: [id])
  uploadedById String
  createdAt    DateTime @default(now())

  @@index([ticketId])
  @@map("attachments")
}

model Agent {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  password     String
  department   Department    @relation(fields: [departmentId], references: [id])
  departmentId String
  role         AgentRole     @default(AGENT)
  isActive     Boolean       @default(true)
  tickets      Ticket[]      @relation("AssignedTickets")
  trackingLogs TrackingLog[]
  attachments  Attachment[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("agents")
}

model Department {
  id          String        @id @default(uuid())
  name        String        @unique
  description String?
  tickets     Ticket[]
  agents      Agent[]
  trackingLogs TrackingLog[]
  createdAt   DateTime      @default(now())

  @@map("departments")
}

model Category {
  id           String   @id @default(uuid())
  name         String
  departmentId String?
  tickets      Ticket[]

  @@map("categories")
}

model TicketType {
  id      String   @id @default(uuid())
  name    String   @unique
  tickets Ticket[]

  @@map("ticket_types")
}

model TicketCounter {
  year Int @id
  seq  Int @default(0)

  @@map("ticket_counters")
}

enum TicketStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  PENDING
  RESOLVED
  VERIFIED
  REOPENED
  ESCALATED
  CANCELLED
  CLOSED
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum AgentRole {
  ADMIN
  SUPERVISOR
  AGENT
  REQUESTER
}

enum TrackingAction {
  CREATED
  ASSIGNED
  REASSIGNED
  IN_PROGRESS
  PENDING
  COMMENTED
  ESCALATED
  RESOLVED
  VERIFIED
  REOPENED
  CANCELLED
  CLOSED
}
```

**Indexing strategy:**
- Index `status`, `assignedToId`, `departmentId`, `createdAt`, `priority` on `Ticket`
- Index `ticketId`, `createdAt` on `TrackingLog`
- Index `ticketId` on `Attachment`
- All ticket queries must be **paginated** — never fetch unbounded result sets

**`TICKET_LIST_SELECT`** (used in `tickets.repository.ts` for list queries):
```ts
// Includes description for the dashboard table's preview line
const TICKET_LIST_SELECT = {
  id: true, ticketNumber: true, title: true, description: true,
  priority: true, status: true, createdAt: true, updatedAt: true,
  department: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  category:   { select: { id: true, name: true } },
  ticketType: { select: { id: true, name: true } },
};
```

---

## Core Business Rules

### 1. Every state transition creates a tracking log
```ts
// In TicketService.transition()
await this.trackingService.log({
  ticketId,
  action:       statusToAction(newStatus),
  agentId:      currentUser.sub,
  departmentId: currentUser.departmentId,
  comment,
  verified:     newStatus === 'VERIFIED',
});
```

### 2. Never hard-delete tickets
Always use soft delete (`deletedAt`). Filter with `deletedAt: null` in all default queries.

### 3. Verified stage requires supervisor or admin role
```ts
if (dto.status === 'VERIFIED' && user.role !== 'SUPERVISOR' && user.role !== 'ADMIN') {
  throw new ForbiddenException('Only supervisors can verify tickets');
}
```

### 4. Ticket number generation
Auto-increment with prefix: `HD-{YYYY}-{seq padded to 5 digits}` (e.g. `HD-2026-00042`).
Uses `TicketCounter` upsert inside a Prisma transaction — generated in the repository, not the controller.

### 5. Assigned agent must belong to ticket department
Validate at assignment time. Cross-department assignment is only allowed via escalation.

### 6. TrackingLog is append-only
Never update or delete a `TrackingLog` row. `createdAt` is set on insert and never modified.

### 7. Mail is fire-and-forget
`MailService` calls are not awaited in `TicketsService`. A failing SMTP server must never cause a ticket operation to fail. Current implementation only emails on ticket creation — transitions do not yet send notifications.

---

## RBAC Enforcement

| Action                    | ADMIN | SUPERVISOR | AGENT | REQUESTER |
|---------------------------|-------|------------|-------|-----------|
| Create ticket             | ✓     | ✓          | ✓     | ✓         |
| View any ticket           | ✓     | ✓          | ✓*    | own only  |
| Assign / Reassign         | ✓     | ✓          | ✗     | ✗         |
| Transition status         | ✓     | ✓          | ✓**   | cancel only |
| Verify ticket             | ✓     | ✓          | ✗     | ✗         |
| Comment on ticket         | ✓     | ✓          | ✓     | own only  |
| Cancel ticket             | ✓     | ✓          | ✗     | own only  |
| Upload attachments        | ✓     | ✓          | ✓     | own only  |
| View analytics            | ✓     | ✓          | ✗     | ✗         |
| Manage agents/departments | ✓     | ✗          | ✗     | ✗         |

\* Agents: `departmentId` filter is automatically injected in `TicketsService.findAll()` — agents only see tickets in their own department
\** Agents: can only transition tickets where `assignedToId === currentUser.sub`; privileged targets (ASSIGNED, VERIFIED, CLOSED) are blocked

---

## Backend: Seed Data

`prisma/seed.ts` is idempotent — re-running it is safe.

Current seed state (as of March 2026):
- **5 departments:** IT Support, HR, Finance, Infrastructure, Operations
- **6 agents:** admin, supervisor, agent (IT), Jane Smith (HR), Mike Johnson (Finance), Sarah Wilson (Infrastructure), Tom Brown (Operations)
- **8 categories, 4 ticket types**
- **25 tickets:** HD-2026-00001 → HD-2026-00025 (Jan 5 – Mar 14 2026)
- Covers all statuses: OPEN ×3, ASSIGNED ×3, IN_PROGRESS ×4, PENDING ×3, RESOLVED ×5, VERIFIED ×3, CLOSED ×3, ESCALATED ×1, CANCELLED ×1
- `TicketCounter` upserted to `seq=25` for year 2026
- Each ticket has full `TrackingLog` history with realistic backdated timestamps

---

## Frontend Guidelines

### Component Structure
```
components/
├── analytics/                         # Admin/Supervisor analytics widgets
│   ├── OverviewCards.tsx              # 5 KPI cards with skeleton loaders
│   ├── AnalyticsFilters.tsx           # Date presets, custom range, dept, granularity
│   ├── TicketVolumeChart.tsx          # Bar chart (Recharts)
│   ├── StatusDistributionChart.tsx    # Donut chart (Recharts)
│   ├── PriorityDistributionChart.tsx  # Horizontal bar (Recharts)
│   ├── ResolutionTimeChart.tsx        # Area chart with gradient (Recharts)
│   ├── DepartmentBreakdownChart.tsx   # Horizontal bar (Recharts)
│   └── AgentLoadTable.tsx             # Sortable table with color-coded load badges
│
├── dashboard/
│   ├── DashboardStats.tsx             # 4 KPI status-count cards (all roles)
│   └── DashboardTicketsTable.tsx      # Full tickets table with search/filter/sort/pagination
│
├── tickets/
│   ├── TicketCard.tsx                 # Summary card for list view
│   ├── TicketStatusBadge.tsx          # Status pill
│   └── TicketPriorityBadge.tsx        # Priority pill
│
├── tracking/
│   ├── TrackingTimeline.tsx           # Chronological log view
│   └── TrackingEntry.tsx              # Single log entry
│
├── attachments/
│   ├── AttachmentList.tsx
│   └── AttachmentUpload.tsx
│
└── layout/
    ├── Sidebar.tsx                    # Navigation (includes Analytics link for admin)
    └── Header.tsx
```

### Key Utilities — `lib/utils/ticket-status.ts`
Central source of truth for all status/priority display logic. **Always import from here — never hardcode status colors or labels inline.**

```ts
// Exports:
STATUS_LABELS:   Record<TicketStatus, string>   // display names
STATUS_COLORS:   Record<TicketStatus, string>   // Tailwind classes
PRIORITY_LABELS: Record<Priority, string>
PRIORITY_COLORS: Record<Priority, string>       // includes border class
ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]>  // mirrors backend
getTransitionsForRole(status, role, isAssignedToMe): TicketStatus[]
```

### Dashboard KPI Pattern
`DashboardStats` uses **4 parallel `useTickets()` calls** with `limit: 1`, reading `meta.total` per status. It does **NOT** use the analytics overview endpoint (which is ADMIN/SUPERVISOR only). This approach works for every role because the tickets API applies role-based department filtering server-side.

```tsx
function useStatusCount(status: string) {
  const { data, isLoading } = useTickets({ status: status as any, limit: 1, page: 1 });
  return { count: data?.meta.total ?? 0, isLoading };
}
```

Do not replace this with the analytics endpoint — that would break the dashboard for AGENT role.

### Dashboard Tickets Table — `DashboardTicketsTable`
Embedded table rendered below Quick Actions on the dashboard page. Key design decisions:

| Decision | Reason |
|---|---|
| `PAGE_SIZE = 10` | Dashboard is a summary; 20 rows is too dense |
| Server-side filter (status / priority / search) | API handles pagination accurately |
| Client-side sort on fetched page | Backend has no sort param; fine for 10 rows |
| Debounced search 300ms | Avoid API spam on keystrokes |
| `description` in list select | Shown as sub-line in the description cell |
| `department.name` as "Agent" column | Ticket model has no `createdById`; department is the reporting unit |
| Date format `HH:MM:SS DD/MM/YYYY` | Per UI spec for this project |

### Data Fetching Pattern
Use TanStack Query for all server state:
```ts
// hooks/useTickets.ts
export const useTickets = (params: ListTicketsParams = {}) =>
  useQuery({
    queryKey: ['tickets', params],
    queryFn:  () => ticketsService.getAll(params),
    enabled:  status === 'authenticated',
    staleTime: 30_000,
  });
```

### Form Validation
Always validate with Zod before submission. Use `z.input<typeof schema>` for React Hook Form `defaultValues` typing — not `z.infer<>` — to avoid resolver type mismatch errors:

```ts
const createTicketSchema = z.object({
  title:        z.string().min(5).max(200),
  departmentId: z.string().uuid(),
  description:  z.string().min(10).max(2000),
  categoryId:   z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  priority:     z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
});

type CreateTicketFormValues = z.input<typeof createTicketSchema>; // correct
// NOT: z.infer<typeof createTicketSchema>  ← causes resolver type errors
```

---

## API Conventions

All responses follow a consistent envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition from CLOSED to IN_PROGRESS",
    "statusCode": 422
  }
}
```

### All Endpoints
```
# Auth
POST   /auth/login                     Returns access + refresh tokens
POST   /auth/refresh                   Rotate refresh token
POST   /auth/logout

# Tickets
POST   /tickets                        Create ticket
GET    /tickets                        List (paginated + filtered)
GET    /tickets/:id                    Single ticket with trackingLogs
PATCH  /tickets/:id/transition         Change status (enforces state machine)
PATCH  /tickets/:id/assign             Assign/reassign agent
POST   /tickets/:id/comments           Add comment → creates TrackingLog(COMMENTED)
GET    /tickets/:id/tracking           Full tracking history

# Attachments
POST   /tickets/:id/attachments        Upload file (multipart/form-data)
GET    /tickets/:id/attachments        List attachments for a ticket
DELETE /attachments/:id               Delete an attachment

# Reference data
GET    /departments                    List departments
GET    /agents                         List agents (?departmentId=...)
GET    /categories                     List categories (?departmentId=...)
GET    /ticket-types                   List ticket types

# Analytics — ADMIN and SUPERVISOR only
# Query params: startDate, endDate, departmentId, granularity (day|week|month)
GET    /analytics/overview             KPI cards (open, created, resolution rate, avg time)
GET    /analytics/ticket-volume        Volume time-series by bucket
GET    /analytics/priority-distribution Count + % per priority
GET    /analytics/department-breakdown Count + % per department
GET    /analytics/resolution-time      Avg hours CREATED→RESOLVED per time bucket
GET    /analytics/agent-load           Per-agent: assigned, resolved, avg resolution time

# Admin
GET    /agents                         List agents (ADMIN only for full list)
POST   /agents                         Create agent (ADMIN only)
PATCH  /agents/:id                     Update agent (ADMIN only)
```

**Tickets list query params:**
```
page, limit, status, priority, departmentId, assignedToId, search
```
`search` matches `title` and `ticketNumber` (case-insensitive). `description` is not yet full-text searchable.

---

## Analytics Dashboard

### Feature Summary
Role-restricted metrics dashboard (`/admin/analytics`) for ADMIN and SUPERVISOR only. Sources data from existing `tickets` and `tracking_logs` tables — no schema additions required.

### Metrics
| Endpoint                | Source                         | Chart type       | Cache TTL |
|-------------------------|--------------------------------|------------------|-----------|
| `overview`              | Ticket groupBy + TrackingLog   | 5 KPI cards      | 2 min     |
| `ticket-volume`         | Ticket.createdAt DATE_TRUNC    | Bar chart        | 15 min    |
| `priority-distribution` | Ticket.priority groupBy        | Horizontal bar   | 5 min     |
| `department-breakdown`  | Ticket.departmentId groupBy    | Horizontal bar   | 5 min     |
| `resolution-time`       | TrackingLog CREATED→RESOLVED   | Area chart       | 15 min    |
| `agent-load`            | Tickets + TrackingLog per agent| Sortable table   | 15 min    |

### Design Rules
- Resolution time is computed from `TrackingLog` (`action = CREATED` → `action = RESOLVED`), never from `Ticket.updatedAt`
- Soft-deleted tickets (`deletedAt IS NOT NULL`) are excluded from volume metrics
- All `DATE_TRUNC` queries use `$queryRawUnsafe` with a validated allowlist — granularity is never taken raw from user input
- All raw SQL uses quoted camelCase column names (see the Critical rule at the top of this file)
- The caching layer is a plain in-memory `Map<string, { value, expiresAt }>` in `AnalyticsService` — no Redis dependency at this stage
- Cache key format: `{metric}:{startDate}:{endDate}:{departmentId}:{granularity}`
- Department filter in raw SQL uses a **subquery**, not a JOIN, to avoid Cartesian product:
  ```sql
  AND c."ticketId" IN (SELECT id FROM tickets WHERE "departmentId" = $param)
  ```

### Frontend Hook Pattern
```ts
// hooks/useAnalytics.ts — stale times mirror backend cache TTLs
export const useOverview = (q: AnalyticsQuery) =>
  useQuery({
    queryKey: ['analytics', 'overview', q],
    queryFn:  () => analyticsService.getOverview(q),
    staleTime: 2 * 60 * 1000,    // 2 min
    enabled:   status === 'authenticated',
  });
```

### Adding New Metrics
1. Add aggregation method to `analytics.repository.ts`
2. Add cached wrapper in `analytics.service.ts` with an appropriate TTL
3. Add `@Get(...)` route in `analytics.controller.ts` with `@Roles(AgentRole.ADMIN, AgentRole.SUPERVISOR)`
4. Add response type in `frontend/src/types/analytics.types.ts`
5. Add service call in `frontend/src/services/analytics.service.ts`
6. Add TanStack Query hook in `frontend/src/hooks/useAnalytics.ts`
7. Add chart/table component in `frontend/src/components/analytics/`

---

## Performance Guidelines

- All list queries must be paginated (`page`, `limit` query params)
- Default page size: 20 for tickets list; 10 for dashboard embedded table; max: 100
- Use `select` in Prisma to return only required fields — never `findMany()` with full relations on list views
- TrackingLog is append-only — no updates, no deletes
- `MailService` calls must never be awaited in the service layer — wrap as fire-and-forget
- The analytics in-memory cache is single-instance — it resets on server restart and does not share across multiple NestJS processes

---

## Testing Standards

- Unit test all service methods with mocked repositories
- Integration test all API endpoints with a real test database
- **Never mock the database** for integration tests — this caused a production incident in the past
- Test all status transition rules including forbidden paths
- Seed test data deterministically — use fixed UUIDs in fixtures
- Test RBAC: each protected endpoint must have a test case for each unauthorized role

---

## AI Assistance Scope

Claude should assist with:
- Generating service/repository methods following the Controller→Service→Repository pattern
- Writing unit and integration tests
- Documenting API endpoints in Swagger (`@ApiOperation`, `@ApiResponse`)
- Generating and reviewing Prisma migrations
- Reviewing DTO validation logic
- Adding new analytics metrics (follow the 7-step checklist above)
- Adding new frontend components — always use `STATUS_COLORS` / `PRIORITY_COLORS` from `ticket-status.ts`

Claude must NOT:
- Bypass the service layer by writing direct DB queries in controllers
- Skip `TrackingService.log()` on any status transition
- Hard-delete ticket records (use `deletedAt` soft delete)
- Allow forbidden status transitions without validation
- Expose internal UUIDs or stack traces in public-facing error responses
- Write raw SQL with snake_case column names (see Critical rule above)
- Use the analytics overview endpoint for dashboard KPI cards — use `useTickets(limit:1)` instead

---

## Scaling Path

Phase 1 — Monolith (current):
```
Next.js + NestJS + PostgreSQL + Redis
```

Phase 2 — Service extraction:
```
API Gateway → Auth Service
           → Ticket Service
           → Notification Service (email/Slack — BullMQ queue)
           → Search Service (Elasticsearch)
```

Phase 3 — Event-driven:
```
Ticket Service → Kafka → Notification Consumer
                       → Analytics Consumer
                       → Audit Log Consumer
```

---

## Naming Conventions

| Layer              | Convention       | Example                                    |
|--------------------|------------------|--------------------------------------------|
| PostgreSQL tables  | snake_case       | `tickets`, `tracking_logs`, `ticket_types` |
| PostgreSQL columns | camelCase quoted | `"createdAt"`, `"ticketId"`, `"isActive"`  |
| Prisma models      | PascalCase       | `Ticket`, `TrackingLog`                    |
| Prisma fields      | camelCase        | `ticketId`, `createdAt`, `assignedToId`    |
| DTOs               | PascalCase class | `CreateTicketDto`, `ListTicketsDto`        |
| Enums              | UPPER_SNAKE_CASE | `IN_PROGRESS`, `TICKET_CREATED`            |
| Routes             | kebab-case       | `/ticket-types`, `/tracking-logs`          |
| React components   | PascalCase       | `TicketStatusBadge`, `DashboardStats`      |
| Hooks              | camelCase + use  | `useTickets`, `useAnalytics`               |
| Services (FE)      | camelCase        | `ticketsService`, `analyticsService`       |
| Utils              | camelCase        | `formatDateTime`, `getTransitionsForRole`  |

> **Key distinction:** Table names are snake_case (via `@@map`), but column names are camelCase because individual Prisma fields have no `@map`. Raw SQL must quote every column name.

---

## Final Goal

Deliver a **robust, auditable, enterprise-grade ticketing system** that:
- Never loses ticket history
- Enforces clear ownership and transitions at both backend and frontend layers
- Serves every role correctly — dashboard and tables work for ADMIN, SUPERVISOR, AGENT, and REQUESTER without special-casing in components
- Scales cleanly from a single team to a multi-department enterprise
- Can be extended (SLA, AI routing, real-time notifications) without structural rewrites
