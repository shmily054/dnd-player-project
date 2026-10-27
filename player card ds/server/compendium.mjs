import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { PARSER_VERSION, writeCompendium } from '../scripts/build-compendium.mjs'
import { DATA_DIR, getDatabaseDir, listMdFiles } from './db.mjs'

const FILE = path.join(DATA_DIR, 'compendium.json')
let cache = null
let lastError = null

function sha1(s) {
  return crypto.createHash('sha1').update(s).digest('hex')
}

export function sourceHash(dbDir) {
  const files = listMdFiles(dbDir)
  const parts = files.map((f) => {
    const st = fs.statSync(f)
    return `${path.relative(dbDir, f).replace(/\\/g, '/')}:${st.size}:${Math.round(st.mtimeMs)}`
  })
  return sha1([`parser:${PARSER_VERSION}`, ...parts].join('|'))
}

function emptyCompendium(dbDir, error) {
  return {
    version: 1,
    builtAt: null,
    source: { dir: dbDir, hash: '', files: [] },
    counts: { spells: 0, items: 0, feats: 0, classFeatures: 0, speciesTraits: 0, conditions: 0, armor: 0, shields: 0, weapons: 0, total: 0 },
    entries: [],
    warnings: [error],
    missing: {},
    error,
  }
}

export function getCompendium({ force = false } = {}) {
  const dbDir = getDatabaseDir()
  if (cache && !force && cache.source?.dir === dbDir) return cache
  if (!force) {
    try {
      const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
      if (data.source?.dir === dbDir && data.source?.hash === sourceHash(dbDir)) {
        cache = data
        lastError = null
        return cache
      }
    } catch {
      // 文件不存在或损坏，重建
    }
  }
  try {
    cache = writeCompendium(dbDir, DATA_DIR)
    lastError = null
  } catch (e) {
    lastError = String(e?.message || e)
    cache = emptyCompendium(dbDir, lastError)
  }
  return cache
}

export function rebuildCompendium() {
  cache = null
  return getCompendium({ force: true })
}

export function getEntry(uid) {
  const data = getCompendium()
  return data.entries.find((e) => e.uid === uid) || null
}

export function compendiumMeta() {
  const data = getCompendium()
  return {
    builtAt: data.builtAt,
    counts: data.counts,
    warnings: data.warnings || [],
    error: data.error || lastError || null,
    source: { dir: data.source?.dir || getDatabaseDir(), hash: data.source?.hash || '' },
  }
}
