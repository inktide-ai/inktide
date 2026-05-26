'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SoulCardVertical } from '@/components/hub/soul-card-vertical'
import type { SoulCardData } from '@/components/hub/soul-card'

interface SortableSoulCardProps {
  soul: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
}

export function SortableSoulCard({ soul, isFavorite, onFavoriteToggle, onOpen }: SortableSoulCardProps) {
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
      />
    </div>
  )
}
