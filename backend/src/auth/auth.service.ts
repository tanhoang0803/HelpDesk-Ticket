import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AgentsService } from '../agents/agents.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private agentsService: AgentsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAgent(email: string, password: string) {
    const agent = await this.prisma.agent.findUnique({ where: { email } });
    if (!agent || !agent.isActive) return null;
    const isMatch = await bcrypt.compare(password, agent.passwordHash);
    if (!isMatch) return null;
    return agent;
  }

  async login(agent: { id: string; email: string; role: string; departmentId: string; name: string }) {
    const payload: JwtPayload = {
      sub: agent.id,
      email: agent.email,
      role: agent.role,
      departmentId: agent.departmentId,
    };

    const accessToken = this.jwtService.sign(payload as any);
    const refreshToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, agentId: agent.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role, departmentId: agent.departmentId },
    };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { agent: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.agent.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.login(stored.agent);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
}
