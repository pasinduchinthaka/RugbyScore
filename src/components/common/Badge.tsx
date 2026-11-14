import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { MatchStatus } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'live' | 'completed' | 'scheduled' | 'halfTime' | 'draw' | 'primary' | 'warning' | 'neutral';
  status?: MatchStatus;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  status,
  style,
}) => {
  let activeVariant = variant;
  if (status) {
    if (status === 'LIVE_FIRST_HALF' || status === 'LIVE_SECOND_HALF' || status === 'EXTRA_TIME') {
      activeVariant = 'live';
    } else if (status === 'HALF_TIME') {
      activeVariant = 'halfTime';
    } else if (status === 'COMPLETED') {
      activeVariant = 'completed';
    } else {
      activeVariant = 'scheduled';
    }
  }

  const getBadgeStyle = () => {
    switch (activeVariant) {
      case 'live':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: Colors.statusLive, text: Colors.statusLive };
      case 'halfTime':
        return { bg: 'rgba(245, 158, 11, 0.2)', border: Colors.statusHalfTime, text: Colors.statusHalfTime };
      case 'completed':
        return { bg: 'rgba(16, 185, 129, 0.2)', border: Colors.statusCompleted, text: Colors.statusCompleted };
      case 'scheduled':
        return { bg: 'rgba(96, 165, 250, 0.2)', border: Colors.statusScheduled, text: Colors.statusScheduled };
      case 'draw':
        return { bg: 'rgba(139, 92, 246, 0.2)', border: Colors.accentPurple, text: Colors.accentPurple };
      case 'warning':
        return { bg: 'rgba(249, 115, 22, 0.2)', border: Colors.accentOrange, text: Colors.accentOrange };
      case 'primary':
        return { bg: 'rgba(16, 185, 129, 0.2)', border: Colors.primary, text: Colors.primaryLight };
      default:
        return { bg: Colors.surfaceLight, border: Colors.border, text: Colors.textSecondary };
    }
  };

  const current = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
        style,
      ]}
    >
      {activeVariant === 'live' && <View style={styles.livePulse} />}
      <Text style={[Typography.badge, { color: current.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
    marginRight: 5,
  },
});
