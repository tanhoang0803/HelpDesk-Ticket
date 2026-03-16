import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

// Simple in-memory TTL cache — avoids external dependency while protecting the DB
interface CacheEntry { value: unknown; expiresAt: number }

@Injectable()
export class AnalyticsService {
  private cache = new Map<string, CacheEntry>();

  constructor(private repo: AnalyticsRepository) {}

  private cacheKey(metric: string, q: AnalyticsQueryDto): string {
    return `${metric}:${q.startDate ?? ''}:${q.endDate ?? ''}:${q.departmentId ?? ''}:${q.granularity ?? ''}`;
  }

  private async cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value as T;
    const value = await fn();
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  getOverview(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('overview', q),
      2 * 60 * 1000,
      () => this.repo.getOverview(q.startDate, q.endDate, q.departmentId),
    );
  }

  getTicketVolume(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('volume', q),
      15 * 60 * 1000,
      () => this.repo.getTicketVolume(q.startDate, q.endDate, q.granularity ?? 'day', q.departmentId),
    );
  }

  getPriorityDistribution(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('priority', q),
      5 * 60 * 1000,
      () => this.repo.getPriorityDistribution(q.startDate, q.endDate, q.departmentId),
    );
  }

  getDepartmentBreakdown(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('department', q),
      5 * 60 * 1000,
      () => this.repo.getDepartmentBreakdown(q.startDate, q.endDate),
    );
  }

  getResolutionTimeTrend(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('resolution', q),
      15 * 60 * 1000,
      () => this.repo.getResolutionTimeTrend(q.startDate, q.endDate, q.granularity ?? 'day', q.departmentId),
    );
  }

  getAgentLoad(q: AnalyticsQueryDto) {
    return this.cached(
      this.cacheKey('agents', q),
      15 * 60 * 1000,
      () => this.repo.getAgentLoad(q.startDate, q.endDate, q.departmentId),
    );
  }
}
