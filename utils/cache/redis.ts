import { Redis } from '@upstash/redis';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Redis client configuration
 * Uses Upstash Redis for serverless-compatible Redis caching
 * Falls back to a mock implementation in development if credentials are missing
 */
let redisClient: Redis;

// Only create a real Redis client if we have credentials
if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  redisClient = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN
  });
} else {
  // In development, use a mock Redis implementation if credentials are missing
  console.warn('[Redis] Using mock Redis implementation because credentials are missing. Caching will not persist between sessions.');
  
  // Simple in-memory cache for development
  const memoryCache = new Map<string, { value: any, expiry: number | null }>();
  
  redisClient = {
    get: async (key: string) => {
      const item = memoryCache.get(key);
      if (!item) return null;
      if (item.expiry && item.expiry < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: any, options?: { ex?: number }) => {
      const expiry = options?.ex ? Date.now() + (options.ex * 1000) : null;
      memoryCache.set(key, { value, expiry });
      return 'OK';
    },
    del: async (key: string) => {
      return memoryCache.delete(key) ? 1 : 0;
    },
    keys: async (pattern: string) => {
      // Simple pattern matching for development
      // This is a basic implementation that supports * wildcard
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matchingKeys: string[] = [];
      
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          matchingKeys.push(key);
        }
      }
      
      return matchingKeys;
    },
    pipeline: () => {
      return {
        get: () => {},
        exec: async () => []
      };
    }
  } as unknown as Redis;
}

export const redis = redisClient;

/**
 * Cache key patterns for consistent key structure
 */
export const cacheKeys = {
  facilities: {
    list: (userId: string, status?: string, sort?: string, page?: number, limit?: number) => 
      `facilities:${userId}:${status || 'active'}:${sort || 'name_asc'}:${page || 1}:${limit || 20}`,
    detail: (userId: string, facilityId: string) => 
      `facility:${userId}:${facilityId}`
  },
  patients: {
    list: (userId: string, facilityId: string) => 
      `patients:${userId}:${facilityId}`,
    detail: (userId: string, patientId: string) => 
      `patient:${userId}:${patientId}`,
    evaluations: (userId: string, patientId: string) => 
      `patient_evaluations:${userId}:${patientId}`,
    vitalSigns: (userId: string, patientId: string) => 
      `patient_vitals:${userId}:${patientId}`,
    appointments: (userId: string, patientId: string) => 
      `patient_appointments:${userId}:${patientId}`
  },
  evaluations: {
    list: (userId: string) => 
      `evaluations:${userId}:all`
  },
  documents: {
    list: (userId: string, facilityId?: string) => 
      `documents:${userId}:${facilityId || 'all'}`,
    detail: (userId: string, documentId: string) => 
      `document:${userId}:${documentId}`
  },
  dashboard: {
    metrics: (userId: string, facilityId: string) => 
      `dashboard_metrics:${userId}:${facilityId}`,
    patientStats: (userId: string, facilityId: string) => 
      `patient_stats:${userId}:${facilityId}`,
    documentInsights: (userId: string, facilityId: string) => 
      `document_insights:${userId}:${facilityId}`
  }
};

/**
 * Default TTL values in seconds
 */
export const cacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  VERY_LONG: 1800 // 30 minutes
};

/**
 * Get data from cache or fetch it if not available
 * @param key Cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param ttl Time-to-live in seconds
 */
export async function getCachedData<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl = cacheTTL.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await redis.get(key);
    if (cached) {
      console.log(`Cache hit for key: ${key}`);
      return cached as T;
    }
    
    // If not in cache, fetch fresh data
    console.log(`Cache miss for key: ${key}, fetching fresh data`);
    const data = await fetchFn();
    
    // Store in cache if we have data
    if (data) {
      try {
        await redis.set(key, data, { ex: ttl });
      } catch (cacheError) {
        // Just log the cache error but continue with the data
        console.warn(`Failed to store data in cache for key ${key}:`, cacheError);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getCachedData for key ${key}:`, error);
    // If cache fails, fall back to direct fetch
    return fetchFn();
  }
}

/**
 * Invalidate cache entries matching a pattern
 * @param pattern Cache key pattern to invalidate
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // For the mock implementation, we can't use keys() as it's not implemented
    // Check if keys method exists (real Redis client)
    if (typeof redis.keys === 'function') {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        console.log(`Invalidating ${keys.length} cache entries matching pattern: ${pattern}`);
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } else {
      console.warn(`Cache invalidation for pattern ${pattern} not supported in mock implementation`);
    }
  } catch (error) {
    console.error(`Error invalidating cache for pattern ${pattern}:`, error);
    // Don't throw, just log the error
  }
}