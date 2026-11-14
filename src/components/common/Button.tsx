import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'outline' | 'scoreTry' | 'scoreConv' | 'scoreKick';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  subtitle?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  subtitle,
}) => {
  const getBackgroundColor = (): string => {
    if (disabled) return Colors.surfaceLight;
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.surfaceLight;
      case 'danger':
        return Colors.danger;
      case 'accent':
        return Colors.accentGold;
      case 'scoreTry':
        return '#059669'; // Try green
      case 'scoreConv':
        return '#2563EB'; // Conversion blue
      case 'scoreKick':
        return '#D97706'; // Penalty kick / Drop goal amber
      case 'outline':
        return Colors.transparent;
      default:
        return Colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return Colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'scoreTry':
      case 'scoreConv':
      case 'danger':
        return Colors.white;
      case 'accent':
      case 'scoreKick':
        return Colors.textDark;
      case 'outline':
        return Colors.textPrimary;
      default:
        return Colors.textPrimary;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') return Colors.borderLight;
    return Colors.transparent;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 22 : 18}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                size === 'small' && styles.textSmall,
                size === 'large' && styles.textLarge,
                { color: getTextColor() },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: getTextColor(), opacity: 0.8 },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
