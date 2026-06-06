import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

// We build the adapter manually instead of using PrismaAdapter(@auth/prisma-adapter)
// because our Prisma client uses a custom output path (prisma/generated) which
// confuses the adapter's automatic model detection.
const adapter = {
  createUser: (data: any) => prisma.user.create({ data }),
  getUser: (id: string) => prisma.user.findUnique({ where: { id } }),
  getUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  getUserByAccount: ({ provider, providerAccountId }: any) =>
    prisma.account
      .findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } }, include: { user: true } })
      .then((a) => a?.user ?? null),
  updateUser: ({ id, ...data }: any) => prisma.user.update({ where: { id }, data }),
  deleteUser: (id: string) => prisma.user.delete({ where: { id } }),
  linkAccount: (data: any) => prisma.account.create({ data }) as any,
  unlinkAccount: ({ provider, providerAccountId }: any) =>
    prisma.account.delete({ where: { provider_providerAccountId: { provider, providerAccountId } } }) as any,
  createSession: (data: any) => prisma.authSession.create({ data }),
  getSessionAndUser: (sessionToken: string) =>
    prisma.authSession
      .findUnique({ where: { sessionToken }, include: { user: true } })
      .then((s) => (s ? { session: s, user: s.user } : null)),
  updateSession: ({ sessionToken, ...data }: any) =>
    prisma.authSession.update({ where: { sessionToken }, data }),
  deleteSession: (sessionToken: string) =>
    prisma.authSession.delete({ where: { sessionToken } }),
  createVerificationToken: (data: any) => prisma.verificationToken.create({ data }),
  useVerificationToken: ({ identifier, token }: any) =>
    prisma.verificationToken
      .delete({ where: { identifier_token: { identifier, token } } })
      .catch(() => null),
};

export const authOptions: NextAuthOptions = {
  adapter: adapter as any,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        (session.user as any).id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};
