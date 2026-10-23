import classDataJson from '@shared/classes.json'
import type {
  AbilityKey, Attack, Character, ClassDataFile, ClassDef, ClassLevelData,
  Item, Resource, ResourceDef,
} from '@/types'
import { ABILITIES, SKILLS, SKILL_MAP, XP_THRESHOLDS } from '@/types'

export const CLASS_DATA = classDataJson as unknown as ClassDataFile

export function getClassDef(name: string): ClassDef | undefined {
  return CLASS_DATA.classes.find((c) => c.name === name || c.en.toLowerCase() === name.toLowerCase())
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function abilityMod(score: number): number {
  return Math.floor((Number(score) - 10) / 2)
}

export function totalLevel(c: Character): number {
  return (c.classes || []).reduce((n, x) => n + (Number(x.level) || 0), 0)
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4)
}

export function classLevel(c: Character, name: string): number {
  return (c.classes || []).filter((x) => x.name === name).reduce((n, x) => n + x.level, 0)
}

export function skillBonus(c: Character, key: string): number {
  const skill = SKILL_MAP[key]
  if (!skill) return 0
  const mod = abilityMod(c.abilities[skill.ability])
  const pb = proficiencyBonus(totalLevel(c))
  const prof = c.skillProfs.includes(key)
  const exp = c.skillExpertise.includes(key)
  return mod + pb * (exp ? 2 : prof ? 1 : 0)
}

export function saveBonus(c: Character, ability: AbilityKey): number {
  return abilityMod(c.abilities[ability]) + (c.saveProfs.includes(ability) ? proficiencyBonus(totalLevel(c)) : 0)
}

export function passiveScore(c: Character, key: string, advantage = false): number {
  return 10 + skillBonus(c, key) + (advantage ? 5 : 0)
}

export function spellSaveDC(c: Character): number {
  return 8 + proficiencyBonus(totalLevel(c)) + abilityMod(c.abilities[c.spellcasting.ability])
}

export function spellAttackBonus(c: Character): number {
  return proficiencyBonus(totalLevel(c)) + abilityMod(c.abilities[c.spellcasting.ability])
}

export function equippedArmor(c: Character): Item | undefined {
  return (c.inventory || []).find((i) => i.equipped && i.armor && i.armor.category !== 'shield')
}

export function equippedShield(c: Character): Item | undefined {
  return (c.inventory || []).find((i) => i.equipped && i.armor?.category === 'shield')
}

export interface AcResult {
  value: number
  manual: boolean
  parts: string[]
}

export function acBreakdown(c: Character): AcResult {
  if (c.ac.mode === 'manual' && c.ac.manual !== null) {
    return { value: c.ac.manual, manual: true, parts: [`手动设定 ${c.ac.manual}`] }
  }
  const dex = abilityMod(c.abilities.dex)
  const con = abilityMod(c.abilities.con)
  const wis = abilityMod(c.abilities.wis)
  const armor = equippedArmor(c)
  const shield = equippedShield(c)
  const parts: string[] = []
  let value = 10
  if (armor?.armor) {
    value = armor.armor.base
    parts.push(`护甲 ${armor.name} ${armor.armor.base}`)
    if (armor.armor.category === 'light') {
      value += dex
      parts.push(`敏捷 ${formatMod(dex)}`)
    } else if (armor.armor.category === 'medium') {
      const d = Math.min(dex, armor.armor.dexCap ?? 2)
      value += d
      parts.push(`敏捷 ${formatMod(d)}${d !== dex ? '（上限）' : ''}`)
    } else {
      parts.push('重甲不加敏捷')
    }
  } else {
    const hasBarb = c.classes.some((x) => x.name === '野蛮人')
    const hasMonk = c.classes.some((x) => x.name === '武僧')
    if (hasBarb && hasMonk) {
      const a = 10 + dex + con
      const b = 10 + dex + wis
      value = Math.max(a, b)
      parts.push(`无甲防御 10 + 敏捷 ${formatMod(dex)} + ${a >= b ? '体质' : '感知'} ${formatMod(a >= b ? con : wis)}`)
    } else if (hasBarb) {
      value = 10 + dex + con
      parts.push(`无甲防御 10 + 敏捷 ${formatMod(dex)} + 体质 ${formatMod(con)}`)
    } else if (hasMonk) {
      value = 10 + dex + wis
      parts.push(`无甲防御 10 + 敏捷 ${formatMod(dex)} + 感知 ${formatMod(wis)}`)
    } else {
      value = 10 + dex
      parts.push(`无甲 10 + 敏捷 ${formatMod(dex)}`)
    }
  }
  if (shield?.armor) {
    const bonus = shield.armor.acBonus ?? 2
    value += bonus
    parts.push(`盾牌 +${bonus}`)
  }
  const defense = (c.features || []).find((f) => f.name === '防御')
  if (defense) {
    value += 1
    parts.push('防御战斗风格 +1')
  }
  return { value, manual: false, parts }
}

export function initiativeBonus(c: Character): number {
  if (c.initiative.mode === 'manual' && c.initiative.manual !== null) return c.initiative.manual
  let v = abilityMod(c.abilities.dex)
  if ((c.features || []).some((f) => f.name === '警觉')) v += 5
  return v
}

export function totalWeight(c: Character): number {
  return (c.inventory || []).reduce((n, i) => n + (Number(i.qty) || 0) * (Number(i.weight) || 0), 0)
}

export function carryCapacity(c: Character): number {
  return Math.max(0, c.abilities.str) * 15
}

export function encumbrance(c: Character) {
  const w = totalWeight(c)
  const str = Math.max(0, c.abilities.str)
  const capacity = str * 15
  const enc = str * 5
  const heavy = str * 10
  const status = w > heavy ? 'heavy' : w > enc ? 'encumbered' : 'normal'
  return { weight: w, capacity, encumberedAt: enc, heavyAt: heavy, status }
}

export function coinTotalGp(c: Character): number {
  const v = c.currency
  return v.pp * 10 + v.gp + v.ep * 0.5 + v.sp * 0.1 + v.cp * 0.01
}

export function xpInfo(c: Character) {
  const lv = Math.max(1, Math.min(20, totalLevel(c)))
  const base = XP_THRESHOLDS[lv - 1] ?? 0
  const next = lv < 20 ? XP_THRESHOLDS[lv] : null
  const progress = next === null ? 1 : Math.max(0, Math.min(1, (c.xp - base) / (next - base)))
  return { level: lv, base, next, progress, canLevel: next !== null && c.xp >= next }
}

export function totalHitDice(c: Character): number {
  return (c.classes || []).reduce((n, x) => n + x.level, 0)
}

export function hitDiceLabel(c: Character): string {
  const counts = new Map<number, number>()
  for (const x of c.classes || []) {
    if (!x.level) continue
    counts.set(x.hitDie, (counts.get(x.hitDie) || 0) + x.level)
  }
  return [...counts.entries()].map(([die, n]) => `${n}d${die}`).join(' + ') || '—'
}

const FULL_SLOTS = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]

export function suggestedSpellSlots(c: Character): { slots: number[]; pact: { count: number; level: number } | null } {
  const classes = (c.classes || []).filter((x) => x.level > 0)
  const casterClasses = classes.map((x) => ({ ...x, def: getClassDef(x.name) })).filter((x) => x.def && x.def.caster !== 'none')
  if (!casterClasses.length) return { slots: [0,0,0,0,0,0,0,0,0], pact: null }
  if (casterClasses.length === 1) {
    const x = casterClasses[0]
    const row = x.def!.levels[Math.max(0, Math.min(19, x.level - 1))]
    if (x.def!.caster === 'pact') return { slots: [0,0,0,0,0,0,0,0,0], pact: row.pact || null }
    return { slots: row.slots || [0,0,0,0,0,0,0,0,0], pact: null }
  }
  let fullLevel = 0
  let pact = null as { count: number; level: number } | null
  for (const x of casterClasses) {
    if (x.def!.caster === 'full') fullLevel += x.level
    else if (x.def!.caster === 'half') fullLevel += Math.floor(x.level / 2)
    else if (x.def!.caster === 'pact') {
      const row = x.def!.levels[Math.max(0, Math.min(19, x.level - 1))]
      pact = row.pact || null
    }
  }
  const row = FULL_SLOTS[Math.max(0, Math.min(19, fullLevel - 1))] || FULL_SLOTS[0]
  return { slots: row, pact }
}

export function preparedLimit(c: Character): number | null {
  let total = 0
  let any = false
  for (const x of c.classes || []) {
    const def = getClassDef(x.name)
    if (!def?.preparedFormula) continue
    any = true
    const mod = abilityMod(c.abilities[def.spellAbility || 'int'])
    if (def.preparedFormula.endsWith('+halfLevel')) total += Math.max(1, mod + Math.floor(x.level / 2))
    else if (def.preparedFormula.endsWith('+level')) total += Math.max(1, mod + x.level)
    else total += Math.max(1, mod)
  }
  return any ? total : null
}

export function preparedCount(c: Character): number {
  return (c.spellcasting.spells || []).filter((s) => s.prepared && !s.alwaysPrepared).length
}

export function maxSpellLevel(c: Character): number {
  let max = 0
  for (const [k, v] of Object.entries(c.spellcasting.slots || {})) {
    if ((v?.total || 0) > 0) max = Math.max(max, Number(k))
  }
  if (c.spellcasting.pactSlots?.total) max = Math.max(max, c.spellcasting.pactSlots.level)
  return max
}

export function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

export function formatCoins(c: Character): string {
  const parts: string[] = []
  if (c.currency.pp) parts.push(`${c.currency.pp} pp`)
  if (c.currency.gp) parts.push(`${c.currency.gp} gp`)
  if (c.currency.ep) parts.push(`${c.currency.ep} ep`)
  if (c.currency.sp) parts.push(`${c.currency.sp} sp`)
  if (c.currency.cp) parts.push(`${c.currency.cp} cp`)
  return parts.join(' · ') || '—'
}

export function evaluateResourceFormula(def: ResourceDef, level: number, abilities: Record<AbilityKey, number>): { total: number; infinite: boolean } {
  const f = def.formula
  if (f.type === 'fixed') return { total: f.value || 0, infinite: false }
  if (f.type === 'level') return { total: Math.max(0, level), infinite: false }
  if (f.type === 'levelTimes') return { total: Math.max(0, level * (f.factor || 0)), infinite: false }
  if (f.type === 'abilityPlus') {
    const mod = abilityMod(abilities[f.ability || 'cha'])
    return { total: Math.max(f.min ?? 0, mod + (f.plus || 0)), infinite: false }
  }
  if (f.type === 'byLevel') {
    const v = f.values?.[Math.max(0, Math.min((f.values?.length || 1) - 1, level - 1))]
    if (v === '无限' || v === 'unlimited') return { total: 999, infinite: true }
    return { total: Number(v) || 0, infinite: false }
  }
  return { total: 0, infinite: false }
}

export function autoResourcesForLevel(def: ClassDef, level: number, c: Character): Resource[] {
  const out: Resource[] = []
  for (const rd of def.resources || []) {
    if ((rd.minLevel || 0) > level) continue
    const { total, infinite } = evaluateResourceFormula(rd, level, c.abilities)
    let reset = rd.reset
    if (rd.resetAtLevel) {
      for (const [k, v] of Object.entries(rd.resetAtLevel)) {
        if (level >= Number(k)) reset = v
      }
    }
    out.push({
      id: uid('res'),
      name: rd.name,
      total,
      used: 0,
      reset,
      source: def.name,
      auto: true,
      infinite,
    })
  }
  return out
}

export function hitDiceGain(classes: { name: string; level: number; hitDie: number }[]): string {
  return classes.map((x) => `${x.level}d${x.hitDie}`).join(' + ')
}

export function skillList() {
  return SKILLS
}

export function abilityList() {
  return ABILITIES
}

/** 短休：恢复短休资源与契约法术位，可花费生命骰回血 */
export function applyShortRest(c: Character, hitDiceSpent: number, healing: number): { character: Character; summary: string[] } {
  const next: Character = JSON.parse(JSON.stringify(c))
  const summary: string[] = []
  const spent = Math.max(0, Math.min(hitDiceSpent, next.hitDice.remaining))
  if (spent > 0) {
    next.hitDice.remaining -= spent
    summary.push(`花费 ${spent} 颗生命骰`)
  }
  if (healing > 0) {
    const before = next.hp.current
    next.hp.current = Math.min(next.hp.max, next.hp.current + healing)
    summary.push(`恢复 ${next.hp.current - before} HP（${before} → ${next.hp.current}）`)
  }
  for (const r of next.resources) {
    if (r.reset === 'short' && r.used > 0) {
      r.used = 0
      summary.push(`恢复「${r.name}」`)
    }
  }
  if (next.spellcasting.pactSlots?.used) {
    next.spellcasting.pactSlots.used = 0
    summary.push('恢复契约法术位')
  }
  if (!summary.length) summary.push('短休完成，无需恢复的资源')
  return { character: next, summary }
}

/** 长休：回满 HP、法术位、生命骰一半、力竭 -1，清除专注 */
export function applyLongRest(c: Character): { character: Character; summary: string[] } {
  const next: Character = JSON.parse(JSON.stringify(c))
  const summary: string[] = []
  if (next.hp.current < next.hp.max) {
    summary.push(`HP ${next.hp.current} → ${next.hp.max}`)
    next.hp.current = next.hp.max
  }
  let slotCount = 0
  for (const v of Object.values(next.spellcasting.slots || {})) {
    if (v.used) {
      slotCount += v.used
      v.used = 0
    }
  }
  if (slotCount) summary.push(`恢复 ${slotCount} 个法术位`)
  if (next.spellcasting.pactSlots?.used) {
    next.spellcasting.pactSlots.used = 0
    summary.push('恢复契约法术位')
  }
  let resCount = 0
  for (const r of next.resources) {
    if ((r.reset === 'short' || r.reset === 'long') && r.used > 0) {
      r.used = 0
      resCount++
    }
  }
  if (resCount) summary.push(`恢复 ${resCount} 项职业资源`)
  const total = totalHitDice(next)
  if (total > 0) {
    const before = next.hitDice.remaining
    next.hitDice.remaining = Math.min(total, before + Math.max(1, Math.floor(total / 2)))
    if (next.hitDice.remaining > before) summary.push(`生命骰 ${before} → ${next.hitDice.remaining}`)
  }
  if (next.exhaustion > 0) {
    next.exhaustion -= 1
    summary.push(`力竭等级降低至 ${next.exhaustion}`)
  }
  if (next.deathSaves.successes || next.deathSaves.failures) {
    next.deathSaves.successes = 0
    next.deathSaves.failures = 0
    summary.push('死亡豁免重置')
  }
  if (next.concentration) {
    next.concentration = null
    summary.push('专注结束')
  }
  if (!summary.length) summary.push('长休完成，所有状态已恢复')
  return { character: next, summary }
}

/** 从物品生成攻击条目 */
export function attackFromItem(item: Item, c: Character): Attack | null {
  if (!item.weapon) return null
  const abilityKey: AbilityKey = item.weapon.attackAbility === 'dex' ? 'dex' : 'str'
  const group = item.weapon.group
  const specific = c.weaponProfs.some((p) => p !== '简易武器' && p !== '军用武器' && p !== '所有武器' && item.name.includes(p))
  const generic = c.weaponProfs.includes('所有武器')
    || (group === 'simple' && c.weaponProfs.includes('简易武器'))
    || (group === 'martial' && c.weaponProfs.includes('军用武器'))
    || (!group && (c.weaponProfs.includes('简易武器') || c.weaponProfs.includes('军用武器')))
  const proficient = c.weaponProfs.length === 0 || generic || specific
  return {
    id: uid('atk'),
    name: item.name,
    ability: abilityKey,
    proficient,
    magicBonus: item.magicBonus || 0,
    damageDice: item.weapon.damage,
    damageType: item.weapon.damageType,
    properties: item.weapon.properties || [],
    range: item.weapon.range || '5尺',
    notes: item.description || '',
    sourceItemId: item.id,
  }
}

export function attackBonus(c: Character, a: Attack): number {
  const mod = abilityMod(c.abilities[a.ability])
  const pb = a.proficient ? proficiencyBonus(totalLevel(c)) : 0
  return mod + pb + (a.magicBonus || 0)
}

export function damageBonus(c: Character, a: Attack): number {
  return abilityMod(c.abilities[a.ability]) + (a.magicBonus || 0)
}

export function classByLevel(c: Character, name: string): ClassLevelData | null {
  const def = getClassDef(name)
  const lv = classLevel(c, name)
  if (!def || !lv) return null
  return def.levels[Math.max(0, Math.min(19, lv - 1))] || null
}
