import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  getUpcomingMatchesForGame,
  getUpcomingMatchesForAllGames,
} from "./upcoming-matches.helper";
import { withAuth } from "../../middlewares/auth.middleware";
import { upcomingMatchesSchema } from "./upcoming-matches.schema";

export async function registerUpcomingMatchesRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  // Route with team as a path parameter
  fastify.get(
    "/:team",
    withAuth({ schema: upcomingMatchesSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const team = (request.params as any).team as string;
      const game = Array.isArray((request.query as any).game)
        ? (request.query as any).game
        : [(request.query as any).game].filter(Boolean);
      const date = (request.query as any).date as string;

      if (!team) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Team parameter is required",
        });
      }

      try {
        if (game.length > 0) {
          return await getUpcomingMatchesForGame(team, game, date);
        } else {
          return await getUpcomingMatchesForAllGames(team, date);
        }
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
}
