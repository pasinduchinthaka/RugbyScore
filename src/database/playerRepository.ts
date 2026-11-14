import { getDatabase } from './db';
import { Player, PlayerStats, MatchEvent } from '../types';

function generateUUID(): string {
  return 'ply_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export const PlayerRepository = {
  async getAllPlayers(filters?: {
    teamId?: string;
    position?: string;
    searchQuery?: string;
  }): Promise<Player[]> {
    const db = await getDatabase();
    let query = `
      SELECT p.*, t.name as teamName 
      FROM Players p
      LEFT JOIN Teams t ON p.teamId = t.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (filters?.teamId) {
      query += ` AND p.teamId = ?`;
      params.push(filters.teamId);
    }

    if (filters?.position && filters.position !== 'All') {
      query += ` AND p.position = ?`;
      params.push(filters.position);
    }

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      query += ` AND (p.name LIKE ? OR p.position LIKE ? OR t.name LIKE ? OR CAST(p.jerseyNumber AS TEXT) LIKE ?)`;
      const term = `%${filters.searchQuery.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY p.jerseyNumber ASC, p.name ASC`;

    const rows = await db.getAllAsync<Player & { teamName: string }>(query, params);
    return rows;
  },

  async getPlayerById(id: string): Promise<Player | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Player & { teamName: string }>(
      `SELECT p.*, t.name as teamName 
       FROM Players p
       LEFT JOIN Teams t ON p.teamId = t.id
       WHERE p.id = ?`,
      [id]
    );
    return row || null;
  },

  async createPlayer(data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    const db = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO Players (id, teamId, name, jerseyNumber, position, age, photo, contact, availability, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.teamId,
        data.name.trim(),
        Number(data.jerseyNumber) || 0,
        data.position,
        Number(data.age) || 0,
        data.photo || '',
        data.contact?.trim() || '',
        data.availability || 'Available',
        now,
        now,
      ]
    );

    return {
      id,
      teamId: data.teamId,
      name: data.name.trim(),
      jerseyNumber: Number(data.jerseyNumber) || 0,
      position: data.position,
      age: Number(data.age) || 0,
      photo: data.photo || '',
      contact: data.contact?.trim() || '',
      availability: data.availability || 'Available',
      createdAt: now,
      updatedAt: now,
    };
  },

  async updatePlayer(data: Player): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE Players
       SET teamId = ?, name = ?, jerseyNumber = ?, position = ?, age = ?, photo = ?, contact = ?, availability = ?, updatedAt = ?
       WHERE id = ?`,
      [
        data.teamId,
        data.name.trim(),
        Number(data.jerseyNumber) || 0,
        data.position,
        Number(data.age) || 0,
        data.photo || '',
        data.contact?.trim() || '',
        data.availability || 'Available',
        now,
        data.id,
      ]
    );
  },

  async deletePlayer(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM Players WHERE id = ?`, [id]);
  },

  async getPlayerScoringHistory(playerId: string): Promise<MatchEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MatchEvent>(
      `SELECT * FROM MatchEvents 
       WHERE playerId = ? 
       ORDER BY eventTimestamp DESC`,
      [playerId]
    );
    return rows;
  },

  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const db = await getDatabase();
    const player = await this.getPlayerById(playerId);
    const playerName = player ? player.name : 'Unknown Player';
    const teamName = player?.teamName || 'Unknown Team';

    // Unique matches where this player scored or was recorded
    const distinctMatches = await db.getAllAsync<{ matchId: string }>(
      `SELECT DISTINCT matchId FROM MatchEvents WHERE playerId = ?`,
      [playerId]
    );

    const events = await db.getAllAsync<MatchEvent>(
      `SELECT * FROM MatchEvents WHERE playerId = ?`,
      [playerId]
    );

    let tries = 0;
    let penaltyTries = 0;
    let conversions = 0;
    let penaltyKicks = 0;
    let dropGoals = 0;
    let totalPoints = 0;

    for (const e of events) {
      if (e.eventType === 'TRY') {
        tries++;
        totalPoints += 5;
      } else if (e.eventType === 'PENALTY_TRY') {
        penaltyTries++;
        totalPoints += 7;
      } else if (e.eventType === 'CONVERSION') {
        conversions++;
        totalPoints += 2;
      } else if (e.eventType === 'PENALTY_KICK') {
        penaltyKicks++;
        totalPoints += 3;
      } else if (e.eventType === 'DROP_GOAL') {
        dropGoals++;
        totalPoints += 3;
      }
    }

    return {
      playerId,
      playerName,
      teamName,
      matchesPlayed: distinctMatches.length,
      tries,
      penaltyTries,
      conversions,
      penaltyKicks,
      dropGoals,
      totalPoints,
    };
  },
};
