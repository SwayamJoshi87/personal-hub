'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createWorkItem } from '@/lib/actions/work-items'

export function AddItemInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const title = value.trim()
    if (!title || busy) return

    setBusy(true)
    setValue('')
    onAdd(title)
    await createWorkItem(title)
    setBusy(false)
    inputRef.current?.focus()
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-muted-foreground hover:border-primary/50 focus-within:border-primary/50 transition-colors">
      <Plus className="h-4 w-4 flex-shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add item..."
        disabled={busy}
        className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0 bg-transparent"
      />
    </div>
  )
}
