import { LRUCache } from 'lru-cache';
import type { NextRequest } from 'next/server';

type RateLimitConfig = {
    interval: number;
    maxRequests: number;
    uniqueTokenPerInterval?: number;
};

export function createRateLimiter(config: RateLimitConfig) {
    const cache = new LRUCache<string, number[]>({
        max: config.uniqueTokenPerInterval || 500,
        ttl: config.interval,
    });

    return {
        async check(req: NextRequest): Promise<{ limited: boolean; remaining: number }> {
            const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
            const tokenCount = cache.get(ip) || [0];

            if (tokenCount[0] === 0) {
                cache.set(ip, tokenCount);
            }
            tokenCount[0] += 1;

            const currentUsage = tokenCount[0];
            const limited = currentUsage > config.maxRequests;
            const remaining = Math.max(0, config.maxRequests - Math.max(0, currentUsage - 1));

            return { limited, remaining };
        },

        async checkKey(key: string): Promise<{ limited: boolean; remaining: number }> {
            const tokenCount = cache.get(key) || [0];

            if (tokenCount[0] === 0) {
                cache.set(key, tokenCount);
            }
            tokenCount[0] += 1;

            const currentUsage = tokenCount[0];
            const limited = currentUsage > config.maxRequests;
            const remaining = Math.max(0, config.maxRequests - Math.max(0, currentUsage - 1));

            return { limited, remaining };
        }
    };
}

// Preset limiters
export const authLimiter = createRateLimiter({ interval: 60_000, maxRequests: 5, uniqueTokenPerInterval: 500 });
export const apiLimiter = createRateLimiter({ interval: 60_000, maxRequests: 30, uniqueTokenPerInterval: 500 });
export const uploadLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10, uniqueTokenPerInterval: 500 });
export const adminLimiter = createRateLimiter({ interval: 60_000, maxRequests: 60, uniqueTokenPerInterval: 500 });
