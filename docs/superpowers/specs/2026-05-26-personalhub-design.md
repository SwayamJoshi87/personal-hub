# PersonalHub — Design Spec
**Date:** 2026-05-26
**Status:** Approved

---

## Overview

A personal hub hosted on Vercel. The first feature is a prioritized work items list — things the user is currently working on, ordered by drag-and-drop, with an optional URL per item. The app uses a sidebar navigation that will grow as more sections are added. Clean, minimal design with full light/dark mode support.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Database | Neon (Postgres) |
| ORM | Drizzle ORM |
| Mutations | Next.js Server Actions |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| UI components | shadcn/ui + 21st.dev components |
| Theming | next-themes (light/dark) |
| Styling | Tailwind CSS |

---

## Navigation

A persistent side drawer on desktop. On mobile it collapses and is toggled by a hamburger button in the top header.

**Sidebar structure:**
- App name ("PersonalHub") + user email at the top
- Nav items: Work (active), with placeholder for future sections
- "Add section" slot at the bottom of the nav items
- Theme toggle (light/dark) pinned to the sidebar footer

The sidebar uses shadcn `Sheet` on mobile (slide-in drawer) and a fixed `aside` on desktop.

---

## Work Items Feature

### List behaviour
- Renders all work items ordered by their `order` column (ascending)
- Each row: drag handle | title | optional URL link | edit + delete actions (visible on hover)
- Drag-and-drop reorder via `@dnd-kit`. On drop, a Server Action bulk-updates `order` for all affected rows
- Optimistic UI update on reorder so there is no visible delay

### Inline add
- A dashed input row sits at the bottom of the list at all times
- User types a title and presses Enter to add (title required)
- The item appears immediately at the bottom of the list via optimistic update
- To add a URL, click the newly created item to enter edit mode
- New items are inserted at the bottom (highest `order` value)

### Inline edit
- Clicking the title of any existing item turns it into an editable input
- Clicking the URL turns it into an editable input
- Pressing Enter or clicking away saves; Escape discards
- Edit/delete icon buttons appear on row hover (desktop) and are always visible on mobile

### Delete
- Clicking delete removes the item immediately with an optimistic update
- No confirmation dialog — deletion is instant (personal app, low stakes)

---

## Data Model

Single table: `work_items`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `title` | text | Not null |
| `url` | text | Nullable |
| `order` | integer | Sort position; lower = higher in list |
| `created_at` | timestamp | Default `now()` |

No user auth for v1 — this is a single-user personal app, no login required.

---

## Server Actions

| Action | Signature | What it does |
|---|---|---|
| `createWorkItem` | `(title: string, url?: string)` | Inserts at max(order)+1 |
| `updateWorkItem` | `(id: string, data: Partial<{title, url}>)` | Updates title and/or URL |
| `deleteWorkItem` | `(id: string)` | Deletes row |
| `reorderWorkItems` | `(orderedIds: string[])` | Bulk-updates `order` for all IDs in the given sequence |

---

## Component Tree

```
RootLayout
└── ThemeProvider (next-themes)
    └── AppShell
        ├── Sidebar (desktop: fixed aside, mobile: Sheet)
        │   ├── AppLogo
        │   ├── NavItems
        │   └── ThemeToggle
        ├── MobileHeader (hamburger + page title, mobile only)
        └── Page (slot)
            └── WorkPage (/work)
                ├── WorkItemList (DndContext + SortableContext)
                │   └── WorkItem (×n) — SortableItem
                └── AddItemInput
```

---

## Routing

| Route | Page |
|---|---|
| `/` | Redirect to `/work` |
| `/work` | Work items list |

Future sections will each get their own route (e.g. `/notes`, `/links`) and a nav item in the sidebar.

---

## Design

- **Components:** shadcn/ui (`Button`, `Input`, `Sheet`, `Tooltip`, `Separator`) + 21st.dev for the drag handle and any decorative UI
- **Tokens:** Tailwind CSS defaults; no custom design tokens beyond what shadcn ships
- **Light mode:** White background, zinc-900 text, zinc-100 borders
- **Dark mode:** zinc-950 background, zinc-50 text — toggled via `next-themes` class strategy
- **Sidebar dark:** Always dark regardless of theme (zinc-900), consistent with the mockup
- **Animations:** Subtle fade-in on list load; `@dnd-kit` provides the drag overlay

---

## Out of Scope (v1)

- Authentication / multi-user support
- Completed/archived items
- Item categories or tags
- Notes, links, or any section beyond Work
- Rich text descriptions per item
