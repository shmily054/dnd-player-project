import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9338
const FILES = {
  a: 'D:/KimiData/kimi/Workspaces/dnd player project/player card ds/.superdesign/tmp/direction-a.html',
  b: 'D:/KimiData/kimi/Workspaces/dnd player project/player card ds/.superdesign/tmp/direction-b.html',
}
const OUT = 'D:/KimiData/kimi/Workspaces/dnd player project/player card ds/screenshots'
const profile = path.join(process.env.TEMP, `zcode-chrome-dir-${Date.now()}`)

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function pageWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
      if (version.webSocketDebuggerUrl) {
        const page = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
        const target = await page.json()
        if (target.webSocketDebuggerUrl) return target.webSocketDebuggerUrl
      }
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome DevTools endpoint did not become ready')
}

const ws = new WebSocket(await pageWs())
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let seq = 0
const pending = new Map()
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(JSON.stringify(message.error)))
  else resolve(message.result)
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

await send('Page.enable')
await send('Runtime.enable')

async function capture(name, url, width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await send('Page.navigate', { url })
  await sleep(1200)
  await send('Runtime.evaluate', { expression: 'Promise.all(Array.from(document.images).map((img) => img.complete ? true : new Promise((resolve) => { img.onload = img.onerror = resolve; })))', awaitPromise: true })
  await sleep(400)
  const metrics = await send('Page.getLayoutMetrics')
  const size = metrics.cssContentSize ?? metrics.contentSize
  const full = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
  })
  await fs.writeFile(path.join(OUT, `${name}.png`), Buffer.from(full.data, 'base64'))
  const top = await send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await fs.writeFile(path.join(OUT, `${name}-top.png`), Buffer.from(top.data, 'base64'))
  console.log(`${name}: ${Math.ceil(size.width)}x${Math.ceil(size.height)}`)
}

for (const [key, file] of Object.entries(FILES)) {
  await capture(`dir-${key}-390`, `file:///${file}`, 390, 844, true)
  await capture(`dir-${key}-1440`, `file:///${file}`, 1440, 1000, false)
}

ws.close()
chrome.kill()
await sleep(500)
