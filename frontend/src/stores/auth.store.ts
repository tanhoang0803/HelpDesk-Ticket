import { create } from 'zustand';
import { AgentRole } from '@/types/agent.types';

interface AuthState {
  userId:       string | null;
  role:         AgentRole | null;
  departmentId: string | null;
  setUser: (user: { userId: string; role: AgentRole; departmentId: string }) => void;
  clear:   () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId:       null,
  role:         null,
  departmentId: null,
  setUser: ({ userId, role, departmentId }) => set({ userId, role, departmentId }),
  clear:   () => set({ userId: null, role: null, departmentId: null }),
}));
