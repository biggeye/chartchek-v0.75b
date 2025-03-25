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
 * Cache key patterns for different types of data
 * These are used to generate consistent cache keys and to invalidate related caches
 */
export const cacheKeys = {
  facilities: {
    list: (userId: string, status?: string, sort?: string, page?: number, limit?: number) => 
      `facilities:${userId}:list:${status || 'all'}:${sort || 'default'}:${page || 1}:${limit || 20}`,
    detail: (userId: string, facilityId: number) => 
      `facilities:${userId}:detail:${facilityId}`
  },
  patients: {
    list: (userId: string, facilityId: number) => 
      `patients:${userId}:${facilityId}:list`,
    detail: (userId: string, patientId: string) => 
      `patients:${userId}:detail:${patientId}`,
    evaluations: (userId: string, patientId: string) => 
      `patients:${userId}:${patientId}:evaluations`,
    vitalSigns: (userId: string, patientId: string) => 
      `patients:${userId}:${patientId}:vitalsigns`,
    appointments: (userId: string, patientId: string, optionsHash?: string) => 
      `patients:${userId}:${patientId}:appointments${optionsHash ? `:${optionsHash}` : ''}`
  },
  evaluations: {
    list: (userId: string) => 
      `evaluations:${userId}:list`,
    detail: (userId: string, evaluationId: string) => 
      `evaluations:${userId}:detail:${evaluationId}`
  },
  documents: {
    list: (userId: string, facilityId?: string) => 
      `documents:${userId}:${facilityId || 'all'}:list`,
    detail: (userId: string, documentId: string) => 
      `documents:${userId}:detail:${documentId}`
  },
  dashboard: {
    metrics: (userId: string, facilityId: number) => 
      `dashboard:${userId}:${facilityId}:metrics`,
    patientStats: (userId: string, facilityId: number) => 
      `dashboard:${userId}:${facilityId}:patientstats`,
    documentInsights: (userId: string, facilityId: number) => 
      `dashboard:${userId}:${facilityId}:documentinsights`
  },
  // New simplified cache key functions
  KipuPatientEvaluations: (patientId: string) => 
    `patient:${patientId}:evaluations`,
  patientVitalSigns: (patientId: string) => 
    `patient:${patientId}:vitalsigns`,
  patientAppointments: (userId: string, patientId: string, optionsHash?: string) => 
    `patient:${userId}:${patientId}:appointments${optionsHash ? `:${optionsHash}` : ''}`,
  evaluation: (evaluationId: string) => 
    `evaluation:${evaluationId}`,
  allEvaluations: () => 
    `evaluations:all`,
  allPatientEvaluations: (page: number = 1, limit: number = 20, optionsKey: string = '') => 
    `patient_evaluations:all:${page}:${limit}${optionsKey ? `:${optionsKey}` : ''}`,
  // New cache keys for appointment-related features
  schedulerAppointments: (userId: string, optionsHash: string) => 
    `scheduler:${userId}:appointments:${optionsHash}`,
  appointmentTypes: (userId: string, page: number = 1, limit: number = 100) => 
    `scheduler:${userId}:appointment_types:${page}:${limit}`,
  appointmentStatuses: (userId: string) => 
    `scheduler:${userId}:appointment_statuses`
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
    // Temporarily bypass cache and always fetch fresh data
    // console.log(`Cache hit for key: ${key}`);
    console.log(`Cache disabled, fetching fresh data for key: ${key}`);
    const data = await fetchFn();
    
    // Don't store in cache for now
    // await redis.set(key, data, ttl);
    
    return data;
  } catch (error) {
    console.error(`Error in getCachedData for key ${key}:`, error);
    throw error;
  }
}

/**
 * Invalidate cache entries matching a pattern
 * @param pattern Cache key pattern to invalidate
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // Temporarily disable cache invalidation
    console.log(`Cache invalidation disabled for pattern: ${pattern}`);
    return;
    
    /* Original implementation:
    console.log(`Invalidating cache for pattern: ${pattern}`);
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      console.log(`Found ${keys.length} keys to invalidate:`, keys);
      
      // Delete each key
      for (const key of keys) {
        await redis.del(key);
      }
    } else {
      console.log(`No keys found for pattern: ${pattern}`);
    }
    */
  } catch (error) {
    console.error(`Error invalidating cache for pattern ${pattern}:`, error);
  }
}