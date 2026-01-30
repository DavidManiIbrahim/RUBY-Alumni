import { createClient } from 'redis';

// Redis client configuration
const redisUrl = import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

// Error handling
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
    console.log('Redis Client Ready');
});

// Initialize connection
let isConnecting = false;
let isConnected = false;

export const initRedis = async () => {
    if (isConnected || isConnecting) return;

    isConnecting = true;
    try {
        await redisClient.connect();
        isConnected = true;
        console.log('Redis initialized successfully');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        isConnected = false;
    } finally {
        isConnecting = false;
    }
};

// Cache key generators
export const CacheKeys = {
    profile: (userId: string) => `profile:${userId}`,
    profiles: () => 'profiles:all',
    announcements: () => 'announcements:all',
    gallery: () => 'gallery:all',
    userRole: (userId: string) => `user:role:${userId}`,
    session: (sessionId: string) => `session:${sessionId}`,
    chatMessages: () => 'chat:messages',
    auditLogs: () => 'audit:logs',
    rateLimit: (userId: string, action: string) => `ratelimit:${userId}:${action}`,
};

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
    profile: 300, // 5 minutes
    profiles: 180, // 3 minutes
    announcements: 120, // 2 minutes
    gallery: 300, // 5 minutes
    userRole: 600, // 10 minutes
    session: 3600, // 1 hour
    chatMessages: 60, // 1 minute
    auditLogs: 300, // 5 minutes
};

// Generic cache operations
export const cache = {
    // Get cached data
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!isConnected) await initRedis();
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },

    // Set cache data with TTL
    async set(key: string, value: any, ttl?: number): Promise<boolean> {
        try {
            if (!isConnected) await initRedis();
            const serialized = JSON.stringify(value);
            if (ttl) {
                await redisClient.setEx(key, ttl, serialized);
            } else {
                await redisClient.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    },

    // Delete cache entry
    async del(key: string): Promise<boolean> {
        try {
            if (!isConnected) await initRedis();
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    },

    // Delete multiple cache entries by pattern
    async delPattern(pattern: string): Promise<boolean> {
        try {
            if (!isConnected) await initRedis();
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
            return false;
        }
    },

    // Check if key exists
    async exists(key: string): Promise<boolean> {
        try {
            if (!isConnected) await initRedis();
            const result = await redisClient.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    },

    // Increment counter (useful for rate limiting)
    async incr(key: string, ttl?: number): Promise<number> {
        try {
            if (!isConnected) await initRedis();
            const value = await redisClient.incr(key);
            if (ttl && value === 1) {
                await redisClient.expire(key, ttl);
            }
            return value;
        } catch (error) {
            console.error(`Cache incr error for key ${key}:`, error);
            return 0;
        }
    },

    // Get remaining TTL
    async ttl(key: string): Promise<number> {
        try {
            if (!isConnected) await initRedis();
            return await redisClient.ttl(key);
        } catch (error) {
            console.error(`Cache ttl error for key ${key}:`, error);
            return -1;
        }
    },

    // Clear all cache
    async flush(): Promise<boolean> {
        try {
            if (!isConnected) await initRedis();
            await redisClient.flushDb();
            return true;
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    },
};

// Rate limiting helper
export const rateLimit = {
    async check(userId: string, action: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
        const key = CacheKeys.rateLimit(userId, action);
        const count = await cache.incr(key, windowSeconds);
        const ttl = await cache.ttl(key);

        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            resetAt: Date.now() + (ttl * 1000),
        };
    },
};

// Session management
export const session = {
    async create(sessionId: string, data: any, ttl: number = CacheTTL.session): Promise<boolean> {
        return await cache.set(CacheKeys.session(sessionId), data, ttl);
    },

    async get(sessionId: string): Promise<any> {
        return await cache.get(CacheKeys.session(sessionId));
    },

    async update(sessionId: string, data: any): Promise<boolean> {
        const existing = await cache.get(CacheKeys.session(sessionId));
        if (!existing) return false;

        const ttl = await cache.ttl(CacheKeys.session(sessionId));
        return await cache.set(CacheKeys.session(sessionId), { ...existing, ...data }, ttl > 0 ? ttl : CacheTTL.session);
    },

    async delete(sessionId: string): Promise<boolean> {
        return await cache.del(CacheKeys.session(sessionId));
    },

    async extend(sessionId: string, ttl: number = CacheTTL.session): Promise<boolean> {
        const data = await cache.get(CacheKeys.session(sessionId));
        if (!data) return false;
        return await cache.set(CacheKeys.session(sessionId), data, ttl);
    },
};

export { redisClient };
export default cache;
