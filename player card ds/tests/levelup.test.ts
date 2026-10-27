import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Character } from '@/types'
import { applyLevelUp, getLevelUpPlan, subclassFeaturesAt } from '@/lib/level-up'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const fixturePath = path.resolve(here, 'fixtures', 'sample-character.json')
const base = () => JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Character

function paladin(level: number, subclass: string): Character {
  const c = base()
  c.classes = [{ name: '圣武士', subclass, level, hitDie: 10 }]
  c.features = []
  return c
}

describe('2024 子职业成长表', () => {
  it('奉献之誓的特性按等级索引', () => {
    expect(subclassFeaturesAt('圣武士', '奉献之誓', 3).map((f) => f.name)).toEqual(['奉献之誓法术', '圣洁武器'])
    expect(subclassFeaturesAt('圣武士', '奉献之誓', 7).map((f) => f.name)).toEqual(['奉献灵光'])
    expect(subclassFeaturesAt('圣武士', '奉献之誓', 15).map((f) => f.name)).toEqual(['卫护斩'])
    expect(subclassFeaturesAt('圣武士', '奉献之誓', 20).map((f) => f.name)).toEqual(['至圣光轮'])
    expect(subclassFeaturesAt('圣武士', '不存在的誓言', 3)).toEqual([])
  })

  it('职业数据里的子职列表已对齐 2024 版', () => {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'classes.json'), 'utf8'))
    const paladinDef = data.classes.find((c: { name: string }) => c.name === '圣武士')
    expect(paladinDef.subclassLabel).toBe('神圣誓言')
    expect(paladinDef.subclasses).toContain('奉献之誓')
    expect(paladinDef.subclasses).toContain('荣耀之誓')
    const warlock = data.classes.find((c: { name: string }) => c.name === '邪术师')
    expect(warlock.subclasses).toContain('天界宗主')
  })

  it('圣武士 2 → 3 级：自动获得奉献之誓法术与圣洁武器', () => {
    const c = paladin(2, '奉献之誓')
    const plan = getLevelUpPlan(c, '圣武士')!
    expect(plan.isSubclassLevel).toBe(true)
    expect(plan.subclassFeatures.map((f) => f.name)).toEqual(['奉献之誓法术', '圣洁武器'])

    const res = applyLevelUp(c, '圣武士', { hpGain: 8 })
    const names = res.character.features.map((f) => `${f.source}|${f.name}`)
    expect(names).toContain('神圣誓言：奉献之誓|奉献之誓法术')
    expect(names).toContain('神圣誓言：奉献之誓|圣洁武器')
    expect(res.summary).toContain('获得子职特性：圣洁武器')
    expect(res.newFeatures).toContain('圣洁武器')
  })

  it('选择子职的等级：占位条目与当级子职特性一并写入', () => {
    const c = paladin(2, '')
    const res = applyLevelUp(c, '圣武士', { hpGain: 8, subclass: '奉献之誓' })
    expect(res.character.classes[0].subclass).toBe('奉献之誓')
    const names = res.character.features.map((f) => `${f.source}|${f.name}`)
    expect(names).toContain('神圣誓言：奉献之誓|奉献之誓')
    expect(names).toContain('神圣誓言：奉献之誓|圣洁武器')
  })

  it('6 → 7 级：获得奉献灵光，且重复升级不会叠加', () => {
    const c = paladin(6, '奉献之誓')
    const res = applyLevelUp(c, '圣武士', { hpGain: 8 })
    expect(res.character.features.filter((f) => f.name === '奉献灵光')).toHaveLength(1)
    expect(res.character.features.find((f) => f.name === '奉献灵光')!.source).toBe('神圣誓言：奉献之誓')
  })

  it('未选子职时不产生子职特性', () => {
    const c = paladin(6, '')
    const plan = getLevelUpPlan(c, '圣武士')!
    expect(plan.subclassFeatures).toEqual([])
    expect(applyLevelUp(c, '圣武士', { hpGain: 8 }).newFeatures).not.toContain('奉献灵光')
  })
})
