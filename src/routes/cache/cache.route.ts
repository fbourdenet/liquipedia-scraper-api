import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { withAuth } from "../../middlewares/auth.middleware";
import { CacheService } from "../../services/cache.service";

export async function registerCacheRoutes(fastify: FastifyInstance) {
  // Get cache statistics
  fastify.get(
    "/stats",
    {
      preHandler: [withAuth()],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const cacheService = CacheService.getInstance();
      const stats = cacheService.getStats();

      return {
        stats,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Clear all cache
  fastify.delete(
    "/clear",
    {
      preHandler: [withAuth()],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const cacheService = CacheService.getInstance();
      cacheService.flush();

      return {
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Clear cache for a specific team/game
  fastify.delete(
    "/:game/:team",
    {
      preHandler: [withAuth()],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { team, game } = request.params as any;
      const cacheService = CacheService.getInstance();

      // Generate possible cache keys for this team/game combo
      const keyPatterns = [
        CacheService.generateCacheKey("players", team, game),
        CacheService.generateCacheKey("upcoming-matches", team, game),
        CacheService.generateCacheKey("results", team, game),
      ];

      // Delete all matching keys
      const deletedCount = cacheService.del(keyPatterns);

      return {
        message: `Cleared ${deletedCount} cache entries for ${game}/${team}`,
        timestamp: new Date().toISOString(),
      };
    }
  );
}
