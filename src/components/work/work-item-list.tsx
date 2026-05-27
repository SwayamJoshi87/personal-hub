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
import { WorkItemRow } from '@/components/work/work-item'
import { AddItemInput } from '@/components/work/add-item-input'
import { deleteWorkItem, reorderWorkItems } from '@/lib/actions/work-items'
import type { WorkItem } from '@/lib/db/schema'

export function WorkItemList({ initialItems }: { initialItems: WorkItem[] }) {
  const [items, setItems] = useState<WorkItem[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)

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

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)

    setItems(reordered)
    await reorderWorkItems(reordered.map((i) => i.id))
  }

  function handleOptimisticAdd(title: string) {
    const tempItem: WorkItem = {
      id: `temp-${Date.now()}`,
      title,
      url: null,
      order: items.length,
      createdAt: new Date(),
    }
    setItems((prev) => [...prev, tempItem])
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await deleteWorkItem(id)
  }

  const activeItem = items.find((i) => i.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <WorkItemRow key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border bg-card px-3 py-2.5 shadow-lg opacity-90">
            <span className="text-sm font-medium">{activeItem.title}</span>
          </div>
        ) : null}
      </DragOverlay>

      <div className="mt-2">
        <AddItemInput onAdd={handleOptimisticAdd} />
      </div>
    </DndContext>
  )
}
