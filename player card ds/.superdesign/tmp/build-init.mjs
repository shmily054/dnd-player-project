import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const initDir = path.join(root, '.superdesign', 'init')
fs.mkdirSync(initDir, { recursive: true })

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const fence = (lang, code) => '```' + lang + '\n' + code.trimEnd() + '\n```'

function write(name, body) {
  fs.writeFileSync(path.join(initDir, name), body.trimEnd() + '\n', 'utf8')
  console.log(`wrote .superdesign/init/${name}`)
}

const ui = read('src/components/ui.tsx')
const app = read('src/App.tsx')
const characterPage = read('src/pages/CharacterPage.tsx')
const rulebookPage = read('src/pages/RulebookPage.tsx')
const quickRulesPage = read('src/pages/QuickRulesPage.tsx')
const router = read('src/lib/router.ts')
const styles = read('src/styles.css')
const tailwind = read('tailwind.config.js')
const types = read('src/types.ts')
const calc = read('src/lib/calc.ts')

write('components.md', `# UI Components — D&D 角色卡

Project: local React 19 + TypeScript + Vite 7 + Tailwind 3.4 app, Simplified Chinese UI, D&D 5E (2014) character sheet + rules library.
Shared UI is hand-written CSS classes in \`src/styles.css\`; Tailwind is only used for a few utilities. Icons are \`lucide-react\`.

## Shared UI primitives

Source: \`src/components/ui.tsx\`
Exports: ToastProvider/useToast, Panel, Btn, NumberField, TextInput, TextArea, Select, Field, Stepper, Pips, Toggle, Badge, Modal, Empty, Divider, Stat, TagList.

${fence('tsx', ui)}

## Character-sheet panels (page-specific, listed for discovery)

| Component | Source | Rendered section |
|---|---|---|
| SheetHero (IdentityPanel) | \`src/components/SheetHero.tsx\` | Portrait, name, player/race/background/alignment, multiclass rows, level/PB/AC/initiative badges, XP bar, level-up CTA |
| AbilitiesPanel | \`src/components/AbilitiesPanel.tsx\` | Six ability cards, 18 skills with proficiency/expertise toggles, passives, armor/weapon/tool/language tags |
| CombatPanel | \`src/components/CombatPanel.tsx\` | HP current/max/temp, damage/heal, death saves, AC/initiative/speed/hit-dice tiles, exhaustion, concentration, conditions |
| AttackPanel | \`src/components/AttackPanel.tsx\` | Editable 9-column attack table, weapon search, custom attack |
| SpellsPanel | \`src/components/SpellsPanel.tsx\` | Spell DC/attack/ability/prepared tiles, spell-slot pips, grouped spell rows, inline spell editor |
| ResourcesPanel | \`src/components/ResourcesPanel.tsx\` | Class resource rows with pips, totals, reset cadence |
| InventoryPanel | \`src/components/InventoryPanel.tsx\` | Weight/attunement/wealth badges, 7-column item table, coin capsules |
| FeaturesPanel | \`src/components/FeaturesPanel.tsx\` | Features grouped by source, \`<details>\` cards, uses pips, rulebook lookup |
| RoleplayPanel | \`src/components/RoleplayPanel.tsx\` | Two-column textarea grid for personality/ideals/bonds/flaws/appearance/backstory/allies/notes |
| AuditPanel | \`src/components/AuditPanel.tsx\` | Import-audit warning card, open issues, collapsed processed list |

Composition: \`src/pages/CharacterPage.tsx\` (in \`pages.md\`).
`)

write('layouts.md', `# Layouts — App shell, top bar, mobile navigation

Framework: React 19 (no router library; hash routing in \`src/lib/router.ts\`). Global stylesheet: \`src/styles.css\`.

## App shell — \`src/App.tsx\`

The whole shell lives in this file: sticky top bar, hash-route switch, character state machine, 800 ms autosave, theme, global shortcuts, dialogs, mobile bottom nav, boot screen.

Key render structure:
- \`header.topbar\`: brand mark "D", three route tabs (角色卡 / 规则库 / 速查), character switch select + new/copy/delete mini buttons, save pill, 检索 (green primary), 短休, 长休, 升级, settings icon.
- \`.page-wrap\`: renders \`CharacterPage\` / \`RulebookPage\` / \`QuickRulesPage\`.
- \`nav.mobile-nav\`: six fixed bottom buttons (角色 / 法术 / 物品 / 特性 / 规则 / 速查) at ≤760 px.
- Five native \`<dialog class="modal">\` instances: search, level-up, rest, settings, new character.
- \`.toast-stack\`.

${fence('tsx', app)}

## Page composition — \`src/pages/CharacterPage.tsx\`

${fence('tsx', characterPage)}

## Styles for layout

The top bar, page grid, panels, mobile nav, breakpoints, and theme tokens are all in \`src/styles.css\` (see \`theme.md\` for the full file).
`)

write('routes.md', `# Routes — hash router

Router source: \`src/lib/router.ts\` (full file below). No React Router.

| URL | Page component | Layout | Notes |
|---|---|---|---|
| \`#/char/:id\` | \`src/pages/CharacterPage.tsx\` | \`App.tsx\` shell | Main character sheet; id is selected from the hash |
| \`#/rules\` | \`src/pages/RulebookPage.tsx\` | \`App.tsx\` shell | Rules library with \`CompendiumExplorer\` in page mode |
| \`#/quick\` | \`src/pages/QuickRulesPage.tsx\` | \`App.tsx\` shell | 33 quick-reference cards from \`shared/quick-rules.json\` |

Section anchors inside the character sheet (used by mobile nav and CSS scroll offset):
\`abilities\`, \`combat\`, \`attacks\`, \`spells\`, \`resources\`, \`inventory\`, \`features\`, \`roleplay\`.

${fence('ts', router)}

## Rulebook page

${fence('tsx', rulebookPage)}

## Quick rules page

${fence('tsx', quickRulesPage)}
`)

write('theme.md', `# Theme — tokens, typography, and raw styles

## Part 1 — Compact token summary

### Framework / CSS approach
- React 19 + TypeScript + Vite 7.
- Tailwind 3.4 is installed and its directives are in \`src/styles.css\`, but ~95% of the visual language is hand-written component CSS.
- One global stylesheet: \`src/styles.css\` (775 lines). No CSS modules, no CSS-in-JS.
- Dark mode: class \`.dark\` on \`<html>\`; persisted in \`localStorage['dnd-theme']\` (\`light\` default, \`dark\` = "墨夜").

### Color tokens — light (:root)
| Token | Value | Role |
|---|---|---|
| \`--bg\` | \`#efe4cc\` | parchment page base |
| \`--bg-deep\` | \`#e5d4b2\` | deeper parchment |
| \`--panel\` | \`#fbf7ec\` | card surface |
| \`--panel-2\` | \`#f5ecd9\` | inputs, inner boxes, table headers |
| \`--panel-3\` | \`#efe3ca\` | pressed/hover surface, tracks |
| \`--ink\` | \`#2b241b\` | primary text |
| \`--ink-soft\` | \`#4a3d2e\` | body copy |
| \`--muted\` | \`#7d6c55\` | labels/metadata |
| \`--line\` | \`#d6c5a4\` | borders |
| \`--line-strong\` | \`#b9a276\` | stronger borders |
| \`--brown\` | \`#6b4426\` | serif headings/links |
| \`--brown-soft\` | \`#8a6038\` | secondary brown |
| \`--gold\` | \`#a9772f\` | primary accent / XP / level |
| \`--gold-bright\` | \`#c99a47\` | gold hover/gradient |
| \`--green\` | \`#2f5d50\` | primary actions, proficiency |
| \`--green-soft\` | \`#dce8e1\` | green tint |
| \`--red\` | \`#8c2f2f\` | HP / damage / danger |
| \`--red-soft\` | \`#f0dcd7\` | red tint |
| \`--blue\` | \`#355b78\` | spell slots / psychic / arcane |
| \`--blue-soft\` | \`#dde8ef\` | blue tint |
| \`--shadow\` | \`0 10px 28px rgba(71,48,18,.09)\` | panel shadow |
| \`--shadow-soft\` | \`0 2px 8px rgba(71,48,18,.06)\` | subtle shadow |
| \`--radius\` | \`13px\` | panel radius |

### Color tokens — dark (.dark)
| Token | Value |
|---|---|
| \`--bg\` | \`#1b1916\` |
| \`--bg-deep\` | \`#151311\` |
| \`--panel\` | \`#27231d\` |
| \`--panel-2\` | \`#302b24\` |
| \`--panel-3\` | \`#383229\` |
| \`--ink\` | \`#f0e7d6\` |
| \`--ink-soft\` | \`#d5c8b1\` |
| \`--muted\` | \`#b3a58d\` |
| \`--line\` | \`#4b4236\` |
| \`--line-strong\` | \`#6a5b47\` |
| \`--brown\` | \`#d8b183\` |
| \`--brown-soft\` | \`#e2c39d\` |
| \`--gold\` | \`#d4a54e\` |
| \`--gold-bright\` | \`#e8bf6e\` |
| \`--green\` | \`#83b8a6\` |
| \`--red\` | \`#de9488\` |
| \`--blue\` | \`#8fb6cd\` |

### Typography
- Display/serif: \`"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", Georgia, serif\` — h1–h4, \`.serif\`, brand, ability scores, hero name, level-up class name.
- Body/UI: \`system-ui, "Noto Sans SC", "Microsoft YaHei", sans-serif\`.
- No webfonts; no network font loading.
- Observed scale: badges 0.6rem; table heads 0.63rem; labels 0.62–0.68rem; panel subtitles 0.7rem; body 0.76rem; buttons 0.71–0.77rem; panel titles 1.02rem; hero name \`clamp(1.5rem, 3vw, 2.15rem)\`; HP 2rem; ability scores 1.6rem.
- Body text is frequently 9.6–12.5 px — the main readability issue for Chinese.

### Spacing / radii / shadows / breakpoints
- Page max 1320px; horizontal padding \`clamp(12px, 3vw, 28px)\`; panel grid gap 14px.
- Panel head 12/14/10px; body 13/14/15px.
- Radii: panels 13px, modal 16px, inputs/buttons 6–8px, stat cards 9–10px, cards 12px, pills/circles 99px.
- Breakpoints: 1050px two-column sheet; 780px search/level-up single column; 760px mobile top bar + bottom nav + 3-col abilities; 700px hero 2-col; 640px form 1-col; 620px skills/stat/roleplay 1-col; 560px HP stacks.

### Background
- Light body: three fixed radial gradients (cream/gold/brown) over \`--bg\`.
- Dark body: brown/green radial washes over near-black.
- Panels have a 1px top highlight via \`.panel::before\`.

### Tailwind config
The Tailwind palette (\`parchment #f3ead6\`, \`ink #2c241b\`, \`brown #6b4426\`, \`gold #b8863b\`, \`forest #2f5d50\`, \`wine #8c2f2f\`) is **not used** by any TSX utility class; the real palette is the CSS variables above. Three values differ from the CSS tokens.

## Part 2 — Raw source

### \`tailwind.config.js\`

${fence('js', tailwind)}

### \`src/styles.css\` (full)

${fence('css', styles)}
`)

write('pages.md', `# Pages — dependency trees

## /#/char/:id — Character sheet

Entry: \`src/pages/CharacterPage.tsx\`

Dependencies:
- \`src/components/SheetHero.tsx\` (identity hero; exported as IdentityPanel)
- \`src/components/AuditPanel.tsx\`
- \`src/components/AbilitiesPanel.tsx\`
- \`src/components/RoleplayPanel.tsx\`
- \`src/components/CombatPanel.tsx\`
- \`src/components/AttackPanel.tsx\`
- \`src/components/SpellsPanel.tsx\`
- \`src/components/ResourcesPanel.tsx\`
- \`src/components/InventoryPanel.tsx\`
- \`src/components/FeaturesPanel.tsx\`
- \`src/components/ui.tsx\`
  - ToastProvider/useToast, Panel, Btn, NumberField, TextInput, TextArea, Select, Field, Stepper, Pips, Toggle, Badge, Modal, Empty, Divider, Stat, TagList
- \`src/lib/calc.ts\` (derived values, rests)
- \`src/lib/insert.ts\` (search insertion)
- \`src/lib/level-up.ts\` (level-up planning)
- \`src/lib/api.ts\` (HTTP wrappers)
- \`src/types.ts\` (Character schema + constants)
- \`src/styles.css\` (tokens + all component CSS)
- \`src/App.tsx\` shell (top bar, dialogs, autosave, mobile nav)

Rendered composition (desktop):
1. \`SheetHero\` — full-width identity panel.
2. \`AuditPanel\` — full-width import-audit card (only when audit data exists).
3. Quick actions row — save / short rest / long rest / settings + autosave hint.
4. Two-column \`.sheet-grid\`:
   - Left: \`AbilitiesPanel\`, \`RoleplayPanel\`.
   - Right: \`CombatPanel\`, \`AttackPanel\`, \`SpellsPanel\`, \`ResourcesPanel\`, \`InventoryPanel\`, \`FeaturesPanel\`.

## /#/rules — Rules library

Entry: \`src/pages/RulebookPage.tsx\`

Dependencies:
- \`src/components/CompendiumExplorer.tsx\`
  - \`src/components/Highlight.tsx\`
  - \`src/components/ui.tsx\` (Panel, Button, Select, Badge, Empty, etc.)
- \`src/lib/api.ts\`
- \`src/styles.css\`

## /#/quick — Quick rules

Entry: \`src/pages/QuickRulesPage.tsx\`

Dependencies:
- \`shared/quick-rules.json\`
- \`src/lib/router.ts\` / app navigation callback
- \`src/styles.css\`

## Shared data / logic (not UI)

- \`src/types.ts\` — \`Character\` schema, ability/skill/condition constants.
- \`src/lib/calc.ts\` — ability modifiers, proficiency, skills/saves, AC, initiative, weight, XP, slots, rests, attacks.
- \`src/lib/level-up.ts\` — level-up plan and apply.
- \`src/lib/api.ts\` — character CRUD, search, settings, backups.
- \`shared/classes.json\` — 12 classes × 20 levels.
- \`shared/quick-rules.json\` — 33 quick cards.

## Key Character schema (for design context only)

${fence('ts', types.split('\n').slice(147, 202).join('\n'))}

## Derived-value helpers (for design context only)

${fence('ts', calc)}
`)

write('extractable-components.md', `# Extractable components

## TopBar
- Source: \`src/App.tsx\` (render block \`header.topbar\`, around lines 401–439)
- Category: layout
- Description: Sticky app header with brand, three route tabs, character switch, save state, search/rest/level-up/settings actions
- Extractable props: \`activeRoute\` (string, default "char"), \`characterName\` (string), \`className\` (string), \`level\` (number), \`canLevel\` (boolean), \`saveState\` ("saved" | "dirty" | "saving" | "error")
- Hardcoded: "D" brand mark, tab labels 角色卡/规则库/速查, icon names, all CSS classes

## MobileNav
- Source: \`src/App.tsx\` (render block \`nav.mobile-nav\`)
- Category: layout
- Description: Fixed six-item bottom navigation for mobile widths (≤760px)
- Extractable props: \`activeSection\` (string), \`className\` (string)
- Hardcoded: icons (User, Sparkles, Backpack, BookOpen, ScrollText, Zap), labels 角色/法术/物品/特性/规则/速查

## Panel
- Source: \`src/components/ui.tsx\`
- Category: basic
- Description: Standard content panel with serif title, optional subtitle, header actions, and body
- Extractable props: \`title\` (string), \`subtitle\` (string), \`actions\` (slot/HTML), \`dense\` (boolean), \`id\` (string)
- Hardcoded: panel border, radius, shadow, dashed header rule, title typography

## SheetHero
- Source: \`src/components/SheetHero.tsx\`
- Category: layout / identity
- Description: Character identity hero: portrait, editable name, meta fields, multiclass rows, level/PB/AC/initiative badges, XP bar and level-up CTA
- Extractable props: \`name\` (string), \`playerName\` (string), \`race\` (string), \`background\` (string), \`alignment\` (string), \`level\` (number), \`proficiencyBonus\` (number), \`ac\` (number), \`initiative\` (number), \`xp\` (number), \`nextLevelXp\` (number | null), \`portrait\` (string | null), \`classes\` (array), \`canLevel\` (boolean)
- Hardcoded: portrait frame, badge styles, XP bar gradient, serif name typography

## CombatPanel (vitals cluster)
- Source: \`src/components/CombatPanel.tsx\`
- Category: layout / feature
- Description: HP block with damage/heal, death saves, four stat tiles (AC/initiative/speed/hit dice), exhaustion, concentration, condition chips
- Extractable props: \`hp\` ({ current, max, temp }), \`ac\` (number), \`initiative\` (number), \`speed\` (number), \`hitDice\` ({ remaining, total, die }), \`deathSaves\` ({ successes, failures }), \`exhaustion\` (number), \`concentration\` (string | null), \`conditions\` (string[])
- Hardcoded: HP red gradient, death-save dot colors, stat tile icons, AC/initiative mode controls

## AbilitiesPanel
- Source: \`src/components/AbilitiesPanel.tsx\`
- Category: feature
- Description: Six ability score cards, 18 skills in two columns with proficiency/expertise toggles, passive scores, proficiency tag lists
- Extractable props: \`abilities\` (record), \`saveProfs\` (string[]), \`skillProfs\` (string[]), \`skillExpertise\` (string[]), \`passives\` (object), \`armorProfs\` / \`weaponProfs\` / \`toolProfs\` / \`languages\` (string[])
- Hardcoded: ability abbreviations/labels, skill grid, toggle circles, tag pill styles

## SpellsPanel
- Source: \`src/components/SpellsPanel.tsx\`
- Category: feature
- Description: Spell DC/attack/ability/prepared stat tiles, spell-slot pips, grouped spell rows with prepared/ritual/concentration badges, inline editor
- Extractable props: \`spellcasting\` (ability, slots, pactSlots, spells), \`spellSaveDC\` (number), \`spellAttack\` (number), \`preparedCount\` (number), \`preparedLimit\` (number), \`maxSpellLevel\` (number)
- Hardcoded: slot pip interaction, spell row badges, expansion fields, warning text

## ScrollableChoiceTable (attack/inventory pattern)
- Source: \`src/components/AttackPanel.tsx\`, \`src/components/InventoryPanel.tsx\`
- Category: basic / table
- Description: Dense editable table with 7–9 columns, horizontal scroll wrapper, inline number/text inputs, computed green badges, delete actions
- Extractable props: \`columns\` (array), \`rows\` (array), \`minWidth\` (number)
- Hardcoded: table header labels, input styles, green modifier badge, delete icon
`)

console.log('init files ready')
