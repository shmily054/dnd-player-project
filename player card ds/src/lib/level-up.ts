import type { AbilityKey, Character, ClassDef, ClassLevelData, Feature, Resource } from '@/types'
import {
  abilityMod, autoResourcesForLevel, classLevel, getClassDef, proficiencyBonus,
  suggestedSpellSlots, totalLevel, uid,
} from '@/lib/calc'

export interface LevelUpPlan {
  className: string
  classDef: ClassDef
  currentLevel: number
  newLevel: number
  oldData: ClassLevelData | null
  newData: ClassLevelData
  newFeatures: string[]
  hpAverage: number
  hpMin: number
  hpMax: number
  conMod: number
  isAsi: boolean
  isSubclassLevel: boolean
  slotsBefore: number[]
  slotsAfter: number[]
  cantripsBefore: number
  cantripsAfter: number
  pbBefore: number
  pbAfter: number
}

function emptyData(): ClassLevelData {
  return { level: 0, features: [], slots: [0,0,0,0,0,0,0,0,0], cantrips: 0 }
}

export function getLevelUpPlan(c: Character, className: string): LevelUpPlan | null {
  const def = getClassDef(className)
  if (!def) return null
  const currentLevel = classLevel(c, className)
  if (currentLevel >= 20) return null
  const newLevel = currentLevel + 1
  const oldData = currentLevel > 0 ? def.levels[currentLevel - 1] : null
  const newData = def.levels[newLevel - 1]
  const oldFeatures = new Set(oldData?.features || [])
  const newFeatures = (newData.features || []).filter((f) => f && f !== '-' && !oldFeatures.has(f))
  const conMod = abilityMod(c.abilities.con)
  const avg = Math.floor(def.hitDie / 2) + 1
  const beforeTotal = totalLevel(c)
  return {
    className,
    classDef: def,
    currentLevel,
    newLevel,
    oldData,
    newData,
    newFeatures,
    hpAverage: Math.max(1, avg + conMod),
    hpMin: Math.max(1, 1 + conMod),
    hpMax: Math.max(1, def.hitDie + conMod),
    conMod,
    isAsi: def.asiLevels.includes(newLevel),
    isSubclassLevel: def.subclassLevel === newLevel,
    slotsBefore: oldData?.slots || [0,0,0,0,0,0,0,0,0],
    slotsAfter: newData.slots || [0,0,0,0,0,0,0,0,0],
    cantripsBefore: oldData?.cantrips || 0,
    cantripsAfter: newData.cantrips || 0,
    pbBefore: proficiencyBonus(Math.max(1, beforeTotal)),
    pbAfter: proficiencyBonus(Math.max(1, beforeTotal + 1)),
  }
}

export interface LevelUpOptions {
  hpGain: number
  asi?: Partial<Record<AbilityKey, number>>
  feat?: Feature | null
  subclass?: string
}

function updateResources(next: Character, def: ClassDef, level: number): string[] {
  const summary: string[] = []
  const wanted = autoResourcesForLevel(def, level, next)
  for (const w of wanted) {
    const existing = next.resources.find((r) => r.name === w.name)
    if (!existing) {
      next.resources.push(w)
      summary.push(`获得资源「${w.name}」（${w.infinite ? '无限' : w.total}）`)
    } else if (existing.auto !== false) {
      const changed = existing.total !== w.total || existing.reset !== w.reset
      existing.total = w.total
      existing.reset = w.reset
      existing.infinite = w.infinite
      existing.source = def.name
      existing.auto = true
      if (changed) summary.push(`资源「${w.name}」更新为 ${w.infinite ? '无限' : w.total}（${w.reset === 'short' ? '短休' : w.reset === 'long' ? '长休' : '不恢复'}）`)
    }
  }
  return summary
}

export function applyLevelUp(c: Character, className: string, opts: LevelUpOptions): { character: Character; summary: string[]; newFeatures: string[] } {
  const plan = getLevelUpPlan(c, className)
  if (!plan) throw new Error('无法升级：职业不存在或已达 20 级')
  const next: Character = JSON.parse(JSON.stringify(c))
  let entry = next.classes.find((x) => x.name === className)
  if (!entry) {
    entry = { name: className, subclass: '', level: 0, hitDie: plan.classDef.hitDie }
    next.classes.push(entry)
  }
  const oldLevel = entry.level
  entry.level = plan.newLevel
  entry.hitDie = plan.classDef.hitDie
  if (opts.subclass && plan.isSubclassLevel) entry.subclass = opts.subclass

  const hpGain = Math.max(0, Math.min(plan.hpMax, Math.round(opts.hpGain)))
  next.hp.max += hpGain
  if (next.hp.current > 0) next.hp.current = Math.min(next.hp.max, next.hp.current + hpGain)
  const totalHd = next.classes.reduce((n, x) => n + x.level, 0)
  next.hitDice.remaining = Math.min(totalHd, next.hitDice.remaining + (plan.newLevel - oldLevel))

  if (opts.asi) {
    for (const [k, v] of Object.entries(opts.asi)) {
      const key = k as AbilityKey
      next.abilities[key] = Math.min(20, (next.abilities[key] || 10) + (Number(v) || 0))
    }
  }
  if (opts.feat) {
    next.features.push({ ...opts.feat, source: '专长' })
  }

  const summary: string[] = []
  summary.push(`等级 ${plan.currentLevel} → ${plan.newLevel}`)
  summary.push(`HP 上限 +${hpGain}（当前 ${next.hp.current}/${next.hp.max}）`)
  if (plan.pbAfter !== plan.pbBefore) summary.push(`熟练加值 ${plan.pbBefore} → ${plan.pbAfter}`)
  if (opts.subclass && plan.isSubclassLevel) summary.push(`选择${plan.classDef.subclassLabel}：${opts.subclass}`)

  const existingNames = new Set(next.features.map((f) => `${f.name}|${f.source}|${f.level ?? ''}`))
  for (const fname of plan.newFeatures) {
    const key = `${fname}|${className}|${plan.newLevel}`
    if (existingNames.has(key)) continue
    next.features.push({
      id: uid('feat'),
      name: fname,
      source: className,
      level: plan.newLevel,
      description: '',
      auto: true,
      searchName: fname.replace(/[（(].*$/, '').trim(),
    })
    summary.push(`获得特性：${fname}`)
  }
  if (opts.subclass && plan.isSubclassLevel) {
    const source = `${plan.classDef.subclassLabel}：${opts.subclass}`
    if (!next.features.some((f) => f.source === source && f.name === opts.subclass)) {
      next.features.push({
        id: uid('feat'),
        name: opts.subclass,
        source,
        level: plan.newLevel,
        description: '子职业介绍与专属特性请到规则库检索并添加。',
        auto: true,
        searchName: opts.subclass,
      })
    }
  }

  const slots = suggestedSpellSlots(next)
  const slotRecord: Record<string, { total: number; used: number; manual?: boolean }> = {}
  for (let i = 1; i <= 9; i++) {
    const total = slots.slots[i - 1] || 0
    const old = next.spellcasting.slots[String(i)]
    slotRecord[String(i)] = { total, used: Math.min(total, old?.used || 0) }
  }
  next.spellcasting.slots = slotRecord
  if (slots.pact) {
    next.spellcasting.pactSlots = {
      total: slots.pact.count,
      used: Math.min(slots.pact.count, next.spellcasting.pactSlots?.used || 0),
      level: slots.pact.level,
    }
  } else if (plan.classDef.caster !== 'pact') {
    next.spellcasting.pactSlots = next.spellcasting.pactSlots || null
  }
  summary.push(...updateResources(next, plan.classDef, plan.newLevel))

  return { character: next, summary, newFeatures: plan.newFeatures }
}

/** 为升级新增的特性自动摘录规则文字（失败则留空，由 UI 提供检索入口） */
export async function describeNewFeatures(
  c: Character,
  className: string,
  names: string[],
  search: (q: string) => Promise<{ results: { title: string; book: string; chapter: string; fullText?: string; snippet: string }[] }>,
): Promise<Character> {
  if (!names.length) return c
  const next: Character = JSON.parse(JSON.stringify(c))
  for (const name of names) {
    const base = name.replace(/[（(].*$/, '').trim()
    if (!base) continue
    try {
      const res = await search(base)
      const hit = res.results.find((r) => r.book === '玩家手册' && r.chapter.includes('第3章职业'))
      if (!hit) continue
      const f = next.features.find((x) => x.name === name && x.source === className)
      if (!f || f.description) continue
      const text = (hit.fullText || hit.snippet || '').replace(/\s+/g, ' ').slice(0, 1400)
      f.description = `（自动摘录，请核对）\n${text}`
    } catch {
      // 忽略：保留检索入口
    }
  }
  return next
}
