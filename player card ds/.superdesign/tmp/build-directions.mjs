import fs from 'node:fs'

const PORTRAIT =
  'https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/2ac28d3e-2fd1-446b-929e-c4eb16d4dd50/content-assets/portrait-justinian01/justinian01.png'

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const icon = (path, size = 14) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`

const icons = {
  search: icon('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  moon: icon('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>'),
  save: icon('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.37.43.68.8.82H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'),
  shield: icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'),
  heart: icon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>'),
  zap: icon('<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>'),
  book: icon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'),
  scroll: icon('<path d="M8 3h10a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><path d="M8 3v18M12 8h6M12 12h6"/>'),
  backpack: icon('<path d="M6 8V6a6 6 0 0 1 12 0v2"/><path d="M4 8h16l-1 12H5L4 8Z"/><path d="M9 12v4M15 12v4"/>'),
  spark: icon('<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>'),
  check: icon('<path d="m20 6-11 11-5-5"/>'),
  alert: icon('<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
  sword: icon('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M5 21l3-3M16 16l3 3"/>'),
  sparkles: icon('<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>'),
  chevron: icon('<path d="m6 9 6 6 6-6"/>'),
  arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
}

const data = {
  name: '查士丁尼',
  player: '玩家名',
  race: '阿斯莫',
  background: '贵族',
  alignment: '未设定',
  className: '圣武士',
  subclass: '奉献之誓',
  level: 4,
  hitDie: 'd10',
  xp: 2751,
  nextXp: 6500,
  abilityList: [
    { en: 'STR', label: '力量', score: 18, mod: '+4', save: '+4', saveProf: false },
    { en: 'DEX', label: '敏捷', score: 14, mod: '+2', save: '+2', saveProf: false },
    { en: 'CON', label: '体质', score: 14, mod: '+2', save: '+2', saveProf: false },
    { en: 'INT', label: '智力', score: 11, mod: '+0', save: '+0', saveProf: false },
    { en: 'WIS', label: '感知', score: 11, mod: '+0', save: '+2', saveProf: true },
    { en: 'CHA', label: '魅力', score: 16, mod: '+3', save: '+5', saveProf: true },
  ],
  skills: [
    { abbr: 'STR', name: '运动', mod: '+4', prof: true },
    { abbr: 'DEX', name: '体操', mod: '+2', prof: false },
    { abbr: 'DEX', name: '巧手', mod: '+2', prof: false },
    { abbr: 'DEX', name: '隐匿', mod: '+2', prof: false },
    { abbr: 'INT', name: '奥秘', mod: '+0', prof: false },
    { abbr: 'INT', name: '历史', mod: '+2', prof: false },
    { abbr: 'INT', name: '调查', mod: '+0', prof: false },
    { abbr: 'INT', name: '自然', mod: '+2', prof: false },
    { abbr: 'INT', name: '宗教', mod: '+2', prof: true },
    { abbr: 'WIS', name: '驯兽', mod: '+0', prof: false },
    { abbr: 'WIS', name: '洞悉', mod: '+2', prof: true },
    { abbr: 'WIS', name: '医药', mod: '+0', prof: false },
    { abbr: 'WIS', name: '察觉', mod: '+2', prof: true },
    { abbr: 'WIS', name: '生存', mod: '+0', prof: false },
    { abbr: 'CHA', name: '欺瞒', mod: '+3', prof: false },
    { abbr: 'CHA', name: '威吓', mod: '+5', prof: true },
    { abbr: 'CHA', name: '表演', mod: '+3', prof: false },
    { abbr: 'CHA', name: '游说', mod: '+5', prof: true },
  ],
  passives: [
    { name: '被动察觉', value: 12 },
    { name: '被动调查', value: 10 },
    { name: '被动洞悉', value: 12 },
  ],
  hp: { current: 41, max: 41, temp: 0 },
  ac: 19,
  initiative: '+2',
  speed: 30,
  hitDice: { remaining: 3, total: 4 },
  deathSaves: { successes: 0, failures: 0 },
  exhaustion: 0,
  concentration: '无专注',
  conditions: [],
  attacks: [
    { name: '魔法长剑', ability: '力量', prof: true, magic: '+1', damage: '1d8+5', type: '挥砍', range: '5尺', hit: '+7' },
    { name: '标枪', ability: '力量', prof: true, magic: '0', damage: '1d6+4', type: '穿刺', range: '30/120', hit: '+6' },
  ],
  spellStats: { dc: 13, attack: '+5', ability: '魅力', prepared: 9, limit: 5, slots: '3 / 3 · 1环' },
  spells: [
    { level: '戏法', name: '光亮术', school: '塑能', time: '1 动作', range: '接触', duration: '1 小时', tags: ['已准备'], note: '让物件发出 20 尺明亮光照，持续 1 小时。' },
    { level: '戏法', name: '神导术', school: '预言', time: '1 动作', range: '接触', duration: '专注至多 1 分钟', tags: ['已准备', '专注'], note: '目标一次属性检定额外 +1d4。' },
    { level: '戏法', name: '圣火术', school: '塑能', time: '1 动作', range: '60 尺', duration: '立即', tags: ['已准备'], note: '目标敏捷豁免失败受 1d8 光耀伤害。' },
    { level: '1环', name: '防护善恶', school: '防护', time: '1 动作', range: '接触', duration: '专注至多 10 分钟', tags: ['已准备', '专注'], note: '目标对异界、不死生命的攻击检定具有优势，免疫魅惑、恐慌、附身。' },
    { level: '1环', name: '虔诚护盾', school: '防护', time: '1 附赠动作', range: '60 尺', duration: '专注至多 10 分钟', tags: ['已准备', '专注'], note: '目标获得 +2 AC。' },
    { level: '1环', name: '祝福术', school: '附魔', time: '1 动作', range: '30 尺', duration: '专注至多 1 分钟', tags: ['已准备', '专注'], note: '至多 3 个目标，攻击检定和豁免额外 +1d4。' },
    { level: '1环', name: '强令对决', school: '附魔', time: '1 附赠动作', range: '30 尺', duration: '专注至多 1 分钟', tags: ['已准备', '专注'], note: '目标被强迫与你决斗，攻击其他目标时具有劣势。' },
    { level: '1环', name: '净化食物', school: '变化', time: '1 动作', range: '10 尺', duration: '立即', tags: ['已准备', '仪式'], note: '净化食物与饮水中的毒素和疾病。' },
    { level: '1环', name: '印记斩', school: '塑能', time: '1 附赠动作', range: '自身', duration: '专注至多 1 分钟', tags: ['已准备', '专注'], note: '下一次武器命中额外造成 1d6 光耀伤害。' },
  ],
  resources: [
    { name: '圣疗', source: '圣武士', total: 20, used: 0, reset: '长休' },
    { name: '神圣感知', source: '圣武士', total: 3, used: 0, reset: '长休' },
    { name: '引导神力', source: '奉献之誓', total: 2, used: 0, reset: '短休' },
    { name: '天界奇兵', source: '阿斯莫', total: 1, used: 0, reset: '长休' },
  ],
  inventory: [
    { name: '魔法长剑', note: '武器 · +1', qty: 1, weight: 3, equipped: true, attuned: false, detail: '+7 命中 · 1d8+5 挥砍' },
    { name: '板甲', note: '重甲 · AC 18', qty: 1, weight: 65, equipped: true, attuned: false, detail: 'AC 18，隐匿劣势' },
    { name: '盾牌', note: '盾牌 · +2 AC', qty: 1, weight: 6, equipped: true, attuned: false, detail: '+2 AC' },
    { name: '标枪', note: '简易武器', qty: 5, weight: 2, equipped: false, attuned: false, detail: '+6 命中 · 1d6+4 穿刺' },
    { name: '治疗药水', note: '药水', qty: 2, weight: 0.5, equipped: false, attuned: false, detail: '恢复 2d4+2 HP' },
    { name: '圣徽', note: '冒险用品', qty: 1, weight: 0.1, equipped: false, attuned: false, detail: '圣武士法器' },
    { name: '冒险者背包', note: '冒险用品', qty: 1, weight: 5, equipped: false, attuned: false, detail: '绳索、火把、口粮' },
    { name: '丝绸绳索', note: '冒险用品', qty: 1, weight: 10, equipped: false, attuned: false, detail: '50 尺' },
  ],
  features: [
    { name: '圣武士法术', source: '圣武士 · 2 级', desc: '你准备并使用魅力作为施法属性的圣武士法术。' },
    { name: '神圣感知', source: '圣武士 · 1 级', desc: '用一个动作感知附近的天界生物、邪魔与不死生物。' },
    { name: '圣疗', source: '圣武士 · 1 级', desc: '你拥有一个 20 点的圣疗池，用一个动作触碰治疗。' },
    { name: '战斗风格：防御', source: '圣武士 · 2 级', desc: '穿着护甲时 AC 获得 +1 加值。' },
    { name: '引导神力', source: '圣武士 · 3 级', desc: '每个短休可引导神力 2 次，驱动神圣感知与强令对决。' },
    { name: '誓言法术', source: '奉献之誓 · 3 级', desc: '誓言法术始终准备，不计入准备法术数量。' },
    { name: '奉献之誓', source: '奉献之誓 · 3 级', desc: '诚实、勇敢、慈悲、荣耀。你的誓言是你力量的源泉。' },
    { name: '守则', source: '圣武士 · 3 级', desc: '遵守奉献之誓的守则；违背守则可能失去职业特性。' },
  ],
  roleplay: [
    { label: '性格特质', value: '我说话时总是先掂量对方的身份；我最在意的是承诺是否兑现。' },
    { label: '理想', value: '我信仰荣耀与责任；我决不允许无辜者在眼前受伤。' },
    { label: '羁绊', value: '我欠老团长一条命；我曾用生命保护过圣殿里的孩子们。' },
    { label: '缺陷', value: '我无法抗拒决斗的诱惑；我总是自觉地替别人承担危险。' },
    { label: '外貌', value: '银色卷发，眼睛与皮肤白里透金。26 岁，5 尺 5，150 磅。', wide: true },
    { label: '背景故事', value: '出身于没落贵族家庭，在圣殿骑士团中长大。为了兑现一条未能完成的誓言，我离开故乡成为冒险者。' },
    { label: '盟友与组织', value: '圣殿骑士团、旧日的同袍、一位仍在寻找的导师。' },
    { label: '战役笔记', value: '当前目标：追查失落圣物的下落；注意与银月同盟的关系。' },
  ],
}

const abilityCard = (a) => `
  <div class="ability">
    <div class="ability-top"><span>${a.label}</span><span>${a.en}</span></div>
    <div class="ability-score">${a.score}</div>
    <div class="ability-mod">${a.mod}</div>
    <div class="save ${a.saveProf ? 'on' : ''}"><span class="dot"></span>豁免 ${a.save}</div>
  </div>`

const skillRow = (s) => `
  <div class="skill">
    <span class="skill-abbr">${s.abbr}</span>
    <span class="skill-name">${s.name}</span>
    <span class="prof-dot ${s.prof ? 'on' : ''}" title="熟练"></span>
    <strong>${s.mod}</strong>
  </div>`

const spellRow = (s) => `
  <div class="spell">
    <div class="spell-main">
      <div class="spell-title"><strong>${s.name}</strong>${s.tags.map((t) => `<span class="tag ${t === '专注' ? 'blue' : t === '仪式' ? 'gold' : 'green'}">${t}</span>`).join('')}</div>
      <div class="spell-meta">${s.level} · ${s.school} · ${s.time} · ${s.range} · ${s.duration}</div>
      <div class="spell-note">${s.note}</div>
    </div>
    <span class="spell-cast" title="施放">${icons.zap}</span>
  </div>`

const featureRow = (f) => `
  <div class="feature">
    <div class="feature-title"><strong>${f.name}</strong><span>${f.source}</span></div>
    <p>${f.desc}</p>
  </div>`

const inventoryRow = (i) => `
  <div class="item">
    <span class="check ${i.equipped ? 'on' : ''}" title="已装备">${i.equipped ? icons.check : ''}</span>
    <span class="item-name"><strong>${i.name}</strong><small>${i.note} · ${i.weight} 磅</small></span>
    <span class="item-qty">×${i.qty}</span>
    <span class="item-detail">${i.detail}</span>
  </div>`

const resourceRow = (r) => {
  const left = r.total - r.used
  const meter =
    r.total > 10
      ? `<div class="resource-bar"><span style="width:${Math.round((left / r.total) * 100)}%"></span></div>`
      : `<div class="pips">${Array.from({ length: r.total }, (_, i) => `<span class="pip ${i < r.used ? 'used' : ''}"></span>`).join('')}</div>`
  return `
  <div class="resource">
    <div class="resource-name"><strong>${r.name}</strong><small>${r.source} · ${r.reset}</small></div>
    ${meter}
    <span class="resource-count">${left} / ${r.total}</span>
  </div>`
}

const roleField = (r) => `
  <div class="role-field ${r.wide ? 'wide' : ''}">
    <span class="role-label">${r.label}</span>
    <p>${r.value}</p>
  </div>`

function topbar() {
  return `
  <header class="topbar">
    <div class="brand"><span class="brand-mark">D</span><span class="brand-name">角色卡 · 规则库</span></div>
    <nav class="nav" aria-label="主导航">
      <button class="nav-tab active">角色卡</button>
      <button class="nav-tab">规则库</button>
      <button class="nav-tab">速查</button>
    </nav>
    <div class="top-spacer"></div>
    <button class="char-switch"><span>查士丁尼 <small>圣武士 · 奉献之誓 4</small></span>${icons.chevron}</button>
    <span class="save"><i></i>已保存</span>
    <span class="actions">
      <button class="btn primary">${icons.search}检索</button>
      <button class="btn ghost">短休</button>
      <button class="btn ghost">长休</button>
      <button class="btn gold">升级 <i class="ready"></i></button>
      <button class="icon-btn" title="设置">${icons.settings}</button>
    </span>
  </header>`
}

function vitals() {
  return `
  <section class="vitals" aria-label="常驻战术条">
    <div class="vitals-id">
      <img src="${PORTRAIT}" alt="查士丁尼头像" loading="eager" decoding="sync">
      <div><strong>查士丁尼</strong><small>圣武士 · 奉献之誓 4</small></div>
    </div>
    <div class="vital hp-vital">
      <span class="vital-label">生命值</span>
      <div class="hp-line"><strong>41</strong><span>/ 41</span><em>临时 0</em></div>
      <div class="hp-track"><span style="width:100%"></span></div>
    </div>
    <div class="vital"><span class="vital-label">护甲</span><strong class="vital-number">19</strong><small>AC</small></div>
    <div class="vital"><span class="vital-label">先攻</span><strong class="vital-number">+2</strong><small>Init</small></div>
    <div class="vital"><span class="vital-label">法术位</span><strong class="vital-number">3 / 3</strong><small>1环</small></div>
    <div class="vital"><span class="vital-label">专注</span><strong class="vital-text">无专注</strong><small>状态：无</small></div>
  </section>`
}

function audit() {
  return `
  <section class="audit">
    <div class="audit-left">${icons.alert}<strong>导入校对</strong><span>旧角色数据与规则库比对完成，未静默覆盖自定义内容</span></div>
    <button class="audit-link">已自动修正 / 已处理 6 项 ${icons.chevron}</button>
  </section>`
}

function identity() {
  return `
  <section class="card identity-card identity-band">
    <div class="card-head"><div><span class="eyebrow">Identity</span><h2>冒险者身份</h2></div><span class="seal">第 4 级</span></div>
    <div class="identity">
      <div class="portrait"><img src="${PORTRAIT}" alt="查士丁尼头像" loading="eager" decoding="sync"><span class="portrait-edit">更换头像</span></div>
      <div class="identity-main">
        <h1 class="char-name">查士丁尼</h1>
        <div class="meta-line"><span>玩家 <em>玩家名</em></span><span>种族 <em>阿斯莫</em></span><span>背景 <em>贵族</em></span><span>阵营 <em>未设定</em></span></div>
        <div class="class-row"><span class="class-pill">圣武士</span><span class="subclass">奉献之誓</span><span class="level-pill">等级 4</span><span class="die">d10</span><button class="add-class">+ 兼职 / 添加职业</button></div>
      </div>
      <div class="xp-block">
        <div class="xp-line"><span><strong>2751</strong> XP</span><span>下一级 6500</span></div>
        <div class="xp-track"><span style="width:1%"></span></div>
        <div class="xp-foot"><span>1% 到 5 级</span><span class="xp-value">2751</span></div>
        <button class="btn gold full">升级向导 ${icons.arrow}</button>
      </div>
    </div>
  </section>`
}

function abilities() {
  return `
  <section class="card" id="abilities">
    <div class="card-head"><div><span class="eyebrow">Abilities & Skills</span><h2>属性、豁免与技能</h2><p class="card-sub">点数、熟练与专精都由这里驱动</p></div><span class="seal green">熟练 +2</span></div>
    <div class="abilities">${data.abilityList.map(abilityCard).join('')}</div>
    <div class="skills">${data.skills.map(skillRow).join('')}</div>
    <div class="passives">${data.passives.map((p) => `<span>${p.name} <strong>${p.value}</strong></span>`).join('')}</div>
    <div class="prof-lists">
      <div><span class="mini-label">护甲</span><div class="tags"><span class="tag">所有护甲</span><span class="tag">盾牌</span></div></div>
      <div><span class="mini-label">武器</span><div class="tags"><span class="tag">简易武器</span><span class="tag">军用武器</span></div></div>
      <div><span class="mini-label">工具</span><div class="tags"><span class="tag">盗贼工具</span></div></div>
      <div><span class="mini-label">语言</span><div class="tags"><span class="tag">通用语</span><span class="tag">天界语</span></div></div>
    </div>
  </section>`
}

function combat() {
  return `
  <section class="card" id="combat">
    <div class="card-head"><div><span class="eyebrow">Combat</span><h2>战斗状态</h2><p class="card-sub">HP、AC、先攻、状态与专注</p></div><span class="seal red">AC 手动</span></div>
    <div class="combat-grid">
      <div class="hp-block">
        <div class="hp-big"><strong>41</strong><span>/ 41</span><em>临时 0</em></div>
        <div class="hp-track big"><span style="width:100%"></span></div>
        <div class="hp-actions"><button class="btn danger">− 受伤</button><button class="btn success">+ 治疗</button><button class="btn ghost">回满</button></div>
        <div class="death"><span>死亡豁免</span><span class="save-dots"><i></i><i></i><i></i></span><span class="subtle">成功</span><span class="save-dots fail"><i></i><i></i><i></i></span><span class="subtle">失败</span></div>
      </div>
      <div class="stat-grid">
        <div class="stat"><span class="stat-icon">${icons.shield}</span><small>护甲等级</small><strong>19</strong><em>手动设定 19</em></div>
        <div class="stat"><span class="stat-icon">${icons.zap}</span><small>先攻</small><strong>+2</strong><em>手动</em></div>
        <div class="stat"><span class="stat-icon">${icons.arrow}</span><small>速度</small><strong>30 <span>尺</span></strong><em>步行</em></div>
        <div class="stat"><span class="stat-icon">${icons.heart}</span><small>生命骰</small><strong>3 / 4</strong><em>4d10</em></div>
      </div>
    </div>
    <div class="combat-foot">
      <div class="inline-field"><span>AC 模式</span><button class="mini-select">改回自动</button><strong>19</strong></div>
      <div class="inline-field"><span>先攻模式</span><button class="mini-select">改回自动</button><strong>+2</strong></div>
      <div class="inline-field"><span>速度</span><strong>30 尺</strong></div>
      <div class="inline-field"><span>力竭</span><span class="stepper">−<b>0</b>+</span></div>
      <div class="inline-field wide"><span>专注</span><span class="concentration">无专注</span></div>
      <div class="inline-field wide"><span>状态</span><button class="mini-select">添加状态...</button><span class="subtle">无</span></div>
    </div>
  </section>`
}

function attacks() {
  return `
  <section class="card" id="attacks">
    <div class="card-head"><div><span class="eyebrow">Attacks</span><h2>攻击</h2><p class="card-sub">命中与伤害由属性、熟练和魔法加值自动计算</p></div><span class="head-actions"><button class="btn ghost">${icons.search}检索武器</button><button class="btn ghost">${icons.plus}自定义</button></span></div>
    <div class="attack-list">
      <div class="attack-head"><span>武器</span><span>命中</span><span>伤害</span><span>射程</span></div>
      ${data.attacks.map((a) => `<div class="attack-row"><div class="attack-name"><strong>${a.name}</strong><small>${a.ability} · 熟练 · 魔法 ${a.magic}</small></div><span class="hit">${a.hit}</span><span class="attack-damage">${a.damage} <em>${a.type}</em></span><span class="attack-range">${a.range}</span></div>`).join('')}
    </div>
    <p class="table-hint">从「检索武器」添加的武器会自动生成攻击条目，并可在物品栏中勾选装备。</p>
  </section>`
}

function spells() {
  return `
  <section class="card" id="spells">
    <div class="card-head"><div><span class="eyebrow">Spellbook</span><h2>法术</h2><p class="card-sub">法术位、准备法术、专注与仪式标记</p></div><span class="head-actions"><button class="btn ghost">${icons.search}检索法术</button><button class="btn ghost">${icons.plus}自定义</button></span></div>
    <div class="spell-stats">
      <div class="spell-stat"><small>法术豁免 DC</small><strong>13</strong><em>8 + 熟练 + 魅力</em></div>
      <div class="spell-stat"><small>法术攻击</small><strong>+5</strong><em>熟练 + 魅力</em></div>
      <div class="spell-stat"><small>施法属性</small><strong>魅力</strong><em>圣武士</em></div>
      <div class="spell-stat warn"><small>准备法术</small><strong>9 / 5</strong><em>超出准备上限</em></div>
    </div>
    <div class="slot-row"><span class="mini-label">法术位</span><div class="slot-pips"><span class="pip used"></span><span class="pip used"></span><span class="pip used"></span></div><span class="slot-count">0 / 3 已消耗</span><span class="slot-label">1 环</span></div>
    <div class="spell-columns">
      <div class="spell-group"><div class="group-head">戏法 <span>3</span></div>${data.spells.filter((s) => s.level === '戏法').map(spellRow).join('')}</div>
      <div class="spell-group"><div class="group-head">1 环 <span>6</span><em>剩余法术位 3</em></div>${data.spells.filter((s) => s.level === '1环').map(spellRow).join('')}</div>
    </div>
    <p class="table-hint">准备法术超过上限时只提示，不阻止自定义配置。</p>
  </section>`
}

function resources() {
  return `
  <section class="card" id="resources">
    <div class="card-head"><div><span class="eyebrow">Resources</span><h2>职业资源</h2><p class="card-sub">每项资源按短休 / 长休恢复</p></div><button class="btn ghost">+ 自定义资源</button></div>
    <div class="resource-list">${data.resources.map(resourceRow).join('')}</div>
  </section>`
}

function inventory() {
  return `
  <section class="card" id="inventory">
    <div class="card-head"><div><span class="eyebrow">Inventory</span><h2>物品与财富</h2><p class="card-sub">负重、同调与金币</p></div><span class="head-actions"><button class="btn ghost">+ 自定义</button></span></div>
    <div class="inv-summary"><span>负重 <strong>87.2 / 270</strong> 磅</span><span>同调 <strong>0 / 3</strong></span><span>财富 <strong>612 gp</strong></span></div>
    <div class="ledger-table inv-table">
      <div class="thead"><span></span><span>名称</span><span>数量</span><span>重量</span><span>详情</span><span></span></div>
      ${data.inventory.map(inventoryRow).join('')}
    </div>
    <div class="coins"><span>PP <b>0</b></span><span>GP <b>612</b></span><span>EP <b>0</b></span><span>SP <b>149</b></span><span>CP <b>18</b></span></div>
  </section>`
}

function features() {
  return `
  <section class="card" id="features">
    <div class="card-head"><div><span class="eyebrow">Features</span><h2>特性与专长</h2><p class="card-sub">按来源分组，可展开查看规则</p></div><button class="btn ghost">${icons.book}检索规则</button></div>
    <div class="feature-grid">${data.features.map(featureRow).join('')}</div>
  </section>`
}

function roleplay() {
  return `
  <section class="card roleplay" id="roleplay">
    <div class="card-head"><div><span class="eyebrow">Roleplay</span><h2>角色扮演档案</h2><p class="card-sub">性格、理想、羁绊、缺陷与背景故事</p></div><span class="seal">手记</span></div>
    <div class="role-grid">${data.roleplay.map(roleField).join('')}</div>
  </section>`
}

function mobileNav() {
  return `
  <nav class="mobile-nav" aria-label="移动端导航">
    <button class="active">${icons.heart}<span>角色</span></button>
    <button>${icons.zap}<span>战斗</span></button>
    <button>${icons.sparkles}<span>法术</span></button>
    <button>${icons.backpack}<span>物品</span></button>
    <button>${icons.book}<span>规则</span></button>
  </nav>`
}

const css = String.raw`
:root{
  --bg:#efe4cc;--bg-deep:#e4d3b4;--panel:#fbf6ea;--panel-2:#f5ecda;--panel-3:#ece0c8;
  --ink:#1f1a14;--ink-soft:#463b2f;--muted:#6b5d49;--line:#d2c1a0;--line-strong:#a98e63;
  --oxblood:#8a2f2a;--oxblood-soft:#f1ded8;--green:#2f5d50;--green-soft:#dfe9e2;
  --blue:#355b78;--blue-soft:#dfe8ef;--gold:#8a5f20;--gold-soft:#f3e6c9;--loam:#241a12;
  --shadow:0 1px 0 rgba(58,40,18,.05),0 12px 28px rgba(58,40,18,.06);
  --serif:"Iowan Old Style","Palatino Linotype","Noto Serif SC","Songti SC",Georgia,serif;
  --sans:system-ui,"Noto Sans SC","Microsoft YaHei",sans-serif;
  --mono:ui-monospace,"SFMono-Regular",Consolas,"Liberation Mono",monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;min-width:320px;background:
  radial-gradient(1100px 700px at 10% -10%,rgba(255,252,242,.65),transparent 60%),
  radial-gradient(900px 600px at 100% 0%,rgba(169,119,47,.08),transparent 62%),
  radial-gradient(900px 700px at 50% 110%,rgba(107,68,38,.06),transparent 60%),
  var(--bg);
  color:var(--ink);font-family:var(--sans);font-size:13px;line-height:1.5}
button{font:inherit;cursor:pointer}
h1,h2,h3,h4,.serif{font-family:var(--serif);letter-spacing:.01em}
h1,h2,h3,h4,p{margin:0}
img{display:block;max-width:100%}
svg{flex:0 0 auto}
i,em{font-style:normal}
.page{min-height:100vh;padding-bottom:48px}
.mono,strong,.vital-number,.hit,.resource-count,.slot-count{font-variant-numeric:tabular-nums}

/* top bar */
.topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px clamp(14px,2.4vw,28px);background:color-mix(in srgb,var(--panel) 92%,transparent);border-bottom:1px solid var(--line);box-shadow:0 4px 18px rgba(58,40,18,.05);backdrop-filter:blur(14px) saturate(1.1)}
.brand{display:flex;align-items:center;gap:9px;white-space:nowrap}
.brand-mark{width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--gold);border-radius:2px;color:var(--gold);background:linear-gradient(160deg,rgba(201,154,71,.14),transparent);font-family:var(--serif);font-size:16px;font-weight:700}
.brand-name{font-family:var(--serif);font-weight:700;font-size:16px;letter-spacing:.14em;color:var(--ink)}
.nav{display:flex;align-items:center;gap:2px;padding:2px;border:1px solid var(--line);border-radius:2px;background:var(--panel-2)}
.nav-tab{border:0;background:transparent;color:var(--muted);padding:5px 11px;border-radius:2px;font-size:12.5px;white-space:nowrap}
.nav-tab.active{background:var(--ink);color:var(--panel)}
.top-spacer{flex:1 1 12px}
.char-switch{display:flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--panel-2);color:var(--ink);padding:5px 9px;border-radius:2px;font-size:12.5px;white-space:nowrap}
.char-switch small{color:var(--muted);font-size:11.5px}
.save{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--muted);white-space:nowrap}
.save i{width:6px;height:6px;border-radius:50%;background:var(--green)}
.actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--line-strong);background:var(--panel-2);color:var(--ink);border-radius:2px;font-size:12.5px;font-weight:600;line-height:1.2;padding:6px 10px;white-space:nowrap;transition:background .15s,color .15s,border-color .15s}
.btn:hover{background:var(--panel-3)}
.btn.primary{background:var(--green);border-color:var(--green);color:#f7f2e6}
.btn.primary:hover{background:color-mix(in srgb,var(--green) 88%,#000)}
.btn.gold{background:var(--gold-soft);border-color:var(--gold);color:var(--ink)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--muted)}
.btn.ghost:hover{background:var(--panel-2);color:var(--ink)}
.btn.danger{background:var(--oxblood);border-color:var(--oxblood);color:#fff8f1}
.btn.success{background:var(--green-soft);border-color:var(--green);color:var(--green)}
.btn.full{width:100%;justify-content:center;margin-top:8px}
.btn .ready{width:5px;height:5px;border-radius:50%;background:var(--gold)}
.icon-btn{width:30px;height:30px;display:grid;place-items:center;border:0;background:transparent;color:var(--muted);border-radius:2px}
.icon-btn:hover{background:var(--panel-2);color:var(--ink)}

/* vitals */
.vitals{position:sticky;top:56px;z-index:30;display:grid;grid-template-columns:1.25fr 1.35fr .6fr .6fr .68fr 1fr;gap:10px;align-items:center;max-width:1440px;margin:0 auto;padding:9px clamp(14px,2.4vw,28px);background:color-mix(in srgb,var(--panel) 96%,transparent);border-bottom:1px solid var(--line);box-shadow:0 8px 18px rgba(58,40,18,.05);backdrop-filter:blur(12px)}
.vitals-id{display:flex;align-items:center;gap:9px;min-width:0}
.vitals-id img{width:34px;height:38px;object-fit:cover;border:1px solid var(--line-strong);border-radius:2px}
.vitals-id strong{display:block;font-family:var(--serif);font-size:14px;line-height:1.2}
.vitals-id small{display:block;color:var(--muted);font-size:11px;white-space:nowrap}
.vital{padding-left:10px;border-left:1px solid var(--line);min-width:0}
.vital-label{display:block;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-family:var(--mono)}
.vital-number{font-family:var(--serif);font-size:21px;line-height:1.15;display:inline-block;margin-top:1px}
.vital-text{font-family:var(--serif);font-size:14px;line-height:1.2;display:block;margin-top:2px}
.vital small{display:block;font-size:10.5px;color:var(--muted)}
.hp-vital .hp-line{display:flex;align-items:baseline;gap:4px;margin-top:1px}
.hp-vital .hp-line strong{font-family:var(--serif);font-size:22px;line-height:1.1;color:var(--oxblood)}
.hp-vital .hp-line span{font-size:12px;color:var(--muted)}
.hp-vital .hp-line em{font-size:10.5px;color:var(--muted);margin-left:auto}
.hp-track{height:4px;background:var(--panel-3);border:1px solid var(--line);margin-top:4px;border-radius:99px;overflow:hidden}
.hp-track>span{display:block;height:100%;background:linear-gradient(90deg,var(--oxblood),#b86155)}
.hp-track.big{height:7px;margin-top:10px}
.dir-b .vitals{background:var(--loam);border-bottom-color:#0d0b09;color:var(--panel);box-shadow:0 8px 20px rgba(0,0,0,.22)}
.dir-b .vitals-id strong{color:var(--panel)}
.dir-b .vitals-id small{color:#b6a68c}
.dir-b .vital{border-left-color:#4a3f32}
.dir-b .vital-label,.dir-b .vital small{color:#b6a68c}
.dir-b .vital-number{color:#f3e9d7}
.dir-b .hp-vital .hp-line strong{color:#e5a39a}
.dir-b .hp-vital .hp-line span,.dir-b .hp-vital .hp-line em{color:#c9b79c}
.dir-b .hp-track{background:#3a2f24;border-color:#4a3f32}
.dir-b .hp-track>span{background:linear-gradient(90deg,#c96f64,#e5a39a)}

/* page layout */
.page-wrap{max-width:1440px;margin:0 auto;padding:16px clamp(14px,2.4vw,28px) 40px}
.audit{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;border:1px solid var(--line-strong);border-left:3px solid var(--gold);background:linear-gradient(90deg,rgba(154,109,40,.08),transparent);margin-bottom:14px}
.audit-left{display:flex;align-items:center;gap:7px;min-width:0;color:var(--ink-soft);font-size:12px}
.audit-left strong{font-family:var(--serif);color:var(--ink)}
.audit-left span{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.audit-left svg{color:var(--gold)}
.audit-link{border:0;background:transparent;color:var(--muted);font-size:11.5px;display:flex;align-items:center;gap:4px;white-space:nowrap}
.sheet-grid{display:grid;gap:16px;align-items:start}
.masonry{columns:3;column-gap:16px}
.masonry .card{break-inside:avoid;margin:0 0 16px;display:block;width:100%}
.b-grid{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:16px;align-items:start}
.b-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.roleplay-wrap{margin-top:16px}

/* card */
.card{background:var(--panel);border:1px solid var(--line);border-radius:2px;box-shadow:var(--shadow);position:relative;overflow:hidden}
.card::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);pointer-events:none}
.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px 15px 11px;border-bottom:1px solid var(--line)}
.eyebrow{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.card-head h2{font-size:18px;line-height:1.2;color:var(--ink);display:flex;align-items:center;gap:7px}
.card-sub{margin-top:3px;color:var(--muted);font-size:11.5px;line-height:1.45}
.seal{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line-strong);color:var(--muted);background:var(--panel-2);padding:2px 7px;font-size:10.5px;letter-spacing:.04em;white-space:nowrap;font-family:var(--mono)}
.seal.green{color:var(--green);border-color:color-mix(in srgb,var(--green) 40%,var(--line));background:var(--green-soft)}
.seal.red{color:var(--oxblood);border-color:color-mix(in srgb,var(--oxblood) 40%,var(--line));background:var(--oxblood-soft)}
.head-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
.card-body{padding:13px 15px 15px}

/* identity */
.identity-card .identity{display:grid;grid-template-columns:88px minmax(0,1fr);gap:14px;padding:14px 15px 0}
.portrait{position:relative;width:88px;height:102px;border:2px solid var(--gold);background:var(--panel-3);overflow:hidden}
.portrait img{width:100%;height:100%;object-fit:cover;filter:sepia(.08) contrast(1.02)}
.portrait-edit{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:10px;color:#fff;background:rgba(31,26,20,.62);padding:3px 0;opacity:0;transition:opacity .15s}
.portrait:hover .portrait-edit{opacity:1}
.char-name{font-size:34px;line-height:1.05;color:var(--ink);font-weight:700}
.meta-line{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:7px;color:var(--muted);font-size:11.5px}
.meta-line span{display:inline-flex;gap:4px;align-items:baseline;white-space:nowrap}
.meta-line em{color:var(--ink-soft);border-bottom:1px dotted var(--line-strong);padding-bottom:1px}
.class-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:10px}
.class-pill,.subclass,.level-pill,.die{border:1px solid var(--line);background:var(--panel-2);padding:3px 7px;font-size:11.5px;color:var(--ink-soft);white-space:nowrap}
.class-pill{font-weight:700;color:var(--ink)}
.die{font-family:var(--mono);font-size:10.5px;color:var(--muted)}
.add-class{border:1px dashed var(--line-strong);background:transparent;color:var(--muted);padding:3px 7px;font-size:11px;border-radius:2px}
.identity-band .identity{grid-template-columns:88px minmax(0,1fr) 280px;gap:16px;align-items:center;padding:14px 15px}
.identity-band .xp-block{padding:0 0 0 16px;border-left:1px solid var(--line);min-width:0}
.xp-block{padding:12px 15px 15px}
.xp-line{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);font-family:var(--mono)}
.xp-line strong{color:var(--ink);font-family:var(--serif);font-size:14px}
.xp-track{height:6px;background:var(--panel-3);border:1px solid var(--line);margin-top:5px;border-radius:99px;overflow:hidden}
.xp-track>span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),#c99a47)}
.xp-foot{display:flex;justify-content:space-between;margin-top:5px;color:var(--muted);font-size:10.5px}
.xp-value{border-bottom:1px dotted var(--line-strong);color:var(--ink-soft);font-family:var(--mono)}
.dir-b .identity-band .identity{grid-template-columns:72px minmax(0,1fr) 240px}
.dir-b .identity-band .portrait{width:72px;height:84px}
.dir-b .char-name{font-size:28px}

/* abilities */
.abilities{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:13px 15px 10px}
.ability{border:1px solid var(--line);background:var(--panel-2);padding:7px 8px 6px;text-align:center;position:relative}
.ability-top{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);letter-spacing:.08em;font-family:var(--mono)}
.ability-score{font-family:var(--serif);font-size:30px;line-height:1.1;margin-top:1px;font-variant-numeric:tabular-nums}
.ability-mod{display:inline-block;border:1px solid var(--line-strong);background:var(--panel);padding:0 7px;font-size:11.5px;font-weight:700;margin-top:1px}
.save{display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:10px;color:var(--muted)}
.save .dot{width:7px;height:7px;border-radius:50%;border:1px solid var(--line-strong);display:inline-block}
.save.on .dot{background:var(--green);border-color:var(--green)}
.skills{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;padding:2px 15px 10px}
.skill{display:grid;grid-template-columns:24px minmax(0,1fr) 14px 30px;align-items:center;gap:5px;border-bottom:1px dotted var(--line);padding:4px 0;font-size:11.5px}
.skill-abbr{font-family:var(--mono);font-size:9.5px;color:var(--muted);letter-spacing:.04em}
.skill-name{color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.skill strong{text-align:right;font-variant-numeric:tabular-nums;font-size:11.5px}
.prof-dot{width:9px;height:9px;border-radius:50%;border:1px solid var(--line-strong);justify-self:center}
.prof-dot.on{background:var(--green);border-color:var(--green)}
.passives{display:flex;flex-wrap:wrap;gap:10px;padding:8px 15px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);color:var(--muted);font-size:11px}
.passives strong{color:var(--ink);font-family:var(--serif);font-size:13px}
.prof-lists{padding:10px 15px 14px;display:flex;flex-direction:column;gap:7px}
.prof-lists>div{display:grid;grid-template-columns:44px minmax(0,1fr);gap:8px;align-items:baseline}
.mini-label{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.tags{display:flex;flex-wrap:wrap;gap:4px}
.tag{display:inline-flex;align-items:center;gap:3px;border:1px solid var(--line);background:var(--panel-2);color:var(--ink-soft);padding:1px 6px;font-size:10.5px;white-space:nowrap;border-radius:2px}
.tag.green{color:var(--green);border-color:color-mix(in srgb,var(--green) 35%,var(--line));background:var(--green-soft)}
.tag.blue{color:var(--blue);border-color:color-mix(in srgb,var(--blue) 35%,var(--line));background:var(--blue-soft)}
.tag.gold{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 35%,var(--line));background:var(--gold-soft)}

/* combat */
.combat-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;padding:13px 15px 10px}
.hp-block{min-width:0}
.hp-big{display:flex;align-items:baseline;gap:5px}
.hp-big strong{font-family:var(--serif);font-size:44px;line-height:1;color:var(--oxblood);font-variant-numeric:tabular-nums}
.hp-big span{color:var(--muted);font-size:14px}
.hp-big em{margin-left:auto;color:var(--muted);font-size:11px;border-bottom:1px dotted var(--line-strong)}
.hp-actions{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}
.hp-actions .btn{padding:5px 8px;font-size:11.5px}
.death{display:flex;align-items:center;gap:6px;margin-top:10px;color:var(--muted);font-size:10.5px;flex-wrap:wrap}
.save-dots{display:flex;gap:4px}
.save-dots i{width:9px;height:9px;border-radius:50%;border:1px solid var(--green);display:block}
.save-dots.fail i{border-color:var(--oxblood)}
.subtle{color:var(--muted)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.stat{border:1px solid var(--line);background:var(--panel-2);padding:7px 8px;position:relative;min-width:0}
.stat-icon{position:absolute;right:7px;top:7px;color:var(--muted)}
.stat small{display:block;font-size:10px;color:var(--muted);font-family:var(--mono);letter-spacing:.06em}
.stat strong{display:block;font-family:var(--serif);font-size:24px;line-height:1.15;margin-top:2px;font-variant-numeric:tabular-nums}
.stat strong span{font-size:12px;color:var(--muted)}
.stat em{display:block;font-size:10px;color:var(--muted);margin-top:1px}
.combat-foot{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;padding:10px 15px 14px;border-top:1px solid var(--line);margin-top:2px}
.inline-field{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);min-width:0}
.inline-field.wide{grid-column:span 2}
.inline-field strong{color:var(--ink);font-size:11.5px}
.mini-select{border:1px solid var(--line);background:var(--panel-2);color:var(--ink-soft);padding:2px 5px;font-size:10.5px;border-radius:2px;white-space:nowrap}
.stepper{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel-2);padding:1px 5px;border-radius:2px;color:var(--muted)}
.stepper b{color:var(--ink);font-family:var(--mono)}
.concentration{color:var(--muted);border:1px dashed var(--line-strong);padding:2px 7px;font-size:10.5px}
.dir-b .combat-grid{grid-template-columns:1.05fr 1fr}
.dir-b .hp-big strong{font-size:40px}

/* tables */
.ledger-table{padding:0 15px}
.thead,.trow{display:grid;align-items:center;gap:6px;border-bottom:1px solid var(--line)}
.attack-table .thead,.attack-table .trow{grid-template-columns:1.7fr .8fr .55fr .55fr .8fr .7fr .7fr .7fr .3fr}
.inv-table .thead,.inv-table .trow{grid-template-columns:18px 1.7fr .5fr .6fr 1.5fr .3fr}
.thead{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:7px 0 5px;border-bottom:1px solid var(--line-strong)}
.trow{padding:7px 0;font-size:11.5px;color:var(--ink-soft)}
.trow .name{font-weight:700;color:var(--ink);display:flex;flex-direction:column;gap:1px}
.trow .name small{font-weight:400;color:var(--muted);font-size:10px}
.trow .mono{font-family:var(--mono);font-size:11px}
.trow .hit{color:var(--green);font-weight:700;border:1px solid color-mix(in srgb,var(--green) 35%,var(--line));background:var(--green-soft);padding:1px 5px;justify-self:start;font-size:11px}
.trow .row-x{color:var(--muted);text-align:right;font-size:13px}
.table-hint{padding:7px 15px 12px;color:var(--muted);font-size:10.5px;line-height:1.45}
.attack-list{padding:4px 15px 0}
.attack-head,.attack-row{display:grid;grid-template-columns:minmax(0,1.4fr) 48px minmax(0,1fr) 56px;gap:8px;align-items:center;border-bottom:1px solid var(--line)}
.attack-head{padding:6px 0 5px;font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom-color:var(--line-strong)}
.attack-row{padding:8px 0;font-size:11.5px;color:var(--ink-soft)}
.attack-name{display:flex;flex-direction:column;gap:1px;min-width:0}
.attack-name strong{font-size:12px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.attack-name small{font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.attack-damage{font-family:var(--mono);font-size:10.5px;white-space:nowrap}
.attack-damage em{font-family:var(--sans);color:var(--muted)}
.attack-range{font-size:10.5px;color:var(--muted);white-space:nowrap}
.check{width:14px;height:14px;border:1px solid var(--line-strong);display:grid;place-items:center;color:var(--green);background:var(--panel)}
.check.on{background:var(--green-soft);border-color:var(--green)}
.check svg{width:9px;height:9px}
.item{display:grid;grid-template-columns:18px minmax(0,1.6fr) 34px minmax(0,1.2fr);align-items:center;gap:6px;border-bottom:1px solid var(--line);padding:6px 0;font-size:11.5px}
.item-name{display:flex;flex-direction:column;gap:1px;min-width:0}
.item-name strong{color:var(--ink);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-name small{color:var(--muted);font-size:10px}
.item-qty,.item-weight{font-family:var(--mono);font-size:10.5px;color:var(--ink-soft)}
.item-detail{color:var(--muted);font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.inv-summary{display:flex;flex-wrap:wrap;gap:8px 16px;padding:9px 15px;border-bottom:1px solid var(--line);color:var(--muted);font-size:10.5px}
.inv-summary strong{color:var(--ink);font-family:var(--mono);font-size:11px}
.coins{display:flex;flex-wrap:wrap;gap:6px;padding:9px 15px 13px;border-top:1px solid var(--line)}
.coins span{border:1px solid var(--line);background:var(--panel-2);padding:2px 7px;font-family:var(--mono);font-size:10px;color:var(--muted)}
.coins b{color:var(--ink);font-weight:700}

/* spells */
.spell-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:13px 15px 10px}
.spell-stat{border:1px solid var(--line);background:var(--panel-2);padding:7px 8px;min-width:0}
.spell-stat small{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.spell-stat strong{display:block;font-family:var(--serif);font-size:22px;line-height:1.15;margin-top:1px}
.spell-stat em{display:block;font-size:9.5px;color:var(--muted);margin-top:1px}
.spell-stat.warn{border-color:color-mix(in srgb,var(--oxblood) 35%,var(--line));background:var(--oxblood-soft)}
.spell-stat.warn strong{color:var(--oxblood)}
.slot-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 15px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--panel-2)}
.slot-pips{display:flex;gap:5px}
.pip{width:14px;height:14px;border-radius:50%;border:1px solid var(--line-strong);display:inline-block;background:var(--panel)}
.pip.used{background:var(--blue);border-color:var(--blue)}
.slot-count{font-family:var(--mono);font-size:10px;color:var(--muted)}
.slot-label{font-family:var(--mono);font-size:10px;color:var(--muted);margin-left:auto}
.spell-columns{display:grid;grid-template-columns:1fr;gap:0;padding:8px 15px 4px}
.spell-group{min-width:0}
.group-head{display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line-strong);padding:5px 0 4px;font-family:var(--serif);font-size:13px;font-weight:700;color:var(--ink)}
.group-head span{font-family:var(--mono);font-size:9.5px;color:var(--muted);font-weight:400}
.group-head em{margin-left:auto;font-family:var(--sans);font-size:9.5px;color:var(--muted);font-weight:400}
.spell{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px dotted var(--line);padding:7px 0}
.spell-main{min-width:0}
.spell-title{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.spell-title strong{font-size:12px;color:var(--ink)}
.spell-meta{font-family:var(--mono);font-size:9.5px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spell-note{font-size:10.5px;color:var(--ink-soft);line-height:1.45;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.spell-cast{color:var(--muted);opacity:.6;padding-top:2px}
.spell-cast:hover{opacity:1;color:var(--blue)}

/* resources */
.resource-list{padding:4px 15px 12px}
.resource{display:grid;grid-template-columns:minmax(0,1fr) 118px 38px;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
.resource-bar{height:6px;background:var(--panel-3);border:1px solid var(--line);border-radius:99px;overflow:hidden}
.resource-bar>span{display:block;height:100%;background:var(--ink)}
.resource-name{display:flex;flex-direction:column;gap:1px;min-width:0}
.resource-name strong{font-size:12px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.resource-name small{font-size:10px;color:var(--muted)}
.pips{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.resource .pip{width:12px;height:12px}
.resource .pip.used{background:var(--ink);border-color:var(--ink)}
.resource-count{font-family:var(--mono);font-size:10.5px;color:var(--ink-soft);min-width:34px;text-align:right}

/* features */
.feature-grid{display:grid;grid-template-columns:1fr;gap:0;padding:5px 15px 12px}
.feature{border-bottom:1px solid var(--line);padding:8px 0}
.feature-title{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.feature-title strong{font-size:12px;color:var(--ink)}
.feature-title span{font-family:var(--mono);font-size:9px;color:var(--muted);margin-left:auto}
.feature p{font-size:10.5px;color:var(--ink-soft);line-height:1.5;margin-top:2px}

/* roleplay */
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px;padding:6px 15px 14px}
.role-field{border-bottom:1px dotted var(--line);padding:8px 0;min-width:0}
.role-field.wide{grid-column:span 2}
.role-label{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.role-field p{font-size:12px;color:var(--ink-soft);line-height:1.6;min-height:38px}
.roleplay .card-head{border-bottom:1px solid var(--line)}
.dir-a .roleplay-wrap .card{margin-top:0}

/* mobile */
.mobile-nav{display:none}
@media(max-width:1050px){
  .masonry{columns:2}
  .b-grid{grid-template-columns:1fr}
  .vitals{grid-template-columns:1.2fr 1.3fr .7fr .7fr;row-gap:6px}
  .vitals .vital:nth-child(n+5){display:none}
}
@media(max-width:760px){
  body{font-size:13px;overflow-x:hidden}
  .topbar{padding:8px 12px;gap:8px;width:100%;overflow:hidden}
  .brand-name{display:none}
  .nav{order:3;width:100%;justify-content:space-between;overflow:hidden}
  .nav-tab{flex:1;text-align:center;padding:5px 2px;font-size:11.5px}
  .top-spacer{display:none}
  .char-switch{flex:1 1 0;min-width:0;max-width:calc(100vw - 92px);overflow:hidden}
  .char-switch span{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .char-switch small{display:none}
  .save{display:none}
  .actions .btn.ghost,.actions .btn.gold,.actions .icon-btn{display:none}
  .vitals{top:96px;grid-template-columns:1.2fr 1.4fr .8fr .8fr;padding:7px 12px;gap:6px;overflow:hidden}
  .vital{min-width:0}
  .vitals-id img{width:28px;height:32px}
  .vitals-id small{display:none}
  .vitals .vital:nth-child(n+5){display:none}
  .page-wrap{padding:12px 12px 84px}
  .audit{padding:7px 9px}
  .audit-left span{display:none}
  .card-head{padding:11px 12px 9px}
  .card-head h2{font-size:16.5px}
  .card-sub{font-size:11px}
  .card{min-width:0}
  .identity-card .identity{grid-template-columns:72px minmax(0,1fr);padding:12px 12px 0}
  .identity-card .portrait{width:72px;height:84px}
  .identity-main{min-width:0}
  .meta-line span{white-space:normal}
  .masonry{columns:1}
  .identity-band .xp-block{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding:10px 0 0}
  .dir-b .identity-band .identity{grid-template-columns:72px minmax(0,1fr)}
  .char-name{font-size:28px}
  .xp-block{padding:10px 12px 12px}
  .abilities{grid-template-columns:repeat(3,1fr);padding:12px 12px 8px}
  .ability{min-width:0}
  .skills{grid-template-columns:1fr;padding:2px 12px 8px}
  .prof-lists{padding:10px 12px 12px}
  .combat-grid{grid-template-columns:1fr;padding:12px 12px 8px}
  .combat-foot{grid-template-columns:1fr 1fr;padding:9px 12px 12px}
  .inline-field.wide{grid-column:span 2}
  .attack-head,.attack-row{grid-template-columns:minmax(0,1.4fr) 44px minmax(0,1fr)}
  .attack-head span:nth-child(4),.attack-row .attack-range{display:none}
  .item{grid-template-columns:18px minmax(0,1.6fr) 32px minmax(0,1fr)}
  .resource{grid-template-columns:minmax(0,1fr) 90px 38px}
  .spell-stats{grid-template-columns:1fr 1fr;padding:12px 12px 8px}
  .spell-columns{grid-template-columns:1fr;padding:8px 12px 4px}
  .slot-row{padding:8px 12px}
  .ledger-table{padding:0 12px}
  .resources,.features{padding-bottom:4px}
  .resource-list{padding:4px 12px 10px}
  .feature-grid{grid-template-columns:1fr;padding:5px 12px 10px}
  .role-grid{grid-template-columns:1fr;padding:6px 12px 12px}
  .role-field.wide{grid-column:span 1}
  .mobile-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:50;background:color-mix(in srgb,var(--panel) 96%,transparent);border-top:1px solid var(--line);backdrop-filter:blur(14px);padding:5px 6px calc(5px + env(safe-area-inset-bottom));justify-content:space-around}
  .mobile-nav button{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:0;background:transparent;color:var(--muted);min-height:48px;font-size:10.5px}
  .mobile-nav button.active{color:var(--ink)}
  .mobile-nav svg{width:16px;height:16px}
}
@media(max-width:420px){
  .vitals{grid-template-columns:1.15fr 1.25fr .7fr .7fr}
  .abilities{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hp-vital .hp-line em{display:none}
  .char-name{font-size:26px}
  .btn{font-size:12px;padding:5px 8px}
}
@media(prefers-reduced-motion:reduce){
  *{transition:none!important;animation:none!important;scroll-behavior:auto!important}
}
`

function page(direction) {
  const isA = direction === 'a'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>冒险者手记 · 查士丁尼 — ${isA ? '边注档案' : '战桌仪表'}</title>
<link rel="preload" as="image" href="${PORTRAIT}">
<style>${css}</style>
</head>
<body>
<div class="page dir-${direction}">
  ${topbar()}
  ${vitals()}
  <main class="page-wrap">
    ${audit()}
    ${identity()}
    ${isA
      ? `<div class="masonry">${abilities()}${combat()}${spells()}${attacks()}${resources()}${inventory()}${features()}</div>`
      : `<div class="b-grid"><div class="b-col">${combat()}${attacks()}${spells()}</div><div class="b-col">${abilities()}${resources()}${inventory()}${features()}</div></div>`}
    <div class="roleplay-wrap">${roleplay()}</div>
  </main>
  ${mobileNav()}
</div>
</body>
</html>`
}

fs.writeFileSync('.superdesign/tmp/direction-a.html', page('a'), 'utf8')
fs.writeFileSync('.superdesign/tmp/direction-b.html', page('b'), 'utf8')
console.log('wrote direction-a.html and direction-b.html')
