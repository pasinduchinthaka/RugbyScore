import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Badge, Button, ConfirmDialog } from '../components/common';
import { MatchRepository } from '../database/matchRepository';
import { PlayerRepository } from '../database/playerRepository';
import {
  Match,
  MatchEvent,
  Player,
  ScoringEventType,
} from '../types';

export const LiveScoringScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [squadA, setSquadA] = useState<Player[]>([]);
  const [squadB, setSquadB] = useState<Player[]>([]);

  // Live Timer State
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  // Active Scoring Team Tab (Team A or Team B controls)
  const [activeTeamTab, setActiveTeamTab] = useState<'teamA' | 'teamB'>('teamA');

  // Player Selector Modal for Events
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<ScoringEventType | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string>('');

  // Confirmation Modals
  const [endHalfConfirmVisible, setEndHalfConfirmVisible] = useState(false);
  const [endMatchConfirmVisible, setEndMatchConfirmVisible] = useState(false);
  const [undoConfirmVisible, setUndoConfirmVisible] = useState(false);

  // Conversion Eligibility Info
  const [teamAConvEligibility, setTeamAConvEligibility] = useState({
    triesCount: 0,
    conversionsAttempted: 0,
    canConvert: false,
  });
  const [teamBConvEligibility, setTeamBConvEligibility] = useState({
    triesCount: 0,
    conversionsAttempted: 0,
    canConvert: false,
  });

  // Load Match State & Crash Recovery
  const loadMatchData = async () => {
    try {
      const m = await MatchRepository.getMatchById(matchId);
      if (!m) return;
      setMatch(m);

      const [pA, pB, evtList, eligA, eligB] = await Promise.all([
        PlayerRepository.getAllPlayers({ teamId: m.teamAId }),
        PlayerRepository.getAllPlayers({ teamId: m.teamBId }),
        MatchRepository.getMatchEvents(matchId),
        MatchRepository.getEligibleConversionStatus(matchId, m.teamAId),
        MatchRepository.getEligibleConversionStatus(matchId, m.teamBId),
      ]);

      setSquadA(pA);
      setSquadB(pB);
      setEvents(evtList);
      setTeamAConvEligibility(eligA);
      setTeamBConvEligibility(eligB);

      // Restore Timer State
      let initialSeconds = m.timerSeconds || 0;
      if (m.isTimerRunning && m.lastTimerUpdate) {
        const elapsedSinceLast = Math.floor((Date.now() - m.lastTimerUpdate) / 1000);
        initialSeconds += elapsedSinceLast;
      }
      setSeconds(initialSeconds);
      setIsRunning(Boolean(m.isTimerRunning));
    } catch (e) {
      console.error('Failed to load match scoring state:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMatchData();
    }, [matchId])
  );

  // Timer Tick & Persistence
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          // Periodically sync every 15 seconds to SQLite for crash safety
          if (next % 15 === 0 && match) {
            MatchRepository.updateTimerState(
              match.id,
              next,
              true,
              match.currentHalf,
              match.status
            );
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning, match?.currentHalf, match?.status]);

  const toggleTimer = async () => {
    if (!match) return;
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    await MatchRepository.updateTimerState(
      match.id,
      seconds,
      nextRunning,
      match.currentHalf,
      match.status
    );
  };

  const handleEndFirstHalf = async () => {
    if (!match) return;
    setEndHalfConfirmVisible(false);
    setIsRunning(false);
    await MatchRepository.updateTimerState(
      match.id,
      seconds,
      false,
      1,
      'HALF_TIME'
    );
    await loadMatchData();
  };

  const handleStartSecondHalf = async () => {
    if (!match) return;
    setIsRunning(true);
    await MatchRepository.updateTimerState(
      match.id,
      seconds,
      true,
      2,
      'LIVE_SECOND_HALF'
    );
    await loadMatchData();
  };

  const handleEndMatch = async () => {
    if (!match) return;
    setEndMatchConfirmVisible(false);
    setIsRunning(false);
    await MatchRepository.updateTimerState(
      match.id,
      seconds,
      false,
      match.currentHalf,
      'COMPLETED'
    );
    await MatchRepository.completeMatch(match.id);
    navigation.replace('MatchResult', { matchId });
  };

  // Scoring Event Triggers
  const openPlayerSelection = (teamId: string, eventType: ScoringEventType) => {
    setPendingTeamId(teamId);
    setPendingEventType(eventType);
    setPlayerModalVisible(true);
  };

  const handleRecordScoringEvent = async (playerId: string | null) => {
    if (!match || !pendingEventType) return;
    setPlayerModalVisible(false);

    try {
      await MatchRepository.addScoringEvent({
        matchId: match.id,
        teamId: pendingTeamId,
        playerId,
        eventType: pendingEventType,
        matchTime: seconds,
        half: match.currentHalf,
      });

      // Reload fresh scores & timeline
      await loadMatchData();
    } catch (e: any) {
      Alert.alert('Scoring Rule Alert', e.message || 'Cannot record scoring event.');
    } finally {
      setPendingEventType(null);
    }
  };

  const handlePenaltyTry = async (teamId: string) => {
    if (!match) return;
    try {
      // Penalty try: 7 points, no conversion allowed, awarded by referee
      await MatchRepository.addScoringEvent({
        matchId: match.id,
        teamId,
        playerId: null,
        eventType: 'PENALTY_TRY',
        matchTime: seconds,
        half: match.currentHalf,
        notes: 'Penalty Try awarded by referee',
      });
      await loadMatchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUndoEvent = async () => {
    if (!match) return;
    setUndoConfirmVisible(false);
    try {
      const deleted = await MatchRepository.undoLastEvent(match.id);
      if (deleted) {
        await loadMatchData();
        Alert.alert(
          'Score Undone',
          `Removed last event: ${deleted.eventType.replace('_', ' ')} (${deleted.points} pts)`
        );
      } else {
        Alert.alert('Notice', 'No events to undo for this match.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!match) {
    return (
      <View style={styles.container}>
        <Header title="Live Scoreboard" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading scoreboard...</Text>
        </View>
      </View>
    );
  }

  const teamAName = match.teamA?.name || 'Team A';
  const teamBName = match.teamB?.name || 'Team B';
  const isTeamATab = activeTeamTab === 'teamA';
  const activeTeamId = isTeamATab ? match.teamAId : match.teamBId;
  const activeTeamName = isTeamATab ? teamAName : teamBName;
  const activeSquad = isTeamATab ? squadA : squadB;
  const activeEligibility = isTeamATab ? teamAConvEligibility : teamBConvEligibility;

  return (
    <View style={styles.container}>
      <Header
        title="Live Rugby Scoreboard"
        subtitle={match.tournament}
        showBack
        onBack={() => navigation.goBack()}
        rightActionIcon="arrow-undo-outline"
        rightActionLabel="Undo"
        onRightAction={() => setUndoConfirmVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Professional Rugby Scoreboard Card */}
        <Card style={styles.scoreboardContainer}>
          {/* Half & Timer Status Bar */}
          <View style={styles.timerHeader}>
            <Badge
              label={
                match.status === 'HALF_TIME'
                  ? 'HALF TIME'
                  : `HALF ${match.currentHalf}`
              }
              status={match.status}
            />
            <View style={styles.clockRow}>
              <Ionicons
                name={isRunning ? 'play' : 'pause'}
                size={16}
                color={isRunning ? Colors.primary : Colors.accentGold}
                style={{ marginRight: 6 }}
              />
              <Text style={[Typography.timerLarge, styles.timerDigits]}>
                {formatTimer(seconds)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.timerControlBtn, isRunning ? styles.pauseBtn : styles.playBtn]}
              onPress={toggleTimer}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={16}
                color={Colors.white}
              />
              <Text style={styles.timerBtnText}>
                {isRunning ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Teams Showdown & Large Live Scores */}
          <View style={styles.scoresRow}>
            {/* Team A */}
            <TouchableOpacity
              style={[styles.teamScoreCol, isTeamATab && styles.activeTeamCol]}
              onPress={() => setActiveTeamTab('teamA')}
              activeOpacity={0.8}
            >
              <View style={styles.teamBadgeCircle}>
                <Ionicons name="shield" size={24} color={Colors.scoreTeamA} />
              </View>
              <Text style={[Typography.h3, styles.teamNameText]} numberOfLines={2}>
                {teamAName}
              </Text>
              <Text style={[Typography.scoreLarge, styles.scoreValueTeamA]}>
                {match.teamAScore}
              </Text>
              {isTeamATab && <View style={styles.activeTeamIndicator} />}
            </TouchableOpacity>

            <View style={styles.versusCol}>
              <Text style={styles.versusText}>VS</Text>
              <Text style={styles.halfText}>
                {match.status === 'HALF_TIME' ? 'HT' : `H${match.currentHalf}`}
              </Text>
            </View>

            {/* Team B */}
            <TouchableOpacity
              style={[styles.teamScoreCol, !isTeamATab && styles.activeTeamCol]}
              onPress={() => setActiveTeamTab('teamB')}
              activeOpacity={0.8}
            >
              <View style={styles.teamBadgeCircle}>
                <Ionicons name="shield" size={24} color={Colors.scoreTeamB} />
              </View>
              <Text style={[Typography.h3, styles.teamNameText]} numberOfLines={2}>
                {teamBName}
              </Text>
              <Text style={[Typography.scoreLarge, styles.scoreValueTeamB]}>
                {match.teamBScore}
              </Text>
              {!isTeamATab && <View style={styles.activeTeamIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Quick Halves Navigation Controls */}
          <View style={styles.periodControlsRow}>
            {match.status === 'LIVE_FIRST_HALF' && (
              <Button
                title="End 1st Half"
                variant="accent"
                size="small"
                icon="hourglass-outline"
                onPress={() => setEndHalfConfirmVisible(true)}
                style={{ flex: 1 }}
              />
            )}
            {match.status === 'HALF_TIME' && (
              <Button
                title="Start 2nd Half"
                variant="primary"
                size="small"
                icon="play-forward"
                onPress={handleStartSecondHalf}
                style={{ flex: 1 }}
              />
            )}
            {match.status === 'LIVE_SECOND_HALF' && (
              <Button
                title="End Match"
                variant="danger"
                size="small"
                icon="stop-circle"
                onPress={() => setEndMatchConfirmVisible(true)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </Card>

        {/* Scoring Controls Section for Active Team */}
        <View style={styles.controlsSection}>
          <View style={styles.teamTabHeader}>
            <TouchableOpacity
              style={[styles.teamTabBtn, isTeamATab && styles.activeTabA]}
              onPress={() => setActiveTeamTab('teamA')}
            >
              <Text
                style={[
                  styles.teamTabBtnText,
                  isTeamATab && styles.activeTabBtnText,
                ]}
                numberOfLines={1}
              >
                {teamAName} (Score)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teamTabBtn, !isTeamATab && styles.activeTabB]}
              onPress={() => setActiveTeamTab('teamB')}
            >
              <Text
                style={[
                  styles.teamTabBtnText,
                  !isTeamATab && styles.activeTabBtnText,
                ]}
                numberOfLines={1}
              >
                {teamBName} (Score)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Team Scoring Buttons Grid */}
          <Card style={styles.scoringPanel}>
            <View style={styles.scoringPanelHeader}>
              <Text style={[Typography.h3, styles.scoringTeamTitle]}>
                Score for {activeTeamName}
              </Text>
              <Text style={Typography.caption}>
                Tries: {activeEligibility.triesCount} | Convs: {activeEligibility.conversionsAttempted}
              </Text>
            </View>

            {/* Row 1: Try (+5) & Penalty Try (+7) */}
            <View style={styles.buttonRow}>
              <Button
                title="TRY"
                subtitle="+5 Points"
                variant="scoreTry"
                size="large"
                icon="american-football"
                onPress={() => openPlayerSelection(activeTeamId, 'TRY')}
                style={styles.gridBtn}
              />
              <Button
                title="PENALTY TRY"
                subtitle="+7 Pts (No Conv)"
                variant="danger"
                size="large"
                icon="shield-checkmark"
                onPress={() => handlePenaltyTry(activeTeamId)}
                style={styles.gridBtn}
              />
            </View>

            {/* Row 2: Conversion (+2) & Missed Conversion (+0) */}
            <View style={styles.buttonRow}>
              <Button
                title="CONVERSION"
                subtitle={
                  activeEligibility.canConvert
                    ? '+2 Points (After Try)'
                    : 'Needs Unconverted Try'
                }
                variant="scoreConv"
                size="large"
                icon="radio-button-on"
                disabled={!activeEligibility.canConvert}
                onPress={() => openPlayerSelection(activeTeamId, 'CONVERSION')}
                style={styles.gridBtn}
              />
              <Button
                title="MISSED CONV."
                subtitle="0 Pts (Recorded)"
                variant="outline"
                size="large"
                icon="close-circle-outline"
                disabled={!activeEligibility.canConvert}
                onPress={() => openPlayerSelection(activeTeamId, 'MISSED_CONVERSION')}
                style={styles.gridBtn}
              />
            </View>

            {/* Row 3: Penalty Kick (+3) & Drop Goal (+3) */}
            <View style={styles.buttonRow}>
              <Button
                title="PENALTY KICK"
                subtitle="+3 Points"
                variant="scoreKick"
                size="large"
                icon="flag"
                onPress={() => openPlayerSelection(activeTeamId, 'PENALTY_KICK')}
                style={styles.gridBtn}
              />
              <Button
                title="DROP GOAL"
                subtitle="+3 Points"
                variant="scoreKick"
                size="large"
                icon="disc"
                onPress={() => openPlayerSelection(activeTeamId, 'DROP_GOAL')}
                style={styles.gridBtn}
              />
            </View>
          </Card>
        </View>

        {/* Live Match Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={[Typography.h3, styles.timelineTitle]}>
              Match Event Timeline ({events.length})
            </Text>
            {events.length > 0 && (
              <TouchableOpacity
                style={styles.undoLink}
                onPress={() => setUndoConfirmVisible(true)}
              >
                <Ionicons name="arrow-undo" size={14} color={Colors.danger} />
                <Text style={styles.undoText}>Undo Last Event</Text>
              </TouchableOpacity>
            )}
          </View>

          {events.length === 0 ? (
            <Card style={styles.emptyTimelineCard}>
              <Ionicons name="time-outline" size={28} color={Colors.textMuted} />
              <Text style={[Typography.bodySecondary, styles.emptyTimelineText]}>
                No scoring events recorded yet. Tap scoring buttons above to record tries, conversions, or kicks.
              </Text>
            </Card>
          ) : (
            events.map((e) => {
              const isTeamA = e.teamId === match.teamAId;
              return (
                <Card key={e.id} style={styles.timelineCard}>
                  <View style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelinePointPill,
                        e.points > 0 ? styles.ptsPositive : styles.ptsZero,
                      ]}
                    >
                      <Text style={styles.ptsText}>
                        {e.points > 0 ? `+${e.points}` : '0'}
                      </Text>
                    </View>

                    <View style={styles.timelineInfo}>
                      <View style={styles.timelineTitleRow}>
                        <Text style={[Typography.h4, styles.timelineType]}>
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
                      <Text style={[Typography.caption, styles.scorerName]}>
                        {e.playerNameSnapshot} • Half {e.half} • {Math.floor(e.matchTime / 60)}'
                        {e.notes ? ` • ${e.notes}` : ''}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <Modal
        visible={playerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlayerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={Typography.h3}>Select Scorer</Text>
                <Text style={[Typography.caption, { color: Colors.accentGold }]}>
                  {pendingEventType?.replace('_', ' ')} for {activeTeamName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlayerModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.playerListScroll}>
              {/* Unassigned / Team Option */}
              <TouchableOpacity
                style={styles.playerChoiceItem}
                onPress={() => handleRecordScoringEvent(null)}
              >
                <View style={styles.unassignedJersey}>
                  <Ionicons name="people" size={16} color={Colors.textSecondary} />
                </View>
                <Text style={[Typography.h4, styles.playerChoiceName]}>
                  Unassigned / Team Score
                </Text>
              </TouchableOpacity>

              {activeSquad.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerChoiceItem}
                  onPress={() => handleRecordScoringEvent(player.id)}
                >
                  <View style={styles.playerChoiceJersey}>
                    <Text style={styles.playerChoiceJerseyText}>
                      {player.jerseyNumber}
                    </Text>
                  </View>
                  <View style={styles.playerChoiceInfo}>
                    <Text style={[Typography.h4, styles.playerChoiceName]}>
                      {player.name}
                    </Text>
                    <Text style={Typography.caption}>{player.position}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Half Dialog */}
      <ConfirmDialog
        visible={endHalfConfirmVisible}
        title="End First Half?"
        message="This will pause the timer and advance the match status to Half Time."
        confirmTitle="End 1st Half"
        confirmVariant="accent"
        onConfirm={handleEndFirstHalf}
        onCancel={() => setEndHalfConfirmVisible(false)}
      />

      {/* End Match Dialog */}
      <ConfirmDialog
        visible={endMatchConfirmVisible}
        title="Complete & Finalize Match?"
        message="This will conclude the rugby match and generate the permanent match report."
        confirmTitle="End Match"
        confirmVariant="danger"
        onConfirm={handleEndMatch}
        onCancel={() => setEndMatchConfirmVisible(false)}
      />

      {/* Undo Confirmation Dialog */}
      <ConfirmDialog
        visible={undoConfirmVisible}
        title="Undo Most Recent Score?"
        message="Are you sure you want to remove the most recent scoring event from the match? Scores will be recalculated automatically."
        confirmTitle="Undo Event"
        confirmVariant="danger"
        onConfirm={handleUndoEvent}
        onCancel={() => setUndoConfirmVisible(false)}
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
  scoreboardContainer: {
    backgroundColor: Colors.scoreboardBg,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerDigits: {
    color: Colors.accentGold,
    fontSize: 24,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.buttonRadius,
    gap: 4,
  },
  playBtn: {
    backgroundColor: Colors.primaryDark,
  },
  pauseBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  teamScoreCol: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Spacing.cardRadius,
  },
  activeTeamCol: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  teamBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  teamNameText: {
    textAlign: 'center',
    fontSize: 14,
    minHeight: 36,
  },
  scoreValueTeamA: {
    color: Colors.scoreTeamA,
    fontSize: 44,
    marginTop: 4,
  },
  scoreValueTeamB: {
    color: Colors.scoreTeamB,
    fontSize: 44,
    marginTop: 4,
  },
  activeTeamIndicator: {
    width: 24,
    height: 3,
    backgroundColor: Colors.accentGold,
    borderRadius: 2,
    marginTop: 6,
  },
  versusCol: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  versusText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textMuted,
  },
  halfText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accentGold,
    marginTop: 4,
  },
  periodControlsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  controlsSection: {
    marginBottom: Spacing.md,
  },
  teamTabHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.inputRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  teamTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabA: {
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.scoreTeamA,
  },
  activeTabB: {
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 3,
    borderBottomColor: Colors.scoreTeamB,
  },
  teamTabBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabBtnText: {
    color: Colors.textPrimary,
  },
  scoringPanel: {
    padding: Spacing.md,
  },
  scoringPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoringTeamTitle: {
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gridBtn: {
    flex: 1,
    minHeight: 52,
  },
  timelineSection: {
    marginTop: Spacing.sm,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timelineTitle: {
    fontSize: 16,
  },
  undoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  undoText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyTimelineCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTimelineText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  timelineCard: {
    paddingVertical: 8,
    marginBottom: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelinePointPill: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ptsPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ptsZero: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ptsText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primaryLight,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineType: {
    fontSize: 13,
  },
  scorerName: {
    marginTop: 2,
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
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playerListScroll: {
    paddingBottom: 20,
  },
  playerChoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  unassignedJersey: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  playerChoiceJersey: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  playerChoiceJerseyText: {
    color: Colors.accentGold,
    fontWeight: '800',
    fontSize: 14,
  },
  playerChoiceInfo: {
    flex: 1,
  },
  playerChoiceName: {
    fontSize: 14,
  },
});
