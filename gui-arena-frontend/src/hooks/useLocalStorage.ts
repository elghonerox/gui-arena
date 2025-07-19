import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Arena-specific localStorage hooks
export const useArenaSettings = () => {
  const [settings, setSettings] = useLocalStorage('arena-settings', {
    enableSoundEffects: true,
    enableVibration: true,
    enableParticles: true,
    theme: 'dark',
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  return [settings, setSettings] as const;
};

export const useVotingHistory = () => {
  const [votingHistory, setVotingHistory] = useLocalStorage<number[]>('arena-voting-history', []);

  const addVote = (memeId: number) => {
    setVotingHistory(prev => [...prev, memeId]);
  };

  const hasVoted = (memeId: number) => {
    return votingHistory.includes(memeId);
  };

  const clearHistory = () => {
    setVotingHistory([]);
  };

  return {
    votingHistory,
    addVote,
    hasVoted,
    clearHistory
  };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage<number[]>('arena-favorites', []);

  const addFavorite = (memeId: number) => {
    setFavorites(prev => [...prev, memeId]);
  };

  const removeFavorite = (memeId: number) => {
    setFavorites(prev => prev.filter(id => id !== memeId));
  };

  const isFavorite = (memeId: number) => {
    return favorites.includes(memeId);
  };

  const toggleFavorite = (memeId: number) => {
    if (isFavorite(memeId)) {
      removeFavorite(memeId);
    } else {
      addFavorite(memeId);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
};