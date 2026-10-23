# D&D 5E 角色卡与中文规则库

一个**完全本地运行**的 D&D 5E（2014 规则）角色卡与规则库检索应用。

仓库同时包含两部分：

- `player card ds/`：React + Node 的角色卡应用。
- `database/`：《玩家手册》和《城主指南》的中文 Markdown 规则库，以及可选的 PDF 提取脚本。

角色数据保存在本机 JSON 文件中，规则库直接读取 Markdown，不需要云服务、外部数据库或账号系统。

---

## 功能概览

### 角色卡

- 身份、种族、背景、阵营、经验值和头像。
- 多职业数据模型，自动计算总等级、熟练加值与派生数值。
- 六属性、豁免、18 项技能、专精、被动察觉/调查/洞悉。
- HP（含临时生命值）、AC、先攻、速度、生命骰、死亡豁免、力竭、状态与专注。
- 受伤时先扣临时生命值，溢出伤害再扣本体 HP。
- 攻击、伤害加值、法术位、契约法术位、准备法术、常备法术。
- 准备法术只统计 1 环及以上法术，戏法不参与准备数量。
- 物品、负重、装备、同调、钱币与财富。
- 职业资源、使用次数、短休/长休恢复。
- 特性与专长、职业特性检索与加入、角色扮演档案。
- 800ms 防抖自动保存；保存前自动备份，最多保留 30 份。
- 支持 JSON 导入/导出、头像上传、角色复制和备份恢复。
- 响应式布局，支持桌面与手机浏览器；提供羊皮纸/墨夜两套主题。

### 规则库

当前索引包含：

| 分类 | 数量 |
|---|---:|
| 法术 | 355 |
| 魔法物品 | 243 |
| 专长 | 42 |
| 职业特性 | 106 |
| 状态 | 15 |
| 护甲/盾牌/武器 | 50 |
| 结构化条目合计 | 811 |

另外支持对 `database/` 下全部 Markdown 做原文全文检索。

- 法术可按环位、学派、职业筛选。
- 魔法物品可按稀有度、类型筛选。
- 职业特性可按职业、职业等级筛选，覆盖 12 个职业的基础特性。
- 支持中文名、英文名和正文关键词检索。
- 检索结果可一键加入角色卡：
  - 法术自动带入环位、学派、施法时间、距离、成分、持续时间、专注/仪式标记和描述。
  - 武器加入物品栏时可自动生成攻击条目。
  - 专长、职业特性、状态、装备和魔法物品分别进入对应模块。
- 职业特性加入时会按“职业 + 特性名”去重；自动生成但缺少描述的特性会优先补全，而不是重复添加。
- 升级向导会自动更新等级、熟练加值、HP、法术位、职业资源和基础职业特性。

### 休息与资源

- 短休：花费生命骰、恢复短休资源和契约法术位。
- 长休：回满 HP、恢复法术位、恢复一半生命骰（至少 1）、力竭 -1、清除专注和死亡豁免。
- 支持圣疗、引导神力、气、术法点等职业资源的自定义与恢复方式。

---

## 项目结构

```text
.
├─ database/
│  ├─ player handbook/              # 《玩家手册》Markdown 分章
│  ├─ dungeon master guidance/      # 《城主指南》Markdown 分章
│  ├─ source/                       # 原始 PDF（可选，体积较大）
│  └─ scripts/                      # PDF 提取与检索辅助脚本
│
└─ player card ds/
   ├─ src/                          # React 前端
   ├─ server/                       # Node HTTP 服务、API、检索与索引加载
   ├─ scripts/                      # 规则索引、职业数据、启动器、旧角色迁移
   ├─ shared/classes.json           # 12 职业 × 20 级成长与资源数据
   ├─ tests/                        # Vitest 测试
   ├─ data/                         # 角色、头像、备份、生成的索引
   ├─ config.json                   # 默认端口与数据库路径
   ├─ start.bat                     # Windows 一键启动
   └─ package.json
```

数据流：

```text
database/**/*.md
      │
      ▼
scripts/build-compendium.mjs
      │
      ▼
data/compendium.json
      │
      ▼
server/search.mjs  ──►  /api/search  ──►  React 规则库界面
```

---

## 环境要求

- **Node.js 20.19+**（推荐 Node.js 22 LTS）
- npm
- 日常运行不需要 Python。
- 只有重新从 PDF 提取规则文本时，才需要 Python 及相关 PDF 处理工具。

应用只绑定 `127.0.0.1`，默认不会暴露到局域网或公网。

---

## 快速开始

### 1. 准备目录

克隆后保持两个目录的相对位置：

```text
dnd-player-card/
├─ database/
└─ player card ds/
```

`player card ds/config.json` 中的默认数据库路径是 `../database`。

### 2. 安装与开发模式

目录名包含空格，命令中请加引号：

```bash
cd "player card ds"
npm install
npm run dev
```

打开控制台输出的地址。默认是：

```text
http://127.0.0.1:7100/
```

如果 7100 被占用，服务会自动尝试 7101–7119，实际地址以控制台输出为准。

### 3. 生产模式

```bash
cd "player card ds"
npm install
npm run build
npm start
```

Windows 也可以直接双击 `player card ds/start.bat`。首次运行会自动安装依赖并按需构建前端。

### 4. 重建规则库索引

首次运行时，如果缺少 `data/compendium.json`，服务会自动构建索引。手动重建：

```bash
cd "player card ds"
npm run db:build
```

修改了 `database/` 下的 Markdown 后，也可以在应用「设置 → 规则库数据库」中点击重建索引。

---

## 配置

默认配置位于 `player card ds/config.json`：

```json
{
  "databaseDir": "../database",
  "port": 7100,
  "host": "127.0.0.1"
}
```

应用内的设置会写入 `player card ds/data/settings.json`，并覆盖默认配置。

`databaseDir` 相对于 `player card ds/` 解析，也可以使用绝对路径。

---

## 数据与隐私

| 路径 | 内容 |
|---|---|
| `player card ds/data/characters/<id>.json` | 角色存档 |
| `player card ds/data/backups/<id>/` | 自动备份，最多 30 份 |
| `player card ds/data/portraits/` | 上传的头像 |
| `player card ds/data/compendium.json` | 生成的结构化规则索引 |
| `player card ds/data/compendium-report.json` | 索引解析报告与警告 |
| `player card ds/data/settings.json` | 应用设置覆盖 |

应用不会上传角色数据，也不包含遥测。所有内容都保存在本机。

> 如果把仓库公开发布，务必确认 `data/characters/`、`data/portraits/`、`data/backups/` 中没有个人角色资料或不想公开的图片。

---

## 常用脚本

在 `player card ds/` 下运行：

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发模式，Vite middleware + 本地 Node 服务 |
| `npm run build` | TypeScript 检查并构建前端到 `dist/` |
| `npm start` | 生产模式，启动服务并打开浏览器 |
| `npm test` | 运行 Vitest 测试 |
| `npm run db:build` | 重新解析 `database/`，生成 `data/compendium.json` |
| `npm run db:classes` | 重新生成 `shared/classes.json` |
| `npm run db:migrate-old` | 重新导入旧角色数据（会覆盖示例角色，谨慎使用） |

当前测试状态：**27 项全部通过**。

---

## 发布到 GitHub 前

当前工作目录包含开发依赖、生成产物和个人数据。公开前建议至少处理以下内容：

### 不要提交

```text
player card ds/node_modules/
player card ds/dist/
player card ds/data/characters/
player card ds/data/backups/
player card ds/data/portraits/
player card ds/data/compendium.json
player card ds/data/compendium-report.json
player card ds/data/settings.json
player card ds/backups/
player card ds/.zcode/
player card ds/.superdesign/
database/source/
```

`data/compendium.json` 可以通过 `npm run db:build` 重新生成，不必提交。

### 建议补充

- 一个 `.gitignore`，覆盖上述路径。
- 一个示例角色（如果希望仓库打开后能看到演示数据），不要使用真实角色和头像。
- 一个正式的 `LICENSE` 文件。

如果仓库当前已经跟踪了这些文件，需要使用 `git rm --cached` 从索引移除后再提交。注意：这不会删除本地文件，但会改变仓库内容。

---

## 版权与许可

- **代码许可证待定。** 当前仓库没有附带 `LICENSE`；在添加明确许可证之前，代码默认保留所有权利。
- 《玩家手册》《城主指南》的原文、译文和 PDF 版权归原权利人所有（Dungeons & Dragons 相关商标属于 Wizards of the Coast，中文译文版权归相应出版方）。
- 本项目的代码许可证**不覆盖** `database/` 中的规则文本、PDF 或提取内容。
- 公开分发规则文本或 PDF 前，请确认你拥有相应授权。若没有授权，建议只发布应用代码，并将 `database/` 作为本地私有目录使用。
- 本项目与 Wizards of the Coast 无关联。

---

## 已知限制

- 仅覆盖 2014 版《玩家手册》和《城主指南》，不包含 2024 规则、怪物图鉴或扩展书。
- 不包含骰子台或掷骰记录；攻击与技能只计算加值。
- 不提供 A4 打印、PDF 导出或 Markdown 导出。
- 规则库索引目前覆盖基础职业特性，子职业专属特性尚未逐条建立索引。
- PDF 提取文本可能存在少量分栏串行、页码偏移或 OCR 噪声；检索始终可以回退到原文。
- 这是一个本地单用户应用，没有登录、权限或公网部署防护，不建议直接暴露到公网。
