import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AgentRole } from '../common/enums/agent-role.enum';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AgentRole.ADMIN, AgentRole.SUPERVISOR)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPI overview cards — open count, resolution rate, avg resolution time' })
  getOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(query);
  }

  @Get('ticket-volume')
  @ApiOperation({ summary: 'Ticket creation volume over time (day/week/month buckets)' })
  getTicketVolume(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTicketVolume(query);
  }

  @Get('priority-distribution')
  @ApiOperation({ summary: 'Ticket count breakdown by priority' })
  getPriorityDistribution(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPriorityDistribution(query);
  }

  @Get('department-breakdown')
  @ApiOperation({ summary: 'Ticket count breakdown by department' })
  getDepartmentBreakdown(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDepartmentBreakdown(query);
  }

  @Get('resolution-time')
  @ApiOperation({ summary: 'Average resolution time trend (hours) over time buckets' })
  getResolutionTimeTrend(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getResolutionTimeTrend(query);
  }

  @Get('agent-load')
  @ApiOperation({ summary: 'Per-agent ticket load: assigned, resolved, avg resolution time' })
  getAgentLoad(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getAgentLoad(query);
  }
}
