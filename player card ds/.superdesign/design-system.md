# Design System — 冒险者手记 (The Adventurer's Ledger)

## 1. Product context

- Local-only D&D 5E (2014) character sheet + rules library, Simplified Chinese UI.
- React 19 + TypeScript + Vite 7; hand-written CSS in `src/styles.css`; lucide-react icons; native `<dialog>`; no external UI library.
- Dense, always-editable character sheet: identity, abilities/skills, combat/HP, attacks, spells/slots, resources, inventory/coins, features, roleplay.
- Persistence: full-character PUT with 800 ms autosave; local JSON files; backups. UI allows custom/over-limit values; never silently "fix" data.
- Themes: warm parchment light (default) and "夜账本" dark. Both must use the same token names and pass WCAG AA for body text.
- Targets: desktop 1440×1000, mobile 390×844. No external fonts, images, or network assets. `start.bat` must stay ASCII.

## 2. Visual direction

**The character sheet is a field journal the character maintains, not a grid of identical cards.** Paper is the canvas; ink is the interface. Numbers are typeset like a ledger; state is marked like marginalia and seals.

Keywords: printed ledger, warm cream, ink rules, oxidized red, serif display, mono furniture, tabular numbers, marginal notes, restrained seals.

Primary style source (adapted): Superdesign style prompt **“Animated Scroll-Printed Product Page: Warm Cream and Red Editorial”** — warm print register, cream ground, ink, one rationed red, heavy display type against wide-tracked mono furniture, 1.5px ink borders, flat illustration instead of photography. We keep its **print material language and color discipline**, drop its landing-page scroll choreography, and adapt fonts/palette to Chinese + dual themes.

### Signature element — Vitals Ledger

A slim, always-visible strip directly under the top bar:
- small portrait chip, character name, class/level
- HP current / max / temp with a thin ruler bar
- AC, initiative, spell-slot summary
- concentration + up to 3 condition seals
- expands on mobile to a 3-metric row (HP / AC / Init)

Everything else scrolls underneath. This keeps the numbers used every turn visible without opening a panel.

### Hierarchy

1. Identity + Vitals Ledger (always visible).
2. Current-turn tools: combat, attacks, spells.
3. Supporting state: resources, inventory, features.
4. Narrative: roleplay, notes, backstory.
5. Import audit: a dismissible inline banner, not a full panel.

Panel order on desktop (12-column grid):
- Left rail (4 cols): identity, abilities/skills.
- Main (8 cols): combat, attacks, spells; then a 2-column subgrid for resources + inventory; features; roleplay full-width at the bottom.
- This removes the current left-column void and keeps the right column from becoming a 3,800px scroll.

### Avoid

- No stock photography, 3D icons, glassmorphism, neon, or decorative gradient washes.
- No card-inside-card; one surface per section, divided by ink rules.
- No color used as decoration: red = damage/HP/death, green = action/success/proficiency, blue = arcane/slots/concentration, gold = level/XP/progression.
- No body text below 12px; no metadata below 11.5px.
- No infinite pulsing except a single small "ready" seal on level-up; respect `prefers-reduced-motion`.
- No horizontal scrolling tables on mobile; convert to stacked field rows.
- No changes to data fields, calculations, API, save behavior, section ids, or Chinese logic keys.

## 3. Color tokens

### Light — "daylight paper"

| Token | Value | Role |
|---|---|---|
| `--bg` | `#efe4cc` | page parchment |
| `--bg-deep` | `#e4d3b4` | page edge / deeper parchment |
| `--panel` | `#fbf6ea` | main paper surface |
| `--panel-2` | `#f5ecda` | inset field / table head |
| `--panel-3` | `#ece0c8` | pressed / track |
| `--ink` | `#1f1a14` | primary text |
| `--ink-soft` | `#463b2f` | body copy |
| `--muted` | `#6b5d49` | labels/metadata (AA on panel-2) |
| `--line` | `#d2c1a0` | hairline rules |
| `--line-strong` | `#a98e63` | strong rules / input borders |
| `--oxblood` | `#8a2f2a` | HP, damage, death saves, destructive emphasis |
| `--oxblood-soft` | `#f1ded8` | HP tint |
| `--green` | `#2f5d50` | primary actions, success, proficiency |
| `--green-soft` | `#dfe9e2` | success tint |
| `--blue` | `#355b78` | spell slots, concentration, arcane |
| `--blue-soft` | `#dfe8ef` | arcane tint |
| `--gold` | `#8a5f20` | level, XP, progression only |
| `--gold-soft` | `#f3e6c9` | XP tint |
| `--loam` | `#241a12` | dark accent / seal, not body background |
| `--shadow` | `0 1px 0 rgba(58,40,18,.06), 0 10px 24px rgba(58,40,18,.06)` | panel lift |
| `--radius` | `2px` | print-like corners |

### Dark — "夜账本"

| Token | Value |
|---|---|
| `--bg` | `#171411` |
| `--bg-deep` | `#100e0c` |
| `--panel` | `#221d17` |
| `--panel-2` | `#2b241c` |
| `--panel-3` | `#352c22` |
| `--ink` | `#f3e9d7` |
| `--ink-soft` | `#d7c9b3` |
| `--muted` | `#b6a68c` |
| `--line` | `#473c2f` |
| `--line-strong` | `#6f5c45` |
| `--oxblood` | `#d98b80` |
| `--oxblood-soft` | `#3c2622` |
| `--green` | `#8bbca9` |
| `--green-soft` | `#23352f` |
| `--blue` | `#8fb6cd` |
| `--blue-soft` | `#24333e` |
| `--gold` | `#d6a64f` |
| `--gold-soft` | `#3a2e1c` |
| `--loam` | `#0d0b09` |
| `--shadow` | `0 1px 0 rgba(0,0,0,.4), 0 14px 30px rgba(0,0,0,.35)` |

Contrast rules: body text ≥ 4.5:1 on its surface; large numbers/titles ≥ 3:1; do not put `--muted` on `--panel-3`; never use `--gold` for body copy.

## 4. Typography

- Display serif (identity, panel titles, big numbers): `"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", Georgia, serif`.
- Body/UI sans: `system-ui, "Noto Sans SC", "Microsoft YaHei", sans-serif`.
- Numeric/labels: same sans with `font-variant-numeric: tabular-nums`; labels uppercase where Latin, letter-spacing .06–.12em. Use a mono stack only for tiny Latin/number furniture: `ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace`.
- No webfonts, no network font loading.

Scale (rem, 16px root):
| Role | Size | Notes |
|---|---|---|
| micro label / table head | 0.72rem (11.5px) | uppercase/latin tracking; never smaller |
| metadata | 0.75rem (12px) | line-height 1.45 |
| body / inputs | 0.82rem (13px) | line-height 1.5 |
| table cell | 0.82rem | tabular numbers |
| emphasis | 0.9rem (14.4px) | row titles |
| panel title | 1.12rem (18px) | serif, 700 |
| section eyebrow | 0.72rem | mono, tracking .12em |
| hero name | clamp(1.75rem, 3.2vw, 2.25rem) | serif |
| HP number | clamp(2.25rem, 3.6vw, 2.75rem) | serif, tabular |
| ability score | 1.5rem | serif, tabular |
| modal title | 1.25rem | serif |

## 5. Space, rules, surfaces

- 4px base; use 4/8/12/16/24/32.
- Page max 1440px; padding `clamp(14px, 2.4vw, 28px)`.
- Panel padding 16–18px; dense rows 10–12px vertical.
- Panel radius 2px; inputs/buttons 2px; pills and pips fully round (999px).
- Borders: 1px solid `--line` for structure; 1.5px `--line-strong` for emphasized values; dashed only for empty/drop targets and the audit banner, not every section.
- Shadows: one soft paper lift; no glow.
- No nested cards. A panel may contain ruled rows, inset fields, and a single summary strip.

## 6. Layout specification

### Desktop ≥ 1200px
- Top bar 56px, sticky.
- Vitals Ledger 68px, sticky under top bar (top: 56px); page content starts below.
- 12-col grid, gap 16px:
  - left 4 cols: identity card (portrait + name + classes + XP), abilities/skills.
  - right 8 cols: combat (full width of right), attacks, spells; resources + inventory side-by-side; features; roleplay full width across both columns at the bottom.
- Keep `scroll-margin-top` for section anchors at 140px.

### 900–1199px
- 2 columns 5/7; Vitals Ledger compresses to name + HP/AC/Init.

### ≤ 760px
- Single column. Top bar 48px with brand, character switch, search icon, overflow menu; route tabs move into the overflow menu.
- Vitals Ledger 56px: portrait chip + HP bar + AC + Init; tap to expand for slots/conditions.
- Bottom nav 5 items, 48px min target: 角色 / 战斗 / 法术 / 物品 / 规则.
- Tables become stacked field rows with a leading name and trailing value; no horizontal scroll.
- Section paddings 12–14px; panel titles 1rem.

## 7. Component language

### Panel
- Paper surface, 1px rule, 2px radius, no inner card.
- Header: 0.72rem mono eyebrow (optional), serif title 1.12rem, optional subtitle 0.75rem; one ink rule below; actions right-aligned.

### Editable vs read-only
- Editable text/number: inset paper field with 1px `--line` border; on hover a slightly darker field; on focus a 2px `--ink` outline offset 1px. Show a small pencil icon only on hover/focus.
- Inline hero fields: dotted underline in `--line-strong` at rest, paper fill on hover/focus; never invisible-until-hover.
- Computed values (AC, initiative, to-hit, skill bonus, passives): plain text, serif or tabular sans; optional 0.72rem "自动" label. Never style them as inputs.
- Read-only metadata: plain text with `--muted`, no box.

### Badges / seals
- Max 2 badges per row. Keep only state that changes a decision: 已准备, 专注, 仪式, 超出上限, 已同调, 已装备, 力竭.
- Use a small square/rounded seal (2px radius) with a 1px tinted border, not a rainbow of pills. Source/class metadata becomes plain text.
- Gold is reserved for level/XP/audit seal; do not use it for generic "info".

### Pips
- 18px visual circle, 32px hit area, 8px gap. Filled = ink/oxblood; empty = 1px rule. Hover shows a ring; keyboard focus shows a 2px outline.
- Spell-slot pips use blue; resource pips use ink; death saves use oxblood/green.

### Tables (attacks, inventory)
- Sticky header row, 0.72rem uppercase labels, ruled rows (no zebra), tabular numbers.
- Primary column (name) gets 2× width; numeric columns narrow; destructive action at the far right.
- At ≤760px, each row becomes a 2-column definition list: name + computed value on the first line, editable fields below, actions in a footer.
- No `min-width` forcing horizontal scroll on mobile.

### Dialogs
- Native `<dialog>` stays. Paper surface, 2px border, 16px padding, header with serif title + close, body grouped into 2–3 labeled sections, footer with one primary and one ghost action.
- Level-up: 3 steps (职业/生命 →  subclass/ASI → 确认预览); search: left filters + right detail; settings: grouped cards without nested shadows.

### Empty states
- Dashed 1px rule box, centered 0.8rem muted text, one ghost action. No illustration.

### Motion
- 160–200ms ease-out for hover/focus, 220ms for panel reveal, 300ms for HP bar.
- No infinite animation except a 2.2s soft gold ring on the level-up seal when eligible; disable under `prefers-reduced-motion`.
- All interactive elements need a visible `:focus-visible` outline.

## 8. Content and tone

- Simplified Chinese, 2014 D&D terminology.
- Panel titles use nouns (属性与技能, 战斗状态, 攻击, 法术, 物品与财富, 特性与专长, 角色扮演).
- Hints are one short line; move explanations into `title` tooltips.
- Numbers first, labels second: "19 AC", "41 / 41 HP", "9 / 5 准备法术" with the warning adjacent.
- Keep exact logic strings: 圣武士, 野蛮人, 武僧, 防御, 警觉, 所有武器, 简易武器, 军用武器.

## 9. Acceptance checks for generated designs

- At 1440×1000: HP, AC, initiative, spell slots visible without scrolling; left column has no dead space; audit is an inline banner.
- At 390×844: top bar ≤ 56px + vitals ≤ 64px; bottom nav 5 items; no horizontal scrolling table.
- Light and dark both use the token names above; body text ≥ 4.5:1; no gold body copy.
- All eight section ids remain present and scrollable: abilities, combat, attacks, spells, resources, inventory, features, roleplay.
- Editable fields are visually distinct from computed values; every input remains editable.
- No change to character data shape, calculations, API, autosave, dialogs, or keyboard shortcuts.
- No external images/fonts; icons remain lucide-style line icons.

## 10. Representative content

- Character: 查士丁尼, 圣武士 / 奉献之誓, level 4, AC 19, HP 41/41, initiative +2, speed 30, CHA spellcasting, DC 13, attack +5, 9 prepared spells, 3× 1st-level slots, 8 inventory items, 612 gp / 149 sp / 18 cp.
- Conditions: 无专注, 无状态.
- XP 2751, next level 6500.
