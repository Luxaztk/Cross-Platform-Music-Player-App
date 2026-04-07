import { useState, useEffect, useCallback } from 'react';
import type { RecentSearch, RecentSearchInput } from '@music/types';
import { ElectronStorageAdapter } from '../../infrastructure/services/ElectronStorageAdapter';

const storage = new ElectronStorageAdapter();

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await storage.getRecentSearches();
        setRecentSearches(saved || []);
      } catch (err) {
        console.error('Failed to load recent searches:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Save history to storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      storage.saveRecentSearches(recentSearches).catch(err => {
        console.error('Failed to save recent searches:', err);
      });
    }
  }, [recentSearches, isLoaded]);

  const addSearch = useCallback((search: RecentSearchInput) => {
    setRecentSearches(prev => {
      const now = Date.now();
      const newSearch = { ...search, timestamp: now } as RecentSearch;

      // Filter out duplicates (same text for query, same id for entity)
      let newHistory = prev.filter(item => {
        if (item.type === 'query' && newSearch.type === 'query') {
          return item.text !== newSearch.text;
        }
        if (item.type === 'entity' && newSearch.type === 'entity') {
          return item.id !== newSearch.id;
        }
        return true;
      });

      // Add new to front
      newHistory = [newSearch, ...newHistory];

      // Maintain logic: 5 newest queries + 5 newest entities
      const queries = newHistory.filter(i => i.type === 'query').slice(0, 5);
      const entities = newHistory.filter(i => i.type === 'entity').slice(0, 5);

      return [...queries, ...entities].sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  const removeSearch = useCallback((timestamp: number) => {
    setRecentSearches(prev => prev.filter(item => item.timestamp !== timestamp));
  }, []);

  const clearAll = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearAll,
    isLoaded
  };
};
