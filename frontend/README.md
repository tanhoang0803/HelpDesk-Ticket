# Helpdesk Ticketing — Frontend

Next.js 14 frontend for the Helpdesk Ticketing System. Provides role-aware dashboards, ticket management, file attachments, and an analytics dashboard for Admin/Supervisor roles.

---

## Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Framework  | Next.js 14 (App Router)        |
| Styling    | Tailwind CSS                   |
| State      | TanStack Query (server state)  |
| Forms      | React Hook Form + Zod          |
| Auth       | NextAuth.js                    |
| Charts     | Recharts                       |
| HTTP       | Axios                          |

---

## Local Development

### Prerequisites
- Backend running at `http://localhost:3001`

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local if needed — defaults work with local backend
```

### 3. Start dev server
```bash
npm run dev
```

App available at `http://localhost:3000`

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Full URL of this app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `NEXT_PUBLIC_API_URL` | Backend base URL (baked in at build time) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login page
│   └── (dashboard)/
│       ├── dashboard/        # Home — KPI cards + tickets table
│       ├── tickets/          # Ticket list + detail + create
│       └── admin/
│           ├── analytics/    # Analytics dashboard (ADMIN|SUPERVISOR)
│           ├── agents/       # Agent management (ADMIN)
│           ├── departments/
│           ├── categories/
│           └── ticket-types/
├── components/
│   ├── analytics/            # 8 chart/table components (Recharts)
│   ├── dashboard/            # DashboardStats + DashboardTicketsTable
│   ├── tickets/              # TicketCard, TicketStatusBadge, TicketPriorityBadge
│   ├── tracking/             # TrackingTimeline
│   ├── attachments/          # AttachmentList + AttachmentUpload
│   └── layout/               # Sidebar + Header
├── hooks/
│   ├── useTickets.ts
│   ├── useAnalytics.ts       # 6 hooks (overview, volume, priority, dept, resolution, agent)
│   ├── useAgents.ts
│   └── useDepartments.ts
├── services/
│   ├── tickets.service.ts
│   ├── analytics.service.ts
│   └── agents.service.ts
├── types/
│   ├── ticket.types.ts
│   ├── analytics.types.ts
│   └── api.types.ts
└── lib/
    └── utils/
        └── ticket-status.ts  # STATUS_COLORS, PRIORITY_COLORS, getTransitionsForRole()
```

---

## Key Design Decisions

**Dashboard KPIs** — use 4 parallel `useTickets({ limit: 1 })` calls reading `meta.total` per status. This works for all roles (ADMIN through REQUESTER) because the tickets API applies role-based department filtering server-side. Do **not** replace with the analytics overview endpoint — that endpoint is ADMIN/SUPERVISOR only.

**Status/Priority display** — always import from `lib/utils/ticket-status.ts`. Never hardcode status colors or labels inline.

**Form typing** — use `z.input<typeof schema>` for React Hook Form `defaultValues`, not `z.infer<>`, to avoid resolver type mismatch errors.

---

## Production (Vercel)

Deployed automatically on every push to `master`. Vercel reads `vercel.json` at the repo root to set `frontend/` as the root directory.

Live URL: `https://help-desk-ticket-sss.vercel.app`

---

## Key Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run start     # Start production build
npm run lint      # ESLint (does not block build)
```

---

## License

MIT

---

&copy; 2026 [TanQHoang](https://github.com/tanhoang0803). All rights reserved.
