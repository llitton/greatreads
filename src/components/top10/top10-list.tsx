'use client';

import { useState } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TopTenBook {
  id: string;
  rank: number;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

interface SortableItemProps {
  item: TopTenBook;
  onRemove: (bookId: string) => void;
}

function SortableItem({ item, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.book.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-5 p-5 bg-white rounded-2xl border border-black/5 group transition-all duration-150 ${
        isDragging
          ? 'shadow-xl scale-[1.02] border-neutral-200'
          : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Rank - ceremonial, serif */}
      <span className="w-10 h-10 flex items-center justify-center text-2xl font-serif text-neutral-300 flex-shrink-0">
        {item.rank}
      </span>

      {/* Book cover - larger */}
      {item.book.coverUrl ? (
        <img
          src={item.book.coverUrl}
          alt=""
          className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-20 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-2xl">📕</span>
        </div>
      )}

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1f1a17] mb-1">{item.book.title}</p>
        {item.book.author && (
          <p className="text-sm text-neutral-500">{item.book.author}</p>
        )}
      </div>

      {/* Drag handle - subtle */}
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-neutral-200 hover:text-neutral-400 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.book.id)}
        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-all"
        aria-label="Remove"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface Top10ListProps {
  items: TopTenBook[];
  onReorder: (items: Array<{ bookId: string; rank: number }>) => Promise<void>;
  onRemove: (bookId: string) => Promise<void>;
}

// Prompts for empty slots
const slotPrompts: Record<number, string> = {
  1: 'Your most important book',
  2: 'A book you reread',
  3: 'A book you argue with',
  4: 'A book that surprised you',
  5: 'A book you give to people',
  6: 'A book that changed your mind',
  7: 'A book from your childhood',
  8: 'A book you wish you wrote',
  9: 'A book you think about often',
  10: 'A book you discovered late',
};

export function Top10List({ items, onReorder, onRemove }: Top10ListProps) {
  const [localItems, setLocalItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.book.id === active.id);
      const newIndex = localItems.findIndex((item) => item.book.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

      setLocalItems(newItems);

      await onReorder(
        newItems.map((item) => ({
          bookId: item.book.id,
          rank: item.rank,
        }))
      );
    }
  };

  const handleRemove = async (bookId: string) => {
    const newItems = localItems
      .filter((item) => item.book.id !== bookId)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    setLocalItems(newItems);
    await onRemove(bookId);
  };

  // Calculate empty slots to show
  const emptySlots = Array.from({ length: 10 - localItems.length }, (_, i) => localItems.length + i + 1);

  return (
    <div className="space-y-8">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.book.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {localItems.map((item) => (
              <SortableItem key={item.book.id} item={item} onRemove={handleRemove} />
            ))}

            {/* Empty slots - inviting prompts */}
            {emptySlots.map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-5 p-5 rounded-2xl bg-neutral-50/30 border border-dashed border-neutral-200/60"
              >
                {/* Rank - ceremonial */}
                <span className="w-10 h-10 flex items-center justify-center text-2xl font-serif text-neutral-200 flex-shrink-0">
                  {rank}
                </span>
                {/* Placeholder cover */}
                <div className="w-14 h-20 bg-neutral-100/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-neutral-200 text-lg">+</span>
                </div>
                {/* Prompt */}
                <div className="flex-1">
                  <p className="text-neutral-300 text-sm italic">
                    {slotPrompts[rank] || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Helper text - reordering hint */}
      {localItems.length > 0 && (
        <p className="text-center text-sm text-neutral-400 italic">
          Drag to reorder if one book rises above the rest over time.
        </p>
      )}
    </div>
  );
}
