import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: (res: any, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;
                // res.setHeader('X-RateLimit-Limit', limit);
                // res.setHeader(
                //     'X-RateLimit-Remaining',
                //     isRateLimited ? 0 : limit - currentUsage
                // );

                return isRateLimited ? reject() : resolve();
            }),
    };
}
