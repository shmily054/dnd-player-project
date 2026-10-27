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
    expect(p.resources.map((r) => r.name)).toEqual(['圣疗', '引导神力'])
    expect(p.preparedFormula).toBe('cha+halfLevel')
  })

  it('全部职业使用 2024 规则：子职业 3 级、1 级有基础特性', () => {
    for (const c of data.classes) {
      expect(c.subclassLevel).toBe(3)
      expect(c.subclasses.length).toBeGreaterThan(0)
      expect(c.subclassLabel.length).toBeGreaterThan(0)
      expect(c.levels[0].features.length).toBeGreaterThan(0)
      expect(c.levels.flatMap((l) => l.features)).not.toContain(`${c.name}子职`)
    }
    expect(data.classes.flatMap((c) => c.subclasses)).toHaveLength(48)
    expect(data.classes.find((c) => c.name === '牧师')!.subclasses).toContain('光明领域')
  })

  it('2024 职业资源次数与职业表一致', () => {
    const byName = new Map(data.classes.map((c) => [c.name, c]))
    const values = (cls: string, res: string) => {
      const r = byName.get(cls)!.resources.find((x) => x.name === res)!
      return r.formula.values
    }
    expect(values('野蛮人', '狂暴')?.[19]).toBe(6)
    expect(values('野蛮人', '狂暴')?.[0]).toBe(2)
    expect(values('牧师', '引导神力')?.[5]).toBe(3)
    expect(values('牧师', '引导神力')?.[17]).toBe(4)
    expect(values('德鲁伊', '荒野变形')?.[16]).toBe(4)
    expect(values('圣武士', '引导神力')?.[10]).toBe(3)
    expect(values('战士', '回气')?.[9]).toBe(4)
    expect(values('游侠', '宿敌')?.[17]).toBe(6)
    expect(byName.get('法师')!.resources.map((r) => r.name)).toEqual(['奥术回想'])
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
