import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

// Global caching for Hot-Module-Replacement in Next.js (Dev Environment)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

// Initialize the database Pool
const pool = globalForPrisma.pool || new Pool({ connectionString });

// Wrap it with the Prisma Driver Adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the Adapter
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}