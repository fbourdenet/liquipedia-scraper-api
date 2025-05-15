import { JSDOM } from "jsdom";
import { Match, Team, Tournament } from "../interfaces/match.interface";
import { GAME_NAME_MAPPING } from "../config/games.config";
import { Player } from "../interfaces/player.interface";
import { TournamentResult } from "../interfaces/tournament.interface";

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

  async fetchHtmlContent(path?: string): Promise<string> {
    const URL = this.getLiquipediaUrl();

    try {
      console.log(`Fetching HTML content from ${URL}${path ? `/${path}` : ""}`);
      const response = await fetch(`${URL}${path ? `/${path}` : ""}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${URL}/${path}: ${response.statusText}`
        );
      }
      return response.text();
    } catch (error) {
      console.error(`Error fetching HTML content from ${URL}/${path}`);
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
      name: iconElement ? iconElement.getAttribute("alt") : "Unknown Team",
      tag: teamElement?.textContent?.trim() || "UNK",
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
      game: gameName,
      link: tournamentLink,
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
          const [day, month, year] = date.split("-").map(Number);
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

  extractPlayersFromHtml(htmlContent: string): Player[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const players: Player[] = [];

    // Target specifically the Active section's roster table
    // This avoids getting players from the "Former Squad" sections in the tabs
    const activeSection = document.querySelector(
      'h3 #Active, h3 .mw-headline[id="Active"]'
    );
    if (!activeSection) {
      console.log("Active players section not found");
      // Try to find any roster table if Active section isn't found
      const rosterTable = document.querySelector(".roster-card");
      if (!rosterTable) {
        console.log("No roster table found");
        return players;
      }

      // Use the first roster table found if no Active section
      processRosterTable(rosterTable);
      return players;
    }

    // Find the closest roster table after the Active heading
    const rosterSection = activeSection.closest("h3")?.nextElementSibling;
    if (!rosterSection) {
      console.log("Roster table not found after Active heading");
      return players;
    }

    processRosterTable(rosterSection);
    return players;

    // Helper function to process a roster table and extract player data
    function processRosterTable(section: Element) {
      // Target the player rows in the active roster table
      const playerRows = section.querySelectorAll(".roster-card .Player");

      playerRows.forEach((row) => {
        // Extract player tag and country
        const idCell = row.querySelector(".ID");
        const tagElement = idCell?.querySelector("a");
        const flagElement = idCell?.querySelector(".flag img");

        // Extract real name
        const nameCell = row.querySelector(".Name");
        const nameElement = nameCell?.querySelector(".LargeStuff");

        // Extract position/role
        let position = null;
        const positionCell = row.querySelector(".Position");

        // If not already determined, try to extract from position cell
        if (!position && positionCell) {
          const positionText = positionCell.textContent?.trim();
          // Check if it contains role information in parentheses (like "(Coach)")
          const roleMatch = positionText?.match(/\((.*?)\)/);
          if (roleMatch) {
            position = roleMatch[1]; // Extract the role from parentheses
          } else {
            // Clean up position text, removing "Position:" or "Role:" prefix
            position = positionText
              ? positionText
                  .replace(/Position:|Role:/gi, "")
                  .replace(/\s*\([^)]*\)\s*/g, "")
                  .trim()
              : null;
          }
        }

        const dateCell = row.querySelector(".Date");
        const dateText = dateCell?.querySelector("i")?.textContent?.trim();
        // Extract date, remove citation references, and reformat from YYYY-MM-DD to DD-MM-YYYY
        let joinDate = null;
        if (dateText) {
          const rawDate = dateText.split(/[<\[]/)[0].trim();
          // Check if it matches YYYY-MM-DD format and convert
          const dateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (dateMatch) {
            // Reformat from YYYY-MM-DD to DD-MM-YYYY
            joinDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
          } else {
            // If it's not in YYYY-MM-DD format, keep the original
            joinDate = rawDate;
          }
        }

        const player = {
          tag: tagElement?.textContent?.trim() || "Unknown Player",
          name: nameElement?.textContent?.trim() || null,
          country: flagElement?.getAttribute("title") || null,
          position: position,
          joinDate: joinDate,
        };

        players.push(player);
      });

      console.log(`Total roster members found: ${players.length}`);
    }
  }

  async getPlayers(): Promise<Player[]> {
    try {
      const htmlContent = await this.fetchHtmlContent();
      const players = this.extractPlayersFromHtml(htmlContent);

      return players;
    } catch (error) {
      console.error(`Error getting players:`, error);
      return [];
    }
  }

  extractTournamentResultsFromHtml(htmlContent: string): TournamentResult[] {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const results: TournamentResult[] = [];

    // Select the results table
    const resultTable = document.querySelector(".wikitable.sortable");
    if (!resultTable) {
      console.log("No tournament results table found");
      return results;
    }

    // Get all result rows, excluding headers and the year separator rows
    const resultRows = Array.from(
      resultTable.querySelectorAll("tbody > tr")
    ).filter((row) => {
      // Skip header rows, year separator rows, and the empty first row
      return (
        !row.querySelector("th") &&
        !row.classList.contains("sortbottom") &&
        row.querySelector("td") &&
        row.querySelector("td")?.textContent?.trim() !== ""
      );
    });

    resultRows.forEach((row) => {
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
      const placement =
        placementCell?.querySelector(".placement-text")?.textContent?.trim() ||
        "";

      // Extract tier (column 3)
      const tierCell = row.querySelector("td:nth-child(3)");
      const tier = tierCell?.querySelector("a")?.textContent?.trim() || "";

      // Extract tournament info (columns 4 and 5)
      const tournamentIconCell = row.querySelector("td:nth-child(4)");
      const tournamentNameCell = row.querySelector("td:nth-child(5)");

      const tournamentIcon = tournamentIconCell?.querySelector("img");
      const tournamentIconSrc = tournamentIcon
        ? this.baseUrl + tournamentIcon.getAttribute("src")
        : null;
      const tournamentName = tournamentNameCell?.textContent?.trim() || null;

      // Extract score and opposing team (columns 6 and 7)
      const scoreCell = row.querySelector("td:nth-child(6)");
      const opponentCell = row.querySelector("td:nth-child(7)");

      const score = scoreCell?.textContent?.trim() || "";

      // Extract opponent team
      // Extract opponent team
      const opponentTeamElement = opponentCell?.querySelector("a");
      const opponentIconElement = opponentCell?.querySelector("img");

      // Get opponent name from title attribute if available, fallback to text content
      const opponentName =
        opponentTeamElement?.getAttribute("title") ||
        opponentTeamElement?.textContent?.trim() ||
        null;

      const opponentIcon = opponentIconElement
        ? this.baseUrl + opponentIconElement.getAttribute("src")
        : null;

      // Extract prize (column 8)
      // Extract prize (column 8)
      const prizeCell = row.querySelector("td:nth-child(8)");
      let prize: number | null = null;

      if (prizeCell) {
        const prizeText = prizeCell.textContent?.trim() || "";

        // If prize is not empty or just a dash
        if (prizeText && prizeText !== "-") {
          // Extract only numbers from the prize string (remove currency symbols, commas, etc)
          const prizeNumeric = prizeText.replace(/[^0-9.]/g, "");

          if (prizeNumeric) {
            prize = parseFloat(prizeNumeric);

            // Handle invalid conversion (NaN)
            if (isNaN(prize)) {
              prize = null;
            }
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

      // After extracting and setting up all other properties, determine if it was a win
      // We can determine this by:
      // 1. Checking the score (if available)
      // 2. Looking at placement indicators like "W" or "L"
      // 3. Checking specific placement classes

      let isWin: boolean | null = null;

      // Check by score if it's a match result (not a tournament placement)
      if (teamLeftScore !== null && teamRightScore !== null) {
        const leftScoreNum = parseInt(teamLeftScore);
        const rightScoreNum = parseInt(teamRightScore);

        if (!isNaN(leftScoreNum) && !isNaN(rightScoreNum)) {
          isWin = leftScoreNum > rightScoreNum;
        }
      }

      // If score check wasn't conclusive, check by placement
      if (isWin === null) {
        const placementClass = placementCell?.className || "";

        // Check for win indicator in placement class
        if (placementClass.includes("placement-win") || placement === "W") {
          isWin = true;
        }
        // Check for loss indicator in placement class
        else if (
          placementClass.includes("placement-lose") ||
          placement === "L"
        ) {
          isWin = false;
        }
        // Check for 1st place indicator
        else if (
          placementClass.includes("placement-1") ||
          placement === "1st"
        ) {
          isWin = true;
        }
        // For placements like "2nd", "3rd", etc., it's not a direct win
        else if (
          /^\d+(st|nd|rd|th)$/.test(placement) &&
          !placement.startsWith("1")
        ) {
          isWin = false;
        }
      }

      const result: TournamentResult = {
        date,
        placement,
        tier,
        tournament: {
          name: tournamentName,
          game: GAME_NAME_MAPPING[this.game],
          icon: tournamentIconSrc,
        },
        score: {
          teamLeft: {
            name: this.team.split("_").join(" "),
            icon: null, // We don't have this team's icon in the results table
            score: teamLeftScore,
          },
          teamRight: {
            name: opponentName,
            icon: opponentIcon,
            score: teamRightScore,
          },
        },
        prize,
        isWin, // Add the new attribute
      };

      results.push(result);
    });

    console.log(
      `Found ${results.length} tournament results for ${this.team} in ${this.game}`
    );
    return results;
  }

  async getTournamentResults(date?: string): Promise<TournamentResult[]> {
    try {
      const htmlContent = await this.fetchHtmlContent("Results");
      let results = this.extractTournamentResultsFromHtml(htmlContent);

      if (date) {
        results = results.filter((result) => {
          if (!result.date) return false;

          // Parse input date (already in DD-MM-YYYY format)
          const [day, month, year] = date.split("-").map(Number);
          const targetDate = new Date(year, month - 1, day);

          // Parse result date (now also in DD-MM-YYYY format)
          const [resultDay, resultMonth, resultYear] = result.date
            .split("-")
            .map(Number);
          const resultDate = new Date(resultYear, resultMonth - 1, resultDay);

          return (
            resultDate.getDate() === targetDate.getDate() &&
            resultDate.getMonth() === targetDate.getMonth() &&
            resultDate.getFullYear() === targetDate.getFullYear()
          );
        });

        console.log(
          `Found ${results.length} tournament results for ${this.team} in ${this.game} on ${date}`
        );
      }

      return results;
    } catch (error) {
      console.error(`Error getting tournament results:`, error);
      return [];
    }
  }
}
