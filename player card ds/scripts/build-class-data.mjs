/**
 * 生成 shared/classes.json
 *
 * 职业特性名从 database 的职业表中提取；施法位、职业资源、子职业信息
 * 使用 PHB 标准数据在校对后写入。生成后应人工抽查关键等级。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const DB = path.resolve(ROOT, '..', 'database')
const CH3 = path.join(DB, 'player handbook', '03-第3章职业.md')

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
const PACT = [
  { count: 1, level: 1 },{ count: 2, level: 1 },{ count: 2, level: 2 },{ count: 2, level: 2 },
  { count: 2, level: 3 },{ count: 2, level: 3 },{ count: 2, level: 4 },{ count: 2, level: 4 },
  { count: 2, level: 5 },{ count: 2, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },
  { count: 3, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },{ count: 3, level: 5 },
  { count: 4, level: 5 },{ count: 4, level: 5 },{ count: 4, level: 5 },{ count: 4, level: 5 },
]
const CANTRIPS = {
  吟游诗人: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  牧师: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
  德鲁伊: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  术士: [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
  邪术师: [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  法师: [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
}

const CLASS_META = {
  野蛮人: { en: 'Barbarian', hitDie: 12, saves: ['str','con'], primary: ['str'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'none', spellAbility: null, subclassLevel: 3, subclassLabel: '原初道途', subclasses: ['狂战士道途','图腾武者道途'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  吟游诗人: { en: 'Bard', hitDie: 8, saves: ['dex','cha'], primary: ['cha'], armorProfs: ['轻甲'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'cha', subclassLevel: 3, subclassLabel: '诗人学院', subclasses: ['轶闻学院','勇气学院'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  牧师: { en: 'Cleric', hitDie: 8, saves: ['wis','cha'], primary: ['wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'wis', subclassLevel: 1, subclassLabel: '神圣领域', subclasses: ['知识领域','生命领域','光明领域','自然领域','风暴领域','诡术领域','战争领域'], asiLevels: [4,8,12,16,19], preparedFormula: 'wis+level' },
  德鲁伊: { en: 'Druid', hitDie: 8, saves: ['int','wis'], primary: ['wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器'], caster: 'full', spellAbility: 'wis', subclassLevel: 2, subclassLabel: '德鲁伊结社', subclasses: ['大地结社','月亮结社'], asiLevels: [4,8,12,16,19], preparedFormula: 'wis+level' },
  战士: { en: 'Fighter', hitDie: 10, saves: ['str','con'], primary: ['str'], armorProfs: ['所有护甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'none', spellAbility: null, subclassLevel: 3, subclassLabel: '武术范型', subclasses: ['勇士','战斗大师','奥法骑士'], asiLevels: [4,6,8,12,14,16,19], preparedFormula: null },
  武僧: { en: 'Monk', hitDie: 8, saves: ['str','dex'], primary: ['dex','wis'], armorProfs: [], weaponProfs: ['简易武器','短剑'], caster: 'none', spellAbility: null, subclassLevel: 3, subclassLabel: '修行宗派', subclasses: ['散打宗','暗影宗','四象宗'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  圣武士: { en: 'Paladin', hitDie: 10, saves: ['wis','cha'], primary: ['str','cha'], armorProfs: ['所有护甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'half', spellAbility: 'cha', subclassLevel: 3, subclassLabel: '神圣誓言', subclasses: ['奉献之誓','古贤之誓','复仇之誓'], asiLevels: [4,8,12,16,19], preparedFormula: 'cha+halfLevel' },
  游侠: { en: 'Ranger', hitDie: 10, saves: ['str','dex'], primary: ['dex','wis'], armorProfs: ['轻甲','中甲','盾牌'], weaponProfs: ['简易武器','军用武器'], caster: 'half', spellAbility: 'wis', subclassLevel: 3, subclassLabel: '游侠范型', subclasses: ['猎人','驯兽师'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  游荡者: { en: 'Rogue', hitDie: 8, saves: ['dex','int'], primary: ['dex'], armorProfs: ['轻甲'], weaponProfs: ['简易武器','手弩','长剑','刺剑','短剑'], caster: 'none', spellAbility: null, subclassLevel: 3, subclassLabel: '游荡者范型', subclasses: ['盗贼','刺客','诡术师'], asiLevels: [4,8,10,12,16,19], preparedFormula: null },
  术士: { en: 'Sorcerer', hitDie: 6, saves: ['con','cha'], primary: ['cha'], armorProfs: [], weaponProfs: ['匕首','飞镖','投石索','长棍','轻弩'], caster: 'full', spellAbility: 'cha', subclassLevel: 1, subclassLabel: '术法起源', subclasses: ['龙族血脉','狂野魔法'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  邪术师: { en: 'Warlock', hitDie: 8, saves: ['wis','cha'], primary: ['cha'], armorProfs: ['轻甲'], weaponProfs: ['简易武器'], caster: 'pact', spellAbility: 'cha', subclassLevel: 1, subclassLabel: '异界宗主', subclasses: ['至高妖精','邪魔','旧日支配者'], asiLevels: [4,8,12,16,19], preparedFormula: null },
  法师: { en: 'Wizard', hitDie: 6, saves: ['int','wis'], primary: ['int'], armorProfs: [], weaponProfs: ['匕首','飞镖','投石索','长棍','轻弩'], caster: 'full', spellAbility: 'int', subclassLevel: 2, subclassLabel: '奥术传承', subclasses: ['防护学派','咒法学派','预言学派','附魔学派','塑能学派','幻术学派','死灵学派','变化学派'], asiLevels: [4,8,12,16,19], preparedFormula: 'int+level' },
}

const RESOURCES = {
  野蛮人: [
    { name: '狂暴', reset: 'long', formula: { type: 'byLevel', values: [2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,'无限'] } },
  ],
  吟游诗人: [
    { name: '诗人激励', reset: 'long', resetAtLevel: { 5: 'short' }, formula: { type: 'abilityPlus', ability: 'cha', plus: 0, min: 1 } },
  ],
  牧师: [
    { name: '引导神力', reset: 'short', formula: { type: 'byLevel', values: [1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3] }, minLevel: 2 },
  ],
  德鲁伊: [
    { name: '荒野形态', reset: 'short', formula: { type: 'byLevel', values: [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,'无限'] }, minLevel: 2 },
  ],
  战士: [
    { name: '回气', reset: 'short', formula: { type: 'fixed', value: 1 } },
    { name: '动作如潮', reset: 'short', formula: { type: 'byLevel', values: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2] }, minLevel: 2 },
    { name: '不屈', reset: 'long', formula: { type: 'byLevel', values: [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3] }, minLevel: 9 },
  ],
  武僧: [
    { name: '气', reset: 'short', formula: { type: 'level' }, minLevel: 2 },
  ],
  圣武士: [
    { name: '圣疗', reset: 'long', formula: { type: 'levelTimes', factor: 5 } },
    { name: '神圣感知', reset: 'long', formula: { type: 'abilityPlus', ability: 'cha', plus: 1 } },
    { name: '引导神力', reset: 'short', formula: { type: 'fixed', value: 1 }, minLevel: 3 },
    { name: '净化之触', reset: 'long', formula: { type: 'abilityPlus', ability: 'cha', plus: 0, min: 1 }, minLevel: 14 },
  ],
  游侠: [],
  游荡者: [],
  术士: [
    { name: '术法点', reset: 'long', formula: { type: 'level' }, minLevel: 2 },
  ],
  邪术师: [],
  法师: [
    { name: '奥术回想', reset: 'long', formula: { type: 'fixed', value: 1 } },
  ],
}

function cleanLine(s) {
  return s.replace(/\{\{p\.\d+\}\}/g, '').replace(/\s+/g, ' ').trim()
}

function parseClassTable(lines, title) {
  const start = lines.findIndex((l) => l.trim().startsWith(title))
  if (start < 0) return null
  const rowStarts = []
  for (let i = start + 1; i < lines.length && rowStarts.length < 20; i++) {
    const t = lines[i].trim()
    if (/^\d+(?:st|nd|rd|th)\s+\+\d+/.test(t)) rowStarts.push(i)
  }
  if (rowStarts.length !== 20) return { error: `只找到 ${rowStarts.length} 行`, rows: [] }
  const rows = []
  for (let k = 0; k < rowStarts.length; k++) {
    const startIdx = rowStarts[k]
    // 最后一行后面通常紧接职业特性正文，不能按下一行判断；只取该行本身。
    let endIdx = k + 1 < rowStarts.length ? rowStarts[k + 1] : startIdx + 1
    const parts = []
    for (let j = startIdx; j < endIdx; j++) {
      const t = cleanLine(lines[j])
      if (!t) continue
      if (/^\d+$/.test(t) || /^\{\{p\./.test(t)) continue
      parts.push(t)
    }
    let content = parts.join(' ')
    content = content.replace(/^\d+(?:st|nd|rd|th)\s+\+\d+\s*/, '')
    let tokens = content.split(/\s+/).filter(Boolean)
    // 去掉职业表前面的数值列（游荡者偷袭骰、术士术法点等）
    while (tokens.length && /^(?:\+?\d+(?:\/\d+)?|\d+d\d+|无限|—|-)$/.test(tokens[0])) tokens.shift()
    // 去掉职业表右侧的数值列（狂暴次数/戏法/已知/法术位/气/术法点等）
    while (tokens.length) {
      const last = tokens[tokens.length - 1]
      if (/^(?:\+?\d+(?:\/\d+)?|\d+d\d+|\d+(?:st|nd|rd|th)|无限|—|-|\+\d+尺|\d+尺)$/.test(last)) {
        tokens.pop()
      } else break
    }
    content = tokens.join(' ')
    const features = content
      .split(/[,，、]/)
      .map((x) => {
        let f = x.trim()
        // 跨行续写时，右侧数值列可能夹在特性名前，例如「4 领域特性」「4 14 魔法奥秘」
        while (/^(?:\+?\d+(?:\/\d+)?|\d+d\d+|无限|—|-)\s+/.test(f)) f = f.replace(/^(?:\+?\d+(?:\/\d+)?|\d+d\d+|无限|—|-)\s+/, '')
        return f.trim()
      })
      .filter(Boolean)
      .filter((x) => !/^职业特性$/.test(x))
    const level = Number(lines[startIdx].trim().match(/^(\d+)/)[1])
    rows.push({ level, features })
  }
  return { rows }
}

export function buildClassData() {
  if (!fs.existsSync(CH3)) throw new Error(`找不到职业章节：${CH3}`)
  const lines = fs.readFileSync(CH3, 'utf8').split(/\r?\n/)
  const titles = {
    野蛮人: '野蛮人职业表',
    吟游诗人: '吟游诗人职业表',
    牧师: '牧师职业表',
    德鲁伊: '德鲁伊职业表',
    战士: '战士职业表',
    武僧: '武僧职业表',
    圣武士: '圣武士职业表',
    游侠: '游侠职业表',
    游荡者: '游荡着职业表',
    术士: '术士职业表',
    邪术师: '邪术师职业表',
    法师: '法师职业表',
  }
  const classes = []
  const warnings = []
  for (const [name, meta] of Object.entries(CLASS_META)) {
    const table = parseClassTable(lines, titles[name])
    if (!table || table.error) {
      warnings.push(`${name}: ${table?.error || '未找到职业表'}`)
      continue
    }
    const levels = []
    let monkSecondary = null
    if (name === '武僧') {
      const h = lines.findIndex((l) => /^无甲移动\s+职业特性$/.test(l.trim()))
      if (h >= 0) {
        monkSecondary = []
        for (let i = h + 1; i < lines.length && monkSecondary.length < 20; i++) {
          const t = cleanLine(lines[i])
          if (!t || /^\{\{p\./.test(t) || /^\d+$/.test(t)) continue
          const m = t.match(/^(?:\+\d+尺|\d+尺|[+\-—])\s*(.+)$/)
          if (!m) continue
          monkSecondary.push(m[1].split(/[,，、]/).map((x) => x.trim()).filter(Boolean))
        }
        if (monkSecondary.length !== 20) warnings.push(`武僧第二张表只找到 ${monkSecondary.length} 行`)
      }
    }
    for (let lv = 1; lv <= 20; lv++) {
      const row = table.rows.find((r) => r.level === lv)
      let features = row ? row.features : []
      if (monkSecondary && monkSecondary[lv - 1]) features = monkSecondary[lv - 1]
      const entry = { level: lv, features }
      if (meta.caster === 'full') entry.slots = FULL_SLOTS[lv - 1]
      else if (meta.caster === 'half') entry.slots = HALF_SLOTS[lv - 1]
      else if (meta.caster === 'pact') entry.pact = PACT[lv - 1]
      else entry.slots = [0,0,0,0,0,0,0,0,0]
      if (CANTRIPS[name]) entry.cantrips = CANTRIPS[name][lv - 1]
      levels.push(entry)
    }
    classes.push({
      name,
      ...meta,
      levels,
      resources: RESOURCES[name] || [],
    })
    if (name === '圣武士') {
      const lv5 = levels[4]
      if (!lv5.features.includes('额外攻击')) warnings.push('圣武士 5 级没有解析到「额外攻击」')
      if (lv5.slots[0] !== 4 || lv5.slots[1] !== 2) warnings.push('圣武士 5 级法术位不是 4/2')
    }
  }
  // 子职业列表以 2024 登记表（shared/subclasses.json）为准，避免 CLASS_META 的旧列表被写回
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'subclasses.json'), 'utf8'))
    const alias = { 魔契师: '邪术师' }
    for (const cls of classes) {
      const defs = (registry.subclasses || []).filter((d) => (alias[d.className] || d.className) === cls.name)
      if (!defs.length) continue
      cls.subclassLabel = defs[0].label || cls.subclassLabel
      cls.subclasses = defs.map((d) => d.name)
    }
  } catch (e) {
    warnings.push(`未能读取 shared/subclasses.json：${e.message}`)
  }
  return { version: 1, generatedAt: new Date().toISOString(), classes, warnings }
}

function main() {
  const data = buildClassData()
  const out = path.join(ROOT, 'shared', 'classes.json')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8')
  console.log(`[classes] ${data.classes.length} 个职业 → ${out}`)
  for (const w of data.warnings) console.log('[warn]', w)
  for (const c of data.classes) {
    const lv = (n) => c.levels[n - 1].features.join(',') || '-'
    console.log(`${c.name}: L1 ${lv(1)} | L5 ${lv(5)} | L20 ${lv(20)}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
