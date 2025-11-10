import { useState, useCallback } from 'react';
import { Player } from '../types';
import { fetchPlayersFromGoogleSheet } from '../utils/googleSheetClient';

export function useGoogleSheet() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncFromGoogleSheet = useCallback(async (sheetId: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPlayers = await fetchPlayersFromGoogleSheet(sheetId, apiKey);
      setPlayers(fetchedPlayers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch from Google Sheet';
      setError(errorMessage);
      console.error('Error syncing from Google Sheet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    players,
    loading,
    error,
    syncFromGoogleSheet,
  };
}

