export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface ClassLevel {
  name: string
  subclass: string
  level: number
  hitDie: number
}

export interface CharacterCondition {
  name: string
  level?: number
}

export interface Currency {
  pp: number
  gp: number
  ep: number
  sp: number
  cp: number
}

export interface SpellEntry {
  id: string
  name: string
  en?: string
  level: number
  school: string
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  concentration?: boolean
  ritual?: boolean
  classes?: string[]
  description?: string
  higherLevels?: string
  prepared: boolean
  alwaysPrepared?: boolean
  source: string
  note?: string
}

export interface Attack {
  id: string
  name: string
  ability: AbilityKey
  proficient: boolean
  magicBonus: number
  damageDice: string
  damageType: string
  properties: string[]
  range: string
  notes: string
  sourceItemId?: string
}

export interface ArmorData {
  base: number
  dexCap: number | null
  category: 'light' | 'medium' | 'heavy' | 'shield'
  acBonus?: number
  strengthReq?: number | null
  stealthDisadvantage?: boolean
}

export interface WeaponData {
  damage: string
  damageType: string
  properties: string[]
  range: string
  versatile?: string
  attackAbility?: AbilityKey
  group?: 'simple' | 'martial'
}

export interface Item {
  id: string
  name: string
  qty: number
  weight: number
  cost: string
  category: string
  equipped: boolean
  attuned: boolean
  description: string
  source: string
  armor?: ArmorData
  weapon?: WeaponData
  magicBonus?: number
}

export interface FeatureUses {
  total: number
  used: number
  reset: 'short' | 'long' | 'none'
  infinite?: boolean
}

export interface Feature {
  id: string
  name: string
  source: string
  level?: number
  description: string
  uses?: FeatureUses
  auto?: boolean
  searchName?: string
}

export interface Resource {
  id: string
  name: string
  total: number
  used: number
  reset: 'short' | 'long' | 'none'
  source?: string
  auto?: boolean
  infinite?: boolean
  note?: string
}

export interface Roleplay {
  personality: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
  backstory: string
  allies: string
  notes: string
}

export interface Character {
  schemaVersion: number
  id: string
  name: string
  playerName: string
  portrait: string | null
  classes: ClassLevel[]
  race: { name: string; subrace: string }
  background: string
  alignment: string
  xp: number
  abilities: Record<AbilityKey, number>
  saveProfs: AbilityKey[]
  skillProfs: string[]
  skillExpertise: string[]
  toolProfs: string[]
  languages: string[]
  armorProfs: string[]
  weaponProfs: string[]
  hp: { max: number; current: number; temp: number }
  hitDice: { remaining: number }
  ac: { mode: 'auto' | 'manual'; manual: number | null }
  initiative: { mode: 'auto' | 'manual'; manual: number | null }
  speed: number
  exhaustion: number
  conditions: CharacterCondition[]
  deathSaves: { successes: number; failures: number }
  concentration: string | null
  spellcasting: {
    ability: AbilityKey
    slots: Record<string, { total: number; used: number; manual?: boolean }>
    pactSlots: { total: number; used: number; level: number } | null
    spells: SpellEntry[]
  }
  attacks: Attack[]
  resources: Resource[]
  inventory: Item[]
  currency: Currency
  features: Feature[]
  roleplay: Roleplay
  createdAt: number
  updatedAt: number
}

export interface CharacterSummary {
  id: string
  name: string
  level: number
  classLine: string
  race: string
  portrait: string | null
  updatedAt: number
}

export interface CompendiumEntry {
  uid: string
  type: 'spell' | 'item' | 'feat' | 'classFeature' | 'condition' | 'equipment'
  name: string
  en?: string
  book: string
  chapter: string
  page: number | null
  description: string
  level?: number
  className?: string
  school?: string
  ritual?: boolean
  concentration?: boolean
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  classes?: string[]
  higherLevels?: string
  itemType?: string
  subtype?: string
  rarity?: string
  attunement?: boolean
  prerequisite?: string
  summary?: string
  kind?: 'armor' | 'shield' | 'weapon'
  category?: string
  weaponGroup?: 'simple' | 'martial'
  cost?: string
  ac?: { base: number; dexCap: number | null; acBonus: number; formula: string }
  strengthReq?: number | null
  stealthDisadvantage?: boolean
  weight?: number
  damage?: string
  damageType?: string
  versatile?: string
  properties?: string[]
  attackAbility?: AbilityKey
}

export interface SearchResult {
  kind: 'spell' | 'item' | 'feat' | 'classFeature' | 'condition' | 'equipment' | 'raw'
  uid: string
  title: string
  en?: string
  subtitle: string
  snippet: string
  score: number
  book: string
  chapter: string
  page: number | null
  meta: Record<string, unknown>
  entry?: CompendiumEntry
  fullText?: string
}

export interface SearchCounts {
  all: number
  spell: number
  item: number
  feat: number
  classFeature: number
  condition: number
  equipment: number
  raw: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  counts: SearchCounts
  error?: string | null
}

export interface MetaResponse {
  app: string
  settings: { databaseDir: string; port: number; host: string }
  database: { dir: string; exists: boolean; mdCount: number; books: string[] }
  compendium: {
    builtAt: string | null
    counts: SearchCounts
    warnings: string[]
    error: string | null
    source: { dir: string; hash: string }
  }
  counts: SearchCounts
  characters: number
  dataDir: string
}

export interface ResourceFormula {
  type: 'levelTimes' | 'abilityPlus' | 'fixed' | 'level' | 'byLevel'
  factor?: number
  ability?: AbilityKey
  plus?: number
  min?: number
  value?: number
  values?: (number | string)[]
}

export interface ResourceDef {
  name: string
  reset: 'short' | 'long' | 'none'
  resetAtLevel?: Record<string, 'short' | 'long' | 'none'>
  formula: ResourceFormula
  minLevel?: number
}

export interface ClassLevelData {
  level: number
  features: string[]
  slots?: number[]
  pact?: { count: number; level: number }
  cantrips?: number
}

export interface ClassDef {
  name: string
  en: string
  hitDie: number
  saves: AbilityKey[]
  primary: AbilityKey[]
  armorProfs: string[]
  weaponProfs: string[]
  caster: 'full' | 'half' | 'pact' | 'none'
  spellAbility: AbilityKey | null
  subclassLevel: number
  subclassLabel: string
  subclasses: string[]
  asiLevels: number[]
  preparedFormula: string | null
  levels: ClassLevelData[]
  resources: ResourceDef[]
}

export interface ClassDataFile {
  version: number
  generatedAt: string
  classes: ClassDef[]
  warnings: string[]
}

export interface QuickRule {
  id: string
  title: string
  summary: string[]
  source?: { book: string; chapter: string; query: string }
  searchName?: string
}

export interface QuickRuleCategory {
  id: string
  title: string
  items: QuickRule[]
}

export interface QuickRulesFile {
  version: number
  categories: QuickRuleCategory[]
}

export const ABILITIES: { key: AbilityKey; name: string; en: string }[] = [
  { key: 'str', name: '力量', en: 'STR' },
  { key: 'dex', name: '敏捷', en: 'DEX' },
  { key: 'con', name: '体质', en: 'CON' },
  { key: 'int', name: '智力', en: 'INT' },
  { key: 'wis', name: '感知', en: 'WIS' },
  { key: 'cha', name: '魅力', en: 'CHA' },
]

export const SKILLS: { key: string; name: string; en: string; ability: AbilityKey }[] = [
  { key: 'athletics', name: '运动', en: 'Athletics', ability: 'str' },
  { key: 'acrobatics', name: '体操', en: 'Acrobatics', ability: 'dex' },
  { key: 'sleight_of_hand', name: '巧手', en: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', name: '隐匿', en: 'Stealth', ability: 'dex' },
  { key: 'arcana', name: '奥秘', en: 'Arcana', ability: 'int' },
  { key: 'history', name: '历史', en: 'History', ability: 'int' },
  { key: 'investigation', name: '调查', en: 'Investigation', ability: 'int' },
  { key: 'nature', name: '自然', en: 'Nature', ability: 'int' },
  { key: 'religion', name: '宗教', en: 'Religion', ability: 'int' },
  { key: 'animal_handling', name: '驯兽', en: 'Animal Handling', ability: 'wis' },
  { key: 'insight', name: '洞悉', en: 'Insight', ability: 'wis' },
  { key: 'medicine', name: '医药', en: 'Medicine', ability: 'wis' },
  { key: 'perception', name: '察觉', en: 'Perception', ability: 'wis' },
  { key: 'survival', name: '生存', en: 'Survival', ability: 'wis' },
  { key: 'deception', name: '欺瞒', en: 'Deception', ability: 'cha' },
  { key: 'intimidation', name: '威吓', en: 'Intimidation', ability: 'cha' },
  { key: 'performance', name: '表演', en: 'Performance', ability: 'cha' },
  { key: 'persuasion', name: '游说', en: 'Persuasion', ability: 'cha' },
]

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.key, s]))

export const CONDITIONS: { name: string; en: string; summary: string }[] = [
  { name: '目盲', en: 'Blinded', summary: '不能视物，视觉检定自动失败；攻击者有优势，其攻击有劣势。' },
  { name: '魅惑', en: 'Charmed', summary: '不能攻击魅惑者；魅惑者对其社交检定有优势。' },
  { name: '耳聋', en: 'Deafened', summary: '不能听声，听觉检定自动失败。' },
  { name: '恐慌', en: 'Frightened', summary: '属性检定和攻击有劣势；不能靠近恐惧源。' },
  { name: '擒抱', en: 'Grappled', summary: '速度 0；擒抱者移动或效果结束时解除。' },
  { name: '失能', en: 'Incapacitated', summary: '不能动作/反应；攻击者有优势；力量/敏捷豁免自动失败。' },
  { name: '隐形', en: 'Invisible', summary: '攻击者对其有劣势，其攻击有优势；仍可被声音察觉。' },
  { name: '麻痹', en: 'Paralyzed', summary: '失能、不能动/说话；力量/敏捷豁免自动失败；攻击有优势，5 尺内暴击。' },
  { name: '石化', en: 'Petrified', summary: '变为石头，失能；攻击有优势；力量/敏捷豁免自动失败；获得抗性。' },
  { name: '力竭', en: 'Exhaustion', summary: '1 检定劣势；2 速度减半；3 攻击/豁免劣势；4 HP 上限减半；5 速度 0；6 死亡。' },
  { name: '中毒', en: 'Poisoned', summary: '攻击检定和属性检定具有劣势。' },
  { name: '倒地', en: 'Prone', summary: '只能爬行；攻击有优势（5 尺内）否则劣势；起身消耗一半速度。' },
  { name: '束缚', en: 'Restrained', summary: '速度 0；攻击/敏捷豁免劣势；攻击者有优势。' },
  { name: '震慑', en: 'Stunned', summary: '失能、不能动；力量/敏捷豁免自动失败；攻击有优势。' },
  { name: '昏迷', en: 'Unconscious', summary: '失能、倒地；攻击有优势，5 尺内暴击；力量/敏捷豁免自动失败。' },
]

export const CONDITION_MAP = Object.fromEntries(CONDITIONS.map((c) => [c.name, c]))

export const ALIGNMENTS = [
  '守序善良', '中立善良', '混乱善良',
  '守序中立', '绝对中立', '混乱中立',
  '守序邪恶', '中立邪恶', '混乱邪恶',
]

export const SPELL_LEVEL_NAMES = ['戏法', '1环', '2环', '3环', '4环', '5环', '6环', '7环', '8环', '9环']

export const SCHOOLS = ['防护', '咒法', '预言', '附魔', '塑能', '幻术', '死灵', '变化']

export const CLASS_NAMES = ['野蛮人', '吟游诗人', '牧师', '德鲁伊', '战士', '武僧', '圣武士', '游侠', '游荡者', '术士', '邪术师', '法师']

export const RARITIES = ['普通', '非普通', '珍稀', '极珍稀', '传说', '神器']

export const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

export const RESET_LABELS: Record<string, string> = {
  short: '短休',
  long: '长休',
  none: '不恢复',
}

export const COINS: { key: keyof Currency; label: string; name: string }[] = [
  { key: 'pp', label: 'PP', name: '铂金币' },
  { key: 'gp', label: 'GP', name: '金币' },
  { key: 'ep', label: 'EP', name: '银金币' },
  { key: 'sp', label: 'SP', name: '银币' },
  { key: 'cp', label: 'CP', name: '铜币' },
]
