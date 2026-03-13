# CLAUDE.md

## Project Purpose

This file guides AI-assisted development for the **Helpdesk Ticketing System** — a production-grade, multi-department support platform.

Priorities:
- Clean domain modeling with strict boundaries
- Modular, service-layer architecture
- Immutable audit trail for every ticket transition
- Maintainable, testable, scalable codebase

---

## Domain Model

### Ticket
Core entity. Represents one support request.

```ts
{
  id: string                  // UUID
  ticket_number: string       // Human-readable: HD-1021
  department_id: string
  description: text
  assigned_to: string | null  // agent_id or null (queue)
  category_id: string
  ticket_type_id: string
  priority: Priority          // CRITICAL | HIGH | MEDIUM | LOW
  status: TicketStatus
  created_at: DateTime
  updated_at: DateTime
  deleted_at: DateTime | null // Soft delete only
}
```

---

### Agent
```ts
{
  id: string
  name: string
  email: string               // Unique
  department_id: string
  role: AgentRole             // ADMIN | SUPERVISOR | AGENT | REQUESTER
  is_active: boolean
  created_at: DateTime
  updated_at: DateTime
}
```

---

### Department
```ts
{
  id: string
  name: string                // IT | HR | Finance | Infrastructure
  description: string
  created_at: DateTime
}
```

---

### Category
```ts
{
  id: string
  name: string                // Software Issue | Hardware Issue | ...
  department_id: string | null
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
  ticket_id: string
  action: TrackingAction      // Enum of all actions
  comment: string | null
  department_id: string | null
  agent_id: string | null
  verified: boolean           // Was this step formally verified?
  created_at: DateTime        // Never mutated after creation
}
```

**TrackingAction enum:**
```
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
```

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

Enforce this in `TicketService.transition()` — never directly set `status` outside this method.

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
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   ├── tickets.repository.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       ├── update-ticket.dto.ts
│       └── transition-ticket.dto.ts
│
├── tracking/
│   ├── tracking.module.ts
│   ├── tracking.service.ts
│   └── tracking.repository.ts
│
├── agents/
├── departments/
├── auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       └── roles.decorator.ts
│
├── common/
│   ├── enums/
│   │   ├── ticket-status.enum.ts
│   │   ├── ticket-type.enum.ts
│   │   ├── priority.enum.ts
│   │   └── tracking-action.enum.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
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
  department    Department     @relation(fields: [departmentId], references: [id])
  departmentId  String
  description   String
  assignedTo    Agent?         @relation(fields: [assignedToId], references: [id])
  assignedToId  String?
  category      Category       @relation(fields: [categoryId], references: [id])
  categoryId    String
  ticketType    TicketType     @relation(fields: [ticketTypeId], references: [id])
  ticketTypeId  String
  priority      Priority       @default(MEDIUM)
  status        TicketStatus   @default(OPEN)
  tracking      TrackingLog[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?

  @@index([status])
  @@index([assignedToId])
  @@index([departmentId])
  @@index([createdAt])
  @@index([priority])
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
}

model Agent {
  id           String     @id @default(uuid())
  name         String
  email        String     @unique
  department   Department @relation(fields: [departmentId], references: [id])
  departmentId String
  role         AgentRole  @default(AGENT)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Department {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  createdAt   DateTime  @default(now())
}

model Category {
  id           String      @id @default(uuid())
  name         String
  departmentId String?
}

model TicketType {
  id   String @id @default(uuid())
  name String @unique
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
- All ticket queries must be **paginated** — never fetch unbounded result sets

---

## Core Business Rules

### 1. Every state transition creates a tracking log
```ts
// In TicketService.transition()
await this.trackingRepository.create({
  ticketId,
  action: mapStatusToAction(newStatus),
  agentId: currentUser.id,
  departmentId: currentUser.departmentId,
  comment,
  verified: newStatus === 'VERIFIED',
})
```

### 2. Never hard-delete tickets
Always use soft delete (`deletedAt`). Filter with `deletedAt: null` in all default queries.

### 3. Verified stage requires supervisor role
```ts
if (dto.status === 'VERIFIED' && user.role !== 'SUPERVISOR' && user.role !== 'ADMIN') {
  throw new ForbiddenException('Only supervisors can verify tickets')
}
```

### 4. Ticket number generation
Auto-increment with prefix: `HD-{YYYY}-{sequence}` (e.g., `HD-2026-00042`)
Generate in service layer, not application code.

### 5. Assigned agent must belong to ticket department
Validate at assignment time. Do not allow cross-department assignment without escalation.

---

## RBAC Enforcement

| Action                    | ADMIN | SUPERVISOR | AGENT | REQUESTER |
|---------------------------|-------|------------|-------|-----------|
| Create ticket             | ✓     | ✓          | ✓     | ✓         |
| View any ticket           | ✓     | ✓          | ✓*    | own only  |
| Assign / Reassign         | ✓     | ✓          | ✗     | ✗         |
| Transition status         | ✓     | ✓          | ✓**   | ✗         |
| Verify ticket             | ✓     | ✓          | ✗     | ✗         |
| Comment on ticket         | ✓     | ✓          | ✓     | own only  |
| Cancel ticket             | ✓     | ✓          | ✗     | own only  |
| Manage agents/departments | ✓     | ✗          | ✗     | ✗         |

\* Agents see tickets in their department
\** Agents can only transition tickets assigned to them

---

## Frontend Guidelines

### Component Structure
```
components/
├── tickets/
│   ├── TicketCard.tsx          # Summary card for list view
│   ├── TicketDetail.tsx        # Full ticket detail panel
│   ├── TicketForm.tsx          # Create/edit form
│   ├── TicketStatusBadge.tsx   # Status pill with color
│   └── TicketPriorityBadge.tsx
│
├── tracking/
│   ├── TrackingTimeline.tsx    # Chronological log view
│   └── TrackingEntry.tsx       # Single log entry
│
└── ui/                         # shadcn/ui base components
```

### Data Fetching Pattern
Use TanStack Query for all server state:
```ts
// hooks/useTickets.ts
export const useTickets = (filters: TicketFilters) =>
  useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketService.getAll(filters),
    staleTime: 30_000,
  })
```

### Form Validation
Always validate with Zod before submission:
```ts
const createTicketSchema = z.object({
  departmentId: z.string().uuid(),
  description: z.string().min(10).max(2000),
  categoryId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
})
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
    "total": 150
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

### Key Endpoints
```
POST   /tickets                    Create ticket
GET    /tickets                    List tickets (paginated + filtered)
GET    /tickets/:id                Get single ticket with tracking
PATCH  /tickets/:id/transition     Change ticket status
PATCH  /tickets/:id/assign         Assign/reassign agent
POST   /tickets/:id/comments       Add comment (creates tracking log)
GET    /tickets/:id/tracking       Get full tracking history

GET    /departments                List departments
GET    /agents                     List agents (filterable by dept)
GET    /categories                 List categories
GET    /ticket-types               List ticket types
```

---

## Performance Guidelines

- All list queries must be paginated (`page`, `limit` query params)
- Default page size: 20, max: 100
- Add `cursor`-based pagination when ticket volume exceeds 500k
- Cache department/category/ticket-type lookups in Redis (TTL: 5 min)
- Use `select` in Prisma to return only required fields — never `findMany()` with full relations on list views
- TrackingLog is append-only — no updates, no deletes

---

## Testing Standards

- Unit test all service methods with mocked repositories
- Integration test all API endpoints with a real test database
- Never mock the database for integration tests
- Test all status transition rules including forbidden paths
- Seed test data deterministically — use fixed UUIDs in fixtures

---

## AI Assistance Scope

Claude should assist with:
- Generating service/repository methods
- Writing unit and integration tests
- Documenting API endpoints
- Generating Prisma migrations
- Reviewing DTO validation logic

Claude must NOT:
- Bypass service layer by writing direct DB queries in controllers
- Skip tracking log creation on any status transition
- Hard-delete ticket records
- Allow forbidden status transitions without validation
- Generate code that exposes internal IDs in public-facing errors

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
           → Notification Service (email/Slack)
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

| Layer       | Convention         | Example                          |
|-------------|--------------------|----------------------------------|
| Database    | snake_case         | `ticket_id`, `created_at`        |
| Prisma      | camelCase          | `ticketId`, `createdAt`          |
| DTOs        | camelCase          | `CreateTicketDto`                |
| Enums       | UPPER_SNAKE_CASE   | `IN_PROGRESS`, `TICKET_CREATED`  |
| Routes      | kebab-case         | `/ticket-types`, `/tracking-logs`|
| Components  | PascalCase         | `TicketStatusBadge`              |
| Hooks       | camelCase + use    | `useTicketDetail`                |

---

## Final Goal

Deliver a **robust, auditable, enterprise-grade ticketing system** that:
- Never loses ticket history
- Enforces clear ownership and transitions
- Scales cleanly from a single team to a multi-department enterprise
- Can be extended (SLA, AI routing, analytics) without structural rewrites
