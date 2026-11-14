import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Badge, Button, ConfirmDialog } from '../components/common';
import { MatchRepository } from '../database/matchRepository';
import {
  Match,
  MatchResult,
  MatchEvent,
  MatchStatisticsSnapshot,
} from '../types';

export const HistoricalMatchReportScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [parsedStats, setParsedStats] = useState<MatchStatisticsSnapshot | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    loadHistoricalData();
  }, [matchId]);

  const handleDeleteMatch = async () => {
    try {
      setDeleteConfirmVisible(false);
      await MatchRepository.deleteMatch(matchId);
      Alert.alert('Match Deleted', 'Historical match record deleted successfully.');
      navigation.navigate('MainTabs', { screen: 'History' });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete match');
    }
  };

  const loadHistoricalData = async () => {
    try {
      const [m, res, evtList] = await Promise.all([
        MatchRepository.getMatchById(matchId),
        MatchRepository.getMatchResult(matchId),
        MatchRepository.getMatchEvents(matchId),
      ]);

      setMatch(m);
      setResult(res);
      setEvents(evtList);

      if (res?.statistics) {
        try {
          const parsed = JSON.parse(res.statistics);
          setParsedStats(parsed);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!match || !result) {
    return (
      <View style={styles.container}>
        <Header title="Archived Match Report" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading historical record...</Text>
        </View>
      </View>
    );
  }

  // Preserved Snapshots from Match Creation Time!
  const teamAName = match.teamA?.name || 'Team A';
  const teamBName = match.teamB?.name || 'Team B';
  const isDraw = Boolean(result.isDraw);
  const isTeamAWinner = !isDraw && result.winner === match.teamAId;
  const isTeamBWinner = !isDraw && result.winner === match.teamBId;

  const statsA = parsedStats?.teamA || {
    tries: 0,
    penaltyTries: 0,
    conversions: 0,
    missedConversions: 0,
    penaltyKicks: 0,
    dropGoals: 0,
    totalPoints: result.finalScoreA,
  };

  const statsB = parsedStats?.teamB || {
    tries: 0,
    penaltyTries: 0,
    conversions: 0,
    missedConversions: 0,
    penaltyKicks: 0,
    dropGoals: 0,
    totalPoints: result.finalScoreB,
  };

  return (
    <View style={styles.container}>
      <Header
        title="Historical Match Record"
        subtitle={`Immutable Record: ${match.matchCode}`}
        showBack
        onBack={() => navigation.goBack()}
        rightActionIcon="trash-outline"
        rightActionLabel="Delete"
        onRightAction={() => setDeleteConfirmVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Integrity Notice Badge */}
        <View style={styles.snapshotNotice}>
          <Ionicons name="lock-closed" size={14} color={Colors.accentGold} />
          <Text style={[Typography.caption, styles.snapshotNoticeText]}>
            Preserved historical snapshot. Team and player records are frozen at match time.
          </Text>
        </View>

        {/* Scoreboard Card */}
        <Card style={styles.scoreboardCard}>
          <View style={styles.cardTopHeader}>
            <Text style={[Typography.h3, styles.tournamentTitle]}>
              {match.tournament}
            </Text>
            <Badge label="ARCHIVED" variant="completed" />
          </View>

          <View style={styles.scoresRow}>
            {/* Team A Snapshot */}
            <View style={styles.teamCol}>
              <View style={styles.teamIconCircle}>
                <Ionicons name="shield" size={24} color={Colors.scoreTeamA} />
              </View>
              <Text
                style={[
                  Typography.h3,
                  styles.teamName,
                  isTeamAWinner && styles.winnerText,
                ]}
                numberOfLines={2}
              >
                {teamAName}
              </Text>
              <Text style={Typography.caption}>
                Coach: {match.teamA?.coach || 'Unassigned'}
              </Text>
              {isTeamAWinner && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>WINNER</Text>
                </View>
              )}
            </View>

            {/* Score */}
            <View style={styles.scoreCenter}>
              <View style={styles.scoreRowCenter}>
                <Text
                  style={[
                    Typography.scoreLarge,
                    styles.scoreText,
                    { color: isTeamAWinner ? Colors.primaryLight : Colors.textPrimary },
                  ]}
                >
                  {result.finalScoreA}
                </Text>
                <Text style={styles.scoreDivider}>-</Text>
                <Text
                  style={[
                    Typography.scoreLarge,
                    styles.scoreText,
                    { color: isTeamBWinner ? Colors.primaryLight : Colors.textPrimary },
                  ]}
                >
                  {result.finalScoreB}
                </Text>
              </View>
              {isDraw && (
                <Badge label="DRAW" variant="draw" style={{ marginTop: 4 }} />
              )}
            </View>

            {/* Team B Snapshot */}
            <View style={styles.teamCol}>
              <View style={styles.teamIconCircle}>
                <Ionicons name="shield" size={24} color={Colors.scoreTeamB} />
              </View>
              <Text
                style={[
                  Typography.h3,
                  styles.teamName,
                  isTeamBWinner && styles.winnerText,
                ]}
                numberOfLines={2}
              >
                {teamBName}
              </Text>
              <Text style={Typography.caption}>
                Coach: {match.teamB?.coach || 'Unassigned'}
              </Text>
              {isTeamBWinner && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>WINNER</Text>
                </View>
              )}
            </View>
          </View>

          {/* Toss & Venue Snapshot Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={[Typography.caption, styles.metaText]}>{match.venue}</Text>
            </View>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={[Typography.caption, styles.metaText]}>{match.matchDate}</Text>
            </View>
            <View style={styles.metaCol}>
              <Ionicons name="disc-outline" size={13} color={Colors.accentGold} />
              <Text style={[Typography.caption, styles.metaText]}>
                Toss: {match.tossWinner === match.teamAId ? teamAName : teamBName}
              </Text>
            </View>
          </View>
        </Card>

        {/* Player of the Match */}
        {result.playerOfTheMatch ? (
          <Card style={styles.potmCard}>
            <View style={styles.potmRow}>
              <Ionicons name="medal" size={24} color={Colors.accentGold} />
              <View style={styles.potmInfo}>
                <Text style={[Typography.caption, styles.potmLabel]}>
                  PLAYER OF THE MATCH
                </Text>
                <Text style={[Typography.h3, styles.potmName]}>
                  {result.playerOfTheMatch}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Category Breakdown Table */}
        <Card style={styles.categoryCard}>
          <Text style={[Typography.h3, styles.sectionTitle]}>
            Scoring Category Breakdown
          </Text>

          <View style={styles.breakdownHeader}>
            <Text style={[styles.colA, { color: Colors.scoreTeamA }]}>
              {teamAName}
            </Text>
            <Text style={styles.colLabel}>CATEGORY</Text>
            <Text style={[styles.colB, { color: Colors.scoreTeamB }]}>
              {teamBName}
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.tries} (x5)</Text>
            <Text style={styles.labelCategory}>Tries (5 pts)</Text>
            <Text style={styles.numB}>{statsB.tries} (x5)</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.penaltyTries} (x7)</Text>
            <Text style={styles.labelCategory}>Penalty Tries (7 pts)</Text>
            <Text style={styles.numB}>{statsB.penaltyTries} (x7)</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.conversions} (x2)</Text>
            <Text style={styles.labelCategory}>Conversions (2 pts)</Text>
            <Text style={styles.numB}>{statsB.conversions} (x2)</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.missedConversions}</Text>
            <Text style={styles.labelCategory}>Missed Convs (0 pts)</Text>
            <Text style={styles.numB}>{statsB.missedConversions}</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.penaltyKicks} (x3)</Text>
            <Text style={styles.labelCategory}>Penalty Kicks (3 pts)</Text>
            <Text style={styles.numB}>{statsB.penaltyKicks} (x3)</Text>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.numA}>{statsA.dropGoals} (x3)</Text>
            <Text style={styles.labelCategory}>Drop Goals (3 pts)</Text>
            <Text style={styles.numB}>{statsB.dropGoals} (x3)</Text>
          </View>

          <View style={[styles.categoryRow, styles.totalRow]}>
            <Text style={[styles.numA, styles.totalNum]}>
              {result.finalScoreA} PTS
            </Text>
            <Text style={[styles.labelCategory, styles.totalCategory]}>
              FINAL SCORE
            </Text>
            <Text style={[styles.numB, styles.totalNum]}>
              {result.finalScoreB} PTS
            </Text>
          </View>
        </Card>

        {/* Permanent Event Timeline */}
        <View style={styles.timelineSection}>
          <Text style={[Typography.h3, styles.sectionTitle]}>
            Match Event Timeline ({events.length} Events)
          </Text>

          {events.map((e) => {
            const isTeamA = e.teamId === match.teamAId;
            return (
              <Card key={e.id} style={styles.timelineCard}>
                <View style={styles.timelineRow}>
                  <View
                    style={[
                      styles.pointBox,
                      e.points > 0 ? styles.posBox : styles.zeroBox,
                    ]}
                  >
                    <Text style={styles.pointText}>
                      {e.points > 0 ? `+${e.points}` : '0'}
                    </Text>
                  </View>

                  <View style={styles.eventInfo}>
                    <View style={styles.eventTitleRow}>
                      <Text style={[Typography.h4, styles.eventType]}>
                        {e.eventType.replace('_', ' ')}
                      </Text>
                      <Text
                        style={[
                          Typography.caption,
                          { color: isTeamA ? Colors.scoreTeamA : Colors.scoreTeamB },
                        ]}
                      >
                        {e.teamNameSnapshot}
                      </Text>
                    </View>
                    <Text style={[Typography.caption, styles.eventScorer]}>
                      {e.playerNameSnapshot} • Half {e.half} • {Math.floor(e.matchTime / 60)}'
                      {e.notes ? ` • ${e.notes}` : ''}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Delete Match Record Option */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Match Record"
            variant="danger"
            size="medium"
            icon="trash-outline"
            onPress={() => setDeleteConfirmVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Match Record?"
        message={`Are you sure you want to permanently delete match ${match.matchCode} (${teamAName} vs ${teamBName})? This will delete all final scores, statistics, and recorded events from SQLite.`}
        confirmTitle="Delete Match"
        confirmVariant="danger"
        onConfirm={handleDeleteMatch}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  snapshotNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: Spacing.md,
    gap: 8,
  },
  snapshotNoticeText: {
    color: Colors.accentGold,
    flex: 1,
  },
  scoreboardCard: {
    backgroundColor: Colors.scoreboardBg,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tournamentTitle: {
    color: Colors.accentGold,
    fontSize: 16,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  teamName: {
    textAlign: 'center',
    fontSize: 13,
  },
  winnerText: {
    color: Colors.primaryLight,
  },
  winnerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 4,
  },
  winnerBadgeText: {
    color: Colors.primaryLight,
    fontSize: 9,
    fontWeight: '800',
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  scoreRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900',
  },
  scoreDivider: {
    fontSize: 24,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  potmCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.accentGold,
  },
  potmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  potmInfo: {
    flex: 1,
  },
  potmLabel: {
    color: Colors.accentGold,
    fontWeight: '800',
  },
  potmName: {
    marginTop: 2,
  },
  categoryCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  colA: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  colB: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  numA: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  labelCategory: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  numB: {
    flex: 1,
    textAlign: 'right',
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  totalNum: {
    fontWeight: '900',
    fontSize: 14,
    color: Colors.primaryLight,
  },
  totalCategory: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timelineSection: {
    marginBottom: Spacing.lg,
  },
  timelineCard: {
    paddingVertical: 8,
    marginBottom: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  posBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  zeroBox: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointText: {
    color: Colors.primaryLight,
    fontWeight: '900',
    fontSize: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventType: {
    fontSize: 13,
  },
  eventScorer: {
    marginTop: 2,
  },
});
