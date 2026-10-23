import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCompendium } from '../scripts/build-compendium.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const db = path.resolve(here, '..', '..', 'database')
const data = buildCompendium(db)
const by = (type: string, name: string) => data.entries.find((e: any) => e.type === type && e.name === name)

describe('规则库解析', () => {
  it('条目数量达到预期', () => {
    expect(data.counts.spells).toBe(355)
    expect(data.counts.items).toBe(243)
    expect(data.counts.feats).toBe(42)
    expect(data.counts.classFeatures).toBe(106)
    expect(data.counts.conditions).toBe(15)
    expect(data.counts.armor).toBe(12)
    expect(data.counts.shields).toBe(1)
    expect(data.counts.weapons).toBe(37)
  })

  it('法术关键字段', () => {
    const fireball = by('spell', '火球术') as any
    expect(fireball.level).toBe(3)
    expect(fireball.school).toBe('塑能')
    expect(fireball.range).toBe('150尺')
    expect(fireball.classes).toContain('法师')
    expect(fireball.classes).toContain('术士')
    expect(fireball.description).toContain('8d6')
    expect(fireball.description).not.toMatch(/^###/m)

    const alarm = by('spell', '警报术') as any
    expect(alarm.level).toBe(1)
    expect(alarm.ritual).toBe(true)

    const feast = by('spell', '英雄宴') as any
    expect(feast.level).toBe(6)
    expect(feast.classes).toEqual(expect.arrayContaining(['牧师', '德鲁伊']))
  })

  it('专长、状态与装备', () => {
    const alert = by('feat', '警觉') as any
    expect(alert.description).toContain('先攻获得+5')
    expect(by('condition', '昏迷')).toBeTruthy()
    expect(by('condition', '失能')).toBeTruthy()

    const plate = by('equipment', '板甲') as any
    expect(plate.kind).toBe('armor')
    expect(plate.ac.base).toBe(18)
    expect(plate.strengthReq).toBe(15)
    expect(plate.stealthDisadvantage).toBe(true)
    expect(plate.weight).toBe(65)

    const longbow = by('equipment', '长弓') as any
    expect(longbow.weight).toBe(2)
    expect(longbow.range).toBe('150/600')
    expect(longbow.properties).toContain('弹药')
    expect(longbow.weaponGroup).toBe('martial')
    const dagger = by('equipment', '匕首') as any
    expect(dagger.weaponGroup).toBe('simple')
  })

  it('没有正文混入 Markdown 标题', () => {
    const bad = data.entries.filter((e: any) => /(^|\n)#{1,6}\s/.test(e.description || ''))
    expect(bad.map((e: any) => e.name)).toEqual([])
  })

  it('基础职业特性带描述和等级', () => {
    const feature = (className: string, name: string) =>
      data.entries.find((e: any) => e.type === 'classFeature' && e.className === className && e.name === name) as any

    const layOnHands = feature('圣武士', '圣疗')
    expect(layOnHands.level).toBe(1)
    expect(layOnHands.description).toContain('治疗能量池')
    expect(layOnHands.description).toContain('×5')

    const divineSmite = feature('圣武士', '至圣斩')
    expect(divineSmite.level).toBe(2)
    expect(divineSmite.description).toContain('光耀伤害')

    expect(feature('圣武士', '额外攻击').level).toBe(5)
    expect(feature('圣武士', '灵光增效').description).toContain('守护灵光')

    const all = data.entries.filter((e: any) => e.type === 'classFeature')
    expect(all.every((e: any) => e.description.length > 0)).toBe(true)
    expect(all.some((e: any) => e.name === '属性值提升' || e.name === '圣誓特性')).toBe(false)
    expect(all.every((e: any) => !/\b1st\s+\+\d/.test(e.description))).toBe(true)
  })
})
