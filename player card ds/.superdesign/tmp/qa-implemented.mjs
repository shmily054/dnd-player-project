import { spawn } from 'node:child_process'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9350
const profile = process.env.TEMP + '/zcode-qa-' + Date.now()
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl = ''
for (let i = 0; i < 60; i++) {
  try {
    const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    if (v.webSocketDebuggerUrl) {
      const p = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('http://127.0.0.1:7130/')}`, { method: 'PUT' })
      wsUrl = (await p.json()).webSocketDebuggerUrl
      break
    }
  } catch {}
  await sleep(200)
}
const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result) } }
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Page.enable'); await send('Runtime.enable')
for (const [w, h, mobile] of [[1440, 1000, false], [900, 1000, false], [390, 844, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h })
  await send('Page.navigate', { url: 'http://127.0.0.1:7130/' })
  await sleep(1800)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1200)' })
  await sleep(400)
  const r = await send('Runtime.evaluate', { expression: `(() => {
    const tb = document.querySelector('.topbar').getBoundingClientRect()
    const vt = document.querySelector('.vitals').getBoundingClientRect()
    return JSON.stringify({
      innerWidth, scrollWidth: document.documentElement.scrollWidth,
      topbar: { top: Math.round(tb.top), bottom: Math.round(tb.bottom), height: Math.round(tb.height) },
      vitals: { top: Math.round(vt.top), height: Math.round(vt.height) },
      overlap: Math.round(vt.top) < Math.round(tb.bottom),
      panels: document.querySelectorAll('.panel').length,
      vitalsText: document.querySelector('.vitals')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80),
    }, null, 2)
  })()`, returnByValue: true })
  console.log(w + 'px\n' + r.result.value + '\n')
}
ws.close(); chrome.kill()
