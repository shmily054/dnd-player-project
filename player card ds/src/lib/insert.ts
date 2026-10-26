import type { Character, CompendiumEntry } from '@/types'
import { attackFromItem, maxSpellLevel, totalLevel, uid } from '@/lib/calc'
import { classFeatureFromEntry, featureFromEntry, itemFromEntry, spellFromEntry } from '@/lib/convert'

export interface InsertResult {
  character: Character
  changed: boolean
  message: string
  tone?: 'info' | 'success' | 'warn'
}

function primaryClass(c: Character): string {
  const sorted = [...(c.classes || [])].sort((a, b) => b.level - a.level)
  return sorted[0]?.name || ''
}

const CLASS_ALIASES: Record<string, string> = { 邪术师: '魔契师', 魔契师: '邪术师' }

function featureBaseName(name: string): string {
  return String(name || '').replace(/\s*[（(].*$/, '').trim()
}

export function insertEntry(c: Character, e: CompendiumEntry): InsertResult {
  const next: Character = JSON.parse(JSON.stringify(c))
  if (e.type === 'spell') {
    if (next.spellcasting.spells.some((s) => s.name === e.name)) {
      return { character: c, changed: false, message: `「${e.name}」已在法术列表中`, tone: 'info' }
    }
    const spell = spellFromEntry(e, primaryClass(c) || '规则库')
    next.spellcasting.spells.push(spell)
    const max = maxSpellLevel(next)
    const cls = primaryClass(c)
    const classHit = !e.classes?.length || !cls || e.classes.includes(cls) || e.classes.includes(CLASS_ALIASES[cls])
    if (e.level && e.level > max) {
      return {
        character: next,
        changed: true,
        message: `已加入「${e.name}」（${e.level} 环）。当前最高可施放 ${max} 环，暂时无法使用。`,
        tone: 'warn',
      }
    }
    if (!classHit) {
      return {
        character: next,
        changed: true,
        message: `已加入「${e.name}」，但它不在${cls}法术列表中，已按自定义法术处理。`,
        tone: 'warn',
      }
    }
    return { character: next, changed: true, message: `已加入法术「${e.name}」`, tone: 'success' }
  }

  if (e.type === 'feat') {
    if (next.features.some((f) => f.name === e.name && f.source === '专长')) {
      return { character: c, changed: false, message: `专长「${e.name}」已存在`, tone: 'info' }
    }
    next.features.push(featureFromEntry(e))
    return { character: next, changed: true, message: `已加入专长「${e.name}」`, tone: 'success' }
  }

  if (e.type === 'classFeature') {
    const source = e.className || '职业特性'
    const baseName = featureBaseName(e.name)
    const existing = next.features.find((f) => f.source === source && featureBaseName(f.name) === baseName)
    if (existing) {
      if (existing.auto || !existing.description) {
        existing.name = e.name
        existing.level = existing.level ?? e.level
        existing.description = e.description || existing.description
        existing.searchName = e.name
        existing.auto = false
        return { character: next, changed: true, message: `已补全职业特性「${e.name}」`, tone: 'success' }
      }
      return { character: c, changed: false, message: `职业特性「${e.name}」已存在`, tone: 'info' }
    }
    next.features.push(classFeatureFromEntry(e))
    return { character: next, changed: true, message: `已加入职业特性「${e.name}」（${source}）`, tone: 'success' }
  }

  if (e.type === 'condition') {
    const existing = next.conditions.findIndex((x) => x.name === e.name)
    if (existing >= 0) {
      next.conditions.splice(existing, 1)
      return { character: next, changed: true, message: `已移除状态「${e.name}」`, tone: 'success' }
    }
    next.conditions.push({ name: e.name })
    return { character: next, changed: true, message: `已添加状态「${e.name}」`, tone: 'success' }
  }

  if (e.type === 'item' || e.type === 'equipment') {
    const item = itemFromEntry(e)
    const same = next.inventory.find((i) => i.name === item.name && i.category === item.category)
    if (same && e.type === 'item') {
      same.qty += 1
      return { character: next, changed: true, message: `「${item.name}」数量 +1`, tone: 'success' }
    }
    next.inventory.push(item)
    let message = `已加入物品「${item.name}」`
    if (item.weapon) {
      const attack = attackFromItem(item, next)
      if (attack) {
        next.attacks.push(attack)
        message += '，并生成攻击条目'
      }
    }
    if (item.armor) {
      message += '；在物品栏勾选「装备」以计入 AC'
    }
    return { character: next, changed: true, message, tone: 'success' }
  }

  return { character: c, changed: false, message: '该条目不能直接加入角色卡', tone: 'info' }
}

export function createBlankSpell(): import('@/types').SpellEntry {
  return {
    id: uid('spell'),
    name: '自定义法术',
    level: 0,
    school: '',
    prepared: true,
    source: '自定义',
  }
}

export function createBlankItem(): import('@/types').Item {
  return {
    id: uid('item'),
    name: '新物品',
    qty: 1,
    weight: 0,
    cost: '',
    category: '冒险用品',
    equipped: false,
    attuned: false,
    description: '',
    source: '自定义',
  }
}

export function createBlankFeature(): import('@/types').Feature {
  return {
    id: uid('feat'),
    name: '新特性',
    source: '自定义',
    description: '',
  }
}

export function createBlankResource(): import('@/types').Resource {
  return {
    id: uid('res'),
    name: '新资源',
    total: 1,
    used: 0,
    reset: 'long',
  }
}

export function createBlankAttack(c: Character): import('@/types').Attack {
  return {
    id: uid('atk'),
    name: '新攻击',
    ability: 'str',
    proficient: true,
    magicBonus: 0,
    damageDice: '1d6',
    damageType: '钝击',
    properties: [],
    range: '5尺',
    notes: '',
  }
}

export function charLevel(c: Character) {
  return totalLevel(c)
}
