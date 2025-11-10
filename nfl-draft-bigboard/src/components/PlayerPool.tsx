import { useState, useMemo } from 'react';
import { Player, SortField, SortDirection } from '../types';
import { PlayerRow } from './PlayerRow';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PlayerPoolProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  bigBoardPlayerIds: Set<string>;
  searchQuery: string;
}

export function PlayerPool({ players, onAddPlayer, bigBoardPlayerIds, searchQuery }: PlayerPoolProps) {
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('');

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter((player) => {
      if (bigBoardPlayerIds.has(player.pff_id)) return false;
      
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        player.name.toLowerCase().includes(query) ||
        player.School.toLowerCase().includes(query) ||
        player.Position.toLowerCase().includes(query) ||
        player['2025 PFF Grade']?.toLowerCase().includes(query) ||
        player.analysis?.toLowerCase().includes(query)
      );
    });

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [players, bigBoardPlayerIds, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField('');
        setSortDirection('');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-accent-cyan" />
    ) : (
      <ArrowDown className="w-4 h-4 text-accent-cyan" />
    );
  };

  const columns: { key: keyof Player; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'Position', label: 'Position' },
    { key: 'School', label: 'School' },
    { key: '2025 PFF Grade', label: 'PFF Grade' },
    { key: '2025 PFF WAA', label: 'WAA' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">Player Pool</h2>
        <p className="text-gray-400 text-sm mt-1">{filteredAndSortedPlayers.length} available players</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
            <div className="grid grid-cols-12 gap-4 p-3 text-sm font-semibold text-gray-300">
              {columns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-2 hover:text-accent-cyan transition-colors text-left"
                >
                  {col.label}
                  {getSortIcon(col.key)}
                </button>
              ))}
              <div className="col-span-2 text-gray-400">Analysis</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {filteredAndSortedPlayers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 mt-20"
          >
            <p className="text-lg">No players found</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Sync from Google Sheet to load players'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedPlayers.map((player, index) => (
              <motion.div
                key={player.pff_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <PlayerRow
                  player={player}
                  onClick={() => onAddPlayer(player)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

