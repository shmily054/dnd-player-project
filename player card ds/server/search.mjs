import crypto from 'node:crypto'
import fs from 'node:fs'
import { getCompendium } from './compendium.mjs'
import { fileInfo, getDatabaseDir, listMdFiles, readMd } from './db.mjs'

const TYPE_ORDER = { spell: 0, item: 1, feat: 2, classFeature: 3, speciesTrait: 4, condition: 5, equipment: 6, raw: 7 }
const rawCache = new Map()

function norm(s) {
  return String(s || '').normalize('NFKC').replace(/[\s·・’'"/\\()（）,，.。:：;；\-—_+]/g, '').toLowerCase()
}

function tokens(q) {
  return String(q || '')
    .normalize('NFKC')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function includesAll(haystack, toks) {
  const h = haystack.toLowerCase()
  return toks.every((t) => h.includes(t))
}

function countOccurrences(haystack, t) {
  if (!t) return 0
  const h = haystack.toLowerCase()
  let n = 0
  let i = 0
  while ((i = h.indexOf(t, i)) >= 0) {
    n++
    i += Math.max(1, t.length)
    if (n > 40) break
  }
  return n
}

function snippetAround(text, toks, radius = 110) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  let idx = -1
  for (const t of toks) {
    const i = clean.toLowerCase().indexOf(t)
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  if (idx < 0) return clean.slice(0, radius * 2)
  const from = Math.max(0, idx - radius)
  const to = Math.min(clean.length, idx + radius)
  return (from > 0 ? '…' : '') + clean.slice(from, to) + (to < clean.length ? '…' : '')
}

function spellLabel(e) {
  const lv = e.level === 0 ? '戏法' : `${e.level}环`
  return `${lv} · ${e.school}${e.ritual ? ' · 仪式' : ''}${e.concentration ? ' · 专注' : ''}`
}

export function subtitleFor(e) {
  if (e.type === 'spell') return spellLabel(e)
  if (e.type === 'item') return `${e.itemType}${e.subtype ? `（${e.subtype}）` : ''} · ${e.rarity}${e.attunement ? ' · 需同调' : ''}`
  if (e.type === 'feat') return `专长${e.prerequisite ? ` · 先决：${e.prerequisite}` : ''}`
  if (e.type === 'classFeature') return `职业特性 · ${e.className || '未知职业'} · ${e.level ?? '?'}级`
  if (e.type === 'speciesTrait') return `种族特性 · ${e.speciesName || '未知种族'} · ${e.level ?? 1}级`
  if (e.type === 'condition') return '状态'
  if (e.type === 'equipment') {
    if (e.kind === 'weapon') return `武器 · ${e.damage || '—'}${e.damageType}${e.properties?.length ? ` · ${e.properties.join('/')}` : ''}`
    if (e.kind === 'shield') return `盾牌 · AC +${e.ac?.acBonus || 2}`
    return `护甲 · AC ${e.ac?.base ?? '—'}${e.ac?.dexCap ? `（敏捷上限 ${e.ac.dexCap}）` : ''}`
  }
  return ''
}

function entryHaystack(e) {
  return [
    e.name,
    e.en,
    e.school,
    e.itemType,
    e.subtype,
    e.rarity,
    e.prerequisite,
    e.className,
    e.speciesName,
    e.speciesEn,
    e.classes?.join(' '),
    e.description,
    e.higherLevels,
    e.properties?.join(' '),
    e.damage,
    e.damageType,
  ].filter(Boolean).join(' ')
}

function scoreStructured(e, toks, q) {
  const nq = norm(q)
  const nn = norm(e.name)
  const ne = norm(e.en)
  const hay = entryHaystack(e)
  let titleScore = 0
  let bodyScore = 0
  if (nq) {
    const lenPenalty = Math.max(0, nn.length - nq.length) * 30
    if (nn === nq) titleScore = 1000
    else if (nn.startsWith(nq)) titleScore = 700 - lenPenalty
    else if (nn.includes(nq)) titleScore = 420 - nn.indexOf(nq) * 20 - lenPenalty / 2
    if (ne && ne === nq) titleScore = Math.max(titleScore, 900)
    else if (ne && ne.startsWith(nq)) titleScore = Math.max(titleScore, 620 - Math.max(0, ne.length - nq.length) * 20)
    else if (ne && ne.includes(nq)) titleScore = Math.max(titleScore, 340 - ne.indexOf(nq) * 12)
    if (norm(subtitleFor(e)).includes(nq)) bodyScore += 90
    for (const t of toks) bodyScore += Math.min(160, countOccurrences(hay, t) * 14)
  }
  // 标题匹配优先于正文出现次数，避免「火球魔杖」压过「火球术」
  return titleScore * 10 + bodyScore + (5 - (TYPE_ORDER[e.type] ?? 9)) * 0.1
}

function entryMatchesFilters(e, opts) {
  const type = opts.type || 'all'
  if (type !== 'all' && type !== 'raw' && e.type !== type) return false
  if (opts.level !== undefined && opts.level !== '' && String(opts.level) !== 'null') {
    if (e.type !== 'spell' || String(e.level) !== String(opts.level)) return false
  }
  if (opts.school && (e.type !== 'spell' || e.school !== opts.school)) return false
  if (opts.class) {
    if (e.type !== 'spell' || !(e.classes || []).includes(opts.class)) return false
  }
  if (opts.featureLevel !== undefined && opts.featureLevel !== '' && String(opts.featureLevel) !== 'null') {
    if (e.type !== 'classFeature' || String(e.level) !== String(opts.featureLevel)) return false
  }
  if (opts.featureClass && (e.type !== 'classFeature' || e.className !== opts.featureClass)) return false
  if (opts.species && (e.type !== 'speciesTrait' || e.speciesName !== opts.species)) return false
  if (opts.rarity && (e.type !== 'item' || e.rarity !== opts.rarity)) return false
  if (opts.kind) {
    if (e.type === 'equipment') {
      if (e.kind !== opts.kind) return false
    } else if (e.type === 'item') {
      if (e.itemType !== opts.kind) return false
    } else {
      return false
    }
  }
  if (opts.book && e.book !== opts.book) return false
  if (opts.ritual === '1' || opts.ritual === true) {
    if (e.type !== 'spell' || !e.ritual) return false
  }
  if (opts.concentration === '1' || opts.concentration === true) {
    if (e.type !== 'spell' || !e.concentration) return false
  }
  return true
}

export function searchStructured(q, opts = {}) {
  const data = getCompendium()
  const toks = tokens(q)
  let list = data.entries.filter((e) => entryMatchesFilters(e, opts))
  if (toks.length) {
    list = list.filter((e) => includesAll(entryHaystack(e), toks))
  }
  const scored = list.map((e) => ({
    kind: e.type,
    uid: e.uid,
    title: e.name,
    en: e.en || '',
    subtitle: subtitleFor(e),
    snippet: toks.length ? snippetAround(e.description || e.higherLevels || subtitleFor(e), toks) : (e.description || '').slice(0, 180).replace(/\s+/g, ' '),
    score: scoreStructured(e, toks, q),
    book: e.book,
    chapter: e.chapter,
    page: e.page,
    meta: {
      level: e.level,
      school: e.school,
      classes: e.classes,
      className: e.className,
      speciesName: e.speciesName,
      speciesEn: e.speciesEn,
      ritual: e.ritual,
      concentration: e.concentration,
      rarity: e.rarity,
      itemType: e.itemType,
      subtype: e.subtype,
      kind: e.kind,
      attunement: e.attunement,
    },
    entry: e,
  }))
  scored.sort((a, b) => b.score - a.score || TYPE_ORDER[a.kind] - TYPE_ORDER[b.kind] || a.title.localeCompare(b.title, 'zh'))
  return scored
}

function looksLikeEntryTitle(line, next) {
  const t = line.trim()
  if (!t || t.length > 34) return false
  if (!/[\u4e00-\u9fff]/.test(t)) return false
  if (!/[A-Za-z]/.test(t)) return false
  if (/[。！？；，,]$/.test(t)) return false
  if (/^[•·\-—\d]/.test(t)) return false
  if (/^(施法时间|施法距离|法术成分|持续时间|先决条件)/.test(t)) return false
  if (!next || next.trim().length < 12) return false
  return true
}

function splitRawBlocks(text, info) {
  const lines = text.split(/\r?\n/)
  const blocks = []
  let page = null
  let section = ''
  let title = ''
  let buf = []
  let len = 0
  const flush = () => {
    if (!buf.length) return
    const body = buf.join('\n').trim()
    if (body) {
      blocks.push({ ...info, section, title: title || section || info.chapter, text: body, page })
    }
    buf = []
    len = 0
    title = ''
  }
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const t = raw.trim()
    const pm = t.match(/^\{\{p\.(\d+)\}\}$/)
    if (pm) {
      flush()
      page = Number(pm[1])
      continue
    }
    if (/^#{1,6}\s/.test(t)) {
      flush()
      section = t.replace(/^#{1,6}\s*/, '').trim()
      continue
    }
    if (!t) {
      flush()
      continue
    }
    let next = ''
    for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
      if (lines[j].trim()) {
        next = lines[j]
        break
      }
    }
    if (looksLikeEntryTitle(t, next) && buf.length) {
      flush()
      title = t
      continue
    }
    if (looksLikeEntryTitle(t, next) && !buf.length) {
      title = t
      continue
    }
    buf.push(t)
    len += t.length
    if (len > 2200) flush()
  }
  flush()
  return blocks
}

function rawBlocksFor(file) {
  const st = fs.statSync(file)
  const hit = rawCache.get(file)
  if (hit && hit.mtimeMs === st.mtimeMs) return hit.blocks
  const dbDir = getDatabaseDir()
  const text = readMd(file)
  const blocks = splitRawBlocks(text, { file, ...fileInfo(file, dbDir) })
  rawCache.set(file, { mtimeMs: st.mtimeMs, blocks })
  return blocks
}

function scoreRaw(b, toks) {
  const hay = `${b.title}\n${b.section}\n${b.text}`
  let score = 0
  for (const t of toks) {
    if (norm(b.title).includes(norm(t))) score += 300
    else if (norm(b.section).includes(norm(t))) score += 100
    score += Math.min(120, countOccurrences(hay, t) * 10)
  }
  return score
}

export function searchRaw(q, opts = {}) {
  const toks = tokens(q)
  if (!toks.length) return []
  const files = listMdFiles().filter((f) => {
    if (!opts.book) return true
    return fileInfo(f, getDatabaseDir()).book === opts.book
  })
  const out = []
  for (const file of files) {
    let blocks = []
    try {
      blocks = rawBlocksFor(file)
    } catch {
      continue
    }
    const info = fileInfo(file, getDatabaseDir())
    for (const b of blocks) {
      const hay = `${b.title}\n${b.section}\n${b.text}`.toLowerCase()
      if (!includesAll(hay, toks)) continue
      if (opts.chapter && info.chapter !== opts.chapter) continue
      const score = scoreRaw(b, toks)
      if (score <= 0) continue
      const text = b.text.replace(/\{\{p\.\d+\}\}/g, '').trim()
      out.push({
        kind: 'raw',
        uid: 'raw-' + crypto.createHash('sha1').update(`${file}|${b.title}|${b.page}|${text.slice(0, 60)}`).digest('hex').slice(0, 12),
        title: b.title || b.section || info.chapter,
        en: '',
        subtitle: `${info.book} · ${info.chapter}`,
        snippet: snippetAround(text, toks, 130),
        fullText: text.length > 4200 ? text.slice(0, 4200) + '\n……（原文较长，已截断）' : text,
        score,
        book: info.book,
        chapter: info.chapter,
        page: b.page,
        meta: { raw: true },
      })
    }
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

export function compendiumCounts() {
  const data = getCompendium()
  const c = data.counts || {}
  return {
    all: data.entries.length,
    spell: c.spells || 0,
    item: c.items || 0,
    feat: c.feats || 0,
    classFeature: c.classFeatures || 0,
    speciesTrait: c.speciesTraits || 0,
    condition: c.conditions || 0,
    equipment: (c.armor || 0) + (c.shields || 0) + (c.weapons || 0),
    raw: listMdFiles().length,
  }
}

export function searchAll(q, opts = {}) {
  const type = opts.type || 'all'
  const limit = Math.max(1, Math.min(100, Number(opts.limit) || 30))
  const offset = Math.max(0, Number(opts.offset) || 0)
  let structured = []
  let raw = []
  if (type !== 'raw') structured = searchStructured(q, { ...opts, type })
  if (type === 'raw' || (type === 'all' && String(q || '').trim())) raw = searchRaw(q, opts)
  if (type === 'all') {
    const structuredNames = getCompendium().entries.map((e) => norm(e.name)).filter(Boolean)
    raw = raw.filter((r) => {
      const rt = norm(r.title)
      if (!rt) return true
      return !structuredNames.some((n) => rt === n || rt.startsWith(n) || n.startsWith(rt))
    })
  }
  const combined = type === 'raw' ? raw : [...structured, ...raw]
  combined.sort((a, b) => b.score - a.score || (TYPE_ORDER[a.kind] ?? 9) - (TYPE_ORDER[b.kind] ?? 9) || a.title.localeCompare(b.title, 'zh'))
  return {
    results: combined.slice(offset, offset + limit),
    total: combined.length,
    counts: compendiumCounts(),
    error: getCompendium().error || null,
  }
}
