import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../theme';
import {
  Header,
  Card,
  Badge,
  StatBox,
  ConfirmDialog,
  Button,
  EmptyState,
} from '../components/common';
import { PlayerRepository } from '../database/playerRepository';
import { Player, PlayerStats, MatchEvent } from '../types';

export const PlayerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { playerId } = route.params;

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<MatchEvent[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const loadPlayerData = async () => {
    try {
      const [pData, sData, hData] = await Promise.all([
        PlayerRepository.getPlayerById(playerId),
        PlayerRepository.getPlayerStats(playerId),
        PlayerRepository.getPlayerScoringHistory(playerId),
      ]);
      setPlayer(pData);
      setStats(sData);
      setHistory(hData);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlayerData();
    }, [playerId])
  );

  const handleDelete = async () => {
    try {
      setDeleteDialogVisible(false);
      await PlayerRepository.deletePlayer(playerId);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete player');
    }
  };

  if (!player) {
    return (
      <View style={styles.container}>
        <Header title="Player Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading player profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={player.name}
        subtitle={`#${player.jerseyNumber} • ${player.position}`}
        showBack
        onBack={() => navigation.goBack()}
        rightActionIcon="create-outline"
        rightActionLabel="Edit"
        onRightAction={() => navigation.navigate('PlayerForm', { playerId: player.id })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Player Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.jerseyLarge}>
              <Text style={styles.jerseyNumLarge}>{player.jerseyNumber}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={Typography.h2}>{player.name}</Text>
              <Text style={[Typography.bodySecondary, styles.teamTitle]}>
                {player.teamName || 'Independent'}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={player.availability}
                  variant={
                    player.availability === 'Available'
                      ? 'primary'
                      : player.availability === 'Injured'
                      ? 'warning'
                      : 'draw'
                  }
                />
                <Text style={[Typography.caption, styles.posLabel]}>
                  {player.position}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>AGE</Text>
              <Text style={styles.metaVal}>{player.age ? `${player.age} yrs` : 'N/A'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>CONTACT</Text>
              <Text style={styles.metaVal}>{player.contact || 'None'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={styles.metaVal}>{player.availability}</Text>
            </View>
          </View>
        </Card>

        {/* Player Statistics */}
        {stats && (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Career Scoring Records</Text>
            <View style={styles.statsRow}>
              <StatBox
                label="Total Points"
                value={stats.totalPoints}
                icon="podium-outline"
                color={Colors.accentGold}
              />
              <StatBox
                label="Matches"
                value={stats.matchesPlayed}
                icon="trophy-outline"
                color={Colors.accentBlue}
              />
            </View>
            <View style={styles.statsRow}>
              <StatBox
                label="Tries (5 pts)"
                value={stats.tries}
                icon="american-football-outline"
                color={Colors.primary}
              />
              <StatBox
                label="Conversions (2 pts)"
                value={stats.conversions}
                icon="radio-button-on-outline"
                color={Colors.accentBlue}
              />
            </View>
            <View style={styles.statsRow}>
              <StatBox
                label="Pen. Kicks (3 pts)"
                value={stats.penaltyKicks}
                icon="flag-outline"
                color={Colors.accentOrange}
              />
              <StatBox
                label="Drop Goals (3 pts)"
                value={stats.dropGoals}
                icon="disc-outline"
                color={Colors.accentPurple}
              />
            </View>
          </View>
        )}

        {/* Scoring & Participation Timeline */}
        <View style={styles.section}>
          <Text style={[Typography.h3, styles.sectionTitle]}>
            Scoring Timeline ({history.length} Events)
          </Text>

          {history.length === 0 ? (
            <EmptyState
              icon="american-football-outline"
              title="No Scoring Records Yet"
              description="This player has not recorded any scores in matches."
            />
          ) : (
            history.map((e) => (
              <Card key={e.id} style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventPoints}>+{e.points}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={[Typography.h4, styles.eventType]}>
                      {e.eventType.replace('_', ' ')}
                    </Text>
                    <Text style={Typography.caption}>
                      Half {e.half} • {Math.floor(e.matchTime / 60)}'
                      {e.notes ? ` • ${e.notes}` : ''}
                    </Text>
                  </View>
                  <Text style={[Typography.caption, styles.eventDate]}>
                    {new Date(e.eventTimestamp).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Delete Player Button */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Player"
            variant="danger"
            size="medium"
            icon="trash-outline"
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Player?"
        message={`Are you sure you want to remove #${player.jerseyNumber} ${player.name} from the squad?`}
        confirmTitle="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogVisible(false)}
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
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  jerseyLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  jerseyNumLarge: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  profileInfo: {
    flex: 1,
  },
  teamTitle: {
    color: Colors.accentBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  posLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.sm,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventCard: {
    paddingVertical: 10,
    marginBottom: Spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  eventPoints: {
    color: Colors.primaryLight,
    fontWeight: '900',
    fontSize: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
  },
  eventDate: {
    color: Colors.textMuted,
  },
  dangerZone: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
