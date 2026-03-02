import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { AppState, UserProfile, DayProgress, Soundscape, FontSize } from '@/types';

const STORAGE_KEY = 'first30_app_state';

const defaultState: AppState = {
  user: null,
  currentDay: 1,
  progress: [],
  streakCount: 0,
  lastCompletedDate: null,
  journeyComplete: false,
  ambientMuted: false,
  soundscape: 'piano',
  darkMode: false,
  fontSize: 'normal',
};

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function calculateStreak(progress: DayProgress[], lastCompletedDate: string | null): number {
  if (!lastCompletedDate) return 0;

  const today = getDateString();
  const yesterday = getDateString(new Date(Date.now() - 86400000));
  const twoDaysAgo = getDateString(new Date(Date.now() - 172800000));

  if (lastCompletedDate !== today && lastCompletedDate !== yesterday && lastCompletedDate !== twoDaysAgo) {
    return 0;
  }

  let streak = 0;
  const sortedProgress = [...progress]
    .filter(p => p.completed && p.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (sortedProgress.length === 0) return 0;

  let checkDate = lastCompletedDate === today ? today : lastCompletedDate;
  for (const p of sortedProgress) {
    const pDate = p.completedAt!.split('T')[0];
    if (pDate === checkDate) {
      streak++;
      checkDate = getDateString(new Date(new Date(checkDate).getTime() - 86400000));
    } else if (pDate < checkDate) {
      break;
    }
  }

  return Math.max(streak, 1);
}

async function scheduleReminderNotification(reminderTime: string) {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Notifications] Permission denied');
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [timePart, period] = reminderTime.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const messages = [
      "Let's take 5 minutes together.",
      "Your prayer time is waiting.",
      "Start again today. That's growth.",
      "A moment with God changes everything.",
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'First 30',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    console.log('[Notifications] Scheduled daily reminder at', hour, ':', minute);
  } catch (e) {
    console.log('[Notifications] Failed to schedule:', e);
  }
}

export { scheduleReminderNotification };

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AppState>(defaultState);

  const stateQuery = useQuery({
    queryKey: ['appState'],
    queryFn: async (): Promise<AppState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        const streak = calculateStreak(parsed.progress, parsed.lastCompletedDate);
        return {
          ...defaultState,
          ...parsed,
          streakCount: streak,
        };
      }
      return defaultState;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newState: AppState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appState'] });
    },
  });

  useEffect(() => {
    if (stateQuery.data) {
      setState(stateQuery.data);
    }
  }, [stateQuery.data]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const completeOnboarding = useCallback((user: UserProfile) => {
    updateState({ user: { ...user, onboardingComplete: true } });
  }, [updateState]);

  const completeDay = useCallback((day: number, duration: number) => {
    const today = getDateString();
    const existingProgress = state.progress.filter(p => p.day !== day);
    const newProgress: DayProgress = {
      day,
      completed: true,
      completedAt: new Date().toISOString(),
      duration,
    };
    const updatedProgress = [...existingProgress, newProgress];
    const newStreak = calculateStreak(updatedProgress, today);
    const nextDay = Math.min(day + 1, 30);
    const journeyComplete = day === 30;

    updateState({
      progress: updatedProgress,
      currentDay: journeyComplete ? 30 : nextDay,
      streakCount: newStreak,
      lastCompletedDate: today,
      journeyComplete,
    });
  }, [state.progress, updateState]);

  const isTodayComplete = useMemo(() => {
    const today = getDateString();
    return state.progress.some(
      p => p.day === state.currentDay && p.completed && p.completedAt?.startsWith(today)
    );
  }, [state.progress, state.currentDay]);

  const hasCompletedSessionToday = useMemo(() => {
    const today = getDateString();
    return state.progress.some(p => p.completed && p.completedAt?.startsWith(today));
  }, [state.progress]);

  const graceWindowRemaining = useMemo((): number | null => {
    if (!state.lastCompletedDate) return null;
    const today = getDateString();
    const yesterday = getDateString(new Date(Date.now() - 86400000));
    const twoDaysAgo = getDateString(new Date(Date.now() - 172800000));
    if (state.lastCompletedDate === today) return null;
    if (state.lastCompletedDate === yesterday) return 1;
    if (state.lastCompletedDate === twoDaysAgo) return 0;
    return null;
  }, [state.lastCompletedDate]);

  const resetJourney = useCallback(() => {
    updateState({
      currentDay: 1,
      progress: [],
      streakCount: 0,
      lastCompletedDate: null,
      journeyComplete: false,
    });
  }, [updateState]);

  const continueDaily = useCallback(() => {
    updateState({
      journeyComplete: false,
      currentDay: 1,
    });
  }, [updateState]);

  const toggleAmbientMute = useCallback(() => {
    setState(prev => {
      const next = { ...prev, ambientMuted: !prev.ambientMuted };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const setSoundscape = useCallback((soundscape: Soundscape) => {
    updateState({ soundscape });
  }, [updateState]);

  const toggleDarkMode = useCallback(() => {
    setState(prev => {
      const next = { ...prev, darkMode: !prev.darkMode };
      saveMutation.mutate(next);
      return next;
    });
  }, [saveMutation]);

  const setFontSize = useCallback((fontSize: FontSize) => {
    updateState({ fontSize });
  }, [updateState]);

  return {
    state,
    isLoading: stateQuery.isLoading,
    completeOnboarding,
    completeDay,
    isTodayComplete,
    hasCompletedSessionToday,
    graceWindowRemaining,
    resetJourney,
    continueDaily,
    toggleAmbientMute,
    setSoundscape,
    toggleDarkMode,
    setFontSize,
  };
});
