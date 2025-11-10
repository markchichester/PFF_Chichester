import { Player } from '../types';
import { PlayerRow } from './PlayerRow';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface BigBoardProps {
  players: Player[];
  onReorder: (players: Player[]) => void;
  onRemove: (player: Player) => void;
}

function SortablePlayerRow({ player, onRemove }: { player: Player; onRemove: (player: Player) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.pff_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-accent-cyan transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <PlayerRow
          player={player}
          onRemove={() => onRemove(player)}
          isDragging={isDragging}
          showRemoveButton
        />
      </div>
    </div>
  );
}

export function BigBoard({ players, onReorder, onRemove }: BigBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = players.findIndex((p) => p.pff_id === active.id);
      const newIndex = players.findIndex((p) => p.pff_id === over.id);
      const newPlayers = arrayMove(players, oldIndex, newIndex);
      onReorder(newPlayers);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">My Big Board</h2>
        <p className="text-gray-400 text-sm mt-1">{players.length} players</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {players.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 mt-20"
          >
            <p className="text-lg">Your Big Board is empty</p>
            <p className="text-sm mt-2">Drag or click players from the pool to add them</p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={players.map((p) => p.pff_id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.div
                    key={player.pff_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SortablePlayerRow player={player} onRemove={onRemove} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

