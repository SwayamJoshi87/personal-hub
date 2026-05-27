'use client'
import type { WorkItem } from '@/lib/db/schema'

export function WorkItemList({ initialItems }: { initialItems: WorkItem[] }) {
  return <div>{initialItems.length} items (coming soon)</div>
}
