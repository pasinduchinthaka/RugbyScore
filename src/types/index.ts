export type OrganizationType =
  | 'Club'
  | 'University'
  | 'School'
  | 'National'
  | 'Regional'
  | 'Other';

export type PlayerPosition =
  | 'Loosehead Prop'
  | 'Hooker'
  | 'Tighthead Prop'
  | 'Lock 4'
  | 'Lock 5'
  | 'Blindside Flanker'
  | 'Openside Flanker'
  | 'Number 8'
  | 'Scrum-half'
  | 'Fly-half'
  | 'Left Wing'
  | 'Inside Centre'
  | 'Outside Centre'
  | 'Right Wing'
  | 'Full-back'
  | 'Forward'
  | 'Back'
  | 'Utility';

export type PlayerAvailability = 'Available' | 'Injured' | 'Suspended';

export interface Team {
  id: string;
  name: string;
  logo: string;
  country: string;
  organizationType: OrganizationType;
  coach: string;
  contact: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  playerCount?: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: PlayerPosition | string;
  age: number;
  photo: string;
  contact: string;
  availability: PlayerAvailability;
  createdAt: string;
  updatedAt: string;
  teamName?: string;
}

export type MatchType =
  | 'Friendly'
  | 'League'
  | 'Knockout'
  | 'Tournament'
  | 'School'
  | 'University'
  | 'Club'
  | 'Other';

export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE_FIRST_HALF'
  | 'HALF_TIME'
  | 'LIVE_SECOND_HALF'
  | 'EXTRA_TIME'
  | 'COMPLETED';

export type TossDecision = 'KICK_OFF' | 'CHOOSE_SIDE';

export type ScoringEventType =
  | 'TRY'
  | 'PENALTY_TRY'
  | 'CONVERSION'
  | 'MISSED_CONVERSION'
  | 'PENALTY_KICK'
  | 'DROP_GOAL';

export interface TeamSnapshot {
  id: string;
  name: string;
  logo: string;
  country: string;
  coach: string;
  organizationType: string;
}

export interface Match {
  id: string;
  matchCode: string;
  teamAId: string;
  teamBId: string;
  teamASnapshot: string; // JSON of TeamSnapshot
  teamBSnapshot: string; // JSON of TeamSnapshot
  matchDate: string; // YYYY-MM-DD
  matchTime: string; // HH:MM
  venue: string;
  tournament: string;
  matchType: MatchType;
  duration: number; // in minutes (default 80)
  halvesCount: number; // default 2
  tossWinner: string | null; // team id
  tossDecision: TossDecision | null;
  status: MatchStatus;
  teamAScore: number;
  teamBScore: number;
  winner: string | null; // team id or 'DRAW'
  playerOfTheMatch: string | null;
  timerSeconds: number; // current elapsed match seconds
  isTimerRunning: number; // 0 or 1
  lastTimerUpdate: number | null; // epoch timestamp ms
  currentHalf: number; // 1 or 2
  notes: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  // Parsed fields for convenience
  teamA?: TeamSnapshot;
  teamB?: TeamSnapshot;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  teamNameSnapshot: string;
  playerNameSnapshot: string;
  eventType: ScoringEventType;
  points: number;
  matchTime: number; // in seconds
  half: number;
  eventTimestamp: string;
  notes: string;
}

export interface MatchCategoryStats {
  tries: number;
  penaltyTries: number;
  conversions: number;
  missedConversions: number;
  penaltyKicks: number;
  dropGoals: number;
  totalPoints: number;
}

export interface MatchStatisticsSnapshot {
  teamA: MatchCategoryStats;
  teamB: MatchCategoryStats;
  playerScores: {
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    tries: number;
    penaltyTries: number;
    conversions: number;
    penaltyKicks: number;
    dropGoals: number;
    totalPoints: number;
  }[];
}

export interface MatchResult {
  id: string;
  matchId: string;
  finalScoreA: number;
  finalScoreB: number;
  winner: string;
  isDraw: number;
  playerOfTheMatch: string | null;
  statistics: string; // JSON of MatchStatisticsSnapshot
  completedAt: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  pointsScored: number;
  pointsConceded: number;
  pointDifference: number;
  highestScore: number;
  lowestScore: number;
}

export interface HeadToHeadStats {
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAPoints: number;
  teamBPoints: number;
  recentMatches: Match[];
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamName: string;
  matchesPlayed: number;
  tries: number;
  penaltyTries: number;
  conversions: number;
  penaltyKicks: number;
  dropGoals: number;
  totalPoints: number;
}

export interface FilterOptions {
  searchQuery?: string;
  teamId?: string;
  year?: string;
  tournament?: string;
  venue?: string;
  matchType?: string;
  winner?: string;
  isDraw?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface AppBackup {
  version: string;
  exportDate: string;
  metadata: {
    appName: string;
    teamsCount: number;
    playersCount: number;
    matchesCount: number;
    eventsCount: number;
    resultsCount: number;
  };
  teams: Team[];
  players: Player[];
  matches: Match[];
  matchEvents: MatchEvent[];
  matchResults: MatchResult[];
}
