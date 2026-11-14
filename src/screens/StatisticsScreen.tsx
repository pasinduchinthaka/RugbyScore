import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, StatBox, EmptyState } from '../components/common';
import { StatsRepository } from '../database/statsRepository';
import { TeamRepository } from '../database/teamRepository';
import { TeamStats, HeadToHeadStats, PlayerStats, Team } from '../types';

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'teams' | 'h2h' | 'players'>('teams');

  // Teams Table
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);

  // Head-to-Head
  const [teams, setTeams] = useState<Team[]>([]);
  const [h2hTeamAId, setH2hTeamAId] = useState<string>('');
  const [h2hTeamBId, setH2hTeamBId] = useState<string>('');
  const [h2hStats, setH2hStats] = useState<HeadToHeadStats | null>(null);

  // Top Scorers
  const [topScorers, setTopScorers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [tStats, tList, scorers] = await Promise.all([
        StatsRepository.getAllTeamStats(),
        TeamRepository.getAllTeams(),
        StatsRepository.getTopScorers(30),
      ]);
      setTeamStats(tStats);
      setTeams(tList);
      setTopScorers(scorers);

      if (tList.length >= 2) {
        const idA = h2hTeamAId || tList[0].id;
        const idB = h2hTeamBId || tList[1].id;
        setH2hTeamAId(idA);
        setH2hTeamBId(idB);
        const h2h = await StatsRepository.getHeadToHead(idA, idB);
        setH2hStats(h2h);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const updateH2H = async (teamA: string, teamB: string) => {
    setH2hTeamAId(teamA);
    setH2hTeamBId(teamB);
    if (teamA && teamB) {
      const h2h = await StatsRepository.getHeadToHead(teamA, teamB);
      setH2hStats(h2h);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Rugby Analytics & Records"
        subtitle="Dynamic stats calculated from SQLite"
      />

      {/* Segmented Tab Controls */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'teams' && styles.activeTabBtn]}
          onPress={() => setActiveTab('teams')}
        >
          <Ionicons
            name="podium-outline"
            size={16}
            color={activeTab === 'teams' ? Colors.accentGold : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'teams' && styles.activeTabBtnText]}>
            Team Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'h2h' && styles.activeTabBtn]}
          onPress={() => setActiveTab('h2h')}
        >
          <Ionicons
            name="git-compare-outline"
            size={16}
            color={activeTab === 'h2h' ? Colors.accentGold : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'h2h' && styles.activeTabBtnText]}>
            Head-to-Head
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'players' && styles.activeTabBtn]}
          onPress={() => setActiveTab('players')}
        >
          <Ionicons
            name="football-outline"
            size={16}
            color={activeTab === 'players' ? Colors.accentGold : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'players' && styles.activeTabBtnText]}>
            Top Scorers
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tab 1: Team Standings Table */}
        {activeTab === 'teams' && (
          <View>
            <Card style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.posHeader}>#</Text>
                <Text style={styles.teamHeader}>TEAM</Text>
                <Text style={styles.statHeader}>P</Text>
                <Text style={styles.statHeader}>W</Text>
                <Text style={styles.statHeader}>L</Text>
                <Text style={styles.statHeader}>D</Text>
                <Text style={styles.statHeader}>DIFF</Text>
                <Text style={[styles.statHeader, styles.boldCol]}>PTS</Text>
              </View>

              {teamStats.length === 0 ? (
                <EmptyState
                  icon="podium-outline"
                  title="No Team Stats"
                  description="Record completed matches to see dynamic team rankings."
                />
              ) : (
                teamStats.map((t, idx) => (
                  <TouchableOpacity
                    key={t.teamId}
                    style={styles.tableRow}
                    onPress={() => navigation.navigate('TeamDetail', { teamId: t.teamId })}
                  >
                    <Text style={styles.posCell}>{idx + 1}</Text>
                    <View style={styles.teamCell}>
                      <Text style={[Typography.h4, styles.teamNameText]} numberOfLines={1}>
                        {t.teamName}
                      </Text>
                      <Text style={Typography.caption}>Win: {t.winPercentage}%</Text>
                    </View>
                    <Text style={styles.statCell}>{t.matchesPlayed}</Text>
                    <Text style={styles.statCell}>{t.wins}</Text>
                    <Text style={styles.statCell}>{t.losses}</Text>
                    <Text style={styles.statCell}>{t.draws}</Text>
                    <Text
                      style={[
                        styles.statCell,
                        { color: t.pointDifference >= 0 ? Colors.primaryLight : Colors.danger },
                      ]}
                    >
                      {t.pointDifference >= 0 ? `+${t.pointDifference}` : t.pointDifference}
                    </Text>
                    <Text style={[styles.statCell, styles.boldPtsCell]}>
                      {t.pointsScored}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </Card>
          </View>
        )}

        {/* Tab 2: Head to Head Comparison */}
        {activeTab === 'h2h' && (
          <View>
            {/* Team Pickers */}
            <Card style={styles.h2hPickersCard}>
              <Text style={[Typography.caption, styles.pickerLabel]}>COMPARE TWO TEAMS</Text>
              <View style={styles.pickerRow}>
                {/* Team 1 Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {teams.map((t) => {
                    const isSelected = h2hTeamAId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.h2hChip, isSelected && styles.h2hActiveChipA]}
                        onPress={() => updateH2H(t.id, h2hTeamBId)}
                      >
                        <Text style={[styles.h2hChipText, isSelected && styles.activeChipText]}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.pickerVs}>
                <Text style={styles.pickerVsText}>VS</Text>
              </View>

              <View style={styles.pickerRow}>
                {/* Team 2 Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {teams.map((t) => {
                    const isSelected = h2hTeamBId === t.id;
                    const isSame = h2hTeamAId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.h2hChip,
                          isSelected && styles.h2hActiveChipB,
                          isSame && { opacity: 0.3 },
                        ]}
                        disabled={isSame}
                        onPress={() => updateH2H(h2hTeamAId, t.id)}
                      >
                        <Text style={[styles.h2hChipText, isSelected && styles.activeChipText]}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Card>

            {/* H2H Breakdown Card */}
            {h2hStats ? (
              <Card style={styles.h2hSummaryCard}>
                <View style={styles.h2hHeaderRow}>
                  <Text style={[Typography.h3, { color: Colors.scoreTeamA, flex: 1 }]}>
                    {h2hStats.teamAName}
                  </Text>
                  <Text style={styles.h2hVsTitle}>VS</Text>
                  <Text
                    style={[
                      Typography.h3,
                      { color: Colors.scoreTeamB, flex: 1, textAlign: 'right' },
                    ]}
                  >
                    {h2hStats.teamBName}
                  </Text>
                </View>

                {/* Big Wins Comparison */}
                <View style={styles.h2hScoreRow}>
                  <View style={styles.h2hWinCol}>
                    <Text style={[Typography.scoreLarge, { color: Colors.scoreTeamA }]}>
                      {h2hStats.teamAWins}
                    </Text>
                    <Text style={Typography.caption}>WINS</Text>
                  </View>

                  <View style={styles.h2hDrawCol}>
                    <Text style={[Typography.scoreLarge, { color: Colors.accentPurple }]}>
                      {h2hStats.draws}
                    </Text>
                    <Text style={Typography.caption}>DRAWS</Text>
                  </View>

                  <View style={[styles.h2hWinCol, { alignItems: 'flex-end' }]}>
                    <Text style={[Typography.scoreLarge, { color: Colors.scoreTeamB }]}>
                      {h2hStats.teamBWins}
                    </Text>
                    <Text style={Typography.caption}>WINS</Text>
                  </View>
                </View>

                {/* Comparison Stats */}
                <View style={styles.h2hDetailRow}>
                  <Text style={styles.h2hStatVal}>{h2hStats.teamAPoints}</Text>
                  <Text style={styles.h2hStatLabel}>TOTAL POINTS SCORED</Text>
                  <Text style={[styles.h2hStatVal, styles.alignRight]}>
                    {h2hStats.teamBPoints}
                  </Text>
                </View>

                <View style={styles.h2hDetailRow}>
                  <Text style={styles.h2hStatVal}>{h2hStats.totalMatches}</Text>
                  <Text style={styles.h2hStatLabel}>TOTAL MATCHES PLAYED</Text>
                  <Text style={[styles.h2hStatVal, styles.alignRight]}>
                    {h2hStats.totalMatches}
                  </Text>
                </View>

                {/* Recent Encounters */}
                {h2hStats.recentMatches.length > 0 && (
                  <View style={styles.h2hRecentSection}>
                    <Text style={[Typography.h4, styles.recentTitle]}>
                      Past Encounters ({h2hStats.recentMatches.length})
                    </Text>
                    {h2hStats.recentMatches.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.pastMatchRow}
                        onPress={() =>
                          navigation.navigate('HistoricalMatchReport', { matchId: m.id })
                        }
                      >
                        <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                          {m.matchDate}
                        </Text>
                        <Text style={[Typography.h4, styles.pastScoreText]}>
                          {m.teamAScore} - {m.teamBScore}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Card>
            ) : null}
          </View>
        )}

        {/* Tab 3: Top Scorers Leaderboard */}
        {activeTab === 'players' && (
          <View>
            <Card style={styles.tableCard}>
              <View style={styles.scorerHeaderRow}>
                <Text style={styles.posHeader}>#</Text>
                <Text style={styles.scorerNameHeader}>PLAYER</Text>
                <Text style={styles.statHeader}>TRY</Text>
                <Text style={styles.statHeader}>CONV</Text>
                <Text style={styles.statHeader}>PEN</Text>
                <Text style={styles.statHeader}>DG</Text>
                <Text style={[styles.statHeader, styles.boldCol]}>PTS</Text>
              </View>

              {topScorers.length === 0 ? (
                <EmptyState
                  icon="football-outline"
                  title="No Scorers Recorded"
                  description="Scoring events in live matches will dynamically rank players here."
                />
              ) : (
                topScorers.map((p, idx) => (
                  <TouchableOpacity
                    key={p.playerId}
                    style={styles.tableRow}
                    onPress={() =>
                      navigation.navigate('PlayerDetail', { playerId: p.playerId })
                    }
                  >
                    <Text style={styles.posCell}>{idx + 1}</Text>
                    <View style={styles.teamCell}>
                      <Text style={[Typography.h4, styles.teamNameText]} numberOfLines={1}>
                        {p.playerName}
                      </Text>
                      <Text style={Typography.caption}>{p.teamName}</Text>
                    </View>
                    <Text style={styles.statCell}>{p.tries}</Text>
                    <Text style={styles.statCell}>{p.conversions}</Text>
                    <Text style={styles.statCell}>{p.penaltyKicks}</Text>
                    <Text style={styles.statCell}>{p.dropGoals}</Text>
                    <Text style={[styles.statCell, styles.boldPtsCell]}>
                      {p.totalPoints}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.screenPadding,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeTabBtnText: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  tableCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  posHeader: {
    width: 24,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  teamHeader: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scorerNameHeader: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  statHeader: {
    width: 32,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  boldCol: {
    color: Colors.accentGold,
    fontWeight: '900',
    width: 38,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  posCell: {
    width: 24,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  teamCell: {
    flex: 1,
  },
  teamNameText: {
    fontSize: 13,
  },
  statCell: {
    width: 32,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  boldPtsCell: {
    width: 38,
    fontWeight: '900',
    color: Colors.accentGold,
    fontSize: 14,
  },
  h2hPickersCard: {
    marginBottom: Spacing.md,
  },
  pickerLabel: {
    marginBottom: 6,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  pickerRow: {
    marginVertical: 4,
  },
  h2hChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  h2hActiveChipA: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  h2hActiveChipB: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  h2hChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: Colors.white,
    fontWeight: '800',
  },
  pickerVs: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pickerVsText: {
    color: Colors.accentGold,
    fontWeight: '900',
    fontSize: 12,
  },
  h2hSummaryCard: {
    marginBottom: Spacing.md,
  },
  h2hHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  h2hVsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textMuted,
    paddingHorizontal: 8,
  },
  h2hScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  h2hWinCol: {
    alignItems: 'flex-start',
  },
  h2hDrawCol: {
    alignItems: 'center',
  },
  h2hDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  h2hStatVal: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  h2hStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  alignRight: {
    textAlign: 'right',
  },
  h2hRecentSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recentTitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  pastMatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  pastScoreText: {
    color: Colors.accentGold,
  },
  scorerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
