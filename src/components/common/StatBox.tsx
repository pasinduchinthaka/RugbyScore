import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../theme';

interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  subValue?: string;
  style?: ViewStyle;
}

export const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  icon,
  color = Colors.primary,
  subValue,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        {icon && (
          <View style={[styles.iconBg, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
        )}
        <Text style={[Typography.caption, styles.label]}>{label}</Text>
      </View>
      <Text style={[Typography.h1, styles.value, { color: Colors.textPrimary }]}>
        {value}
      </Text>
      {subValue ? (
        <Text style={[Typography.caption, styles.subValue]}>{subValue}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flex: 1,
    minWidth: 140,
    margin: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  label: {
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  subValue: {
    color: Colors.textMuted,
    marginTop: 2,
  },
});
