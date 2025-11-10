import { Player } from '../types';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerRowProps {
  player: Player;
  onRemove?: () => void;
  isDragging?: boolean;
  onClick?: () => void;
  showRemoveButton?: boolean;
}

export function PlayerRow({ player, onRemove, isDragging, onClick, showRemoveButton = false }: PlayerRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileHover={!isDragging ? { scale: 1.02, x: 4 } : {}}
      className={`
        bg-gray-800 rounded-2xl p-4 mb-2 cursor-pointer
        border border-gray-700 hover:border-accent-cyan hover:shadow-lg hover:shadow-accent-cyan/20
        transition-all duration-200
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-white font-semibold text-lg truncate">{player.name}</h3>
            <span className="px-2 py-1 bg-accent-cyan/20 text-accent-cyan rounded text-sm font-medium whitespace-nowrap">
              {player.Position}
            </span>
            {player['2025 PFF Grade'] && (
              <span className="px-2 py-1 bg-gray-700 text-white rounded text-sm whitespace-nowrap">
                Grade: {player['2025 PFF Grade']}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-300">
            <span className="truncate">
              <span className="text-gray-400">School:</span> {player.School}
            </span>
            {player['2025 PFF WAA'] && (
              <span className="truncate">
                <span className="text-gray-400">WAA:</span> {player['2025 PFF WAA']}
              </span>
            )}
          </div>
          {player.analysis && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{player.analysis}</p>
          )}
        </div>
        {showRemoveButton && onRemove && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

