/**
 * Preferences Store - Estado de Preferencias del Usuario
 * 
 * Maneja:
 * - Ventana de sueño
 * - Horarios de comidas
 * - Timezone
 * - Configuración de notificaciones
 * 
 * Persistido con AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '@/types';

interface PreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  setSleepWindow: (start: string, end: string) => void;
  setMealTimes: (breakfast?: string, lunch?: string, dinner?: string) => void;
  setTimezone: (timezone: string) => void;
  resetToDefaults: () => void;
}

// Valores por defecto
const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'local',
  nightShiftMode: false,
  doNotDisturb: false,
  allowSleepInterruptions: false,
  sleepWindow: {
    start: '23:00',
    end: '07:00',
  },
  mealTimes: {
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '20:00',
  },
  alarmSound: 'alarm1.mp3', // Sonido por defecto
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      isLoading: false,
      error: null,

      updatePreferences: (partial) =>
        set((state) => ({
          preferences: { ...state.preferences, ...partial },
          error: null,
        })),

      setSleepWindow: (start, end) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            sleepWindow: { start, end },
          },
          error: null,
        })),

      setMealTimes: (breakfast, lunch, dinner) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            mealTimes: {
              breakfast: breakfast || state.preferences.mealTimes?.breakfast,
              lunch: lunch || state.preferences.mealTimes?.lunch,
              dinner: dinner || state.preferences.mealTimes?.dinner,
            },
          },
          error: null,
        })),

      setTimezone: (timezone) =>
        set((state) => ({
          preferences: { ...state.preferences, timezone },
          error: null,
        })),

      resetToDefaults: () =>
        set({
          preferences: DEFAULT_PREFERENCES,
          error: null,
        }),
    }),
    {
      name: 'photolarm-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
