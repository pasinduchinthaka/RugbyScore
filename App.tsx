import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from './src/database/db';
import { hasExistingData, seedSampleData } from './src/database/sampleData';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        const db = await getDatabase();
        const hasData = await hasExistingData();
        if (!hasData) {
          await seedSampleData();
        }
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setDbReady(true);
      }
    }
    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
