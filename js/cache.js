// js/cache.js - Caching Layer for Dashboard
// Simple in-memory cache (can be upgraded to Redis later)

/**
 * Simple in-memory cache implementation
 * Can be easily upgraded to Redis for production
 */
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * Set a value in cache with TTL (Time To Live)
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     */
    set(key, value, ttlSeconds = 120) {
        // Clear existing timer if key exists
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Store value with timestamp
        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.timers.delete(key);
        }, ttlSeconds * 1000);

        this.timers.set(key, timer);
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }

        // Check if expired
        const age = Date.now() - item.timestamp;
        if (age > item.ttl) {
            this.cache.delete(key);
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
            return null;
        }

        return item.data;
    }

    /**
     * Delete a specific key from cache
     * @param {string} key - Cache key to delete
     */
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.cache.delete(key);
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., "reports:123:*")
     */
    deletePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Clear all cache
     */
    clear() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {object} - Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create global cache instance
const cache = new SimpleCache();

/**
 * Cache wrapper function - tries cache first, then fetches if needed
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {Function} fetchFn - Function to fetch data if cache miss
 * @returns {Promise<any>} - Cached or freshly fetched data
 */
export async function cached(key, ttlSeconds, fetchFn) {
    // Try cache first
    const cached = cache.get(key);
    if (cached !== null) {
        console.log(`✅ Cache HIT: ${key}`);
        return cached;
    }

    // Cache miss - fetch fresh data
    console.log(`❌ Cache MISS: ${key}`);
    const data = await fetchFn();

    // Cache it
    cache.set(key, data, ttlSeconds);
    console.log(`💾 Cached: ${key} (TTL: ${ttlSeconds}s)`);

    return data;
}

/**
 * Get cached user reports
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {Function} fetchFn - Function to fetch reports from Supabase
 * @returns {Promise<any>} - Cached or freshly fetched reports
 */
export async function getCachedUserReports(userId, page, fetchFn) {
    const cacheKey = `reports:${userId}:${page}`;
    return cached(
        cacheKey,
        120, // 2 minutes TTL
        fetchFn
    );
}

/**
 * Get cached user profile
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch profile from Supabase
 * @returns {Promise<any>} - Cached or freshly fetched profile
 */
export async function getCachedUserProfile(userId, fetchFn) {
    const cacheKey = `profile:${userId}`;
    return cached(
        cacheKey,
        300, // 5 minutes TTL
        fetchFn
    );
}

/**
 * Get cached dashboard stats
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch stats from Supabase
 * @returns {Promise<any>} - Cached or freshly fetched stats
 */
export async function getCachedDashboardStats(userId, fetchFn) {
    const cacheKey = `stats:${userId}`;
    return cached(
        cacheKey,
        60, // 1 minute TTL
        fetchFn
    );
}

/**
 * Invalidate cache for a user's reports
 * Call this when user creates/updates/deletes a report
 * @param {string} userId - User ID
 */
export function invalidateUserReports(userId) {
    cache.deletePattern(`reports:${userId}:*`);
    console.log(`🗑️ Invalidated reports cache for user: ${userId}`);
}

/**
 * Invalidate cache for a user's profile
 * Call this when user updates their profile
 * @param {string} userId - User ID
 */
export function invalidateUserProfile(userId) {
    cache.delete(`profile:${userId}`);
    console.log(`🗑️ Invalidated profile cache for user: ${userId}`);
}

/**
 * Invalidate cache for a user's dashboard stats
 * Call this when stats might have changed
 * @param {string} userId - User ID
 */
export function invalidateDashboardStats(userId) {
    cache.delete(`stats:${userId}`);
    console.log(`🗑️ Invalidated stats cache for user: ${userId}`);
}

/**
 * Invalidate all cache for a user
 * @param {string} userId - User ID
 */
export function invalidateAllUserCache(userId) {
    invalidateUserReports(userId);
    invalidateUserProfile(userId);
    invalidateDashboardStats(userId);
}

/**
 * Get cache statistics (for debugging)
 * @returns {object} - Cache stats
 */
export function getCacheStats() {
    return cache.getStats();
}

// Export cache instance for advanced usage
export { cache };

