'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, ExternalLink, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateWorkItem } from '@/lib/actions/work-items'
import type { WorkItem } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function WorkItemRow({
  item,
  onDelete,
}: {
  item: WorkItem
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [url, setUrl] = useState(item.url ?? '')
  const titleRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (editing) titleRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (!title.trim()) return
    setEditing(false)
    await updateWorkItem(item.id, {
      title: title.trim(),
      url: url.trim() || null,
    })
  }

  function handleDiscard() {
    setTitle(item.title)
    setUrl(item.url ?? '')
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleDiscard()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-card-foreground shadow-sm transition-shadow',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {editing ? (
          <>
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="URL (optional)"
              className="h-7 text-xs text-muted-foreground"
            />
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="truncate text-left text-sm font-medium hover:text-primary"
            >
              {item.title}
            </button>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {item.url}
              </a>
            )}
          </>
        )}
      </div>

      <div
        className={cn(
          'flex items-center gap-1 flex-shrink-0',
          editing ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
        )}
      >
        {editing ? (
          <>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDiscard}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
