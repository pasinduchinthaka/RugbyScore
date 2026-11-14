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
import { Header, Input, ScoreboardCard, EmptyState } from '../components/common';
import { MatchRepository } from '../database/matchRepository';
import { TeamRepository } from '../database/teamRepository';
import { Match, Team } from '../types';

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [isDrawFilter, setIsDrawFilter] = useState(false);
  const [loading, setLoading] = useState(false);

  const years = ['All', '2026', '2025', '2024', '2023'];

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [mList, tList] = await Promise.all([
        MatchRepository.getHistoricalMatches({
          searchQuery,
          teamId: selectedTeamId,
          year: selectedYear === 'All' ? undefined : selectedYear,
          isDraw: isDrawFilter,
        }),
        TeamRepository.getAllTeams(),
      ]);
      setMatches(mList);
      setTeams(tList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [searchQuery, selectedTeamId, selectedYear, isDrawFilter])
  );

  return (
    <View style={styles.container}>
      <Header
        title="Match History & Archive"
        subtitle={`${matches.length} permanent records preserved`}
      />

      <View style={styles.filterSection}>
        <Input
          placeholder="Search match ID, team, venue, tournament..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
          isSearch
          onClear={() => setSearchQuery('')}
        />

        {/* Year Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {years.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <TouchableOpacity
                key={yr}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {yr === 'All' ? 'All Years' : yr}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.chip, isDrawFilter && styles.activeDrawChip]}
            onPress={() => setIsDrawFilter(!isDrawFilter)}
          >
            <Ionicons
              name="git-compare-outline"
              size={13}
              color={isDrawFilter ? Colors.white : Colors.accentPurple}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.chipText, isDrawFilter && styles.activeChipText]}>
              Draw Matches Only
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Team Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teamFilterRow}
        >
          <TouchableOpacity
            style={[styles.teamChip, !selectedTeamId && styles.activeTeamChip]}
            onPress={() => setSelectedTeamId(undefined)}
          >
            <Text style={[styles.teamChipText, !selectedTeamId && styles.activeTeamChipText]}>
              All Teams
            </Text>
          </TouchableOpacity>
          {teams.map((t) => {
            const isSelected = selectedTeamId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.teamChip, isSelected && styles.activeTeamChip]}
                onPress={() => setSelectedTeamId(t.id)}
              >
                <Text style={[styles.teamChipText, isSelected && styles.activeTeamChipText]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchMatches}
        ListEmptyComponent={
          <EmptyState
            icon="archive-outline"
            title="No Archived Matches Found"
            description="No historical rugby matches match the selected search or filter criteria."
          />
        }
        renderItem={({ item }) => (
          <ScoreboardCard
            match={item}
            onPress={() =>
              navigation.navigate('HistoricalMatchReport', { matchId: item.id })
            }
          />
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
  filterSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChipsRow: {
    paddingVertical: 6,
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
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
  activeDrawChip: {
    backgroundColor: Colors.accentPurple,
    borderColor: Colors.accentPurple,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeChipText: {
    color: Colors.textDark,
    fontWeight: '800',
  },
  teamFilterRow: {
    paddingBottom: 8,
    gap: Spacing.xs,
  },
  teamChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceElevated,
    marginRight: 4,
  },
  activeTeamChip: {
    backgroundColor: Colors.accentBlue,
  },
  teamChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  activeTeamChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
});
