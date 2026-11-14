import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  ScoreboardCard,
  ConfirmDialog,
  Button,
  EmptyState,
} from '../components/common';
import { TeamRepository } from '../database/teamRepository';
import { PlayerRepository } from '../database/playerRepository';
import { Team, TeamStats, Player, Match } from '../types';

export const TeamDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { teamId } = route.params;

  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'matches'>('players');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const loadTeamData = async () => {
    try {
      const [tData, sData, pData, mData] = await Promise.all([
        TeamRepository.getTeamById(teamId),
        TeamRepository.getTeamStats(teamId),
        PlayerRepository.getAllPlayers({ teamId }),
        TeamRepository.getTeamMatches(teamId),
      ]);
      setTeam(tData);
      setStats(sData);
      setPlayers(pData);
      setMatches(mData);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTeamData();
    }, [teamId])
  );

  const handleDeleteTeam = async () => {
    try {
      setDeleteConfirmVisible(false);
      await TeamRepository.deleteTeam(teamId);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete team');
    }
  };

  if (!team) {
    return (
      <View style={styles.container}>
        <Header title="Team Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={Typography.bodySecondary}>Loading team details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={team.name}
        subtitle={team.organizationType}
        showBack
        onBack={() => navigation.goBack()}
        rightActionIcon="create-outline"
        rightActionLabel="Edit"
        onRightAction={() => navigation.navigate('TeamForm', { teamId })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Team Hero Header */}
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroLogoCircle}>
              <Ionicons name="shield" size={36} color={Colors.accentGold} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={Typography.h2}>{team.name}</Text>
              <View style={styles.heroMetaRow}>
                <Ionicons name="globe-outline" size={14} color={Colors.textSecondary} />
                <Text style={[Typography.bodySecondary, styles.heroMetaText]}>
                  {team.country}
                </Text>
              </View>
              <View style={styles.heroMetaRow}>
                <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                <Text style={[Typography.bodySecondary, styles.heroMetaText]}>
                  Coach: {team.coach || 'Unassigned'}
                </Text>
              </View>
            </View>
          </View>

          {team.description ? (
            <Text style={[Typography.bodySecondary, styles.descriptionText]}>
              {team.description}
            </Text>
          ) : null}

          {team.contact ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
              <Text style={[Typography.caption, styles.contactText]}>{team.contact}</Text>
            </View>
          ) : null}
        </Card>

        {/* Team Statistics Overview */}
        {stats && (
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <StatBox
                label="Played"
                value={stats.matchesPlayed}
                icon="trophy-outline"
                color={Colors.accentBlue}
              />
              <StatBox
                label="Win Rate"
                value={`${stats.winPercentage}%`}
                icon="ribbon-outline"
                color={Colors.primary}
              />
            </View>
            <View style={styles.statsRow}>
              <StatBox
                label="W / L / D"
                value={`${stats.wins} / ${stats.losses} / ${stats.draws}`}
                icon="analytics-outline"
                color={Colors.accentPurple}
              />
              <StatBox
                label="Pts Diff"
                value={stats.pointDifference >= 0 ? `+${stats.pointDifference}` : `${stats.pointDifference}`}
                icon="podium-outline"
                color={stats.pointDifference >= 0 ? Colors.primaryLight : Colors.danger}
              />
            </View>
          </View>
        )}

        {/* Tab Controls */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'players' && styles.activeTabButton]}
            onPress={() => setActiveTab('players')}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={activeTab === 'players' ? Colors.accentGold : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'players' && styles.activeTabText,
              ]}
            >
              Squad ({players.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'matches' && styles.activeTabButton]}
            onPress={() => setActiveTab('matches')}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={activeTab === 'matches' ? Colors.accentGold : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'matches' && styles.activeTabText,
              ]}
            >
              Match History ({matches.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Squad Tab Content */}
        {activeTab === 'players' && (
          <View style={styles.tabContent}>
            <View style={styles.squadActionsRow}>
              <Text style={Typography.h3}>Registered Players</Text>
              <Button
                title="Add Player"
                size="small"
                icon="person-add"
                onPress={() => navigation.navigate('PlayerForm', { teamId })}
              />
            </View>

            {players.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Players Registered"
                description="Add rugby players to this team to participate in matches."
                actionTitle="Add First Player"
                onAction={() => navigation.navigate('PlayerForm', { teamId })}
              />
            ) : (
              players.map((p) => (
                <Card
                  key={p.id}
                  style={styles.playerCard}
                  onPress={() => navigation.navigate('PlayerDetail', { playerId: p.id })}
                >
                  <View style={styles.playerRow}>
                    <View style={styles.jerseyBadge}>
                      <Text style={styles.jerseyNum}>{p.jerseyNumber}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={[Typography.h4, styles.playerName]}>{p.name}</Text>
                      <Text style={Typography.caption}>{p.position}</Text>
                    </View>
                    <Badge
                      label={p.availability}
                      variant={p.availability === 'Available' ? 'primary' : 'warning'}
                    />
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.textMuted}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Match History Tab Content */}
        {activeTab === 'matches' && (
          <View style={styles.tabContent}>
            {matches.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title="No Matches Yet"
                description="This team has not played any recorded rugby matches."
                actionTitle="Schedule Match"
                onAction={() => navigation.navigate('CreateMatch')}
              />
            ) : (
              matches.map((m) => (
                <ScoreboardCard
                  key={m.id}
                  match={m}
                  onPress={() =>
                    m.status === 'COMPLETED'
                      ? navigation.navigate('HistoricalMatchReport', { matchId: m.id })
                      : navigation.navigate('LiveScoring', { matchId: m.id })
                  }
                />
              ))
            )}
          </View>
        )}

        {/* Delete Team Button */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Team"
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
        title="Delete Team?"
        message={`Are you sure you want to delete ${team.name}? This will remove all associated players and local records for this team.`}
        confirmTitle="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteTeam}
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
  heroCard: {
    marginBottom: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  heroInfo: {
    flex: 1,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  heroMetaText: {
    marginLeft: 4,
    fontSize: 12,
  },
  descriptionText: {
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  contactText: {
    marginLeft: 6,
  },
  statsSection: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.inputRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentGold,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  tabContent: {
    marginBottom: Spacing.lg,
  },
  squadActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playerCard: {
    paddingVertical: 10,
    marginBottom: Spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jerseyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jerseyNum: {
    color: Colors.accentGold,
    fontWeight: '800',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
  },
  dangerZone: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
