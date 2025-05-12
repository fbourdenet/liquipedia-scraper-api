import { JSDOM } from "jsdom";
import { Match, Team, Tournament } from "../interfaces/match.interface";
import { GAME_NAME_MAPPING } from "../config/games.config";

export class LiquipediaService {
  private baseUrl: string = "https://liquipedia.net";
  private team: string;
  private game: string;

  constructor(team: string, game: string) {
    this.team = team;
    this.game = game;
  }

  private getLiquipediaUrl(): string {
    return `${this.baseUrl}/${this.game}/${this.team}`;
  }

  async fetchHtmlContent(): Promise<string> {
    const URL = this.getLiquipediaUrl();

    try {
      const response = await fetch(URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${URL}: ${response.statusText}`);
      }
      return response.text();
    } catch (error) {
      console.error(`Error fetching HTML content from ${URL}:`, error);
      throw error;
    }
  }

  extractMatchesFromHtml(htmlContent: string): Match[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const matches: Match[] = [];

    const matchTables = document.querySelectorAll(
      ".fo-nttax-infobox.panel table.wikitable.wikitable-striped.infobox_matches_content"
    );

    matchTables.forEach((table) => {
      const teamLeft = this.extractTeamData(table, ".team-left");
      const teamRight = this.extractTeamData(table, ".team-right");
      const tournament = this.extractTournamentData(table);
      const dateTime = this.extractDateTime(table);
      const format = this.extractMatchFormat(table);

      if (dateTime) {
        matches.push({
          teamLeft,
          teamRight,
          tournament,
          dateTime,
          format,
        });
      }
    });

    return matches;
  }

  private extractTeamData(matchTable: Element, selector: string): Team {
    const teamElement = matchTable.querySelector(
      `${selector} .team-template-text a`
    );
    const iconElement = matchTable.querySelector(
      `${selector} .team-template-image-icon img`
    );

    return {
      name: teamElement?.textContent?.trim() || "Unknown Team",
      icon: iconElement ? this.baseUrl + iconElement.getAttribute("src") : null,
    };
  }

  private extractTournamentData(matchTable: Element): Tournament {
    const tournamentElement = matchTable.querySelector(
      ".tournament-text-flex a"
    );
    const tournamentName =
      tournamentElement?.textContent?.trim() || "Unknown Tournament";
    const tournamentLink = tournamentElement
      ? this.baseUrl + tournamentElement.getAttribute("href")
      : null;
    const gameName = this.game
      ? GAME_NAME_MAPPING[this.game] || this.game
      : null;

    return {
      name: tournamentName,
      link: tournamentLink,
      game: gameName,
    };
  }

  private extractDateTime(matchTable: Element): string | null {
    const timerElement = matchTable.querySelector(".timer-object");
    const timestamp = timerElement?.getAttribute("data-timestamp");

    return timestamp ? new Date(Number(timestamp) * 1000).toISOString() : null;
  }

  private extractMatchFormat(matchTable: Element): string | null {
    const formatElement = matchTable.querySelector(".versus-lower abbr");
    return formatElement?.textContent?.trim().toUpperCase() || null;
  }

  async getUpcomingMatches(date?: string): Promise<Match[]> {
    try {
      const htmlContent = await this.fetchHtmlContent();
      let matches = this.extractMatchesFromHtml(htmlContent);
      
      if (date) {
        matches = matches.filter((match) => {
          if (!match.dateTime) return false;
          const matchDate = new Date(match.dateTime);
          const [day, month, year] = date.split('-').map(Number);
          const targetDate = new Date(year, month - 1, day);
  
          return (
            matchDate.getDate() === targetDate.getDate() &&
            matchDate.getMonth() === targetDate.getMonth() &&
            matchDate.getFullYear() === targetDate.getFullYear()
          );
        });
      }

      console.log(
        `Found ${matches.length} upcoming matches for ${this.team} in ${this.game}`
      );
      return matches;
    } catch (error) {
      console.error(`Error getting upcoming matches:`, error);
      return [];
    }
  }

  async getMatches(): Promise<Match[]> {
    try {
      const htmlContent = await this.fetchHtmlContent();
      const matches = this.extractMatchesFromHtml(htmlContent);
      console.log(
        `Found ${matches.length} matches for ${this.team} in ${this.game}`
      );
      return matches;
    } catch (error) {
      console.error(`Error getting all matches:`, error);
      return [];
    }
  }
}
