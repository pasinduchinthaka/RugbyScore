import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';
import { StatBox, ScoreboardCard, Button, EmptyState } from '../components/common';
import { StatsRepository } from '../database/statsRepository';
import { MatchRepository } from '../database/matchRepository';
import { seedSampleData, hasExistingData } from '../database/sampleData';
import { Match } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 16) + 8;

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalMatchesPlayed: 0,
    ongoingMatchesCount: 0,
  });
  const [ongoingMatches, setOngoingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);

  const loadDashboardData = async () => {
    try {
      const hasData = await hasExistingData();
      if (!hasData) {
        await seedSampleData();
      }

      const [stats, ongoing, recent] = await Promise.all([
        StatsRepository.getDashboardSummary(),
        MatchRepository.getOngoingMatches(),
        MatchRepository.getRecentMatches(5),
      ]);

      setSummary(stats);
      setOngoingMatches(ongoing);
      setRecentMatches(recent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Top App Identity Bar */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="american-football" size={24} color={Colors.accentGold} />
          </View>
          <View>
            <Text style={styles.brandTitle}>RugbyScore</Text>
            <Text style={styles.brandTagline}>Universal Offline Scoring & Management</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backupBtn}
          onPress={() => navigation.navigate('BackupRestore')}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Quick Counters */}
        <View style={styles.statsRow}>
          <StatBox
            label="Teams"
            value={summary.totalTeams}
            icon="shield-outline"
            color={Colors.accentBlue}
          />
          <StatBox
            label="Players"
            value={summary.totalPlayers}
            icon="people-outline"
            color={Colors.accentPurple}
          />
        </View>
        <View style={styles.statsRow}>
          <StatBox
            label="Matches Played"
            value={summary.totalMatchesPlayed}
            icon="trophy-outline"
            color={Colors.accentGold}
          />
          <StatBox
            label="Live / Active"
            value={summary.ongoingMatchesCount}
            icon="radio-outline"
            color={summary.ongoingMatchesCount > 0 ? Colors.danger : Colors.textMuted}
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Create New Match"
            onPress={() => navigation.navigate('CreateMatch')}
            variant="primary"
            size="large"
            icon="add-circle"
            style={styles.actionBtnLarge}
          />

          <View style={styles.subActionsRow}>
            <Button
              title="Manage Teams"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Teams' })}
              variant="secondary"
              size="medium"
              icon="shield"
              style={styles.subActionBtn}
            />
            <Button
              title="Match History"
              onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
              variant="secondary"
              size="medium"
              icon="time"
              style={styles.subActionBtn}
            />
          </View>
        </View>

        {/* Ongoing Matches Section */}
        {ongoingMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveHeading}>
                <View style={styles.pulsingDot} />
                <Text style={[Typography.h3, styles.sectionTitle]}>Ongoing Matches</Text>
              </View>
              <Text style={styles.countBadge}>{ongoingMatches.length}</Text>
            </View>

            {ongoingMatches.map((m) => (
              <ScoreboardCard
                key={m.id}
                match={m}
                onPress={() => navigation.navigate('LiveScoring', { matchId: m.id })}
              />
            ))}
          </View>
        )}

        {/* Recent Matches Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Recently Completed Matches</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}>
              <Text style={styles.seeAllText}>See Archive</Text>
            </TouchableOpacity>
          </View>

          {recentMatches.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="No Matches Recorded Yet"
              description="Create and score your first rugby match offline."
              actionTitle="Create Match"
              onAction={() => navigation.navigate('CreateMatch')}
            />
          ) : (
            recentMatches.map((m) => (
              <ScoreboardCard
                key={m.id}
                match={m}
                onPress={() => navigation.navigate('HistoricalMatchReport', { matchId: m.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  backupBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsContainer: {
    marginVertical: Spacing.md,
  },
  actionBtnLarge: {
    marginBottom: Spacing.sm,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  subActionBtn: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  liveHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.danger,
    color: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  seeAllText: {
    color: Colors.accentGold,
    fontWeight: '600',
    fontSize: 13,
  },
});
