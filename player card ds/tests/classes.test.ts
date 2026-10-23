import { describe, expect, it } from 'vitest'
import classData from '@shared/classes.json'
import type { ClassDataFile } from '@/types'

const data = classData as unknown as ClassDataFile

describe('职业成长数据', () => {
  it('12 个职业各有 20 级', () => {
    expect(data.classes).toHaveLength(12)
    for (const c of data.classes) {
      expect(c.levels).toHaveLength(20)
      expect(c.levels.map((l) => l.level)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
      expect(c.armorProfs.length + c.weaponProfs.length).toBeGreaterThan(0)
    }
  })

  it('圣武士 5 级：额外攻击与 4/2 法术位', () => {
    const p = data.classes.find((c) => c.name === '圣武士')!
    expect(p.levels[4].features).toContain('额外攻击')
    expect(p.levels[4].slots?.slice(0, 2)).toEqual([4, 2])
    expect(p.resources.map((r) => r.name)).toEqual(expect.arrayContaining(['圣疗', '神圣感知', '引导神力']))
    expect(p.preparedFormula).toBe('cha+halfLevel')
  })

  it('法师、牧师、邪术师的施法类型', () => {
    expect(data.classes.find((c) => c.name === '法师')!.caster).toBe('full')
    expect(data.classes.find((c) => c.name === '牧师')!.preparedFormula).toBe('wis+level')
    const w = data.classes.find((c) => c.name === '邪术师')!
    expect(w.caster).toBe('pact')
    expect(w.levels[0].pact).toEqual({ count: 1, level: 1 })
    expect(w.levels[19].pact).toEqual({ count: 4, level: 5 })
  })
})
