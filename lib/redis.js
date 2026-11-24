import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Fallback in-memory store if local Redis server isn't running
const memoryFallback = new Map();

class CartCache {
  constructor() {
    this.useFallback = false;
    try {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't hang if Redis isn't installed locally
      });
      this.client.on("error", () => {
        this.useFallback = true;
      });
    } catch {
      this.useFallback = true;
    }
  }

  async get(key) {
    if (this.useFallback) return memoryFallback.get(key) || null;
    try {
      return await this.client.get(key);
    } catch {
      this.useFallback = true;
      return memoryFallback.get(key) || null;
    }
  }

  async set(key, value) {
    if (this.useFallback) {
      memoryFallback.set(key, value);
      return "OK";
    }
    try {
      return await this.client.set(key, value, "EX", 86400); // 24-hour TTL
    } catch {
      this.useFallback = true;
      memoryFallback.set(key, value);
      return "OK";
    }
  }

  async del(key) {
    if (this.useFallback) {
      memoryFallback.delete(key);
      return 1;
    }
    try {
      return await this.client.del(key);
    } catch {
      this.useFallback = true;
      memoryFallback.delete(key);
      return 1;
    }
  }
}

const redisCache = global.redisCache || new CartCache();
if (process.env.NODE_ENV !== "production") global.redisCache = redisCache;

export default redisCache;