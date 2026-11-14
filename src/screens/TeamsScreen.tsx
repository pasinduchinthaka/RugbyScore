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
import { TeamRepository } from '../database/teamRepository';
import { Team, OrganizationType } from '../types';

const ORG_TYPES: ('All' | OrganizationType)[] = [
  'All',
  'Club',
  'University',
  'School',
  'National',
  'Regional',
  'Other',
];

export const TeamsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<'All' | OrganizationType>('All');
  const [loading, setLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await TeamRepository.getAllTeams(searchQuery);
      setTeams(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeams();
    }, [searchQuery])
  );

  const filteredTeams = teams.filter((t) => {
    if (selectedOrg === 'All') return true;
    return t.organizationType === selectedOrg;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Rugby Teams"
        subtitle={`${teams.length} registered organizations`}
        rightActionIcon="add-outline"
        rightActionLabel="Add Team"
        onRightAction={() => navigation.navigate('TeamForm')}
      />

      <View style={styles.searchSection}>
        <Input
          placeholder="Search team name, country, coach..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
          isSearch
          onClear={() => setSearchQuery('')}
        />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {ORG_TYPES.map((org) => {
            const isSelected = selectedOrg === org;
            return (
              <TouchableOpacity
                key={org}
                style={[styles.chip, isSelected && styles.activeChip]}
                onPress={() => setSelectedOrg(org)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                  {org}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Prominent Easy-to-Touch Add Team Button */}
      <View style={styles.actionButtonBar}>
        <Button
          title="Create New Rugby Team"
          onPress={() => navigation.navigate('TeamForm')}
          variant="primary"
          size="medium"
          icon="add-circle"
          style={styles.actionBtn}
        />
      </View>

      <FlatList
        data={filteredTeams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchTeams}
        ListEmptyComponent={
          <EmptyState
            icon="shield-outline"
            title="No Teams Found"
            description={
              searchQuery
                ? 'No rugby teams matched your search criteria.'
                : 'Create your first rugby team to get started.'
            }
            actionTitle="Create Team"
            onAction={() => navigation.navigate('TeamForm')}
          />
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('TeamDetail', { teamId: item.id })}
            style={styles.teamCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.logoAndName}>
                <View style={styles.logoCircle}>
                  <Ionicons name="shield" size={22} color={Colors.accentGold} />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={[Typography.h3, styles.teamName]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.countryRow}>
                    <Ionicons name="globe-outline" size={13} color={Colors.textSecondary} />
                    <Text style={[Typography.bodySecondary, styles.countryText]}>
                      {item.country}
                    </Text>
                  </View>
                </View>
              </View>

              <Badge label={item.organizationType} variant="neutral" />
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>COACH</Text>
                <Text style={styles.metaVal}>{item.coach || 'Unassigned'}</Text>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>PLAYERS</Text>
                <Text style={styles.metaVal}>{item.playerCount || 0} Registered</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
  searchSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipsScroll: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeChip: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  teamCard: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  logoAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: Colors.textPrimary,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  countryText: {
    marginLeft: 4,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.sm,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
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
