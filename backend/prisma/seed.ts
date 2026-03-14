import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Departments ───────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'IT Support' },
      update: {},
      create: { name: 'IT Support', description: 'Handles software, hardware, and network issues' },
    }),
    prisma.department.upsert({
      where: { name: 'HR' },
      update: {},
      create: { name: 'HR', description: 'Human resources and employee-related requests' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance', description: 'Finance and accounting support' },
    }),
    prisma.department.upsert({
      where: { name: 'Infrastructure' },
      update: {},
      create: { name: 'Infrastructure', description: 'Server, network infrastructure, and DevOps' },
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations', description: 'General operations and facilities' },
    }),
  ]);

  console.log(`✅ ${departments.length} departments seeded`);

  // ─── Ticket Types ──────────────────────────────────────────────
  const ticketTypes = await Promise.all([
    prisma.ticketType.upsert({ where: { name: 'Incident' },       update: {}, create: { name: 'Incident' } }),
    prisma.ticketType.upsert({ where: { name: 'Request' },        update: {}, create: { name: 'Request' } }),
    prisma.ticketType.upsert({ where: { name: 'Problem' },        update: {}, create: { name: 'Problem' } }),
    prisma.ticketType.upsert({ where: { name: 'Change Request' }, update: {}, create: { name: 'Change Request' } }),
  ]);

  console.log(`✅ ${ticketTypes.length} ticket types seeded`);

  // ─── Categories ────────────────────────────────────────────────
  // Delete old non-UUID category rows if they exist
  await prisma.category.deleteMany({
    where: { id: { in: ['cat-software-001','cat-hardware-001','cat-network-001','cat-access-001','cat-service-001','cat-payroll-001','cat-onboard-001','cat-infra-001','cat-security-001','cat-other-001'] } },
  });

  const categories = await Promise.all([
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

  console.log(`✅ ${categories.length} categories seeded`);

  // ─── Admin Agent ───────────────────────────────────────────────
  const itDept = departments.find((d) => d.name === 'IT Support')!;
  const adminHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.agent.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@helpdesk.com',
      passwordHash: adminHash,
      departmentId: itDept.id,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // ─── Supervisor ────────────────────────────────────────────────
  const supervisorHash = await bcrypt.hash('Super@1234', 12);
  const supervisor = await prisma.agent.upsert({
    where: { email: 'supervisor@helpdesk.com' },
    update: {},
    create: {
      name: 'IT Supervisor',
      email: 'supervisor@helpdesk.com',
      passwordHash: supervisorHash,
      departmentId: itDept.id,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  // ─── Sample Agent ──────────────────────────────────────────────
  const agentHash = await bcrypt.hash('Agent@1234', 12);
  const agent = await prisma.agent.upsert({
    where: { email: 'agent@helpdesk.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'agent@helpdesk.com',
      passwordHash: agentHash,
      departmentId: itDept.id,
      role: 'AGENT',
      isActive: true,
    },
  });

  console.log(`✅ Agents seeded: admin, supervisor, agent`);
  console.log('');
  console.log('─────────────────────────────────────────────');
  console.log('🔑 Default credentials:');
  console.log('   Admin:      admin@helpdesk.com      / Admin@1234');
  console.log('   Supervisor: supervisor@helpdesk.com / Super@1234');
  console.log('   Agent:      agent@helpdesk.com      / Agent@1234');
  console.log('─────────────────────────────────────────────');
  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
