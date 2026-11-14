import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Input, Button, Card } from '../components/common';
import { TeamRepository } from '../database/teamRepository';
import { MatchRepository } from '../database/matchRepository';
import { Team, MatchType } from '../types';

const MATCH_TYPES: MatchType[] = [
  'Friendly',
  'League',
  'Knockout',
  'Tournament',
  'School',
  'University',
  'Club',
  'Other',
];

export const CreateMatchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [matchTime, setMatchTime] = useState<string>('15:00');
  const [venue, setVenue] = useState<string>('National Rugby Ground');
  const [tournament, setTournament] = useState<string>('Rugby Championship');
  const [matchType, setMatchType] = useState<MatchType>('Tournament');
  const [duration, setDuration] = useState<string>('80');
  const [halvesCount, setHalvesCount] = useState<string>('2');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const list = await TeamRepository.getAllTeams();
      setTeams(list);
      if (list.length >= 2) {
        setTeamAId(list[0].id);
        setTeamBId(list[1].id);
      } else if (list.length === 1) {
        setTeamAId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!teamAId) errs.teamA = 'Please select Team A';
    if (!teamBId) errs.teamB = 'Please select Team B';
    if (teamAId && teamBId && teamAId === teamBId) {
      errs.teamB = 'Team A and Team B cannot be the same team';
    }
    if (!matchDate.trim()) errs.matchDate = 'Match date is required (YYYY-MM-DD)';
    if (!venue.trim()) errs.venue = 'Match venue is required';
    if (!tournament.trim()) errs.tournament = 'Tournament name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateMatch = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const match = await MatchRepository.createMatch({
        teamAId,
        teamBId,
        matchDate: matchDate.trim(),
        matchTime: matchTime.trim(),
        venue: venue.trim(),
        tournament: tournament.trim(),
        matchType,
        duration: Number(duration) || 80,
        halvesCount: Number(halvesCount) || 2,
        notes: notes.trim(),
      });

      // Navigate directly to Toss management screen
      navigation.replace('MatchToss', { matchId: match.id });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  if (teams.length < 2) {
    return (
      <View style={styles.container}>
        <Header title="Create Match" showBack onBack={() => navigation.goBack()} />
        <View style={styles.insufficientTeams}>
          <Ionicons name="shield-outline" size={48} color={Colors.accentGold} />
          <Text style={[Typography.h3, styles.insufficientTitle]}>
            At Least 2 Teams Required
          </Text>
          <Text style={[Typography.bodySecondary, styles.insufficientDesc]}>
            You currently have {teams.length} team registered. Create at least two rugby teams before organizing a match.
          </Text>
          <Button
            title="Create A Team"
            onPress={() => navigation.navigate('TeamForm')}
            variant="primary"
            size="medium"
            icon="add"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Create New Match"
        subtitle="Configure teams, venue & rules"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Team Selection Section */}
        <Card style={styles.sectionCard}>
          <Text style={[Typography.caption, styles.sectionLabel]}>TEAM A (HOME / FIRST)</Text>
          {errors.teamA && <Text style={styles.errorText}>{errors.teamA}</Text>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamScroll}
          >
            {teams.map((t) => {
              const isSelected = teamAId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.teamBadge, isSelected && styles.activeTeamABadge]}
                  onPress={() => setTeamAId(t.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="shield"
                    size={14}
                    color={isSelected ? Colors.white : Colors.scoreTeamA}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.teamText, isSelected && styles.activeTeamText]}
                    numberOfLines={1}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.vsDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={[Typography.caption, styles.sectionLabel]}>TEAM B (AWAY / SECOND)</Text>
          {errors.teamB && <Text style={styles.errorText}>{errors.teamB}</Text>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamScroll}
          >
            {teams.map((t) => {
              const isSelected = teamBId === t.id;
              const isSameAsTeamA = teamAId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamBadge,
                    isSelected && styles.activeTeamBBadge,
                    isSameAsTeamA && styles.disabledTeamBadge,
                  ]}
                  onPress={() => {
                    if (!isSameAsTeamA) setTeamBId(t.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="shield"
                    size={14}
                    color={isSelected ? Colors.white : Colors.scoreTeamB}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.teamText,
                      isSelected && styles.activeTeamText,
                      isSameAsTeamA && styles.disabledTeamText,
                    ]}
                    numberOfLines={1}
                  >
                    {t.name} {isSameAsTeamA ? '(Selected for A)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>

        {/* Competition & Venue Info */}
        <Card style={styles.sectionCard}>
          <Input
            label="Tournament / Competition Name *"
            placeholder="e.g. World Rugby Trophy 2026"
            value={tournament}
            onChangeText={setTournament}
            error={errors.tournament}
            icon="trophy-outline"
          />

          <Input
            label="Match Venue / Grounds *"
            placeholder="e.g. City Rugby Park, Pitch 1"
            value={venue}
            onChangeText={setVenue}
            error={errors.venue}
            icon="location-outline"
          />

          <View style={styles.rowFields}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                label="Date (YYYY-MM-DD) *"
                placeholder="2026-11-14"
                value={matchDate}
                onChangeText={setMatchDate}
                error={errors.matchDate}
                icon="calendar-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Kick-Off Time"
                placeholder="15:00"
                value={matchTime}
                onChangeText={setMatchTime}
                icon="time-outline"
              />
            </View>
          </View>
        </Card>

        {/* Match Rules & Structure */}
        <Card style={styles.sectionCard}>
          <Text style={[Typography.caption, styles.sectionLabel]}>MATCH TYPE</Text>
          <View style={styles.matchTypesGrid}>
            {MATCH_TYPES.map((type) => {
              const isSelected = matchType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, isSelected && styles.activeTypeChip]}
                  onPress={() => setMatchType(type)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.typeText, isSelected && styles.activeTypeText]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rowFields}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                label="Duration (Minutes)"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
                icon="stopwatch-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Number of Halves"
                keyboardType="numeric"
                value={halvesCount}
                onChangeText={setHalvesCount}
                icon="hourglass-outline"
              />
            </View>
          </View>

          <Input
            label="Optional Match Notes / Referee Info"
            placeholder="e.g. Head Referee: Mr. James Miller"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </Card>

        <Button
          title="Proceed to Toss & Start"
          onPress={handleCreateMatch}
          variant="primary"
          size="large"
          loading={loading}
          icon="arrow-forward-circle"
          style={styles.submitBtn}
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
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  insufficientTeams: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  insufficientTitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  insufficientDesc: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    marginBottom: 6,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  teamScroll: {
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeTeamABadge: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  activeTeamBBadge: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  disabledTeamBadge: {
    opacity: 0.4,
  },
  teamText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTeamText: {
    color: Colors.white,
    fontWeight: '800',
  },
  disabledTeamText: {
    color: Colors.textMuted,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  vsText: {
    paddingHorizontal: Spacing.md,
    color: Colors.accentGold,
    fontWeight: '900',
    fontSize: 12,
  },
  rowFields: {
    flexDirection: 'row',
  },
  matchTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTypeChip: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  typeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeTypeText: {
    color: Colors.textDark,
    fontWeight: '800',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 11,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
