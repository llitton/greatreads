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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border border-black/5 rounded-xl shadow-sm group hover:shadow-md transition-shadow"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-neutral-300 hover:text-neutral-500 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Rank */}
      <span className="w-8 h-8 flex items-center justify-center bg-[#d4a855] text-white text-sm font-bold rounded-full flex-shrink-0">
        {item.rank}
      </span>

      {/* Book cover */}
      {item.book.coverUrl ? (
        <img
          src={item.book.coverUrl}
          alt=""
          className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-14 bg-neutral-100 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-lg">📕</span>
        </div>
      )}

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1f1a17] truncate">{item.book.title}</p>
        {item.book.author && (
          <p className="text-sm text-neutral-500 truncate">{item.book.author}</p>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.book.id)}
        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
        aria-label="Remove from Top 10"
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
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.book.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {localItems.map((item) => (
              <SortableItem key={item.book.id} item={item} onRemove={handleRemove} />
            ))}

            {/* Empty slots */}
            {emptySlots.map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-neutral-200"
              >
                <div className="w-5" /> {/* Spacer for drag handle alignment */}
                <span className="w-8 h-8 flex items-center justify-center bg-neutral-100 text-neutral-400 text-sm font-medium rounded-full">
                  {rank}
                </span>
                <div className="flex-1">
                  <p className="text-neutral-300">—</p>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Helper text */}
      <p className="text-center text-sm text-neutral-400">
        Drag books to reorder your ranking.
      </p>
    </div>
  );
}
