/**
 * 规则库解析器
 *
 * 把 database/ 下的 Markdown 章节解析成结构化条目：
 *  - 法术（含职业法术列表）
 *  - 魔法物品
 *  - 专长
 *  - 职业特性（12 个职业的基础特性）
 *  - 种族特性（第四章的 10 个种族）
 *  - 状态
 *  - 护甲 / 盾牌 / 武器
 *
 * 解析结果写入 data/compendium.json，同时生成 data/compendium-report.json。
 * 解析失败或正文串行不会阻塞应用：检索始终可以回退到原始全文。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 解析器版本：参与 sourceHash，解析逻辑升级后旧缓存会自动失效重建
export const PARSER_VERSION = 2

const RARITIES = ['普通', '非普通', '珍稀', '极珍稀', '传说', '神器']
const ITEM_TYPES = ['武器', '护甲', '盾牌', '奇物', '戒指', '权杖', '法杖', '魔杖', '药水', '卷轴', '弹药', '圣物', '载具', '工具', '其他']
const CONDITION_NAMES = [
  ['目盲', 'Blinded'],
  ['魅惑', 'Charmed'],
  ['耳聋', 'Deafened'],
  ['恐慌', 'Frightened'],
  ['受擒', 'Grappled'],
  ['擒抱', 'Grappled'],
  ['失能', 'Incapacitated'],
  ['隐形', 'Invisible'],
  ['麻痹', 'Paralyzed'],
  ['石化', 'Petrified'],
  ['力竭', 'Exhaustion'],
  ['中毒', 'Poisoned'],
  ['倒地', 'Prone'],
  ['束缚', 'Restrained'],
  ['震慑', 'Stunned'],
  ['昏迷', 'Unconscious'],
]
const FEAT_NAMES = [
  'Grappler', 'Alert', 'Athlete', 'Actor', 'Charger', 'Crossbow Expert',
  'Defensive Duelist', 'Dual Wielder', 'Dungeon Delver', 'Durable',
  'Elemental Adept', 'Great Weapon Master', 'Healer', 'Heavily Armored',
  'Heavy Armor Master', 'Inspiring Leader', 'Keen Mind', 'Lightly Armored',
  'Linguist', 'Lucky', 'Mage Slayer', 'Magic Initiate', 'Martial Adept',
  'Medium Armor Master', 'Mobile', 'Moderately Armored', 'Mounted Combatant',
  'Observant', 'Polearm Master', 'Resilient', 'Ritual Caster', 'Savage Attacker',
  'Sentinel', 'Sharpshooter', 'Shield Master', 'Skilled', 'Skulker',
  'Spell Sniper', 'Tavern Brawler', 'Tough', 'War Caster', 'Weapon Master',
]

/** 标准武器属性与重量（PHB 武器表在数据库中只保留了名称/价格/伤害三列） */
const WEAPON_META = {
  club: { weight: 2, properties: ['轻型'], ability: 'str' },
  dagger: { weight: 1, properties: ['灵巧', '轻型', '投掷'], range: '20/60', ability: 'dex' },
  greatclub: { weight: 10, properties: ['双手'], ability: 'str' },
  handaxe: { weight: 2, properties: ['轻型', '投掷'], range: '20/60', ability: 'str' },
  javelin: { weight: 2, properties: ['投掷'], range: '30/120', ability: 'str' },
  'light hammer': { weight: 2, properties: ['轻型', '投掷'], range: '20/60', ability: 'str' },
  mace: { weight: 4, properties: [], ability: 'str' },
  quarterstaff: { weight: 4, properties: ['两用'], versatile: '1d8', ability: 'str' },
  sickle: { weight: 2, properties: ['轻型'], ability: 'str' },
  spear: { weight: 3, properties: ['投掷', '两用'], range: '20/60', versatile: '1d8', ability: 'str' },
  'light crossbow': { weight: 5, properties: ['弹药', '装填', '双手'], range: '80/320', ability: 'dex' },
  dart: { weight: 0.25, properties: ['灵巧', '投掷'], range: '20/60', ability: 'dex' },
  shortbow: { weight: 2, properties: ['弹药', '双手'], range: '80/320', ability: 'dex' },
  sling: { weight: 0.1, properties: ['弹药'], range: '30/120', ability: 'dex' },
  battleaxe: { weight: 4, properties: ['两用'], versatile: '1d10', ability: 'str' },
  flail: { weight: 2, properties: [], ability: 'str' },
  glaive: { weight: 6, properties: ['重型', '触及', '双手'], ability: 'str' },
  greataxe: { weight: 7, properties: ['重型', '双手'], ability: 'str' },
  greatsword: { weight: 6, properties: ['重型', '双手'], ability: 'str' },
  halberd: { weight: 6, properties: ['重型', '触及', '双手'], ability: 'str' },
  lance: { weight: 6, properties: ['触及', '特殊'], ability: 'str' },
  longsword: { weight: 3, properties: ['两用'], versatile: '1d10', ability: 'str' },
  maul: { weight: 10, properties: ['重型', '双手'], ability: 'str' },
  morningstar: { weight: 4, properties: [], ability: 'str' },
  pike: { weight: 18, properties: ['重型', '触及', '双手'], ability: 'str' },
  rapier: { weight: 2, properties: ['灵巧'], ability: 'dex' },
  scimitar: { weight: 3, properties: ['灵巧', '轻型'], ability: 'dex' },
  shortsword: { weight: 2, properties: ['灵巧', '轻型'], ability: 'dex' },
  trident: { weight: 4, properties: ['投掷', '两用'], range: '20/60', versatile: '1d8', ability: 'str' },
  'war pick': { weight: 2, properties: [], ability: 'str' },
  warhammer: { weight: 2, properties: ['两用'], versatile: '1d10', ability: 'str' },
  whip: { weight: 2, properties: ['灵巧', '触及'], ability: 'finesse' },
  blowgun: { weight: 1, properties: ['弹药', '装填'], range: '25/100', ability: 'dex' },
  'hand crossbow': { weight: 3, properties: ['弹药', '轻型', '装填'], range: '30/120', ability: 'dex' },
  'heavy crossbow': { weight: 18, properties: ['弹药', '重型', '装填', '双手'], range: '100/400', ability: 'dex' },
  net: { weight: 3, properties: ['特殊', '投掷'], range: '5/15', ability: 'dex' },
}

function sha1(s) {
  return crypto.createHash('sha1').update(s).digest('hex')
}

function makeUid(type, name, page, extra = '') {
  return `${type}-${sha1(`${type}|${name}|${page ?? ''}|${extra}`).slice(0, 12)}`
}

function walkMd(dir) {
  const out = []
  const walk = (d) => {
    let entries = []
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(p)
    }
  }
  walk(dir)
  return out.sort()
}

function bookInfo(file, dbDir) {
  const rel = path.relative(dbDir, file)
  const top = rel.split(path.sep)[0]
  const book = top === 'player handbook' ? '玩家手册' : top === 'dungeon master guidance' ? '城主指南' : top
  const chapter = path.basename(file, '.md').replace(/^\d+-/, '')
  return { book, chapter }
}

function normName(s) {
  return String(s || '')
    .normalize('NFKC')
    .replace(/[\s·・’'"/\\()（）,，.。:：;；\-—_+]/g, '')
    .toLowerCase()
}

function splitName(line) {
  let s = String(line).trim()
  s = s.replace(/\s+/g, ' ')
  const idx = s.search(/[A-Za-z]/)
  if (idx > 0) {
    const name = s.slice(0, idx).trim()
    const en = s.slice(idx).trim()
    if (name && en) return { name, en }
  }
  return { name: s, en: '' }
}

function isCjk(s) {
  return /[\u4e00-\u9fff]/.test(s)
}

function isPageMarker(line) {
  return /^\{\{p\.\d+\}\}$/.test(line.trim())
}

function linePageMap(lines) {
  let page = null
  return lines.map((line) => {
    const m = line.match(/\{\{p\.(\d+)\}\}/)
    if (m) page = Number(m[1])
    return page
  })
}

/** 去掉页码、页眉、孤立的印刷页码，保留正文换行 */
function cleanBodyLines(lines) {
  const kept = []
  for (const raw of lines) {
    let line = raw.replace(/\{\{p\.\d+\}\}/g, '').trimEnd()
    const t = line.trim()
    if (!t) {
      if (kept.length && kept[kept.length - 1] !== '') kept.push('')
      continue
    }
    if (/^\d+$/.test(t)) continue
    if (/^#{1,6}\s/.test(t)) continue
    if (/^第\s*\d+\s*章[:：]/.test(t)) continue
    if (/^附录\s*[A-Z]\s/.test(t)) continue
    if (/^[A-Za-z0-9\s'’:,.\-–—]{1,36}$/.test(t) && !/[。,.!?]/.test(t)) continue
    kept.push(line.trim())
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function cleanInline(s) {
  return String(s || '')
    .replace(/\{\{p\.\d+\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMetaFields(lines) {
  const fields = {}
  const body = []
  let higher = false
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      body.push('')
      continue
    }
    const m = line.match(/^(施法时间|施法距离|法术成分|持续时间)\s*[:：]\s*(.+)$/)
    if (m) {
      fields[m[1]] = cleanInline(m[2])
      continue
    }
    if (/^升环施法/.test(line)) {
      higher = true
      body.push(line)
      continue
    }
    if (higher) body.push(line)
    else body.push(line)
  }
  let text = cleanBodyLines(body)
  let high = ''
  const higherMatch = text.match(/升环施法(?:效应)?/)
  const hi = higherMatch ? higherMatch.index : -1
  if (hi >= 0) {
    high = text.slice(hi).trim()
    text = text.slice(0, hi).trim()
  }
  return {
    castingTime: fields['施法时间'] || '',
    range: fields['施法距离'] || '',
    components: fields['法术成分'] || '',
    duration: fields['持续时间'] || '',
    concentration: /专注/.test(fields['持续时间'] || ''),
    description: text,
    higherLevels: high,
  }
}

function parseSpellMeta(line) {
  let s = cleanInline(line)
  let ritual = false
  s = s.replace(/[（(]\s*仪式\s*[)）]/g, () => {
    ritual = true
    return ''
  }).trim()
  let m = s.match(/^(\d+)\s*环\s+(.+)$/)
  if (m) return { level: Number(m[1]), school: m[2].trim(), ritual }
  m = s.match(/^(戏法)\s+(.+)$/)
  if (m) return { level: 0, school: m[2].trim(), ritual }
  m = s.match(/^(.+?)\s+戏法$/)
  if (m) return { level: 0, school: m[1].trim(), ritual }
  return null
}

function isNoiseLine(line) {
  const t = line.trim()
  if (!t) return true
  if (isPageMarker(t)) return true
  if (/^\d+$/.test(t)) return true
  if (/^第\s*\d+\s*章[:：]/.test(t)) return true
  if (/^附录\s*[A-Z]\s/.test(t)) return true
  if (/^[A-Za-z0-9\s'’:,.\-–—]{1,36}$/.test(t) && !/[。,.!?]/.test(t)) return true
  return false
}

function nextNonEmpty(lines, from, max = 4) {
  let n = 0
  for (let i = from; i < lines.length && n < max; i++) {
    if (!isNoiseLine(lines[i])) return i
    n++
  }
  return -1
}

function weaponMeta(en) {
  const raw = String(en || '').toLowerCase().trim()
  const compact = raw.replace(/[^a-z]/g, '')
  const aliases = {
    crossbowlight: 'light crossbow',
    crossbowhand: 'hand crossbow',
    crossbowheavy: 'heavy crossbow',
    hallerd: 'halberd',
    halberd: 'halberd',
    scimiar: 'scimitar',
    scimitar: 'scimitar',
    warpick: 'war pick',
    lighthammer: 'light hammer',
  }
  const key = aliases[compact] || raw
  return WEAPON_META[key] || WEAPON_META[compact] || {}
}

function findHeadingIndex(lines, re, after = 0) {
  for (let i = after; i < lines.length; i++) if (re.test(lines[i])) return i
  return -1
}

/* ---------------- 法术 ---------------- */

function parseClassSpellLists(lines, startExpr, endExpr) {
  const map = new Map()
  let cls = ''
  let level = 0
  const start = findHeadingIndex(lines, startExpr)
  if (start < 0) return map
  const end = findHeadingIndex(lines, endExpr, start + 1)
  const stop = end < 0 ? lines.length : end
  for (let i = start + 1; i < stop; i++) {
    const t = lines[i].trim()
    if (!t) continue
    const h = t.match(/^###\s*(.+?)法术\s*$/)
    if (h) {
      cls = h[1].trim()
      continue
    }
    if (/^#{1,6}\s/.test(t)) continue
    const lv = t.match(/^(\d+)\s*环(?:\s*戏法)?$/)
    if (lv) {
      level = Number(lv[1])
      continue
    }
    if (/^(0|零)\s*环\s*戏法$/.test(t) || t === '0环 戏法') {
      level = 0
      continue
    }
    if (t.length > 60 || !isCjk(t)) continue
    if (/^(法术列表|吟游诗人法术|牧师法术|德鲁伊法术|圣武士法术|游侠法术|术士法术|邪术师法术|法师法术)/.test(t)) continue
    const { name, en } = splitName(t)
    if (!name) continue
    const key = normName(name)
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(cls)
    if (en) {
      const ek = normName(en)
      if (!map.has(ek)) map.set(ek, new Set())
      map.get(ek).add(cls)
    }
  }
  return map
}

function parseSpells(file, dbDir) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const classMap = parseClassSpellLists(lines, /^##\s*法术列表/, /^##\s*法术详述/)
  const starts = []
  const start = findHeadingIndex(lines, /^##\s*法术详述/)
  const scanFrom = start >= 0 ? start + 1 : 0

  for (let i = scanFrom; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw || raw.startsWith('#') || isPageMarker(raw)) continue
    if (raw.length > 48 || !isCjk(raw)) continue
    if (/^(法术详述|法术按头字母|施法时间|施法距离|法术成分|持续时间)/.test(raw)) continue
    const metaIdx = nextNonEmpty(lines, i + 1, 3)
    if (metaIdx < 0) continue
    const meta = parseSpellMeta(lines[metaIdx])
    if (!meta) continue
    // 法术条目的元数据行之后应紧跟施法时间等字段
    let hasField = false
    let probe = metaIdx + 1
    let seen = 0
    while (probe < lines.length && seen < 8) {
      const t = lines[probe].trim()
      if (isNoiseLine(t)) {
        probe++
        continue
      }
      if (/^施法时间\s*[:：]/.test(t)) {
        hasField = true
        break
      }
      if (parseSpellMeta(t)) break
      probe++
      seen++
    }
    if (!hasField) continue
    starts.push({ nameLine: raw, meta, start: i, metaIdx })
    i = metaIdx
  }

  const entries = []
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k]
    const end = k + 1 < starts.length ? starts[k + 1].start : lines.length
    const bodyLines = lines.slice(s.metaIdx + 1, end)
    const fields = extractMetaFields(bodyLines)
    const { name, en } = splitName(s.nameLine)
    const classes = new Set([
      ...(classMap.get(normName(name)) || []),
      ...(en ? classMap.get(normName(en)) || [] : []),
    ])
    const page = pages[s.start] ?? pages[s.metaIdx] ?? null
    entries.push({
      uid: makeUid('spell', name, page, en),
      type: 'spell',
      name,
      en,
      level: s.meta.level,
      school: s.meta.school,
      ritual: s.meta.ritual,
      concentration: fields.concentration,
      castingTime: fields.castingTime,
      range: fields.range,
      components: fields.components,
      duration: fields.duration,
      classes: [...classes].sort(),
      description: fields.description,
      higherLevels: fields.higherLevels,
      page,
      book,
      chapter,
    })
  }
  return entries
}

/* ---------------- 专长 ---------------- */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseFeats2024(lines, pages, book, chapter, sec, stop) {
  const categoryRe = /^(起源专长|通用专长|战斗风格专长|传奇恩惠专长)/
  const starts = []
  for (let i = Math.max(0, sec); i < stop; i++) {
    const t = lines[i].trim()
    if (!t || t.length > 90 || /^#{1,6}\s/.test(t)) continue
    let j = i + 1
    while (j < stop && !lines[j].trim()) j++
    if (j >= stop) continue
    const next = lines[j].trim()
    if (!categoryRe.test(next)) continue
    const { name, en } = splitName(t)
    if (!name || !en || !isCjk(name)) continue
    const pre = next.match(/先决\s*[:：]\s*([^）)]+)/)
    starts.push({ index: i, name, en, prerequisite: pre ? pre[1].trim() : '' })
  }
  const entries = []
  for (let k = 0; k < starts.length; k++) {
    const f = starts[k]
    const end = k + 1 < starts.length ? starts[k + 1].index : stop
    const body = []
    let skippedCategory = false
    for (const raw of lines.slice(f.index + 1, end)) {
      const t = raw.trim()
      if (!skippedCategory && categoryRe.test(t)) {
        skippedCategory = true
        continue
      }
      body.push(raw)
    }
    const page = pages[f.index] ?? null
    entries.push({
      uid: makeUid('feat', f.name, page, f.en),
      type: 'feat',
      name: f.name,
      en: f.en,
      prerequisite: f.prerequisite,
      description: cleanBodyLines(body),
      page,
      book,
      chapter,
    })
  }
  return { entries, found: starts.length, is2024: true }
}

function parseFeats(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const sec = findHeadingIndex(lines, /^##\s*专长/)
  const stop = sec < 0 ? lines.length : findHeadingIndex(lines, /^##\s+/, sec + 1) < 0 ? lines.length : findHeadingIndex(lines, /^##\s+/, sec + 1)
  if (sec >= 0 && lines.slice(sec, stop).some((line) => /^(?:起源专长|通用专长|战斗风格专长|传奇恩惠专长)/.test(line.trim()))) {
    return parseFeats2024(lines, pages, book, chapter, sec, stop)
  }
  const found = []
  for (const en of FEAT_NAMES) {
    const re = new RegExp(`^(.+?)\\s*${escapeRe(en)}\\s*$`, 'i')
    for (let i = Math.max(0, sec); i < stop; i++) {
      const t = lines[i].trim()
      if (!t || t.length > 90) continue
      const m = t.match(re)
      if (!m) continue
      if (!isCjk(m[1])) continue
      found.push({ en, cn: m[1].trim(), index: i, line: t })
      break
    }
  }
  found.sort((a, b) => a.index - b.index)
  const entries = []
  for (let k = 0; k < found.length; k++) {
    const f = found[k]
    const end = k + 1 < found.length ? found[k + 1].index : stop
    const rawBody = lines.slice(f.index + 1, end)
    let prereq = ''
    const body = []
    for (const raw of rawBody) {
      const t = raw.trim()
      if (!prereq && /^先决条件\s*[:：]/.test(t)) {
        prereq = t.replace(/^先决条件\s*[:：]\s*/, '')
        continue
      }
      body.push(raw)
    }
    const page = pages[f.index] ?? null
    entries.push({
      uid: makeUid('feat', f.cn, page, f.en),
      type: 'feat',
      name: f.cn,
      en: f.en,
      prerequisite: prereq,
      description: cleanBodyLines(body),
      page,
      book,
      chapter,
    })
  }
  return { entries, found: found.length }
}

/* ---------------- 职业特性 ---------------- */

function cleanClassFeatureBody(lines, featureName = '') {
  const target = normName(featureName)
  const kept = []
  for (const raw of lines) {
    let line = raw.replace(/\{\{p\.\d+\}\}/g, '').trim()
    const t = line.trim()
    if (!t) {
      if (kept.length && kept[kept.length - 1] !== '') kept.push('')
      continue
    }
    if (/^\d+$/.test(t)) continue
    if (/^\d+(?:st|nd|rd|th)\s+\+\d+/.test(t)) continue
    if (/^[\d\s+—–\-/]+$/.test(t)) continue
    if (/^——.*——$/.test(t)) continue
    if (/^[\d环\s]+$/.test(t)) continue
    if (/^法\s+1环/.test(t)) continue
    if (/^(?:已知戏法|已知法术|法术位|法术位环阶|已知祈唤)/.test(t)) continue
    if (/^[\u4e00-\u9fff]{2,6}等级\s/.test(t)) continue
    if (/^\d+(?:st|nd|rd|th)\s+[^。]{0,50}$/.test(t)) continue
    if (/^\d+(?:\s+(?:\d+环|[-\d/]+))+\s*$/.test(t)) continue
    if (target) {
      const parsed = splitName(t)
      if (parsed.en && normName(parsed.name) === target) continue
    }
    if (/^#{1,6}\s/.test(t)) {
      line = t.replace(/^#{1,6}\s*/, '').trim()
      if (!line) continue
    }
    kept.push(line)
  }
  let start = 0
  while (start < kept.length && kept[start].length <= 2 && /^[\u4e00-\u9fff]+$/.test(kept[start])) start++
  return kept.slice(start).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function loadSubclassData() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'subclasses.json'), 'utf8'))
    return Array.isArray(raw.subclasses) ? raw.subclasses : []
  } catch {
    return []
  }
}

function findSubclassDef(registry, className, name, en) {
  const key = normName(name)
  return (
    registry.find((r) => r.className === className && normName(r.name) === key) ||
    registry.find((r) => r.className === className && en && normName(r.en) === normName(en)) ||
    registry.find(
      (r) => r.className === className && (normName(r.name).includes(key) || key.includes(normName(r.name))),
    ) ||
    null
  )
}

function stripPageMarker(line) {
  return String(line || '').replace(/\{\{p\.\d+\}\}/g, '').trim()
}

// 「3 级：圣洁武器Sacred Weapon」这样的子职业特性行
function matchSubclassFeatureLine(t) {
  const m = t.match(/^(\d{1,2})\s*级[：:]\s*(.+)$/)
  if (!m || t.length > 100) return null
  const { name, en } = splitName(m[2].trim())
  if (!name || !isCjk(name)) return null
  return { level: Number(m[1]), name, en }
}

function cleanSubclassIntro(lines, name, en, limit = 2000) {
  const target = normName(name)
  const kept = []
  for (const raw of lines) {
    let t = stripPageMarker(raw)
    if (!t) {
      if (kept.length && kept[kept.length - 1] !== '') kept.push('')
      continue
    }
    if (/^#{1,6}\s/.test(t)) t = t.replace(/^#{1,6}\s*/, '').trim()
    if (!t) continue
    const parsed = splitName(t)
    // 章节里经常把标题重复一遍（如 5825 行的「奉献之誓Oath of Devotion」）
    if (normName(parsed.name) === target && (!parsed.en || parsed.en.length <= 60)) continue
    if (en && parsed.en && normName(parsed.en) === normName(en) && normName(parsed.name) === target) continue
    kept.push(t)
  }
  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, limit)
}

// 子职业法术表：返回 { from, to, map: { 3: ['防护善恶Protection…', …] } }
function parseSubclassSpellTable(lines) {
  let start = -1
  for (let i = 0; i < lines.length && i < 12; i++) {
    const t = stripPageMarker(lines[i])
    if (!t) continue
    if (/准备法术\s*$/.test(t) && t.length <= 24) {
      start = i
      break
    }
  }
  if (start < 0) return null
  let level = null
  let end = start + 1
  const map = {}
  for (let i = start + 1; i < lines.length; i++) {
    const t = stripPageMarker(lines[i])
    if (!t) {
      end = i + 1
      continue
    }
    const num = t.match(/^(\d{1,2})$/)
    if (num) {
      level = Number(num[1])
      end = i + 1
      continue
    }
    if (/^[\u4e00-\u9fff]{2,6}等级\s/.test(t)) {
      end = i + 1
      continue
    }
    if (level === null) break
    if (/[。；]$/.test(t) && t.length > 24) break
    const parts = t
      .split(/[，,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    let ok = 0
    for (const p of parts) {
      const { name } = splitName(p)
      if (!name || !isCjk(name)) continue
      if (!map[level]) map[level] = []
      map[level].push(p.replace(/[，,。；]$/, '').trim())
      ok++
    }
    if (!ok) break
    end = i + 1
  }
  return Object.keys(map).length ? { from: start, to: end, map } : null
}

function formatSpellTable(map) {
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map((lv) => `${lv} 级：${map[lv].join('、')}`)
    .join('\n')
}

function subclassFeatureEntry(lines, pages, book, chapter, cls, block, startIdx, endIdx, featureName, featureEn) {
  const segment = lines.slice(startIdx + 1, endIdx)
  const page = pages[startIdx] ?? null
  const level = Number(lines[startIdx].trim().match(/^(\d{1,2})/)[1])
  const table = parseSubclassSpellTable(segment)
  let description
  if (table) {
    description = [
      cleanClassFeatureBody(segment.slice(0, table.from), featureName),
      formatSpellTable(table.map),
      cleanClassFeatureBody(segment.slice(table.to), featureName),
    ]
      .filter(Boolean)
      .join('\n\n')
  } else {
    description = cleanClassFeatureBody(segment, featureName)
  }
  return {
    uid: makeUid('classFeature', `${cls.name}|${block.title}|${featureName}|${level}`, page, featureEn),
    type: 'classFeature',
    featureKind: 'feature',
    name: featureName,
    en: featureEn,
    className: cls.name,
    subclass: block.title,
    subclassEn: block.en,
    subclassLabel: block.label,
    level,
    description,
    ...(table ? { spellsByLevel: table.map } : {}),
    page,
    book,
    chapter,
  }
}

// 按 ### 子职业标题切块，并修一处原文排版缺陷：
// 03-第3章 2626 行的「光明领域」标题后面紧跟了「诡术领域」标题（2682 行才是真正的诡术领域），
// 导致光明领域的正文与特性行被归到诡术领域名下。这里一旦发现块内出现与块名相同的重复标题行，
// 且上一个子职业块没有任何特性，就把重复标题行之前的内容还给上一个块。
function buildSubclassBlocks(lines, cls, sectionEnd) {
  const heads = []
  for (let i = cls.index + 1; i < sectionEnd; i++) {
    if (/^###\s+/.test(lines[i].trim())) heads.push(i)
  }
  const blocks = heads.map((head, k) => {
    const titleRaw = lines[head].trim().replace(/^###\s+/, '').trim()
    const { name, en } = splitName(titleRaw)
    return { head, start: head + 1, end: k + 1 < heads.length ? heads[k + 1] : sectionEnd, title: name || titleRaw, en }
  })
  const countFeatures = (b) => {
    let n = 0
    for (let i = b.start; i < b.end; i++) if (matchSubclassFeatureLine(lines[i].trim())) n++
    return n
  }
  for (let k = 0; k < blocks.length; k++) {
    const b = blocks[k]
    let dupAt = -1
    for (let i = b.start; i < b.end; i++) {
      const t = stripPageMarker(lines[i])
      if (!t || /^#{1,6}\s/.test(t)) continue
      const parsed = splitName(t)
      if (normName(parsed.name) === normName(b.title) && t.length <= 40) {
        dupAt = i
        break
      }
    }
    if (dupAt > b.start && k > 0 && countFeatures(blocks[k - 1]) === 0 && countFeatures(b) > 0) {
      blocks[k - 1].end = dupAt
      blocks[k - 1].repaired = true
      b.head = dupAt
      b.start = dupAt + 1
      b.repaired = true
    }
  }
  return blocks
}

function parseSubclassBlock(lines, pages, book, chapter, cls, block, registry) {
  const entries = []
  const def = findSubclassDef(registry, cls.name, block.title, block.en)
  const starts = []
  for (let i = block.start; i < block.end; i++) {
    const t = lines[i].trim()
    if (/^#{1,6}\s/.test(t)) continue
    const f = matchSubclassFeatureLine(t)
    if (f) starts.push({ index: i, ...f })
  }
  const introEnd = starts.length ? starts[0].index : block.end
  const featureKind = starts.length ? 'subclass' : 'option'
  const intro = cleanSubclassIntro(
    lines.slice(block.start, introEnd),
    block.title,
    block.en,
    featureKind === 'subclass' ? 2000 : 8000,
  )
  const label = def?.label || '子职业'
  const level = def?.level ?? (starts.length ? Math.min(...starts.map((s) => s.level)) : null)
  if (intro || starts.length) {
    const page = pages[block.head] ?? null
    entries.push({
      uid: makeUid('classFeature', `${cls.name}|${block.title}`, page, `subclass|${block.en}`),
      type: 'classFeature',
      featureKind,
      name: block.title,
      en: block.en,
      className: cls.name,
      subclass: block.title,
      subclassEn: block.en,
      subclassLabel: label,
      level,
      description: intro || `${block.title}子职业。`,
      page,
      book,
      chapter,
    })
  }
  for (let k = 0; k < starts.length; k++) {
    const f = starts[k]
    const end = k + 1 < starts.length ? starts[k + 1].index : block.end
    entries.push(
      subclassFeatureEntry(lines, pages, book, chapter, cls, { ...block, label }, f.index, end, f.name, f.en),
    )
  }
  return { entries, def, featureCount: starts.length, repaired: Boolean(block.repaired) }
}

function parseClassFeatures2024(lines, pages, book, chapter) {
  const registry = loadSubclassData()
  const entries = []
  const missing = []
  const found = new Set()
  const subclassOptionBlocks = []
  const classStarts = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (/^##\s+/.test(t) && !/^###/.test(t)) {
      const name = t.replace(/^##\s+/, '').trim()
      if (name && !/^(第|附录)/.test(name)) classStarts.push({ name, index: i })
    }
  }
  for (let ci = 0; ci < classStarts.length; ci++) {
    const cls = classStarts[ci]
    const sectionEnd = ci + 1 < classStarts.length ? classStarts[ci + 1].index : lines.length
    let coreEnd = sectionEnd
    for (let i = cls.index + 1; i < sectionEnd; i++) {
      if (/^###\s+/.test(lines[i].trim())) {
        coreEnd = i
        break
      }
    }
    // 基础职业特性（子职业标题之前的部分）
    const starts = []
    for (let i = cls.index + 1; i < coreEnd; i++) {
      const t = lines[i].trim()
      const m = t.match(/^(\d+)\s*级[：:]\s*(.+)$/)
      if (!m || t.length > 100) continue
      const { name, en } = splitName(m[2].trim())
      if (!name || !isCjk(name)) continue
      starts.push({ index: i, level: Number(m[1]), name, en })
    }
    for (let k = 0; k < starts.length; k++) {
      const f = starts[k]
      const end = k + 1 < starts.length ? starts[k + 1].index : coreEnd
      const page = pages[f.index] ?? null
      entries.push({
        uid: makeUid('classFeature', `${cls.name}|${f.name}|${f.level}`, page, f.en),
        type: 'classFeature',
        featureKind: 'feature',
        name: f.name,
        en: f.en,
        className: cls.name,
        level: f.level,
        description: cleanClassFeatureBody(lines.slice(f.index + 1, end), f.name),
        page,
        book,
        chapter,
      })
    }
    // 子职业（### 标题之后的部分）
    const blocks = buildSubclassBlocks(lines, cls, sectionEnd)
    for (const block of blocks) {
      const res = parseSubclassBlock(lines, pages, book, chapter, cls, block, registry)
      entries.push(...res.entries)
      if (res.def) found.add(`${cls.name}|${res.def.name}`)
      if (res.def && res.featureCount === 0) {
        missing.push(`classFeatures: ${cls.name}·${res.def.label}·${res.def.name} 未解析到任何子职业特性`)
      }
      if (!res.def && res.featureCount === 0) subclassOptionBlocks.push(`${cls.name}·${block.title}`)
      if (res.repaired) {
        // 排版修复成功，不再重复报警
        const idx = missing.findIndex((m) => m.includes(`${cls.name}·`) && m.includes(block.title))
        if (idx >= 0) missing.splice(idx, 1)
      }
    }
    for (const def of registry.filter((r) => r.className === cls.name)) {
      if (!found.has(`${cls.name}|${def.name}`)) {
        missing.push(`classFeatures: ${cls.name}·${def.label}·${def.name} 未解析到子职业正文`)
      }
    }
  }
  const subclassEntries = entries.filter((e) => e.featureKind !== 'feature' || e.subclass)
  return {
    entries,
    missing,
    optionBlocks: subclassOptionBlocks,
    subclasses: entries.filter((e) => e.featureKind === 'subclass').length,
    subclassFeatures: subclassEntries.filter((e) => e.featureKind === 'feature').length,
  }
}

export function parseClassFeatures(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  return parseClassFeatures2024(lines, pages, book, chapter)
}

/* ---------------- 种族特性 ---------------- */

const SPECIES_NESTED_TRAITS = new Set([
  '侏儒|森林侏儒',
  '侏儒|岩石侏儒',
])

function parseSpeciesTraitStart(line, speciesName) {
  const t = line.trim()
  if (!t || t.startsWith('#') || t.startsWith('•')) return null
  const dot = t.indexOf('。')
  if (dot < 2) return null
  const { name, en } = splitName(t.slice(0, dot).trim())
  if (!name || name.length < 2 || name.length > 20 || name.startsWith('你') || !/^[\u4e00-\u9fff·]+$/.test(name)) return null
  if (!en || !/^[A-Za-z][A-Za-z' -]*$/.test(en)) return null
  if (SPECIES_NESTED_TRAITS.has(`${speciesName}|${name}`)) return null
  return { name, en, inlineBody: t.slice(dot + 1).trim() }
}

function parseSpeciesTraits(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const root = findHeadingIndex(lines, /^##\s*种族详述/)
  if (root < 0) return { entries: [], missing: ['未找到种族详述章节'], coverage: {} }
  const nextRoot = findHeadingIndex(lines, /^##\s+/, root + 1)
  const rootEnd = nextRoot < 0 ? lines.length : nextRoot
  const headings = []
  for (let i = root + 1; i < rootEnd; i++) {
    const match = lines[i].trim().match(/^###\s+(.+)$/)
    if (match) headings.push({ index: i, ...splitName(match[1]) })
  }

  const entries = []
  const missing = []
  const coverage = {}
  for (let h = 0; h < headings.length; h++) {
    const species = headings[h]
    const end = h + 1 < headings.length ? headings[h + 1].index : rootEnd
    const marker = lines.findIndex((line, index) => index > species.index && index < end && /特殊特质/.test(line))
    if (marker < 0) {
      missing.push(`${species.name}（未找到特殊特质起点）`)
      coverage[species.name] = 0
      continue
    }

    const starts = []
    for (let i = marker + 1; i < end; i++) {
      const trait = parseSpeciesTraitStart(lines[i], species.name)
      if (trait) starts.push({ ...trait, index: i })
    }
    coverage[species.name] = starts.length
    if (!starts.length) {
      missing.push(`${species.name}（未解析到种族特性）`)
      continue
    }

    for (let k = 0; k < starts.length; k++) {
      const trait = starts[k]
      const traitEnd = k + 1 < starts.length ? starts[k + 1].index : end
      const description = cleanBodyLines([
        trait.inlineBody,
        ...lines.slice(trait.index + 1, traitEnd),
      ])
      const firstSentence = description.split('。')[0]
      const levelMatch = firstSentence.match(/到达\s*(\d+)\s*级|从第\s*(\d+)\s*级开始/)
      const level = Number(levelMatch?.[1] || levelMatch?.[2] || 1)
      const page = pages[trait.index] ?? null
      if (!description) missing.push(`${species.name}/${trait.name}（无正文）`)
      entries.push({
        uid: makeUid('speciesTrait', `${species.name}|${trait.name}`, page, trait.en),
        type: 'speciesTrait',
        name: trait.name,
        en: trait.en,
        speciesName: species.name,
        speciesEn: species.en,
        level,
        description,
        page,
        book,
        chapter,
      })
    }
  }
  return { entries, missing, coverage }
}

/* ---------------- 状态 ---------------- */

function parseConditions(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const starts = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t || t.length > 40 || t.startsWith('#')) continue
    const hit = CONDITION_NAMES.find(([cn, en]) => new RegExp(`^${cn}\\s*${en}`, 'i').test(t))
    if (hit) starts.push({ cn: hit[0], en: hit[1], index: i })
  }
  const entries = []
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k]
    const end = k + 1 < starts.length ? starts[k + 1].index : lines.length
    const body = lines.slice(s.index + 1, end)
    const desc = cleanBodyLines(body)
    const first = desc.split('\n').map((x) => x.trim()).find((x) => x && !x.startsWith('•')) || desc
    entries.push({
      uid: makeUid('condition', s.cn, pages[s.index] ?? null, s.en),
      type: 'condition',
      name: s.cn,
      en: s.en,
      description: desc,
      summary: cleanInline(first).slice(0, 140),
      page: pages[s.index] ?? null,
      book,
      chapter,
    })
  }
  return entries
}

/* ---------------- 魔法物品 ---------------- */

function parseItemMeta(line) {
  const s = cleanInline(line)
  const typeRe = new RegExp(`^(${ITEM_TYPES.join('|')})(?:[（(]([^)）]+)[)）])?\\s*[,，]\\s*(${RARITIES.join('|')})(.*)$`)
  const m = s.match(typeRe)
  if (!m) return null
  return {
    itemType: m[1],
    subtype: (m[2] || '').trim(),
    rarity: m[3],
    attunement: /需(?:要)?同调/.test(m[4] || s),
    extra: (m[4] || '').trim(),
  }
}

function parseMagicItems(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const starts = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t || t.startsWith('#') || isPageMarker(t) || t.length > 60) continue
    if (!isCjk(t) && !/^\+/.test(t)) continue
    if (/[。！？]$/.test(t)) continue
    if (/^(武器|护甲|盾牌|奇物|戒指|权杖|法杖|魔杖|药水|卷轴|弹药|圣物|载具|工具|其他)$/.test(t)) continue
    const metaIdx = nextNonEmpty(lines, i + 1, 3)
    if (metaIdx < 0) continue
    const meta = parseItemMeta(lines[metaIdx])
    if (!meta) continue
    // 魔法物品元数据行通常很短
    if (lines[metaIdx].trim().length > 80) continue
    starts.push({ index: i, metaIdx, meta, line: t })
    i = metaIdx
  }
  const entries = []
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k]
    const end = k + 1 < starts.length ? starts[k + 1].index : lines.length
    const { name, en } = splitName(s.line)
    const body = cleanBodyLines(lines.slice(s.metaIdx + 1, end))
    const page = pages[s.index] ?? null
    entries.push({
      uid: makeUid('item', name, page, en),
      type: 'item',
      name,
      en,
      itemType: s.meta.itemType,
      subtype: s.meta.subtype,
      rarity: s.meta.rarity,
      attunement: s.meta.attunement,
      description: body,
      page,
      book,
      chapter,
    })
  }
  return entries
}

/* ---------------- 装备 ---------------- */

function parseAc(token) {
  const t = token.trim()
  if (/^\+/.test(t)) {
    return { bonus: Number(t.replace(/[^\d]/g, '')) || 0, base: 0, dexCap: null, formula: t }
  }
  const m = t.match(/^(\d+)(?:\+敏捷调整值(?:\(最大(\d+)\))?)?/)
  if (!m) return { base: 0, dexCap: null, formula: t }
  return { base: Number(m[1]), dexCap: m[2] ? Number(m[2]) : null, formula: t }
}

function parseEquipment(file, dbDir) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const pages = linePageMap(lines)
  const { book, chapter } = bookInfo(file, dbDir)
  const entries = []

  // 护甲 / 盾牌
  let armorStart = findHeadingIndex(lines, /^护甲表Armor/)
  if (armorStart < 0) armorStart = findHeadingIndex(lines, /^护甲表/)
  if (armorStart >= 0) {
    let category = ''
    for (let i = armorStart + 1; i < lines.length && i < armorStart + 80; i++) {
      const t = lines[i].trim()
      if (!t) continue
      if (t.startsWith('## ') && i > armorStart + 5) break
      if (/^(轻甲|中甲|重甲|盾牌)/.test(t) && !/\d+\s*(?:gp|sp|cp)/.test(t)) {
        category = t.replace(/[A-Za-z].*$/, '').trim()
        continue
      }
      if (!category) continue
      const m = t.match(/^(.+?)\s+([\d,]+\s*(?:gp|sp|cp|ep|pp))\s+([^\s]+)\s+(力量\d+|-)\s+(劣势|-)\s+([\d.]+)\s*磅/)
      if (!m) continue
      const { name, en } = splitName(m[1])
      const ac = parseAc(m[3])
      const kind = category === '盾牌' ? 'shield' : 'armor'
      const catMap = { 轻甲: 'light', 中甲: 'medium', 重甲: 'heavy', 盾牌: 'shield' }
      const page = pages[i] ?? null
      entries.push({
        uid: makeUid('equipment', name, page, en),
        type: 'equipment',
        kind,
        name,
        en,
        category: catMap[category] || category,
        cost: cleanInline(m[2]),
        ac: {
          base: ac.base || 0,
          dexCap: ac.dexCap,
          acBonus: kind === 'shield' ? (ac.bonus || 2) : 0,
          formula: ac.formula || '',
        },
        strengthReq: m[4] === '-' ? null : Number(m[4].replace(/[^\d]/g, '')),
        stealthDisadvantage: m[5] === '劣势',
        weight: Number(m[6]),
        damage: '',
        damageType: '',
        properties: [],
        range: '',
        description: '',
        page,
        book,
        chapter,
      })
    }
  }

  // 武器：武器表 + 紧随其后的「重量 属性」表（两栏提取把属性表拆到了后面）
  let weaponStart = findHeadingIndex(lines, /^武器表Weapons/)
  if (weaponStart < 0) weaponStart = findHeadingIndex(lines, /^武器表/)
  if (weaponStart >= 0) {
    const weaponRows = []
    const propertyRows = []
    let category = ''
    let propStart = -1
    for (let i = weaponStart + 1; i < lines.length; i++) {
      const t = lines[i].trim()
      if (!t) continue
      if (t.startsWith('## ') && i > weaponStart + 5) break
      if (/^重量\s+属性$/.test(t)) {
        propStart = i + 1
        break
      }
      if (/^(简易近战武器|简易远程武器|军用近战武器|军用远程武器)/.test(t)) {
        category = t.replace(/[A-Za-z].*$/, '').trim()
        continue
      }
      if (!category) continue
      const m = t.match(/^(.+?)\s+([\d,]+\s*(?:gp|sp|cp))\s+(\d+d\d+|\d+|—)\s*(钝击|穿刺|挥砍|火焰|冷冻|闪电|雷鸣|酸蚀|毒素|光耀|暗蚀|力场|心灵)?/)
      if (!m) continue
      weaponRows.push({ line: t, m, category, index: i })
    }
    if (propStart > 0) {
      for (let j = propStart; j < lines.length; j++) {
        const t = lines[j].trim()
        if (!t) continue
        if (/^\{\{p\./.test(t) || t.startsWith('#')) break
        const pm = t.match(/^(\d+(?:\.\d+)?|1\/4|—)\s*(?:磅)?\s*(.*)$/)
        if (!pm) break
        propertyRows.push({ weight: pm[1], text: pm[2] || '' })
      }
    }
    const PROPS = ['轻型', '灵巧', '投掷', '双手', '两用', '重型', '装填', '触及', '特殊', '弹药', '射程']
    for (let k = 0; k < weaponRows.length; k++) {
      const { m, category: cat, index } = weaponRows[k]
      const { name, en } = splitName(m[1])
      const meta = weaponMeta(en)
      const prop = propertyRows[k]
      const propText = prop ? prop.text : ''
      const rangeMatch = propText.match(/射程([^\s,，；;()（）]+)/)
      const versatileMatch = propText.match(/两用\((\d+d\d+)\)/)
      const properties = PROPS.filter((p) => propText.includes(p) && p !== '射程')
      let weight = prop ? (prop.weight === '—' ? 0 : prop.weight === '1/4' ? 0.25 : Number(prop.weight)) : (meta.weight ?? 0)
      let range = rangeMatch ? rangeMatch[1] : (meta.range || (cat.includes('远程') ? '' : '5尺'))
      const ranged = cat.includes('远程')
      const ability = properties.includes('灵巧') || ranged ? 'dex' : 'str'
      const damage = m[3] === '—' ? '' : m[3]
      const page = pages[index] ?? null
      entries.push({
        uid: makeUid('equipment', name, page, en),
        type: 'equipment',
        kind: 'weapon',
        name,
        en,
        category: ranged ? 'ranged' : 'melee',
        weaponGroup: cat.includes('简易') ? 'simple' : 'martial',
        cost: cleanInline(m[2]),
        ac: { base: 0, dexCap: null, acBonus: 0, formula: '' },
        strengthReq: null,
        stealthDisadvantage: false,
        weight: Number.isFinite(weight) ? weight : (meta.weight ?? 0),
        damage,
        damageType: m[4] || '',
        versatile: versatileMatch ? versatileMatch[1] : (meta.versatile || ''),
        properties: properties.length ? properties : (meta.properties || []),
        range: range || (cat.includes('远程') ? '' : '5尺'),
        attackAbility: ability,
        description: propText && propText !== '-' ? propText : '',
        page,
        book,
        chapter,
      })
    }
  }
  return entries
}

/* ---------------- 主构建 ---------------- */

export function buildCompendium(dbDir) {
  const db = path.resolve(dbDir)
  const files = walkMd(db)
  if (files.length === 0) throw new Error(`规则库目录中没有 Markdown 文件：${db}`)
  const warnings = []
  const byBase = (name) => files.find((f) => f.endsWith(name)) || ''
  const byKeyword = (...needles) => files.find((f) => needles.every((n) => f.includes(n))) || ''
  const report = { counts: {}, warnings, missing: {} }

  const spellFile = byBase(path.join('player handbook', '11-第11章法术.md')) || byKeyword('第11章法术') || byKeyword('第7章法术') || byKeyword('法术')
  const featFile = byBase(path.join('player handbook', '06-第6章自定义选项.md')) || byKeyword('第6章自定义选项') || byKeyword('第5章专长') || byKeyword('专长')
  const conditionFile = byBase(path.join('player handbook', '12-附录A状态.md')) || byKeyword('附录A状态') || byKeyword('附录C术语汇编') || byKeyword('术语汇编')
  const itemFile = byBase(path.join('dungeon master guidance', '07-第7章宝藏.md')) || byKeyword('第7章宝藏')
  const equipmentFile = byBase(path.join('player handbook', '05-第5章装备.md')) || byKeyword('第5章装备') || byKeyword('第6章装备') || byKeyword('装备')
  const classFile = byBase(path.join('player handbook', '03-第3章职业.md')) || byKeyword('第3章职业') || byKeyword('第3章角色职业') || byKeyword('角色职业')
  const originFile = byBase(path.join('player handbook', '04-第4章角色起源.md')) || byKeyword('第4章角色起源') || byKeyword('角色起源')

  const spells = spellFile ? parseSpells(spellFile, db) : []
  const feats = featFile ? parseFeats(featFile, db) : { entries: [], found: 0 }
  const conditions = conditionFile ? parseConditions(conditionFile, db) : []
  const items = itemFile ? parseMagicItems(itemFile, db) : []
  const equipment = equipmentFile ? parseEquipment(equipmentFile, db) : []
  const classFeatures = classFile ? parseClassFeatures(classFile, db) : { entries: [], missing: [] }
  const speciesTraits = originFile ? parseSpeciesTraits(originFile, db) : { entries: [], missing: [], coverage: {} }

  if (!spellFile) warnings.push('未找到法术章节文件')
  if (!featFile) warnings.push('未找到专长章节文件')
  if (!conditionFile) warnings.push('未找到状态/术语章节文件')
  if (!itemFile) warnings.push('未找到第7章宝藏文件')
  if (!equipmentFile) warnings.push('未找到装备章节文件')
  if (!classFile) warnings.push('未找到职业章节文件')
  if (!originFile) warnings.push('未找到角色起源章节文件')

  const spellMissingClasses = spells.filter((s) => s.classes.length === 0).map((s) => s.name)
  const missingFeats = feats.is2024 ? [] : FEAT_NAMES.filter((en) => !feats.entries.some((f) => f.en === en))
  const conditionNames = new Set(conditions.map((c) => c.name))
  const missingConditions = CONDITION_NAMES
    .filter(([cn]) => !conditionNames.has(cn))
    .filter(([cn]) => !((cn === '受擒' && conditionNames.has('擒抱')) || (cn === '擒抱' && conditionNames.has('受擒'))))
    .map(([cn]) => cn)
  if (spellMissingClasses.length) report.missing.spellsWithoutClass = spellMissingClasses.slice(0, 80)
  if (missingFeats.length) report.missing.feats = missingFeats
  if (missingConditions.length) report.missing.conditions = missingConditions
  if (classFeatures.missing.length) report.missing.classFeatures = classFeatures.missing
  if (speciesTraits.missing.length) report.missing.speciesTraits = speciesTraits.missing
  if (missingFeats.length) warnings.push(`有 ${missingFeats.length} 个专长未解析到：${missingFeats.join(', ')}`)
  if (missingConditions.length) warnings.push(`有 ${missingConditions.length} 个状态未解析到`)
  if (classFeatures.missing.length) warnings.push(`有 ${classFeatures.missing.length} 个职业特性未解析到正文：${classFeatures.missing.join(', ')}`)
  if (speciesTraits.missing.length) warnings.push(`有 ${speciesTraits.missing.length} 个种族特性解析问题：${speciesTraits.missing.join(', ')}`)

  const all = [...spells, ...items, ...feats.entries, ...conditions, ...equipment, ...classFeatures.entries, ...speciesTraits.entries]
  const entries = all.filter((e, i, arr) => arr.findIndex((x) => x.uid === e.uid) === i)

  report.counts = {
    spells: spells.length,
    items: items.length,
    feats: feats.entries.length,
    conditions: conditions.length,
    armor: equipment.filter((e) => e.kind === 'armor').length,
    shields: equipment.filter((e) => e.kind === 'shield').length,
    weapons: equipment.filter((e) => e.kind === 'weapon').length,
    classFeatures: classFeatures.entries.length,
    subclasses: classFeatures.subclasses || 0,
    subclassFeatures: classFeatures.subclassFeatures || 0,
    speciesTraits: speciesTraits.entries.length,
    total: entries.length,
  }
  report.parsedAt = new Date().toISOString()
  report.files = files.map((f) => ({
    path: path.relative(db, f).replace(/\\/g, '/'),
    size: fs.statSync(f).size,
    mtimeMs: Math.round(fs.statSync(f).mtimeMs),
  }))
  report.sourceHash = sha1([`parser:${PARSER_VERSION}`, ...report.files.map((f) => `${f.path}:${f.size}:${f.mtimeMs}`)].join('|'))

  return {
    version: 1,
    builtAt: new Date().toISOString(),
    source: { dir: db, hash: report.sourceHash, files: report.files },
    counts: report.counts,
    speciesTraits: speciesTraits.coverage,
    entries,
    warnings,
    missing: report.missing,
  }
}

export function writeCompendium(dbDir, outDir) {
  const data = buildCompendium(dbDir)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'compendium.json'), JSON.stringify(data), 'utf8')
  const report = {
    builtAt: data.builtAt,
    counts: data.counts,
    speciesTraits: data.speciesTraits,
    warnings: data.warnings,
    missing: data.missing,
    source: data.source,
  }
  fs.writeFileSync(path.join(outDir, 'compendium-report.json'), JSON.stringify(report, null, 2), 'utf8')
  return data
}

function main() {
  const dbDir = process.argv[2] || path.resolve(ROOT, '..', 'database')
  const outDir = path.resolve(ROOT, 'data')
  const data = writeCompendium(dbDir, outDir)
  console.log(`[compendium] 已生成 ${data.counts.total} 条`)
  console.log(`[compendium] ${JSON.stringify(data.counts)}`)
  if (data.warnings.length) {
    console.log('[compendium] 警告：')
    for (const w of data.warnings) console.log('  -', w)
  }
  const samples = ['火球术', '英雄宴', '警报术']
  for (const n of samples) {
    const e = data.entries.find((x) => x.type === 'spell' && x.name === n)
    if (e) console.log(`[sample] ${n}: ${e.level}环 ${e.school} ${e.classes.join('/')} 仪式=${e.ritual} 专注=${e.concentration}`)
    else console.log(`[sample] 未找到 ${n}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
