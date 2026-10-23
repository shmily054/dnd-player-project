# -*- coding: utf-8 -*-
"""Build per-chapter markdown database for D&D 5E PHB (Chinese)."""
import json, os, re, shutil

OUT_DIR = "player handbook"
pages = json.load(open("phb_pages_text.json", encoding="utf-8"))
outline = json.load(open("phb_outline.json", encoding="utf-8"))

LEFTOVER = {"⺩": "王"}
TITLE_FIX = {"和面检定": "豁免检定"}

def fix(t):
    for k, v in LEFTOVER.items():
        t = t.replace(k, v)
    return t

pages = [fix(t) for t in pages]
for o in outline:
    o["title"] = TITLE_FIX.get(o["title"], o["title"])

FILE_RE = re.compile(r"^第\d+章")
EXTRA_FILES = {"简介", "附录A 状态", "附录B 多元宇宙诸神", "附录C 存在位面",
               "附录D 生物资料", "附录E 启蒙读物"}
PART_RE = re.compile(r"^第\d+部分")
SKIP_TITLES = {"空白页面", "空白空白页面", "封面"}

def is_file_entry(o):
    return FILE_RE.match(o["title"]) or o["title"] in EXTRA_FILES

# assign part labels in order
part_of = {}
cur = "前言"
for o in outline:
    t = o["title"]
    if t in SKIP_TITLES:
        continue
    if PART_RE.match(t):
        cur = t
    elif re.match(r"^附录", t) and is_file_entry(o):
        cur = "附录"
    if is_file_entry(o):
        part_of[t] = cur

files = [o for o in outline if is_file_entry(o) and o["page"]]
files.sort(key=lambda o: o["page"])

# page ranges
ranges = []
for i, f in enumerate(files):
    start = f["page"]
    if f["title"] == "简介":
        start = 2  # include credits/TOC/foreword pages
    end = (files[i + 1]["page"] - 1) if i + 1 < len(files) else len(pages)
    ranges.append((f, start, end))

file_titles = {f["title"] for f, _, _ in ranges}

def slugify(title):
    t = re.sub(r"\s+", "", title)
    return re.sub(r'[\\/:*?"<>|]', "", t)

if os.path.isdir(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(OUT_DIR)

index_lines = [
    "# 龙与地下城 5E《玩家手册》文本数据库",
    "",
    "> 由《龙与地下城 最终版5e玩家手册》PDF（共 288 页）全文提取整理。",
    "> 每章一个文件；正文中 `{{p.N}}` 标记对应原书 PDF 页码，便于回溯核对。",
    "> 章节小标题以 `##`/`###` 标出，层级与原书书签一致。",
]

last_part = None
for fi, (f, start, end) in enumerate(ranges):
    secs = [o for o in outline
            if o["title"] not in file_titles and o["title"] not in SKIP_TITLES
            and o["page"] and start <= o["page"] <= end
            and o["depth"] > f["depth"]]
    sec_by_page = {}
    for s in secs:
        sec_by_page.setdefault(s["page"], []).append(s)

    lines = [f"# {f['title']}", ""]
    for pno in range(start, end + 1):
        body = pages[pno - 1].strip()
        body_lines = body.split("\n") if body else []
        last_pos = None  # body_lines index where the previous section (outline order) was placed
        for s in sec_by_page.get(pno, []):
            lvl = "#" * min((s["depth"] - f["depth"]) + 1, 5)
            heading = f"{lvl} {s['title']}"
            key = s["title"].replace(" ", "")
            best = None
            for i, ln in enumerate(body_lines):
                stripped = ln.replace(" ", "")
                if (key and stripped.startswith(key)
                        and len(stripped) <= len(key) + 30
                        and not re.search(r"[。，；、！？]", stripped)):
                    best = i
                    break
            if best is not None:
                body_lines.insert(best, heading)
                last_pos = best
            elif last_pos is not None:
                # no text anchor (e.g. decorative letter headings): keep outline
                # order by inserting right after the previously placed heading
                body_lines.insert(last_pos + 1, heading)
                last_pos = last_pos + 1
            else:
                body_lines.insert(0, heading)
                last_pos = 0
        body = "\n".join(body_lines)
        if body:
            lines.append(body)
        lines += ["", f"{{{{p.{pno}}}}}", ""]

    fname = f"{fi:02d}-{slugify(f['title'])}.md"
    with open(os.path.join(OUT_DIR, fname), "w", encoding="utf-8") as fo:
        fo.write("\n".join(lines))

    part = part_of.get(f["title"])
    if part != last_part:
        index_lines += ["", f"## {part}", ""]
        last_part = part
    index_lines.append(f"- [{f['title']}]({fname}) — 原书第 {start}–{end} 页")

with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as fo:
    fo.write("\n".join(index_lines) + "\n")

print("files written:", len(ranges))
for fn in sorted(os.listdir(OUT_DIR)):
    print(" ", fn, os.path.getsize(os.path.join(OUT_DIR, fn)))
