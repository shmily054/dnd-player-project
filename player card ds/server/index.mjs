import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.mjs'
import { PORTRAITS_DIR, ensureDirs, loadSettings } from './db.mjs'
import { getCompendium } from './compendium.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const argv = process.argv.slice(2)
const PROD = argv.includes('--prod')
const OPEN = argv.includes('--open')

function argVal(names, def) {
  for (let i = 0; i < argv.length; i++) {
    for (const n of names) {
      if (argv[i] === n && argv[i + 1]) return argv[i + 1]
      if (argv[i].startsWith(n + '=')) return argv[i].slice(n.length + 1)
    }
  }
  return def
}

const settings = loadSettings()
const startPort = Number(argVal(['--port', '-p'], process.env.PORT || settings.port || 7100))
const HOST = '127.0.0.1'

ensureDirs()
const compendium = getCompendium()
if (compendium.error) {
  console.error(`[dnd-card] 规则库不可用：${compendium.error}`)
} else {
  console.log(`[dnd-card] 规则库：${compendium.counts.total} 条（${compendium.counts.spells} 法术 / ${compendium.counts.items} 物品 / ${compendium.counts.feats} 专长）`)
}
console.log(`[dnd-card] 数据库：${compendium.source?.dir || ''}`)

let vite = null
if (!PROD) {
  const { createServer } = await import('vite')
  vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true, hmr: { port: 24679 } },
    appType: 'spa',
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function serveFile(res, file, cache = 'no-cache') {
  try {
    const data = fs.readFileSync(file)
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': cache,
    })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('not found')
  }
}

function safeJoin(base, urlPath) {
  const p = path.normalize(path.join(base, decodeURIComponent(urlPath)))
  if (!p.startsWith(base + path.sep) && p !== base) return null
  return p
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || HOST}`)
  try {
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url)
    }
    if (url.pathname.startsWith('/media/portraits/')) {
      const name = path.basename(decodeURIComponent(url.pathname))
      const file = path.join(PORTRAITS_DIR, name)
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return serveFile(res, file, 'public, max-age=31536000, immutable')
      }
      res.writeHead(404)
      return res.end('not found')
    }
    if (PROD) {
      const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '')
      const file = safeJoin(DIST, rel)
      if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return serveFile(res, file)
      return serveFile(res, path.join(DIST, 'index.html'))
    }
    return vite.middlewares(req, res)
  } catch (e) {
    console.error('[dnd-card] request error', e)
    try {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: String(e?.message || e) }))
    } catch { /* ignore */ }
  }
})

function listen(port) {
  return new Promise((resolve, reject) => {
    const onError = (e) => {
      server.off('listening', onListening)
      reject(e)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve(port)
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, HOST)
  })
}

let actualPort = null
for (let i = 0; i < 20; i++) {
  try {
    actualPort = await listen(startPort + i)
    break
  } catch (e) {
    if (e.code !== 'EADDRINUSE') throw e
  }
}
if (!actualPort) {
  console.error(`[dnd-card] 无法找到可用端口（${startPort}-${startPort + 19}）`)
  process.exit(1)
}

const url = `http://${HOST}:${actualPort}/`
console.log(`[dnd-card] ${PROD ? '生产' : '开发'}模式：${url}`)
console.log(`[dnd-card] 数据目录：${path.join(ROOT, 'data')}`)

if (OPEN) {
  const cmd = process.platform === 'win32'
    ? `cmd /c start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`
  exec(cmd, () => { /* 浏览器打不开时仍可用日志中的地址 */ })
}
