'use client';

import { useState, useTransition } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { Product } from '@/types/database';
import { LineBadge } from '@/components/ui/LineBadge';
import { saveRanking, toggleTried } from '@/lib/actions/rankings';

type RankedItem = {
  productId: string;
  product: Product;
  rankPosition: number;
};

type Props = {
  triedProducts: Product[];
  untriedProducts: Product[];
  initialRankings: RankedItem[];
};

function SortableItem({ item }: { item: RankedItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.productId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const line = item.product.product_lines;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="glass-card p-3 flex items-center gap-3 touch-target"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-target flex items-center justify-center text-muted cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="font-display font-bold text-lg w-8 text-[var(--line-energy)]">
        {item.rankPosition}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.product.name}</p>
        {line && <LineBadge name={line.name} slug={line.slug} color={line.color_hex} />}
      </div>
    </motion.div>
  );
}

export function TierListEditor({ triedProducts, untriedProducts, initialRankings }: Props) {
  const [items, setItems] = useState(initialRankings);
  const [untried, setUntried] = useState(untriedProducts);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.productId === active.id);
      const newIndex = prev.findIndex((i) => i.productId === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        rankPosition: idx + 1,
      }));

      startTransition(async () => {
        await saveRanking(
          reordered.map((i) => ({ productId: i.productId, rankPosition: i.rankPosition }))
        );
      });

      return reordered;
    });
  }

  function markAsTried(product: Product) {
    setUntried((u) => u.filter((p) => p.id !== product.id));
    const newItem: RankedItem = {
      productId: product.id,
      product,
      rankPosition: items.length + 1,
    };
    setItems((prev) => [...prev, newItem]);

    startTransition(async () => {
      await toggleTried(product.id, true);
      await saveRanking([...items, newItem].map((i) => ({
        productId: i.productId,
        rankPosition: i.rankPosition,
      })));
    });
  }

  function markAsUntried(productId: string) {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    setItems((prev) => {
      const filtered = prev.filter((i) => i.productId !== productId);
      return filtered.map((i, idx) => ({ ...i, rankPosition: idx + 1 }));
    });
    setUntried((u) => [...u, item.product]);

    startTransition(async () => {
      await toggleTried(productId, false);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold mb-4">Mein Ranking</h2>
        {items.length === 0 ? (
          <p className="text-muted glass-card p-6 text-center">
            Markiere Sorten als probiert, um dein Ranking zu starten.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.productId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.productId} className="relative group">
                    <SortableItem item={item} />
                    <button
                      onClick={() => markAsUntried(item.productId)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity touch-target px-2"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {pending && <p className="text-sm text-muted mt-2">Speichern...</p>}
      </div>

      {untried.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Noch nicht probiert</h2>
          <div className="grid gap-2">
            {untried.map((product) => {
              const line = product.product_lines;
              return (
                <div key={product.id} className="glass-card p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {line && <LineBadge name={line.name} slug={line.slug} color={line.color_hex} />}
                  </div>
                  <button
                    onClick={() => markAsTried(product)}
                    className="touch-target px-4 py-2 rounded-full bg-[var(--line-iced-tea)]/20 text-[var(--line-iced-tea)] text-sm font-medium border border-[var(--line-iced-tea)]/30 hover:bg-[var(--line-iced-tea)]/30 transition-colors"
                  >
                    Probiert
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {triedProducts.length === 0 && untried.length === 0 && (
        <p className="text-muted text-center">Keine aktiven Produkte gefunden.</p>
      )}
    </div>
  );
}
