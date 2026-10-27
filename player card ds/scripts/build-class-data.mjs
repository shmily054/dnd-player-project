/**
 * 生成 shared/classes.json —— 2024 版《玩家手册》职业数据
 *
 * 数据来源：
 *  - 基础职业特性：规则库索引解析出的 classFeature 条目（第 3 章 `N 级：特性` 标题）
 *  - 施法位、戏法数、契约魔法、职业资源：2024 PHB 职业表，校对后写入本文件
 *  - 子职业：shared/subclasses.json
 *
 * 2024 版与 2014 版的差异已全部落到这里的常量上（子职业一律 3 级、
 * 引导神力/荒野变形/回气/宿敌等资源次数、诗人与术士改为准备施法），
 * 不再读取任何 2014 资料。
 *
 * 用法：node scripts/build-class-data.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCompendium } from './build-compendium.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const DB = path.resolve(ROOT, '..', 'database')
const SHARED = path.join(ROOT, 'shared')

/** 规则库索引里的「魔契师」，角色卡内部沿用「邪术师」。 */
const SHEET_CLASS_ALIAS = { 魔契师: '邪术师' }

const SPELL_CASTER_CLASSES = ['吟游诗人', '牧师', '德鲁伊', '术士', '法师']
const HALF_CASTER_CLASSES = ['圣武士', '游侠']

const FULL_SLOTS = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]
const HALF_SLOTS = [
  [0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,0,0,0,0],
]
/** 契约魔法：与 2024 邪术师特性表的「法术位」「法术位环阶」两列一致。 */
const PACT = [
  { count: 1, level: 1 },{ count: 2, level: 1 },{ count: 2, level: 2 },{ count: 2, level: 2 },
  { count: 2, level: 3 },{ count: 2, level: 3 },{ count: 2, level: 4 },{ count: 2, level: 4 },
  { count: 2, level: 5 },{ count: 2, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },
  { count: 3, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },
  { count: 4, level: 5 },{ count: 4, level: 5 },{ count: 4, level: 5 },{ count: 4, level: 5 },
]
/** 戏法数量：4 级与 10 级各 +1。 */
const CANTRIPS = {
  吟游诗人: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  牧师: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
  德鲁伊: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  术士: [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
  邪术师: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  法师: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
}

/**
 * 2024 版职业元数据。subclassLevel 一律为 3；preparedFormula 只描述
 * 2024 的准备法术数，已知法术职业留 null。
 */
const CLASS_META = {
  野蛮人: { en: 'Barbarian', hitDie: 12, saves: ['str','con'], primary: ['str'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'none', spellAbility: null, subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: null },
  吟游诗人: { en: 'Bard', hitDie: 8, saves: ['dex','cha'], primary: ['cha'], armorProfs: ['轻甲'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'cha', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'cha+level' },
  牧师: { en: 'Cleric', hitDie: 8, saves: ['wis','cha'], primary: ['wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'wis', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'wis+level' },
  德鲁伊: { en: 'Druid', hitDie: 8, saves: ['int','wis'], primary: ['wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'wis', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'wis+level' },
  战士: { en: 'Fighter', hitDie: 10, saves: ['str','con'], primary: ['str'], armorProfs: ['所有护甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'none', spellAbility: null, subclassLevel: 3, asiLevels: [4,6,8,12,14,16], preparedFormula: null },
  武僧: { en: 'Monk', hitDie: 8, saves: ['str','dex'], primary: ['dex','wis'], armorProfs: [], weaponProfs: ['简易武器','短剑'], caster: 'none', spellAbility: null, subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: null },
  圣武士: { en: 'Paladin', hitDie: 10, saves: ['wis','cha'], primary: ['str','cha'], armorProfs: ['所有护甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'half', spellAbility: 'cha', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'cha+halfLevel' },
  游侠: { en: 'Ranger', hitDie: 10, saves: ['str','dex'], primary: ['dex','wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'half', spellAbility: 'wis', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'wis+halfLevel' },
  游荡者: { en: 'Rogue', hitDie: 8, saves: ['dex','int'], primary: ['dex'], armorProfs: ['轻甲'], weaponProfs: ['简易武器','手弩','长剑','刺剑','短剑'], caster: 'none', spellAbility: null, subclassLevel: 3, asiLevels: [4,8,10,12,16], preparedFormula: null },
  术士: { en: 'Sorcerer', hitDie: 6, saves: ['con','cha'], primary: ['cha'], armorProfs: [], weaponProfs: ['匕首','飞镖','投石索','长棍','轻弩'], caster: 'full', spellAbility: 'cha', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'cha+level' },
  邪术师: { en: 'Warlock', hitDie: 8, saves: ['wis','cha'], primary: ['cha'], armorProfs: ['轻甲'], weaponProfs: ['简易武器'], caster: 'pact', spellAbility: 'cha', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: null },
  法师: { en: 'Wizard', hitDie: 6, saves: ['int','wis'], primary: ['int'], armorProfs: [], weaponProfs: ['匕首','飞镖','投石索','长棍','轻弩'], caster: 'full', spellAbility: 'int', subclassLevel: 3, asiLevels: [4,8,12,16], preparedFormula: 'int+level' },
}

/**
 * 2024 版职业资源。数值取自第 3 章职业特性表，与特性描述交叉核对：
 * 野蛮人 20 级 6 次（不是无限）、牧师 2/6/18 级 2/3/4 次、
 * 德鲁伊 2/6/17 级 2/3/4 次、战士回气 1/4/10 级 2/3/4 次、
 * 圣武士 3/11 级 2/3 次、游侠宿敌 5/9/13/17 级各 +1。
 */
const RESOURCES = {
  野蛮人: [
    { name: '狂暴', reset: 'long', formula: { type: 'byLevel', values: [2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6] } },
  ],
  吟游诗人: [
    { name: '诗人激励', reset: 'long', resetAtLevel: { 5: 'short' }, formula: { type: 'abilityPlus', ability: 'cha', plus: 0, min: 1 } },
  ],
  牧师: [
    { name: '引导神力', reset: 'short', minLevel: 2, formula: { type: 'byLevel', values: [0,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4] } },
  ],
  德鲁伊: [
    { name: '荒野变形', reset: 'short', minLevel: 2, formula: { type: 'byLevel', values: [0,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4] } },
  ],
  战士: [
    { name: '回气', reset: 'short', formula: { type: 'byLevel', values: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4] } },
    { name: '动作如潮', reset: 'short', minLevel: 2, formula: { type: 'byLevel', values: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2] } },
    { name: '不屈', reset: 'long', minLevel: 9, formula: { type: 'byLevel', values: [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3] } },
  ],
  武僧: [
    { name: '功力', reset: 'short', minLevel: 2, formula: { type: 'level' } },
  ],
  圣武士: [
    { name: '圣疗', reset: 'long', formula: { type: 'levelTimes', factor: 5 } },
    { name: '引导神力', reset: 'short', minLevel: 3, formula: { type: 'byLevel', values: [0,0,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3] } },
  ],
  游侠: [
    { name: '宿敌', reset: 'long', formula: { type: 'byLevel', values: [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6] } },
  ],
  游荡者: [],
  术士: [
    { name: '术法点', reset: 'long', minLevel: 2, formula: { type: 'level' } },
  ],
  邪术师: [
    { name: '秘法回流', reset: 'long', minLevel: 2, formula: { type: 'fixed', value: 1 } },
  ],
  法师: [
    { name: '奥术回想', reset: 'long', formula: { type: 'fixed', value: 1 } },
  ],
}

const CLASS_ORDER = ['野蛮人','吟游诗人','牧师','德鲁伊','战士','武僧','圣武士','游侠','游荡者','术士','邪术师','法师']

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sheetClassName(name) {
  return SHEET_CLASS_ALIAS[name] || name
}

/** 从规则库索引里取每个职业的基础特性（子职条目、子职选择占位都排除）。 */
function baseFeaturesByClass(compendium) {
  const map = new Map(CLASS_ORDER.map((name) => [name, new Map()]))
  for (const e of compendium.entries || []) {
    if (e.type !== 'classFeature') continue
    if (e.subclass) continue
    if (e.featureKind && e.featureKind !== 'feature') continue
    // 「圣武士子职」这类占位行由子职业选择负责，不再当作特性
    if (/子职$/u.test(e.name)) continue
    const className = sheetClassName(e.className)
    const byLevel = map.get(className)
    if (!byLevel) continue
    if (!byLevel.has(e.level)) byLevel.set(e.level, [])
    const list = byLevel.get(e.level)
    if (!list.includes(e.name)) list.push(e.name)
  }
  return map
}

function subclassRegistry(className) {
  const registry = readJson(path.join(SHARED, 'subclasses.json'))
  const defs = (registry.subclasses || []).filter((d) => sheetClassName(d.className) === className)
  const label = defs[0]?.label || ''
  return { label, names: defs.map((d) => d.name), level: defs[0]?.level || 3 }
}

export function buildClassData() {
  const compendium = buildCompendium(DB)
  const featuresByClass = baseFeaturesByClass(compendium)
  const warnings = []
  const classes = []

  for (const name of CLASS_ORDER) {
    const meta = CLASS_META[name]
    const registry = subclassRegistry(name)
    const byLevel = featuresByClass.get(name) || new Map()
    const levels = []
    for (let level = 1; level <= 20; level++) {
      const entry = { level, features: [...(byLevel.get(level) || [])] }
      if (meta.caster === 'full') entry.slots = FULL_SLOTS[level - 1]
      else if (meta.caster === 'half') entry.slots = HALF_SLOTS[level - 1]
      else if (meta.caster === 'pact') entry.pact = PACT[level - 1]
      const cantrips = CANTRIPS[name]
      if (cantrips) entry.cantrips = cantrips[level - 1]
      levels.push(entry)
    }

    const totalFeatures = levels.reduce((n, l) => n + l.features.length, 0)
    if (levels[0].features.length === 0) warnings.push(`${name}：1 级没有任何基础特性`)
    if (totalFeatures < 6) warnings.push(`${name}：基础特性只有 ${totalFeatures} 条，请检查索引`)
    if (!registry.names.length) warnings.push(`${name}：shared/subclasses.json 里没有子职业`)
    if (registry.level !== meta.subclassLevel) {
      warnings.push(`${name}：子职业等级登记为 ${registry.level}，与元数据 ${meta.subclassLevel} 不一致`)
    }

    classes.push({
      name,
      en: meta.en,
      hitDie: meta.hitDie,
      saves: meta.saves,
      primary: meta.primary,
      armorProfs: meta.armorProfs,
      weaponProfs: meta.weaponProfs,
      caster: meta.caster,
      spellAbility: meta.spellAbility,
      subclassLevel: meta.subclassLevel,
      subclassLabel: registry.label,
      subclasses: registry.names,
      asiLevels: meta.asiLevels,
      preparedFormula: meta.preparedFormula,
      levels,
      resources: RESOURCES[name] || [],
    })
  }

  return { version: 2, ruleset: '2024', generatedAt: new Date().toISOString(), classes, warnings }
}

function main() {
  const data = buildClassData()
  fs.writeFileSync(path.join(SHARED, 'classes.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.log(`已写入 shared/classes.json：${data.classes.length} 个职业（2024 版）`)
  for (const cls of data.classes) {
    const l1 = cls.levels[0].features
    const l5 = cls.levels[4].features
    const l20 = cls.levels[19].features
    console.log(`${cls.name}  1级: ${l1.join('、') || '—'}  |  5级: ${l5.join('、') || '—'}  |  20级: ${l20.join('、') || '—'}`)
  }
  if (data.warnings.length) {
    console.warn('警告：')
    for (const w of data.warnings) console.warn(`  - ${w}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
