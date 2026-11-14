import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Button, Badge } from '../components/common';
import { MatchRepository } from '../database/matchRepository';
import { PlayerRepository } from '../database/playerRepository';
import { Match, Player, TossDecision } from '../types';

export const MatchTossScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [squadA, setSquadA] = useState<Player[]>([]);
  const [squadB, setSquadB] = useState<Player[]>([]);
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<TossDecision>('KICK_OFF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMatchAndSquads();
  }, [matchId]);

  const loadMatchAndSquads = async () => {
    try {
      const m = await MatchRepository.getMatchById(matchId);
      if (m) {
        setMatch(m);
        setTossWinner(m.tossWinner || m.teamAId);
        setTossDecision(m.tossDecision || 'KICK_OFF');

        const [pA, pB] = await Promise.all([
          PlayerRepository.getAllPlayers({ teamId: m.teamAId }),
          PlayerRepository.getAllPlayers({ teamId: m.teamBId }),
        ]);
        setSquadA(pA);
        setSquadB(pB);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmAndStart = async () => {
    if (!match) return;
    try {
      setLoading(true);
      await MatchRepository.updateToss(matchId, tossWinner, tossDecision);
      await MatchRepository.startMatch(matchId);
      // Navigate to live scoring
      navigation.replace('LiveScoring', { matchId });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start match');
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <View style={styles.container}>
        <Header title="Match Toss" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading match details...</Text>
        </View>
      </View>
    );
  }

  const teamAName = match.teamA?.name || 'Team A';
  const teamBName = match.teamB?.name || 'Team B';

  return (
    <View style={styles.container}>
      <Header
        title="Match Details & Toss"
        subtitle={match.matchCode}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Match Overview Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerTop}>
            <Badge label={match.matchType} variant="neutral" />
            <Text style={[Typography.caption, styles.matchCodeText]}>
              {match.matchCode}
            </Text>
          </View>

          <Text style={[Typography.h2, styles.tournamentTitle]}>
            {match.tournament}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={Colors.accentGold} />
            <Text style={[Typography.bodySecondary, styles.metaText]}>
              {match.venue}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.accentGold} />
            <Text style={[Typography.bodySecondary, styles.metaText]}>
              {match.matchDate} at {match.matchTime} • {match.duration} mins ({match.halvesCount} halves)
            </Text>
          </View>
        </Card>

        {/* Team Lineup Showdown */}
        <View style={styles.showdownRow}>
          {/* Team A */}
          <Card style={[styles.teamCard, tossWinner === match.teamAId && styles.tossActiveCard]}>
            <View style={styles.teamLogo}>
              <Ionicons name="shield" size={26} color={Colors.scoreTeamA} />
            </View>
            <Text style={[Typography.h3, styles.teamTitle]} numberOfLines={2}>
              {teamAName}
            </Text>
            <Text style={Typography.caption}>{squadA.length} Players Available</Text>
          </Card>

          <View style={styles.showdownVs}>
            <Text style={styles.showdownVsText}>VS</Text>
          </View>

          {/* Team B */}
          <Card style={[styles.teamCard, tossWinner === match.teamBId && styles.tossActiveCard]}>
            <View style={styles.teamLogo}>
              <Ionicons name="shield" size={26} color={Colors.scoreTeamB} />
            </View>
            <Text style={[Typography.h3, styles.teamTitle]} numberOfLines={2}>
              {teamBName}
            </Text>
            <Text style={Typography.caption}>{squadB.length} Players Available</Text>
          </Card>
        </View>

        {/* Toss Winner Selector */}
        <Card style={styles.tossCard}>
          <View style={styles.tossHeader}>
            <Ionicons name="disc" size={20} color={Colors.accentGold} />
            <Text style={[Typography.h3, styles.tossTitle]}>Coin Toss Winner</Text>
          </View>

          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[
                styles.choiceBtn,
                tossWinner === match.teamAId && styles.choiceBtnActiveA,
              ]}
              onPress={() => setTossWinner(match.teamAId)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.choiceBtnText,
                  tossWinner === match.teamAId && styles.choiceBtnTextActive,
                ]}
              >
                {teamAName}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceBtn,
                tossWinner === match.teamBId && styles.choiceBtnActiveB,
              ]}
              onPress={() => setTossWinner(match.teamBId)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.choiceBtnText,
                  tossWinner === match.teamBId && styles.choiceBtnTextActive,
                ]}
              >
                {teamBName}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toss Decision Selector */}
          <Text style={[Typography.caption, styles.decisionLabel]}>
            TOSS WINNER ELECTS TO:
          </Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[
                styles.choiceBtn,
                tossDecision === 'KICK_OFF' && styles.decisionActive,
              ]}
              onPress={() => setTossDecision('KICK_OFF')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="football-outline"
                size={16}
                color={tossDecision === 'KICK_OFF' ? Colors.white : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.choiceBtnText,
                  tossDecision === 'KICK_OFF' && styles.choiceBtnTextActive,
                ]}
              >
                Kick Off First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceBtn,
                tossDecision === 'CHOOSE_SIDE' && styles.decisionActive,
              ]}
              onPress={() => setTossDecision('CHOOSE_SIDE')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={tossDecision === 'CHOOSE_SIDE' ? Colors.white : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.choiceBtnText,
                  tossDecision === 'CHOOSE_SIDE' && styles.choiceBtnTextActive,
                ]}
              >
                Choose Side / End
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Start Match CTA */}
        <Button
          title="Start Live Match"
          onPress={handleConfirmAndStart}
          variant="primary"
          size="large"
          loading={loading}
          icon="play"
          style={styles.startBtn}
        />
      </ScrollView>
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
  bannerCard: {
    marginBottom: Spacing.md,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  matchCodeText: {
    color: Colors.accentGold,
    fontWeight: '700',
  },
  tournamentTitle: {
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
  },
  showdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  tossActiveCard: {
    borderColor: Colors.accentGold,
    borderWidth: 1.5,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  teamTitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 2,
  },
  showdownVs: {
    paddingHorizontal: Spacing.sm,
  },
  showdownVsText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  tossCard: {
    marginBottom: Spacing.lg,
  },
  tossHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tossTitle: {
    marginLeft: 8,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Spacing.buttonRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceBtnActiveA: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  choiceBtnActiveB: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  decisionActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  choiceBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceBtnTextActive: {
    color: Colors.white,
    fontWeight: '900',
  },
  decisionLabel: {
    marginBottom: 6,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  startBtn: {
    marginTop: Spacing.xs,
  },
});
