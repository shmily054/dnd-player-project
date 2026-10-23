import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const CHARS_DIR = path.join(DATA_DIR, 'characters')
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups')
export const PORTRAITS_DIR = path.join(DATA_DIR, 'portraits')
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
export const CONFIG_FILE = path.join(ROOT, 'config.json')

const mdCache = new Map()
let settingsCache = null

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function ensureDirs() {
  for (const d of [DATA_DIR, CHARS_DIR, BACKUPS_DIR, PORTRAITS_DIR]) fs.mkdirSync(d, { recursive: true })
}

export function loadSettings() {
  if (settingsCache) return settingsCache
  const base = readJson(CONFIG_FILE, {})
  const override = readJson(SETTINGS_FILE, {})
  settingsCache = {
    databaseDir: override.databaseDir || base.databaseDir || '../database',
    port: Number(override.port || base.port || 7100),
    host: override.host || base.host || '127.0.0.1',
  }
  return settingsCache
}

export function saveSettings(patch) {
  ensureDirs()
  const next = { ...loadSettings(), ...patch }
  const tmp = SETTINGS_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, SETTINGS_FILE)
  settingsCache = next
  mdCache.clear()
  return next
}

export function getDatabaseDir() {
  const s = loadSettings()
  return path.isAbsolute(s.databaseDir) ? s.databaseDir : path.resolve(ROOT, s.databaseDir)
}

export function listMdFiles(dir = getDatabaseDir()) {
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

export function dbStatus() {
  const dir = getDatabaseDir()
  const files = listMdFiles(dir)
  return {
    dir,
    exists: fs.existsSync(dir),
    mdCount: files.length,
    books: [...new Set(files.map((f) => path.relative(dir, f).split(path.sep)[0]))],
  }
}

export function readMd(file) {
  const st = fs.statSync(file)
  const hit = mdCache.get(file)
  if (hit && hit.mtimeMs === st.mtimeMs) return hit.text
  const text = fs.readFileSync(file, 'utf8')
  mdCache.set(file, { mtimeMs: st.mtimeMs, text })
  return text
}

export function fileInfo(file, dbDir = getDatabaseDir()) {
  const rel = path.relative(dbDir, file)
  const top = rel.split(path.sep)[0]
  const book = top === 'player handbook' ? '玩家手册' : top === 'dungeon master guidance' ? '城主指南' : top
  const chapter = path.basename(file, '.md').replace(/^\d+-/, '')
  return { book, chapter, rel: rel.replace(/\\/g, '/') }
}

export function clearDbCache() {
  mdCache.clear()
}
