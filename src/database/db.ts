import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const DB_NAME = 'rugbyscore.db';

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await initDatabase(dbInstance);
  return dbInstance;
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys and WAL mode for high performance and integrity
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create Teams Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      country TEXT,
      organizationType TEXT NOT NULL,
      coach TEXT,
      contact TEXT,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Create Players Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Players (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      name TEXT NOT NULL,
      jerseyNumber INTEGER NOT NULL,
      position TEXT NOT NULL,
      age INTEGER,
      photo TEXT,
      contact TEXT,
      availability TEXT NOT NULL DEFAULT 'Available',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES Teams(id) ON DELETE CASCADE
    );
  `);

  // Create Matches Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Matches (
      id TEXT PRIMARY KEY,
      matchCode TEXT NOT NULL UNIQUE,
      teamAId TEXT NOT NULL,
      teamBId TEXT NOT NULL,
      teamASnapshot TEXT NOT NULL,
      teamBSnapshot TEXT NOT NULL,
      matchDate TEXT NOT NULL,
      matchTime TEXT,
      venue TEXT,
      tournament TEXT,
      matchType TEXT NOT NULL DEFAULT 'Friendly',
      duration INTEGER NOT NULL DEFAULT 80,
      halvesCount INTEGER NOT NULL DEFAULT 2,
      tossWinner TEXT,
      tossDecision TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      teamAScore INTEGER NOT NULL DEFAULT 0,
      teamBScore INTEGER NOT NULL DEFAULT 0,
      winner TEXT,
      playerOfTheMatch TEXT,
      timerSeconds INTEGER NOT NULL DEFAULT 0,
      isTimerRunning INTEGER NOT NULL DEFAULT 0,
      lastTimerUpdate INTEGER,
      currentHalf INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      startedAt TEXT,
      completedAt TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  // Create MatchEvents Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS MatchEvents (
      id TEXT PRIMARY KEY,
      matchId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      playerId TEXT,
      teamNameSnapshot TEXT NOT NULL,
      playerNameSnapshot TEXT NOT NULL,
      eventType TEXT NOT NULL,
      points INTEGER NOT NULL,
      matchTime INTEGER NOT NULL,
      half INTEGER NOT NULL,
      eventTimestamp TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (matchId) REFERENCES Matches(id) ON DELETE CASCADE
    );
  `);

  // Create MatchResults Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS MatchResults (
      id TEXT PRIMARY KEY,
      matchId TEXT NOT NULL UNIQUE,
      finalScoreA INTEGER NOT NULL,
      finalScoreB INTEGER NOT NULL,
      winner TEXT NOT NULL,
      isDraw INTEGER NOT NULL DEFAULT 0,
      playerOfTheMatch TEXT,
      statistics TEXT NOT NULL,
      completedAt TEXT NOT NULL,
      FOREIGN KEY (matchId) REFERENCES Matches(id) ON DELETE CASCADE
    );
  `);

  // Create Indexes for Historical Queries and Fast Performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_matches_date ON Matches(matchDate);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON Matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament ON Matches(tournament);
    CREATE INDEX IF NOT EXISTS idx_matches_venue ON Matches(venue);
    CREATE INDEX IF NOT EXISTS idx_matches_teamA ON Matches(teamAId);
    CREATE INDEX IF NOT EXISTS idx_matches_teamB ON Matches(teamBId);
    CREATE INDEX IF NOT EXISTS idx_players_teamId ON Players(teamId);
    CREATE INDEX IF NOT EXISTS idx_events_matchId ON MatchEvents(matchId);
    CREATE INDEX IF NOT EXISTS idx_events_teamId ON MatchEvents(teamId);
    CREATE INDEX IF NOT EXISTS idx_events_playerId ON MatchEvents(playerId);
    CREATE INDEX IF NOT EXISTS idx_results_matchId ON MatchResults(matchId);
  `);
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS MatchResults;
    DROP TABLE IF EXISTS MatchEvents;
    DROP TABLE IF EXISTS Matches;
    DROP TABLE IF EXISTS Players;
    DROP TABLE IF EXISTS Teams;
    PRAGMA foreign_keys = ON;
  `);
  await initDatabase(db);
}
