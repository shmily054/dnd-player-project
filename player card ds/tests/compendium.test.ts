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
    expect(data.counts.spells).toBe(391)
    expect(data.counts.items).toBe(243)
    expect(data.counts.feats).toBe(75)
    expect(data.counts.classFeatures).toBe(174)
    expect(data.counts.conditions).toBe(15)
    expect(data.counts.armor).toBe(12)
    expect(data.counts.shields).toBe(1)
    expect(data.counts.weapons).toBe(38)
  })

  it('法术关键字段', () => {
    const fireball = by('spell', '火球术') as any
    expect(fireball.level).toBe(3)
    expect(fireball.school).toBe('塑能')
    expect(fireball.range).toBe('150 尺')
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
    const alert = by('feat', '警戒') as any
    expect(alert.description).toContain('先攻熟练')
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

    const paladinSmite = feature('圣武士', '圣武斩')
    expect(paladinSmite.level).toBe(2)
    expect(paladinSmite.description).toContain('至圣斩')

    expect(feature('圣武士', '额外攻击').level).toBe(5)
    expect(feature('圣武士', '灵光增效').level).toBe(18)
    expect(feature('圣武士', '灵光增效').description).toContain('守护灵光')

    const all = data.entries.filter((e: any) => e.type === 'classFeature')
    expect(all.every((e: any) => e.description.length > 0)).toBe(true)
    expect(all.every((e: any) => !/^\d+\s*级/.test(e.name))).toBe(true)
    expect(all.every((e: any) => !/\b1st\s+\+\d/.test(e.description))).toBe(true)
  })

  it('完整解析十个种族的 38 条特性', () => {
    const traits = data.entries.filter((e: any) => e.type === 'speciesTrait')
    expect(data.counts.speciesTraits).toBe(38)
    expect(traits).toHaveLength(38)
    expect(Object.keys(data.speciesTraits)).toHaveLength(10)
    expect(Object.values(data.speciesTraits).every((count) => Number(count) > 0)).toBe(true)
    expect(data.missing.speciesTraits).toBeUndefined()
    expect(traits.every((e: any) => e.description.length > 0)).toBe(true)
    expect(traits.filter((e: any) => e.name === '黑暗视觉')).toHaveLength(7)
    expect(new Set(traits.map((e: any) => e.uid)).size).toBe(traits.length)
  })

  it('阿斯莫特性独立成条且天启保留全部变身选项', () => {
    const traits = data.entries.filter((e: any) => e.type === 'speciesTrait' && e.speciesName === '阿斯莫')
    expect(traits.map((e: any) => e.name)).toEqual(['天界抗性', '黑暗视觉', '治愈之手', '光辉掌者', '天启'])
    const revelation = traits.find((e: any) => e.name === '天启')
    expect(revelation.en).toBe('Celestial Revelation')
    expect(revelation.level).toBe(3)
    expect(revelation.description).toContain('天堂飞翼Heavenly Wings')
    expect(revelation.description).toContain('内耀辉光Inner Radiance')
    expect(revelation.description).toContain('死灵环绕Necrotic Shroud')
    expect(revelation.description).toContain('持续至你的下一回合结束')
    expect(revelation.description).not.toContain('龙裔Dragonborn')
  })

  it('种族特性边界保留父特性选项并识别获得等级', () => {
    const bySpecies = (speciesName: string, name: string) =>
      data.entries.find((e: any) => e.type === 'speciesTrait' && e.speciesName === speciesName && e.name === name) as any
    expect(bySpecies('龙裔', '龙族飞翼').level).toBe(5)
    expect(bySpecies('歌利亚', '大型形态').level).toBe(5)
    expect(bySpecies('精灵', '精灵血系').level).toBe(1)
    expect(bySpecies('精灵', '精灵血系').description).toContain('木精灵')
    expect(bySpecies('侏儒', '侏儒血系').description).toContain('森林侏儒Forest Gnome')
    expect(bySpecies('侏儒', '侏儒血系').description).toContain('岩石侏儒Rock Gnome')
    expect(bySpecies('侏儒', '森林侏儒')).toBeUndefined()
    expect(bySpecies('提夫林', '邪魔遗赠').description).toContain('衰弱射线Ray of Enfeeblement')
  })
})
