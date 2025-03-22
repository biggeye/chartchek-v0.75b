/**
 * Utility functions for memoization to optimize expensive operations
 */

/**
 * Creates a memoized version of a function that caches its results
 * 
 * @param fn The function to memoize
 * @returns A memoized version of the function
 */
export function memoize<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
  const cache = new Map();
  
  return (...args) => {
    // Create a cache key by stringifying the arguments
    const key = JSON.stringify(args);
    
    // Return cached result if available
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    // Otherwise compute the result and cache it
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Creates a memoized version of an async function that caches its results
 * 
 * @param fn The async function to memoize
 * @param maxCacheSize Optional maximum cache size (default: 100)
 * @returns A memoized version of the async function
 */
export function memoizeAsync<T>(
  fn: (...args: any[]) => Promise<T>,
  maxCacheSize = 100
): (...args: any[]) => Promise<T> {
  const cache = new Map<string, Promise<T>>();
  const keys: string[] = [];
  
  return async (...args) => {
    // Create a cache key by stringifying the arguments
    const key = JSON.stringify(args);
    
    // Return cached result if available
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    // Otherwise compute the result and cache it
    const resultPromise = fn(...args);
    cache.set(key, resultPromise);
    keys.push(key);
    
    // Limit cache size by removing oldest entries
    if (keys.length > maxCacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    return resultPromise;
  };
}

/**
 * Creates a memoized version of a function with a time-based expiration
 * 
 * @param fn The function to memoize
 * @param ttl Time-to-live in milliseconds
 * @returns A memoized version of the function with expiration
 */
export function memoizeWithExpiration<T>(
  fn: (...args: any[]) => T,
  ttl: number
): (...args: any[]) => T {
  const cache = new Map<string, { value: T; timestamp: number }>();
  
  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();
    
    // Return cached result if available and not expired
    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }
    
    // Otherwise compute the result and cache it with timestamp
    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  };
}

/**
 * Creates a memoized version of an async function with a time-based expiration
 * 
 * @param fn The async function to memoize
 * @param ttl Time-to-live in milliseconds
 * @param maxCacheSize Optional maximum cache size (default: 100)
 * @returns A memoized version of the async function with expiration
 */
export function memoizeAsyncWithExpiration<T>(
  fn: (...args: any[]) => Promise<T>,
  ttl: number,
  maxCacheSize = 100
): (...args: any[]) => Promise<T> {
  const cache = new Map<string, { promise: Promise<T>; timestamp: number }>();
  const keys: string[] = [];
  
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();
    
    // Return cached result if available and not expired
    if (cached && now - cached.timestamp < ttl) {
      return cached.promise;
    }
    
    // Otherwise compute the result and cache it with timestamp
    const resultPromise = fn(...args);
    cache.set(key, { promise: resultPromise, timestamp: now });
    keys.push(key);
    
    // Limit cache size by removing oldest entries
    if (keys.length > maxCacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    return resultPromise;
  };
}
