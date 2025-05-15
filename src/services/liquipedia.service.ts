import { JSDOM } from "jsdom";
import { Match, Team, Tournament } from "../interfaces/match.interface";
import { GAME_NAME_MAPPING } from "../config/games.config";
import { Player } from "../interfaces/player.interface";
import { TournamentResult } from "../interfaces/tournament.interface";

export class LiquipediaService {
  private readonly baseUrl: string = "https://liquipedia.net";
  private readonly team: string;
  private readonly game: string;

  constructor(team: string, game: string) {
    this.team = team;
    this.game = game;
  }

  private get gameDisplayName(): string {
    return GAME_NAME_MAPPING[this.game] || this.game;
  }

  private getLiquipediaUrl(path?: string): string {
    const basePath = `${this.baseUrl}/${this.game}/${this.team}`;
    return path ? `${basePath}/${path}` : basePath;
  }

  /**
   * Fetches HTML content from Liquipedia
   */
  async fetchHtmlContent(path?: string): Promise<string> {
    const url = this.getLiquipediaUrl(path);
    
    try {
      console.log(`Fetching HTML content from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      
      return response.text();
    } catch (error) {
      console.error(`Error fetching HTML content from ${url}`, error);
      throw error;
    }
  }

  /**
   * Get players for the team
   */
  async getPlayers(): Promise<Player[]> {
    try {
      const htmlContent = await this.fetchHtmlContent();
      return this.extractPlayersFromHtml(htmlContent);
    } catch (error) {
      console.error(`Error getting players:`, error);
      return [];
    }
  }

  /**
   * Get upcoming matches
   */
  async getUpcomingMatches(date?: string): Promise<Match[]> {
    try {
      const htmlContent = await this.fetchHtmlContent();
      let matches = this.extractMatchesFromHtml(htmlContent);

      if (date) {
        matches = this.filterByDate(matches, date);
      }

      console.log(`Found ${matches.length} upcoming matches for ${this.team} in ${this.game}`);
      return matches;
    } catch (error) {
      console.error(`Error getting upcoming matches:`, error);
      return [];
    }
  }

  /**
   * Get tournament results
   */
  async getTournamentResults(date?: string): Promise<TournamentResult[]> {
    try {
      const htmlContent = await this.fetchHtmlContent("Results");
      let results = this.extractTournamentResultsFromHtml(htmlContent);

      if (date) {
        results = this.filterResultsByDate(results, date);
      }

      return results;
    } catch (error) {
      console.error(`Error getting tournament results:`, error);
      return [];
    }
  }

  /**
   * Filter matches by date
   */
  private filterByDate(matches: Match[], dateStr: string): Match[] {
    return matches.filter(match => {
      if (!match.dateTime) return false;
      
      const matchDate = new Date(match.dateTime);
      const [day, month, year] = dateStr.split("-").map(Number);
      const targetDate = new Date(year, month - 1, day);

      return this.isSameDay(matchDate, targetDate);
    });
  }

  /**
   * Filter tournament results by date
   */
  private filterResultsByDate(results: TournamentResult[], dateStr: string): TournamentResult[] {
    const filtered = results.filter(result => {
      if (!result.date) return false;

      // Parse input date (DD-MM-YYYY format)
      const [day, month, year] = dateStr.split("-").map(Number);
      const targetDate = new Date(year, month - 1, day);

      // Parse result date (also in DD-MM-YYYY format)
      const [resultDay, resultMonth, resultYear] = result.date.split("-").map(Number);
      const resultDate = new Date(resultYear, resultMonth - 1, resultDay);

      return this.isSameDay(resultDate, targetDate);
    });

    console.log(`Found ${filtered.length} tournament results for ${this.team} in ${this.game} on ${dateStr}`);
    return filtered;
  }

  /**
   * Check if two dates represent the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  /**
   * Extract players from HTML content
   */
  private extractPlayersFromHtml(htmlContent: string): Player[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const players: Player[] = [];

    // Try to find the Active section's roster table first
    const activeSection = document.querySelector('h3 #Active, h3 .mw-headline[id="Active"]');
    
    if (!activeSection) {
      // If no Active section, try to find any roster table
      const rosterTable = document.querySelector(".roster-card");
      if (!rosterTable) {
        console.log("No roster table found");
        return players;
      }
      
      this.processRosterTable(rosterTable, players);
      return players;
    }

    // Find the roster table after the Active heading
    const rosterSection = activeSection.closest("h3")?.nextElementSibling;
    if (!rosterSection) {
      console.log("Roster table not found after Active heading");
      return players;
    }

    this.processRosterTable(rosterSection, players);
    return players;
  }

  /**
   * Process a roster table to extract player data
   */
  private processRosterTable(section: Element, players: Player[]): void {
    // Target the player rows in the roster table
    const playerRows = section.querySelectorAll(".roster-card .Player");

    playerRows.forEach(row => {
      // Extract player tag and country
      const idCell = row.querySelector(".ID");
      const tagElement = idCell?.querySelector("a");
      const flagElement = idCell?.querySelector(".flag img");

      // Extract real name
      const nameCell = row.querySelector(".Name");
      const nameElement = nameCell?.querySelector(".LargeStuff");

      // Extract position/role
      const positionCell = row.querySelector(".Position");
      let position = null;
      
      if (positionCell) {
        const positionText = positionCell.textContent?.trim();
        const roleMatch = positionText?.match(/\((.*?)\)/);
        
        if (roleMatch) {
          position = roleMatch[1]; // Extract the role from parentheses
        } else {
          // Clean up position text
          position = positionText
            ? positionText.replace(/Position:|Role:/gi, "").replace(/\s*\([^)]*\)\s*/g, "").trim()
            : null;
        }
      }

      // Extract join date
      const dateCell = row.querySelector(".Date");
      const dateText = dateCell?.querySelector("i")?.textContent?.trim();
      let joinDate = null;
      
      if (dateText) {
        const rawDate = dateText.split(/[<\[]/)[0].trim();
        const dateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        
        if (dateMatch) {
          // Reformat from YYYY-MM-DD to DD-MM-YYYY
          joinDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        } else {
          joinDate = rawDate;
        }
      }

      players.push({
        tag: tagElement?.textContent?.trim() || "Unknown Player",
        name: nameElement?.textContent?.trim() || null,
        country: flagElement?.getAttribute("title") || null,
        position,
        joinDate,
      });
    });

    console.log(`Total roster members found: ${players.length}`);
  }

  /**
   * Extract matches from HTML content
   */
  private extractMatchesFromHtml(htmlContent: string): Match[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const matches: Match[] = [];

    const matchTables = document.querySelectorAll(
      ".fo-nttax-infobox.panel table.wikitable.wikitable-striped.infobox_matches_content"
    );

    matchTables.forEach(table => {
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

  /**
   * Extract team data from a match table
   */
  private extractTeamData(matchTable: Element, selector: string): Team {
    const teamElement = matchTable.querySelector(`${selector} .team-template-text a`);
    const iconElement = matchTable.querySelector(`${selector} .team-template-image-icon img`);

    return {
      name: iconElement ? iconElement.getAttribute("alt") : "Unknown Team",
      tag: teamElement?.textContent?.trim() || "UNK",
      icon: iconElement ? this.baseUrl + iconElement.getAttribute("src") : null,
    };
  }

  /**
   * Extract tournament data from a match table
   */
  private extractTournamentData(matchTable: Element): Tournament {
    const tournamentElement = matchTable.querySelector(".tournament-text-flex a");
    const tournamentName = tournamentElement?.textContent?.trim() || "Unknown Tournament";
    const tournamentLink = tournamentElement ? this.baseUrl + tournamentElement.getAttribute("href") : null;

    return {
      name: tournamentName,
      game: this.gameDisplayName,
      link: tournamentLink,
    };
  }

  /**
   * Extract date/time from a match table
   */
  private extractDateTime(matchTable: Element): string | null {
    const timerElement = matchTable.querySelector(".timer-object");
    const timestamp = timerElement?.getAttribute("data-timestamp");
    return timestamp ? new Date(Number(timestamp) * 1000).toISOString() : null;
  }

  /**
   * Extract match format from a match table
   */
  private extractMatchFormat(matchTable: Element): string | null {
    const formatElement = matchTable.querySelector(".versus-lower abbr");
    return formatElement?.textContent?.trim().toUpperCase() || null;
  }

  /**
   * Extract tournament results from HTML content
   */
  private extractTournamentResultsFromHtml(htmlContent: string): TournamentResult[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const results: TournamentResult[] = [];

    // Select the results table
    const resultTable = document.querySelector(".wikitable.sortable");
    if (!resultTable) {
      console.log("No tournament results table found");
      return results;
    }

    // Get all result rows, excluding headers and special rows
    const resultRows = Array.from(resultTable.querySelectorAll("tbody > tr")).filter(row => {
      return (
        !row.querySelector("th") &&
        !row.classList.contains("sortbottom") &&
        row.querySelector("td") &&
        row.querySelector("td")?.textContent?.trim() !== ""
      );
    });

    resultRows.forEach(row => {
      const result = this.extractTournamentResult(row);
      results.push(result);
    });

    console.log(`Found ${results.length} tournament results for ${this.team} in ${this.game}`);
    return results;
  }

  /**
   * Extract tournament result from a table row
   */
  private extractTournamentResult(row: Element): TournamentResult {
    // Extract date (column 1)
    const dateCell = row.querySelector("td:nth-child(1)");
    let date = dateCell?.textContent?.trim() || null;

    // Transform date from YYYY-MM-DD to DD-MM-YYYY
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split("-");
      date = `${day}-${month}-${year}`;
    }

    // Extract placement (column 2)
    const placementCell = row.querySelector("td:nth-child(2)");
    const placement = placementCell?.querySelector(".placement-text")?.textContent?.trim() || "";

    // Extract tier (column 3)
    const tierCell = row.querySelector("td:nth-child(3)");
    const tier = tierCell?.querySelector("a")?.textContent?.trim() || "";

    // Extract tournament info (columns 4 and 5)
    const tournamentIconCell = row.querySelector("td:nth-child(4)");
    const tournamentNameCell = row.querySelector("td:nth-child(5)");

    const tournamentIcon = tournamentIconCell?.querySelector("img");
    const tournamentIconSrc = tournamentIcon ? this.baseUrl + tournamentIcon.getAttribute("src") : null;
    const tournamentName = tournamentNameCell?.textContent?.trim() || null;

    // Extract score and opponent (columns 6 and 7)
    const scoreCell = row.querySelector("td:nth-child(6)");
    const opponentCell = row.querySelector("td:nth-child(7)");
    const score = scoreCell?.textContent?.trim() || "";

    // Extract opponent team information
    const opponentTeamElement = opponentCell?.querySelector("a");
    const opponentIconElement = opponentCell?.querySelector("img");
    const opponentName = opponentTeamElement?.getAttribute("title") || 
                          opponentTeamElement?.textContent?.trim() || null;
    const opponentIcon = opponentIconElement ? this.baseUrl + opponentIconElement.getAttribute("src") : null;

    // Extract prize (column 8)
    const prizeCell = row.querySelector("td:nth-child(8)");
    let prize: number | null = null;

    if (prizeCell) {
      const prizeText = prizeCell.textContent?.trim() || "";
      if (prizeText && prizeText !== "-") {
        const prizeNumeric = prizeText.replace(/[^0-9.]/g, "");
        if (prizeNumeric) {
          prize = parseFloat(prizeNumeric);
          if (isNaN(prize)) prize = null;
        }
      }
    }

    // Split score if it exists
    let teamLeftScore = null;
    let teamRightScore = null;

    if (score && score.includes(":")) {
      const [leftScore, rightScore] = score.split(":");
      teamLeftScore = leftScore.trim();
      teamRightScore = rightScore.trim();
    }

    // Determine if it was a win
    const isWin = this.determineWinStatus(placementCell, placement, teamLeftScore, teamRightScore);

    return {
      date,
      placement,
      tier,
      tournament: {
        name: tournamentName,
        game: this.gameDisplayName,
        icon: tournamentIconSrc,
      },
      score: {
        teamLeft: {
          name: this.team.split("_").join(" "),
          icon: null,
          score: teamLeftScore,
        },
        teamRight: {
          name: opponentName,
          icon: opponentIcon,
          score: teamRightScore,
        },
      },
      prize,
      isWin,
    };
  }

  /**
   * Determine if a result represents a win
   */
  private determineWinStatus(placementCell: Element | null, placement: string, 
                             teamLeftScore: string | null, teamRightScore: string | null): boolean | null {
    // Check by score if available
    if (teamLeftScore !== null && teamRightScore !== null) {
      const leftScoreNum = parseInt(teamLeftScore);
      const rightScoreNum = parseInt(teamRightScore);

      if (!isNaN(leftScoreNum) && !isNaN(rightScoreNum)) {
        return leftScoreNum > rightScoreNum;
      }
    }

    // Check by placement
    const placementClass = placementCell?.className || "";

    // Win indicators
    if (placementClass.includes("placement-win") || placement === "W" || 
        placementClass.includes("placement-1") || placement === "1st") {
      return true;
    }
    
    // Loss indicators
    if (placementClass.includes("placement-lose") || placement === "L" || 
        (/^\d+(st|nd|rd|th)$/.test(placement) && !placement.startsWith("1"))) {
      return false;
    }

    return null; // Inconclusive
  }
}
