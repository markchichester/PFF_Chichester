import { useState, useMemo } from 'react';
import { FilterBar } from './components/FilterBar';
import { BigBoard } from './components/BigBoard';
import { PlayerPool } from './components/PlayerPool';
import { Player } from './types';
import { useGoogleSheet } from './hooks/useGoogleSheet';
import { useLocalStorage } from './hooks/useLocalStorage';
import { motion } from 'framer-motion';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetId, setSheetId] = useLocalStorage<string>('googleSheetId', '');
  const [apiKey, setApiKey] = useLocalStorage<string>('googleApiKey', '');
  const [bigBoard, setBigBoard] = useLocalStorage<Player[]>('bigBoard', []);
  
  const { players, loading, error, syncFromGoogleSheet } = useGoogleSheet();

  const bigBoardPlayerIds = useMemo(
    () => new Set(bigBoard.map((p) => p.pff_id)),
    [bigBoard]
  );

  const handleSync = () => {
    if (sheetId) {
      syncFromGoogleSheet(sheetId, apiKey || undefined);
    } else {
      alert('Please enter a Google Sheet ID in the config');
    }
  };

  const handleAddPlayer = (player: Player) => {
    if (!bigBoardPlayerIds.has(player.pff_id)) {
      setBigBoard([...bigBoard, player]);
    }
  };

  const handleRemovePlayer = (player: Player) => {
    setBigBoard(bigBoard.filter((p) => p.pff_id !== player.pff_id));
  };

  const handleReorder = (newPlayers: Player[]) => {
    setBigBoard(newPlayers);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-primary-bg">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSync={handleSync}
        isSyncing={loading}
        sheetId={sheetId}
        onSheetIdChange={setSheetId}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
        >
          Error: {error}
        </motion.div>
      )}

      <div className="flex h-[calc(100vh-120px)]">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-1/2 border-r border-gray-700 bg-primary-bg"
        >
          <BigBoard
            players={bigBoard}
            onReorder={handleReorder}
            onRemove={handleRemovePlayer}
          />
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-1/2 bg-primary-bg"
        >
          <PlayerPool
            players={players}
            onAddPlayer={handleAddPlayer}
            bigBoardPlayerIds={bigBoardPlayerIds}
            searchQuery={searchQuery}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default App;

