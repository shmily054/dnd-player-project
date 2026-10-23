# Theme — tokens, typography, and raw styles

## Part 1 — Compact token summary

### Framework / CSS approach
- React 19 + TypeScript + Vite 7.
- Tailwind 3.4 is installed and its directives are in `src/styles.css`, but ~95% of the visual language is hand-written component CSS.
- One global stylesheet: `src/styles.css` (775 lines). No CSS modules, no CSS-in-JS.
- Dark mode: class `.dark` on `<html>`; persisted in `localStorage['dnd-theme']` (`light` default, `dark` = "墨夜").

### Color tokens — light (:root)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#efe4cc` | parchment page base |
| `--bg-deep` | `#e5d4b2` | deeper parchment |
| `--panel` | `#fbf7ec` | card surface |
| `--panel-2` | `#f5ecd9` | inputs, inner boxes, table headers |
| `--panel-3` | `#efe3ca` | pressed/hover surface, tracks |
| `--ink` | `#2b241b` | primary text |
| `--ink-soft` | `#4a3d2e` | body copy |
| `--muted` | `#7d6c55` | labels/metadata |
| `--line` | `#d6c5a4` | borders |
| `--line-strong` | `#b9a276` | stronger borders |
| `--brown` | `#6b4426` | serif headings/links |
| `--brown-soft` | `#8a6038` | secondary brown |
| `--gold` | `#a9772f` | primary accent / XP / level |
| `--gold-bright` | `#c99a47` | gold hover/gradient |
| `--green` | `#2f5d50` | primary actions, proficiency |
| `--green-soft` | `#dce8e1` | green tint |
| `--red` | `#8c2f2f` | HP / damage / danger |
| `--red-soft` | `#f0dcd7` | red tint |
| `--blue` | `#355b78` | spell slots / psychic / arcane |
| `--blue-soft` | `#dde8ef` | blue tint |
| `--shadow` | `0 10px 28px rgba(71,48,18,.09)` | panel shadow |
| `--shadow-soft` | `0 2px 8px rgba(71,48,18,.06)` | subtle shadow |
| `--radius` | `13px` | panel radius |

### Color tokens — dark (.dark)
| Token | Value |
|---|---|
| `--bg` | `#1b1916` |
| `--bg-deep` | `#151311` |
| `--panel` | `#27231d` |
| `--panel-2` | `#302b24` |
| `--panel-3` | `#383229` |
| `--ink` | `#f0e7d6` |
| `--ink-soft` | `#d5c8b1` |
| `--muted` | `#b3a58d` |
| `--line` | `#4b4236` |
| `--line-strong` | `#6a5b47` |
| `--brown` | `#d8b183` |
| `--brown-soft` | `#e2c39d` |
| `--gold` | `#d4a54e` |
| `--gold-bright` | `#e8bf6e` |
| `--green` | `#83b8a6` |
| `--red` | `#de9488` |
| `--blue` | `#8fb6cd` |

### Typography
- Display/serif: `"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", Georgia, serif` — h1–h4, `.serif`, brand, ability scores, hero name, level-up class name.
- Body/UI: `system-ui, "Noto Sans SC", "Microsoft YaHei", sans-serif`.
- No webfonts; no network font loading.
- Observed scale: badges 0.6rem; table heads 0.63rem; labels 0.62–0.68rem; panel subtitles 0.7rem; body 0.76rem; buttons 0.71–0.77rem; panel titles 1.02rem; hero name `clamp(1.5rem, 3vw, 2.15rem)`; HP 2rem; ability scores 1.6rem.
- Body text is frequently 9.6–12.5 px — the main readability issue for Chinese.

### Spacing / radii / shadows / breakpoints
- Page max 1320px; horizontal padding `clamp(12px, 3vw, 28px)`; panel grid gap 14px.
- Panel head 12/14/10px; body 13/14/15px.
- Radii: panels 13px, modal 16px, inputs/buttons 6–8px, stat cards 9–10px, cards 12px, pills/circles 99px.
- Breakpoints: 1050px two-column sheet; 780px search/level-up single column; 760px mobile top bar + bottom nav + 3-col abilities; 700px hero 2-col; 640px form 1-col; 620px skills/stat/roleplay 1-col; 560px HP stacks.

### Background
- Light body: three fixed radial gradients (cream/gold/brown) over `--bg`.
- Dark body: brown/green radial washes over near-black.
- Panels have a 1px top highlight via `.panel::before`.

### Tailwind config
The Tailwind palette (`parchment #f3ead6`, `ink #2c241b`, `brown #6b4426`, `gold #b8863b`, `forest #2f5d50`, `wine #8c2f2f`) is **not used** by any TSX utility class; the real palette is the CSS variables above. Three values differ from the CSS tokens.

## Part 2 — Raw source

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f3ead6',
        ink: '#2c241b',
        brown: '#6b4426',
        gold: '#b8863b',
        forest: '#2f5d50',
        wine: '#8c2f2f',
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Noto Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
        body: ['system-ui', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### `src/styles.css` (full)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #efe4cc;
  --bg-deep: #e5d4b2;
  --panel: #fbf7ec;
  --panel-2: #f5ecd9;
  --panel-3: #efe3ca;
  --ink: #2b241b;
  --ink-soft: #4a3d2e;
  --muted: #7d6c55;
  --line: #d6c5a4;
  --line-strong: #b9a276;
  --brown: #6b4426;
  --brown-soft: #8a6038;
  --gold: #a9772f;
  --gold-bright: #c99a47;
  --green: #2f5d50;
  --green-soft: #dce8e1;
  --red: #8c2f2f;
  --red-soft: #f0dcd7;
  --blue: #355b78;
  --blue-soft: #dde8ef;
  --shadow: 0 10px 28px rgba(71, 48, 18, 0.09);
  --shadow-soft: 0 2px 8px rgba(71, 48, 18, 0.06);
  --radius: 13px;
}

.dark {
  --bg: #1b1916;
  --bg-deep: #151311;
  --panel: #27231d;
  --panel-2: #302b24;
  --panel-3: #383229;
  --ink: #f0e7d6;
  --ink-soft: #d5c8b1;
  --muted: #b3a58d;
  --line: #4b4236;
  --line-strong: #6a5b47;
  --brown: #d8b183;
  --brown-soft: #e2c39d;
  --gold: #d4a54e;
  --gold-bright: #e8bf6e;
  --green: #83b8a6;
  --green-soft: #243b35;
  --red: #de9488;
  --red-soft: #422a27;
  --blue: #8fb6cd;
  --blue-soft: #263642;
  --shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.25);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--ink);
  font-family: system-ui, "Noto Sans SC", "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(1100px 700px at 12% -10%, rgba(255, 252, 242, 0.65), transparent 60%),
    radial-gradient(900px 600px at 100% 5%, rgba(169, 119, 47, 0.10), transparent 62%),
    radial-gradient(800px 600px at 50% 110%, rgba(107, 68, 38, 0.08), transparent 60%),
    var(--bg);
  background-attachment: fixed;
}

.dark body {
  background:
    radial-gradient(1000px 700px at 10% -10%, rgba(90, 72, 45, 0.22), transparent 60%),
    radial-gradient(900px 600px at 100% 0%, rgba(50, 70, 62, 0.18), transparent 60%),
    var(--bg);
}

h1, h2, h3, h4, .serif {
  font-family: "Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", Georgia, serif;
  letter-spacing: 0.01em;
}

button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.45; }

::selection { background: rgba(201, 154, 71, 0.35); }

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-track { background: transparent; }

mark { background: rgba(201, 154, 71, 0.38); color: inherit; border-radius: 3px; padding: 0 1px; }

.app-shell { min-height: 100vh; padding-bottom: 48px; }

/* ---------------- Top bar ---------------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px clamp(12px, 3vw, 28px);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 4px 20px rgba(71, 48, 18, 0.06);
  backdrop-filter: blur(14px) saturate(1.1);
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: "Iowan Old Style", "Palatino Linotype", "Noto Serif SC", Georgia, serif;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.12em;
  color: var(--brown);
  white-space: nowrap;
}
.brand-mark {
  width: 30px; height: 30px;
  display: grid; place-items: center;
  border: 1px solid var(--gold);
  border-radius: 9px;
  color: var(--gold);
  background: linear-gradient(160deg, rgba(201,154,71,.16), transparent);
  font-size: 16px;
}
.nav-tabs { display: flex; align-items: center; gap: 2px; padding: 2px; border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); }
.nav-tab {
  border: 0; background: transparent; color: var(--muted);
  padding: 5px 10px; border-radius: 7px; font-size: 0.78rem; white-space: nowrap;
}
.nav-tab:hover { color: var(--ink); background: rgba(169,119,47,.08); }
.nav-tab.active { color: var(--panel); background: var(--brown); }
.topbar-spacer { flex: 1 1 12px; }

.character-switch {
  display: flex; align-items: center; gap: 6px;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 9px; padding: 3px 6px 3px 9px;
}
.character-switch select { border: 0; background: transparent; color: var(--ink); font-size: 0.8rem; max-width: 210px; outline: none; }
.character-switch .mini-btn { width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: var(--muted); display: grid; place-items: center; }
.character-switch .mini-btn:hover { background: rgba(169,119,47,.12); color: var(--brown); }

.top-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.save-pill { font-size: 0.7rem; color: var(--muted); display: flex; align-items: center; gap: 5px; padding: 4px 7px; border-radius: 99px; border: 1px solid transparent; white-space: nowrap; }
.save-pill.dirty { color: var(--gold); border-color: rgba(169,119,47,.3); background: rgba(169,119,47,.07); }
.save-pill.error { color: var(--red); border-color: rgba(140,47,47,.3); background: var(--red-soft); }
.save-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ---------------- Layout ---------------- */
.page-wrap { max-width: 1320px; margin: 0 auto; padding: 18px clamp(12px, 3vw, 28px); }
.sheet-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
@media (min-width: 1050px) {
  .sheet-grid { grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.28fr); align-items: start; }
  .sheet-col { display: flex; flex-direction: column; gap: 14px; }
}
.sheet-col { display: flex; flex-direction: column; gap: 14px; }
.span-all { grid-column: 1 / -1; }

/* ---------------- Panel ---------------- */
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}
.panel::before {
  content: "";
  position: absolute; inset: 0 0 auto 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent);
  pointer-events: none;
}
.dark .panel::before { background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); }
.panel-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 12px 14px 10px;
  border-bottom: 1px dashed var(--line);
}
.panel-title { margin: 0; font-size: 1.02rem; font-weight: 700; color: var(--brown); display: flex; align-items: center; gap: 7px; }
.panel-sub { margin: 3px 0 0; font-size: 0.7rem; color: var(--muted); line-height: 1.4; }
.panel-actions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
.panel-body { padding: 13px 14px 15px; }
.panel-dense .panel-body { padding: 10px 12px; }

/* ---------------- Buttons ---------------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  border-radius: 8px; border: 1px solid var(--line-strong);
  background: var(--panel-2); color: var(--ink);
  font-size: 0.77rem; font-weight: 600; line-height: 1.2;
  padding: 6px 10px;
  transition: background .15s, color .15s, border-color .15s, transform .05s;
  white-space: nowrap;
}
.btn:hover { background: var(--panel-3); }
.btn:active { transform: translateY(1px); }
.btn-primary { background: var(--green); border-color: var(--green); color: #f7f2e6; }
.btn-primary:hover { background: color-mix(in srgb, var(--green) 88%, black); }
.btn-gold { background: var(--gold); border-color: var(--gold); color: #231a0e; }
.btn-gold:hover { background: var(--gold-bright); }
.btn-danger { background: transparent; border-color: var(--red); color: var(--red); }
.btn-danger:hover { background: var(--red); color: var(--panel); }
.btn-ghost { background: transparent; border-color: transparent; color: var(--muted); }
.btn-ghost:hover { color: var(--brown); background: rgba(169,119,47,.09); }
.btn-sm { padding: 4px 7px; font-size: 0.71rem; border-radius: 6px; }
.btn-icon { width: 30px; height: 30px; padding: 0; }
.icon-btn { border: 0; background: transparent; color: var(--muted); width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; }
.icon-btn:hover { color: var(--brown); background: rgba(169,119,47,.1); }
.icon-btn.danger:hover { color: var(--red); background: var(--red-soft); }

/* ---------------- Inputs ---------------- */
.input, .textarea, .select {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--ink);
  border-radius: 7px;
  padding: 6px 8px;
  font-size: 0.82rem;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.input:hover, .textarea:hover, .select:hover { border-color: var(--line-strong); }
.input:focus, .textarea:focus, .select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(169,119,47,.13); background: var(--panel); }
.input.num { width: 62px; text-align: center; padding-left: 5px; padding-right: 5px; font-variant-numeric: tabular-nums; }
.textarea { resize: vertical; line-height: 1.6; min-height: 70px; }
.select-wrap { position: relative; min-width: 0; }
.select { appearance: none; padding-right: 26px; }
.select-arrow { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field-label { font-size: 0.68rem; color: var(--muted); letter-spacing: .04em; }
.field-hint { font-size: 0.65rem; color: var(--muted); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.form-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width: 640px) { .form-grid, .form-grid.three { grid-template-columns: 1fr; } }

/* ---------------- Hero / identity ---------------- */
.sheet-hero {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}
@media (max-width: 700px) {
  .sheet-hero { grid-template-columns: 76px minmax(0, 1fr); }
  .sheet-hero .hero-side { grid-column: 1 / -1; }
}
.portrait-frame {
  width: 96px; height: 108px; border-radius: 10px;
  border: 2px solid var(--gold);
  background: var(--panel-3);
  overflow: hidden; position: relative;
  box-shadow: inset 0 0 22px rgba(70,45,15,.14), var(--shadow-soft);
}
@media (max-width: 700px) { .portrait-frame { width: 76px; height: 88px; } }
.portrait-frame img { width: 100%; height: 100%; object-fit: cover; filter: sepia(.12) contrast(1.02); }
.portrait-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--line-strong); }
.portrait-edit {
  position: absolute; inset: auto 0 0 0; padding: 3px 0;
  background: rgba(30,20,10,.62); color: #f7edda; font-size: 0.6rem;
  border: 0; opacity: 0; transition: opacity .15s;
}
.portrait-frame:hover .portrait-edit, .portrait-frame:focus-within .portrait-edit { opacity: 1; }
.hero-name { font-size: clamp(1.5rem, 3vw, 2.15rem); font-weight: 700; color: var(--ink); margin: 0; line-height: 1.1; }
.hero-line { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 6px; color: var(--muted); font-size: 0.78rem; align-items: center; }
.hero-line strong { color: var(--brown); font-weight: 600; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.hero-side { display: flex; flex-direction: column; gap: 7px; align-items: flex-end; }
@media (max-width: 700px) { .hero-side { align-items: stretch; } }
.xp-bar { width: 170px; height: 7px; border-radius: 99px; background: var(--panel-3); border: 1px solid var(--line); overflow: hidden; }
.xp-bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-bright)); }
.xp-text { font-size: 0.64rem; color: var(--muted); text-align: right; }
.level-up-pulse { animation: pulseGold 2.2s ease-in-out infinite; }
@keyframes pulseGold { 0%,100% { box-shadow: 0 0 0 0 rgba(201,154,71,0); } 50% { box-shadow: 0 0 0 5px rgba(201,154,71,.15); } }

/* ---------------- Abilities ---------------- */
.abilities-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 760px) { .abilities-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.ability-card {
  text-align: center; border: 1px solid var(--line); border-radius: 10px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  padding: 8px 4px 7px; position: relative;
}
.ability-card .ab-name { font-size: 0.68rem; color: var(--muted); letter-spacing: .08em; }
.ability-card .ab-score { font-family: "Iowan Old Style", "Noto Serif SC", Georgia, serif; font-size: 1.6rem; font-weight: 700; line-height: 1.1; color: var(--ink); margin: 2px 0 1px; }
.ability-card .ab-score input { width: 54px; text-align: center; font: inherit; color: inherit; background: transparent; border: 0; border-bottom: 1px dashed transparent; outline: none; }
.ability-card .ab-score input:focus { border-bottom-color: var(--gold); }
.ability-card .ab-mod { display: inline-flex; min-width: 38px; justify-content: center; padding: 1px 6px; border-radius: 99px; background: var(--panel-3); border: 1px solid var(--line); font-size: 0.72rem; font-weight: 700; color: var(--brown); }
.ability-card .ab-save { margin-top: 5px; font-size: 0.64rem; color: var(--muted); display: flex; align-items: center; justify-content: center; gap: 4px; }
.ability-card .ab-save.on { color: var(--green); }
.ability-save-btn { border: 0; background: transparent; color: inherit; display: inline-flex; align-items: center; gap: 3px; padding: 0; font-size: inherit; }
.save-dot-small { width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--line-strong); }
.save-dot-small.on { background: var(--green); border-color: var(--green); }

.skill-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 14px; margin-top: 12px; }
@media (max-width: 620px) { .skill-grid { grid-template-columns: 1fr; } }
.skill-row { display: flex; align-items: center; gap: 6px; padding: 3px 4px; border-radius: 6px; font-size: 0.76rem; }
.skill-row:hover { background: rgba(169,119,47,.055); }
.skill-row .sk-ability { width: 30px; color: var(--muted); font-size: 0.62rem; text-transform: uppercase; }
.skill-row .sk-name { flex: 1; min-width: 0; color: var(--ink-soft); }
.skill-row .sk-bonus { font-weight: 700; color: var(--brown); font-variant-numeric: tabular-nums; min-width: 26px; text-align: right; }
.skill-row .prof-btn { width: 17px; height: 17px; border-radius: 50%; border: 1px solid var(--line-strong); background: transparent; display: grid; place-items: center; font-size: 0.55rem; color: transparent; }
.skill-row .prof-btn.prof { background: var(--green); border-color: var(--green); color: #fff; }
.skill-row .prof-btn.exp { background: var(--gold); border-color: var(--gold); color: #231a0e; }
.passive-row { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; padding-top: 9px; border-top: 1px dashed var(--line); font-size: 0.72rem; color: var(--muted); }
.passive-row strong { color: var(--brown); }
.prof-section { margin-top: 10px; }
.prof-section h4 { font-size: 0.68rem; color: var(--muted); margin: 0 0 4px; letter-spacing: .06em; text-transform: uppercase; }

/* ---------------- Stats / combat ---------------- */
.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 620px) { .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.stat {
  border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2);
  padding: 7px 8px; display: flex; flex-direction: column; gap: 1px; min-width: 0;
}
.stat-label { font-size: 0.63rem; color: var(--muted); letter-spacing: .04em; }
.stat-value { font-size: 1.05rem; font-weight: 700; color: var(--ink); line-height: 1.2; }
.stat-hint { font-size: 0.6rem; color: var(--muted); line-height: 1.3; }
.hp-panel { display: grid; grid-template-columns: 1.2fr 1fr; gap: 10px; }
@media (max-width: 560px) { .hp-panel { grid-template-columns: 1fr; } }
.hp-big { display: flex; align-items: baseline; gap: 7px; }
.hp-big .cur { font-size: 2rem; font-weight: 800; color: var(--red); line-height: 1; font-variant-numeric: tabular-nums; }
.hp-big .sep { color: var(--line-strong); }
.hp-big .max { font-size: 1.1rem; color: var(--muted); }
.hp-track { height: 8px; border-radius: 99px; background: var(--panel-3); border: 1px solid var(--line); overflow: hidden; margin-top: 5px; }
.hp-track > span { display: block; height: 100%; background: linear-gradient(90deg, #9d3b36, #c56858); transition: width .2s; }
.hp-controls { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
.hp-controls .input { width: 58px; }
.death-saves { display: flex; gap: 12px; flex-wrap: wrap; }
.death-group { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: var(--muted); }
.death-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid var(--line-strong); background: transparent; padding: 0; }
.death-dot.success.on { background: var(--green); border-color: var(--green); }
.death-dot.failure.on { background: var(--red); border-color: var(--red); }
.condition-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.condition-chip {
  display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid var(--line-strong); border-radius: 99px; padding: 2px 7px 2px 8px;
  font-size: 0.67rem; color: var(--ink-soft); background: var(--panel-2);
}
.condition-chip button { border: 0; background: transparent; color: inherit; padding: 0; display: grid; place-items: center; opacity: .65; }
.condition-chip button:hover { opacity: 1; color: var(--red); }
.condition-chip.exhaustion { border-color: var(--red); color: var(--red); }
.concentration-bar { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; border: 1px dashed var(--gold); background: rgba(169,119,47,.07); border-radius: 8px; padding: 5px 8px; color: var(--brown); }

/* ---------------- Tables ---------------- */
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 9px; }
table.sheet-table { width: 100%; border-collapse: collapse; font-size: 0.76rem; min-width: 560px; }
.sheet-table th { text-align: left; font-size: 0.63rem; color: var(--muted); font-weight: 600; letter-spacing: .04em; padding: 6px 7px; background: var(--panel-2); border-bottom: 1px solid var(--line); white-space: nowrap; }
.sheet-table td { padding: 5px 7px; border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent); vertical-align: middle; }
.sheet-table tr:last-child td { border-bottom: 0; }
.sheet-table tr:hover td { background: rgba(169,119,47,.04); }
.sheet-table .cell-name { font-weight: 600; color: var(--ink); }
.sheet-table .num-cell { text-align: center; font-variant-numeric: tabular-nums; }
.sheet-table .actions-cell { text-align: right; white-space: nowrap; }
.sheet-table .sub { font-size: 0.64rem; color: var(--muted); }

/* ---------------- Pips / resources ---------------- */
.pips { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.pip { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--line-strong); background: transparent; padding: 0; transition: background .12s, border-color .12s; }
.pip:hover { border-color: var(--gold); }
.pip.used { background: var(--gold); border-color: var(--gold); }
.pips-hp .pip.used { background: var(--red); border-color: var(--red); }
.pips-slot .pip.used { background: var(--blue); border-color: var(--blue); }
.pips-resource .pip.used { background: var(--green); border-color: var(--green); }
.pips-infinite { color: var(--green); font-weight: 800; font-size: 1rem; }
.pips-empty { color: var(--muted); }
.stepper { display: inline-flex; align-items: center; border: 1px solid var(--line); border-radius: 7px; background: var(--panel-2); overflow: hidden; }
.stepper button { border: 0; background: transparent; color: var(--muted); width: 22px; height: 24px; display: grid; place-items: center; }
.stepper button:hover:not(:disabled) { background: rgba(169,119,47,.1); color: var(--brown); }
.stepper span { min-width: 24px; text-align: center; font-size: 0.72rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.resource-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px dashed color-mix(in srgb, var(--line) 60%, transparent); }
.resource-row:last-child { border-bottom: 0; }
.resource-row .r-name { font-weight: 600; font-size: 0.78rem; color: var(--ink); }
.resource-row .r-meta { font-size: 0.62rem; color: var(--muted); }
.resource-row .r-pips { margin-left: auto; display: flex; align-items: center; gap: 6px; }

/* ---------------- Spells ---------------- */
.spell-level-block { margin-top: 10px; }
.spell-level-head { display: flex; align-items: center; gap: 8px; padding: 4px 2px; border-bottom: 1px solid var(--line); }
.spell-level-head h4 { margin: 0; font-size: 0.78rem; color: var(--brown); }
.spell-level-head .slots { margin-left: auto; display: flex; align-items: center; gap: 5px; font-size: 0.65rem; color: var(--muted); }
.spell-row { display: flex; align-items: flex-start; gap: 7px; padding: 5px 4px; border-bottom: 1px dashed color-mix(in srgb, var(--line) 55%, transparent); }
.spell-row:last-child { border-bottom: 0; }
.spell-row .s-main { flex: 1; min-width: 0; }
.spell-row .s-name { font-size: 0.78rem; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.spell-row .s-meta { font-size: 0.62rem; color: var(--muted); margin-top: 1px; }
.spell-row .s-note { font-size: 0.68rem; color: var(--ink-soft); margin-top: 2px; line-height: 1.45; white-space: pre-wrap; }
.spell-row .s-actions { display: flex; align-items: center; gap: 2px; }
.prep-toggle { border: 1px solid var(--line-strong); background: transparent; color: var(--muted); border-radius: 99px; font-size: 0.58rem; padding: 1px 6px; }
.prep-toggle.on { background: var(--green-soft); border-color: var(--green); color: var(--green); }
.spell-cast-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 10px; font-size: 0.68rem; color: var(--ink-soft); margin-top: 6px; }
.spell-cast-meta span { color: var(--muted); }
.spell-detail { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--line); font-size: 0.73rem; line-height: 1.6; white-space: pre-wrap; color: var(--ink-soft); }
.spell-detail .hl { color: var(--brown); font-weight: 600; }

/* ---------------- Inventory / features ---------------- */
.coin-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.coin { display: flex; align-items: center; gap: 3px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel-2); padding: 2px 5px; }
.coin span { font-size: 0.6rem; color: var(--muted); }
.coin input { width: 48px; border: 0; background: transparent; text-align: center; font-size: 0.75rem; color: var(--ink); outline: none; }
.feature-card { border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); padding: 8px 10px; margin-bottom: 7px; }
.feature-card:last-child { margin-bottom: 0; }
.feature-card .f-head { display: flex; align-items: flex-start; gap: 7px; }
.feature-card .f-name { font-weight: 700; font-size: 0.8rem; color: var(--ink); }
.feature-card .f-source { font-size: 0.6rem; color: var(--muted); }
.feature-card .f-desc { font-size: 0.7rem; color: var(--ink-soft); line-height: 1.55; margin-top: 4px; white-space: pre-wrap; max-height: 220px; overflow: auto; }
.feature-card .f-uses { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
.attune-warning { font-size: 0.65rem; color: var(--red); }

/* ---------------- Tags ---------------- */
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.tag { display: inline-flex; align-items: center; gap: 3px; border: 1px solid var(--line); background: var(--panel-2); color: var(--ink-soft); border-radius: 99px; padding: 1px 5px 1px 8px; font-size: 0.65rem; }
.tag button { border: 0; background: transparent; padding: 0; color: var(--muted); display: grid; place-items: center; }
.tag button:hover { color: var(--red); }
.tag-input { border: 1px dashed var(--line); background: transparent; border-radius: 99px; padding: 1px 7px; font-size: 0.65rem; color: var(--ink); outline: none; min-width: 74px; }
.tag-input:focus { border-color: var(--gold); }

/* ---------------- Badges ---------------- */
.badge { display: inline-flex; align-items: center; gap: 3px; border-radius: 99px; padding: 1px 7px; font-size: 0.6rem; font-weight: 600; letter-spacing: .02em; border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); white-space: nowrap; }
.badge-gold { color: var(--gold); border-color: rgba(169,119,47,.4); background: rgba(169,119,47,.09); }
.badge-green { color: var(--green); border-color: rgba(47,93,80,.35); background: var(--green-soft); }
.badge-red { color: var(--red); border-color: rgba(140,47,47,.35); background: var(--red-soft); }
.badge-blue { color: var(--blue); border-color: rgba(53,91,120,.35); background: var(--blue-soft); }

/* ---------------- Modal ---------------- */
dialog.modal {
  border: 0; padding: 0; background: transparent;
  width: min(94vw, 760px); max-width: none;
  color: var(--ink);
}
dialog.modal.modal-wide { width: min(96vw, 1080px); }
dialog.modal.modal-huge { width: min(97vw, 1240px); }
dialog.modal::backdrop { background: rgba(28, 20, 11, 0.58); backdrop-filter: blur(3px); }
.modal-inner {
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  box-shadow: 0 30px 80px rgba(30, 20, 8, 0.35);
  max-height: 88vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 18px 12px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, var(--panel-2), var(--panel)); }
.modal-head h2 { margin: 0; font-size: 1.15rem; color: var(--brown); }
.modal-head p { margin: 3px 0 0; font-size: 0.7rem; color: var(--muted); }
.modal-content { overflow: auto; padding: 14px 18px 18px; }
.modal-foot { padding: 10px 18px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 7px; background: var(--panel-2); }

/* ---------------- Rulebook / search ---------------- */
.search-shell { display: flex; flex-direction: column; gap: 10px; }
.search-bar { display: flex; gap: 7px; align-items: center; }
.search-input-wrap { position: relative; flex: 1; }
.search-input-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); }
.search-input-wrap .input { padding-left: 32px; height: 38px; font-size: 0.9rem; }
.type-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.type-tab { border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); border-radius: 99px; padding: 3px 9px; font-size: 0.7rem; }
.type-tab:hover { color: var(--brown); border-color: var(--line-strong); }
.type-tab.active { background: var(--brown); border-color: var(--brown); color: #f7f0e1; }
.type-tab .count { opacity: .65; margin-left: 3px; font-size: 0.6rem; }
.filter-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.filter-row .select-wrap { min-width: 92px; }
.filter-row .select { font-size: 0.7rem; padding: 4px 24px 4px 7px; }
.search-layout { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr); gap: 12px; min-height: 340px; }
@media (max-width: 780px) { .search-layout { grid-template-columns: 1fr; } }
.result-list { border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); overflow: auto; max-height: 58vh; }
.result-item { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent); background: transparent; padding: 8px 10px; color: var(--ink); }
.result-item:last-child { border-bottom: 0; }
.result-item:hover { background: rgba(169,119,47,.06); }
.result-item.active { background: rgba(169,119,47,.12); box-shadow: inset 3px 0 0 var(--gold); }
.result-item .r-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.8rem; }
.result-item .r-sub { font-size: 0.63rem; color: var(--muted); margin-top: 1px; }
.result-item .r-snippet { font-size: 0.68rem; color: var(--ink-soft); margin-top: 3px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.result-item .r-page { font-size: 0.58rem; color: var(--muted); margin-top: 2px; }
.detail-pane { border: 1px solid var(--line); border-radius: 10px; background: var(--panel); padding: 12px 14px; min-height: 280px; max-height: 58vh; overflow: auto; }
.detail-pane h3 { margin: 0; font-size: 1.15rem; color: var(--brown); display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.detail-sub { font-size: 0.7rem; color: var(--muted); margin-top: 2px; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.detail-body { margin-top: 10px; font-size: 0.8rem; line-height: 1.75; color: var(--ink-soft); white-space: pre-wrap; }
.detail-cite { margin-top: 12px; padding-top: 8px; border-top: 1px dashed var(--line); font-size: 0.64rem; color: var(--muted); display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.insert-bar { position: sticky; bottom: 0; padding-top: 10px; background: linear-gradient(180deg, transparent, var(--panel) 30%); display: flex; justify-content: flex-end; gap: 7px; }
.rulebook-page .search-layout { min-height: 520px; }
.rulebook-page .result-list, .rulebook-page .detail-pane { max-height: 66vh; }
.facet-note { font-size: 0.65rem; color: var(--muted); }
.kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 4px; border: 1px solid var(--line-strong); border-bottom-width: 2px; border-radius: 4px; font-size: 0.6rem; color: var(--muted); background: var(--panel-2); }

/* ---------------- Quick rules ---------------- */
.quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.quick-card { border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 12px 14px; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; }
.quick-card h3 { margin: 0 0 6px; font-size: 0.95rem; color: var(--brown); }
.quick-card ul { margin: 0; padding-left: 1.05rem; font-size: 0.75rem; line-height: 1.65; color: var(--ink-soft); }
.quick-card li { margin-bottom: 3px; }
.quick-card .q-foot { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.quick-cat-nav { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }

/* ---------------- Audit ---------------- */
.audit-panel { border: 1px solid var(--line-strong); background: linear-gradient(135deg, rgba(169,119,47,.08), transparent 60%), var(--panel); }
.audit-row { display: flex; gap: 9px; padding: 8px 0; border-bottom: 1px dashed var(--line); }
.audit-row:last-child { border-bottom: 0; }
.audit-title { font-size: 0.78rem; font-weight: 700; color: var(--ink); }
.audit-detail { font-size: 0.7rem; color: var(--ink-soft); line-height: 1.55; margin-top: 2px; }
.audit-actions { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
.audit-fixed { opacity: .72; }

/* ---------------- Toast ---------------- */
.toast-stack { position: fixed; right: 16px; bottom: 16px; z-index: 100; display: flex; flex-direction: column; gap: 7px; max-width: min(92vw, 380px); }
.toast { display: flex; align-items: flex-start; gap: 8px; background: var(--panel); color: var(--ink); border: 1px solid var(--line-strong); border-left: 4px solid var(--gold); border-radius: 9px; padding: 9px 10px; box-shadow: 0 12px 30px rgba(30,20,8,.22); font-size: 0.76rem; line-height: 1.45; animation: toastIn .18s ease-out; }
.toast button { border: 0; background: transparent; color: var(--muted); padding: 0; margin-left: auto; }
.toast-success { border-left-color: var(--green); }
.toast-warn { border-left-color: var(--gold); }
.toast-error { border-left-color: var(--red); }
@keyframes toastIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ---------------- Empty / misc ---------------- */
.empty { border: 1px dashed var(--line-strong); border-radius: 9px; padding: 16px; text-align: center; color: var(--muted); font-size: 0.75rem; }
.divider { display: flex; align-items: center; gap: 8px; margin: 10px 0; color: var(--muted); font-size: 0.62rem; text-transform: uppercase; letter-spacing: .08em; }
.divider::before, .divider::after { content: ""; height: 1px; flex: 1; background: var(--line); }
.hint { font-size: 0.66rem; color: var(--muted); line-height: 1.5; }
.warn-text { color: var(--red); }
.green-text { color: var(--green); }
.gold-text { color: var(--gold); }
.mono { font-variant-numeric: tabular-nums; }
.flex-wrap { flex-wrap: wrap; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* ---------------- Mobile nav ---------------- */
.mobile-nav { display: none; }
@media (max-width: 760px) {
  .topbar { gap: 7px; padding: 8px 12px; }
  .brand { font-size: 0.92rem; }
  .brand-mark { width: 26px; height: 26px; }
  .nav-tabs { order: 5; width: 100%; justify-content: center; }
  .nav-tab { flex: 1; text-align: center; }
  .topbar-spacer { display: none; }
  .top-actions { margin-left: auto; }
  .page-wrap { padding-top: 12px; }
  .mobile-nav {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 45;
    background: color-mix(in srgb, var(--panel) 94%, transparent);
    border-top: 1px solid var(--line); backdrop-filter: blur(12px);
    padding: 5px 6px calc(5px + env(safe-area-inset-bottom));
  }
  .mobile-nav button { flex: 1; border: 0; background: transparent; color: var(--muted); font-size: 0.6rem; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 2px; border-radius: 7px; }
  .mobile-nav button.active { color: var(--brown); background: rgba(169,119,47,.09); }
  .app-shell { padding-bottom: 80px; }
  .panel-head { padding: 10px 12px 9px; }
  .panel-body { padding: 11px 12px 13px; }
  .modal-content { padding: 12px; }
  .modal-head { padding: 12px 14px 10px; }
  .modal-foot { padding: 9px 14px; }
  .toast-stack { right: 10px; left: 10px; bottom: 74px; max-width: none; }
  .search-layout { min-height: 0; }
  .result-list { max-height: 38vh; }
  .detail-pane { max-height: 44vh; }
}


/* ---------------- Sheet hero additions ---------------- */
.hero-name-input {
  width: 100%;
  border: 0;
  border-bottom: 1px dashed transparent;
  background: transparent;
  color: var(--ink);
  font-family: "Iowan Old Style", "Palatino Linotype", "Noto Serif SC", Georgia, serif;
  font-size: clamp(1.5rem, 3vw, 2.15rem);
  font-weight: 700;
  line-height: 1.15;
  padding: 0 0 2px;
  outline: none;
}
.hero-name-input:hover { border-bottom-color: var(--line); }
.hero-name-input:focus { border-bottom-color: var(--gold); }
.hero-inline { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
.hero-inline > span { font-size: 0.62rem; color: var(--muted); white-space: nowrap; }
.hero-inline .input { width: 96px; padding: 2px 5px; font-size: 0.72rem; background: transparent; border-color: transparent; }
.hero-inline .input:hover, .hero-inline .input:focus { background: var(--panel-2); border-color: var(--line); }
.hero-inline .select-wrap { width: 108px; }
.hero-inline .select { padding: 3px 22px 3px 5px; font-size: 0.72rem; background: transparent; border-color: transparent; }
.hero-inline .select:hover, .hero-inline .select:focus { background: var(--panel-2); border-color: var(--line); }
.class-list { margin-top: 9px; display: flex; flex-direction: column; gap: 5px; }
.class-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; padding: 4px 6px; }
.class-row .select-wrap { width: 102px; }
.class-row .select { padding: 3px 22px 3px 6px; font-size: 0.72rem; }
.subclass-input { width: 122px; padding: 4px 6px; font-size: 0.72rem; }
.class-level { display: flex; align-items: center; gap: 4px; font-size: 0.62rem; color: var(--muted); }
.class-level .num { width: 44px; padding: 2px; font-size: 0.72rem; }
.class-row .badge { font-size: 0.58rem; }
.add-class { align-self: flex-start; border: 1px dashed var(--line-strong); background: transparent; color: var(--muted); border-radius: 7px; padding: 3px 8px; font-size: 0.65rem; display: inline-flex; align-items: center; gap: 3px; }
.add-class:hover { color: var(--brown); border-color: var(--gold); }
.hero-badges { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.xp-line { display: flex; justify-content: space-between; gap: 10px; width: 180px; font-size: 0.64rem; color: var(--muted); }
.xp-input { display: flex; align-items: center; gap: 4px; font-size: 0.64rem; color: var(--muted); }
.xp-input .num { width: 64px; padding: 3px; }
@media (max-width: 700px) { .hero-badges { justify-content: flex-start; } .xp-line { width: 100%; } }
.sheet-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 0 2px; }

/* ---------------- Combat additions ---------------- */
.hp-current-input {
  width: 82px; border: 0; border-bottom: 1px dashed var(--line);
  background: transparent; color: var(--red);
  font-size: 2rem; font-weight: 800; line-height: 1;
  font-variant-numeric: tabular-nums; outline: none; padding: 0;
}
.hp-current-input:focus { border-bottom-color: var(--red); }
.hp-max-input {
  width: 52px; border: 0; border-bottom: 1px dashed var(--line);
  background: transparent; color: var(--muted); font-size: 1.1rem;
  outline: none; padding: 0 0 2px; font-variant-numeric: tabular-nums;
}
.hp-max-input:focus { border-bottom-color: var(--gold); }
.hp-temp-label { font-size: 0.62rem; color: var(--muted); margin-left: 3px; }
.hp-temp { width: 44px !important; }
.combat-settings { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 11px; padding-top: 10px; border-top: 1px dashed var(--line); }
.inline-setting { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; }
.combat-subsection { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }
.condition-add { display: inline-flex; align-items: center; gap: 3px; }
.condition-add .select-wrap { width: 98px; }
.condition-add .select { font-size: 0.67rem; padding: 3px 20px 3px 6px; }
.resource-name-input { font-weight: 700; padding: 2px 4px; background: transparent; border-color: transparent; }
.resource-name-input:hover, .resource-name-input:focus { background: var(--panel-2); border-color: var(--line); }

/* ---------------- Spells additions ---------------- */
.spell-head-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-bottom: 10px; }
@media (max-width: 720px) { .spell-head-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.spell-head-stats .stat .select { font-size: 0.72rem; padding: 3px 22px 3px 6px; }
.slot-box { border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); padding: 7px 9px; margin-bottom: 10px; }
.slot-box-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-bottom: 1px dashed var(--line); padding-bottom: 5px; margin-bottom: 5px; }
.slot-box-head .btn { margin-left: auto; }
.slot-list { display: flex; flex-wrap: wrap; gap: 4px 14px; }
.slot-row { display: flex; align-items: center; gap: 6px; }
.slot-label { font-size: 0.68rem; color: var(--brown); min-width: 48px; }
.slot-count { font-size: 0.63rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.slot-row .num { width: 42px; padding: 2px; font-size: 0.7rem; }
.slot-row.pact { border-left: 2px solid var(--blue); padding-left: 6px; }
.spell-name-btn { border: 0; background: transparent; color: var(--ink); padding: 0; font: inherit; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; text-align: left; }
.spell-name-btn:hover { color: var(--brown); text-decoration: underline; text-decoration-style: dotted; }
.spell-editor { margin-top: 7px; padding-top: 7px; border-top: 1px dashed var(--line); }
.spell-cast-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 12px; font-size: 0.68rem; color: var(--ink-soft); }
.spell-cast-meta > div { display: flex; align-items: center; gap: 3px; min-width: 0; }
.spell-cast-meta > div > span { color: var(--muted); white-space: nowrap; }
.spell-cast-meta .input { padding: 3px 5px; font-size: 0.68rem; }
.spell-detail-controls { display: flex; flex-wrap: wrap; gap: 7px 12px; align-items: flex-end; margin: 8px 0; }
.spell-detail-controls > label { display: flex; flex-direction: column; gap: 2px; font-size: 0.63rem; color: var(--muted); }
.spell-detail-controls .select-wrap { width: 88px; }
.spell-detail-controls .input { width: 90px; padding: 3px 5px; font-size: 0.7rem; }
.spell-detail-controls > label.inline-setting { flex-direction: row; align-items: center; color: var(--ink-soft); }
.spell-editor-actions { display: flex; justify-content: flex-end; margin-top: 5px; }
.spell-editor .textarea { margin-top: 6px; font-size: 0.72rem; }

/* ---------------- Inventory additions ---------------- */
.inventory-summary { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 7px; }
.coin-section { margin-top: 10px; padding-top: 9px; border-top: 1px dashed var(--line); }
.coin-section h4 { margin: 0 0 5px; font-size: 0.68rem; color: var(--muted); letter-spacing: .05em; }
.inventory-table .input { padding: 3px 5px; font-size: 0.73rem; }
.inventory-table .num { width: 50px; }

/* ---------------- Features additions ---------------- */
.feature-group { margin-bottom: 11px; }
.feature-group:last-child { margin-bottom: 0; }
.feature-group-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.feature-group-head h3 { margin: 0; font-size: 0.7rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.feature-card { padding: 0; overflow: hidden; }
.feature-card summary { display: flex; align-items: center; gap: 6px; padding: 7px 9px; cursor: pointer; list-style: none; }
.feature-card summary::-webkit-details-marker { display: none; }
.feature-card summary:hover { background: rgba(169,119,47,.05); }
.feature-card[open] { border-color: var(--line-strong); }
.feature-card[open] summary { border-bottom: 1px dashed var(--line); }
.feature-card .f-head { align-items: center; }
.feature-card .f-head .min-w-0 { flex: 1; }
.feature-lookup { border: 0; background: transparent; color: var(--muted); width: 23px; height: 23px; border-radius: 5px; display: grid; place-items: center; }
.feature-lookup:hover { color: var(--brown); background: rgba(169,119,47,.1); }
.feature-edit { padding: 8px 9px 10px; }
.feature-desc-edit { margin: 8px 0; }
.feature-uses-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; border-top: 1px dashed var(--line); padding-top: 7px; }
.feature-uses-row .num { width: 44px; }
.feature-uses-row .select-wrap { width: 82px; }
.feature-uses-row .select { font-size: 0.68rem; padding: 3px 20px 3px 6px; }

/* ---------------- Roleplay ---------------- */
.roleplay-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 620px) { .roleplay-grid { grid-template-columns: 1fr; } }
.roleplay-field { display: flex; flex-direction: column; gap: 4px; }
.roleplay-field.span-2 { grid-column: 1 / -1; }
.rp-label { font-size: 0.67rem; color: var(--muted); display: flex; align-items: center; gap: 3px; letter-spacing: .03em; }
.roleplay-field .textarea { min-height: 64px; font-size: 0.76rem; }

/* ---------------- Audit ---------------- */
.audit-done { margin-top: 4px; }
.audit-done summary { cursor: pointer; color: var(--muted); font-size: 0.7rem; display: flex; align-items: center; gap: 4px; padding: 4px 0; list-style: none; }
.audit-done summary::-webkit-details-marker { display: none; }

/* ---------------- Search extras ---------------- */
.search-clear { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: var(--muted); padding: 2px; }
.search-clear:hover { color: var(--red); }
.quick-toolbar { margin-bottom: 9px; }
.search-input-wrap .input { padding-left: 32px; }

/* ---------------- Settings ---------------- */
.settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 700px) { .settings-grid { grid-template-columns: 1fr; } }
.settings-section { border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); padding: 11px 12px; }
.settings-section h3 { margin: 0 0 7px; font-size: 0.82rem; color: var(--brown); display: flex; align-items: center; gap: 5px; }
.settings-facts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
.settings-actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.settings-warnings { margin-top: 7px; font-size: 0.68rem; color: var(--muted); }
.settings-warnings summary { cursor: pointer; }
.settings-warnings ul { margin: 4px 0 0; padding-left: 1.1rem; line-height: 1.5; }
.backup-list { margin-top: 8px; }
.backup-row { display: flex; align-items: center; justify-content: space-between; gap: 7px; padding: 4px 0; border-bottom: 1px dashed color-mix(in srgb, var(--line) 60%, transparent); font-size: 0.68rem; }
.backup-row:last-child { border-bottom: 0; }
.theme-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.theme-choice { border: 1px solid var(--line); background: var(--panel); border-radius: 8px; padding: 10px; color: var(--muted); font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px; }
.theme-choice:hover { border-color: var(--line-strong); color: var(--brown); }
.theme-choice.active { border-color: var(--gold); color: var(--gold); background: rgba(169,119,47,.08); }
.settings-tips { margin: 0; padding-left: 1.1rem; font-size: 0.7rem; line-height: 1.6; color: var(--muted); }

/* ---------------- Level up ---------------- */
.levelup-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr); gap: 14px; }
@media (max-width: 780px) { .levelup-grid { grid-template-columns: 1fr; } }
.levelup-block { border-top: 1px dashed var(--line); padding-top: 9px; margin-top: 9px; }
.levelup-block:first-child { border-top: 0; margin-top: 0; padding-top: 0; }
.levelup-block h3 { margin: 0 0 6px; font-size: 0.82rem; color: var(--brown); }
.levelup-class-name { font-family: "Iowan Old Style", "Noto Serif SC", Georgia, serif; font-size: 1.15rem; font-weight: 700; color: var(--ink); }
.levelup-class-name span { font-size: 0.7rem; color: var(--muted); font-family: system-ui, sans-serif; }
.levelup-hp { display: flex; flex-direction: column; gap: 5px; }
.radio-line { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--ink-soft); cursor: pointer; flex-wrap: wrap; }
.radio-line input[type="radio"] { accent-color: var(--gold); }
.asi-options { display: flex; flex-direction: column; gap: 6px; }
.asi-options .select-wrap { max-width: 260px; }
.feat-picker { border: 1px solid var(--line); border-radius: 8px; padding: 7px; background: var(--panel-2); }
.feat-selected { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 5px; }
.link-btn { border: 0; background: transparent; color: var(--muted); font-size: 0.68rem; text-decoration: underline; }
.feat-results { max-height: 150px; overflow: auto; margin-top: 5px; display: flex; flex-direction: column; gap: 2px; }
.feat-result { text-align: left; border: 0; background: transparent; border-radius: 6px; padding: 5px 6px; display: flex; flex-direction: column; gap: 1px; font-size: 0.72rem; color: var(--ink); }
.feat-result:hover { background: rgba(169,119,47,.09); }
.feat-result span { font-size: 0.62rem; color: var(--muted); }
.levelup-preview { border: 1px solid var(--line-strong); border-radius: 10px; background: linear-gradient(160deg, rgba(169,119,47,.07), transparent 55%), var(--panel-2); padding: 11px 12px; }
.levelup-preview h3 { margin: 0 0 8px; font-size: 0.9rem; color: var(--brown); display: flex; align-items: center; gap: 5px; }
.preview-row { display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px dashed color-mix(in srgb, var(--line) 60%, transparent); font-size: 0.72rem; color: var(--muted); }
.preview-row strong { color: var(--ink); }
.preview-block { margin-top: 9px; font-size: 0.7rem; color: var(--muted); }
.preview-block > span { display: block; margin-bottom: 4px; }
.slot-diff { display: flex; flex-wrap: wrap; gap: 3px; }
.preview-features { margin: 0; padding-left: 1.05rem; color: var(--ink-soft); line-height: 1.55; }
.preview-note { margin-top: 10px; padding-top: 7px; border-top: 1px dashed var(--line); font-size: 0.65rem; color: var(--muted); line-height: 1.5; }

/* ---------------- Rest ---------------- */
.rest-body { display: flex; flex-direction: column; gap: 10px; }
.rest-summary { display: flex; flex-wrap: wrap; gap: 5px; }
.rest-block { border: 1px solid var(--line); border-radius: 9px; background: var(--panel-2); padding: 9px 10px; }
.rest-block h3 { margin: 0 0 5px; font-size: 0.8rem; color: var(--brown); }
.rest-list { margin: 0; padding-left: 1.1rem; font-size: 0.74rem; line-height: 1.6; color: var(--ink-soft); }

/* ---------------- New character ---------------- */
.new-char-form { display: flex; flex-direction: column; gap: 10px; }

/* ---------------- Prof buttons fix ---------------- */
.prof-btn { color: var(--muted); font-size: 0.52rem; line-height: 1; }
.prof-btn.prof { color: #fff; }
.prof-btn.exp { color: #231a0e; }

/* ---------------- Anchor offset for sticky topbar ---------------- */
.panel[id] { scroll-margin-top: 150px; }
@media (min-width: 761px) { .panel[id] { scroll-margin-top: 90px; } }
```
