export type AgentRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'REQUESTER';

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  departmentId: string;
}
