import { getDatabase } from './db';
import { Team, Player, Match, MatchEvent, MatchResult, MatchStatisticsSnapshot } from '../types';

export const SAMPLE_TEAM_IDS = {
  WARRIORS: 'sample_team_warriors',
  TITANS: 'sample_team_titans',
  STORMERS: 'sample_team_stormers',
  RHINOS: 'sample_team_rhinos',
};

export async function hasExistingData(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM Teams`);
  return (row?.count || 0) > 0;
}

export async function seedSampleData(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // 1. Teams
  const teams: Team[] = [
    {
      id: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Apex Warriors RFC',
      logo: 'shield-alt',
      country: 'New Zealand',
      organizationType: 'Club',
      coach: 'David Vance',
      contact: 'contact@apexwarriors.org',
      description: 'Premier independent club known for relentless forward drives and open play.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SAMPLE_TEAM_IDS.TITANS,
      name: 'Highland Titans Rugby',
      logo: 'crown',
      country: 'Scotland',
      organizationType: 'Regional',
      coach: 'Alistair Ross',
      contact: 'info@highlandtitans.co.uk',
      description: 'Regional championship contenders with dominant set pieces and robust scrummaging.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Pacific Stormers',
      logo: 'bolt',
      country: 'Fiji',
      organizationType: 'National',
      coach: 'Mateo Koro',
      contact: 'management@pacificstormers.fj',
      description: 'High-tempo dynamic rugby team famous for rapid backline offloads and flair.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Metro Rhinos Rugby',
      logo: 'shield',
      country: 'England',
      organizationType: 'University',
      coach: 'Oliver Bennett',
      contact: 'rugby@metrouniv.ac.uk',
      description: 'Collegiate rugby powerhouse known for clinical kicking and solid defensive lines.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const t of teams) {
    await db.runAsync(
      `INSERT OR REPLACE INTO Teams (id, name, logo, country, organizationType, coach, contact, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.name, t.logo, t.country, t.organizationType, t.coach, t.contact, t.description, t.createdAt, t.updatedAt]
    );
  }

  // 2. Players (5 per team)
  const players: Player[] = [
    // Apex Warriors
    {
      id: 'sample_p_w1',
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Kieran Vance',
      jerseyNumber: 1,
      position: 'Loosehead Prop',
      age: 26,
      photo: '',
      contact: '+64 21 0001',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_w2',
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Liam Te Kawa',
      jerseyNumber: 2,
      position: 'Hooker',
      age: 24,
      photo: '',
      contact: '+64 21 0002',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_w3',
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Marcus Brody',
      jerseyNumber: 4,
      position: 'Lock 4',
      age: 28,
      photo: '',
      contact: '+64 21 0003',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_w4',
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Ethan Cole',
      jerseyNumber: 10,
      position: 'Fly-half',
      age: 25,
      photo: '',
      contact: '+64 21 0004',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_w5',
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      name: 'Zane Campbell',
      jerseyNumber: 15,
      position: 'Full-back',
      age: 23,
      photo: '',
      contact: '+64 21 0005',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },

    // Highland Titans
    {
      id: 'sample_p_t1',
      teamId: SAMPLE_TEAM_IDS.TITANS,
      name: 'Callum MacLeod',
      jerseyNumber: 1,
      position: 'Loosehead Prop',
      age: 27,
      photo: '',
      contact: '+44 77 1001',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_t2',
      teamId: SAMPLE_TEAM_IDS.TITANS,
      name: 'Hamish Stewart',
      jerseyNumber: 2,
      position: 'Hooker',
      age: 29,
      photo: '',
      contact: '+44 77 1002',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_t3',
      teamId: SAMPLE_TEAM_IDS.TITANS,
      name: 'Euan Campbell',
      jerseyNumber: 5,
      position: 'Lock 5',
      age: 30,
      photo: '',
      contact: '+44 77 1003',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_t4',
      teamId: SAMPLE_TEAM_IDS.TITANS,
      name: 'Gregor Fraser',
      jerseyNumber: 10,
      position: 'Fly-half',
      age: 24,
      photo: '',
      contact: '+44 77 1004',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_t5',
      teamId: SAMPLE_TEAM_IDS.TITANS,
      name: 'Rory Sinclair',
      jerseyNumber: 11,
      position: 'Left Wing',
      age: 22,
      photo: '',
      contact: '+44 77 1005',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },

    // Pacific Stormers
    {
      id: 'sample_p_s1',
      teamId: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Jone Radrodro',
      jerseyNumber: 3,
      position: 'Tighthead Prop',
      age: 27,
      photo: '',
      contact: '+679 99 0001',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_s2',
      teamId: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Vilimoni Botitu',
      jerseyNumber: 7,
      position: 'Openside Flanker',
      age: 25,
      photo: '',
      contact: '+679 99 0002',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_s3',
      teamId: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Simione Kuru',
      jerseyNumber: 9,
      position: 'Scrum-half',
      age: 23,
      photo: '',
      contact: '+679 99 0003',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_s4',
      teamId: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Waisea Nayacalevu',
      jerseyNumber: 13,
      position: 'Outside Centre',
      age: 28,
      photo: '',
      contact: '+679 99 0004',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_s5',
      teamId: SAMPLE_TEAM_IDS.STORMERS,
      name: 'Savenaca Rawaca',
      jerseyNumber: 14,
      position: 'Right Wing',
      age: 26,
      photo: '',
      contact: '+679 99 0005',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },

    // Metro Rhinos
    {
      id: 'sample_p_r1',
      teamId: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Edward Hastings',
      jerseyNumber: 1,
      position: 'Loosehead Prop',
      age: 21,
      photo: '',
      contact: '+44 78 2001',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_r2',
      teamId: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Toby Wright',
      jerseyNumber: 8,
      position: 'Number 8',
      age: 22,
      photo: '',
      contact: '+44 78 2002',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_r3',
      teamId: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Harry Sterling',
      jerseyNumber: 10,
      position: 'Fly-half',
      age: 21,
      photo: '',
      contact: '+44 78 2003',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_r4',
      teamId: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Arthur Pendelton',
      jerseyNumber: 12,
      position: 'Inside Centre',
      age: 20,
      photo: '',
      contact: '+44 78 2004',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample_p_r5',
      teamId: SAMPLE_TEAM_IDS.RHINOS,
      name: 'Benjamin Croft',
      jerseyNumber: 15,
      position: 'Full-back',
      age: 22,
      photo: '',
      contact: '+44 78 2005',
      availability: 'Available',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const p of players) {
    await db.runAsync(
      `INSERT OR REPLACE INTO Players (id, teamId, name, jerseyNumber, position, age, photo, contact, availability, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.teamId, p.name, p.jerseyNumber, p.position, p.age, p.photo, p.contact, p.availability, p.createdAt, p.updatedAt]
    );
  }

  // 3. Historical Matches
  // Match 1: Apex Warriors (29) vs Highland Titans (17)
  const m1Id = 'sample_match_001';
  const m1SnapA = JSON.stringify({
    id: SAMPLE_TEAM_IDS.WARRIORS,
    name: 'Apex Warriors RFC',
    logo: 'shield-alt',
    country: 'New Zealand',
    coach: 'David Vance',
    organizationType: 'Club',
  });
  const m1SnapB = JSON.stringify({
    id: SAMPLE_TEAM_IDS.TITANS,
    name: 'Highland Titans Rugby',
    logo: 'crown',
    country: 'Scotland',
    coach: 'Alistair Ross',
    organizationType: 'Regional',
  });

  await db.runAsync(
    `INSERT OR REPLACE INTO Matches (
      id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
      matchDate, matchTime, venue, tournament, matchType, duration,
      halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
      winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
      currentHalf, notes, startedAt, completedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m1Id,
      'RUG-2026-001',
      SAMPLE_TEAM_IDS.WARRIORS,
      SAMPLE_TEAM_IDS.TITANS,
      m1SnapA,
      m1SnapB,
      '2026-04-10',
      '15:00',
      'National Arena',
      'Global Rugby Challenge',
      'Tournament',
      80,
      2,
      SAMPLE_TEAM_IDS.WARRIORS,
      'KICK_OFF',
      'COMPLETED',
      29,
      17,
      SAMPLE_TEAM_IDS.WARRIORS,
      'Ethan Cole',
      4800,
      0,
      null,
      2,
      'Fast-paced opening tournament game with high intensity.',
      '2026-04-10T15:00:00.000Z',
      '2026-04-10T16:50:00.000Z',
      now,
    ]
  );

  // Events for Match 1
  const m1Events = [
    {
      id: 'm1_e1',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'TRY',
      points: 5,
      matchTime: 720, // 12th min
      half: 1,
      notes: 'Breakaway try after scrum turnover',
    },
    {
      id: 'm1_e2',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'CONVERSION',
      points: 2,
      matchTime: 780,
      half: 1,
      notes: 'Clean kick from 25m',
    },
    {
      id: 'm1_e3',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.TITANS,
      playerId: 'sample_p_t4',
      teamNameSnapshot: 'Highland Titans Rugby',
      playerNameSnapshot: '#10 Gregor Fraser',
      eventType: 'PENALTY_KICK',
      points: 3,
      matchTime: 1200,
      half: 1,
      notes: 'Offside infringement penalty',
    },
    {
      id: 'm1_e4',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.TITANS,
      playerId: 'sample_p_t2',
      teamNameSnapshot: 'Highland Titans Rugby',
      playerNameSnapshot: '#2 Hamish Stewart',
      eventType: 'TRY',
      points: 5,
      matchTime: 1800,
      half: 1,
      notes: 'Rolling maul push over',
    },
    {
      id: 'm1_e5',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.TITANS,
      playerId: 'sample_p_t4',
      teamNameSnapshot: 'Highland Titans Rugby',
      playerNameSnapshot: '#10 Gregor Fraser',
      eventType: 'CONVERSION',
      points: 2,
      matchTime: 1860,
      half: 1,
      notes: 'Converted from sideline',
    },
    {
      id: 'm1_e6',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w5',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#15 Zane Campbell',
      eventType: 'TRY',
      points: 5,
      matchTime: 2280,
      half: 1,
      notes: 'Corner flag dive in',
    },
    {
      id: 'm1_e7',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'CONVERSION',
      points: 2,
      matchTime: 2340,
      half: 1,
      notes: 'Converted',
    },
    {
      id: 'm1_e8',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w2',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#2 Liam Te Kawa',
      eventType: 'TRY',
      points: 5,
      matchTime: 3100,
      half: 2,
      notes: 'Pick and go dive over',
    },
    {
      id: 'm1_e9',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'MISSED_CONVERSION',
      points: 0,
      matchTime: 3160,
      half: 2,
      notes: 'Struck the left upright',
    },
    {
      id: 'm1_e10',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'DROP_GOAL',
      points: 3,
      matchTime: 3900,
      half: 2,
      notes: 'Crisp drop goal in open play',
    },
    {
      id: 'm1_e11',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.WARRIORS,
      playerId: 'sample_p_w4',
      teamNameSnapshot: 'Apex Warriors RFC',
      playerNameSnapshot: '#10 Ethan Cole',
      eventType: 'PENALTY_KICK',
      points: 3,
      matchTime: 4200,
      half: 2,
      notes: 'Long range penalty kick',
    },
    {
      id: 'm1_e12',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.TITANS,
      playerId: 'sample_p_t5',
      teamNameSnapshot: 'Highland Titans Rugby',
      playerNameSnapshot: '#11 Rory Sinclair',
      eventType: 'TRY',
      points: 5,
      matchTime: 4600,
      half: 2,
      notes: 'Consolation try down wing',
    },
    {
      id: 'm1_e13',
      matchId: m1Id,
      teamId: SAMPLE_TEAM_IDS.TITANS,
      playerId: 'sample_p_t4',
      teamNameSnapshot: 'Highland Titans Rugby',
      playerNameSnapshot: '#10 Gregor Fraser',
      eventType: 'CONVERSION',
      points: 2,
      matchTime: 4660,
      half: 2,
      notes: 'Quick drop conversion',
    },
  ];

  for (const e of m1Events) {
    await db.runAsync(
      `INSERT OR REPLACE INTO MatchEvents (id, matchId, teamId, playerId, teamNameSnapshot, playerNameSnapshot, eventType, points, matchTime, half, eventTimestamp, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.matchId, e.teamId, e.playerId, e.teamNameSnapshot, e.playerNameSnapshot, e.eventType, e.points, e.matchTime, e.half, now, e.notes]
    );
  }

  // Result for Match 1
  const m1Stats: MatchStatisticsSnapshot = {
    teamA: { tries: 3, penaltyTries: 0, conversions: 2, missedConversions: 1, penaltyKicks: 1, dropGoals: 1, totalPoints: 29 },
    teamB: { tries: 2, penaltyTries: 0, conversions: 2, missedConversions: 0, penaltyKicks: 1, dropGoals: 0, totalPoints: 17 },
    playerScores: [
      { playerId: 'sample_p_w4', playerName: '#10 Ethan Cole', teamId: SAMPLE_TEAM_IDS.WARRIORS, teamName: 'Apex Warriors RFC', tries: 1, penaltyTries: 0, conversions: 2, penaltyKicks: 1, dropGoals: 1, totalPoints: 17 },
      { playerId: 'sample_p_w5', playerName: '#15 Zane Campbell', teamId: SAMPLE_TEAM_IDS.WARRIORS, teamName: 'Apex Warriors RFC', tries: 1, penaltyTries: 0, conversions: 0, penaltyKicks: 0, dropGoals: 0, totalPoints: 5 },
      { playerId: 'sample_p_w2', playerName: '#2 Liam Te Kawa', teamId: SAMPLE_TEAM_IDS.WARRIORS, teamName: 'Apex Warriors RFC', tries: 1, penaltyTries: 0, conversions: 0, penaltyKicks: 0, dropGoals: 0, totalPoints: 5 },
      { playerId: 'sample_p_t4', playerName: '#10 Gregor Fraser', teamId: SAMPLE_TEAM_IDS.TITANS, teamName: 'Highland Titans Rugby', tries: 0, penaltyTries: 0, conversions: 2, penaltyKicks: 1, dropGoals: 0, totalPoints: 7 },
      { playerId: 'sample_p_t2', playerName: '#2 Hamish Stewart', teamId: SAMPLE_TEAM_IDS.TITANS, teamName: 'Highland Titans Rugby', tries: 1, penaltyTries: 0, conversions: 0, penaltyKicks: 0, dropGoals: 0, totalPoints: 5 },
      { playerId: 'sample_p_t5', playerName: '#11 Rory Sinclair', teamId: SAMPLE_TEAM_IDS.TITANS, teamName: 'Highland Titans Rugby', tries: 1, penaltyTries: 0, conversions: 0, penaltyKicks: 0, dropGoals: 0, totalPoints: 5 },
    ],
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO MatchResults (id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['res_001', m1Id, 29, 17, SAMPLE_TEAM_IDS.WARRIORS, 0, '#10 Ethan Cole', JSON.stringify(m1Stats), '2026-04-10T16:50:00.000Z']
  );

  // Match 2: Pacific Stormers (34) vs Metro Rhinos (24)
  const m2Id = 'sample_match_002';
  const m2SnapA = JSON.stringify({ id: SAMPLE_TEAM_IDS.STORMERS, name: 'Pacific Stormers', logo: 'bolt', country: 'Fiji', coach: 'Mateo Koro', organizationType: 'National' });
  const m2SnapB = JSON.stringify({ id: SAMPLE_TEAM_IDS.RHINOS, name: 'Metro Rhinos Rugby', logo: 'shield', country: 'England', coach: 'Oliver Bennett', organizationType: 'University' });

  await db.runAsync(
    `INSERT OR REPLACE INTO Matches (
      id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
      matchDate, matchTime, venue, tournament, matchType, duration,
      halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
      winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
      currentHalf, notes, startedAt, completedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m2Id,
      'RUG-2026-002',
      SAMPLE_TEAM_IDS.STORMERS,
      SAMPLE_TEAM_IDS.RHINOS,
      m2SnapA,
      m2SnapB,
      '2026-04-17',
      '17:30',
      'Oceania Stadium',
      'International Rugby Series',
      'Knockout',
      80,
      2,
      SAMPLE_TEAM_IDS.STORMERS,
      'CHOOSE_SIDE',
      'COMPLETED',
      34,
      24,
      SAMPLE_TEAM_IDS.STORMERS,
      'Waisea Nayacalevu',
      4800,
      0,
      null,
      2,
      'Electrifying rugby with rapid tries from both wings.',
      '2026-04-17T17:30:00.000Z',
      '2026-04-17T19:20:00.000Z',
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO MatchResults (id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['res_002', m2Id, 34, 24, SAMPLE_TEAM_IDS.STORMERS, 0, '#13 Waisea Nayacalevu', JSON.stringify({
      teamA: { tries: 4, penaltyTries: 1, conversions: 2, missedConversions: 2, penaltyKicks: 1, dropGoals: 0, totalPoints: 34 },
      teamB: { tries: 3, penaltyTries: 0, conversions: 3, missedConversions: 0, penaltyKicks: 1, dropGoals: 0, totalPoints: 24 },
      playerScores: [],
    }), '2026-04-17T19:20:00.000Z']
  );

  // Match 3: Apex Warriors (22) vs Pacific Stormers (22) - Thrilling DRAW!
  const m3Id = 'sample_match_003';
  await db.runAsync(
    `INSERT OR REPLACE INTO Matches (
      id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
      matchDate, matchTime, venue, tournament, matchType, duration,
      halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
      winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
      currentHalf, notes, startedAt, completedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m3Id,
      'RUG-2026-003',
      SAMPLE_TEAM_IDS.WARRIORS,
      SAMPLE_TEAM_IDS.STORMERS,
      m1SnapA,
      m2SnapA,
      '2026-05-02',
      '16:00',
      'Pacific Bowl',
      'Pacific Cup',
      'League',
      80,
      2,
      SAMPLE_TEAM_IDS.STORMERS,
      'KICK_OFF',
      'COMPLETED',
      22,
      22,
      'DRAW',
      'Zane Campbell',
      4800,
      0,
      null,
      2,
      'Nail-biting encounter ending in a well-earned deadlock.',
      '2026-05-02T16:00:00.000Z',
      '2026-05-02T17:50:00.000Z',
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO MatchResults (id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['res_003', m3Id, 22, 22, 'DRAW', 1, '#15 Zane Campbell', JSON.stringify({
      teamA: { tries: 2, penaltyTries: 0, conversions: 2, missedConversions: 0, penaltyKicks: 2, dropGoals: 0, totalPoints: 22 },
      teamB: { tries: 2, penaltyTries: 0, conversions: 2, missedConversions: 0, penaltyKicks: 2, dropGoals: 0, totalPoints: 22 },
      playerScores: [],
    }), '2026-05-02T17:50:00.000Z']
  );

  // Match 4: Highland Titans (18) vs Metro Rhinos (15)
  const m4Id = 'sample_match_004';
  await db.runAsync(
    `INSERT OR REPLACE INTO Matches (
      id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
      matchDate, matchTime, venue, tournament, matchType, duration,
      halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
      winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
      currentHalf, notes, startedAt, completedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m4Id,
      'RUG-2026-004',
      SAMPLE_TEAM_IDS.TITANS,
      SAMPLE_TEAM_IDS.RHINOS,
      m1SnapB,
      m2SnapB,
      '2026-05-15',
      '14:00',
      'Highland Park',
      'Northern Cup',
      'Friendly',
      80,
      2,
      SAMPLE_TEAM_IDS.TITANS,
      'CHOOSE_SIDE',
      'COMPLETED',
      18,
      15,
      SAMPLE_TEAM_IDS.TITANS,
      'Hamish Stewart',
      4800,
      0,
      null,
      2,
      'Defensive arm wrestle decided by tactical penalty kicks.',
      '2026-05-15T14:00:00.000Z',
      '2026-05-15T15:45:00.000Z',
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR REPLACE INTO MatchResults (id, matchId, finalScoreA, finalScoreB, winner, isDraw, playerOfTheMatch, statistics, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['res_004', m4Id, 18, 15, SAMPLE_TEAM_IDS.TITANS, 0, '#2 Hamish Stewart', JSON.stringify({
      teamA: { tries: 1, penaltyTries: 0, conversions: 1, missedConversions: 0, penaltyKicks: 3, dropGoals: 1, totalPoints: 18 },
      teamB: { tries: 2, penaltyTries: 0, conversions: 1, missedConversions: 1, penaltyKicks: 1, dropGoals: 0, totalPoints: 15 },
      playerScores: [],
    }), '2026-05-15T15:45:00.000Z']
  );

  // Match 5: Apex Warriors vs Metro Rhinos (Upcoming / Ready to score live!)
  const m5Id = 'sample_match_005';
  await db.runAsync(
    `INSERT OR REPLACE INTO Matches (
      id, matchCode, teamAId, teamBId, teamASnapshot, teamBSnapshot,
      matchDate, matchTime, venue, tournament, matchType, duration,
      halvesCount, tossWinner, tossDecision, status, teamAScore, teamBScore,
      winner, playerOfTheMatch, timerSeconds, isTimerRunning, lastTimerUpdate,
      currentHalf, notes, startedAt, completedAt, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m5Id,
      'RUG-2026-005',
      SAMPLE_TEAM_IDS.WARRIORS,
      SAMPLE_TEAM_IDS.RHINOS,
      m1SnapA,
      m2SnapB,
      '2026-06-01',
      '15:30',
      'Grand Union Park',
      'Championship Final',
      'Knockout',
      80,
      2,
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
      'Upcoming championship clash. Ready for Toss and Live Scoring.',
      null,
      null,
      now,
    ]
  );
}

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM MatchResults;
    DELETE FROM MatchEvents;
    DELETE FROM Matches;
    DELETE FROM Players;
    DELETE FROM Teams;
    PRAGMA foreign_keys = ON;
  `);
}
