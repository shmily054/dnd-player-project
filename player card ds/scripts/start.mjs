/**
 * 一键启动器：检查依赖、构建前端，然后启动本地服务。
 * 用 Node 处理逻辑，避免 Windows 批处理对中文/换行/括号的解析问题。
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function log(msg) {
  console.log(`[start] ${msg}`)
}

function run(command, args) {
  const r = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.error) {
    console.error(`[start] Failed to run ${command}: ${r.error.message}`)
    return false
  }
  return r.status === 0
}

function latestMtime(target) {
  let latest = 0
  const stat = fs.statSync(target)
  if (stat.isFile()) return stat.mtimeMs
  for (const name of fs.readdirSync(target)) {
    if (name === 'node_modules' || name === 'dist' || name === 'data') continue
    latest = Math.max(latest, latestMtime(path.join(target, name)))
  }
  return latest
}

function needsBuild() {
  const dist = path.join(ROOT, 'dist', 'index.html')
  if (!fs.existsSync(dist)) return true
  const distTime = fs.statSync(dist).mtimeMs
  const inputs = ['src', 'shared', 'server', 'index.html', 'package.json', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js']
  for (const p of inputs) {
    const full = path.join(ROOT, p)
    if (fs.existsSync(full) && latestMtime(full) > distTime) return true
  }
  return false
}

function main() {
  log('D&D Character Sheet')
  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    log('Installing dependencies (first run)...')
    if (!run(npm, ['install', '--no-audit', '--no-fund'])) {
      console.error('[start] Dependency installation failed.')
      process.exit(1)
    }
  }

  if (needsBuild()) {
    log('Building frontend...')
    if (!run(npm, ['run', 'build'])) {
      console.error('[start] Build failed.')
      process.exit(1)
    }
  }

  const extra = process.argv.slice(2)
  const noOpen = extra.includes('--no-open')
  const args = ['server/index.mjs', '--prod', ...extra.filter((x) => x !== '--no-open')]
  if (!noOpen) args.push('--open')

  log('Starting local server...')
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' })
  child.on('error', (e) => {
    console.error(`[start] Failed to start server: ${e.message}`)
    process.exit(1)
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

main()
