import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

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

  it('calls insert when creating an item', async () => {
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
