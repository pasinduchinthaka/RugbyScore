import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: { [key: string]: TextStyle } = {
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodySecondary: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreLarge: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerLarge: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
};
