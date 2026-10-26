import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Character, CompendiumEntry } from '@/types'
import { insertEntry } from '@/lib/insert'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.resolve(here, 'fixtures', 'sample-character.json')
const base = () => JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Character

const layOnHands: CompendiumEntry = {
  uid: 'classFeature-test-lay-on-hands',
  type: 'classFeature',
  name: '圣疗',
  en: 'Lay on Hands',
  className: '圣武士',
  level: 1,
  description: '你获得一个治疗能量池，其可恢复生命值等于圣武士等级×5。',
  book: '玩家手册',
  chapter: '第3章职业',
  page: 74,
}

describe('规则库条目加入角色卡', () => {
  it('职业特性加入特性列表', () => {
    const c = base()
    c.features = []
    const res = insertEntry(c, layOnHands)
    expect(res.changed).toBe(true)
    expect(res.character.features).toHaveLength(1)
    expect(res.character.features[0]).toMatchObject({
      name: '圣疗',
      source: '圣武士',
      level: 1,
      searchName: '圣疗',
      auto: false,
    })
    expect(res.character.features[0].description).toContain('治疗能量池')
  })

  it('补全自动生成但缺描述的职业特性', () => {
    const c = base()
    c.features = [{
      id: 'auto-lay-on-hands',
      name: '圣疗',
      source: '圣武士',
      level: 1,
      description: '',
      auto: true,
    }]
    const res = insertEntry(c, layOnHands)
    expect(res.changed).toBe(true)
    expect(res.character.features).toHaveLength(1)
    expect(res.character.features[0].description).toContain('治疗能量池')
    expect(res.character.features[0].auto).toBe(false)
  })

  it('已有完整同名职业特性时不重复添加', () => {
    const c = base()
    c.features = [{
      id: 'existing-lay-on-hands',
      name: '圣疗',
      source: '圣武士',
      level: 1,
      description: '已有描述',
      auto: false,
    }]
    const res = insertEntry(c, layOnHands)
    expect(res.changed).toBe(false)
    expect(res.character.features).toHaveLength(1)
  })

  it('种族特性加入对应来源、去重并可补全空条目', () => {
    const revelation: CompendiumEntry = {
      uid: 'speciesTrait-test-revelation',
      type: 'speciesTrait',
      name: '天启',
      en: 'Celestial Revelation',
      speciesName: '阿斯莫',
      speciesEn: 'Aasimar',
      level: 3,
      book: '玩家手册',
      chapter: '第4章角色起源',
      page: 113,
      description: '完整天启规则，包含天堂飞翼、内耀辉光与死灵环绕。',
    }
    const c = base()
    c.features = []
    const inserted = insertEntry(c, revelation)
    expect(inserted.changed).toBe(true)
    expect(inserted.character.features).toHaveLength(1)
    expect(inserted.character.features[0]).toMatchObject({ name: '天启', source: '阿斯莫', level: 3, description: revelation.description })

    const duplicate = insertEntry(inserted.character, revelation)
    expect(duplicate.changed).toBe(false)
    expect(duplicate.character.features).toHaveLength(1)

    const incomplete = base()
    incomplete.features = [{ id: 'blank-revelation', name: '天启', source: '阿斯莫', description: '', auto: true }]
    const completed = insertEntry(incomplete, revelation)
    expect(completed.changed).toBe(true)
    expect(completed.character.features).toHaveLength(1)
    expect(completed.character.features[0].description).toBe(revelation.description)
    expect(completed.character.features[0].auto).toBe(false)
  })

  it('不同种族的同名特性可以同时加入', () => {
    const darkvision = (speciesName: string): CompendiumEntry => ({
      uid: `speciesTrait-test-darkvision-${speciesName}`,
      type: 'speciesTrait',
      name: '黑暗视觉',
      en: 'Darkvision',
      speciesName,
      level: 1,
      book: '玩家手册',
      chapter: '第4章角色起源',
      page: 113,
      description: `${speciesName}的黑暗视觉。`,
    })
    const c = base()
    c.features = []
    const aasimar = insertEntry(c, darkvision('阿斯莫'))
    const dwarf = insertEntry(aasimar.character, darkvision('矮人'))
    expect(dwarf.changed).toBe(true)
    expect(dwarf.character.features.map((f) => f.source)).toEqual(['阿斯莫', '矮人'])
  })
})
