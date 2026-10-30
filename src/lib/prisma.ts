import { PrismaClient } from '@prisma/client';

// Support Vercel / Neon production deployments where DATABASE_URL is provided instead of NEON_DATABASE_URL
if (
  !process.env.NEON_DATABASE_URL &&
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith("postgres://") || process.env.DATABASE_URL.startsWith("postgresql://"))
) {
  process.env.NEON_DATABASE_URL = process.env.DATABASE_URL;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
