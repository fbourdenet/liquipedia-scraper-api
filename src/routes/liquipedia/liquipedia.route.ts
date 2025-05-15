import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { withAuth } from "../../middlewares/auth.middleware";
import {
  playersSchema,
  tournamentResultsSchema,
  upcomingMatchesSchema,
} from "./liquipedia.schema";
import {
  getPlayersForTeamAndGame,
  getTournamentResultsForGame,
  getUpcomingMatchesForGame,
} from "./liquipedia.helper";
import {
  withCache,
  generateTeamResourceCacheKey,
} from "../../middlewares/cache.middleware";

export async function registerLiquipediaRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  // Players
  fastify.get(
    "/:game/:team/players",
    {
      preHandler: [
        withAuth({ schema: playersSchema }),
        withCache({
          ttl: 3600, // 1 hour cache for players
          keyGenerator: generateTeamResourceCacheKey("players"),
        }),
      ],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { team, game } = request.params as any;
      const active = (request.query as any).active as boolean;

      try {
        return await getPlayersForTeamAndGame(team, game);
      } catch (error) {
        console.error("Error fetching players:", error);
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to fetch players",
        });
      }
    }
  );

  // Matches
  fastify.get(
    "/:game/:team/upcoming-matches",
    {
      preHandler: [
        withAuth({ schema: upcomingMatchesSchema }),
        withCache({
          ttl: 3600, // 1 hour cache for upcoming matches
          keyGenerator: generateTeamResourceCacheKey("upcoming-matches"),
        }),
      ],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { team, game } = request.params as any;
      const date = (request.query as any).date as string;

      try {
        return await getUpcomingMatchesForGame(team, game, date);
      } catch (error) {
        console.error("Error fetching upcoming matches:", error);
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to fetch upcoming matches",
        });
      }
    }
  );

  fastify.get(
    "/:game/:team/results",
    {
      preHandler: [
        withAuth({ schema: tournamentResultsSchema }),
        withCache({
          ttl: 3600, // 1 hour cache for tournament results
          keyGenerator: generateTeamResourceCacheKey("results"),
        }),
      ],
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { team, game } = request.params as any;
      const date = (request.query as any).date as string;

      try {
        return await getTournamentResultsForGame(team, game);
      } catch (error) {
        console.error("Error fetching tournament results:", error);
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to fetch tournament results",
        });
      }
    }
  );
}
