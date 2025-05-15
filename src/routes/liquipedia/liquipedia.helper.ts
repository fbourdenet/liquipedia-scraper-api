import { LiquipediaService } from "../../services/liquipedia.service";
import { Player } from "../../interfaces/player.interface";

export async function getPlayersForTeamAndGame(
  team: string,
  game: string,
  active?: string
): Promise<Player[]> {
  const liquipediaService = new LiquipediaService(team, game);
  return liquipediaService.getPlayers();
}

export async function getUpcomingMatchesForGame(
  team: string,
  game: string,
  date?: string
): Promise<any[]> {
  const liquipediaService = new LiquipediaService(team, game);
  return liquipediaService.getUpcomingMatches(date);
}

export async function getTournamentResultsForGame(
  team: string,
  game: string,
  date?: string
): Promise<any[]> {
  const liquipediaService = new LiquipediaService(team, game);
  return liquipediaService.getTournamentResults(date);
}
