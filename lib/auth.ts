import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Get user with organization
        const userWithOrg = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            organization: true,
          },
        });

        session.user.id = user.id;
        session.user.organizationId = userWithOrg?.organizationId;
        session.user.organization = userWithOrg?.organization;
        session.user.role = userWithOrg?.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { organization: true },
        });

        // If user doesn't have an organization, create one
        if (existingUser && !existingUser.organizationId) {
          const slug = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          const organization = await prisma.organization.create({
            data: {
              name: `${user.name}'s Organization`,
              slug: `${slug}-${Date.now()}`,
              plan: 'trial',
              documentsLimit: 5,
            },
          });

          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              organizationId: organization.id,
              role: 'owner',
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'database',
  },
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organizationId?: string | null;
      organization?: {
        id: string;
        name: string;
        slug: string;
        plan: string;
        documentsUsed: number;
        documentsLimit: number;
      } | null;
      role?: string;
    };
  }
}