import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Character, CompendiumEntry } from '@/types'
import { insertEntry } from '@/lib/insert'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.resolve(here, '..', 'data', 'characters', 'justinian01.json')
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
})
