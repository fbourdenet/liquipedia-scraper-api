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

export async function registerLiquipediaRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  // Players
  fastify.get(
    "/:game/:team/players",
    withAuth({ schema: playersSchema }),
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { team, game } = request.params as any;
      const active = (request.query as any).active as boolean;

      try {
        return await getPlayersForTeamAndGame(team, game);
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

  // Matches
  fastify.get(
    "/:game/:team/upcoming-matches",
    withAuth({ schema: upcomingMatchesSchema }),
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
    withAuth({ schema: tournamentResultsSchema }),
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
