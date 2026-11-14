import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSearch?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  isSearch = false,
  onClear,
  style,
  value,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={[Typography.caption, styles.label]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isSearch && styles.searchContainer,
          error ? styles.inputError : null,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={Colors.textMuted}
            style={styles.leadingIcon}
          />
        )}
        <TextInput
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, style]}
          value={value}
          {...props}
        />
        {isSearch && value && value.length > 0 && onClear && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[Typography.caption, styles.errorText]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  label: {
    marginBottom: 6,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.inputRadius,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  searchContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Spacing.pillRadius,
  },
  leadingIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    marginTop: 4,
  },
});
