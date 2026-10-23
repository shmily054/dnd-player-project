/**
 * 把旧 player card 的「查士丁尼」迁移到新数据结构，并生成校对报告。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDirs, CHARS_DIR, PORTRAITS_DIR } from '../server/db.mjs'
import { saveCharacter } from '../server/storage.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OLD_CHARS = path.resolve(ROOT, '..', 'player card', 'data', 'characters.json')
const OLD_ROOT = path.resolve(ROOT, '..', 'player card')
const COMPENDIUM = path.join(ROOT, 'data', 'compendium.json')
const CLASSES = path.join(ROOT, 'shared', 'classes.json')
const ID = 'justinian01'
const NAME = '查士丁尼'

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function findSpell(entries, name) {
  return entries.find((e) => e.type === 'spell' && (e.name === name || e.en === name))
}

function findEquipment(entries, name) {
  return entries.find((e) => e.type === 'equipment' && e.name === name)
}

function findMagicItem(entries, name) {
  return entries.find((e) => e.type === 'item' && e.name === name)
}

function main() {
  if (!fs.existsSync(OLD_CHARS)) throw new Error(`找不到旧角色存档：${OLD_CHARS}`)
  if (!fs.existsSync(COMPENDIUM)) throw new Error('缺少 data/compendium.json，请先运行 npm run db:build')
  ensureDirs()
  const oldStore = readJson(OLD_CHARS)
  const old = Object.values(oldStore).find((c) => c.name === NAME) || Object.values(oldStore)[0]
  if (!old) throw new Error('旧存档中没有角色')
  const comp = readJson(COMPENDIUM)
  const classData = readJson(CLASSES)
  const paladin = classData.classes.find((c) => c.name === '圣武士')
  const entries = comp.entries

  const audit = []
  const addAudit = (x) => audit.push(x)

  // 生命骰：4 级圣武士应有 4 颗 d10
  const oldHdTotal = old.hitDice?.total || old.level
  const hdRemaining = old.hitDice?.remaining ?? old.level
  const hdCorrected = oldHdTotal !== old.level
  if (hdCorrected) {
    addAudit({
      id: 'audit-hd',
      severity: 'fixed',
      title: '生命骰总数已修正',
      detail: `旧存档记录为 ${oldHdTotal} 颗，按 ${old.level} 级修正为 ${old.level} 颗 d10；当前可用保持 ${hdRemaining}。`,
      status: 'applied',
    })
  }

  // 法术
  const spells = (old.spells || []).map((s, i) => {
    const hit = findSpell(entries, s.name)
    let level = s.level || 0
    if (hit) level = hit.level
    if (s.name === '英雄宴' && (s.level || 0) !== 6) {
      addAudit({
        id: 'audit-heroes-feast',
        severity: 'fixed',
        title: '「英雄宴」环位已修正',
        detail: `旧存档记为 ${s.level} 环；规则库中英雄宴为 6 环。已改为 6 环，但 4 级圣武士目前没有 6 环法术位。`,
        status: 'applied',
      })
    }
    return {
      id: `spell-${i + 1}`,
      name: s.name,
      en: hit?.en || '',
      level,
      school: hit?.school || '',
      castingTime: hit?.castingTime || '',
      range: hit?.range || '',
      components: hit?.components || '',
      duration: hit?.duration || '',
      concentration: !!hit?.concentration,
      ritual: !!hit?.ritual,
      classes: hit?.classes || ['圣武士'],
      description: hit?.description || '',
      higherLevels: hit?.higherLevels || '',
      prepared: !!s.prepared,
      alwaysPrepared: false,
      source: '圣武士',
      note: s.note || '',
    }
  })

  const smite = spells.find((s) => s.name === '至圣斩')
  if (smite) {
    addAudit({
      id: 'audit-divine-smite',
      severity: 'warn',
      title: '「至圣斩」是职业特性，不是法术',
      detail: '至圣斩（Divine Smite）应在特性中记录。旧存档把它放在法术列表里；可以一键转为特性，或保留现状。',
      status: 'open',
      action: { type: 'convert-spell-to-feature', spellId: smite.id },
    })
  }

  const prepared = spells.filter((s) => s.prepared && !s.alwaysPrepared)
  const chaMod = Math.floor(((old.abilities?.cha || 10) - 10) / 2)
  const limit = Math.max(1, chaMod + Math.floor(old.level / 2))
  if (prepared.length > limit) {
    addAudit({
      id: 'audit-prepared',
      severity: 'warn',
      title: '准备法术数量高于职业上限',
      detail: `4 级圣武士准备上限为魅力调整值 ${chaMod >= 0 ? '+' : ''}${chaMod} + 职业等级一半 2 = ${limit}；当前准备了 ${prepared.length} 个。誓言法术和自定义法术不占上限，请按需调整。`,
      status: 'open',
    })
  }

  // 物品与攻击
  const longswordEq = findEquipment(entries, '长剑')
  const armorEq = findEquipment(entries, '板条甲')
  const shieldEq = findEquipment(entries, '盾牌')
  const javelinEq = findEquipment(entries, '标枪')
  const potion = findMagicItem(entries, '治疗药水')
  const boots = findMagicItem(entries, '精灵之靴')

  const inventory = []
  const attacks = []
  for (const [i, item] of (old.inventory || []).entries()) {
    const id = `item-${i + 1}`
    let base = {
      id,
      name: item.name,
      qty: item.qty || 1,
      weight: 0,
      cost: '',
      category: '冒险用品',
      equipped: false,
      attuned: false,
      description: item.note || '',
      source: '导入',
    }
    if (item.name === '魔法长剑' && longswordEq) {
      base = {
        ...base,
        weight: longswordEq.weight,
        cost: longswordEq.cost,
        category: '武器',
        equipped: true,
        magicBonus: 1,
        weapon: {
          damage: longswordEq.damage,
          damageType: longswordEq.damageType,
          properties: longswordEq.properties,
          range: longswordEq.range,
          versatile: longswordEq.versatile,
          attackAbility: 'str',
        },
      }
      attacks.push({
        id: 'atk-1',
        name: item.name,
        ability: 'str',
        proficient: true,
        magicBonus: 1,
        damageDice: longswordEq.damage,
        damageType: longswordEq.damageType,
        properties: longswordEq.properties,
        range: longswordEq.range,
        notes: item.note || '',
        sourceItemId: id,
      })
    } else if (item.name === '标枪' && javelinEq) {
      base = {
        ...base,
        weight: javelinEq.weight,
        cost: javelinEq.cost,
        category: '武器',
        equipped: false,
        weapon: {
          damage: javelinEq.damage,
          damageType: javelinEq.damageType,
          properties: javelinEq.properties,
          range: javelinEq.range,
          attackAbility: 'str',
        },
      }
      attacks.push({
        id: 'atk-2',
        name: item.name,
        ability: 'str',
        proficient: true,
        magicBonus: 0,
        damageDice: javelinEq.damage,
        damageType: javelinEq.damageType,
        properties: javelinEq.properties,
        range: javelinEq.range,
        notes: item.note || '',
        sourceItemId: id,
      })
    } else if (item.name === '盾牌' && shieldEq) {
      base = {
        ...base,
        weight: shieldEq.weight,
        cost: shieldEq.cost,
        category: '盾牌',
        equipped: true,
        armor: {
          base: 0,
          dexCap: null,
          category: 'shield',
          acBonus: shieldEq.ac?.acBonus || 2,
          strengthReq: null,
          stealthDisadvantage: false,
        },
      }
    } else if (item.name === '板条甲' && armorEq) {
      base = {
        ...base,
        weight: armorEq.weight,
        cost: armorEq.cost,
        category: '护甲',
        equipped: true,
        armor: {
          base: armorEq.ac?.base || 17,
          dexCap: armorEq.ac?.dexCap ?? null,
          category: 'heavy',
          acBonus: 0,
          strengthReq: armorEq.strengthReq ?? 15,
          stealthDisadvantage: !!armorEq.stealthDisadvantage,
        },
      }
    } else if (item.name === '治疗药水') {
      base = { ...base, category: '药水', description: item.note || potion?.description || '2d4+2', attuned: false }
    } else if (item.name === '精灵之靴') {
      base = { ...base, category: '奇物', description: item.note || boots?.description || '', attuned: true }
    }
    inventory.push(base)
  }

  // 职业资源
  const resources = (old.resources || []).map((r, i) => {
    const auto = r.name === '圣疗' || r.name === '圣疗池' || r.name === '神圣感知'
    if (r.name === '引导神力' && r.total !== 1) {
      addAudit({
        id: 'audit-channel-divinity',
        severity: 'warn',
        title: '引导神力次数与规则不符',
        detail: `旧存档记录为 ${r.total} 次/短休。PHB 圣武士的引导神力在使用后必须完成短休或长休才能再次使用，即 1 次；请确认是否为自定义能力。`,
        status: 'open',
        action: { type: 'set-resource-total', resourceId: `res-${i + 1}`, total: 1 },
      })
    }
    return {
      id: `res-${i + 1}`,
      name: r.name === '圣疗池' ? '圣疗' : r.name,
      total: r.total,
      used: r.used || 0,
      reset: r.reset || 'long',
      source: auto ? '圣武士' : '自定义',
      auto,
    }
  })

  const skillProfs = old.skillProfs || []
  if (skillProfs.length > 4) {
    addAudit({
      id: 'audit-skills',
      severity: 'warn',
      title: '技能熟练数量偏多',
      detail: `当前有 ${skillProfs.length} 项技能熟练。圣武士职业提供 2 项，贵族背景通常提供 2 项；额外熟练可能来自专长、种族或自定义，请核对。`,
      status: 'open',
    })
  }

  const features = (old.features || []).map((f, i) => ({
    id: `feature-${i + 1}`,
    name: f.name,
    source: f.source || '导入',
    level: undefined,
    description: f.desc || '',
    auto: false,
  }))

  const notes = old.notes || ''
  const appearance = notes.split('\n').filter((x) => x.startsWith('外貌'))[0]?.replace(/^外貌[:：]\s*/, '') || ''

  const character = {
    schemaVersion: 1,
    id: ID,
    name: old.name || NAME,
    playerName: old.playerName || '',
    portrait: null,
    classes: [{
      name: old.characterClass || '圣武士',
      subclass: old.subclass || '',
      level: old.level || 1,
      hitDie: paladin?.hitDie || 10,
    }],
    race: { name: old.race || '', subrace: '' },
    background: old.background || '',
    alignment: old.alignment || '',
    xp: old.xp || 0,
    abilities: {
      str: old.abilities?.str ?? 10,
      dex: old.abilities?.dex ?? 10,
      con: old.abilities?.con ?? 10,
      int: old.abilities?.int ?? 10,
      wis: old.abilities?.wis ?? 10,
      cha: old.abilities?.cha ?? 10,
    },
    saveProfs: old.saveProfs || [],
    skillProfs,
    skillExpertise: old.skillExpertise || [],
    toolProfs: [],
    languages: ['通用语', '天界语'],
    armorProfs: ['所有护甲', '盾牌'],
    weaponProfs: ['简易武器', '军用武器'],
    hp: { max: old.hp?.max || 1, current: old.hp?.current ?? old.hp?.max ?? 1, temp: old.hp?.temp || 0 },
    hitDice: { remaining: Math.min(hdRemaining, characterLevelOf(old)) },
    ac: { mode: 'manual', manual: old.acOverride ?? 19 },
    initiative: { mode: old.initOverride != null ? 'manual' : 'auto', manual: old.initOverride ?? null },
    speed: old.speed || 30,
    exhaustion: 0,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    concentration: null,
    spellcasting: {
      ability: old.spellcastingAbility || 'cha',
      slots: Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => {
          const key = String(i + 1)
          const v = old.spellSlots?.[key]
          return [key, { total: v?.total || 0, used: v?.used || 0 }]
        }),
      ),
      pactSlots: null,
      spells,
    },
    attacks,
    resources,
    inventory,
    currency: {
      pp: old.currency?.pp || 0,
      gp: old.currency?.gp || 0,
      ep: old.currency?.ep || 0,
      sp: old.currency?.sp || 0,
      cp: old.currency?.cp || 0,
    },
    features,
    roleplay: {
      personality: '',
      ideals: '',
      bonds: '',
      flaws: '',
      appearance,
      backstory: '',
      allies: '',
      notes,
    },
    audit,
    createdAt: old.updatedAt || Date.now(),
    updatedAt: Date.now(),
  }

  // 头像
  if (old.portrait) {
    const src = path.join(OLD_ROOT, old.portrait.replace(/^assets\//, 'assets/'))
    if (fs.existsSync(src)) {
      const fname = `${ID}.png`
      fs.copyFileSync(src, path.join(PORTRAITS_DIR, fname))
      character.portrait = `/media/portraits/${fname}`
    }
  }

  const saved = saveCharacter(ID, character, { backup: false })
  console.log(`[migrate] 已写入 ${path.join(CHARS_DIR, ID + '.json')}`)
  console.log(`[migrate] ${saved.name}：${saved.classes[0].name} ${saved.classes[0].level} 级，${saved.spells?.length ?? saved.spellcasting.spells.length} 个法术，${saved.inventory.length} 件物品，${saved.audit.length} 条校对记录`)
  for (const a of saved.audit) console.log(`  [${a.severity}] ${a.title}`)
}

function characterLevelOf(old) {
  return old.level || 1
}

main()
