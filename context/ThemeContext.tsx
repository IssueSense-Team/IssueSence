import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeColors;
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
    colors: ThemeColors; // Alias for theme for easier access
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isReady, setIsReady] = useState(false);

    // Load saved preference on mount
    useEffect(() => {
        (async () => {
            try {
                const savedMode = await AsyncStorage.getItem('themeMode');
                if (savedMode) {
                    setModeState(savedMode as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await AsyncStorage.setItem('themeMode', newMode);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    // Determine active theme
    const activeScheme = mode === 'system' ? (systemScheme || 'light') : mode;
    const theme = Colors[activeScheme as 'light' | 'dark'];
    const isDark = activeScheme === 'dark';

    if (!isReady) {
        return null; // Or a splash screen
    }

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, isDark, colors: theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
