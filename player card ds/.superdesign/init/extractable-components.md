# Extractable components

## TopBar
- Source: `src/App.tsx` (render block `header.topbar`, around lines 401–439)
- Category: layout
- Description: Sticky app header with brand, three route tabs, character switch, save state, search/rest/level-up/settings actions
- Extractable props: `activeRoute` (string, default "char"), `characterName` (string), `className` (string), `level` (number), `canLevel` (boolean), `saveState` ("saved" | "dirty" | "saving" | "error")
- Hardcoded: "D" brand mark, tab labels 角色卡/规则库/速查, icon names, all CSS classes

## MobileNav
- Source: `src/App.tsx` (render block `nav.mobile-nav`)
- Category: layout
- Description: Fixed six-item bottom navigation for mobile widths (≤760px)
- Extractable props: `activeSection` (string), `className` (string)
- Hardcoded: icons (User, Sparkles, Backpack, BookOpen, ScrollText, Zap), labels 角色/法术/物品/特性/规则/速查

## Panel
- Source: `src/components/ui.tsx`
- Category: basic
- Description: Standard content panel with serif title, optional subtitle, header actions, and body
- Extractable props: `title` (string), `subtitle` (string), `actions` (slot/HTML), `dense` (boolean), `id` (string)
- Hardcoded: panel border, radius, shadow, dashed header rule, title typography

## SheetHero
- Source: `src/components/SheetHero.tsx`
- Category: layout / identity
- Description: Character identity hero: portrait, editable name, meta fields, multiclass rows, level/PB/AC/initiative badges, XP bar and level-up CTA
- Extractable props: `name` (string), `playerName` (string), `race` (string), `background` (string), `alignment` (string), `level` (number), `proficiencyBonus` (number), `ac` (number), `initiative` (number), `xp` (number), `nextLevelXp` (number | null), `portrait` (string | null), `classes` (array), `canLevel` (boolean)
- Hardcoded: portrait frame, badge styles, XP bar gradient, serif name typography

## CombatPanel (vitals cluster)
- Source: `src/components/CombatPanel.tsx`
- Category: layout / feature
- Description: HP block with damage/heal, death saves, four stat tiles (AC/initiative/speed/hit dice), exhaustion, concentration, condition chips
- Extractable props: `hp` ({ current, max, temp }), `ac` (number), `initiative` (number), `speed` (number), `hitDice` ({ remaining, total, die }), `deathSaves` ({ successes, failures }), `exhaustion` (number), `concentration` (string | null), `conditions` (string[])
- Hardcoded: HP red gradient, death-save dot colors, stat tile icons, AC/initiative mode controls

## AbilitiesPanel
- Source: `src/components/AbilitiesPanel.tsx`
- Category: feature
- Description: Six ability score cards, 18 skills in two columns with proficiency/expertise toggles, passive scores, proficiency tag lists
- Extractable props: `abilities` (record), `saveProfs` (string[]), `skillProfs` (string[]), `skillExpertise` (string[]), `passives` (object), `armorProfs` / `weaponProfs` / `toolProfs` / `languages` (string[])
- Hardcoded: ability abbreviations/labels, skill grid, toggle circles, tag pill styles

## SpellsPanel
- Source: `src/components/SpellsPanel.tsx`
- Category: feature
- Description: Spell DC/attack/ability/prepared stat tiles, spell-slot pips, grouped spell rows with prepared/ritual/concentration badges, inline editor
- Extractable props: `spellcasting` (ability, slots, pactSlots, spells), `spellSaveDC` (number), `spellAttack` (number), `preparedCount` (number), `preparedLimit` (number), `maxSpellLevel` (number)
- Hardcoded: slot pip interaction, spell row badges, expansion fields, warning text

## ScrollableChoiceTable (attack/inventory pattern)
- Source: `src/components/AttackPanel.tsx`, `src/components/InventoryPanel.tsx`
- Category: basic / table
- Description: Dense editable table with 7–9 columns, horizontal scroll wrapper, inline number/text inputs, computed green badges, delete actions
- Extractable props: `columns` (array), `rows` (array), `minWidth` (number)
- Hardcoded: table header labels, input styles, green modifier badge, delete icon
