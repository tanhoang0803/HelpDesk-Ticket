import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date('2026-03-17T12:00:00Z');
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAfter(base: Date, h: number): Date {
  return new Date(base.getTime() + h * 60 * 60 * 1000);
}

async function makeTicket(params: {
  ticketNumber: string;
  title: string;
  description: string;
  departmentId: string;
  categoryId: string;
  ticketTypeId: string;
  priority: string;
  status: string;
  assignedToId: string | null;
  createdAt: Date;
  logs: { action: string; agentId: string | null; departmentId: string | null; comment?: string; verified?: boolean; createdAt: Date }[];
}) {
  // Skip if ticket already exists
  const existing = await prisma.ticket.findUnique({ where: { ticketNumber: params.ticketNumber } });
  if (existing) return existing;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: params.ticketNumber,
      title:        params.title,
      description:  params.description,
      departmentId: params.departmentId,
      categoryId:   params.categoryId,
      ticketTypeId: params.ticketTypeId,
      priority:     params.priority as any,
      status:       params.status  as any,
      assignedToId: params.assignedToId,
      createdAt:    params.createdAt,
      updatedAt:    params.logs.at(-1)?.createdAt ?? params.createdAt,
    },
  });

  for (const log of params.logs) {
    await prisma.trackingLog.create({
      data: {
        ticketId:     ticket.id,
        action:       log.action    as any,
        agentId:      log.agentId,
        departmentId: log.departmentId,
        comment:      log.comment   ?? null,
        verified:     log.verified  ?? false,
        createdAt:    log.createdAt,
      },
    });
  }

  return ticket;
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // ── Departments ────────────────────────────────────────────────────────────
  const [itDeptRaw, hrDeptRaw, financeDeptRaw, infraDeptRaw, opsDeptRaw] = await Promise.all([
    prisma.department.upsert({ where: { name: 'IT Support' },     update: {}, create: { name: 'IT Support',     description: 'Handles software, hardware, and network issues' } }),
    prisma.department.upsert({ where: { name: 'HR' },             update: {}, create: { name: 'HR',             description: 'Human resources and employee-related requests' } }),
    prisma.department.upsert({ where: { name: 'Finance' },        update: {}, create: { name: 'Finance',        description: 'Finance and accounting support' } }),
    prisma.department.upsert({ where: { name: 'Infrastructure' }, update: {}, create: { name: 'Infrastructure', description: 'Server, network infrastructure, and DevOps' } }),
    prisma.department.upsert({ where: { name: 'Operations' },     update: {}, create: { name: 'Operations',     description: 'General operations and facilities' } }),
  ]);
  const itDept = itDeptRaw; const hrDept = hrDeptRaw; const financeDept = financeDeptRaw;
  const infraDept = infraDeptRaw; const opsDept = opsDeptRaw;
  console.log(`✅ 5 departments seeded`);

  // ── Ticket Types ───────────────────────────────────────────────────────────
  const [ttIncident, ttRequest, ttProblem, ttChange] = await Promise.all([
    prisma.ticketType.upsert({ where: { name: 'Incident' },       update: {}, create: { name: 'Incident' } }),
    prisma.ticketType.upsert({ where: { name: 'Request' },        update: {}, create: { name: 'Request' } }),
    prisma.ticketType.upsert({ where: { name: 'Problem' },        update: {}, create: { name: 'Problem' } }),
    prisma.ticketType.upsert({ where: { name: 'Change Request' }, update: {}, create: { name: 'Change Request' } }),
  ]);
  console.log(`✅ 4 ticket types seeded`);

  // ── Categories ─────────────────────────────────────────────────────────────
  await prisma.category.deleteMany({
    where: { id: { in: ['cat-software-001','cat-hardware-001','cat-network-001','cat-access-001','cat-service-001','cat-payroll-001','cat-onboard-001','cat-infra-001','cat-security-001','cat-other-001'] } },
  });
  const [catSoftware, catHardware, catNetwork, catAccess, catService, catPayroll, catOnboard, catInfra, catSecurity, catOther] = await Promise.all([
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0001-4000-8000-000000000001' }, update: {}, create: { id: 'a1b2c3d4-0001-4000-8000-000000000001', name: 'Software Issue' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0002-4000-8000-000000000002' }, update: {}, create: { id: 'a1b2c3d4-0002-4000-8000-000000000002', name: 'Hardware Issue' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0003-4000-8000-000000000003' }, update: {}, create: { id: 'a1b2c3d4-0003-4000-8000-000000000003', name: 'Network Issue' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0004-4000-8000-000000000004' }, update: {}, create: { id: 'a1b2c3d4-0004-4000-8000-000000000004', name: 'Account Access' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0005-4000-8000-000000000005' }, update: {}, create: { id: 'a1b2c3d4-0005-4000-8000-000000000005', name: 'Service Request' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0006-4000-8000-000000000006' }, update: {}, create: { id: 'a1b2c3d4-0006-4000-8000-000000000006', name: 'Payroll Issue' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0007-4000-8000-000000000007' }, update: {}, create: { id: 'a1b2c3d4-0007-4000-8000-000000000007', name: 'Onboarding' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0008-4000-8000-000000000008' }, update: {}, create: { id: 'a1b2c3d4-0008-4000-8000-000000000008', name: 'Infrastructure Request' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0009-4000-8000-000000000009' }, update: {}, create: { id: 'a1b2c3d4-0009-4000-8000-000000000009', name: 'Security Concern' } }),
    prisma.category.upsert({ where: { id: 'a1b2c3d4-0010-4000-8000-000000000010' }, update: {}, create: { id: 'a1b2c3d4-0010-4000-8000-000000000010', name: 'Other' } }),
  ]);
  console.log(`✅ 10 categories seeded`);

  // ── Agents ─────────────────────────────────────────────────────────────────
  const adminHash      = await bcrypt.hash('Admin@1234', 12);
  const supervisorHash = await bcrypt.hash('Super@1234', 12);
  const agentHash      = await bcrypt.hash('Agent@1234', 12);

  const admin = await prisma.agent.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: { name: 'System Admin', email: 'admin@helpdesk.com', passwordHash: adminHash, departmentId: itDept.id, role: 'ADMIN', isActive: true },
  });
  const supervisor = await prisma.agent.upsert({
    where: { email: 'supervisor@helpdesk.com' },
    update: {},
    create: { name: 'IT Supervisor', email: 'supervisor@helpdesk.com', passwordHash: supervisorHash, departmentId: itDept.id, role: 'SUPERVISOR', isActive: true },
  });
  const agentJohn = await prisma.agent.upsert({
    where: { email: 'agent@helpdesk.com' },
    update: {},
    create: { name: 'John Doe', email: 'agent@helpdesk.com', passwordHash: agentHash, departmentId: itDept.id, role: 'AGENT', isActive: true },
  });
  const agentJane = await prisma.agent.upsert({
    where: { email: 'jane.smith@helpdesk.com' },
    update: {},
    create: { name: 'Jane Smith', email: 'jane.smith@helpdesk.com', passwordHash: agentHash, departmentId: hrDept.id, role: 'AGENT', isActive: true },
  });
  const agentMike = await prisma.agent.upsert({
    where: { email: 'mike.johnson@helpdesk.com' },
    update: {},
    create: { name: 'Mike Johnson', email: 'mike.johnson@helpdesk.com', passwordHash: agentHash, departmentId: financeDept.id, role: 'AGENT', isActive: true },
  });
  const agentSarah = await prisma.agent.upsert({
    where: { email: 'sarah.wilson@helpdesk.com' },
    update: {},
    create: { name: 'Sarah Wilson', email: 'sarah.wilson@helpdesk.com', passwordHash: agentHash, departmentId: infraDept.id, role: 'AGENT', isActive: true },
  });
  const agentTom = await prisma.agent.upsert({
    where: { email: 'tom.brown@helpdesk.com' },
    update: {},
    create: { name: 'Tom Brown', email: 'tom.brown@helpdesk.com', passwordHash: agentHash, departmentId: opsDept.id, role: 'AGENT', isActive: true },
  });

  console.log(`✅ 7 agents seeded`);
  console.log('');
  console.log('─────────────────────────────────────────────');
  console.log('🔑 Default credentials:');
  console.log('   Admin:      admin@helpdesk.com      / Admin@1234');
  console.log('   Supervisor: supervisor@helpdesk.com / Super@1234');
  console.log('   Agent:      agent@helpdesk.com      / Agent@1234');
  console.log('─────────────────────────────────────────────');

  // ── Tickets ────────────────────────────────────────────────────────────────
  console.log('\n🎫 Seeding tickets...');

  // HD-2026-00001 — CLOSED (Jan 5)
  const t1Created = daysAgo(71);
  await makeTicket({
    ticketNumber: 'HD-2026-00001', priority: 'HIGH', status: 'CLOSED',
    title: 'Outlook crashes on startup after Windows update',
    description: 'Since the forced Windows update on Jan 4, Outlook 365 crashes immediately on launch with error 0xc0000005. Affects 3 users in IT Support.',
    departmentId: itDept.id, categoryId: catSoftware.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t1Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,      departmentId: itDept.id,   comment: 'Ticket created', createdAt: t1Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: itDept.id,   comment: 'Assigned to John Doe', createdAt: hoursAfter(t1Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id,  departmentId: itDept.id,   comment: 'Investigating — checking Office repair first', createdAt: hoursAfter(t1Created, 3) },
      { action: 'RESOLVED',    agentId: agentJohn.id,  departmentId: itDept.id,   comment: 'Rolled back KB5034441 update. Outlook stable.', createdAt: hoursAfter(t1Created, 8) },
      { action: 'VERIFIED',    agentId: supervisor.id, departmentId: itDept.id,   comment: 'Confirmed by users. Closing.', verified: true, createdAt: hoursAfter(t1Created, 24) },
      { action: 'CLOSED',      agentId: supervisor.id, departmentId: itDept.id,   createdAt: hoursAfter(t1Created, 25) },
    ],
  });

  // HD-2026-00002 — CLOSED (Jan 7)
  const t2Created = daysAgo(69);
  await makeTicket({
    ticketNumber: 'HD-2026-00002', priority: 'MEDIUM', status: 'CLOSED',
    title: 'New employee onboarding — access setup for Lisa Tran',
    description: 'New hire Lisa Tran starting Jan 10. Needs AD account, email, Slack, and Jira access. Department: Finance. Manager: Mike Johnson.',
    departmentId: hrDept.id, categoryId: catOnboard.id, ticketTypeId: ttRequest.id,
    assignedToId: agentJane.id, createdAt: t2Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,     departmentId: hrDept.id, comment: 'Ticket created', createdAt: t2Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: hrDept.id, comment: 'Assigned to Jane Smith', createdAt: hoursAfter(t2Created, 2) },
      { action: 'IN_PROGRESS', agentId: agentJane.id, departmentId: hrDept.id, comment: 'Creating accounts', createdAt: hoursAfter(t2Created, 4) },
      { action: 'RESOLVED',    agentId: agentJane.id, departmentId: hrDept.id, comment: 'All access provisioned. Credentials sent to manager.', createdAt: hoursAfter(t2Created, 12) },
      { action: 'VERIFIED',    agentId: supervisor.id, departmentId: hrDept.id, verified: true, createdAt: hoursAfter(t2Created, 36) },
      { action: 'CLOSED',      agentId: supervisor.id, departmentId: hrDept.id, createdAt: hoursAfter(t2Created, 37) },
    ],
  });

  // HD-2026-00003 — RESOLVED (Jan 10)
  const t3Created = daysAgo(66);
  await makeTicket({
    ticketNumber: 'HD-2026-00003', priority: 'CRITICAL', status: 'RESOLVED',
    title: 'Suspected unauthorized SSH access to prod server',
    description: 'Security alert fired at 02:30 — multiple failed SSH login attempts on prod-server-01 from IP 185.220.101.x (known Tor exit node). Need immediate investigation.',
    departmentId: infraDept.id, categoryId: catSecurity.id, ticketTypeId: ttIncident.id,
    assignedToId: agentSarah.id, createdAt: t3Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,      departmentId: infraDept.id, comment: 'Critical security alert', createdAt: t3Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: infraDept.id, comment: 'Escalating to Sarah Wilson', createdAt: hoursAfter(t3Created, 0.5) },
      { action: 'IN_PROGRESS', agentId: agentSarah.id, departmentId: infraDept.id, comment: 'Blocking IP range, reviewing auth logs', createdAt: hoursAfter(t3Created, 1) },
      { action: 'RESOLVED',    agentId: agentSarah.id, departmentId: infraDept.id, comment: 'Blocked IP range in firewall. No data exfiltration detected. MFA enforced on SSH.', createdAt: hoursAfter(t3Created, 6) },
    ],
  });

  // HD-2026-00004 — VERIFIED (Jan 12)
  const t4Created = daysAgo(64);
  await makeTicket({
    ticketNumber: 'HD-2026-00004', priority: 'HIGH', status: 'VERIFIED',
    title: 'January payroll export missing overtime calculations',
    description: 'The payroll export for January 2026 generated on Jan 11 is missing overtime hours for 12 employees in the Operations department. Affects payroll run on Jan 15.',
    departmentId: financeDept.id, categoryId: catPayroll.id, ticketTypeId: ttProblem.id,
    assignedToId: agentMike.id, createdAt: t4Created,
    logs: [
      { action: 'CREATED',     agentId: agentMike.id,  departmentId: financeDept.id, comment: 'Ticket created', createdAt: t4Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: financeDept.id, comment: 'Assigned to Mike Johnson', createdAt: hoursAfter(t4Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentMike.id,  departmentId: financeDept.id, comment: 'Reviewing payroll calculation script', createdAt: hoursAfter(t4Created, 3) },
      { action: 'RESOLVED',    agentId: agentMike.id,  departmentId: financeDept.id, comment: 'Found bug in overtime threshold config. Recalculated and corrected export.', createdAt: hoursAfter(t4Created, 20) },
      { action: 'VERIFIED',    agentId: supervisor.id, departmentId: financeDept.id, verified: true, comment: 'Finance director confirmed corrected payroll.', createdAt: hoursAfter(t4Created, 48) },
    ],
  });

  // HD-2026-00005 — RESOLVED (Jan 15)
  const t5Created = daysAgo(61);
  await makeTicket({
    ticketNumber: 'HD-2026-00005', priority: 'MEDIUM', status: 'RESOLVED',
    title: 'VPN intermittent disconnections for remote staff',
    description: 'Multiple remote employees report VPN (Cisco AnyConnect) dropping every 30–60 minutes since Jan 13. Reconnect works but disrupts video calls.',
    departmentId: itDept.id, categoryId: catNetwork.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t5Created,
    logs: [
      { action: 'CREATED',     agentId: agentJohn.id, departmentId: itDept.id, comment: 'Ticket created', createdAt: t5Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t5Created, 2) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id, departmentId: itDept.id, comment: 'Checking firewall idle timeout settings', createdAt: hoursAfter(t5Created, 4) },
      { action: 'RESOLVED',    agentId: agentJohn.id, departmentId: itDept.id, comment: 'Increased idle timeout from 30m to 8h on Cisco ASA. Issue resolved.', createdAt: hoursAfter(t5Created, 14) },
    ],
  });

  // HD-2026-00006 — IN_PROGRESS (Jan 18)
  const t6Created = daysAgo(58);
  await makeTicket({
    ticketNumber: 'HD-2026-00006', priority: 'HIGH', status: 'IN_PROGRESS',
    title: 'Laptop screen flickering — Finance team MacBook Pro',
    description: 'MacBook Pro 14" (2023) assigned to analyst Emma Davis shows screen flickering at random intervals. Happens on battery and AC power. External monitor is fine.',
    departmentId: itDept.id, categoryId: catHardware.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t6Created,
    logs: [
      { action: 'CREATED',     agentId: agentJohn.id, departmentId: itDept.id, comment: 'Ticket created', createdAt: t6Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t6Created, 3) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id, departmentId: itDept.id, comment: 'Running Apple Diagnostics. Checking display cable.', createdAt: hoursAfter(t6Created, 8) },
    ],
  });

  // HD-2026-00007 — PENDING (Jan 20)
  const t7Created = daysAgo(56);
  await makeTicket({
    ticketNumber: 'HD-2026-00007', priority: 'MEDIUM', status: 'PENDING',
    title: 'Active Directory account locked — HR coordinator',
    description: 'Maria Gonzalez (HR Coordinator) account locked after password expiry. Password reset sent but she reports still unable to log in. Waiting on user confirmation.',
    departmentId: hrDept.id, categoryId: catAccess.id, ticketTypeId: ttRequest.id,
    assignedToId: agentJane.id, createdAt: t7Created,
    logs: [
      { action: 'CREATED',     agentId: agentJane.id, departmentId: hrDept.id, comment: 'Ticket created', createdAt: t7Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: hrDept.id, comment: 'Assigned to Jane Smith', createdAt: hoursAfter(t7Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentJane.id, departmentId: hrDept.id, comment: 'Unlocked account, sent temp password', createdAt: hoursAfter(t7Created, 2) },
      { action: 'PENDING',     agentId: agentJane.id, departmentId: hrDept.id, comment: 'Waiting for user to confirm login success', createdAt: hoursAfter(t7Created, 4) },
    ],
  });

  // HD-2026-00008 — ASSIGNED (Jan 22)
  const t8Created = daysAgo(54);
  await makeTicket({
    ticketNumber: 'HD-2026-00008', priority: 'LOW', status: 'ASSIGNED',
    title: 'Request for additional monitor for Finance team',
    description: 'Finance analyst team of 4 requesting second monitors (27" 4K) for improved multi-spreadsheet workflow. Budget pre-approved by Finance director.',
    departmentId: financeDept.id, categoryId: catService.id, ticketTypeId: ttRequest.id,
    assignedToId: agentMike.id, createdAt: t8Created,
    logs: [
      { action: 'CREATED',  agentId: agentMike.id, departmentId: financeDept.id, comment: 'Ticket created', createdAt: t8Created },
      { action: 'ASSIGNED', agentId: admin.id,     departmentId: financeDept.id, comment: 'Assigned to Mike Johnson', createdAt: hoursAfter(t8Created, 6) },
    ],
  });

  // HD-2026-00009 — CLOSED (Jan 25)
  const t9Created = daysAgo(51);
  await makeTicket({
    ticketNumber: 'HD-2026-00009', priority: 'HIGH', status: 'CLOSED',
    title: 'Increase storage capacity on NAS server',
    description: 'NAS-02 at 92% capacity. Engineering and Finance teams need additional 10TB. Request to add 4x 4TB drives in RAID 5 configuration.',
    departmentId: infraDept.id, categoryId: catInfra.id, ticketTypeId: ttChange.id,
    assignedToId: agentSarah.id, createdAt: t9Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,      departmentId: infraDept.id, comment: 'Ticket created', createdAt: t9Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: infraDept.id, comment: 'Assigned to Sarah Wilson', createdAt: hoursAfter(t9Created, 4) },
      { action: 'IN_PROGRESS', agentId: agentSarah.id, departmentId: infraDept.id, comment: 'Drives ordered. ETA 3 days.', createdAt: hoursAfter(t9Created, 8) },
      { action: 'RESOLVED',    agentId: agentSarah.id, departmentId: infraDept.id, comment: 'Drives installed and RAID rebuilt. Capacity increased to 22TB usable.', createdAt: hoursAfter(t9Created, 80) },
      { action: 'VERIFIED',    agentId: supervisor.id, departmentId: infraDept.id, verified: true, createdAt: hoursAfter(t9Created, 96) },
      { action: 'CLOSED',      agentId: supervisor.id, departmentId: infraDept.id, createdAt: hoursAfter(t9Created, 97) },
    ],
  });

  // HD-2026-00010 — CANCELLED (Jan 28)
  const t10Created = daysAgo(48);
  await makeTicket({
    ticketNumber: 'HD-2026-00010', priority: 'MEDIUM', status: 'CANCELLED',
    title: 'Office printer paper jam — 3rd floor',
    description: 'HP LaserJet Pro M404n on 3rd floor repeatedly jamming. Already cleared 3 times today. Requesting maintenance or replacement.',
    departmentId: opsDept.id, categoryId: catOther.id, ticketTypeId: ttRequest.id,
    assignedToId: null, createdAt: t10Created,
    logs: [
      { action: 'CREATED',   agentId: agentTom.id, departmentId: opsDept.id, comment: 'Ticket created', createdAt: t10Created },
      { action: 'CANCELLED', agentId: admin.id,    departmentId: opsDept.id, comment: 'Facilities team handled directly. No IT action needed.', createdAt: hoursAfter(t10Created, 4) },
    ],
  });

  // HD-2026-00011 — RESOLVED (Feb 1)
  const t11Created = daysAgo(44);
  await makeTicket({
    ticketNumber: 'HD-2026-00011', priority: 'CRITICAL', status: 'RESOLVED',
    title: 'ERP system down — cannot process customer orders',
    description: 'SAP ERP unresponsive since 09:15. Sales team cannot process orders. Customers waiting. Revenue impact estimated at $15k/hr.',
    departmentId: itDept.id, categoryId: catSoftware.id, ticketTypeId: ttProblem.id,
    assignedToId: agentJohn.id, createdAt: t11Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,      departmentId: itDept.id, comment: 'P0 incident — all hands', createdAt: t11Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t11Created, 0.25) },
      { action: 'ESCALATED',   agentId: agentJohn.id,  departmentId: itDept.id, comment: 'Escalating — DB connection pool exhausted, need DBA', createdAt: hoursAfter(t11Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id,  departmentId: itDept.id, comment: 'DBA increasing connection pool and recycling app servers', createdAt: hoursAfter(t11Created, 1.5) },
      { action: 'RESOLVED',    agentId: agentJohn.id,  departmentId: itDept.id, comment: 'ERP restored. Root cause: connection leak in v3.2.1 patch. Patched to v3.2.2.', createdAt: hoursAfter(t11Created, 4) },
    ],
  });

  // HD-2026-00012 — VERIFIED (Feb 3)
  const t12Created = daysAgo(42);
  await makeTicket({
    ticketNumber: 'HD-2026-00012', priority: 'HIGH', status: 'VERIFIED',
    title: 'WiFi dead zones in Building B east wing',
    description: 'Multiple employees report no WiFi signal in rooms B-204 through B-212. Access point AP-B-04 may be offline. Affects 20 workstations.',
    departmentId: itDept.id, categoryId: catNetwork.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t12Created,
    logs: [
      { action: 'CREATED',     agentId: agentJohn.id,  departmentId: itDept.id, comment: 'Ticket created', createdAt: t12Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t12Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id,  departmentId: itDept.id, comment: 'AP-B-04 found offline — power cycling and firmware update', createdAt: hoursAfter(t12Created, 3) },
      { action: 'RESOLVED',    agentId: agentJohn.id,  departmentId: itDept.id, comment: 'AP replaced with spare unit. Coverage restored.', createdAt: hoursAfter(t12Created, 10) },
      { action: 'VERIFIED',    agentId: supervisor.id, departmentId: itDept.id, verified: true, comment: 'Signal confirmed in all rooms.', createdAt: hoursAfter(t12Created, 24) },
    ],
  });

  // HD-2026-00013 — ASSIGNED (Feb 5)
  const t13Created = daysAgo(40);
  await makeTicket({
    ticketNumber: 'HD-2026-00013', priority: 'MEDIUM', status: 'ASSIGNED',
    title: 'Salary slip portal showing wrong tax deductions',
    description: 'Three employees report incorrect TDS deductions on their Feb payslips — values showing as if they are in a higher tax bracket. Needs correction before month end.',
    departmentId: hrDept.id, categoryId: catPayroll.id, ticketTypeId: ttProblem.id,
    assignedToId: agentJane.id, createdAt: t13Created,
    logs: [
      { action: 'CREATED',  agentId: agentJane.id, departmentId: hrDept.id, comment: 'Ticket created', createdAt: t13Created },
      { action: 'ASSIGNED', agentId: admin.id,     departmentId: hrDept.id, comment: 'Assigned to Jane Smith', createdAt: hoursAfter(t13Created, 3) },
    ],
  });

  // HD-2026-00014 — IN_PROGRESS (Feb 8)
  const t14Created = daysAgo(37);
  await makeTicket({
    ticketNumber: 'HD-2026-00014', priority: 'HIGH', status: 'IN_PROGRESS',
    title: 'SSL certificate expiring on customer portal in 14 days',
    description: 'SSL cert for customer.helpdesk.io expires Feb 22. Auto-renewal failed (ACME challenge error). Manual renewal required before expiry to avoid downtime.',
    departmentId: infraDept.id, categoryId: catSecurity.id, ticketTypeId: ttIncident.id,
    assignedToId: agentSarah.id, createdAt: t14Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,      departmentId: infraDept.id, comment: 'Ticket created', createdAt: t14Created },
      { action: 'ASSIGNED',    agentId: admin.id,      departmentId: infraDept.id, comment: 'Assigned to Sarah Wilson', createdAt: hoursAfter(t14Created, 2) },
      { action: 'IN_PROGRESS', agentId: agentSarah.id, departmentId: infraDept.id, comment: 'Investigating ACME challenge failure — likely DNS propagation delay', createdAt: hoursAfter(t14Created, 6) },
    ],
  });

  // HD-2026-00015 — PENDING (Feb 10)
  const t15Created = daysAgo(35);
  await makeTicket({
    ticketNumber: 'HD-2026-00015', priority: 'LOW', status: 'PENDING',
    title: 'Request ergonomic chair replacement for warehouse staff',
    description: 'Warehouse staff (6 employees) requesting ergonomic chairs per new occupational health policy. Procurement needs HR approval before purchase order.',
    departmentId: opsDept.id, categoryId: catService.id, ticketTypeId: ttRequest.id,
    assignedToId: agentTom.id, createdAt: t15Created,
    logs: [
      { action: 'CREATED',     agentId: agentTom.id, departmentId: opsDept.id, comment: 'Ticket created', createdAt: t15Created },
      { action: 'ASSIGNED',    agentId: admin.id,    departmentId: opsDept.id, comment: 'Assigned to Tom Brown', createdAt: hoursAfter(t15Created, 4) },
      { action: 'IN_PROGRESS', agentId: agentTom.id, departmentId: opsDept.id, comment: 'Submitted request to HR for budget approval', createdAt: hoursAfter(t15Created, 8) },
      { action: 'PENDING',     agentId: agentTom.id, departmentId: opsDept.id, comment: 'Awaiting HR approval sign-off', createdAt: hoursAfter(t15Created, 10) },
    ],
  });

  // HD-2026-00016 — OPEN (Feb 12)
  const t16Created = daysAgo(33);
  await makeTicket({
    ticketNumber: 'HD-2026-00016', priority: 'CRITICAL', status: 'OPEN',
    title: 'Production database backup failing silently',
    description: 'Automated backup job for prod-db-01 has been silently failing since Feb 10. Last successful backup was 3 days ago. Retention policy not met — urgent action required.',
    departmentId: itDept.id, categoryId: catSoftware.id, ticketTypeId: ttIncident.id,
    assignedToId: null, createdAt: t16Created,
    logs: [
      { action: 'CREATED', agentId: admin.id, departmentId: itDept.id, comment: 'Ticket created — no backup for 3 days', createdAt: t16Created },
    ],
  });

  // HD-2026-00017 — ESCALATED (Feb 15)
  const t17Created = daysAgo(30);
  await makeTicket({
    ticketNumber: 'HD-2026-00017', priority: 'HIGH', status: 'ESCALATED',
    title: 'Vendor payment portal access denied for Finance',
    description: 'Finance team unable to log in to vendor payment portal since Feb 13. Vendor support unresponsive. Feb payment run due Feb 18.',
    departmentId: financeDept.id, categoryId: catAccess.id, ticketTypeId: ttIncident.id,
    assignedToId: agentMike.id, createdAt: t17Created,
    logs: [
      { action: 'CREATED',   agentId: agentMike.id, departmentId: financeDept.id, comment: 'Ticket created', createdAt: t17Created },
      { action: 'ASSIGNED',  agentId: admin.id,     departmentId: financeDept.id, comment: 'Assigned to Mike Johnson', createdAt: hoursAfter(t17Created, 1) },
      { action: 'ESCALATED', agentId: agentMike.id, departmentId: financeDept.id, comment: 'Vendor unresponsive for 48h. Escalating to management.', createdAt: hoursAfter(t17Created, 50) },
    ],
  });

  // HD-2026-00018 — IN_PROGRESS (Feb 18)
  const t18Created = daysAgo(27);
  await makeTicket({
    ticketNumber: 'HD-2026-00018', priority: 'MEDIUM', status: 'IN_PROGRESS',
    title: 'Keyboard and mouse unresponsive after suspend',
    description: 'Dell desktop (Optiplex 7090) USB devices stop responding after sleep/suspend. Only hard reboot fixes it. Affects 5 machines in IT office. Likely USB power management bug.',
    departmentId: itDept.id, categoryId: catHardware.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t18Created,
    logs: [
      { action: 'CREATED',     agentId: agentJohn.id, departmentId: itDept.id, comment: 'Ticket created', createdAt: t18Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t18Created, 2) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id, departmentId: itDept.id, comment: 'Disabling USB selective suspend via Group Policy. Testing.', createdAt: hoursAfter(t18Created, 6) },
    ],
  });

  // HD-2026-00019 — RESOLVED (Feb 20)
  const t19Created = daysAgo(25);
  await makeTicket({
    ticketNumber: 'HD-2026-00019', priority: 'HIGH', status: 'RESOLVED',
    title: 'Offboarding — revoke all access for departing employee',
    description: 'Employee David Park (Finance, analyst) last day Feb 20. Revoke AD, email, Salesforce, SAP, and Slack access. Archive mailbox for 90 days per policy.',
    departmentId: hrDept.id, categoryId: catOnboard.id, ticketTypeId: ttRequest.id,
    assignedToId: agentJane.id, createdAt: t19Created,
    logs: [
      { action: 'CREATED',     agentId: agentJane.id, departmentId: hrDept.id, comment: 'Ticket created', createdAt: t19Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: hrDept.id, comment: 'Assigned to Jane Smith', createdAt: hoursAfter(t19Created, 1) },
      { action: 'IN_PROGRESS', agentId: agentJane.id, departmentId: hrDept.id, comment: 'Disabling accounts and revoking licenses', createdAt: hoursAfter(t19Created, 3) },
      { action: 'RESOLVED',    agentId: agentJane.id, departmentId: hrDept.id, comment: 'All access revoked. Mailbox archived. Equipment return pending facilities.', createdAt: hoursAfter(t19Created, 8) },
    ],
  });

  // HD-2026-00020 — OPEN (Feb 22)
  const t20Created = daysAgo(23);
  await makeTicket({
    ticketNumber: 'HD-2026-00020', priority: 'MEDIUM', status: 'OPEN',
    title: 'Q1 expense report template broken in Excel',
    description: 'The Q1 2026 expense report template (shared on SharePoint) has a broken macro that prevents submission. Error: "Run-time error 1004" when clicking Submit button. Affecting whole Finance team.',
    departmentId: financeDept.id, categoryId: catPayroll.id, ticketTypeId: ttProblem.id,
    assignedToId: null, createdAt: t20Created,
    logs: [
      { action: 'CREATED', agentId: agentMike.id, departmentId: financeDept.id, comment: 'Ticket created', createdAt: t20Created },
    ],
  });

  // HD-2026-00021 — ASSIGNED (Feb 25)
  const t21Created = daysAgo(20);
  await makeTicket({
    ticketNumber: 'HD-2026-00021', priority: 'HIGH', status: 'ASSIGNED',
    title: 'Deploy monitoring stack (Prometheus + Grafana) on staging',
    description: 'Engineering requested Prometheus + Grafana deployment on staging cluster for sprint metrics. Includes node_exporter on 8 VMs, alertmanager config, and Slack webhook integration.',
    departmentId: infraDept.id, categoryId: catInfra.id, ticketTypeId: ttChange.id,
    assignedToId: agentSarah.id, createdAt: t21Created,
    logs: [
      { action: 'CREATED',  agentId: admin.id,      departmentId: infraDept.id, comment: 'Ticket created', createdAt: t21Created },
      { action: 'ASSIGNED', agentId: admin.id,      departmentId: infraDept.id, comment: 'Assigned to Sarah Wilson', createdAt: hoursAfter(t21Created, 4) },
    ],
  });

  // HD-2026-00022 — IN_PROGRESS (Mar 1)
  const t22Created = daysAgo(16);
  await makeTicket({
    ticketNumber: 'HD-2026-00022', priority: 'CRITICAL', status: 'IN_PROGRESS',
    title: 'Internet outage — entire office (ISP issue)',
    description: 'Full internet outage affecting the main office since 08:45. ISP ticket raised. 50+ employees unable to work remotely via office connection. Failover 4G router activated as temp measure.',
    departmentId: itDept.id, categoryId: catNetwork.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t22Created,
    logs: [
      { action: 'CREATED',     agentId: admin.id,     departmentId: itDept.id, comment: 'Full outage — ISP ticket opened', createdAt: t22Created },
      { action: 'ASSIGNED',    agentId: admin.id,     departmentId: itDept.id, comment: 'Assigned to John Doe', createdAt: hoursAfter(t22Created, 0.5) },
      { action: 'IN_PROGRESS', agentId: agentJohn.id, departmentId: itDept.id, comment: 'Coordinating with ISP NOC. Failover router active for critical services.', createdAt: hoursAfter(t22Created, 1) },
    ],
  });

  // HD-2026-00023 — PENDING (Mar 5)
  const t23Created = daysAgo(12);
  await makeTicket({
    ticketNumber: 'HD-2026-00023', priority: 'MEDIUM', status: 'PENDING',
    title: 'Request new building access cards for contractors',
    description: 'Three new contractors starting Mar 10 need temporary building access cards (90-day validity). Require HR clearance before issuing. Names: Alex Rivera, Sam Lee, Jordan Kim.',
    departmentId: opsDept.id, categoryId: catOther.id, ticketTypeId: ttRequest.id,
    assignedToId: agentTom.id, createdAt: t23Created,
    logs: [
      { action: 'CREATED',     agentId: agentTom.id, departmentId: opsDept.id, comment: 'Ticket created', createdAt: t23Created },
      { action: 'ASSIGNED',    agentId: admin.id,    departmentId: opsDept.id, comment: 'Assigned to Tom Brown', createdAt: hoursAfter(t23Created, 2) },
      { action: 'IN_PROGRESS', agentId: agentTom.id, departmentId: opsDept.id, comment: 'Submitted contractor clearance forms to HR', createdAt: hoursAfter(t23Created, 4) },
      { action: 'PENDING',     agentId: agentTom.id, departmentId: opsDept.id, comment: 'Waiting on HR background check clearance', createdAt: hoursAfter(t23Created, 6) },
    ],
  });

  // HD-2026-00024 — OPEN (Mar 10)
  const t24Created = daysAgo(7);
  await makeTicket({
    ticketNumber: 'HD-2026-00024', priority: 'LOW', status: 'OPEN',
    title: 'Onboarding portal login issue for new hire',
    description: 'New hire Priya Nair (HR dept, starting Mar 17) received onboarding portal invite but cannot log in. Error: "Account not yet activated". IT needs to check provisioning.',
    departmentId: hrDept.id, categoryId: catService.id, ticketTypeId: ttRequest.id,
    assignedToId: null, createdAt: t24Created,
    logs: [
      { action: 'CREATED', agentId: agentJane.id, departmentId: hrDept.id, comment: 'Ticket created', createdAt: t24Created },
    ],
  });

  // HD-2026-00025 — ASSIGNED (Mar 14)
  const t25Created = daysAgo(3);
  await makeTicket({
    ticketNumber: 'HD-2026-00025', priority: 'HIGH', status: 'ASSIGNED',
    title: 'Antivirus alerts on finance workstation — possible malware',
    description: 'Windows Defender flagged suspicious activity on workstation FIN-WS-07 (Mike Johnson). Quarantined file: svchost32.exe in AppData/Roaming. Needs forensic scan and reimaging if confirmed.',
    departmentId: itDept.id, categoryId: catSecurity.id, ticketTypeId: ttIncident.id,
    assignedToId: agentJohn.id, createdAt: t25Created,
    logs: [
      { action: 'CREATED',  agentId: admin.id, departmentId: itDept.id, comment: 'Security alert — potential malware', createdAt: t25Created },
      { action: 'ASSIGNED', agentId: admin.id, departmentId: itDept.id, comment: 'Assigned to John Doe for forensic review', createdAt: hoursAfter(t25Created, 1) },
    ],
  });

  // ── Update TicketCounter so future UI-created tickets don't collide ────────
  await prisma.ticketCounter.upsert({
    where:  { year: 2026 },
    update: { seq: 25 },
    create: { year: 2026, seq: 25 },
  });

  console.log(`✅ 25 tickets seeded (HD-2026-00001 → HD-2026-00025)`);
  console.log('\n✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
