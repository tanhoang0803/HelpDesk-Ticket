import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

async function seedIfEmpty(prisma: PrismaService) {
  const count = await prisma.agent.count();
  if (count > 0) return;

  console.log('🌱 First boot: seeding initial data...');

  const [itDept] = await Promise.all([
    prisma.department.upsert({ where: { name: 'IT Support' },     update: {}, create: { name: 'IT Support',     description: 'Handles software, hardware, and network issues' } }),
    prisma.department.upsert({ where: { name: 'HR' },             update: {}, create: { name: 'HR',             description: 'Human resources and employee-related requests' } }),
    prisma.department.upsert({ where: { name: 'Finance' },        update: {}, create: { name: 'Finance',        description: 'Finance and accounting support' } }),
    prisma.department.upsert({ where: { name: 'Infrastructure' }, update: {}, create: { name: 'Infrastructure', description: 'Server, network infrastructure, and DevOps' } }),
    prisma.department.upsert({ where: { name: 'Operations' },     update: {}, create: { name: 'Operations',     description: 'General operations and facilities' } }),
  ]);

  await Promise.all([
    prisma.ticketType.upsert({ where: { name: 'Incident' },       update: {}, create: { name: 'Incident' } }),
    prisma.ticketType.upsert({ where: { name: 'Request' },        update: {}, create: { name: 'Request' } }),
    prisma.ticketType.upsert({ where: { name: 'Problem' },        update: {}, create: { name: 'Problem' } }),
    prisma.ticketType.upsert({ where: { name: 'Change Request' }, update: {}, create: { name: 'Change Request' } }),
  ]);

  await Promise.all([
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

  const [adminHash, supervisorHash, agentHash] = await Promise.all([
    bcrypt.hash('Admin@1234', 12),
    bcrypt.hash('Super@1234', 12),
    bcrypt.hash('Agent@1234', 12),
  ]);

  await Promise.all([
    prisma.agent.upsert({ where: { email: 'admin@helpdesk.com' },      update: {}, create: { name: 'System Admin',  email: 'admin@helpdesk.com',      passwordHash: adminHash,      departmentId: itDept.id, role: 'ADMIN',      isActive: true } }),
    prisma.agent.upsert({ where: { email: 'supervisor@helpdesk.com' }, update: {}, create: { name: 'IT Supervisor', email: 'supervisor@helpdesk.com', passwordHash: supervisorHash, departmentId: itDept.id, role: 'SUPERVISOR', isActive: true } }),
    prisma.agent.upsert({ where: { email: 'agent@helpdesk.com' },      update: {}, create: { name: 'John Doe',     email: 'agent@helpdesk.com',      passwordHash: agentHash,      departmentId: itDept.id, role: 'AGENT',      isActive: true } }),
  ]);

  await prisma.ticketCounter.upsert({ where: { year: 2026 }, update: {}, create: { year: 2026, seq: 0 } });

  console.log('✅ Seed complete — admin@helpdesk.com / Admin@1234');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Helpdesk Ticketing API')
    .setDescription('Enterprise-grade helpdesk ticketing system API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running at http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);

  // Seed after HTTP server is up so healthcheck passes immediately
  const prisma = app.get(PrismaService);
  seedIfEmpty(prisma).catch((e) => console.error('Seed error:', e));
}
bootstrap();
