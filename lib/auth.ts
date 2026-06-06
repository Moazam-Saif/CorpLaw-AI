import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // PrismaAdapter wires NextAuth's User/Account/AuthSession/VerificationToken
  // tables directly to your database.
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Use JWT so getServerSession works in API routes without an extra DB hit
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Attach the database user id to the JWT so we can read it in API routes
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    // Expose userId on the client-side session object
    async session({ session, token }) {
      if (token?.userId && session.user) {
        (session.user as any).id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    // We use a custom sign-in modal rather than NextAuth's default page,
    // so redirect back to the root if NextAuth ever needs a sign-in URL.
    signIn: "/",
  },
};
