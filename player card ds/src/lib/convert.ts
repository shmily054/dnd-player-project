import type { CompendiumEntry, Feature, Item, SpellEntry } from '@/types'
import { uid } from '@/lib/calc'

export function spellFromEntry(e: CompendiumEntry, source = '规则库'): SpellEntry {
  return {
    id: uid('spell'),
    name: e.name,
    en: e.en || '',
    level: e.level ?? 0,
    school: e.school || '',
    castingTime: e.castingTime || '',
    range: e.range || '',
    components: e.components || '',
    duration: e.duration || '',
    concentration: !!e.concentration,
    ritual: !!e.ritual,
    classes: e.classes || [],
    description: e.description || '',
    higherLevels: e.higherLevels || '',
    prepared: true,
    alwaysPrepared: false,
    source,
    note: '',
  }
}

export function itemFromEntry(e: CompendiumEntry): Item {
  if (e.type === 'equipment') {
    const isArmor = e.kind === 'armor' || e.kind === 'shield'
    const category = e.kind === 'weapon' ? '武器' : e.kind === 'shield' ? '盾牌' : '护甲'
    const item: Item = {
      id: uid('item'),
      name: e.name,
      qty: 1,
      weight: Number(e.weight) || 0,
      cost: e.cost || '',
      category,
      equipped: false,
      attuned: false,
      description: e.description || '',
      source: '装备库',
    }
    if (isArmor) {
      item.armor = {
        base: e.ac?.base ?? 0,
        dexCap: e.ac?.dexCap ?? null,
        category: e.kind === 'shield' ? 'shield' : (e.category === 'medium' || e.category === 'heavy' ? e.category : 'light'),
        acBonus: e.ac?.acBonus ?? (e.kind === 'shield' ? 2 : 0),
        strengthReq: e.strengthReq ?? null,
        stealthDisadvantage: !!e.stealthDisadvantage,
      }
    }
    if (e.kind === 'weapon') {
      item.weapon = {
        damage: e.damage || '',
        damageType: e.damageType || '',
        properties: e.properties || [],
        range: e.range || '5尺',
        versatile: e.versatile || '',
        attackAbility: e.attackAbility || 'str',
        group: e.weaponGroup,
      }
    }
    return item
  }
  return {
    id: uid('item'),
    name: e.name,
    qty: 1,
    weight: 0,
    cost: '',
    category: e.subtype ? `${e.itemType || '魔法物品'}（${e.subtype}）` : (e.itemType || '魔法物品'),
    equipped: false,
    attuned: !!e.attunement,
    description: e.description || '',
    source: '魔法物品',
  }
}

export function featureFromEntry(e: CompendiumEntry, source = '专长'): Feature {
  const desc = e.prerequisite ? `先决条件：${e.prerequisite}\n${e.description || ''}` : (e.description || '')
  return {
    id: uid('feat'),
    name: e.name,
    source,
    level: undefined,
    description: desc,
    searchName: e.name,
    auto: false,
  }
}

export function classFeatureFromEntry(e: CompendiumEntry): Feature {
  return {
    id: uid('feat'),
    name: e.name,
    source: e.subclass ? `${e.subclassLabel || '子职业'}：${e.subclass}` : (e.className || '职业特性'),
    level: e.level,
    description: e.description || '',
    searchName: e.name,
    auto: false,
  }
}

export function speciesFeatureFromEntry(e: CompendiumEntry): Feature {
  return {
    id: uid('feat'),
    name: e.name,
    source: e.speciesName || '种族特性',
    level: e.level ?? 1,
    description: e.description || '',
    searchName: e.name,
    auto: false,
  }
}

export function spellLevelLabel(level: number): string {
  return level === 0 ? '戏法' : `${level}环`
}

export function entrySubtitle(e: CompendiumEntry): string {
  if (e.type === 'spell') {
    return `${spellLevelLabel(e.level ?? 0)} · ${e.school || ''}${e.ritual ? ' · 仪式' : ''}${e.concentration ? ' · 专注' : ''}`
  }
  if (e.type === 'item') return `${e.itemType || ''}${e.subtype ? `（${e.subtype}）` : ''} · ${e.rarity || ''}${e.attunement ? ' · 需同调' : ''}`
  if (e.type === 'feat') return `专长${e.prerequisite ? ` · 先决：${e.prerequisite}` : ''}`
  if (e.type === 'classFeature') {
    if (e.featureKind === 'subclass') return `${e.subclassLabel || '子职业'} · ${e.className || '未知职业'} · ${e.level ?? '?'} 级可选`
    if (e.subclass) return `${e.subclassLabel || '子职业'}：${e.subclass} · ${e.level ?? '?'}级`
    return `职业特性 · ${e.className || '未知职业'} · ${e.level ?? '?'}级`
  }
  if (e.type === 'speciesTrait') return `种族特性 · ${e.speciesName || '未知种族'} · ${e.level ?? 1}级`
  if (e.type === 'condition') return '状态'
  if (e.type === 'equipment') {
    if (e.kind === 'weapon') return `武器 · ${e.damage || '—'} ${e.damageType || ''}${e.properties?.length ? ` · ${e.properties.join('/')}` : ''}`
    if (e.kind === 'shield') return `盾牌 · AC +${e.ac?.acBonus ?? 2}`
    return `护甲 · AC ${e.ac?.base ?? '—'}${e.ac?.dexCap ? `（敏捷上限 ${e.ac.dexCap}）` : ''}`
  }
  return ''
}
