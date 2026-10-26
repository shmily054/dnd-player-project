export type ReorderPosition = 'before' | 'after'

/** Move an entry relative to another entry without changing any entry data. */
export function reorderById<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string,
  position: ReorderPosition,
): T[] {
  if (activeId === overId) return items
  const fromIndex = items.findIndex((item) => item.id === activeId)
  if (fromIndex < 0 || !items.some((item) => item.id === overId)) return items

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  const overIndex = next.findIndex((item) => item.id === overId)
  next.splice(overIndex + (position === 'after' ? 1 : 0), 0, moved)
  return next
}
