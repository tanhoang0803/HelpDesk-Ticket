import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Prisma fields have NO @map on individual columns, so PostgreSQL column names
// are camelCase (quoted identifiers in the migration). All raw SQL must use
// quoted camelCase column names, e.g. "createdAt", "ticketId", "departmentId".

interface VolumeBucket  { bucket: Date; count: bigint }
interface ResolutionRow { bucket: Date; avg_hours: number; count: bigint }
interface AgentLoadRow  {
  agentId: string; agentName: string; department: string;
  assigned: bigint; resolved: bigint; avg_resolution_hours: number | null;
}

function toDateRange(startDate?: string, endDate?: string) {
  const end   = endDate   ? new Date(endDate)   : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  // ── Overview KPIs ────────────────────────────────────────────────────────

  async getOverview(startDate?: string, endDate?: string, departmentId?: string) {
    const { start, end } = toDateRange(startDate, endDate);
    const deptFilter  = departmentId ? { departmentId } : {};
    const baseWhere   = { deletedAt: null, ...deptFilter };

    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart  = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      byStatus, createdToday, createdWeek, createdInRange, resolvedInRange, createdThisMonth, avgResolution,
    ] = await Promise.all([
      this.prisma.ticket.groupBy({ by: ['status'], _count: { id: true }, where: baseWhere }),
      this.prisma.ticket.count({ where: { ...baseWhere, createdAt: { gte: today } } }),
      this.prisma.ticket.count({ where: { ...baseWhere, createdAt: { gte: weekStart } } }),
      this.prisma.ticket.count({ where: { ...baseWhere, createdAt: { gte: start, lte: end } } }),
      this.prisma.ticket.count({ where: { ...baseWhere, status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] }, updatedAt: { gte: start, lte: end } } }),
      this.prisma.ticket.count({ where: { ...baseWhere, createdAt: { gte: monthStart } } }),
      this.getAvgResolutionHours(start, end, departmentId),
    ]);

    const statusMap    = Object.fromEntries(byStatus.map((r) => [r.status, r._count.id]));
    const openCount    = (statusMap['OPEN'] ?? 0) + (statusMap['ASSIGNED'] ?? 0) + (statusMap['IN_PROGRESS'] ?? 0) + (statusMap['PENDING'] ?? 0);
    const resolutionRate = createdInRange > 0 ? Math.round((resolvedInRange / createdInRange) * 100) : 0;

    return {
      statusDistribution:    byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      openTickets:           openCount,
      createdToday,
      createdThisWeek:       createdWeek,
      createdThisMonth,
      resolutionRatePercent: resolutionRate,
      avgResolutionHours:    avgResolution,
    };
  }

  private async getAvgResolutionHours(start: Date, end: Date, departmentId?: string): Promise<number> {
    // Dept filter via subquery to avoid Cartesian product
    const deptFilter = departmentId
      ? `AND c."ticketId" IN (SELECT id FROM tickets WHERE "departmentId" = '${departmentId}')`
      : '';

    const rows = await this.prisma.$queryRawUnsafe<{ avg_hours: number }[]>(`
      SELECT AVG(EXTRACT(EPOCH FROM (r."createdAt" - c."createdAt")) / 3600.0)::float AS avg_hours
      FROM tracking_logs c
      JOIN tracking_logs r ON r."ticketId" = c."ticketId"
      WHERE c.action = 'CREATED'
        AND r.action = 'RESOLVED'
        AND r."createdAt" >= $1
        AND r."createdAt" <= $2
        ${deptFilter}
    `, start, end);

    return rows[0]?.avg_hours ?? 0;
  }

  // ── Ticket Volume (time-series) ───────────────────────────────────────────

  async getTicketVolume(
    startDate?: string,
    endDate?: string,
    granularity: 'day' | 'week' | 'month' = 'day',
    departmentId?: string,
  ) {
    const { start, end } = toDateRange(startDate, endDate);
    const grain          = ['day', 'week', 'month'].includes(granularity) ? granularity : 'day';
    const deptClause     = departmentId ? `AND "departmentId" = '${departmentId}'` : '';

    const rows = await this.prisma.$queryRawUnsafe<VolumeBucket[]>(`
      SELECT DATE_TRUNC('${grain}', "createdAt") AS bucket, COUNT(*)::bigint AS count
      FROM tickets
      WHERE "createdAt" >= $1
        AND "createdAt" <= $2
        AND "deletedAt" IS NULL
        ${deptClause}
      GROUP BY bucket
      ORDER BY bucket
    `, start, end);

    return rows.map((r) => ({
      bucket: r.bucket.toISOString(),
      count:  Number(r.count),
    }));
  }

  // ── Priority Distribution ─────────────────────────────────────────────────

  async getPriorityDistribution(startDate?: string, endDate?: string, departmentId?: string) {
    const { start, end } = toDateRange(startDate, endDate);
    const deptFilter     = departmentId ? { departmentId } : {};

    const rows = await this.prisma.ticket.groupBy({
      by:    ['priority'],
      _count: { id: true },
      where:  { deletedAt: null, createdAt: { gte: start, lte: end }, ...deptFilter },
    });

    const total = rows.reduce((s, r) => s + r._count.id, 0);
    return rows.map((r) => ({
      priority: r.priority,
      count:    r._count.id,
      percent:  total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));
  }

  // ── Department Breakdown ──────────────────────────────────────────────────

  async getDepartmentBreakdown(startDate?: string, endDate?: string) {
    const { start, end } = toDateRange(startDate, endDate);

    const rows = await this.prisma.ticket.groupBy({
      by:    ['departmentId'],
      _count: { id: true },
      where:  { deletedAt: null, createdAt: { gte: start, lte: end } },
    });

    const deptIds = rows.map((r) => r.departmentId);
    const depts   = await this.prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
    const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

    const total = rows.reduce((s, r) => s + r._count.id, 0);
    return rows
      .map((r) => ({
        department: deptMap[r.departmentId] ?? r.departmentId,
        count:      r._count.id,
        percent:    total > 0 ? Math.round((r._count.id / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Resolution Time Trend ─────────────────────────────────────────────────

  async getResolutionTimeTrend(
    startDate?: string,
    endDate?: string,
    granularity: 'day' | 'week' | 'month' = 'day',
    departmentId?: string,
  ) {
    const { start, end } = toDateRange(startDate, endDate);
    const grain          = ['day', 'week', 'month'].includes(granularity) ? granularity : 'day';
    const deptFilter     = departmentId
      ? `AND c."ticketId" IN (SELECT id FROM tickets WHERE "departmentId" = '${departmentId}' AND "deletedAt" IS NULL)`
      : `AND c."ticketId" IN (SELECT id FROM tickets WHERE "deletedAt" IS NULL)`;

    const rows = await this.prisma.$queryRawUnsafe<ResolutionRow[]>(`
      SELECT
        DATE_TRUNC('${grain}', r."createdAt") AS bucket,
        AVG(EXTRACT(EPOCH FROM (r."createdAt" - c."createdAt")) / 3600.0)::float AS avg_hours,
        COUNT(*)::bigint AS count
      FROM tracking_logs c
      JOIN tracking_logs r ON r."ticketId" = c."ticketId"
      WHERE c.action = 'CREATED'
        AND r.action = 'RESOLVED'
        AND r."createdAt" >= $1
        AND r."createdAt" <= $2
        ${deptFilter}
      GROUP BY bucket
      ORDER BY bucket
    `, start, end);

    return rows.map((r) => ({
      bucket:   r.bucket.toISOString(),
      avgHours: Math.round((r.avg_hours ?? 0) * 10) / 10,
      count:    Number(r.count),
    }));
  }

  // ── Agent Load ────────────────────────────────────────────────────────────

  async getAgentLoad(startDate?: string, endDate?: string, departmentId?: string) {
    const { start, end } = toDateRange(startDate, endDate);
    const deptClause     = departmentId ? `AND a."departmentId" = '${departmentId}'` : '';

    const rows = await this.prisma.$queryRawUnsafe<AgentLoadRow[]>(`
      SELECT
        a.id                                                              AS "agentId",
        a.name                                                            AS "agentName",
        d.name                                                            AS department,
        COUNT(DISTINCT t.id) FILTER (
          WHERE t.status NOT IN ('CLOSED', 'CANCELLED') AND t."deletedAt" IS NULL
        )::bigint                                                         AS assigned,
        COUNT(DISTINCT rl."ticketId") FILTER (
          WHERE rl.action = 'RESOLVED'
            AND rl."createdAt" >= $1 AND rl."createdAt" <= $2
        )::bigint                                                         AS resolved,
        AVG(
          EXTRACT(EPOCH FROM (rl."createdAt" - c."createdAt")) / 3600.0
        ) FILTER (
          WHERE rl.action = 'RESOLVED'
            AND rl."createdAt" >= $1 AND rl."createdAt" <= $2
        )::float                                                          AS avg_resolution_hours
      FROM agents a
      JOIN departments d ON d.id = a."departmentId"
      LEFT JOIN tickets t ON t."assignedToId" = a.id
      LEFT JOIN tracking_logs rl ON rl."agentId" = a.id
      LEFT JOIN tracking_logs c  ON c."ticketId" = rl."ticketId" AND c.action = 'CREATED'
      WHERE a."isActive" = true
        ${deptClause}
      GROUP BY a.id, a.name, d.name
      ORDER BY assigned DESC
    `, start, end);

    return rows.map((r) => ({
      agentId:            r.agentId,
      agentName:          r.agentName,
      department:         r.department,
      assigned:           Number(r.assigned),
      resolved:           Number(r.resolved),
      avgResolutionHours: r.avg_resolution_hours != null
        ? Math.round(r.avg_resolution_hours * 10) / 10
        : null,
    }));
  }
}
