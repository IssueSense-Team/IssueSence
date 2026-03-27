/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const tintColorLight = '#7A4FFF';
const tintColorDark = '#9D7BFF';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#666666',
    textMuted: '#999999',
    background: '#F8F9FE',
    card: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.85)',
    surfaceHighlight: 'rgba(199, 42, 42, 0.95)',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E8E8E8',
    borderMuted: 'rgba(0,0,0,0.05)',
    primary: '#7A4FFF',
    primaryGradient: ['#7A4FFF', '#6236FF'],
    danger: '#FF3B30',
    dangerBackground: 'rgba(255, 59, 48, 0.1)',
    success: '#34C759',
    successBackground: 'rgba(52, 199, 89, 0.15)',
    warning: '#FF9500',
    warningBackground: 'rgba(255, 149, 0, 0.15)',
    inputBackground: '#F8F9FE',
    glassBorder: 'rgba(255,255,255,0.8)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#6B7280',
    background: '#151718',
    card: '#1E1E1E',
    surface: 'rgba(30, 41, 59, 0.6)',
    surfaceHighlight: 'rgba(30, 41, 59, 0.8)',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2C2C2C',
    borderMuted: 'rgba(255,255,255,0.1)',
    primary: '#9D7BFF',
    primaryGradient: ['#9D7BFF', '#7A4FFF'],
    danger: '#FF453A',
    dangerBackground: 'rgba(255, 69, 58, 0.15)',
    success: '#30D158',
    successBackground: 'rgba(48, 209, 88, 0.15)',
    warning: '#FF9F0A',
    warningBackground: 'rgba(255, 159, 10, 0.15)',
    inputBackground: '#2C2C2C',
    glassBorder: 'rgba(255,255,255,0.35)',
  },
};

export type ThemeColors = typeof Colors.light;
