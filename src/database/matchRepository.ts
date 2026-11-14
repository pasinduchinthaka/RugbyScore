import { getDatabase } from './db';
import {
  Match,
  MatchEvent,
  MatchResult,
  ScoringEventType,
  MatchStatisticsSnapshot,
  FilterOptions,
  TeamSnapshot,
} from '../types';
import { TeamRepository } from './teamRepository';

function generateUUID(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

export const MatchRepository = {
  async generateMatchCode(): Promise<string> {
    const db = await getDatabase();
    const year = new Date().getFullYear();
    const countRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM Matches WHERE matchDate LIKE ?`,
      [`${year}%`]
    );
    const num = (countRow?.count || 0) + 1;
    return `RUG-${year}-${num.toString().padStart(3, '0')}`;
  },

  async createMatch(data: {
    teamAId: string;
    teamBId: string;
    matchDate: string;
    matchTime: string;
    venue: string;
    tournament: string;
    matchType: string;
    duration?: number;
    halvesCount?: number;
    notes?: string;
  }): Promise<Match> {
    const db = await getDatabase();
    const id = generateUUID('match');
    const matchCode = await this.generateMatchCode();

    const teamA = await TeamRepository.getTeamById(data.teamAId);
    const teamB = await TeamRepository.getTeamById(data.teamBId);

    if (!teamA || !teamB) {
      throw new Error('Both Team A and Team B must exist in the database.');
    }

    if (teamA.id === teamB.id) {
      throw new Error('Team A and Team B cannot be the same team.');
    }

    const teamASnapshot: TeamSnapshot = {
      id: teamA.id,
      name: teamA.name,
      logo: teamA.logo,
      country: teamA.country,
      coach: teamA.coach,
      organizationType: teamA.organizationType,
    };

    const teamBSnapshot: TeamSnapshot = {
      id: teamB.id,
      name: teamB.name,
      logo: teamB.logo,
      country: teamB.country,
      coach: teamB.coach,
      organizationType: teamB.organizationType,
    };

    const now = new Date().toISOString();
    const duration = data.duration || 80;
    const halvesCount = data.halvesCount || 2;

    await db.runAsync(
      `INSERT INTO Matches (
        id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
        matchDate, matchTime, venue, tournament, matchType, duration,
        halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
        winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
        currentHalf, notes, startedAt, completedAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        matchCode,
        teamA.id,
        teamB.id,
        JSON.stringify(teamASnapshot),
        JSON.stringify(teamBSnapshot),
        data.matchDate,
        data.matchTime || '15:00',
        data.venue?.trim() || 'Main Grounds',
        data.tournament?.trim() || 'General Series',
        data.matchType || 'Friendly',
        duration,
        halvesCount,
        null,
        null,
        'SCHEDULED',
        0,
        0,
        null,
        null,
        0,
        0,
        null,
        1,
        data.notes?.trim() || '',
        null,
        null,
        now,
      ]
    );

    const match = await this.getMatchById(id);
    if (!match) throw new Error('Failed to create match');
    return match;
  },

  async getMatchById(id: string): Promise<Match | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Match>(`SELECT * FROM Matches WHERE id = ?`, [id]);
    if (!row) return null;

    try {
      row.teamA = JSON.parse(row.teamASnapshot);
      row.teamB = JSON.parse(row.teamBSnapshot);
    } catch (e) {
      // Ignore json parse error
    }
    return row;
  },

  async updateToss(
    matchId: string,
    tossWinnerId: string,
    decision: 'KICK_OFF' | 'CHOOSE_SIDE'
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE Matches SET tossWinner = ?, tossDecision = ? WHERE id = ?`,
      [tossWinnerId, decision, matchId]
    );
  },

  async startMatch(matchId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE Matches 
       SET status = 'LIVE_FIRST_HALF', 
           startedAt = COALESCE(startedAt, ?), 
           isTimerRunning = 1, 
           lastTimerUpdate = ?,
           currentHalf = 1
       WHERE id = ?`,
      [now, Date.now(), matchId]
    );
  },

  async updateTimerState(
    matchId: string,
    timerSeconds: number,
    isTimerRunning: boolean,
    currentHalf: number,
    status?: string
  ): Promise<void> {
    const db = await getDatabase();
    const lastTimerUpdate = isTimerRunning ? Date.now() : null;

    if (status) {
      await db.runAsync(
        `UPDATE Matches 
         SET timerSeconds = ?, isTimerRunning = ?, lastTimerUpdate = ?, currentHalf = ?, status = ?
         WHERE id = ?`,
        [timerSeconds, isTimerRunning ? 1 : 0, lastTimerUpdate, currentHalf, status, matchId]
      );
    } else {
      await db.runAsync(
        `UPDATE Matches 
         SET timerSeconds = ?, isTimerRunning = ?, lastTimerUpdate = ?, currentHalf = ?
         WHERE id = ?`,
        [timerSeconds, isTimerRunning ? 1 : 0, lastTimerUpdate, currentHalf, matchId]
      );
    }
  },

  async getEligibleConversionStatus(matchId: string, teamId: string): Promise<{
    triesCount: number;
    conversionsAttempted: number;
    canConvert: boolean;
  }> {
    const db = await getDatabase();
    const tryRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM MatchEvents WHERE matchId = ? AND teamId = ? AND eventType = 'TRY'`,
      [matchId, teamId]
    );
    const triesCount = tryRow?.count || 0;

    const convRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM MatchEvents 
       WHERE matchId = ? AND teamId = ? AND eventType IN ('CONVERSION', 'MISSED_CONVERSION')`,
      [matchId, teamId]
    );
    const conversionsAttempted = convRow?.count || 0;

    return {
      triesCount,
      conversionsAttempted,
      canConvert: triesCount > conversionsAttempted,
    };
  },

  async addScoringEvent(data: {
    matchId: string;
    teamId: string;
    playerId: string | null;
    eventType: ScoringEventType;
    matchTime: number;
    half: number;
    notes?: string;
  }): Promise<MatchEvent> {
    const db = await getDatabase();
    const match = await this.getMatchById(data.matchId);
    if (!match) throw new Error('Match not found');

    // Scoring Values:
    // Try: 5 pts
    // Penalty Try: 7 pts (No conversion allowed!)
    // Conversion: 2 pts (requires eligible Try)
    // Missed Conversion: 0 pts
    // Penalty Kick: 3 pts
    // Drop Goal: 3 pts
    let points = 0;
    if (data.eventType === 'TRY') points = 5;
    else if (data.eventType === 'PENALTY_TRY') points = 7;
    else if (data.eventType === 'CONVERSION') points = 2;
    else if (data.eventType === 'MISSED_CONVERSION') points = 0;
    else if (data.eventType === 'PENALTY_KICK') points = 3;
    else if (data.eventType === 'DROP_GOAL') points = 3;

    // Check Conversion Eligibility
    if (data.eventType === 'CONVERSION' || data.eventType === 'MISSED_CONVERSION') {
      const eligibility = await this.getEligibleConversionStatus(data.matchId, data.teamId);
      if (!eligibility.canConvert) {
        throw new Error(
          `Cannot record ${data.eventType === 'CONVERSION' ? 'Conversion' : 'Missed Conversion'}: No eligible unconverted Try available for this team.`
        );
      }
    }

    // Determine snapshots
    let teamNameSnapshot = 'Unknown Team';
    if (data.teamId === match.teamAId) {
      teamNameSnapshot = match.teamA?.name || 'Team A';
    } else if (data.teamId === match.teamBId) {
      teamNameSnapshot = match.teamB?.name || 'Team B';
    }

    let playerNameSnapshot = 'Team';
    if (data.playerId) {
      const playerRow = await db.getFirstAsync<{ name: string; jerseyNumber: number }>(
        `SELECT name, jerseyNumber FROM Players WHERE id = ?`,
        [data.playerId]
      );
      if (playerRow) {
        playerNameSnapshot = `#${playerRow.jerseyNumber} ${playerRow.name}`;
      }
    } else if (data.eventType === 'PENALTY_TRY') {
      playerNameSnapshot = 'Awarded by Referee';
    }

    const eventId = generateUUID('evt');
    const now = new Date().toISOString();

    // Insert event
    await db.runAsync(
      `INSERT INTO MatchEvents (
        id, matchId, teamId, playerId, teamNameSnapshot, playerNameSnapshot,
        eventType, points, matchTime, half, eventTimestamp, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        data.matchId,
        data.teamId,
        data.playerId,
        teamNameSnapshot,
        playerNameSnapshot,
        data.eventType,
        points,
        data.matchTime,
        data.half,
        now,
        data.notes || '',
      ]
    );

    // Recalculate dynamic match scores
    await this.recalculateMatchScores(data.matchId);

    return {
      id: eventId,
      matchId: data.matchId,
      teamId: data.teamId,
      playerId: data.playerId,
      teamNameSnapshot,
      playerNameSnapshot,
      eventType: data.eventType,
      points,
      matchTime: data.matchTime,
      half: data.half,
      eventTimestamp: now,
      notes: data.notes || '',
    };
  },

  async recalculateMatchScores(matchId: string): Promise<{ scoreA: number; scoreB: number }> {
    const db = await getDatabase();
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    const scoreARow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(points), 0) as total FROM MatchEvents WHERE matchId = ? AND teamId = ?`,
      [matchId, match.teamAId]
    );

    const scoreBRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(points), 0) as total FROM MatchEvents WHERE matchId = ? AND teamId = ?`,
      [matchId, match.teamBId]
    );

    const scoreA = scoreARow?.total || 0;
    const scoreB = scoreBRow?.total || 0;

    await db.runAsync(
      `UPDATE Matches SET teamAScore = ?, teamBScore = ? WHERE id = ?`,
      [scoreA, scoreB, matchId]
    );

    return { scoreA, scoreB };
  },

  async undoLastEvent(matchId: string): Promise<MatchEvent | null> {
    const db = await getDatabase();
    const lastEvent = await db.getFirstAsync<MatchEvent>(
      `SELECT * FROM MatchEvents WHERE matchId = ? ORDER BY eventTimestamp DESC, matchTime DESC LIMIT 1`,
      [matchId]
    );

    if (!lastEvent) {
      return null;
    }

    await db.runAsync(`DELETE FROM MatchEvents WHERE id = ?`, [lastEvent.id]);
    await this.recalculateMatchScores(matchId);
    return lastEvent;
  },

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MatchEvent>(
      `SELECT * FROM MatchEvents WHERE matchId = ? ORDER BY matchTime ASC, eventTimestamp ASC`,
      [matchId]
    );
    return rows;
  },

  async completeMatch(matchId: string, playerOfTheMatch?: string): Promise<MatchResult> {
    const db = await getDatabase();
    const match = await this.getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    const { scoreA, scoreB } = await this.recalculateMatchScores(matchId);

    let winner: string;
    let isDraw = 0;
    if (scoreA > scoreB) {
      winner = match.teamAId;
    } else if (scoreB > scoreA) {
      winner = match.teamBId;
    } else {
      winner = 'DRAW';
      isDraw = 1;
    }

    const now = new Date().toISOString();
    const potm = playerOfTheMatch || match.playerOfTheMatch || null;

    // Calculate detailed category statistics
    const events = await this.getMatchEvents(matchId);

    const statsSnapshot: MatchStatisticsSnapshot = {
      teamA: {
        tries: 0,
        penaltyTries: 0,
        conversions: 0,
        missedConversions: 0,
        penaltyKicks: 0,
        dropGoals: 0,
        totalPoints: scoreA,
      },
      teamB: {
        tries: 0,
        penaltyTries: 0,
        conversions: 0,
        missedConversions: 0,
        penaltyKicks: 0,
        dropGoals: 0,
        totalPoints: scoreB,
      },
      playerScores: [],
    };

    const playerMap: { [key: string]: any } = {};

    for (const e of events) {
      const isTeamA = e.teamId === match.teamAId;
      const cat = isTeamA ? statsSnapshot.teamA : statsSnapshot.teamB;

      if (e.eventType === 'TRY') cat.tries++;
      else if (e.eventType === 'PENALTY_TRY') cat.penaltyTries++;
      else if (e.eventType === 'CONVERSION') cat.conversions++;
      else if (e.eventType === 'MISSED_CONVERSION') cat.missedConversions++;
      else if (e.eventType === 'PENALTY_KICK') cat.penaltyKicks++;
      else if (e.eventType === 'DROP_GOAL') cat.dropGoals++;

      if (e.playerId) {
        if (!playerMap[e.playerId]) {
          playerMap[e.playerId] = {
            playerId: e.playerId,
            playerName: e.playerNameSnapshot,
            teamId: e.teamId,
            teamName: e.teamNameSnapshot,
            tries: 0,
            penaltyTries: 0,
            conversions: 0,
            penaltyKicks: 0,
            dropGoals: 0,
            totalPoints: 0,
          };
        }
        if (e.eventType === 'TRY') {
          playerMap[e.playerId].tries++;
          playerMap[e.playerId].totalPoints += 5;
        } else if (e.eventType === 'PENALTY_TRY') {
          playerMap[e.playerId].penaltyTries++;
          playerMap[e.playerId].totalPoints += 7;
        } else if (e.eventType === 'CONVERSION') {
          playerMap[e.playerId].conversions++;
          playerMap[e.playerId].totalPoints += 2;
        } else if (e.eventType === 'PENALTY_KICK') {
          playerMap[e.playerId].penaltyKicks++;
          playerMap[e.playerId].totalPoints += 3;
        } else if (e.eventType === 'DROP_GOAL') {
          playerMap[e.playerId].dropGoals++;
          playerMap[e.playerId].totalPoints += 3;
        }
      }
    }

    statsSnapshot.playerScores = Object.values(playerMap);

    const resultId = generateUUID('res');
    const statsJson = JSON.stringify(statsSnapshot);

    // Update match status to COMPLETED
    await db.runAsync(
      `UPDATE Matches 
       SET status = 'COMPLETED', winner = ?, playerOfTheMatch = ?, completedAt = ?, isTimerRunning = 0
       WHERE id = ?`,
      [winner, potm, now, matchId]
    );

    // Insert or replace match result
    await db.runAsync(
      `INSERT OR REPLACE INTO MatchResults (
        id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resultId, matchId, scoreA, scoreB, winner, isDraw, potm, statsJson, now]
    );

    return {
      id: resultId,
      matchId,
      finalScoreA: scoreA,
      finalScoreB: scoreB,
      winner,
      isDraw,
      playerOfTheMatch: potm,
      statistics: statsJson,
      completedAt: now,
    };
  },

  async getMatchResult(matchId: string): Promise<MatchResult | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MatchResult>(
      `SELECT * FROM MatchResults WHERE matchId = ?`,
      [matchId]
    );
    return row || null;
  },

  async getHistoricalMatches(filters?: FilterOptions): Promise<Match[]> {
    const db = await getDatabase();
    let query = `SELECT * FROM Matches WHERE status = 'COMPLETED'`;
    const params: (string | number)[] = [];

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const term = `%${filters.searchQuery.trim()}%`;
      query += ` AND (
        matchCode LIKE ? OR 
        venue LIKE ? OR 
        tournament LIKE ? OR 
        teamASnapshot LIKE ? OR 
        teamBSnapshot LIKE ? OR 
        playerOfTheMatch LIKE ?
      )`;
      params.push(term, term, term, term, term, term);
    }

    if (filters?.teamId) {
      query += ` AND (teamAId = ? OR teamBId = ?)`;
      params.push(filters.teamId, filters.teamId);
    }

    if (filters?.year && filters.year !== 'All') {
      query += ` AND matchDate LIKE ?`;
      params.push(`${filters.year}%`);
    }

    if (filters?.tournament && filters.tournament !== 'All') {
      query += ` AND tournament = ?`;
      params.push(filters.tournament);
    }

    if (filters?.venue && filters.venue !== 'All') {
      query += ` AND venue = ?`;
      params.push(filters.venue);
    }

    if (filters?.matchType && filters.matchType !== 'All') {
      query += ` AND matchType = ?`;
      params.push(filters.matchType);
    }

    if (filters?.isDraw) {
      query += ` AND (winner = 'DRAW' OR winner = 'Draw')`;
    } else if (filters?.winner && filters.winner !== 'All') {
      query += ` AND winner = ?`;
      params.push(filters.winner);
    }

    if (filters?.startDate) {
      query += ` AND matchDate >= ?`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND matchDate <= ?`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY matchDate DESC, completedAt DESC, createdAt DESC`;

    const rows = await db.getAllAsync<Match>(query, params);
    return rows.map((m) => {
      try {
        m.teamA = JSON.parse(m.teamASnapshot);
        m.teamB = JSON.parse(m.teamBSnapshot);
      } catch (e) {}
      return m;
    });
  },

  async getRecentMatches(limit: number = 5): Promise<Match[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Match>(
      `SELECT * FROM Matches WHERE status = 'COMPLETED' ORDER BY matchDate DESC, completedAt DESC LIMIT ?`,
      [limit]
    );
    return rows.map((m) => {
      try {
        m.teamA = JSON.parse(m.teamASnapshot);
        m.teamB = JSON.parse(m.teamBSnapshot);
      } catch (e) {}
      return m;
    });
  },

  async getOngoingMatches(): Promise<Match[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Match>(
      `SELECT * FROM Matches 
       WHERE status IN ('LIVE_FIRST_HALF', 'HALF_TIME', 'LIVE_SECOND_HALF', 'EXTRA_TIME') 
       ORDER BY startedAt DESC, createdAt DESC`
    );
    return rows.map((m) => {
      try {
        m.teamA = JSON.parse(m.teamASnapshot);
        m.teamB = JSON.parse(m.teamBSnapshot);
      } catch (e) {}
      return m;
    });
  },

  async deleteMatch(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM Matches WHERE id = ?`, [id]);
  },
};
