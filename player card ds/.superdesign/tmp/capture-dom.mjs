import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9336
const BASE = 'http://127.0.0.1:7130/'
const PORTRAIT_URL =
  'https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/2ac28d3e-2fd1-446b-929e-c4eb16d4dd50/content-assets/portrait-justinian01/justinian01.png'
const profile = path.join(process.env.TEMP, `zcode-chrome-dom-${Date.now()}`)

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
      const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
      if (version.webSocketDebuggerUrl) {
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: 1440,
  screenHeight: 1000,
})
await sleep(1500)

for (let i = 0; i < 40; i++) {
  const res = await send('Runtime.evaluate', {
    expression: "document.querySelectorAll('.panel').length",
    returnByValue: true,
  })
  if ((res.result?.value ?? 0) >= 8) break
  await sleep(250)
}

await send('Runtime.evaluate', {
  expression: "localStorage.setItem('dnd-theme','light'); document.documentElement.classList.remove('dark');",
})
await sleep(400)

await send('Runtime.evaluate', {
  expression: `(() => {
    document.querySelectorAll('input').forEach((el) => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) el.setAttribute('checked', '');
        else el.removeAttribute('checked');
      } else {
        el.setAttribute('value', el.value);
      }
    });
    document.querySelectorAll('textarea').forEach((el) => {
      el.textContent = el.value;
    });
    document.querySelectorAll('select').forEach((el) => {
      Array.from(el.options).forEach((o) => {
        if (o.value === el.value) o.setAttribute('selected', '');
        else o.removeAttribute('selected');
      });
    });
    document.querySelectorAll('details').forEach((el) => {
      if (el.open) el.setAttribute('open', '');
      else el.removeAttribute('open');
    });
    return true;
  })()`,
  returnByValue: true,
})

const htmlResult = await send('Runtime.evaluate', {
  expression: 'document.documentElement.outerHTML',
  returnByValue: true,
})
const cssHrefResult = await send('Runtime.evaluate', {
  expression: "document.querySelector('link[rel=\"stylesheet\"]')?.href ?? ''",
  returnByValue: true,
})
const cssHref = cssHrefResult.result.value
const cssPath = path.join('dist', new URL(cssHref).pathname.replace(/^\//, ''))
const css = fs.readFileSync(cssPath, 'utf8')

let html = htmlResult.result.value
html = html.replace(/<!DOCTYPE[^>]*>/i, '')
html = '<!DOCTYPE html>\n' + html
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi, '')
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, `<style>\n${css}\n</style>`)
html = html.replaceAll('/media/portraits/justinian01.png', PORTRAIT_URL)
html = html.replace(/<link\b[^>]*rel="icon"[^>]*>/gi, '')

fs.writeFileSync('.superdesign/tmp/baseline-static.html', html, 'utf8')
console.log(JSON.stringify({
  cssHref,
  cssBytes: css.length,
  htmlBytes: html.length,
  scriptsLeft: (html.match(/<script/gi) || []).length,
  relativeSrc: (html.match(/(?:src|href)="\//g) || []).slice(0, 10),
  anchors: (html.match(/<a\b/gi) || []).length,
  bodyClass: html.match(/<body[^>]*>/i)?.[0] ?? '',
}, null, 2))

ws.close()
chrome.kill()
await sleep(600)
await fs.rm(profile, { recursive: true, force: true }).catch(() => {})
