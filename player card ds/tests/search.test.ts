import { describe, expect, it } from 'vitest'
import { searchAll } from '../server/search.mjs'

describe('规则库检索', () => {
  it('「火球」优先返回火球术而不是同名魔杖', () => {
    const res = searchAll('火球', { type: 'all', limit: 8 })
    expect(res.results[0].title).toBe('火球术')
    expect(res.results[0].kind).toBe('spell')
  })

  it('英文名可检索', () => {
    const res = searchAll('Fireball', { type: 'spell', limit: 5 })
    expect(res.results[0].title).toBe('火球术')
  })

  it('法术筛选按环位与职业', () => {
    const res = searchAll('', { type: 'spell', level: '3', class: '法师', limit: 100 })
    expect(res.total).toBeGreaterThan(10)
    expect(res.results.every((r: any) => r.meta.level === 3 && r.meta.classes.includes('法师'))).toBe(true)
  })

  it('状态与专长可检索', () => {
    const cond = searchAll('目盲', { type: 'condition', limit: 3 })
    expect(cond.results[0].title).toBe('目盲')
    const feat = searchAll('警觉', { type: 'feat', limit: 3 })
    expect(feat.results[0].title).toBe('警觉')
  })

  it('职业特性可检索并按职业与等级筛选', () => {
    const search = searchAll('圣疗', { type: 'classFeature', limit: 5 })
    expect(search.results[0].title).toBe('圣疗')
    expect(search.results[0].kind).toBe('classFeature')
    expect(search.results[0].meta.className).toBe('圣武士')

    const filtered = searchAll('', {
      type: 'classFeature',
      featureClass: '圣武士',
      featureLevel: '1',
      limit: 100,
    })
    expect(filtered.total).toBe(2)
    expect(filtered.results.map((r: any) => r.title)).toEqual(expect.arrayContaining(['神圣感知', '圣疗']))
    expect(filtered.results.every((r: any) => r.meta.className === '圣武士' && r.meta.level === 1)).toBe(true)
  })
})
