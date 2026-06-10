/**
 * Simple memoization utility for Alpine.js static SPA.
 * Provides memoize, lruCache, and memoizeWithTTL to eliminate cache boilerplate.
 */

/**
 * Simple memoization based on arguments.
 * Caches results indefinitely. Use lruCache for size-limited caching.
 */
export function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn.apply(this, args));
    }
    return cache.get(key);
  };
}

/**
 * LRU cache with size limit.
 * Returns a Map-like object with get/set/clear methods.
 * When size exceeds maxSize, the least recently used item is evicted.
 */
export function lruCache(maxSize = 100) {
  const cache = new Map();
  return {
    get(key) {
      const value = cache.get(key);
      if (value !== undefined) {
        // Move to end (most recently used)
        cache.delete(key);
        cache.set(key, value);
      }
      return value;
    },
    set(key, value) {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Evict least recently used (first item)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    has(key) {
      return cache.has(key);
    },
    clear() {
      cache.clear();
    },
    get size() {
      return cache.size;
    }
  };
}

/**
 * Memoization with time-based invalidation.
 * Cache entries expire after ttl milliseconds.
 */
export function memoizeWithTTL(fn, ttl = 1000) {
  const cache = new Map();
  return function (...args) {
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }
    const value = fn.apply(this, args);
    cache.set(key, { value, timestamp: now });
    return value;
  };
}
