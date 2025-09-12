// Redis connection and session management

import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Session management utilities
export class SessionManager {
  private static readonly SESSION_PREFIX = 'interview:session:';
  private static readonly SESSION_TTL = 60 * 60 * 4; // 4 hours

  static async saveSession(sessionId: string, sessionData: any): Promise<void> {
    const key = this.SESSION_PREFIX + sessionId;
    await redis.setex(key, this.SESSION_TTL, JSON.stringify(sessionData));
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const key = this.SESSION_PREFIX + sessionId;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const key = this.SESSION_PREFIX + sessionId;
    await redis.del(key);
  }

  static async extendSession(sessionId: string): Promise<void> {
    const key = this.SESSION_PREFIX + sessionId;
    await redis.expire(key, this.SESSION_TTL);
  }

  static async getAllActiveSessions(): Promise<string[]> {
    const keys = await redis.keys(this.SESSION_PREFIX + '*');
    return keys.map(key => key.replace(this.SESSION_PREFIX, ''));
  }
}

// Cache utilities
export class CacheManager {
  private static readonly CACHE_PREFIX = 'cache:';
  private static readonly DEFAULT_TTL = 60 * 15; // 15 minutes

  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await redis.setex(cacheKey, ttl, JSON.stringify(value));
  }

  static async get(key: string): Promise<any | null> {
    const cacheKey = this.CACHE_PREFIX + key;
    const data = await redis.get(cacheKey);
    return data ? JSON.parse(data) : null;
  }

  static async delete(key: string): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await redis.del(cacheKey);
  }

  static async exists(key: string): Promise<boolean> {
    const cacheKey = this.CACHE_PREFIX + key;
    return (await redis.exists(cacheKey)) === 1;
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}