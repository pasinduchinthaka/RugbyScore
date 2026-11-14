import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Badge, Input, EmptyState, Button } from '../components/common';
import { PlayerRepository } from '../database/playerRepository';
import { TeamRepository } from '../database/teamRepository';
import { Player, Team } from '../types';

const POSITIONS = [
  'All',
  'Loosehead Prop',
  'Hooker',
  'Tighthead Prop',
  'Lock 4',
  'Lock 5',
  'Blindside Flanker',
  'Openside Flanker',
  'Number 8',
  'Scrum-half',
  'Fly-half',
  'Left Wing',
  'Inside Centre',
  'Outside Centre',
  'Right Wing',
  'Full-back',
];

export const PlayersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFiltersAndPlayers = async () => {
    try {
      setLoading(true);
      const [tList, pList] = await Promise.all([
        TeamRepository.getAllTeams(),
        PlayerRepository.getAllPlayers({
          teamId: selectedTeamId,
          position: selectedPosition === 'All' ? undefined : selectedPosition,
          searchQuery,
        }),
      ]);
      setTeams(tList);
      setPlayers(pList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFiltersAndPlayers();
    }, [selectedTeamId, selectedPosition, searchQuery])
  );

  return (
    <View style={styles.container}>
      <Header
        title="Rugby Players"
        subtitle={`${players.length} players across teams`}
        rightActionIcon="person-add-outline"
        rightActionLabel="Add Player"
        onRightAction={() => navigation.navigate('PlayerForm')}
      />

      <View style={styles.filtersSection}>
        <Input
          placeholder="Search player name, jersey, team..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
          isSearch
          onClear={() => setSearchQuery('')}
        />

        {/* Team Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedTeamId && styles.activeChip]}
            onPress={() => setSelectedTeamId(undefined)}
          >
            <Text style={[styles.chipText, !selectedTeamId && styles.activeChipText]}>
              All Teams
            </Text>
          </TouchableOpacity>
          {teams.map((t) => {
            const isSelected = selectedTeamId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedTeamId(t.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Position Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.posChipsScroll}
        >
          {POSITIONS.map((pos) => {
            const isSelected = selectedPosition === pos;
            return (
              <TouchableOpacity
                key={pos}
                style={[styles.posChip, isSelected && styles.activePosChip]}
                onPress={() => setSelectedPosition(pos)}
              >
                <Text style={[styles.posChipText, isSelected && styles.activePosChipText]}>
                  {pos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Prominent Register Player Button */}
      <View style={styles.actionButtonBar}>
        <Button
          title="Register New Rugby Player"
          onPress={() => navigation.navigate('PlayerForm')}
          variant="primary"
          size="medium"
          icon="person-add"
          style={styles.actionBtn}
        />
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchFiltersAndPlayers}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Players Found"
            description={
              searchQuery || selectedTeamId || selectedPosition !== 'All'
                ? 'No rugby players matched your current filters.'
                : 'Add rugby players to your teams to begin scoring matches.'
            }
            actionTitle="Add Player"
            onAction={() => navigation.navigate('PlayerForm')}
          />
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('PlayerDetail', { playerId: item.id })}
            style={styles.playerCard}
          >
            <View style={styles.playerCardContent}>
              <View style={styles.jerseyCircle}>
                <Text style={styles.jerseyText}>{item.jerseyNumber}</Text>
              </View>

              <View style={styles.playerInfo}>
                <Text style={[Typography.h3, styles.playerName]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[Typography.caption, styles.posText]}>{item.position}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={[Typography.caption, styles.teamNameText]} numberOfLines={1}>
                    {item.teamName || 'Independent'}
                  </Text>
                </View>
              </View>

              <Badge
                label={item.availability}
                variant={
                  item.availability === 'Available'
                    ? 'primary'
                    : item.availability === 'Injured'
                    ? 'warning'
                    : 'draw'
                }
              />
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.textMuted}
                style={{ marginLeft: 8 }}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filtersSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipsScroll: {
    paddingVertical: 6,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeChip: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: Colors.textDark,
    fontWeight: '800',
  },
  posChipsScroll: {
    paddingBottom: 8,
    gap: Spacing.xs,
  },
  posChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceElevated,
    marginRight: 4,
  },
  activePosChip: {
    backgroundColor: Colors.accentBlue,
  },
  posChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  activePosChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  playerCard: {
    paddingVertical: 12,
    marginBottom: Spacing.xs,
  },
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jerseyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  jerseyText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.accentGold,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  posText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dotSeparator: {
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  teamNameText: {
    color: Colors.textMuted,
    flex: 1,
  },
  actionButtonBar: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  actionBtn: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
