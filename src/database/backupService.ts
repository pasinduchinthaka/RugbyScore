import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from './db';
import { AppBackup, Team, Player, Match, MatchEvent, MatchResult } from '../types';

export const BackupService = {
  async exportBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const db = await getDatabase();

      const teams = await db.getAllAsync<Team>(`SELECT * FROM Teams ORDER BY createdAt ASC`);
      const players = await db.getAllAsync<Player>(`SELECT * FROM Players ORDER BY createdAt ASC`);
      const matches = await db.getAllAsync<Match>(`SELECT * FROM Matches ORDER BY createdAt ASC`);
      const matchEvents = await db.getAllAsync<MatchEvent>(`SELECT * FROM MatchEvents ORDER BY eventTimestamp ASC`);
      const matchResults = await db.getAllAsync<MatchResult>(`SELECT * FROM MatchResults ORDER BY completedAt ASC`);

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `RugbyScore_Backup_${timestamp}.json`;

      const backupData: AppBackup = {
        version: '1.0.0',
        exportDate: now.toISOString(),
        metadata: {
          appName: 'RugbyScore',
          teamsCount: teams.length,
          playersCount: players.length,
          matchesCount: matches.length,
          eventsCount: matchEvents.length,
          resultsCount: matchResults.length,
        },
        teams,
        players,
        matches,
        matchEvents,
        matchResults,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isShareAvailable = await Sharing.isAvailableAsync();
      if (isShareAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export RugbyScore Database Backup',
          UTI: 'public.json',
        });
      }

      return { success: true, filePath: fileUri };
    } catch (error: any) {
      console.error('Backup export failed:', error);
      return { success: false, error: error.message || 'Unknown error exporting backup' };
    }
  },

  async pickAndRestoreBackup(): Promise<{
    success: boolean;
    restoredCounts?: AppBackup['metadata'];
    error?: string;
  }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'Import cancelled by user.' };
      }

      const fileAsset = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let backup: AppBackup;
      try {
        backup = JSON.parse(fileContent);
      } catch (e) {
        return { success: false, error: 'Invalid backup file. The selected file is not valid JSON.' };
      }

      // Validate schema
      if (!backup.metadata || !Array.isArray(backup.teams) || !Array.isArray(backup.matches)) {
        return {
          success: false,
          error: 'Corrupted backup file format. Missing essential RugbyScore tables.',
        };
      }

      // Execute restoration inside database with transaction
      const db = await getDatabase();

      await db.withTransactionAsync(async () => {
        // Temporarily disable foreign keys for clean restoration order
        await db.execAsync('PRAGMA foreign_keys = OFF;');

        // 1. Teams
        for (const t of backup.teams) {
          await db.runAsync(
            `INSERT OR REPLACE INTO Teams (id, name, logo, country, organizationType, coach, contact, description, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [t.id, t.name, t.logo || 'shield', t.country, t.organizationType, t.coach || '', t.contact || '', t.description || '', t.createdAt, t.updatedAt]
          );
        }

        // 2. Players
        for (const p of backup.players) {
          await db.runAsync(
            `INSERT OR REPLACE INTO Players (id, teamId, name, jerseyNumber, position, age, photo, contact, availability, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.teamId, p.name, p.jerseyNumber, p.position, p.age, p.photo || '', p.contact || '', p.availability || 'Available', p.createdAt, p.updatedAt]
          );
        }

        // 3. Matches
        for (const m of backup.matches) {
          await db.runAsync(
            `INSERT OR REPLACE INTO Matches (
              id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
              matchDate, matchTime, venue, tournament, matchType, duration,
              halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
              winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
              currentHalf, notes, startedAt, completedAt, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              m.id,
              m.matchCode,
              m.teamAId,
              m.teamBId,
              m.teamASnapshot,
              m.teamBSnapshot,
              m.matchDate,
              m.matchTime,
              m.venue,
              m.tournament,
              m.matchType,
              m.duration,
              m.halvesCount,
              m.tossWinner,
              m.tossDecision,
              m.status,
              m.teamAScore,
              m.teamBScore,
              m.winner,
              m.playerOfTheMatch,
              m.timerSeconds,
              m.isTimerRunning,
              m.lastTimerUpdate,
              m.currentHalf,
              m.notes,
              m.startedAt,
              m.completedAt,
              m.createdAt,
            ]
          );
        }

        // 4. MatchEvents
        if (Array.isArray(backup.matchEvents)) {
          for (const e of backup.matchEvents) {
            await db.runAsync(
              `INSERT OR REPLACE INTO MatchEvents (
                id, matchId, teamId, playerId, teamNameSnapshot, playerNameSnapshot,
                eventType, points, matchTime, half, eventTimestamp, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                e.id,
                e.matchId,
                e.teamId,
                e.playerId,
                e.teamNameSnapshot,
                e.playerNameSnapshot,
                e.eventType,
                e.points,
                e.matchTime,
                e.half,
                e.eventTimestamp,
                e.notes,
              ]
            );
          }
        }

        // 5. MatchResults
        if (Array.isArray(backup.matchResults)) {
          for (const r of backup.matchResults) {
            await db.runAsync(
              `INSERT OR REPLACE INTO MatchResults (
                id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                r.id,
                r.matchId,
                r.finalScoreA,
                r.finalScoreB,
                r.winner,
                r.isDraw,
                r.playerOfTheMatch,
                r.statistics,
                r.completedAt,
              ]
            );
          }
        }

        await db.execAsync('PRAGMA foreign_keys = ON;');
      });

      return {
        success: true,
        restoredCounts: backup.metadata,
      };
    } catch (error: any) {
      console.error('Backup restore failed:', error);
      return { success: false, error: error.message || 'Error occurred while restoring database' };
    }
  },
};
