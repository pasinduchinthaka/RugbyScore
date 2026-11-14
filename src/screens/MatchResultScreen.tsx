import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Badge, Button, StatBox } from '../components/common';
import { MatchRepository } from '../database/matchRepository';
import { PlayerRepository } from '../database/playerRepository';
import {
  Match,
  MatchResult,
  MatchEvent,
  MatchStatisticsSnapshot,
  Player,
} from '../types';

export const MatchResultScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [parsedStats, setParsedStats] = useState<MatchStatisticsSnapshot | null>(null);

  // Player of the match modal selector
  const [potmModalVisible, setPotmModalVisible] = useState(false);

  useEffect(() => {
    loadResultData();
  }, [matchId]);

  const loadResultData = async () => {
    try {
      const [m, res, evtList] = await Promise.all([
        MatchRepository.getMatchById(matchId),
        MatchRepository.getMatchResult(matchId),
        MatchRepository.getMatchEvents(matchId),
      ]);

      setMatch(m);
      setResult(res);
      setEvents(evtList);

      if (m) {
        const [pA, pB] = await Promise.all([
          PlayerRepository.getAllPlayers({ teamId: m.teamAId }),
          PlayerRepository.getAllPlayers({ teamId: m.teamBId }),
        ]);
        setAllPlayers([...pA, ...pB]);
      }

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

  const handleSelectPotm = async (playerName: string) => {
    if (!match) return;
    setPotmModalVisible(false);
    try {
      await MatchRepository.completeMatch(match.id, playerName);
      await loadResultData();
      Alert.alert('Updated', `${playerName} selected as Player of the Match.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (!match || !result) {
    return (
      <View style={styles.container}>
        <Header
          title="Match Report"
          showBack
          onBack={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading match result...</Text>
        </View>
      </View>
    );
  }

  const teamAName = match.teamA?.name || 'Team A';
  const teamBName = match.teamB?.name || 'Team B';
  const isDraw = Boolean(result.isDraw);
  const isTeamAWinner = !isDraw && result.winner === match.teamAId;
  const isTeamBWinner = !isDraw && result.winner === match.teamBId;
  const winningTeamName = isDraw ? 'Draw' : isTeamAWinner ? teamAName : teamBName;

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
        title="Official Match Report"
        subtitle={match.matchCode}
        showBack
        onBack={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Final Scoreboard Card */}
        <Card style={styles.heroCard}>
          <View style={styles.tournamentRow}>
            <Ionicons name="trophy" size={16} color={Colors.accentGold} />
            <Text style={[Typography.h3, styles.tournamentTitle]}>
              {match.tournament}
            </Text>
          </View>

          {/* Scores Display */}
          <View style={styles.scoresRow}>
            {/* Team A */}
            <View style={styles.teamCol}>
              <View style={styles.teamLogoCircle}>
                <Ionicons name="shield" size={26} color={Colors.scoreTeamA} />
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
              {isTeamAWinner && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>WINNER</Text>
                </View>
              )}
            </View>

            {/* Score */}
            <View style={styles.scoreCenter}>
              <View style={styles.scoreBox}>
                <Text
                  style={[
                    Typography.scoreLarge,
                    styles.scoreText,
                    { color: isTeamAWinner ? Colors.primaryLight : Colors.textPrimary },
                  ]}
                >
                  {result.finalScoreA}
                </Text>
                <Text style={styles.scoreSep}>-</Text>
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
              <Badge
                label={isDraw ? 'MATCH DRAW' : 'FULL TIME'}
                variant={isDraw ? 'draw' : 'completed'}
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Team B */}
            <View style={styles.teamCol}>
              <View style={styles.teamLogoCircle}>
                <Ionicons name="shield" size={26} color={Colors.scoreTeamB} />
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
              {isTeamBWinner && (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>WINNER</Text>
                </View>
              )}
            </View>
          </View>

          {/* Meta Details */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={[Typography.caption, styles.metaText]}>{match.venue}</Text>
            </View>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={[Typography.caption, styles.metaText]}>{match.matchDate}</Text>
            </View>
          </View>
        </Card>

        {/* Player of the Match Card */}
        <Card style={styles.potmCard}>
          <View style={styles.potmRow}>
            <View style={styles.potmMedal}>
              <Ionicons name="medal" size={24} color={Colors.accentGold} />
            </View>
            <View style={styles.potmInfo}>
              <Text style={[Typography.caption, styles.potmLabel]}>
                PLAYER OF THE MATCH
              </Text>
              <Text style={[Typography.h3, styles.potmName]}>
                {result.playerOfTheMatch || 'Not Selected Yet'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePotmBtn}
              onPress={() => setPotmModalVisible(true)}
            >
              <Text style={styles.changePotmText}>
                {result.playerOfTheMatch ? 'Change' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Category Breakdown Table */}
        <Card style={styles.categoryCard}>
          <Text style={[Typography.h3, styles.sectionHeader]}>
            Scoring Category Breakdown
          </Text>

          <View style={styles.breakdownHeaderRow}>
            <Text style={[styles.breakdownTeamCol, { color: Colors.scoreTeamA }]}>
              {teamAName}
            </Text>
            <Text style={styles.breakdownLabelCol}>CATEGORY</Text>
            <Text
              style={[
                styles.breakdownTeamCol,
                { color: Colors.scoreTeamB, textAlign: 'right' },
              ]}
            >
              {teamBName}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.tries} (x5)</Text>
            <Text style={styles.breakdownCategory}>Tries (5 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.tries} (x5)
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.penaltyTries} (x7)</Text>
            <Text style={styles.breakdownCategory}>Penalty Tries (7 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.penaltyTries} (x7)
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.conversions} (x2)</Text>
            <Text style={styles.breakdownCategory}>Conversions (2 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.conversions} (x2)
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.missedConversions}</Text>
            <Text style={styles.breakdownCategory}>Missed Conversions (0 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.missedConversions}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.penaltyKicks} (x3)</Text>
            <Text style={styles.breakdownCategory}>Penalty Kicks (3 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.penaltyKicks} (x3)
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownNum}>{statsA.dropGoals} (x3)</Text>
            <Text style={styles.breakdownCategory}>Drop Goals (3 pts)</Text>
            <Text style={[styles.breakdownNum, styles.alignRight]}>
              {statsB.dropGoals} (x3)
            </Text>
          </View>

          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={[styles.breakdownNum, styles.boldNum]}>
              {result.finalScoreA} PTS
            </Text>
            <Text style={[styles.breakdownCategory, styles.boldCategory]}>
              TOTAL POINTS
            </Text>
            <Text style={[styles.breakdownNum, styles.alignRight, styles.boldNum]}>
              {result.finalScoreB} PTS
            </Text>
          </View>
        </Card>

        {/* Complete Match Timeline */}
        <View style={styles.timelineSection}>
          <Text style={[Typography.h3, styles.sectionHeader]}>
            Full Match Timeline ({events.length} Events)
          </Text>

          {events.map((e) => {
            const isTeamA = e.teamId === match.teamAId;
            return (
              <Card key={e.id} style={styles.timelineItem}>
                <View style={styles.timelineItemRow}>
                  <View
                    style={[
                      styles.pointBox,
                      e.points > 0 ? styles.posPointBox : styles.zeroPointBox,
                    ]}
                  >
                    <Text style={styles.pointText}>
                      {e.points > 0 ? `+${e.points}` : '0'}
                    </Text>
                  </View>

                  <View style={styles.eventDetails}>
                    <View style={styles.eventHeaderRow}>
                      <Text style={[Typography.h4, styles.eventTitle]}>
                        {e.eventType.replace('_', ' ')}
                      </Text>
                      <Text
                        style={[
                          Typography.caption,
                          {
                            color: isTeamA ? Colors.scoreTeamA : Colors.scoreTeamB,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {e.teamNameSnapshot}
                      </Text>
                    </View>
                    <Text style={[Typography.caption, styles.eventDesc]}>
                      {e.playerNameSnapshot} • Half {e.half} • {Math.floor(e.matchTime / 60)}'
                      {e.notes ? ` • ${e.notes}` : ''}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsRow}>
          <Button
            title="Match History Archive"
            variant="secondary"
            size="large"
            icon="time-outline"
            onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
            style={{ flex: 1 }}
          />
          <Button
            title="Home Dashboard"
            variant="primary"
            size="large"
            icon="home-outline"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>

      {/* Select Player of the Match Modal */}
      <Modal
        visible={potmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPotmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={Typography.h3}>Select Player of the Match</Text>
              <TouchableOpacity onPress={() => setPotmModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {allPlayers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.playerOption}
                  onPress={() => handleSelectPotm(`#${p.jerseyNumber} ${p.name}`)}
                >
                  <View style={styles.playerOptionJersey}>
                    <Text style={styles.playerOptionJerseyText}>{p.jerseyNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.h4, styles.playerOptionName]}>
                      {p.name}
                    </Text>
                    <Text style={Typography.caption}>{p.position}</Text>
                  </View>
                  <Ionicons name="checkmark" size={18} color={Colors.accentGold} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  heroCard: {
    backgroundColor: Colors.scoreboardBg,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  tournamentTitle: {
    color: Colors.accentGold,
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
  teamLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  teamName: {
    textAlign: 'center',
    fontSize: 14,
    minHeight: 36,
  },
  winnerText: {
    color: Colors.primaryLight,
  },
  winnerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontWeight: '900',
  },
  scoreSep: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  },
  potmCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.accentGold,
  },
  potmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  potmMedal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  potmInfo: {
    flex: 1,
  },
  potmLabel: {
    color: Colors.accentGold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  potmName: {
    marginTop: 2,
  },
  changePotmBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePotmText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCard: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  breakdownTeamCol: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownLabelCol: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  breakdownNum: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownCategory: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  alignRight: {
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 0,
    paddingTop: 8,
    marginTop: 4,
  },
  boldNum: {
    fontWeight: '900',
    fontSize: 15,
    color: Colors.primaryLight,
  },
  boldCategory: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timelineSection: {
    marginBottom: Spacing.lg,
  },
  timelineItem: {
    paddingVertical: 8,
    marginBottom: Spacing.xs,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  posPointBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  zeroPointBox: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointText: {
    color: Colors.primaryLight,
    fontWeight: '900',
    fontSize: 13,
  },
  eventDetails: {
    flex: 1,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 13,
  },
  eventDesc: {
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Spacing.cardRadius,
    borderTopRightRadius: Spacing.cardRadius,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  playerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerOptionJersey: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  playerOptionJerseyText: {
    color: Colors.accentGold,
    fontWeight: '800',
    fontSize: 13,
  },
  playerOptionName: {
    fontSize: 14,
  },
});
