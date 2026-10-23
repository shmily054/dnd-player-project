import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { z } from 'zod'
import { BACKUPS_DIR, CHARS_DIR, PORTRAITS_DIR, ensureDirs } from './db.mjs'

const ABILITIES = {
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
}

export function defaultCharacter(name = '新角色') {
  return {
    schemaVersion: 1,
    id: '',
    name,
    playerName: '',
    portrait: null,
    classes: [{ name: '冒险者', subclass: '', level: 1, hitDie: 8 }],
    race: { name: '', subrace: '' },
    background: '',
    alignment: '',
    xp: 0,
    abilities: { ...ABILITIES },
    saveProfs: [],
    skillProfs: [],
    skillExpertise: [],
    toolProfs: [],
    languages: [],
    armorProfs: [],
    weaponProfs: [],
    hp: { max: 8, current: 8, temp: 0 },
    hitDice: { remaining: 1 },
    ac: { mode: 'auto', manual: null },
    initiative: { mode: 'auto', manual: null },
    speed: 30,
    exhaustion: 0,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    concentration: null,
    spellcasting: {
      ability: 'int',
      slots: {},
      pactSlots: null,
      spells: [],
    },
    attacks: [],
    resources: [],
    inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    features: [],
    roleplay: {
      personality: '',
      ideals: '',
      bonds: '',
      flaws: '',
      appearance: '',
      backstory: '',
      allies: '',
      notes: '',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

const ClassLevelSchema = z.object({
  name: z.string().max(40),
  subclass: z.string().max(40).default(''),
  level: z.number().int().min(0).max(20),
  hitDie: z.number().int().min(4).max(20).default(8),
}).passthrough()

const CharacterSchema = z.object({
  schemaVersion: z.number().int().default(1),
  id: z.string().min(1).max(64),
  name: z.string().max(120),
  playerName: z.string().max(120).default(''),
  portrait: z.string().max(500).nullable().optional(),
  classes: z.array(ClassLevelSchema).max(8).default([]),
  race: z.object({ name: z.string().max(80).default(''), subrace: z.string().max(80).default('') }).passthrough().default({ name: '', subrace: '' }),
  background: z.string().max(120).default(''),
  alignment: z.string().max(40).default(''),
  xp: z.number().min(0).default(0),
  abilities: z.record(z.string(), z.number()).default({ ...ABILITIES }),
  saveProfs: z.array(z.string()).default([]),
  skillProfs: z.array(z.string()).default([]),
  skillExpertise: z.array(z.string()).default([]),
  toolProfs: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  armorProfs: z.array(z.string()).default([]),
  weaponProfs: z.array(z.string()).default([]),
  hp: z.object({ max: z.number().default(1), current: z.number().default(1), temp: z.number().default(0) }).passthrough().default({ max: 1, current: 1, temp: 0 }),
  hitDice: z.object({ remaining: z.number().default(0) }).passthrough().default({ remaining: 0 }),
  ac: z.object({ mode: z.enum(['auto', 'manual']).default('auto'), manual: z.number().nullable().default(null) }).passthrough().default({ mode: 'auto', manual: null }),
  initiative: z.object({ mode: z.enum(['auto', 'manual']).default('auto'), manual: z.number().nullable().default(null) }).passthrough().default({ mode: 'auto', manual: null }),
  speed: z.number().default(30),
  exhaustion: z.number().int().min(0).max(6).default(0),
  conditions: z.array(z.object({ name: z.string(), level: z.number().optional() }).passthrough()).default([]),
  deathSaves: z.object({ successes: z.number().int().min(0).max(3).default(0), failures: z.number().int().min(0).max(3).default(0) }).passthrough().default({ successes: 0, failures: 0 }),
  concentration: z.string().max(120).nullable().default(null),
  spellcasting: z.object({
    ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']).default('int'),
    slots: z.record(z.string(), z.object({ total: z.number().default(0), used: z.number().default(0), manual: z.boolean().optional() }).passthrough()).default({}),
    pactSlots: z.object({ total: z.number().default(0), used: z.number().default(0), level: z.number().default(1) }).passthrough().nullable().optional(),
    spells: z.array(z.record(z.string(), z.unknown())).default([]),
  }).passthrough().default({ ability: 'int', slots: {}, pactSlots: null, spells: [] }),
  attacks: z.array(z.record(z.string(), z.unknown())).default([]),
  resources: z.array(z.record(z.string(), z.unknown())).default([]),
  inventory: z.array(z.record(z.string(), z.unknown())).default([]),
  currency: z.object({ pp: z.number().default(0), gp: z.number().default(0), ep: z.number().default(0), sp: z.number().default(0), cp: z.number().default(0) }).passthrough().default({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }),
  features: z.array(z.record(z.string(), z.unknown())).default([]),
  roleplay: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
}).passthrough()

function deepMerge(base, data) {
  const out = { ...base, ...(data || {}) }
  for (const key of ['race', 'hp', 'hitDice', 'ac', 'initiative', 'currency']) {
    out[key] = { ...(base[key] || {}), ...((data && data[key]) || {}) }
  }
  out.abilities = { ...ABILITIES, ...((data && data.abilities) || {}) }
  out.spellcasting = { ...base.spellcasting, ...((data && data.spellcasting) || {}) }
  out.roleplay = { ...base.roleplay, ...((data && data.roleplay) || {}) }
  return out
}

export function normalizeCharacter(data, fallbackName = '新角色') {
  const merged = deepMerge(defaultCharacter(fallbackName), data)
  return CharacterSchema.parse(merged)
}

export function isValidId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(id)
}

export function characterFile(id) {
  return path.join(CHARS_DIR, `${id}.json`)
}

export function readCharacterFile(id) {
  try {
    const raw = JSON.parse(fs.readFileSync(characterFile(id), 'utf8'))
    return normalizeCharacter(raw, raw?.name)
  } catch {
    return null
  }
}

function atomicWrite(file, text) {
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, file)
}

export function characterLevel(c) {
  return (c.classes || []).reduce((n, x) => n + (Number(x.level) || 0), 0)
}

export function characterSummary(c) {
  const classes = (c.classes || []).filter((x) => x.name)
  return {
    id: c.id,
    name: c.name,
    level: characterLevel(c),
    classLine: classes.map((x) => `${x.name}${x.subclass ? `（${x.subclass}）` : ''} ${x.level}`).join(' / '),
    race: c.race?.name || '',
    portrait: c.portrait || null,
    updatedAt: c.updatedAt || 0,
  }
}

export function listCharacters() {
  ensureDirs()
  const out = []
  for (const name of fs.readdirSync(CHARS_DIR)) {
    if (!name.endsWith('.json')) continue
    const id = name.slice(0, -5)
    if (!isValidId(id)) continue
    const c = readCharacterFile(id)
    if (!c) continue
    out.push(characterSummary(c))
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getCharacter(id) {
  if (!isValidId(id)) return null
  return readCharacterFile(id)
}

export function createCharacter(partial = {}) {
  ensureDirs()
  const id = crypto.randomBytes(6).toString('hex')
  const c = normalizeCharacter({
    ...partial,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, partial.name || '新角色')
  c.id = id
  atomicWrite(characterFile(id), JSON.stringify(c, null, 2))
  return c
}

export function backupCharacter(id, data) {
  if (!isValidId(id)) return null
  const dir = path.join(BACKUPS_DIR, id)
  fs.mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `${stamp}-${crypto.randomBytes(2).toString('hex')}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  for (const old of files.slice(0, Math.max(0, files.length - 30))) {
    try { fs.unlinkSync(path.join(dir, old)) } catch { /* ignore */ }
  }
  return path.basename(file)
}

export function saveCharacter(id, data, { backup = true } = {}) {
  if (!isValidId(id)) throw new Error('invalid id')
  ensureDirs()
  const existing = readCharacterFile(id)
  const c = normalizeCharacter({ ...data, id, createdAt: existing?.createdAt || data.createdAt || Date.now() }, data.name || existing?.name || '新角色')
  c.id = id
  c.updatedAt = Date.now()
  if (backup && existing) backupCharacter(id, existing)
  atomicWrite(characterFile(id), JSON.stringify(c, null, 2))
  return c
}

export function deleteCharacter(id) {
  if (!isValidId(id)) return false
  const c = readCharacterFile(id)
  if (c?.portrait) deletePortraitFile(c.portrait)
  try {
    fs.unlinkSync(characterFile(id))
    return true
  } catch {
    return false
  }
}

export function duplicateCharacter(id) {
  if (!isValidId(id)) return null
  const c = readCharacterFile(id)
  if (!c) return null
  const newId = crypto.randomBytes(6).toString('hex')
  const copy = JSON.parse(JSON.stringify(c))
  copy.id = newId
  copy.name = `${c.name}（副本）`
  copy.createdAt = Date.now()
  copy.updatedAt = Date.now()
  if (c.portrait) {
    const src = portraitFileFromUrl(c.portrait)
    if (src && fs.existsSync(src)) {
      const ext = path.extname(src) || '.png'
      const fname = `${newId}-${Date.now()}${ext}`
      fs.copyFileSync(src, path.join(PORTRAITS_DIR, fname))
      copy.portrait = `/media/portraits/${fname}`
    } else {
      copy.portrait = null
    }
  }
  atomicWrite(characterFile(newId), JSON.stringify(copy, null, 2))
  return copy
}

export function listBackups(id) {
  if (!isValidId(id)) return []
  const dir = path.join(BACKUPS_DIR, id)
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const st = fs.statSync(path.join(dir, f))
        return { file: f, size: st.size, savedAt: st.mtimeMs }
      })
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 50)
  } catch {
    return []
  }
}

export function restoreBackup(id, file) {
  if (!isValidId(id)) throw new Error('invalid id')
  const safe = path.basename(String(file || ''))
  if (!safe.endsWith('.json')) throw new Error('invalid backup')
  const src = path.join(BACKUPS_DIR, id, safe)
  if (!fs.existsSync(src)) throw new Error('backup not found')
  const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
  const existing = readCharacterFile(id)
  if (existing) backupCharacter(id, existing)
  const c = normalizeCharacter({ ...raw, id, updatedAt: Date.now() }, raw.name || '角色')
  c.id = id
  atomicWrite(characterFile(id), JSON.stringify(c, null, 2))
  return c
}

function portraitFileFromUrl(url) {
  const m = String(url || '').match(/\/media\/portraits\/([^/]+)$/)
  if (!m) return null
  const fname = path.basename(m[1])
  return path.join(PORTRAITS_DIR, fname)
}

export function deletePortraitFile(url) {
  const p = portraitFileFromUrl(url)
  if (p) {
    try { fs.unlinkSync(p) } catch { /* ignore */ }
  }
}

export function savePortrait(id, dataUrl) {
  if (!isValidId(id)) throw new Error('invalid id')
  ensureDirs()
  const c = readCharacterFile(id)
  if (!c) throw new Error('character not found')
  if (c.portrait) deletePortraitFile(c.portrait)
  if (!dataUrl) {
    c.portrait = null
    c.updatedAt = Date.now()
    atomicWrite(characterFile(id), JSON.stringify(c, null, 2))
    return c
  }
  const m = String(dataUrl).match(/^data:image\/(png|jpeg|webp);base64,(.+)$/)
  if (!m) throw new Error('仅支持 PNG / JPEG / WebP 图片')
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length > 8 * 1024 * 1024) throw new Error('图片过大（最大 8 MB）')
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
  const fname = `${id}-${Date.now()}.${ext}`
  fs.writeFileSync(path.join(PORTRAITS_DIR, fname), buf)
  c.portrait = `/media/portraits/${fname}`
  c.updatedAt = Date.now()
  atomicWrite(characterFile(id), JSON.stringify(c, null, 2))
  return c
}
