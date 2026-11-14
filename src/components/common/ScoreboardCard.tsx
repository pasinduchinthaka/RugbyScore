import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../theme';
import { Match } from '../../types';
import { Badge } from './Badge';

interface ScoreboardCardProps {
  match: Match;
  onPress: () => void;
}

export const ScoreboardCard: React.FC<ScoreboardCardProps> = ({ match, onPress }) => {
  const isCompleted = match.status === 'COMPLETED';
  const isLive =
    match.status === 'LIVE_FIRST_HALF' ||
    match.status === 'HALF_TIME' ||
    match.status === 'LIVE_SECOND_HALF' ||
    match.status === 'EXTRA_TIME';

  const isTeamAWinner = isCompleted && match.winner === match.teamAId;
  const isTeamBWinner = isCompleted && match.winner === match.teamBId;
  const isDraw = isCompleted && (match.winner === 'DRAW' || match.winner === 'Draw');

  const teamAName = match.teamA?.name || 'Team A';
  const teamBName = match.teamB?.name || 'Team B';

  const formatStatus = () => {
    switch (match.status) {
      case 'LIVE_FIRST_HALF':
        return '1st Half LIVE';
      case 'HALF_TIME':
        return 'Half Time';
      case 'LIVE_SECOND_HALF':
        return '2nd Half LIVE';
      case 'EXTRA_TIME':
        return 'Extra Time';
      case 'COMPLETED':
        return 'Full Time';
      default:
        return 'Scheduled';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isLive && styles.liveBorder]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.tournamentRow}>
          <Ionicons name="trophy-outline" size={13} color={Colors.accentGold} />
          <Text style={[Typography.caption, styles.tournament]} numberOfLines={1}>
            {match.tournament || 'Rugby Series'}
          </Text>
        </View>
        <Badge
          label={formatStatus()}
          status={match.status}
        />
      </View>

      {/* Main Scoreboard Section */}
      <View style={styles.scoreRow}>
        {/* Team A */}
        <View style={[styles.teamContainer, styles.alignLeft]}>
          <View style={styles.teamLogoCircle}>
            <Ionicons name="shield" size={18} color={Colors.scoreTeamA} />
          </View>
          <Text
            style={[
              Typography.h4,
              styles.teamName,
              isTeamAWinner && styles.winnerText,
            ]}
            numberOfLines={1}
          >
            {teamAName}
          </Text>
          {isTeamAWinner && (
            <View style={styles.winnerBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.winnerLabel}>WINNER</Text>
            </View>
          )}
        </View>

        {/* Scores & Separator */}
        <View style={styles.centerScore}>
          {isCompleted || isLive ? (
            <View style={styles.pointsBadge}>
              <Text
                style={[
                  Typography.scoreLarge,
                  styles.scoreText,
                  { color: isTeamAWinner ? Colors.primaryLight : Colors.textPrimary },
                ]}
              >
                {match.teamAScore}
              </Text>
              <Text style={styles.scoreDivider}>-</Text>
              <Text
                style={[
                  Typography.scoreLarge,
                  styles.scoreText,
                  { color: isTeamBWinner ? Colors.primaryLight : Colors.textPrimary },
                ]}
              >
                {match.teamBScore}
              </Text>
            </View>
          ) : (
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.scheduledTime}>{match.matchTime || '15:00'}</Text>
            </View>
          )}
          {isDraw && <Text style={styles.drawLabel}>DRAW</Text>}
        </View>

        {/* Team B */}
        <View style={[styles.teamContainer, styles.alignRight]}>
          <View style={styles.teamLogoCircle}>
            <Ionicons name="shield" size={18} color={Colors.scoreTeamB} />
          </View>
          <Text
            style={[
              Typography.h4,
              styles.teamName,
              isTeamBWinner && styles.winnerText,
            ]}
            numberOfLines={1}
          >
            {teamBName}
          </Text>
          {isTeamBWinner && (
            <View style={styles.winnerBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.winnerLabel}>WINNER</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
          <Text style={[Typography.caption, styles.metaText]}>{match.matchDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={[Typography.caption, styles.metaText]} numberOfLines={1}>
            {match.venue || 'Stadium'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="barcode-outline" size={12} color={Colors.textMuted} />
          <Text style={[Typography.caption, styles.codeText]}>{match.matchCode}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  liveBorder: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  tournament: {
    marginLeft: 4,
    color: Colors.accentGold,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  alignLeft: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'center',
  },
  teamLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamName: {
    textAlign: 'center',
    fontSize: 13,
  },
  winnerText: {
    color: Colors.primaryLight,
    fontWeight: '800',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  winnerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryLight,
    marginLeft: 2,
  },
  centerScore: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.scoreboardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '900',
    minWidth: 26,
    textAlign: 'center',
  },
  scoreDivider: {
    color: Colors.textMuted,
    fontSize: 20,
    marginHorizontal: 6,
    fontWeight: '700',
  },
  vsBadge: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  scheduledTime: {
    color: Colors.accentGold,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  drawLabel: {
    color: Colors.accentPurple,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 3,
  },
  codeText: {
    marginLeft: 3,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
