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
import { BookCover } from '@/components/ui/book-cover';

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
  isTopTier: boolean;
}

function SortableItem({ item, onRemove, isTopTier }: SortableItemProps) {
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
      className={`flex items-center gap-5 bg-white rounded-2xl border border-black/5 group transition-all duration-150 ${
        isDragging
          ? 'shadow-xl scale-[1.02] border-neutral-200'
          : 'shadow-sm hover:shadow-md'
      } ${isTopTier ? 'p-5' : 'p-5'}`}
    >
      {/* Rank - ceremonial, serif, larger for top 3 */}
      <span className={`flex items-center justify-center font-serif text-neutral-300 flex-shrink-0 ${
        isTopTier ? 'w-12 h-12 text-3xl' : 'w-10 h-10 text-2xl'
      }`}>
        {item.rank}
      </span>

      {/* Book cover - larger for top 3 */}
      <BookCover
        src={item.book.coverUrl}
        title={item.book.title}
        author={item.book.author}
        size={isTopTier ? 'xl' : 'lg'}
        className="shadow-md"
      />

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[#1f1a17] mb-1 ${isTopTier ? 'text-lg' : ''}`}>
          {item.book.title}
        </p>
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

  // Split into top 3 and rest for visual hierarchy
  const topTier = localItems.filter(item => item.rank <= 3);
  const restTier = localItems.filter(item => item.rank > 3);

  return (
    <div className="space-y-8">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.book.id)} strategy={verticalListSortingStrategy}>
          {/* Top 3 - the books that shaped me earliest */}
          {topTier.length > 0 && (
            <div className="space-y-5">
              {topTier.map((item) => (
                <SortableItem key={item.book.id} item={item} onRemove={handleRemove} isTopTier={true} />
              ))}
            </div>
          )}

          {/* Divider between top 3 and rest */}
          {topTier.length >= 3 && restTier.length > 0 && (
            <div className="flex items-center gap-5 py-2">
              <div className="flex-1 h-px bg-neutral-100" />
              <span className="text-[10px] text-neutral-300 uppercase tracking-widest">The rest of the canon</span>
              <div className="flex-1 h-px bg-neutral-100" />
            </div>
          )}

          {/* Rest - 4-10 */}
          {restTier.length > 0 && (
            <div className="space-y-4">
              {restTier.map((item) => (
                <SortableItem key={item.book.id} item={item} onRemove={handleRemove} isTopTier={false} />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}
