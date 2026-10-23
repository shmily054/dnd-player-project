# database/source

这个目录只用于在**本地**存放原始 PDF，供重新提取规则文本时使用。应用运行和 `npm run db:build` 都不读取这里的 PDF：

- 应用运行时读取 `database/player handbook/` 和 `database/dungeon master guidance/` 下的 Markdown。
- `npm run db:build` 只解析这些 Markdown，生成 `player card ds/data/compendium.json`。

仓库不包含 PDF，因为它们体积大，且属于受版权保护的出版物。`.gitignore` 只忽略本目录下的 `*.pdf`，因此这个说明文件仍会保留在仓库中。

`database/` 根目录下的 `pages_text.json`、`outline_debug.json`、`phb_pages_text.json`、`phb_outline.json` 是从 PDF 提取出的中间产物，同样已被忽略、不再提交；需要时可由 `extract_*.py` 重新生成。

## 需要重新提取文本时

请使用你合法持有的副本，按脚本当前使用的相对路径放置：

```text
database/source/phb-5e.pdf   # 《玩家手册》
database/source/dmg-5e.pdf   # 《城主指南》
```

`database/scripts/extract_phb.py` 和 `extract_dmg.py` 顶部的 `PDF_PATH` 使用的正是上述相对路径。脚本还需要 Python 及 `pikepdf`、`pdfplumber` 等依赖；提取和 Markdown 生成脚本使用相对路径，重新运行前请先确认工作目录和输出目录，避免覆盖现有文本。

注意：`build_db.py` 和 `build_phb.py` 会先删除并重建各自的输出目录。运行前请先备份 `database/`，并确认当前工作目录和 `OUT_DIR` 指向正确位置。

不要提交个人扫描件、购买账号信息、带水印的副本或任何无权公开的资料。
