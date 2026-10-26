import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { ReorderPosition } from '@/lib/reorder'

export interface ReorderDragState {
  activeId: string
  overId: string | null
  scope: string
  position: ReorderPosition
}

type ActiveDrag = ReorderDragState & { pointerId: number }
type ReorderCallback = (activeId: string, overId: string, position: ReorderPosition) => void

/** Pointer-based reordering with a handle, scoped drop targets and keyboard alternatives. */
export function useReorder(onReorder: ReorderCallback) {
  const callbackRef = useRef(onReorder)
  callbackRef.current = onReorder
  const activeRef = useRef<ActiveDrag | null>(null)
  const [drag, setDrag] = useState<ReorderDragState | null>(null)

  const clearDrag = () => {
    activeRef.current = null
    setDrag(null)
    document.body.classList.remove('is-reordering')
  }

  useEffect(() => () => {
    activeRef.current = null
    document.body.classList.remove('is-reordering')
  }, [])

  const getHandleProps = (id: string, scope: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (!e.isPrimary || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      activeRef.current = { activeId: id, overId: null, scope, position: 'before', pointerId: e.pointerId }
      setDrag({ activeId: id, overId: null, scope, position: 'before' })
      document.body.classList.add('is-reordering')
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      const active = activeRef.current
      if (!active || active.pointerId !== e.pointerId) return
      e.preventDefault()
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-reorder-id]')
      const overId = target?.dataset.reorderId || null
      if (!target || !overId || overId === active.activeId || target.dataset.reorderScope !== active.scope) {
        if (active.overId !== null) {
          activeRef.current = { ...active, overId: null }
          setDrag({ ...active, overId: null })
        }
        return
      }
      const rect = target.getBoundingClientRect()
      const position: ReorderPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      if (active.overId !== overId || active.position !== position) {
        activeRef.current = { ...active, overId, position }
        setDrag({ ...active, overId, position })
      }
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      const active = activeRef.current
      if (!active || active.pointerId !== e.pointerId) return
      e.preventDefault()
      e.stopPropagation()
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
      if (active.overId && active.overId !== active.activeId) {
        callbackRef.current(active.activeId, active.overId, active.position)
      }
      clearDrag()
    },
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
      if (activeRef.current?.pointerId === e.pointerId) clearDrag()
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
    },
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      e.stopPropagation()
      const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-reorder-id]'))
        .filter((row) => row.dataset.reorderScope === scope)
      const index = rows.findIndex((row) => row.dataset.reorderId === id)
      const targetIndex = e.key === 'ArrowUp' ? index - 1 : index + 1
      const overId = rows[targetIndex]?.dataset.reorderId
      if (overId) callbackRef.current(id, overId, e.key === 'ArrowUp' ? 'before' : 'after')
    },
  })

  return { drag, getHandleProps }
}
