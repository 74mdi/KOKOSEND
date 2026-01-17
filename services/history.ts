import { HistoryItem } from '../types';

const STORAGE_KEY = 'koko-history';
const MAX_HISTORY = 50;

/**
 * Safe Storage Access Wrapper
 * Prevents SecurityError in sandboxed/restricted environments (e.g. Safari Private Mode, iframes)
 */
export const storage = {
  get: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage access restricted:', e);
    }
    return null;
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage write restricted:', e);
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage remove restricted:', e);
    }
  }
};

/**
 * Safe UUID Generator
 * Fallback for environments where crypto.randomUUID is not available (e.g. non-secure contexts)
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const getHistory = (): HistoryItem[] => {
  const stored = storage.get(STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: generateId(),
    timestamp: Date.now(),
  };
  
  // Add to top, slice to max
  const updated = [newItem, ...history].slice(0, MAX_HISTORY);
  storage.set(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = () => {
  storage.remove(STORAGE_KEY);
};