import { useCallback, useRef } from 'react';
import type { DailyProgress, Guess } from '../types';
import { getTodayString } from '../utils/locations';

const STORAGE_KEY = 'newyawkr-daily-progress';

export function useDailyProgress() {
  // Use ref to avoid recreation
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProgress = useCallback((): DailyProgress | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const progress: DailyProgress = JSON.parse(stored);

      // Check if it's today's progress
      if (progress.date !== getTodayString()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return progress;
    } catch {
      return null;
    }
  }, []);

  const saveProgress = useCallback((
    roundsPlayed: number,
    guesses: Guess[],
    totalScore: number,
    isComplete: boolean
  ) => {
    // Debounce saves to prevent excessive writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const progress: DailyProgress = {
        date: getTodayString(),
        roundsPlayed,
        guesses,
        totalScore,
        isComplete,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch {
        console.error('Failed to save progress');
      }
    }, 100);
  }, []);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    loadProgress,
    saveProgress,
    clearProgress,
  };
}
