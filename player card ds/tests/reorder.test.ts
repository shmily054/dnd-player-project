import { describe, expect, it } from 'vitest'
import { reorderById } from '@/lib/reorder'

const entries = () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
const ids = (items: { id: string }[]) => items.map((item) => item.id)

describe('条目拖动排序', () => {
  it('可以向前和向后移动条目', () => {
    expect(ids(reorderById(entries(), 'd', 'b', 'before'))).toEqual(['a', 'd', 'b', 'c'])
    expect(ids(reorderById(entries(), 'a', 'c', 'after'))).toEqual(['b', 'c', 'a', 'd'])
  })

  it('支持移动到列表首尾', () => {
    expect(ids(reorderById(entries(), 'c', 'a', 'before'))).toEqual(['c', 'a', 'b', 'd'])
    expect(ids(reorderById(entries(), 'b', 'd', 'after'))).toEqual(['a', 'c', 'd', 'b'])
  })

  it('原地放置或 id 无效时不改变原数组', () => {
    const original = entries()
    expect(reorderById(original, 'a', 'a', 'before')).toBe(original)
    expect(reorderById(original, 'missing', 'a', 'before')).toBe(original)
    expect(reorderById(original, 'a', 'missing', 'after')).toBe(original)
    expect(ids(original)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('只调整数组位置，不修改条目内容', () => {
    const original = [{ id: 'a', value: 1 }, { id: 'b', value: 2 }]
    const result = reorderById(original, 'b', 'a', 'before')
    expect(result).toEqual([{ id: 'b', value: 2 }, { id: 'a', value: 1 }])
    expect(result[0]).toBe(original[1])
    expect(original).toEqual([{ id: 'a', value: 1 }, { id: 'b', value: 2 }])
  })
})
