import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { TeamsScreen } from '../screens/TeamsScreen';
import { TeamDetailScreen } from '../screens/TeamDetailScreen';
import { TeamFormScreen } from '../screens/TeamFormScreen';
import { PlayersScreen } from '../screens/PlayersScreen';
import { PlayerDetailScreen } from '../screens/PlayerDetailScreen';
import { PlayerFormScreen } from '../screens/PlayerFormScreen';
import { CreateMatchScreen } from '../screens/CreateMatchScreen';
import { MatchTossScreen } from '../screens/MatchTossScreen';
import { LiveScoringScreen } from '../screens/LiveScoringScreen';
import { MatchResultScreen } from '../screens/MatchResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HistoricalMatchReportScreen } from '../screens/HistoricalMatchReportScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { BackupRestoreScreen } from '../screens/BackupRestoreScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.accentGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'shield';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Teams') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Players') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'podium' : 'podium-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Teams" component={TeamsScreen} options={{ tabBarLabel: 'Teams' }} />
      <Tab.Screen name="Players" component={PlayersScreen} options={{ tabBarLabel: 'Players' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Stats" component={StatisticsScreen} options={{ tabBarLabel: 'Statistics' }} />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} />

        {/* Team Screens */}
        <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
        <Stack.Screen name="TeamForm" component={TeamFormScreen} />

        {/* Player Screens */}
        <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
        <Stack.Screen name="PlayerForm" component={PlayerFormScreen} />

        {/* Match Flows */}
        <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
        <Stack.Screen name="MatchToss" component={MatchTossScreen} />
        <Stack.Screen
          name="LiveScoring"
          component={LiveScoringScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="MatchResult"
          component={MatchResultScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="HistoricalMatchReport" component={HistoricalMatchReportScreen} />

        {/* Backup & System */}
        <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
