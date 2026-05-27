'use server'

import { db } from '@/lib/db'
import { workItems } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createWorkItem(title: string, url?: string) {
  const last = await db
    .select({ order: workItems.order })
    .from(workItems)
    .orderBy(desc(workItems.order))
    .limit(1)

  const nextOrder = last.length > 0 ? last[0].order + 1 : 0

  await db.insert(workItems).values({
    title: title.trim(),
    url: url?.trim() || null,
    order: nextOrder,
  })

  revalidatePath('/work')
}

export async function updateWorkItem(
  id: string,
  data: { title?: string; url?: string | null }
) {
  await db.update(workItems).set(data).where(eq(workItems.id, id))
  revalidatePath('/work')
}

export async function deleteWorkItem(id: string) {
  await db.delete(workItems).where(eq(workItems.id, id))
  revalidatePath('/work')
}

export async function reorderWorkItems(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(workItems).set({ order: index }).where(eq(workItems.id, id))
    )
  )
  revalidatePath('/work')
}
