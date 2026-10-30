import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const cleanEmail = credentials.email.trim();
          let user = await prisma.user.findUnique({
            where: { email: cleanEmail.toLowerCase() },
          });

          if (!user && cleanEmail !== cleanEmail.toLowerCase()) {
            user = await prisma.user.findUnique({
              where: { email: cleanEmail },
            });
          }

          if (!user) {
            return null;
          }

          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in.");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes("verify")) {
            throw error;
          }
          const errorName = error instanceof Error ? error.name : "Error";
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Auth Diagnostic] Database/authorize failure: [${errorName}] ${errorMessage}`);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error("[NextAuth error]:", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth warn]:", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth debug]:", code, metadata);
    },
  },
};

