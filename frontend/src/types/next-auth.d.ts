import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { AgentRole } from '@/types/agent.types';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: DefaultSession['user'] & {
      id: string;
      role: AgentRole;
      departmentId: string;
    };
  }

  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    role: AgentRole;
    departmentId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    role: AgentRole;
    departmentId: string;
  }
}
