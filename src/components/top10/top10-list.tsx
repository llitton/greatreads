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
      className="flex items-center gap-3 p-3 bg-white border border-[var(--color-tan)] rounded-lg group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="drag-handle p-1 text-[var(--color-brown-light)] hover:text-[var(--color-brown)]"
        aria-label="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Rank */}
      <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-gold)] text-white text-sm font-bold rounded-full">
        {item.rank}
      </span>

      {/* Book cover */}
      {item.book.coverUrl ? (
        <img
          src={item.book.coverUrl}
          alt=""
          className="w-10 h-14 object-cover rounded shadow-sm"
        />
      ) : (
        <div className="w-10 h-14 bg-[var(--color-parchment)] rounded flex items-center justify-center">
          <span className="text-lg">📕</span>
        </div>
      )}

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-brown-dark)] truncate">{item.book.title}</p>
        {item.book.author && (
          <p className="text-sm text-[var(--color-brown)] truncate">{item.book.author}</p>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.book.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-red)] hover:bg-red-50 rounded transition-opacity"
        aria-label="Remove from Top 10"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

  if (localItems.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-brown-light)]">
        <p className="text-4xl mb-2">📚</p>
        <p>Your Top 10 is empty</p>
        <p className="text-sm">Add books from your feed or my books page</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localItems.map((i) => i.book.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localItems.map((item) => (
            <SortableItem key={item.book.id} item={item} onRemove={handleRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
