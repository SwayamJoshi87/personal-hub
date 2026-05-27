import { db } from '@/lib/db'
import { workItems } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'
import { WorkItemList } from '@/components/work/work-item-list'

export default async function WorkPage() {
  const items = await db
    .select()
    .from(workItems)
    .orderBy(asc(workItems.order))

  return (
    <AppShell pageTitle="Work">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Work</h1>
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <WorkItemList initialItems={items} />
      </div>
    </AppShell>
  )
}
