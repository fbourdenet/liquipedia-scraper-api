import NodeCache from 'node-cache';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  // Default cache TTL set to 1 hour
  constructor(ttlSeconds: number = 3600) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: Math.floor(ttlSeconds * 0.2), // Check for expired keys at 20% of TTL
      useClones: false, // For better performance
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    // If ttl is undefined, use the default ttl defined in the NodeCache constructor
    if (ttl === undefined) {
      return this.cache.set(key, value);
    }
    return this.cache.set(key, value, ttl);
  }

  public del(keys: string | string[]): number {
    return this.cache.del(keys);
  }

  public flush(): void {
    this.cache.flushAll();
  }

  public getStats() {
    return this.cache.getStats();
  }

  // Generate consistent cache keys for different resources
  public static generateCacheKey(type: string, team: string, game: string, date?: string): string {
    return `${type}:${game}:${team}${date ? `:${date}` : ''}`;
  }
}
