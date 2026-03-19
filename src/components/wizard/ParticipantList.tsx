import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { WizardFormData } from '@/lib/types'

interface SortableItemProps {
  id: string
  index: number
  participantType: 'players' | 'teams'
}

function SortableItem({ id, index, participantType }: SortableItemProps) {
  const { register } = useFormContext<WizardFormData>()
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none text-gray-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>

        <span className="w-6 text-center text-xs font-bold text-gray-400">
          {index + 1}
        </span>

        <input
          {...register(`participants.${index}.name`)}
          placeholder={participantType === 'teams' ? `Team ${index + 1}` : `Player ${index + 1}`}
          className="flex-1 rounded-md border border-gray-200 bg-transparent px-2 py-1 text-sm text-gray-900 focus:border-orange-500 focus:outline-none dark:border-dark-600 dark:text-gray-100"
        />

        {participantType === 'teams' && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Team players expansion */}
      {participantType === 'teams' && expanded && (
        <div className="border-t border-gray-100 px-10 py-3 dark:border-dark-700">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Team Players (up to 4)
          </p>
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2, 3].map(pi => (
              <input
                key={pi}
                {...register(`participants.${index}.playerNames.${pi}`)}
                placeholder={`Player ${pi + 1}`}
                className="h-8 rounded border border-gray-200 bg-gray-50 px-2 text-xs text-gray-900 focus:border-orange-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ParticipantListProps {
  groupIndex?: number
  groupName?: string
}

export function ParticipantList({ groupIndex, groupName }: ParticipantListProps) {
  const { watch, control } = useFormContext<WizardFormData>()
  const { move } = useFieldArray({ control, name: 'participants' })

  const participantType = watch('participant_type')
  const participants = watch('participants') ?? []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Filter by group if groupIndex is provided
  const items = groupIndex !== undefined
    ? participants
        .map((p, i) => ({ ...p, originalIndex: i }))
        .filter((_, i) => {
          const numGroups = watch('num_groups') || 1
          const pass = Math.floor(i / numGroups)
          const gi = pass % 2 === 0 ? i % numGroups : numGroups - 1 - (i % numGroups)
          return gi === groupIndex
        })
    : participants.map((p, i) => ({ ...p, originalIndex: i }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIdx = participants.findIndex(p => p.id === active.id)
    const overIdx = participants.findIndex(p => p.id === over.id)
    if (activeIdx !== -1 && overIdx !== -1) {
      move(activeIdx, overIdx)
    }
  }

  return (
    <div>
      {groupName && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {groupName}
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {items.map(item => (
              <SortableItem
                key={item.id}
                id={item.id}
                index={item.originalIndex}
                participantType={participantType}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
