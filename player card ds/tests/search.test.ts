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
    const feat = searchAll('警戒', { type: 'feat', limit: 3 })
    expect(feat.results[0].title).toBe('警戒')
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
    expect(filtered.total).toBe(3)
    expect(filtered.results.map((r: any) => r.title)).toEqual(expect.arrayContaining(['圣疗', '施法', '武器精通']))
    expect(filtered.results.every((r: any) => r.meta.className === '圣武士' && r.meta.level === 1)).toBe(true)
  })

  it('子职业与子职特性可检索、可按子职业筛选', () => {
    const oath = searchAll('奉献之誓', { type: 'classFeature', limit: 10 })
    expect(oath.fallback).toBeFalsy()
    expect(oath.results[0].title).toBe('奉献之誓')
    expect(oath.results[0].meta.featureKind).toBe('subclass')
    expect(oath.results.map((r: any) => r.title)).toEqual(
      expect.arrayContaining(['奉献之誓', '圣洁武器', '奉献灵光', '卫护斩', '至圣光轮']),
    )

    const smite = searchAll('圣洁武器', { type: 'classFeature', limit: 5 })
    expect(smite.total).toBe(1)
    expect(smite.results[0].title).toBe('圣洁武器')
    expect(smite.results[0].entry?.subclass).toBe('奉献之誓')
    expect(smite.results[0].subtitle).toContain('神圣誓言')

    const filtered = searchAll('', { type: 'classFeature', featureClass: '圣武士', subclass: '奉献之誓', limit: 20 })
    expect(filtered.total).toBe(6)
    expect(filtered.results.every((r: any) => r.meta.subclass === '奉献之誓')).toBe(true)
  })

  it('类型页没有结构化命中时回退规则全文', () => {
    const res = searchAll('先攻熟练', { type: 'classFeature', limit: 5 })
    expect(res.fallback).toBe(true)
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results.every((r: any) => r.kind === 'raw')).toBe(true)
  })

  it('全部检索不再丢弃标题被表格行污染的法术段落', () => {
    const res = searchAll('圣洁武器', { type: 'all', limit: 5 })
    const classes = res.results.map((r: any) => r.kind)
    expect(classes).toContain('classFeature')
    expect(res.results.some((r: any) => r.kind === 'classFeature' && r.title === '圣洁武器')).toBe(true)
  })

  it('种族特性支持中英文检索和种族筛选', () => {
    const cn = searchAll('天启', { type: 'speciesTrait', limit: 5 })
    expect(cn.total).toBe(1)
    expect(cn.results[0].title).toBe('天启')
    expect(cn.results[0].kind).toBe('speciesTrait')
    expect(cn.results[0].meta.speciesName).toBe('阿斯莫')

    const en = searchAll('Celestial Revelation', { type: 'speciesTrait', limit: 5 })
    expect(en.results[0].uid).toBe(cn.results[0].uid)

    const species = searchAll('', { type: 'speciesTrait', species: '阿斯莫', limit: 20 })
    expect(species.total).toBe(5)
    expect(species.results.every((r: any) => r.meta.speciesName === '阿斯莫')).toBe(true)
    expect(species.results.map((r: any) => r.title)).toEqual(expect.arrayContaining(['天界抗性', '黑暗视觉', '治愈之手', '光辉掌者', '天启']))
  })

  it('全部检索可命中独立种族特性且同名黑暗视觉保留种族来源', () => {
    const all = searchAll('天启', { type: 'all', limit: 5 })
    expect(all.results[0].kind).toBe('speciesTrait')
    expect(all.results[0].entry?.speciesName).toBe('阿斯莫')

    const darkvision = searchAll('黑暗视觉', { type: 'speciesTrait', limit: 20 })
    const exact = darkvision.results.filter((r: any) => r.title === '黑暗视觉')
    expect(exact).toHaveLength(7)
    expect(new Set(exact.map((r: any) => r.meta.speciesName)).size).toBe(7)
    expect(exact.every((r: any) => r.kind === 'speciesTrait')).toBe(true)
  })
})
