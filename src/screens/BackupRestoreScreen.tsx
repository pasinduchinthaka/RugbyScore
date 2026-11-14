import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { Header, Card, Button, ConfirmDialog } from '../components/common';
import { BackupService } from '../database/backupService';
import { seedSampleData, clearAllData } from '../database/sampleData';

export const BackupRestoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
  const [restoreConfirmVisible, setRestoreConfirmVisible] = useState(false);

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      const res = await BackupService.exportBackup();
      if (res.success) {
        Alert.alert(
          'Backup Ready',
          'Database exported successfully. You can share or save your JSON backup file to transfer to another device.'
        );
      } else {
        Alert.alert('Export Failed', res.error || 'Unable to export backup.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setLoading(true);
      const res = await BackupService.pickAndRestoreBackup();
      if (res.success && res.restoredCounts) {
        Alert.alert(
          'Restore Successful',
          `Successfully restored:\n• ${res.restoredCounts.teamsCount} Teams\n• ${res.restoredCounts.playersCount} Players\n• ${res.restoredCounts.matchesCount} Matches\n• ${res.restoredCounts.eventsCount} Events\n• ${res.restoredCounts.resultsCount} Results`
        );
      } else if (res.error) {
        if (!res.error.includes('cancelled')) {
          Alert.alert('Restore Failed', res.error);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSampleData = async () => {
    setResetConfirmVisible(false);
    try {
      setLoading(true);
      await clearAllData();
      await seedSampleData();
      Alert.alert(
        'Database Reset',
        'Sample dataset (4 generic rugby teams, 20 players, 5 historical matches) has been loaded successfully.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Backup & Restore"
        subtitle="Offline database management"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[Typography.h3, styles.infoTitle]}>
                100% Offline SQLite Storage
              </Text>
              <Text style={[Typography.bodySecondary, styles.infoText]}>
                All matches, teams, and scores are stored exclusively on your device. Export a backup file to keep long-term archives safe or transfer to another phone.
              </Text>
            </View>
          </View>
        </Card>

        {/* Export Backup Section */}
        <Card style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="share-social-outline" size={24} color={Colors.accentBlue} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={Typography.h3}>Export Database Backup</Text>
              <Text style={[Typography.bodySecondary, styles.actionDesc]}>
                Creates a validated JSON backup containing all teams, players, matches, and historical scoring events.
              </Text>
            </View>
          </View>

          <Button
            title="Export & Share Backup"
            variant="primary"
            size="large"
            icon="download-outline"
            loading={loading}
            onPress={handleExportBackup}
            style={styles.cardBtn}
          />
        </Card>

        {/* Import Backup Section */}
        <Card style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="folder-open-outline" size={24} color={Colors.accentGold} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={Typography.h3}>Import & Restore Backup</Text>
              <Text style={[Typography.bodySecondary, styles.actionDesc]}>
                Select an exported RugbyScore JSON backup file from your device to restore records without duplicate conflicts.
              </Text>
            </View>
          </View>

          <Button
            title="Select & Restore File"
            variant="accent"
            size="large"
            icon="refresh-outline"
            loading={loading}
            onPress={handleImportBackup}
            style={styles.cardBtn}
          />
        </Card>

        {/* Demo / Sample Data Management */}
        <Card style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="server-outline" size={24} color={Colors.accentPurple} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={Typography.h3}>Sample Dataset</Text>
              <Text style={[Typography.bodySecondary, styles.actionDesc]}>
                Reset to generic demonstration rugby data (4 teams, 20 players, 5 matches) for testing and evaluation.
              </Text>
            </View>
          </View>

          <Button
            title="Reload Sample Data"
            variant="outline"
            size="medium"
            icon="reload"
            loading={loading}
            onPress={() => setResetConfirmVisible(true)}
            style={styles.cardBtn}
          />
        </Card>
      </ScrollView>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        visible={resetConfirmVisible}
        title="Reset to Sample Data?"
        message="This will replace current local records with the generic 4-team demonstration rugby dataset. Continue?"
        confirmTitle="Reset Dataset"
        confirmVariant="danger"
        onConfirm={handleResetSampleData}
        onCancel={() => setResetConfirmVisible(false)}
      />
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
  infoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTitle: {
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  infoText: {
    lineHeight: 18,
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  actionHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionDesc: {
    marginTop: 3,
    lineHeight: 18,
  },
  cardBtn: {
    marginTop: Spacing.xs,
  },
});
