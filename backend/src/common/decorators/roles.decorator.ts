import { SetMetadata } from '@nestjs/common';
import { AgentRole } from '../enums/agent-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AgentRole[]) => SetMetadata(ROLES_KEY, roles);
