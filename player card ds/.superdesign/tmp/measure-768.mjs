import { spawn } from 'node:child_process'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9343
const profile = process.env.TEMP + '/zcode-measure-' + Date.now()
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl = ''
for (let i = 0; i < 60; i++) {
  try {
    const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    if (v.webSocketDebuggerUrl) {
      const p = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('http://127.0.0.1:7130/')}`, { method: 'PUT' })
      const t = await p.json()
      wsUrl = t.webSocketDebuggerUrl
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
await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 768, screenHeight: 1000 })
await send('Page.navigate', { url: 'http://127.0.0.1:7130/' })
await sleep(2500)
const r = await send('Runtime.evaluate', { expression: `(() => {
  const y = (el) => Math.round(el.getBoundingClientRect().top + window.scrollY)
  const h = (el) => Math.round(el.getBoundingClientRect().height)
  return JSON.stringify({
    page: document.documentElement.scrollHeight,
    topbar: h(document.querySelector('.topbar')),
    vitals: h(document.querySelector('.vitals')),
    cols: [...document.querySelectorAll('.masonry-col')].map((c) => ({ top: y(c), height: h(c) })),
    panels: [...document.querySelectorAll('.panel')].map((p) => ({ id: p.id || '', title: p.querySelector('.panel-title')?.textContent?.trim().slice(0, 8) || '', top: y(p), height: h(p) })),
    roleplay: y(document.querySelector('#roleplay')),
  }, null, 2)
})()`, returnByValue: true })
console.log(r.result.value)
ws.close(); chrome.kill()
