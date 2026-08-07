import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from '../config/index';

// Create PostgreSQL connection pool
const connectionPool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
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
