import { HistoryItem } from '../types';

const STORAGE_KEY = 'koko-history';
const MAX_HISTORY = 50;

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    // Add to top, slice to max
    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save history', e);
    return [];
  }
};

export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
};