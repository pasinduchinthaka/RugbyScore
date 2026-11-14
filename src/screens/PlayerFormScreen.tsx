import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Input, Button, Card } from '../components/common';
import { PlayerRepository } from '../database/playerRepository';
import { TeamRepository } from '../database/teamRepository';
import { Team, PlayerAvailability, PlayerPosition } from '../types';

const POSITIONS: PlayerPosition[] = [
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
  'Forward',
  'Back',
  'Utility',
];

const AVAILABILITY: PlayerAvailability[] = ['Available', 'Injured', 'Suspended'];

export const PlayerFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const playerId = route.params?.playerId;
  const initialTeamId = route.params?.teamId;
  const isEditing = Boolean(playerId);

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || '');
  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('Loosehead Prop');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [availability, setAvailability] = useState<PlayerAvailability>('Available');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadTeams();
    if (isEditing) {
      loadPlayer();
    }
  }, [playerId]);

  const loadTeams = async () => {
    try {
      const list = await TeamRepository.getAllTeams();
      setTeams(list);
      if (!selectedTeamId && list.length > 0) {
        setSelectedTeamId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPlayer = async () => {
    try {
      const p = await PlayerRepository.getPlayerById(playerId);
      if (p) {
        setName(p.name);
        setSelectedTeamId(p.teamId);
        setJerseyNumber(p.jerseyNumber.toString());
        setPosition(p.position as PlayerPosition);
        setAge(p.age ? p.age.toString() : '');
        setContact(p.contact || '');
        setAvailability(p.availability);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Player name is required';
    if (!jerseyNumber.trim() || isNaN(Number(jerseyNumber))) {
      errs.jerseyNumber = 'Valid jersey number is required';
    }
    if (!selectedTeamId) errs.team = 'Please select a team for this player';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (isEditing) {
        const existing = await PlayerRepository.getPlayerById(playerId);
        if (!existing) throw new Error('Player not found');
        await PlayerRepository.updatePlayer({
          ...existing,
          teamId: selectedTeamId,
          name: name.trim(),
          jerseyNumber: Number(jerseyNumber),
          position,
          age: Number(age) || 0,
          contact: contact.trim(),
          availability,
        });
      } else {
        await PlayerRepository.createPlayer({
          teamId: selectedTeamId,
          name: name.trim(),
          jerseyNumber: Number(jerseyNumber),
          position,
          age: Number(age) || 0,
          photo: '',
          contact: contact.trim(),
          availability,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Rugby Player' : 'Add Rugby Player'}
        subtitle={isEditing ? 'Update squad member' : 'Register player to team'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          {/* Team Selector */}
          <View style={styles.fieldSection}>
            <Text style={[Typography.caption, styles.fieldLabel]}>ASSIGNED TEAM *</Text>
            {errors.team && <Text style={styles.errorText}>{errors.team}</Text>}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teamSelectorScroll}
            >
              {teams.map((t) => {
                const isSelected = selectedTeamId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.teamChip, isSelected && styles.activeTeamChip]}
                    onPress={() => setSelectedTeamId(t.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.teamChipText,
                        isSelected && styles.activeTeamChipText,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Input
            label="Full Name *"
            placeholder="e.g. Kieran Vance"
            value={name}
            onChangeText={setName}
            error={errors.name}
            icon="person-outline"
          />

          <View style={styles.rowFields}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Input
                label="Jersey # *"
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={jerseyNumber}
                onChangeText={setJerseyNumber}
                error={errors.jerseyNumber}
                icon="shirt-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Age (Years)"
                placeholder="e.g. 25"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                icon="calendar-outline"
              />
            </View>
          </View>

          {/* Position Selector */}
          <View style={styles.fieldSection}>
            <Text style={[Typography.caption, styles.fieldLabel]}>RUGBY POSITION *</Text>
            <View style={styles.positionGrid}>
              {POSITIONS.map((pos) => {
                const isSelected = position === pos;
                return (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.posChip, isSelected && styles.activePosChip]}
                    onPress={() => setPosition(pos)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.posChipText,
                        isSelected && styles.activePosChipText,
                      ]}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Availability Selector */}
          <View style={styles.fieldSection}>
            <Text style={[Typography.caption, styles.fieldLabel]}>AVAILABILITY STATUS</Text>
            <View style={styles.statusRow}>
              {AVAILABILITY.map((st) => {
                const isSelected = availability === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusChip,
                      isSelected &&
                        (st === 'Available'
                          ? styles.statusAvailable
                          : st === 'Injured'
                          ? styles.statusInjured
                          : styles.statusSuspended),
                    ]}
                    onPress={() => setAvailability(st)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isSelected && styles.activeStatusText,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Contact Info (Optional)"
            placeholder="e.g. +64 21 0001"
            value={contact}
            onChangeText={setContact}
            icon="call-outline"
          />
        </Card>

        <Button
          title={isEditing ? 'Save Changes' : 'Register Player'}
          onPress={handleSave}
          variant="primary"
          size="large"
          loading={loading}
          icon="checkmark-circle-outline"
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
  formCard: {
    marginBottom: Spacing.lg,
  },
  fieldSection: {
    marginVertical: Spacing.xs,
  },
  fieldLabel: {
    marginBottom: 6,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  teamSelectorScroll: {
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  teamChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeTeamChip: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  teamChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTeamChipText: {
    color: Colors.textDark,
    fontWeight: '800',
  },
  rowFields: {
    flexDirection: 'row',
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  posChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activePosChip: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  posChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  activePosChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Spacing.buttonRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.primary,
  },
  statusInjured: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: Colors.accentGold,
  },
  statusSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: Colors.danger,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeStatusText: {
    color: Colors.white,
    fontWeight: '800',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 11,
    marginBottom: 4,
  },
});
