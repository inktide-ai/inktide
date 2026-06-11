'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SoulCardVertical } from '@/features/soul/components/soul-card-vertical'
import type { SoulCardData } from '@/features/soul/components/soul-card'

interface SortableSoulCardProps {
  soul: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
  onDelete?: () => void
}

export function SortableSoulCard({ soul, isFavorite, onFavoriteToggle, onOpen, onDelete }: SortableSoulCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: soul.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <SoulCardVertical
        data={soul}
        isFavorite={isFavorite}
        onFavoriteToggle={onFavoriteToggle}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    </div>
  )
}
