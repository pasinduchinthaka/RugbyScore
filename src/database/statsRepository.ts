import { getDatabase } from './db';
import { TeamStats, HeadToHeadStats, PlayerStats, Match } from '../types';
import { TeamRepository } from './teamRepository';

export const StatsRepository = {
  async getDashboardSummary(): Promise<{
    totalTeams: number;
    totalPlayers: number;
    totalMatchesPlayed: number;
    ongoingMatchesCount: number;
  }> {
    const db = await getDatabase();

    const teamsRow = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM Teams`);
    const playersRow = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM Players`);
    const matchesRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM Matches WHERE status = 'COMPLETED'`
    );
    const ongoingRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM Matches WHERE status IN ('LIVE_FIRST_HALF', 'HALF_TIME', 'LIVE_SECOND_HALF', 'EXTRA_TIME')`
    );

    return {
      totalTeams: teamsRow?.count || 0,
      totalPlayers: playersRow?.count || 0,
      totalMatchesPlayed: matchesRow?.count || 0,
      ongoingMatchesCount: ongoingRow?.count || 0,
    };
  },

  async getAllTeamStats(): Promise<TeamStats[]> {
    const teams = await TeamRepository.getAllTeams();
    const stats: TeamStats[] = [];

    for (const team of teams) {
      const s = await TeamRepository.getTeamStats(team.id);
      stats.push(s);
    }

    // Sort by wins desc, then points difference desc, then points scored desc
    stats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      return b.pointsScored - a.pointsScored;
    });

    return stats;
  },

  async getHeadToHead(teamAId: string, teamBId: string): Promise<HeadToHeadStats | null> {
    const db = await getDatabase();
    const teamA = await TeamRepository.getTeamById(teamAId);
    const teamB = await TeamRepository.getTeamById(teamBId);

    if (!teamA || !teamB) return null;

    const matches = await db.getAllAsync<Match>(
      `SELECT * FROM Matches 
       WHERE ((teamAId = ? AND teamBId = ?) OR (teamAId = ? AND teamBId = ?)) 
         AND status = 'COMPLETED'
       ORDER BY matchDate DESC, completedAt DESC`,
      [teamAId, teamBId, teamBId, teamAId]
    );

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;
    let teamAPoints = 0;
    let teamBPoints = 0;

    const parsedMatches: Match[] = [];

    for (const m of matches) {
      try {
        m.teamA = JSON.parse(m.teamASnapshot);
        m.teamB = JSON.parse(m.teamBSnapshot);
      } catch (e) {}
      parsedMatches.push(m);

      const isA_TeamAInMatch = m.teamAId === teamAId;
      const ptsA = isA_TeamAInMatch ? m.teamAScore : m.teamBScore;
      const ptsB = isA_TeamAInMatch ? m.teamBScore : m.teamAScore;

      teamAPoints += ptsA;
      teamBPoints += ptsB;

      if (m.winner === 'DRAW' || m.winner === 'Draw') {
        draws++;
      } else if (m.winner === teamAId) {
        teamAWins++;
      } else if (m.winner === teamBId) {
        teamBWins++;
      }
    }

    return {
      teamAId,
      teamAName: teamA.name,
      teamBId,
      teamBName: teamB.name,
      totalMatches: matches.length,
      teamAWins,
      teamBWins,
      draws,
      teamAPoints,
      teamBPoints,
      recentMatches: parsedMatches,
    };
  },

  async getTopScorers(limit: number = 20): Promise<PlayerStats[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
      playerId: string;
      playerNameSnapshot: string;
      teamNameSnapshot: string;
      tries: number;
      penaltyTries: number;
      conversions: number;
      penaltyKicks: number;
      dropGoals: number;
      totalPoints: number;
      matchesPlayed: number;
    }>(
      `SELECT 
        e.playerId,
        e.playerNameSnapshot,
        e.teamNameSnapshot,
        COUNT(DISTINCT e.matchId) as matchesPlayed,
        SUM(CASE WHEN e.eventType = 'TRY' THEN 1 ELSE 0 END) as tries,
        SUM(CASE WHEN e.eventType = 'PENALTY_TRY' THEN 1 ELSE 0 END) as penaltyTries,
        SUM(CASE WHEN e.eventType = 'CONVERSION' THEN 1 ELSE 0 END) as conversions,
        SUM(CASE WHEN e.eventType = 'PENALTY_KICK' THEN 1 ELSE 0 END) as penaltyKicks,
        SUM(CASE WHEN e.eventType = 'DROP_GOAL' THEN 1 ELSE 0 END) as dropGoals,
        SUM(e.points) as totalPoints
      FROM MatchEvents e
      WHERE e.playerId IS NOT NULL
      GROUP BY e.playerId
      ORDER BY totalPoints DESC, tries DESC
      LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      playerId: r.playerId,
      playerName: r.playerNameSnapshot,
      teamName: r.teamNameSnapshot,
      matchesPlayed: r.matchesPlayed,
      tries: r.tries || 0,
      penaltyTries: r.penaltyTries || 0,
      conversions: r.conversions || 0,
      penaltyKicks: r.penaltyKicks || 0,
      dropGoals: r.dropGoals || 0,
      totalPoints: r.totalPoints || 0,
    }));
  },
};
