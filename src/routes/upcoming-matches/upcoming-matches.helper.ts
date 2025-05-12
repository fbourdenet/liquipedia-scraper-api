import { LiquipediaService } from "../../services/liquipedia.service";
import { Match } from "../../interfaces/match.interface";
import { GAMES } from "../../config/games.config";

export async function getUpcomingMatchesForGame(
  team: string,
  game: string[] | string | undefined,
  date?: string
): Promise<Match[]> {
  if (typeof game === "string") {
    const liquipediaService = new LiquipediaService(team, game);
    return liquipediaService.getUpcomingMatches(date);
  } else if (Array.isArray(game)) {
    const matchPromises = game.map((game) => {
      const liquipediaService = new LiquipediaService(team, game);
      return liquipediaService.getUpcomingMatches(date);
    });
    return (await Promise.all(matchPromises)).flat();
  } else {
    return [];
  }
}

export async function getUpcomingMatchesForAllGames(
  team: string,
  date?: string
): Promise<Match[]> {
  const matchPromises = GAMES.map((game) => {
    const liquipediaService = new LiquipediaService(team, game);
    return liquipediaService.getUpcomingMatches(date);
  });

  return (await Promise.all(matchPromises)).flat();
}
