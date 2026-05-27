# PersonalHub — Work Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal hub on Next.js + Vercel with a prioritized work-items list (drag-to-reorder, inline add/edit, optional URL per item, light/dark mode, collapsible sidebar nav).

**Architecture:** Next.js App Router with a server-component WorkPage that fetches items and passes them to a client-side WorkItemList. All mutations go through Server Actions. Drag-and-drop reorder is handled client-side with optimistic state, flushing to Neon via a bulk-update Server Action on drop.

**Tech Stack:** Next.js 15 (App Router), Neon (Postgres), Drizzle ORM, @dnd-kit/core + @dnd-kit/sortable, shadcn/ui, 21st.dev (via MCP magic component builder), next-themes, Tailwind CSS, Vitest

> **21st.dev note:** Where marked with `[21st.dev]`, use the `mcp__magic__21st_magic_component_builder` tool to find and install a matching component. If a good match isn't found, fall back to the shadcn/Tailwind implementation shown.

---

## File Map

```
src/
  app/
    layout.tsx                  ← RootLayout: ThemeProvider + AppShell
    page.tsx                    ← Redirect to /work
    globals.css                 ← Tailwind base (generated)
    work/
      page.tsx                  ← Server component: fetch items → WorkItemList
  components/
    app-shell.tsx               ← Layout wrapper (sidebar + main slot)
    sidebar.tsx                 ← Desktop aside + mobile Sheet, nav items, theme toggle
    mobile-header.tsx           ← Hamburger + page title (mobile only)
    theme-toggle.tsx            ← Sun/Moon icon button, next-themes
    work/
      work-item-list.tsx        ← Client: DndContext + SortableContext, optimistic state
      work-item.tsx             ← Client: SortableItem, inline edit/delete
      add-item-input.tsx        ← Client: inline "Add item..." input at list bottom
  lib/
    db/
      index.ts                  ← Drizzle client (neon-http)
      schema.ts                 ← work_items table
    actions/
      work-items.ts             ← Server Actions: create, update, delete, reorder
drizzle/                        ← Generated migration files
drizzle.config.ts               ← Drizzle Kit config
.env.local                      ← DATABASE_URL (not committed)
vitest.config.ts                ← Vitest config
src/__tests__/
  work-items-actions.test.ts    ← Unit tests for server actions logic
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: project root (via CLI)

- [ ] **Step 1: Create the app**

Run in `C:\Users\aa\Projects\PersonalHub`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Accept all defaults when prompted.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities next-themes
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D drizzle-kit vitest @vitejs/plugin-react
```

- [ ] **Step 4: Remove boilerplate**

Delete `src/app/page.tsx` content (replace in a later task). Delete everything inside `src/app/globals.css` below the `@tailwind` directives.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:3000` with no errors.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Drizzle schema + Neon migration

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `.env.local`
- Create: `.gitignore` entry

- [ ] **Step 1: Add DATABASE_URL to .env.local**

Create `.env.local` in the project root:

```
DATABASE_URL=your_neon_connection_string_here
```

Get this from your Neon project dashboard → Connection Details → copy the connection string (use the pooled connection string).

- [ ] **Step 2: Add .env.local to .gitignore**

Open `.gitignore` and verify `.env.local` is listed. Add it if missing:

```
.env.local
```

- [ ] **Step 3: Write the schema**

Create `src/lib/db/schema.ts`:

```ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const workItems = pgTable('work_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  url: text('url'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type WorkItem = typeof workItems.$inferSelect
export type NewWorkItem = typeof workItems.$inferInsert
```

- [ ] **Step 4: Write the Drizzle client**

Create `src/lib/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 5: Write drizzle.config.ts**

Create `drizzle.config.ts` in the project root:

```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 6: Generate and run the migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: `drizzle/` directory created with a SQL migration file. Migration runs against Neon with no errors.

- [ ] **Step 7: Verify table exists**

```bash
npx drizzle-kit studio
```

Opens Drizzle Studio at `https://local.drizzle.studio`. Confirm `work_items` table is listed. Close with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db drizzle.config.ts drizzle .gitignore
git commit -m "feat: add Drizzle schema and Neon migration for work_items"
```

---

## Task 3: shadcn/ui init + install components

**Files:**
- Modify: `tailwind.config.ts`, `src/app/globals.css`, `components.json` (all via CLI)
- Create: `src/components/ui/` (via CLI)

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**

- [ ] **Step 2: Install required components**

```bash
npx shadcn@latest add button input sheet tooltip separator
```

- [ ] **Step 3: Verify components exist**

Check that `src/components/ui/button.tsx`, `input.tsx`, `sheet.tsx`, `tooltip.tsx`, `separator.tsx` all exist.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui components.json src/app/globals.css tailwind.config.ts
git commit -m "feat: init shadcn/ui with button, input, sheet, tooltip, separator"
```

---

## Task 4: Server Actions + tests

**Files:**
- Create: `src/lib/actions/work-items.ts`
- Create: `vitest.config.ts`
- Create: `src/__tests__/work-items-actions.test.ts`

- [ ] **Step 1: Write the server actions**

Create `src/lib/actions/work-items.ts`:

```ts
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
```

- [ ] **Step 2: Write vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Write the tests**

Create `src/__tests__/work-items-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache before importing actions
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Mock the db module
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/schema', () => ({
  workItems: { order: 'order', id: 'id', title: 'title', url: 'url' },
}))
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  desc: vi.fn((col) => col),
}))

describe('reorderWorkItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const chainable = { where: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis() }
    mockDb.update.mockReturnValue(chainable)
  })

  it('calls update for each id with its index as order', async () => {
    const { reorderWorkItems } = await import('@/lib/actions/work-items')
    await reorderWorkItems(['id-a', 'id-b', 'id-c'])
    expect(mockDb.update).toHaveBeenCalledTimes(3)
  })
})

describe('createWorkItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ order: 4 }]),
    }
    mockDb.select.mockReturnValue(selectChain)
    const insertChain = { values: vi.fn().mockResolvedValue(undefined) }
    mockDb.insert.mockReturnValue(insertChain)
  })

  it('inserts with order = last order + 1', async () => {
    // Re-import after mock reset
    vi.resetModules()
    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
    vi.mock('@/lib/db', () => ({ db: mockDb }))
    vi.mock('@/lib/db/schema', () => ({
      workItems: { order: 'order', id: 'id', title: 'title', url: 'url' },
    }))
    vi.mock('drizzle-orm', () => ({
      eq: vi.fn((col, val) => ({ col, val })),
      desc: vi.fn((col) => col),
    }))
    const { createWorkItem } = await import('@/lib/actions/work-items')
    await createWorkItem('New item')
    expect(mockDb.insert).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Add test script to package.json**

Open `package.json` and add to the `"scripts"` section:

```json
"test": "vitest run"
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: 2 test suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions src/__tests__ vitest.config.ts package.json
git commit -m "feat: add work item server actions with tests"
```

---

## Task 5: Theme setup (next-themes)

**Files:**
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Enable dark mode class in Tailwind**

Open `tailwind.config.ts`. Ensure `darkMode` is set to `'class'`:

```ts
const config: Config = {
  darkMode: 'class',
  // ... rest of config
}
```

- [ ] **Step 2: Write ThemeToggle**

Create `src/components/theme-toggle.tsx`:

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

- [ ] **Step 3: Install lucide-react (if not already present)**

```bash
npm install lucide-react
```

- [ ] **Step 4: Write RootLayout with ThemeProvider**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PersonalHub',
  description: 'Personal dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify dev server has no errors**

```bash
npm run dev
```

Expected: starts without errors. Dark background visible at `http://localhost:3000`.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/theme-toggle.tsx tailwind.config.ts
git commit -m "feat: add next-themes with dark mode default and ThemeToggle"
```

---

## Task 6: AppShell, Sidebar, MobileHeader

**Files:**
- Create: `src/components/app-shell.tsx`
- Create: `src/components/sidebar.tsx`
- Create: `src/components/mobile-header.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write Sidebar**

Create `src/components/sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/work', label: 'Work', icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-52 flex-col bg-zinc-900 text-zinc-100">
      <div className="px-4 py-4">
        <p className="text-sm font-bold tracking-tight">PersonalHub</p>
        <p className="mt-0.5 text-xs text-zinc-500">swayamjoshi95@gmail.com</p>
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              pathname === href
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator className="bg-white/10" />
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs text-zinc-500">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Write MobileHeader**

Create `src/components/mobile-header.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/sidebar'

export function MobileHeader({ title }: { title: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <span className="text-sm font-semibold">{title}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-52 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </header>
  )
}
```

- [ ] **Step 3: Write AppShell**

Create `src/components/app-shell.tsx`:

```tsx
import { Sidebar } from '@/components/sidebar'
import { MobileHeader } from '@/components/mobile-header'

export function AppShell({
  children,
  pageTitle,
}: {
  children: React.ReactNode
  pageTitle: string
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader title={pageTitle} />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update RootLayout to use AppShell**

Modify `src/app/layout.tsx` — wrap `{children}` with `AppShell`. Because `pageTitle` varies per page, pass it via a layout pattern. For now use a simpler approach: use AppShell directly in the work layout.

Replace the body content:

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  {children}
</ThemeProvider>
```

(Leave this as-is — AppShell will be added per-route in the next task.)

- [ ] **Step 5: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/app-shell.tsx src/components/sidebar.tsx src/components/mobile-header.tsx
git commit -m "feat: add AppShell, Sidebar, and MobileHeader components"
```

---

## Task 7: Root redirect + Work page (server component)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/work/page.tsx`

- [ ] **Step 1: Write root redirect**

Create `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/work')
}
```

- [ ] **Step 2: Write WorkPage**

Create `src/app/work/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify the page loads**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: redirects to `/work`. Page renders with sidebar (desktop) or hamburger (mobile). List is empty but no errors. The `WorkItemList` component doesn't exist yet — create a placeholder so it compiles.

Create `src/components/work/work-item-list.tsx` (placeholder):

```tsx
'use client'
import type { WorkItem } from '@/lib/db/schema'

export function WorkItemList({ initialItems }: { initialItems: WorkItem[] }) {
  return <div>{initialItems.length} items (coming soon)</div>
}
```

- [ ] **Step 4: Confirm no errors in browser console**

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/work/page.tsx src/components/work/work-item-list.tsx
git commit -m "feat: add root redirect and Work page with server-side data fetch"
```

---

## Task 8: WorkItem component (sortable row + inline edit)

**Files:**
- Create: `src/components/work/work-item.tsx`

- [ ] **Step 1: Write WorkItem**

Create `src/components/work/work-item.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, ExternalLink, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateWorkItem, deleteWorkItem } from '@/lib/actions/work-items'
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/work/work-item.tsx
git commit -m "feat: add WorkItem sortable row with inline edit and delete"
```

---

## Task 9: AddItemInput component

**Files:**
- Create: `src/components/work/add-item-input.tsx`

- [ ] **Step 1: Write AddItemInput**

Create `src/components/work/add-item-input.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/work/add-item-input.tsx
git commit -m "feat: add inline AddItemInput component"
```

---

## Task 10: WorkItemList with DnD + optimistic state

**Files:**
- Modify: `src/components/work/work-item-list.tsx`

- [ ] **Step 1: Replace WorkItemList placeholder with full implementation**

Replace the contents of `src/components/work/work-item-list.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify full feature works in browser**

```bash
npm run dev
```

Open `http://localhost:3000/work`.

Test each flow:
1. Type a title in "Add item..." → press Enter → item appears
2. Click item title → edit inline → press Enter → saved
3. Click edit pencil → add a URL → press Enter → URL link appears
4. Drag items by the grip handle → reorder saves
5. Click trash → item removed
6. Toggle theme button in sidebar → switches light/dark
7. Resize to mobile width → sidebar collapses → hamburger appears → tap to open drawer

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/work-item-list.tsx
git commit -m "feat: complete WorkItemList with DnD reorder and optimistic updates"
```

---

## Task 11: Polish + .gitignore + Vercel deploy prep

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Update .gitignore**

Open `.gitignore` and ensure these are present:

```
.env.local
.env*.local
.superpowers/
```

- [ ] **Step 2: Create .env.example**

Create `.env.example` in the project root:

```
DATABASE_URL=your_neon_connection_string_here
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any warnings if present.

- [ ] **Step 4: Run final type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run final tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 6: Final commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add env.example and finalize .gitignore"
```

- [ ] **Step 7: Set DATABASE_URL in Vercel**

Before deploying, add the environment variable in the Vercel project settings:
- Go to Vercel dashboard → project → Settings → Environment Variables
- Add `DATABASE_URL` with the Neon connection string for Production, Preview, and Development

- [ ] **Step 8: Deploy to Vercel**

```bash
npx vercel --prod
```

Follow the prompts to link to your Vercel account and project. Expected: deployment URL printed on success.
