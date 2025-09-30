import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) return false;
      return Math.min(retries * 1000, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('disconnect', () => {
  console.log('❌ Redis client disconnected');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis connection failed, continuing without session cache:', error instanceof Error ? error.message : 'Unknown error');
    // Don't exit process - allow app to continue without Redis for development
  }
}

export class SessionCache {
  private readonly prefix = 'session:';
  private readonly defaultTTL = 60 * 60 * 24 * 7; // 7 days

  private async isRedisConnected(): Promise<boolean> {
    try {
      return redisClient.isReady;
    } catch (error) {
      return false;
    }
  }

  async set(sessionId: string, data: any, ttl?: number): Promise<void> {
    if (!(await this.isRedisConnected())) {
      console.warn('Redis not connected, session cache disabled');
      return;
    }
    try {
      const key = this.prefix + sessionId;
      await redisClient.setEx(key, ttl || this.defaultTTL, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to set session cache:', error);
    }
  }

  async get(sessionId: string): Promise<any | null> {
    if (!(await this.isRedisConnected())) {
      return null;
    }
    try {
      const key = this.prefix + sessionId;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get session cache:', error);
      return null;
    }
  }

  async delete(sessionId: string): Promise<void> {
    if (!(await this.isRedisConnected())) {
      return;
    }
    try {
      const key = this.prefix + sessionId;
      await redisClient.del(key);
    } catch (error) {
      console.warn('Failed to delete session cache:', error);
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    if (!(await this.isRedisConnected())) {
      return false;
    }
    try {
      const key = this.prefix + sessionId;
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      console.warn('Failed to check session cache:', error);
      return false;
    }
  }

  async extend(sessionId: string, ttl?: number): Promise<void> {
    if (!(await this.isRedisConnected())) {
      return;
    }
    try {
      const key = this.prefix + sessionId;
      await redisClient.expire(key, ttl || this.defaultTTL);
    } catch (error) {
      console.warn('Failed to extend session cache:', error);
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    if (!(await this.isRedisConnected())) {
      return;
    }
    try {
      const pattern = this.prefix + '*';
      const keys = await redisClient.keys(pattern);

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === userId) {
            await redisClient.del(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to delete user sessions:', error);
    }
  }
}

export const sessionCache = new SessionCache();