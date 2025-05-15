import { FastifyReply, FastifyRequest } from 'fastify';
import { CacheService } from '../services/cache.service';

type CacheConfig = {
  ttl?: number;
  keyGenerator?: (request: FastifyRequest) => string;
};

export function withCache(config: CacheConfig = {}) {
  const cacheService = CacheService.getInstance();
  
  // Return a handler function for preHandler without 'done' callback
  return async function(request: FastifyRequest, reply: FastifyReply) {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return;
    }

    // Generate cache key
    let cacheKey: string;
    if (config.keyGenerator) {
      cacheKey = config.keyGenerator(request);
    } else {
      // Default key generation based on URL
      cacheKey = `${request.method}:${request.url}`;
    }

    // Check if response exists in cache
    const cachedResponse = cacheService.get(cacheKey);
    if (cachedResponse) {
      // Send cached response and return to stop further processing
      reply.send(cachedResponse);
      return;
    }

    // Store the original send function
    const originalSend = reply.send;

    // Override send function to cache the response
    reply.send = function(payload: any) {
      // Skip caching error responses
      if (reply.statusCode >= 400) {
        return originalSend.apply(reply, [payload]);
      }

      // Cache the response payload
      cacheService.set(cacheKey, payload, config.ttl);
      
      // Call the original send with the payload
      return originalSend.apply(reply, [payload]);
    };
  };
}

// Generate cache key for team-based resources
export function generateTeamResourceCacheKey(resourceType: string) {
  return (request: FastifyRequest): string => {
    const { team, game } = request.params as any;
    const { date } = request.query as any;
    
    return CacheService.generateCacheKey(resourceType, team, game, date);
  };
}
