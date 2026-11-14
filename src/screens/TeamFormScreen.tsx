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
import { TeamRepository } from '../database/teamRepository';
import { OrganizationType } from '../types';

const ORG_TYPES: OrganizationType[] = [
  'Club',
  'University',
  'School',
  'National',
  'Regional',
  'Other',
];

export const TeamFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const teamId = route.params?.teamId;
  const isEditing = Boolean(teamId);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('Club');
  const [coach, setCoach] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditing) {
      loadTeam();
    }
  }, [teamId]);

  const loadTeam = async () => {
    try {
      const t = await TeamRepository.getTeamById(teamId);
      if (t) {
        setName(t.name);
        setCountry(t.country);
        setOrgType(t.organizationType);
        setCoach(t.coach || '');
        setContact(t.contact || '');
        setDescription(t.description || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Team name is required';
    if (!country.trim()) errs.country = 'Country / Region is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (isEditing) {
        const existing = await TeamRepository.getTeamById(teamId);
        if (!existing) throw new Error('Team not found');
        await TeamRepository.updateTeam({
          ...existing,
          name: name.trim(),
          country: country.trim(),
          organizationType: orgType,
          coach: coach.trim(),
          contact: contact.trim(),
          description: description.trim(),
        });
      } else {
        await TeamRepository.createTeam({
          name: name.trim(),
          logo: 'shield',
          country: country.trim(),
          organizationType: orgType,
          coach: coach.trim(),
          contact: contact.trim(),
          description: description.trim(),
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Rugby Team' : 'Create Rugby Team'}
        subtitle={isEditing ? 'Update team profile' : 'Add new independent team'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Input
            label="Team Name *"
            placeholder="e.g. Pacific Stormers RFC"
            value={name}
            onChangeText={setName}
            error={errors.name}
            icon="shield-outline"
          />

          <Input
            label="Country / Region *"
            placeholder="e.g. New Zealand, England, Fiji"
            value={country}
            onChangeText={setCountry}
            error={errors.country}
            icon="globe-outline"
          />

          <View style={styles.fieldSection}>
            <Text style={[Typography.caption, styles.fieldLabel]}>
              ORGANIZATION TYPE *
            </Text>
            <View style={styles.orgRow}>
              {ORG_TYPES.map((org) => {
                const isSelected = orgType === org;
                return (
                  <TouchableOpacity
                    key={org}
                    style={[styles.orgChip, isSelected && styles.activeOrgChip]}
                    onPress={() => setOrgType(org)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.orgText,
                        isSelected && styles.activeOrgText,
                      ]}
                    >
                      {org}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Head Coach Name"
            placeholder="e.g. David Vance"
            value={coach}
            onChangeText={setCoach}
            icon="person-outline"
          />

          <Input
            label="Contact Information (Phone / Email)"
            placeholder="e.g. contact@team.org"
            value={contact}
            onChangeText={setContact}
            icon="call-outline"
          />

          <Input
            label="Team Description / Honors"
            placeholder="e.g. Formed in 2012, 3x Regional Champions"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70 }}
          />
        </Card>

        <Button
          title={isEditing ? 'Save Changes' : 'Create Team'}
          onPress={handleSave}
          variant="primary"
          size="large"
          loading={loading}
          icon="checkmark-circle-outline"
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
  orgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  orgChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Spacing.pillRadius,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeOrgChip: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  orgText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeOrgText: {
    color: Colors.white,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
