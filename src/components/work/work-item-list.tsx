'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ChevronDown } from 'lucide-react'
import { WorkItemRow } from '@/components/work/work-item'
import { AddItemInput } from '@/components/work/add-item-input'
import {
  deleteWorkItem,
  reorderWorkItems,
  completeWorkItem,
  uncompleteWorkItem,
} from '@/lib/actions/work-items'
import type { WorkItem } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function WorkItemList({ initialItems }: { initialItems: WorkItem[] }) {
  const [items, setItems] = useState<WorkItem[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const activeItems = items.filter((i) => i.completedAt === null)
  const completedItems = items.filter((i) => i.completedAt !== null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = activeItems.findIndex((i) => i.id === active.id)
    const newIndex = activeItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(activeItems, oldIndex, newIndex)

    setItems([...reordered, ...completedItems])
    await reorderWorkItems(reordered.map((i) => i.id))
  }

  function handleOptimisticAdd(title: string) {
    const tempItem: WorkItem = {
      id: `temp-${Date.now()}`,
      title,
      url: null,
      order: activeItems.length,
      createdAt: new Date(),
      completedAt: null,
    }
    setItems((prev) => [...prev, tempItem])
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await deleteWorkItem(id)
  }

  async function handleComplete(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completedAt: new Date() } : i))
    )
    await completeWorkItem(id)
  }

  async function handleUncomplete(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completedAt: null } : i))
    )
    await uncompleteWorkItem(id)
  }

  const draggedItem = activeItems.find((i) => i.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={activeItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {activeItems.map((item) => (
            <WorkItemRow
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onComplete={handleComplete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {draggedItem ? (
          <div className="rounded-lg border bg-card px-3 py-2.5 shadow-lg opacity-90">
            <span className="text-sm font-medium">{draggedItem.title}</span>
          </div>
        ) : null}
      </DragOverlay>

      <div className="mt-2">
        <AddItemInput onAdd={handleOptimisticAdd} />
      </div>

      {completedItems.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                !showCompleted && '-rotate-90'
              )}
            />
            Completed ({completedItems.length})
          </button>
          {showCompleted && (
            <div className="mt-2 flex flex-col gap-2">
              {completedItems.map((item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onUncomplete={handleUncomplete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </DndContext>
  )
}
