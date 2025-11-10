import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  sheetId: string;
  onSheetIdChange: (id: string) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  onSync,
  isSyncing,
  sheetId,
  onSheetIdChange,
  apiKey,
  onApiKeyChange,
}: FilterBarProps) {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-primary-bg border-b border-gray-700 p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, school, position, or grade..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            Config
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-primary-bg font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Google Sheet'}
          </motion.button>
        </div>

        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700"
          >
            <div>
              <label className="block text-sm text-gray-300 mb-1">Google Sheet ID</label>
              <input
                type="text"
                value={sheetId}
                onChange={(e) => onSheetIdChange(e.target.value)}
                placeholder="Enter Sheet ID"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">API Key (optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="Enter API Key (optional)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

