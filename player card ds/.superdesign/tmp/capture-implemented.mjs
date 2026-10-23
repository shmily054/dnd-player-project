import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9340
const BASE = 'http://127.0.0.1:7130/'
const OUT = path.resolve('screenshots')
const profile = path.join(process.env.TEMP, `zcode-chrome-capture-${Date.now()}`)

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

async function getPageWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const json = await res.json()
      if (json.webSocketDebuggerUrl) {
        const page = await fetch(
          `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`,
          { method: 'PUT' },
        )
        const target = await page.json()
        if (target.webSocketDebuggerUrl) return target.webSocketDebuggerUrl
      }
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome DevTools endpoint did not become ready')
}

const ws = new WebSocket(await getPageWsUrl())
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

async function waitForPanels() {
  for (let i = 0; i < 40; i++) {
    const res = await send('Runtime.evaluate', {
      expression: "document.querySelectorAll('.panel').length",
      returnByValue: true,
    })
    if ((res.result?.value ?? 0) >= 3) return
    await sleep(250)
  }
  throw new Error('Character sheet panels did not render')
}

async function setTheme(theme) {
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('dnd-theme', ${JSON.stringify(theme)}); document.documentElement.classList.toggle('dark', ${theme === 'dark'});`,
  })
  await sleep(500)
}

async function mobileClip(name, y) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
  await setTheme('light');
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, ' + y + ')' });
  await sleep(400);
  const image = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(path.join(OUT, name), Buffer.from(image.data, 'base64'));
  console.log(name + ': 390x844 scroll ' + y);
}

async function shot(name, width, height, mobile, theme) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await send('Page.navigate', { url: BASE })
  await sleep(900)
  await waitForPanels()
  await setTheme(theme)
  const metrics = await send('Page.getLayoutMetrics')
  const size = metrics.cssContentSize ?? metrics.contentSize
  const clip = {
    x: 0,
    y: 0,
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
    scale: 1,
  }
  const image = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip,
  })
  await fs.writeFile(path.join(OUT, name), Buffer.from(image.data, 'base64'))
  console.log(`${name}: ${clip.width}x${clip.height}`)
}

async function viewportShot(name, width, height, mobile, theme) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' })
  await setTheme(theme)
  await sleep(300)
  const image = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  })
  await fs.writeFile(path.join(OUT, name), Buffer.from(image.data, 'base64'))
  console.log(`${name}: ${width}x${height}`)
}

async function clipShot(name, width, height, clipY, clipHeight, theme) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  })
  await setTheme(theme)
  await sleep(300)
  const image = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: clipY, width, height: clipHeight, scale: 1 },
  })
  await fs.writeFile(path.join(OUT, name), Buffer.from(image.data, 'base64'))
  console.log(`${name}: ${width}x${clipHeight}`)
}

await shot('implemented-1440-light.png', 1440, 1000, false, 'light')
await shot('implemented-1440-dark.png', 1440, 1000, false, 'dark')
await shot('implemented-390-light.png', 390, 844, true, 'light')

await viewportShot('implemented-1440-top.png', 1440, 1000, false, 'light')
await clipShot('implemented-1440-combat.png', 1440, 1000, 230, 760, 'light')
await clipShot('implemented-1440-spells.png', 1440, 1000, 980, 900, 'light')
await viewportShot('implemented-390-top.png', 390, 844, true, 'light')
await mobileClip('implemented-390-combat.png', 1050)
await mobileClip('implemented-390-spells.png', 2300)
await mobileClip('implemented-390-inventory.png', 4200)
await mobileClip('implemented-390-features.png', 6200)
await clipShot('implemented-1440-attacks2.png', 1440, 1000, 1840, 520, 'light')

ws.close()
chrome.kill()
await sleep(600)
await fs.rm(profile, { recursive: true, force: true }).catch(() => {})
