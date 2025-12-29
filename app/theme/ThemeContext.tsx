/**
 * Theme Context Provider
 * Manages dark/light mode with system preference detection
 */

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {useColorScheme, Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeMode, getThemeColors, LightColors, DarkColors} from './designTokens';

type ThemeContextType = {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: typeof LightColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@CampusIQ:themeMode';

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Determine actual theme based on mode
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  // Save theme preference
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  }, [isDark, setThemeMode]);

  const colors = getThemeColors(isDark);

  const value: ThemeContextType = {
    theme: isDark ? 'dark' : 'light',
    themeMode,
    colors,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

