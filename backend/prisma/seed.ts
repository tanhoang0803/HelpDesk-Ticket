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
  const categories = await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-software-001' }, update: {}, create: { id: 'cat-software-001', name: 'Software Issue' } }),
    prisma.category.upsert({ where: { id: 'cat-hardware-001' }, update: {}, create: { id: 'cat-hardware-001', name: 'Hardware Issue' } }),
    prisma.category.upsert({ where: { id: 'cat-network-001'  }, update: {}, create: { id: 'cat-network-001',  name: 'Network Issue' } }),
    prisma.category.upsert({ where: { id: 'cat-access-001'  }, update: {}, create: { id: 'cat-access-001',  name: 'Account Access' } }),
    prisma.category.upsert({ where: { id: 'cat-service-001' }, update: {}, create: { id: 'cat-service-001', name: 'Service Request' } }),
    prisma.category.upsert({ where: { id: 'cat-payroll-001' }, update: {}, create: { id: 'cat-payroll-001', name: 'Payroll Issue' } }),
    prisma.category.upsert({ where: { id: 'cat-onboard-001' }, update: {}, create: { id: 'cat-onboard-001', name: 'Onboarding' } }),
    prisma.category.upsert({ where: { id: 'cat-infra-001'   }, update: {}, create: { id: 'cat-infra-001',   name: 'Infrastructure Request' } }),
    prisma.category.upsert({ where: { id: 'cat-security-001'}, update: {}, create: { id: 'cat-security-001',name: 'Security Concern' } }),
    prisma.category.upsert({ where: { id: 'cat-other-001'   }, update: {}, create: { id: 'cat-other-001',   name: 'Other' } }),
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
