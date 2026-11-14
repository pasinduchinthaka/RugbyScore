import { getDatabase } from './db';
import { Team, TeamStats, Match } from '../types';

function generateUUID(): string {
  return 'team_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export const TeamRepository = {
  async getAllTeams(searchQuery?: string): Promise<Team[]> {
    const db = await getDatabase();
    let query = `
      SELECT t.*, COUNT(p.id) as playerCount 
      FROM Teams t
      LEFT JOIN Players p ON t.id = p.teamId
    `;
    const params: string[] = [];

    if (searchQuery && searchQuery.trim().length > 0) {
      query += ` WHERE t.name LIKE ? OR t.country LIKE ? OR t.coach LIKE ? OR t.organizationType LIKE ?`;
      const term = `%${searchQuery.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY t.id ORDER BY t.name ASC`;

    const rows = await db.getAllAsync<Team & { playerCount: number }>(query, params);
    return rows;
  },

  async getTeamById(id: string): Promise<Team | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Team & { playerCount: number }>(
      `SELECT t.*, COUNT(p.id) as playerCount 
       FROM Teams t
       LEFT JOIN Players p ON t.id = p.teamId
       WHERE t.id = ?
       GROUP BY t.id`,
      [id]
    );
    return row || null;
  },

  async createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const db = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO Teams (id, name, logo, country, organizationType, coach, contact, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name.trim(),
        data.logo || 'shield',
        data.country.trim(),
        data.organizationType,
        data.coach?.trim() || '',
        data.contact?.trim() || '',
        data.description?.trim() || '',
        now,
        now,
      ]
    );

    return {
      id,
      name: data.name.trim(),
      logo: data.logo || 'shield',
      country: data.country.trim(),
      organizationType: data.organizationType,
      coach: data.coach?.trim() || '',
      contact: data.contact?.trim() || '',
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
      playerCount: 0,
    };
  },

  async updateTeam(data: Team): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE Teams
       SET name = ?, logo = ?, country = ?, organizationType = ?, coach = ?, contact = ?, description = ?, updatedAt = ?
       WHERE id = ?`,
      [
        data.name.trim(),
        data.logo || 'shield',
        data.country.trim(),
        data.organizationType,
        data.coach?.trim() || '',
        data.contact?.trim() || '',
        data.description?.trim() || '',
        now,
        data.id,
      ]
    );
  },

  async deleteTeam(id: string): Promise<void> {
    const db = await getDatabase();
    // Handled by CASCADE in SQLite foreign keys
    await db.runAsync(`DELETE FROM Teams WHERE id = ?`, [id]);
  },

  async getTeamMatches(teamId: string): Promise<Match[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Match>(
      `SELECT * FROM Matches 
       WHERE teamAId = ? OR teamBId = ? 
       ORDER BY matchDate DESC, createdAt DESC`,
      [teamId, teamId]
    );

    return rows.map((m) => {
      try {
        m.teamA = JSON.parse(m.teamASnapshot);
        m.teamB = JSON.parse(m.teamBSnapshot);
      } catch (e) {
        // Fallback
      }
      return m;
    });
  },

  async getTeamStats(teamId: string): Promise<TeamStats> {
    const db = await getDatabase();
    const team = await this.getTeamById(teamId);
    const teamName = team ? team.name : 'Unknown Team';

    const completedMatches = await db.getAllAsync<Match>(
      `SELECT * FROM Matches 
       WHERE (teamAId = ? OR teamBId = ?) AND status = 'COMPLETED'`,
      [teamId, teamId]
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let pointsScored = 0;
    let pointsConceded = 0;
    let highestScore = 0;
    let lowestScore = completedMatches.length > 0 ? 999999 : 0;

    for (const m of completedMatches) {
      const isTeamA = m.teamAId === teamId;
      const myScore = isTeamA ? m.teamAScore : m.teamBScore;
      const oppScore = isTeamA ? m.teamBScore : m.teamAScore;

      pointsScored += myScore;
      pointsConceded += oppScore;

      if (myScore > highestScore) highestScore = myScore;
      if (myScore < lowestScore) lowestScore = myScore;

      if (m.winner === 'DRAW' || m.winner === 'Draw') {
        draws++;
      } else if (m.winner === teamId) {
        wins++;
      } else {
        losses++;
      }
    }

    if (lowestScore === 999999) lowestScore = 0;

    const matchesPlayed = completedMatches.length;
    const winPercentage = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
    const pointDifference = pointsScored - pointsConceded;

    return {
      teamId,
      teamName,
      matchesPlayed,
      wins,
      losses,
      draws,
      winPercentage,
      pointsScored,
      pointsConceded,
      pointDifference,
      highestScore,
      lowestScore,
    };
  },
};
