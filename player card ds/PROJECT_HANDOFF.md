# D&D 5E 角色卡 · 项目交接说明

> 交接日期：2026-10-22  
> 项目根目录：`D:\KimiData\kimi\Workspaces\dnd player project\player card ds`  
> 当前状态：可用版本已完成并通过构建/测试；下一步是**界面视觉设计分析**，不是继续改功能。  
> 给下一个 AI 的第一句话：先读本文档，再读 `README.md` 和 `src/App.tsx`；不要覆盖 `data/characters/justinian01.json`，不要运行 `npm run db:migrate-old`，除非用户明确要求。

---

## 1. 项目目标

做一个**本地运行的 D&D 5E（2014 规则）角色卡 + 规则库应用**：

- 角色卡上的所有可变信息都能方便地修改：等级、职业、属性、技能、HP、AC、法术位、法术、物品、特性、专长、资源、角色扮演信息等。
- 内置规则库检索，数据来源为隔壁文件夹：
  `D:\KimiData\kimi\Workspaces\dnd player project\database`
  （《玩家手册》288 页 + 《城主指南》290 页中文文本）。
- 检索到的法术、魔法物品、专长、装备、状态可以一键加入角色卡，并自动带入正确元数据。
- 数据保存在本地磁盘，不依赖云服务；自动保存和自动备份。
- 支持桌面和手机浏览器使用。
- 当前用户角色「查士丁尼」已从旧版应用迁移。

用户明确选择过：

- 全新项目，导入旧角色。
- 本地 Web 应用（Node 服务 + 浏览器）。
- 规则库做“结构化 + 升级向导”。
- 附加模块：**角色扮演档案**、**规则速查**。
- **不做**：骰子台/掷骰记录、A4 打印/PDF、Markdown 导出、在线同步。
- 只覆盖 2014 版 PHB/DMG，不含 2024 规则或扩展书。

---

## 2. 已完成的功能

### 2.1 应用与运行

- React 19 + TypeScript + Vite 7 + Tailwind 3 前端。
- Node 内置 `http` 本地服务，仅绑定 `127.0.0.1`。
- 生产模式服务 `dist/`；开发模式挂 Vite middleware。
- 默认端口 7100，被占用时自动尝试 7101–7119，并打开实际端口。
- `start.bat` 一键启动，`scripts/start.mjs` 负责检查依赖、判断是否需要构建、启动服务。
- 数据库路径可在设置中修改，保存后立即重建索引。

### 2.2 角色管理

- 每个角色一个 JSON：`data/characters/<id>.json`。
- 新建、切换、复制、删除角色。
- JSON 导入/导出。
- 头像上传（浏览器端缩放到 512 px，服务端存 `data/portraits/`）。
- 800 ms 防抖自动保存；`Ctrl+S` 立即保存。
- 保存前自动备份到 `data/backups/<id>/`，保留最近 30 份。
- 设置页可查看备份并恢复。
- 支持外部手动修改 JSON 后通过刷新读取（角色切换/刷新页面）。

### 2.3 角色卡功能

- 身份：姓名、玩家名、种族、子种族、背景、阵营、XP、头像。
- 职业：支持多职业数据模型；职业/子职业/等级编辑；自动计算总等级和熟练加值。
- 属性与技能：六属性、调整值、豁免熟练、18 项技能熟练/专精、被动察觉/调查/洞悉。
- 熟练项：护甲、武器、工具、语言（标签编辑）。
- 战斗：当前/最大/临时 HP、AC（自动分解或手动覆盖）、先攻、速度、生命骰、死亡豁免、力竭 0–6、状态、专注。
- 攻击：武器攻击表；命中/伤害加值自动计算；从装备库添加武器时自动生成攻击。
- 法术：施法属性、法术豁免 DC、法术攻击、各环法术位刻度、契约法术位、准备上限、法术列表、准备/常备/专注/仪式标记、法术详情展开编辑。
- 资源：圣疗、引导神力、气、术法点等；使用次数、短休/长休/不恢复；支持自定义。
- 物品：数量、单位重量、总重量、负重状态、装备/同调（上限提示 3）、价格、描述、钱币五档。
- 特性：按来源分组；名称/来源/等级/描述/使用次数编辑；自动加入升级获得的特性。
- 角色扮演：性格、理想、羁绊、缺陷、外貌、背景故事、盟友、战役笔记。
- 数据校对：导入时生成的 audit 问题可逐项“应用建议/忽略”。

### 2.4 休息与升级

- 短休：花费生命骰、输入/按平均治疗量、恢复短休资源和契约法术位。
- 长休：HP 回满、法术位/契约位恢复、短休/长休资源恢复、生命骰恢复一半（至少 1）、力竭 -1、死亡豁免清零、专注结束。
- 升级向导：
  - 选择职业、预览新等级/熟练加值/HP/新特性/法术位变化。
  - HP 平均值或手动输入。
  - 属性提升（+2 或 +1/+1）或选择专长（规则库搜索）。
  - 子职业等级选择。
  - 自动更新法术位、标准资源、职业特性。
  - 新特性会尝试从规则库自动摘录描述；失败则保留检索入口。
  - 升级前旧版本通过自动保存进入备份。

### 2.5 规则库

结构化解析结果（当前生成数据）：

- 法术：355 条。
- 魔法物品：243 条。
- 专长：42 条。
- 状态：15 条。
- 护甲：12 条；盾牌：1 条；武器：37 条。
- 12 个职业 × 20 级成长数据。
- 8 个施法职业的法术列表标注（法术 → 可用职业）。
- 武器表解析了重量、属性、射程、简易/军用分类。
- 法术解析了环位、学派、仪式、专注、施法时间、距离、成分、持续时间、升环效应。
- 生成 `data/compendium.json` 与 `data/compendium-report.json`。

检索功能：

- `Ctrl+K` 全局检索。
- 规则库页面：类型页签（全部/法术/魔法物品/专长/状态/装备/规则全文）。
- 筛选：法术环位/学派/职业/仪式/专注；物品稀有度/类型；装备类型；书籍。
- 中文/英文名搜索；标题匹配优先于正文；命中片段高亮。
- 显示书籍、章节、PDF 页码。
- 结构化条目一键加入角色卡：
  - 法术自动填环位/学派/施法信息/描述/职业。
  - 魔法物品填类型/稀有度/同调/描述。
  - 装备生成物品；武器同时生成攻击。
  - 专长生成特性。
  - 状态直接切换。
- 原文全文检索作为兜底；PDF 页码为提取时的 PDF 分页，不是印刷页码。

### 2.6 速查与主题

- 速查页 33 张卡片：检定/豁免/优势、战斗动作、掩护/视线、休息、专注、15 种状态、濒死、法术规则、旅行负重、DC 表。
- 速查卡可跳转规则库原文或状态详情。
- 羊皮纸浅色主题 + 墨夜深色主题。
- 桌面双栏 + 移动端单栏 + 固定底部导航。
- 移动端 390 px 宽度已实测无横向溢出。

### 2.7 测试与验证

- `npm test`：4 个测试文件、19 项测试通过。
  - `tests/calc.test.ts`：数值、AC、休息、升级。
  - `tests/compendium.test.ts`：解析数量、关键样本、无 Markdown 标题泄漏。
  - `tests/classes.test.ts`：12 职业 × 20 级、圣武士 5 级、邪术师契约位。
  - `tests/search.test.ts`：火球排序、英文检索、筛选、状态/专长。
- `npm run build` 通过。
- 浏览器手工验证过：检索插入、长休、4→5 升级、专长选择、新建法师、速查、移动端、深色主题、无控制台错误。
- 备份恢复与数据库路径更新接口已用 Node 脚本验证。

---

## 3. 当前运行方式

### 3.1 用户启动

双击项目根目录的 `start.bat`。

当前 `start.bat` 内容（**纯 ASCII + CRLF**）：

```bat
@echo off
cd /d "%~dp0"
node scripts/start.mjs %*
pause
```

不要把它改回含中文或 LF 换行的复杂批处理。之前就是因为 LF + 中文导致 `cmd` 解析错行，执行成了 `'0'` 命令，双击打不开。

`scripts/start.mjs` 会：

1. 检查 `node_modules`，缺失则 `npm install`。
2. 检查 `dist/index.html` 是否缺失或落后于 `src/`、`shared/`、`server/`、配置文件；需要则 `npm run build`。
3. 启动 `node server/index.mjs --prod --open`。
4. 传递额外参数，如 `start.bat --port 7126 --no-open`。

### 3.2 开发命令

```bash
npm run dev        # 开发模式，Node + Vite middleware
npm run build      # tsc --noEmit + vite build
npm start          # 生产模式并打开浏览器
npm test           # Vitest
npm run db:build   # 重新解析 database → data/compendium.json
npm run db:classes # 重新生成 shared/classes.json
npm run db:migrate-old # 从旧 player card 重新导入 justinian01（危险，见下）
```

### 3.3 当前运行状态

- 交接时本地服务未保持运行；用户双击 `start.bat` 即可。
- `dist/` 已构建。
- `data/settings.json` 当前内容为默认 `../database`、7100、127.0.0.1。

---

## 4. 代码整体结构

```text
player card ds/
├─ start.bat                  # 极简 ASCII/CRLF 启动入口
├─ config.json                # 默认数据库路径/端口/host
├─ README.md                  # 用户使用说明
├─ PROJECT_HANDOFF.md         # 本文档
├─ package.json               # 依赖与脚本
├─ vite.config.ts             # Vite + Vitest 配置
├─ tsconfig.json              # 只 typecheck src；tests 由 Vitest 转译
├─ tailwind.config.js         # 颜色/字体扩展
├─ postcss.config.js
├─ index.html
│
├─ server/
│  ├─ index.mjs               # HTTP 入口、静态资源、端口回退、打开浏览器
│  ├─ api.mjs                 # 角色/检索/规则库/设置/备份 REST API
│  ├─ storage.mjs             # 角色 JSON、zod 校验、原子写入、备份、头像
│  ├─ db.mjs                  # 设置、数据库路径、Markdown 缓存
│  ├─ compendium.mjs          # 规则库索引加载/重建/哈希判断
│  └─ search.mjs              # 结构化 + 原文检索、排序、筛选
│
├─ scripts/
│  ├─ start.mjs               # 一键启动逻辑
│  ├─ build-compendium.mjs    # Markdown → 结构化规则库
│  ├─ build-class-data.mjs    # 职业表 → 12×20 成长数据
│  └─ migrate-old-character.mjs # 旧角色迁移 + 校对报告
│
├─ shared/
│  ├─ classes.json            # 生成文件：职业成长/资源/熟练
│  └─ quick-rules.json        # 手写：33 张速查卡
│
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                 # 角色状态机、自动保存、路由、各类弹窗
│  ├─ types.ts                # 全部类型、常量、技能/状态/XP 表
│  ├─ styles.css              # 设计 token、主题、全部自定义样式
│  ├─ pages/
│  │  ├─ CharacterPage.tsx
│  │  ├─ RulebookPage.tsx
│  │  └─ QuickRulesPage.tsx
│  ├─ components/
│  │  ├─ ui.tsx               # Panel/Btn/Input/Pips/Modal/Toast/TagList 等
│  │  ├─ SheetHero.tsx        # 身份/头像/职业/XP（IdentityPanel 转发此组件）
│  │  ├─ IdentityPanel.tsx
│  │  ├─ AbilitiesPanel.tsx
│  │  ├─ CombatPanel.tsx
│  │  ├─ AttackPanel.tsx
│  │  ├─ SpellsPanel.tsx
│  │  ├─ ResourcesPanel.tsx
│  │  ├─ InventoryPanel.tsx
│  │  ├─ FeaturesPanel.tsx
│  │  ├─ RoleplayPanel.tsx
│  │  ├─ AuditPanel.tsx
│  │  ├─ SearchDialog.tsx
│  │  ├─ CompendiumExplorer.tsx
│  │  ├─ LevelUpDialog.tsx
│  │  ├─ RestDialog.tsx
│  │  ├─ SettingsDialog.tsx
│  │  ├─ NewCharacterDialog.tsx
│  │  └─ Highlight.tsx
│  └─ lib/
│     ├─ api.ts               # fetch 封装
│     ├─ calc.ts              # 所有规则计算、休息、AC、法术位
│     ├─ level-up.ts          # 升级预览/应用/特性描述摘录
│     ├─ insert.ts            # 规则库条目 → 角色卡
│     ├─ convert.ts           # 规则库条目 → Spell/Item/Feature
│     ├─ router.ts            # hash 路由（navigate 已 useCallback 稳定）
│     └─ ...
│
├─ tests/                     # Vitest
├─ data/                      # 运行时数据，不要随意删除
│  ├─ characters/justinian01.json
│  ├─ backups/justinian01/*.json
│  ├─ portraits/justinian01.png
│  ├─ compendium.json
│  ├─ compendium-report.json
│  └─ settings.json
└─ database/                  # 项目外：D:\...\dnd player project\database
```

---

## 5. 最近修改/关键文件说明

项目是新建的，以下按“文件职责 + 最近修过的关键点”说明。

### 5.1 启动与配置

- `start.bat`
  - 最近重写为纯 ASCII + CRLF。
  - 只做 `cd`、调用 `node scripts/start.mjs`、`pause`。
  - **重要**：不要在这个文件里写中文、复杂括号块或 `if errorlevel` 逻辑；Windows `cmd` 容易解析错。
- `scripts/start.mjs`
  - 新增启动器。
  - 检查依赖、判断构建是否过期、启动服务、传参、`--no-open` 测试开关。
  - `needsBuild()` 比较 `src/shared/server/index.html/package.json/vite/tailwind/postcss` 与 `dist/index.html` 的 mtime。
- `config.json`：默认 `databaseDir: "../database"`，端口 7100，host 127.0.0.1。
- `.gitignore`：忽略 `node_modules/`、`dist/`、`data/` 运行时、`screenshots/` 等。项目目前**不是 git 仓库**。

### 5.2 服务端

- `server/index.mjs`
  - Node HTTP 服务；开发模式 Vite middleware，生产模式 `dist/`。
  - 端口冲突自动递增；`--open` 在监听后打开浏览器。
  - 提供 `/media/portraits/*`。
  - 生产 SPA fallback 到 `dist/index.html`。
  - HMR 端口固定 24679，避免和旧应用冲突。
- `server/api.mjs`
  - `GET /api/meta`
  - 角色 CRUD、复制、头像、备份、恢复
  - `GET /api/search`
  - `GET /api/compendium`、`GET /api/compendium/:uid`、`POST /api/compendium/rebuild`
  - `GET/PUT /api/settings`
  - `GET /api/health`
- `server/storage.mjs`
  - 每个角色一个 JSON；原子写入（tmp + rename）。
  - zod schema；`defaultCharacter` 默认模板。
  - 自动备份，保留 30 份；恢复前再备份当前版本。
  - 头像保存/替换；复制角色时复制头像；删除角色时删除头像但保留备份。
  - 已加入 `deathSaves`、`audit`、`classes` 等字段。
- `server/db.mjs`
  - 设置合并（config.json + data/settings.json）。
  - 数据库目录解析、Markdown 列表、mtime 缓存。
- `server/compendium.mjs`
  - 读/写 `data/compendium.json`；源文件哈希不一致时重建。
- `server/search.mjs`
  - 结构化条目检索 + 原文块检索。
  - 最近改为**标题优先计分**：`titleScore * 10 + bodyScore`，解决「火球」先返回「火球魔杖」的问题。
  - 原文结果去重：标题与结构化条目同名/前缀匹配时隐藏重复原文。
  - 分页、筛选、片段、页码。

### 5.3 解析与数据生成

- `scripts/build-compendium.mjs`
  - 解析法术、魔法物品、专长、状态、护甲/盾牌/武器。
  - 法术：名称行 + `N环 学派`/`戏法`，字段行，职业法术列表。
  - 魔法物品：名称行 + `类型(子类型),稀有度`。
  - 专长：用 42 个 PHB 英文专长名锚定。
  - 状态：附录 A 的 15 个名称锚定。
  - 装备：护甲表 + 武器表 + 紧随其后的「重量 属性」表；填 `weaponGroup: simple|martial`。
  - 最近修复：正文中的 `### F` 等 Markdown 标题泄漏；武器平伤害 `1`、捕网 `—`；武器重量/属性表缺 `磅` 的行。
  - 生成 `data/compendium.json`（紧凑 JSON）和 `data/compendium-report.json`。
- `scripts/build-class-data.mjs`
  - 从第 3 章职业表提取 20 级特性。
  - 修复过：最后一行误吞后续正文；牧师/诗人跨行续写；武僧第二张「无甲移动/职业特性」表；游荡者偷袭骰、术士术法点等前置数值列。
  - 手工维护：法术位表、施法类型、子职业、ASI、职业资源、护甲/武器熟练。
  - 生成 `shared/classes.json`。
  - **不要直接手改 `shared/classes.json` 后忘了脚本**；需要永久变更时改本脚本再 `npm run db:classes`。
- `scripts/migrate-old-character.mjs`
  - 从 `../player card/data/characters.json` 读取查士丁尼，生成 `justinian01.json`。
  - 迁移头像、法术、物品、攻击、资源、特性、角色扮演备注。
  - 自动修正：生命骰总数 3→4；英雄宴 1→6。
  - 生成 audit：至圣斩应为特性、准备法术超限、引导神力次数、技能熟练偏多。
  - **警告：运行它会覆盖当前 `justinian01.json`，包括用户后来手动应用的校对修改。**

### 5.4 前端核心

- `src/types.ts`
  - `Character`、`SpellEntry`、`Attack`、`Item`、`Feature`、`Resource`、`AuditIssue`、`ClassDef` 等。
  - 常量：六属性、18 技能、15 状态、阵营、法术环名、学派、职业名、稀有度、XP 阈值、硬币。
- `src/lib/calc.ts`
  - 属性调整值、熟练加值、总等级、技能/豁免/被动、法术 DC/攻击。
  - AC 分解：护甲/敏捷上限/盾牌/无甲防御/防御战斗风格/手动覆盖。
  - 先攻、负重、钱币、XP、生命骰、法术位建议、准备上限、攻击命中/伤害。
  - `applyShortRest`、`applyLongRest`。
  - `attackFromItem`：最近加入简易/军用武器熟练判断。
  - 引用 `@shared/classes.json`。
- `src/lib/level-up.ts`
  - `getLevelUpPlan`、`applyLevelUp`、`describeNewFeatures`。
  - 更新 HP/生命骰/法术位/资源/特性/ASI/专长/子职业。
  - 最近修复：资源按名称匹配，避免给已有自定义「引导神力」重复添加；HP 上限使用 `plan.hpMax` 而不是不存在的 `opts.hpMax`。
- `src/lib/insert.ts`
  - 检索结果插入角色卡；法术去重、法术环位警告、物品数量累加、武器生成攻击、状态切换。
- `src/lib/convert.ts`
  - 规则库条目 → 本地 Spell/Item/Feature。
  - 最近给武器补了 `group`。
- `src/lib/router.ts`
  - hash 路由；`navigate` 用 `useCallback` 稳定，修复启动无限请求。
- `src/App.tsx`
  - 启动加载 meta/角色列表；自动保存状态机；保存冲突处理。
  - `adoptCharacter`：先更新 ref，再改 hash，修复新建/复制/导入后路由 effect 把旧角色选回来的竞态。
  - 新建角色：设置职业 1 级特性、护甲/武器熟练、HP、生命骰、法术位、资源；如果是 1 级选子职业则加占位特性。
  - 搜索状态 `searchType/searchQuery`；全局 `Ctrl+K`；插入处理器。
  - 主题 localStorage；设置、升级、休息、新建弹窗。
  - 删除/复制/导入/导出/头像。
  - 移动端底部导航；`goSection` 先切回角色页再滚动到 `spells/inventory/features`。
- `src/pages/CharacterPage.tsx`
  - 当前顺序：身份 Hero → 导入校对 → 快捷操作 → 双栏。
  - 左栏：属性/技能、角色扮演。
  - 右栏：战斗、攻击、法术、资源、物品、特性。
  - **视觉重设计时保持这些 section id**：`abilities`、`combat`、`attacks`、`spells`、`resources`、`inventory`、`features`、`roleplay`（移动端导航依赖 `spells/inventory/features`）。
- `src/components/ui.tsx`
  - Panel、Btn、NumberField、TextInput、TextArea、Select、Field、Stepper、Pips、Toggle、Badge、Modal、Toast、Empty、Divider、Stat、TagList。
  - Modal 使用原生 `<dialog>`；不要换成会破坏焦点管理的自定义实现。
- `src/styles.css`
  - 设计 token（`--bg/--panel/--ink/--line/--gold/--green/--red/--blue` 等）+ `.dark`。
  - 面板、按钮、输入、Hero、技能、战斗、法术、物品、特性、角色扮演、检索、速查、设置、升级、休息、移动端导航。
  - 当前视觉方向：羊皮纸/墨夜、衬线标题、金色点缀、卡片式面板。
  - **视觉重设计主要改这里和少量组件 class/结构；不要动数据逻辑。**

### 5.5 规则库/速查 UI

- `src/components/CompendiumExplorer.tsx`
  - 规则库与检索弹窗共用。
  - 类型页签、筛选、结果列表、详情、插入按钮。
  - 查询空时走 `api.browse`，有查询时走 `api.search`；180ms 防抖；请求序号防旧结果覆盖。
- `src/components/SearchDialog.tsx`
  - 原生 Modal + CompendiumExplorer；`initialType/initialQuery`。
- `src/pages/RulebookPage.tsx`
  - 页面版规则库；显示结构化/原文数量；插入按钮。
- `src/pages/QuickRulesPage.tsx`
  - 读取 `@shared/quick-rules.json`；分类筛选、文本筛选、33 张卡；跳转规则库/状态。
- `shared/quick-rules.json`
  - 手写内容，不是从数据库自动生成；修改时保持 JSON 有效。

### 5.6 测试

- `tests/calc.test.ts`：查士丁尼数值、AC、负重、XP、短休/长休、升级 4→5。
- `tests/compendium.test.ts`：解析数量/关键样本/武器分类/无标题泄漏。
- `tests/classes.test.ts`：12×20、圣武士 5 级、法师/牧师/邪术师施法类型。
- `tests/search.test.ts`：火球排序、英文名、环位/职业筛选、状态/专长。
- `tsconfig.json` 只 typecheck `src` 和 `vite.config.ts`；tests 由 Vitest 转译，所以测试里的 `.mjs` 导入不会让 `npm run build` 失败。

---

## 6. 当前角色数据快照（交接时）

文件：`data/characters/justinian01.json`

- 姓名：查士丁尼
- 种族：阿斯莫
- 职业：圣武士（奉献之誓）4 级
- XP：2751
- HP：41/41
- AC：手动 19
- 属性：STR 18 / DEX 14 / CON 14 / INT 11 / WIS 11 / CHA 16
- 法术：9 条
  - 光亮术 0、神导术 0、圣火术 0
  - 防护善恶 1、虔诚护盾 1、祝福术 1、强令对决 1、净化食粮 1、雷鸣斩 1
- 特性：9 条，包含「至圣斩」（已从法术转为特性）
- 物品：8 件
- 资源：圣疗 20、神圣感知 3、引导神力 2、天启变身 1
- 校对状态：
  - 生命骰总数已修正（applied）
  - 英雄宴环位已修正（applied）
  - 至圣斩是职业特性（applied）
  - 准备法术数量超限（ignored）
  - 引导神力次数不符（applied）
  - 技能熟练偏多（ignored）

### 重要数据警告

- 当前角色已经**不是**最初迁移后的原始状态：当前数据中 audit 有多项 `applied/ignored`，且「英雄宴」已不在法术列表；这可能是用户操作，也可能是自动化验证期间的操作，不要擅自还原。
- 当前 audit 中存在一处**状态与数值不一致**：`audit-channel-divinity` 标记为 `applied`，但资源「引导神力」仍是 2（建议值为 1）。不要自动修改；先向用户确认这是否是有意的自定义，或检查备份中的操作历史。
- 备份目录里有一份最早的基线：
  `data/backups/justinian01/2026-10-21T08-18-11-424Z-da53.json`
  它包含 11 个法术、8 个特性，可用于对比，但**不要未经用户同意恢复**。
- 当前备份已有多份（接近 22 份），最多保留 30 份。
- 不要运行 `npm run db:migrate-old`：它会用旧玩家卡重新生成 `justinian01.json`，覆盖当前用户修改。
- `data/` 不在版本控制中（项目无 git），删除后无法从代码恢复。

---

## 7. 已知问题、限制与待确认项

### 7.1 用户当前最关心的事

用户要求：

1. 使用 **superdesign skill** 分析当前角色卡的 UI 问题。
2. 提出一个完整的视觉设计方向。
3. **只修改前端表现，不破坏现有功能和数据结构。**

当前会话的可用 skill 列表里**没有** `superdesign`；已尝试检查本地 skill/插件目录但 Explore 子代理被取消，未确认安装。下一个 AI 必须先确认：

- 如果确实安装了 `superdesign`：按其说明执行。
- 如果没有：不要假装调用；明确说明，并用等价的设计流程完成“现状问题分析 + 一个完整视觉方向”。
- 目前**尚未进行任何视觉重设计**，也没有改 UI 代码。

### 7.2 视觉/交互初步观察（供设计分析起点，不是最终结论）

- 信息层级：身份、校对面板、属性、战斗都在同一视觉级别；HP/AC/法术位这些跑团高频信息不够突出。
- 校对面板在刚导入时占很大篇幅；虽然有价值，但对日常使用是噪音。
- 字号整体偏小（大量 0.6–0.75rem），中文长文本阅读压力大。
- 徽章/胶囊标签很多，颜色（金/绿/红/蓝）同时出现，重点不够集中。
- 输入框和展示值外观接近，编辑/只读状态区分弱。
- 桌面双栏各面板高度差异大；左栏角色扮演下方容易留白。
- 表格（攻击、物品）在窄屏横向滚动；移动端顶栏约 250px 高，首屏被占较多。
- 弹窗信息密度高（升级、设置、检索），缺少更清晰的分组/步骤节奏。
- 当前“羊皮纸 + 衬线 + 徽章”方向成立，但识别度偏通用，可以更有 D&D 手记/魔法书/战术面板的独特视觉语言。
- 值得保留：双栏骨架、分区面板、粘性顶栏、检索左右分栏、速查卡、原生 dialog、移动端底部导航、深浅主题。

### 7.3 功能/数据限制

- 规则库正文来自两栏 PDF 提取，偶尔有左右栏串行；结构化字段基本正确，原文以 PDF 页码回溯。
- 子职业特性没有逐条自动录入，只在升级时给占位和检索入口。
- 兼职数据模型支持，但多施法者合并法术位主要靠手动校验。
- 只做 2014 PHB/DMG；没有 2024、怪物图鉴扩展、其他 supplement。
- 按用户选择，没有骰子台、A4 打印/PDF、Markdown 导出。
- 角色卡不阻止自定义/超规则配置（例如准备法术超限只提示）。
- audit 的 `applied` 状态目前只是 UI 标记，没有和资源数值做一致性校验；当前「引导神力」就是例子。未来如果修，应只加校验/提示，不要静默改用户数据。
- `deleteCharacter` 删除角色文件和头像，但**保留备份目录**；这是有意的安全行为，UI 也提示“备份仍保留”。
- 删除角色使用原生 `confirm`，新建/升级错误使用 `alert`；视觉重设计如果替换，需保留确认语义。
- 没有 API 鉴权；只绑定 127.0.0.1，依靠本机边界。
- `npm audit` 当前报告 10 个依赖漏洞（3 moderate / 5 high / 2 critical，主要在构建依赖）；未处理。
- `esbuild` postinstall 被 npm 的 allow-scripts 机制提示；当前构建正常。
- 自动浏览器测试脚本已删除（避免把 Playwright 作为运行依赖）；当前只有 Vitest。手工浏览器验证已完成。
- `start.bat` 已用 `cmd /c start.bat --port 7126 --no-open` 实测返回 HTTP 200；默认 `--open` 分支未单独自动化验证，但服务端打开浏览器的代码简单。
- `start.mjs` 的构建过期判断不包含 `scripts/`；改解析脚本不需要重新构建前端，改前端源码会触发。
- `data/compendium.json` 和 `shared/classes.json` 是生成文件；不要把它们当手写源文件。
- `tsconfig` 不 typecheck tests；`npm run build` 不会发现测试类型错误。
- 项目没有 git 仓库；所有历史只能靠备份和文件现状。

---

## 8. 用户接下来准备做什么

用户已经明确下一步方向：

1. **先做设计分析与视觉方向，不要继续改功能。**
2. 第一步：分析当前角色卡 UI 的问题。
3. 第二步：提出一个完整的视觉设计方向。
4. 设计必须“只修改前端表现”，不破坏现有功能、数据结构和 API。
5. 预计之后才会批准具体实现。

下一个 AI 应该：

- 先确认 superdesign skill 是否可用。
- 如果不可用，做一次正式的设计审查（可以截取桌面/移动端页面，或读 `styles.css` + 组件）。
- 输出：
  - 现状 UI 问题清单（按严重度/影响范围）。
  - 一个明确的视觉方向（关键词、色彩、字体、布局、组件语言、动效、深浅主题、移动端策略）。
  - 设计 token/组件改造范围。
  - 只改表现层的实施计划，明确“不动”的边界（数据模型、计算、API、保存逻辑）。
- 在用户批准前不要写代码。

---

## 9. 继续开发必须注意的规则

1. **不要覆盖用户数据。**
   - 不要运行 `npm run db:migrate-old`，除非用户明确要求重置角色。
   - 不要删除 `data/` 或 `data/backups/`。
   - 任何破坏性操作前先备份。
   - 不要静默应用 audit 建议；audit 是用户决策。

2. **启动脚本保持稳定。**
   - `start.bat` 必须保持 ASCII + CRLF + 极简。
   - 不要在批处理里加中文、复杂括号、`if errorlevel` 多行块。
   - 逻辑放 `scripts/start.mjs`。
   - 端口 7100 被占用时自动回退是预期行为。

3. **视觉重设计的边界（当前任务）。**
   - 只改 `src/styles.css`、组件 class/结构、必要的展示性组件。
   - 不改 `Character` 类型字段、`calc.ts` 规则计算、`api.ts` 接口、`server/` 数据读写、`data/` 文件结构。
   - 保留 section id：`spells`、`inventory`、`features`（移动端导航依赖）；保留 `abilities/combat/attacks/resources/roleplay` 等锚点。
   - 保留原生 `<dialog>` 的焦点/关闭行为。
   - 保留 `Ctrl+K`、`Ctrl+S`、自动保存、`aria-label`、表单可编辑性。
   - 保留深浅主题 CSS 变量体系；不要硬编码只适配浅色的颜色。
   - 不要引入重型 UI 库（Radix/shadcn 整套）；当前依赖很轻。
   - 视觉改动后必须检查桌面 1440px、移动 390px、深浅主题、检索弹窗、升级弹窗、设置弹窗。

4. **代码修改后的验证。**
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm test`（19 项）
   - 至少手工/自动化检查：启动、角色切换、检索插入、保存后刷新、移动端无横向溢出。
   - 如果改了数据模型：同步更新 zod schema、default template、migration、types、tests。

5. **规则库改动。**
   - 数据库目录只读；不要写 `database/`。
   - 改解析器后：`npm run db:build`，重启服务，检查 `data/compendium-report.json`。
   - 改职业数据：改 `scripts/build-class-data.mjs`，运行 `npm run db:classes`；不要手改 `shared/classes.json` 后忘记脚本。
   - 改 `shared/quick-rules.json` 时保持 JSON 有效；它是手写数据，不是生成的。

6. **语言与规则。**
   - UI 保持简体中文。
   - 使用 2014 D&D 5E 中文术语（如“熟练加值”“豁免”“法术位”“专注”）。
   - 不要引入 2024 规则或未在数据库中的扩展内容，除非用户明确要求。
   - 不要做骰子台/打印/PDF/Markdown 导出，除非用户改变决定。

7. **本地与安全。**
   - 服务只绑定 `127.0.0.1`。
   - 保持 body size 限制、路径校验、ID 校验。
   - 不添加云同步、账号、外网上传。

8. **skill 使用规则。**
   - 只调用当前会话可用列表中的 skill。
   - 如果用户要求 `superdesign` 但列表中没有，先检查本地安装；找不到就明确说明，不要伪造 skill 调用。

---

## 10. 新 AI 优先阅读的文件

按顺序：

1. `PROJECT_HANDOFF.md`（本文档）
2. `README.md` — 用户视角功能/启动/数据路径
3. `src/App.tsx` — 角色状态、自动保存、路由、弹窗、竞态修复
4. `src/types.ts` — 数据模型和常量
5. `src/lib/calc.ts` — 所有规则计算
6. `src/styles.css` — 当前设计 token/布局/主题
7. `src/pages/CharacterPage.tsx` — 页面信息架构
8. `src/components/SheetHero.tsx`、`AbilitiesPanel.tsx`、`CombatPanel.tsx`、`SpellsPanel.tsx` — 主要展示区
9. `src/components/CompendiumExplorer.tsx` — 规则库检索 UI 核心
10. `src/components/LevelUpDialog.tsx`、`RestDialog.tsx`、`SettingsDialog.tsx`
11. `server/api.mjs`、`server/storage.mjs`、`server/search.mjs` — 数据/接口边界
12. `scripts/build-compendium.mjs`、`scripts/build-class-data.mjs` — 数据来源和解析规则
13. `data/characters/justinian01.json` — 当前用户数据（只读理解，不要覆盖）
14. `shared/classes.json`、`shared/quick-rules.json`
15. `tests/*.test.ts`

---

## 11. 常用验证清单

### 启动

```bash
# 用户双击 start.bat；或命令行测试
cmd /c "start.bat --port 7126 --no-open"
curl http://127.0.0.1:7126/
```

### 构建/测试

```bash
npx tsc --noEmit
npm run build
npm test
```

### 规则库

```bash
npm run db:build
node scripts/build-class-data.mjs
# 检查 data/compendium-report.json 的 counts/warnings
```

### 关键手工验收

- 打开 `/` 后自动进入 `#/char/justinian01`。
- `Ctrl+K` → 搜「火球」→ 第一条是「火球术」→ 加入法术 → 刷新后仍在。
- 加入装备「板甲」/「长剑」→ 物品出现，武器生成攻击。
- 长休 → HP 回满、法术位归零、生命骰恢复。
- 升级向导 4→5 → 额外攻击、1 环 4、2 环 2、HP 上限 +8。
- 设置 → 备份列表可恢复。
- 移动端 390px 无横向溢出；底部导航可用。
- 深色主题下文字/输入/面板对比度可读。

---

## 12. 一句话交接

这是一个已经可用的本地 D&D 5E 角色卡 + 规则库项目；功能和数据层已完成并通过 19 项测试。下一步不是继续加功能，而是**在不改动数据结构和交互逻辑的前提下，对现有前端做一次完整的视觉诊断和视觉方向重设计**。先确认 superdesign skill 是否可用；不可用就手动完成同等设计流程。绝不要覆盖 `data/characters/justinian01.json` 或运行旧的迁移脚本。
