# D&D 角色卡 · 视觉设计方向

> 版本：2026-10-22  
> 范围：只讨论前端表现层。数据模型、计算、API、存档逻辑均不改变。  
> 决策：**2026-10-22 用户选定方向 A「边注档案」并已落地到代码**；方向 B 保留为战术化备选。  
> 画布项目：[D&D 角色卡 · 冒险者手记视觉方向](https://superdesign.dev/teams/b3a3899a-8b03-4b9d-bdb7-058e0dc886c5/projects/2ac28d3e-2fd1-446b-929e-c4eb16d4dd50)

---

## 1. 一页结论

当前角色卡的功能完整、信息齐全，但视觉上更像“把所有面板铺在一张羊皮纸上”：高频战术信息（HP/AC/先攻/法术位）分散在滚动区，身份、校对、属性、战斗几乎同一视觉权重，字号偏小，徽章颜色过多；桌面上左栏只放了两块面板，右侧却有六块，形成明显空洞。

推荐的视觉方向是 **「冒险者手记 / The Adventurer's Ledger」**：把角色卡当成一本角色自己维护的冒险手记，而不是一叠卡片。纸是画布，墨是界面；数字按账本排版，状态用边注和印章标记。核心结构是：

1. 顶栏下方新增**常驻战术条（Vitals Ledger）**，HP、AC、先攻、法术位、专注/状态始终可见。
2. 身份区变成一条横向“档案抬头”，不再占据一整块纵向面板。
3. 八个分区重新分配，消除左栏空洞；校对降级为一条可折叠的行内提示。
4. 用一套严格的语义色、字号下限和“可编辑/只读”区分，替代当前的颜色噪音与输入框混淆。

画布上有两个同族方向：

- **A · 边注档案**：三列分组（属性/物品、战斗/法术、攻击/特性/资源），编辑感最强，适合阅读角色故事与长文。
- **B · 战桌仪表**：深色战术条 + 双列 7/5，动作优先，适合跑团桌边一瞥。

**用户选定 A 作为落地方向**，B 保留为战术化备选。理由见第 4 节。

---

## 2. 现状诊断

### 2.1 证据来源

- 实际渲染截图：`screenshots/baseline-1440-light.png`（1440×3799）、`baseline-1440-dark.png`、`baseline-390-light.png`（390×6697）。
- 代码与样式：`src/styles.css`、`src/pages/CharacterPage.tsx`、`src/App.tsx`、`src/components/*`。
- 交接文档：`PROJECT_HANDOFF.md` §7.2。
- 测试基线：`npm test` 当前 18 通过 / 1 失败（`tests/calc.test.ts:42` 期望准备法术 11，当前数据实际 9；这是数据与旧断言不一致，不是本次改动引入）。

### 2.2 P0 — 影响跑团时的高频使用

**1. 战术信息被埋进滚动区。**  
HP 在 `CombatPanel`，AC/先攻/速度/生命骰挤在战斗面板右半区的四个窄格里，法术位在更下方的 `SpellsPanel`；顶栏只有休息与升级，没有常驻生命线。桌面 1440 下页面高 3799px，跑团中最常看的几个数字分散在 400–2000px 的不同位置。  
证据：`CharacterPage.tsx:54-67`、`CombatPanel.tsx:84-105`、`App.tsx:401-439`。

**2. 视觉层级扁平，校对面板抢占首屏。**  
身份、导入校对、属性、战斗四块几乎同一权重；校对是导入期产物，却在正常使用时占一整块全宽卡片，且大多处于“已处理 6 项”的折叠状态，留下一块空旷的米色区域。  
证据：`CharacterPage.tsx:33-67`、`AuditPanel.tsx:16-55`；截图顶部 y≈300–440。

**3. 字号对中国读者偏小。**  
大量标签、表头、meta 使用 0.6–0.78rem（约 9.6–12.5px）；中文长文本（法术描述、特性说明、角色背景）尤其吃力。浅色主题下 `--muted (#7d6c55)` 在 `--panel-2 (#f5ecd9)` 上的对比度约 **4.31:1**，低于 WCAG AA 的 4.5:1。  
证据：`styles.css:5-29` 及各面板；`styles.css` 中 0.6rem 出现于 badge、表头、技能行、提示等。

### 2.3 P1 — 影响可读性与编辑效率

**4. 编辑态与只读态混淆。**  
输入框和展示盒同底色、同边框；Hero 的玩家/种族/背景/阵营字段在未 hover 时几乎不可见；AC、先攻、命中加值、技能加值等计算值不可编辑，但视觉上与输入框无差别。  
证据：`SheetHero.tsx:91-128`、`styles.css:584-590`、`AttackPanel.tsx:68-91`。

**5. 徽章与颜色噪音。**  
金、绿、红、蓝同时出现在大多数行；金色既做装饰、又做警告、又做进度、又做按钮。法术行同时有“已准备 / 专注 / 仪式 / 圣武士”等多个 pill，眼睛不知道哪个是决策信息。  
证据：`SpellsPanel.tsx:162-257`、`styles.css` 的 `.badge` 系列；截图法术区 y≈1050–1850。

**6. 桌面双栏失衡。**  
左栏只有属性 + 角色扮演，右栏有战斗、攻击、法术、资源、物品、特性六块；左栏在角色扮演下方留下约 900px 的空白，右栏继续向下延伸。1050px 才分栏，常见 1280 笔记本已经是双栏。  
证据：`styles.css:157-164`、`CharacterPage.tsx:54-67`、整页截图左侧 y≈2900–3799。

**7. 移动端首屏被顶栏吃掉。**  
390 下顶栏多行堆叠（交接文档估算约 250px），固定底栏有 6 项；攻击/物品表在窄屏横向滚动；点击目标偏小：法术位点 14px、熟练切换 17px、死亡豁免点 12px。  
证据：`styles.css:538-565`、`ui.tsx:220-254`、`AttackPanel.tsx:56-92`、`InventoryPanel.tsx:72-98`；`baseline-390-light.png`。

**8. 表格过宽。**  
攻击表 9 列、物品表 7 列，`min-width: 560px`，平板宽度即开始横滚；在 390 下只能看到前几列。  
证据：`styles.css` 的 `.sheet-table` / `.table-wrap`、`AttackPanel.tsx:56-92`、`InventoryPanel.tsx:72-98`。

### 2.4 P2 — 技术债与体验细节

**9. `Toggle` 组件完全没有样式。**  
`ui.tsx:244-254` 输出 `toggle` / `toggle-box` / `on` 类，`styles.css` 没有任何对应规则；装备、同调、熟练开关实际是裸按钮。这是真实缺陷，不是审美问题。

**10. 样式债。**  
`.spell-cast-meta` 在 `styles.css:402` 与 `:649` 重复定义且 gap 冲突；`.hero-select`、`.attack-table` 是死类；Tailwind 配置里的 `parchment/ink/brown/gold/forest/wine` 与 CSS 变量不一致，且没有任何 TSX 工具类使用。

**11. 无障碍与键盘。**  
没有 `:focus-visible` 样式（只有输入框 focus ring），没有 `prefers-reduced-motion` 处理；角色名是 `<h1>` 之外的 input，页面没有真正的 h1；升级按钮有无限金色脉冲。

**12. 弹窗密度高。**  
升级、设置、检索三个弹窗信息密集，缺少步骤/分组节奏；升级预览虽然有实时差异，但视觉上仍是多列表单。

---

## 3. 视觉方向：冒险者手记

### 3.1 主张

> 角色卡不是仪表盘，也不是一叠卡片。它是一本被翻旧的手记：身份写在抬头，生命与战术记在书脊，属性是账本，法术是索引，角色故事是页边注。

### 3.2 六条原则

1. **纸是画布，墨是界面。** 保留羊皮纸的暖底，但减少渐变、阴影和“卡片套卡片”；主要靠 1px 墨线和留白分层。
2. **战术信息常驻。** HP、AC、先攻、法术位、专注/状态在顶栏下方有一条常驻带，滚动时仍可见。
3. **一屏之内有主次。** 身份 → 当前回合（战斗/攻击/法术）→ 资源/物品/特性 → 角色故事；校对降级为行内提示。
4. **颜色必须有语义。** 红只用于 HP/伤害/死亡豁免；绿只用于主操作/成功/熟练；蓝只用于法术位/专注/奥术；金只用于等级/XP/进度。其余用墨色和纸色。
5. **可编辑与只读一眼可分。** 可编辑值有可见的纸面凹槽或虚线底边；计算值用纯文本，必要时加“自动”小标。
6. **中文字号有下限。** 元数据不低于 11.5px，正文 13px，表格 13px；数字用 tabular-nums，大数字用衬线。

### 3.3 签名元素：Vitals Ledger

一条约 68–76px 的常驻带，包含：

- 头像小块 + 姓名 + 职业/等级（A 为纸面，B 为深色 loam 带）
- HP 当前/上限/临时 + 细尺条
- AC、先攻
- 法术位摘要
- 专注 + 至多三个状态印章

它不是新功能，只是把现有 `CombatPanel` 和 `SpellsPanel` 里的数字以只读方式汇总到顶部；编辑仍在原面板完成。

### 3.4 两个画布表达

| | A · 边注档案 | B · 战桌仪表 |
|---|---|---|
| 布局 | 身份抬头 + 三列分组 + 全宽角色故事 | 深色战术条 + 7/5 双列 + 全宽角色故事 |
| 阅读顺序 | 左→中→右，像翻档案 | 左（战斗/攻击/法术）→ 右（属性/资源/物品/特性） |
| 气质 | 编辑、文学、页边注 | 战术、桌边、仪表 |
| 优点 | 三列高度自动平衡，无左栏空洞；适合长文 | 动作优先，HP/AC/先攻一瞥可见；深色带形成强识别 |
| 代价 | 三列顺序不完全是阅读顺序；中间法术列较长 | 深色带在浅色主题里较重；右栏偏“资料” |
| 画布 | [方向 A](https://p.superdesign.dev/draft/d60f8da3-b200-4669-89c4-e7dcc1888e8b) | [方向 B](https://p.superdesign.dev/draft/fb6af6e6-07a3-4791-abf9-22d69be8b0b8) |
| 截图 | `screenshots/dir-a-1440.png` / `dir-a-390.png` | `screenshots/dir-b-1440.png` / `dir-b-390.png` |

**已选定 A 并落地。** A 的三列分组和全宽角色故事最贴近“冒险者手记”的编辑气质：最大列高差约 333px，规避了早期左栏约 900px 的空洞；身份抬头 + 常驻战术条仍然保留，跑团所需的 HP/AC/先攻/法术位不会丢。B 的深色战术条和 7/5 动作优先布局更适合“桌边一瞥”，如果之后想要更强的战术感，可以在 A 的 token 和组件基础上再切到 B，而不需要重做数据层。

---

## 4. 视觉系统

### 4.1 色彩 token（浅色 · 日光纸）

| Token | 值 | 角色 |
|---|---|---|
| `--bg` | `#efe4cc` | 页面羊皮纸底 |
| `--bg-deep` | `#e4d3b4` | 页边/更深纸色 |
| `--panel` | `#fbf6ea` | 主纸面 |
| `--panel-2` | `#f5ecda` | 内嵌字段/表头 |
| `--panel-3` | `#ece0c8` | 按下/轨道 |
| `--ink` | `#1f1a14` | 主文字 |
| `--ink-soft` | `#463b2f` | 正文 |
| `--muted` | `#6b5d49` | 标签/元数据 |
| `--line` | `#d2c1a0` | 细线 |
| `--line-strong` | `#a98e63` | 强线/输入边框 |
| `--oxblood` | `#8a2f2a` | HP/伤害/死亡豁免 |
| `--oxblood-soft` | `#f1ded8` | HP 浅底 |
| `--green` | `#2f5d50` | 主操作/成功/熟练 |
| `--green-soft` | `#dfe9e2` | 成功浅底 |
| `--blue` | `#355b78` | 法术位/专注/奥术 |
| `--blue-soft` | `#dfe8ef` | 奥术浅底 |
| `--gold` | `#8a5f20` | 等级/XP/进度（仅此） |
| `--gold-soft` | `#f3e6c9` | XP 浅底 |
| `--loam` | `#241a12` | 深色战术条/印章，不做正文底色 |
| `--radius` | `2px` | 印刷式小圆角 |

### 4.2 色彩 token（深色 · 夜账本）

| Token | 值 |
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

### 4.3 对比度（WCAG 2.1）

| 组合 | 比值 | 结论 |
|---|---:|---|
| 浅色 ink / panel | 16.01 | AAA |
| 浅色 ink-soft / panel | 10.10 | AAA |
| 浅色 muted / panel | 5.92 | AA |
| 浅色 muted / panel-2 | 5.44 | AA |
| 浅色 oxblood / panel | 7.72 | AAA |
| 浅色 green / panel | 6.95 | AA |
| 浅色 blue / panel | 6.67 | AA |
| 浅色 gold / panel | 5.21 | AA |
| 浅色 gold / gold-soft | 4.54 | AA（临界，仅用于 14px 以上/粗体） |
| 深色 ink / panel | 13.89 | AAA |
| 深色 muted / panel-2 | 6.43 | AA |
| 深色 oxblood / panel | 6.33 | AA |
| 深色 green / panel | 7.85 | AAA |
| 深色 blue / panel | 7.75 | AAA |
| 深色 gold / panel | 7.50 | AAA |

对照：现状 `--muted #7d6c55` 在 `--panel-2 #f5ecd9` 上约 **4.31:1**，不达标；新 token 在同一组合上升到 **5.44:1**。

### 4.4 字体与字号

- 显示衬线：`"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Songti SC", Georgia, serif` — 身份、面板标题、大数字。
- 正文/控件无衬线：`system-ui, "Noto Sans SC", "Microsoft YaHei", sans-serif`。
- 数字/标签：同一无衬线 + `font-variant-numeric: tabular-nums`；拉丁小标签可用 `ui-monospace, Consolas`。
- 不引入网络字体，保持离线可用。

| 角色 | 字号 | 说明 |
|---|---|---|
| 微型标签/表头 | 0.72rem (11.5px) | 全大写拉丁加字距；中文不加大写 |
| 元数据 | 0.75rem (12px) | 行高 1.45 |
| 正文/输入 | 0.82rem (13px) | 行高 1.5 |
| 表格单元 | 0.82rem (13px) | tabular-nums |
| 强调行 | 0.9rem (14.4px) | 行标题 |
| 面板标题 | 1.12rem (18px) | 衬线 700 |
| 章节 eyebrow | 0.72rem | mono，字距 .12em |
| 角色名 | clamp(1.75rem, 3.2vw, 2.25rem) | 衬线 |
| HP | clamp(2.25rem, 3.6vw, 2.75rem) | 衬线/tabular |
| 属性值 | 1.5rem | 衬线/tabular |
| 弹窗标题 | 1.25rem | 衬线 |

### 4.5 间距、线、面

- 4px 基准：4/8/12/16/24/32。
- 页面最大宽度 1440px；左右 padding `clamp(14px, 2.4vw, 28px)`。
- 卡片内边距 15px；卡片间距 16px。
- 圆角 2px；pips / 徽章才用全圆。
- 结构线 1px `--line`；强调值 1.5px `--line-strong`；虚线只用于空状态、拖放目标和校对提示，不再到处使用。
- 只保留一层柔和的纸面投影；不用发光、玻璃、装饰渐变。
- 不在卡片里再套卡片；用横线、内嵌字段和一段摘要分割。

### 4.6 组件语言

**Panel**  
eyebrow（mono 小标）+ 衬线标题 + 可选副标题；一条墨线；右侧至多两个动作。没有彩色标题条，没有渐变头。

**可编辑 vs 只读**  
- 可编辑：纸面凹槽 + 1px `--line` 边框；hover 加深；focus 用 2px `--ink` 外轮廓（offset 1px）；hover/focus 才出现小铅笔。
- Hero 内联字段：静止时用 `--line-strong` 虚线底边，不再完全隐形。
- 计算值（AC、先攻、命中、技能加值、被动）：纯文本，衬线或 tabular；可加 0.72rem 的“自动”小标。绝不套输入框外观。

**印章/徽章**  
每行最多两个；只保留会改变决策的状态：已准备、专注、仪式、超出上限、已同调、已装备、力竭。来源/职业等元数据改成纯文本。用 2px 小方章，而不是彩虹 pill。

**Pips**  
视觉 18px，点击区 32px，间距 8px；已用=墨色/血色，未用=1px 线；hover 显示环，focus 显示 2px 轮廓。

**表格**  
- 攻击：4 列紧凑行（武器、命中、伤害、射程），不再 9 列。
- 物品：4 列（勾选、名称+重量、数量、详情）。
- 粘性表头、横线行、tabular 数字；移动端改为堆叠字段行。
- 不再用 `min-width: 560px` 强制横滚。

**弹窗**  
保留原生 `<dialog>`。纸面、2px 边框、16px 内边距；标题+关闭；正文按 2–3 组分区；底部一个主操作 + 一个 ghost。升级向导建议 3 步：职业/生命 → 子职/属性提升 → 确认预览。

**空状态**  
1px 虚线框 + 0.8rem muted 文本 + 一个 ghost 动作；不使用插画。

**动效**  
hover/focus 160–200ms；面板出现 220ms；HP 条 300ms；除升级“可升级”小印章的 2.2s 柔光环外，不做无限动画；全部尊重 `prefers-reduced-motion`。

---

## 5. 布局规范

### 5.1 桌面（≥1200px）

- 顶栏 56px，sticky。
- Vitals Ledger 约 76px，sticky 在顶栏下方。
- 身份抬头横跨全宽：头像 88px、姓名/元数据/职业行、右侧 XP 与升级按钮。
- A：三列分组（桌面 `grid` 3 列；≤1050px 降为 2 列流式分栏）。左列：属性 → 物品；中列：战斗 → 法术；右列：攻击 → 特性 → 资源；角色故事全宽收尾。实测列高 1875 / 1542 / 1643px，最大差约 333px。
- B：7/5 双列；左列战斗 → 攻击 → 法术，右列属性 → 资源 → 物品 → 特性；角色故事全宽收尾。
- 分区 id 保持：`abilities`、`combat`、`attacks`、`spells`、`resources`、`inventory`、`features`、`roleplay`；锚点 `scroll-margin-top` 至少 140px。

### 5.2 平板（≤1050px）

- A 三列分组降为 2 列（面板按 DOM 顺序流式分栏）；B 的双列降为单列。
- Vitals 保留姓名 + HP/AC/先攻；法术位与专注可缩到第二行。
- 卡片间距 14px。

### 5.3 移动端（≤760px，真 390 视口）

- 顶栏压缩为两行：第一行品牌/角色切换/检索，第二行三个路由 tab；实测 390 下总高约 86px（改版前约 250px）。
- Vitals 约 68px，sticky 在顶栏下；390 只显示 HP/AC/先攻三项，法术位与专注在法术/战斗面板中查看。
- 单列；属性 2 列（390），≤360 可 1 列；技能 1 列。
- 表格变堆叠字段行：攻击 3 列（武器/命中/伤害），物品 4 列（勾选/名称/数量/详情）。
- 固定底栏 5 项，48px 最小点击区：角色 / 战斗 / 法术 / 物品 / 规则。
- 页面底部预留 84px，避免被底栏遮挡；`body` 禁止横向滚动。

### 5.4 深色主题

- 同一套 token 名，`.dark` 只换值；不硬编码浅色。
- A 的 Vitals 在深色下用 `--panel`，与纸面一致。
- B 的 Vitals 在两种主题下都保持 loam 深色带，形成识别；深色主题下用 `#0d0b09` 与 `--panel` 文字。

---

## 6. 实施映射（已执行）

> 2026-10-22 已按 A 落地到前端表现层；原文件备份在 `backups/design-a-2026-10-22/src/`。数据模型、计算、API、服务端、用户数据未改。

### Phase 1 — token 与排版

- `src/styles.css:5-54`：替换浅/深 token 为第 4 节的值；`--radius: 2px`。
- 全局字号：把 0.6–0.68rem 的标签/表头提升到 0.72rem；正文 0.82rem；表格 0.82rem。
- 新增 `.vitals`、`.identity-band`、`.masonry` / `.b-grid`、`.attack-list`、资源点阵等布局类。
- 删除重复的 `.spell-cast-meta`（`styles.css:402` 与 `:649`），清理 `.hero-select`、`.attack-table` 死类。

### Phase 2 — 外壳

- `src/App.tsx`：顶栏压缩；移动端底栏从 6 项改 5 项；保留检索/短休/长休/升级/设置与所有快捷键。
- `src/pages/CharacterPage.tsx`：加入 Vitals Ledger；身份抬头；校对改成行内 banner；A 用三列分组、B 用 7/5 栅格。
- `src/components/SheetHero.tsx`：身份抬头布局；内联字段可见性；XP/升级区。
- 新增表现层组件（如 `VitalsStrip.tsx`）只接收展示数据，不改数据流。

### Phase 3 — 面板

- `AbilitiesPanel`：3×2 能力卡；技能两列；熟练/专精圆点扩大点击区。
- `CombatPanel`：HP 块 + 2×2 能力格；底部 2 列设置行；死亡豁免/状态。
- `AttackPanel`：9 列表格 → 4 列紧凑攻击行。
- `SpellsPanel`：单列法术索引；4 个 stat 格；法术位 pips；保留所有编辑与同步逻辑。
- `ResourcesPanel`：职业资源统一用点阵显示，每行 10 个。
- `InventoryPanel`：7 列 → 4 列；金币胶囊保留。
- `FeaturesPanel`：单列分组；保留 `<details>` 与规则检索。
- `RoleplayPanel`：全宽 2 列文本区；不再留在左栏底部。

### Phase 4 — 缺陷与无障碍

- 给 `Toggle` 补样式（`ui.tsx:244-254`），修装备/同调/熟练开关。
- 全局 `:focus-visible`；`prefers-reduced-motion`。
- 角色名使用真正的 `<h1>` 或给现有标题补语义。
- 徽章数量削减约 40%，来源/职业元数据改纯文本。

### 明确不动

- `src/types.ts` 的 `Character` 字段、嵌套、法术位字符串键 `"1"`–`"9"`。
- `src/lib/calc.ts`、`src/lib/level-up.ts`、`src/lib/api.ts`。
- `server/` 的读写、校验、备份、头像。
- `data/characters/justinian01.json`、`data/backups/`。
- 分区 id、`Ctrl+K`/`Ctrl+S`、800ms 自动保存、原生 `<dialog>` 行为、中文逻辑键（圣武士、野蛮人、武僧、防御、警觉、所有武器、简易武器、军用武器等）。

---

## 7. 不变量清单

1. `Character` 字段名、嵌套、slot 键保持不变。
2. 所有编辑仍走 `patch()` 与 800ms 自动保存；不新增客户端角色副本。
3. 保存响应仍用服务器 normalize 后的角色替换本地状态。
4. `Ctrl+K`、`Ctrl+S`、dirty 提醒、原生 dialog 行为不变。
5. 八个分区 id 不变。
6. 计算逻辑与中文逻辑键不变。
7. 检索请求生命周期、筛选、插入语义、toast 文案不变。
8. 备份/恢复、导入/导出、头像、复制、删除、切换角色不变。
9. 浅/深 CSS 变量体系与 `dnd-theme` localStorage 不变。
10. 可编辑字段仍可编辑；只读值不能被误当成输入。
11. 不修改用户数据、不运行旧迁移脚本。

---

## 8. 验收清单

- 1440×1000：HP、AC、先攻、法术位在首屏可见；左栏无 >200px 空洞；校对是行内提示。
- 390×844：顶栏 ≤100px；底栏 5 项、48px；无横向滚动；攻击/物品表不裁切。
- 浅色/深色：正文对比度 ≥4.5:1；金色只用于等级/XP/进度；无浅色硬编码。
- 八个分区都能通过锚点/底栏到达。
- 可编辑值与计算值一眼可分；所有输入仍可编辑。
- `npx tsc --noEmit`、`npm run build` 通过；`npm test` 27/27 通过。
- `data/characters/justinian01.json` 无改动。

---

## 9. 画布与截图

- 项目：[D&D 角色卡 · 冒险者手记视觉方向](https://superdesign.dev/teams/b3a3899a-8b03-4b9d-bdb7-058e0dc886c5/projects/2ac28d3e-2fd1-446b-929e-c4eb16d4dd50)
- 现状基线（真实 DOM 导入，v3）：[Adventurer Ledger Baseline](https://p.superdesign.dev/draft/a814af88-9b5a-48db-9178-dd69847d6f9b)
- 方向 A：[边注档案](https://p.superdesign.dev/draft/d60f8da3-b200-4669-89c4-e7dcc1888e8b)
- 方向 B：[战桌仪表](https://p.superdesign.dev/draft/fb6af6e6-07a3-4791-abf9-22d69be8b0b8)
- 本地截图：改版前 `screenshots/baseline-1440-light.png`、`baseline-1440-dark.png`、`baseline-390-light.png`；方向稿 `screenshots/dir-a-1440.png`、`dir-a-390.png`、`dir-b-1440.png`、`dir-b-390.png`；**改版后** `screenshots/implemented-1440-light.png`、`implemented-1440-dark.png`、`implemented-390-light.png`、`implemented-1440-top.png`、`implemented-390-top.png`，以及攻击/战斗/法术局部图。

## 10. 实现记录（2026-10-22）

- 新增 `src/components/VitalsStrip.tsx`：常驻 HP/AC/先攻/法术位/专注状态，只在角色路由渲染。
- `src/App.tsx`：接入 VitalsStrip；移动底栏改为 5 项（角色 / 战斗 / 法术 / 物品 / 规则）；角色按钮回到页首。
- `src/pages/CharacterPage.tsx`：身份抬头 + 三列分组（属性/物品、战斗/法术、攻击/特性/资源）+ 全宽角色故事。
- `src/components/AttackPanel.tsx`：9 列表格改为紧凑行，保留名称、属性、熟练、魔法、伤害骰、类型、射程的全部输入。
- `src/components/InventoryPanel.tsx`：7 列表格改为紧凑行，保留装备、数量、单重、同调、备注与删除。
- `src/components/ResourcesPanel.tsx`：职业资源统一改为点阵显示，每行 10 个；总数/恢复/删除不变。
- `src/components/SpellsPanel.tsx`：移除每行重复的来源徽章，降低颜色噪音；数据与编辑逻辑不变。
- `src/styles.css`：替换浅/深 token 与字号；新增 Vitals、身份抬头、三列分组、紧凑攻击/物品行、资源点阵、Toggle、focus-visible、reduced-motion；删除不再使用的 `.sheet-table` 规则。
- 2026-10-22 后续：移除导入校对（`AuditPanel`、`audit` 类型/处理逻辑与样式）；旧角色 JSON 中残留的 `audit` 字段不再读取。
- 备份：`backups/design-a-2026-10-22/src/`（改动前的完整 `src` 与 `index.html`）。
- 验证：`npx tsc --noEmit` 通过；`npm run build` 通过；`npm test` 27/27 通过（准备法术计数已排除 0 环戏法）。
- 实测 1440：topbar 56px、Vitals 76px（top=56，和顶栏无缝）、身份 249px；三列高 1875 / 1542 / 1643px，最大差 333px；角色故事从 2333px 开始；整页约 3048px（改版前 3799px）。
- 实测 900：topbar 96px、Vitals top=96，无重叠；两列流式分栏。
- 实测 390：topbar 86px、Vitals 68px（top=86，无缝）；底栏 5 项；无横向滚动；整页约 8037px（内容更完整、字号更大，滚动变长）。
- `data/characters/justinian01.json` 未改动。

## 11. 关于 credits 与生成方式

- 现状基线最初由 Superdesign 生成 1 稿，但模型把多个面板写成了占位符；随后用运行中页面的真实 DOM 免费导入为 v3，达到像素级还原。
- 两个方向分支的 AI 生成请求被 Superdesign 拒绝：`Team has insufficient credits`，未扣费。因此两个方向由我本地手写 HTML，并用 skill 的 `import-design-draft` 免费导入画布。
- 如果之后补充 credits，可以对 A/B 继续用 `iterate-design-draft` 细化，或让 Superdesign 模型重新生成同方向变体；现有两稿已完整可看、可比较。
- 本轮已按 A 落地；数据模型、计算、API、服务端、用户数据均未改。

---

*附：`.zcode/plans/plan-sess_478a6588-0ec6-48c1-9943-55150fe1b968.md` 已生成，「打开计划」已恢复。*
