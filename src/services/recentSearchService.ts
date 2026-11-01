/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY = 'aerion_recent_searches';

export const INITIAL_DEFAULT_SEARCHES = [
  'RS-25 Engine',
  'Grid Fins',
  'Flight Computer',
  'Turbopump',
  'Thermal Tiles'
];

export const RecentSearchService = {
  /**
   * Retrieves the current list of recent searches from localStorage.
   */
  getRecentSearches: (): string[] => {
    if (typeof window === 'undefined') return INITIAL_DEFAULT_SEARCHES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }
      }
      // Populate initial default queries on first access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_SEARCHES));
      return INITIAL_DEFAULT_SEARCHES;
    } catch {
      return INITIAL_DEFAULT_SEARCHES;
    }
  },

  /**
   * Adds or bumps a search query to the top of recent searches.
   * Limits stored queries to maximum 8 entries and deduplicates case-insensitively.
   */
  addRecentSearch: (query: string): string[] => {
    const trimmed = query.trim();
    if (!trimmed) return RecentSearchService.getRecentSearches();

    try {
      const current = RecentSearchService.getRecentSearches();
      const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [trimmed];
    }
  },

  /**
   * Removes an individual search query from recent searches.
   */
  removeRecentSearch: (query: string): string[] => {
    try {
      const current = RecentSearchService.getRecentSearches();
      const updated = current.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Clears all recent searches from localStorage.
   */
  clearRecentSearches: (): string[] => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
    return [];
  }
};
