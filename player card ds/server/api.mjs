import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT,
  clearDbCache,
  dbStatus,
  listMdFiles,
  loadSettings,
  saveSettings,
} from './db.mjs'
import {
  compendiumMeta,
  getEntry,
  rebuildCompendium,
} from './compendium.mjs'
import { compendiumCounts, searchAll } from './search.mjs'
import {
  createCharacter,
  deleteCharacter,
  duplicateCharacter,
  getCharacter,
  listBackups,
  listCharacters,
  restoreBackup,
  saveCharacter,
  savePortrait,
} from './storage.mjs'

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function jsonBody(req) {
  const buf = await readBody(req)
  if (!buf.length) return {}
  return JSON.parse(buf.toString('utf8'))
}

function boolParam(v) {
  return v === '1' || v === 'true' || v === 'yes'
}

function searchOptions(url) {
  const p = url.searchParams
  const opts = {
    type: p.get('type') || 'all',
    limit: p.get('limit') || 30,
    offset: p.get('offset') || 0,
  }
  for (const key of ['level', 'school', 'class', 'featureLevel', 'featureClass', 'species', 'rarity', 'kind', 'book', 'chapter']) {
    const v = p.get(key)
    if (v !== null && v !== '') opts[key] = v
  }
  if (boolParam(p.get('ritual'))) opts.ritual = '1'
  if (boolParam(p.get('concentration'))) opts.concentration = '1'
  return opts
}

export async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean) // ['api', ...]
  const method = req.method || 'GET'
  const p1 = parts[1]

  if (p1 === 'health') return sendJson(res, 200, { ok: true })

  if (p1 === 'meta' && method === 'GET') {
    const chars = listCharacters()
    return sendJson(res, 200, {
      app: 'dnd-character-sheet',
      settings: loadSettings(),
      database: dbStatus(),
      compendium: compendiumMeta(),
      counts: compendiumCounts(),
      characters: chars.length,
      dataDir: path.join(ROOT, 'data'),
    })
  }

  if (p1 === 'characters') {
    const id = parts[2]
    if (!id) {
      if (method === 'GET') return sendJson(res, 200, { characters: listCharacters() })
      if (method === 'POST') {
        const body = await jsonBody(req)
        return sendJson(res, 200, createCharacter(body || {}))
      }
      return sendJson(res, 405, { error: 'method not allowed' })
    }

    if (method === 'GET' && !parts[3]) {
      const c = getCharacter(id)
      if (!c) return sendJson(res, 404, { error: '角色不存在' })
      return sendJson(res, 200, c)
    }
    if (method === 'PUT' && !parts[3]) {
      const body = await jsonBody(req)
      try {
        const c = saveCharacter(id, body)
        return sendJson(res, 200, c)
      } catch (e) {
        return sendJson(res, 400, { error: String(e?.message || e) })
      }
    }
    if (method === 'DELETE' && !parts[3]) {
      const ok = deleteCharacter(id)
      return sendJson(res, ok ? 200 : 404, { ok })
    }
    if (parts[3] === 'duplicate' && method === 'POST') {
      const c = duplicateCharacter(id)
      if (!c) return sendJson(res, 404, { error: '角色不存在' })
      return sendJson(res, 200, c)
    }
    if (parts[3] === 'portrait' && method === 'POST') {
      try {
        const body = await jsonBody(req)
        const c = savePortrait(id, body?.dataUrl || null)
        return sendJson(res, 200, c)
      } catch (e) {
        return sendJson(res, 400, { error: String(e?.message || e) })
      }
    }
    if (parts[3] === 'backups' && method === 'GET') {
      return sendJson(res, 200, { backups: listBackups(id) })
    }
    if (parts[3] === 'restore' && method === 'POST') {
      try {
        const body = await jsonBody(req)
        const c = restoreBackup(id, body?.file)
        return sendJson(res, 200, c)
      } catch (e) {
        return sendJson(res, 400, { error: String(e?.message || e) })
      }
    }
    return sendJson(res, 404, { error: 'unknown character api' })
  }

  if (p1 === 'search' && method === 'GET') {
    try {
      const q = url.searchParams.get('q') || ''
      return sendJson(res, 200, searchAll(q, searchOptions(url)))
    } catch (e) {
      return sendJson(res, 500, { error: String(e?.message || e) })
    }
  }

  if (p1 === 'compendium') {
    const uid = parts[2]
    if (uid === 'rebuild' && method === 'POST') {
      const data = rebuildCompendium()
      return sendJson(res, 200, compendiumMeta())
    }
    if (method === 'GET' && uid) {
      const e = getEntry(uid)
      if (!e) return sendJson(res, 404, { error: '条目不存在' })
      return sendJson(res, 200, e)
    }
    if (method === 'GET') {
      try {
        const q = url.searchParams.get('q') || ''
        return sendJson(res, 200, searchAll(q, searchOptions(url)))
      } catch (e) {
        return sendJson(res, 500, { error: String(e?.message || e) })
      }
    }
    return sendJson(res, 405, { error: 'method not allowed' })
  }

  if (p1 === 'settings') {
    if (method === 'GET') return sendJson(res, 200, { settings: loadSettings(), database: dbStatus() })
    if (method === 'PUT') {
      const body = await jsonBody(req)
      const raw = String(body?.databaseDir || '').trim()
      if (!raw) return sendJson(res, 400, { error: '数据库路径不能为空' })
      const abs = path.isAbsolute(raw) ? raw : path.resolve(ROOT, raw)
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
        return sendJson(res, 400, { error: `目录不存在：${abs}` })
      }
      if (listMdFiles(abs).length === 0) {
        return sendJson(res, 400, { error: `该目录下没有 Markdown 规则文件：${abs}` })
      }
      saveSettings({ databaseDir: raw })
      clearDbCache()
      rebuildCompendium()
      return sendJson(res, 200, {
        settings: loadSettings(),
        database: dbStatus(),
        compendium: compendiumMeta(),
      })
    }
    return sendJson(res, 405, { error: 'method not allowed' })
  }

  return sendJson(res, 404, { error: 'unknown api' })
}
