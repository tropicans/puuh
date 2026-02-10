import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const connectionPool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Create Prisma adapter from pg pool
const adapter = new PrismaPg(connectionPool);

declare global {
    var prisma: PrismaClient | undefined;
}

// Initialize PrismaClient with the pg adapter
export const prisma = globalThis.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;
