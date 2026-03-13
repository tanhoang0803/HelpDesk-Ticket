import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            { email: credentials.email, password: credentials.password },
          );
          if (data.data?.accessToken) {
            return {
              id:           data.data.agent.id,
              name:         data.data.agent.name,
              email:        data.data.agent.email,
              accessToken:  data.data.accessToken,
              refreshToken: data.data.refreshToken,
              role:         data.data.agent.role,
              departmentId: data.data.agent.departmentId,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken  = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role         = (user as any).role;
        token.departmentId = (user as any).departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken      = token.accessToken;
      (session.user as any).role         = token.role;
      (session.user as any).departmentId = token.departmentId;
      (session.user as any).id           = token.sub;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
};
