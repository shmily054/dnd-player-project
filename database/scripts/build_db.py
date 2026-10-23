# -*- coding: utf-8 -*-
"""Build per-chapter markdown database from extracted pages + outline (v2)."""
import json, os, re, shutil

OUT_DIR = "database"
pages = json.load(open("pages_text.json", encoding="utf-8"))
outline = json.load(open("outline_debug.json", encoding="utf-8"))

LEFTOVER = {"⺫": "罒", "⻩": "黄", "⻨": "麦", "⻄": "西", "⻜": "飞", "⻘": "青"}
def fix(t):
    for k, v in LEFTOVER.items():
        t = t.replace(k, v)
    return t
pages = [fix(t) for t in pages]

FILE_RE = re.compile(r"^第\d+章")
EXTRA_FILES = {"简介", "附录A 随机地下城", "附录B 怪物清单", "附录D 地下城主启蒙读物"}
PART_RE = re.compile(r"^第\d+部分")

# assign part labels in order
part_of = {}
cur = "前言"
for o in outline:
    if PART_RE.match(o["title"]):
        cur = o["title"]
    elif o["depth"] == 0 and o["title"] in ("附录A 随机地下城", "附录B 怪物清单", "附录D 地下城主启蒙读物"):
        cur = "附录"
    if FILE_RE.match(o["title"]) or o["title"] in EXTRA_FILES:
        part_of[o["title"]] = cur

files = [o for o in outline if (FILE_RE.match(o["title"]) or o["title"] in EXTRA_FILES) and o["page"]]
files.sort(key=lambda o: o["page"])

# page ranges
ranges = []
for i, f in enumerate(files):
    start = f["page"]
    if f["title"] == "简介":
        start = 3  # include credits page
    end = (files[i + 1]["page"] - 1) if i + 1 < len(files) else len(pages)
    ranges.append((f, start, end))

file_starts = {f["title"] for f, _, _ in files and [(f, s, e) for f, s, e in ranges]}
file_titles = {f["title"] for f, _, _ in ranges}

def slugify(title):
    t = re.sub(r"\s+", "", title)
    return re.sub(r'[\\/:*?"<>|]', "", t)

if os.path.isdir(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(OUT_DIR)

index_lines = [
    "# 龙与地下城 5E《城主指南》文本数据库",
    "",
    "> 由《龙与地下城 5E城主指南》配图版 PDF（共 290 页）全文提取整理。",
    "> 每章一个文件；正文中 `{{p.N}}` 标记对应原书 PDF 页码，便于回溯核对。",
    "> 章节小标题以 `##`/`###` 标出，层级与原书书签一致。",
]

last_part = None
for fi, (f, start, end) in enumerate(ranges):
    secs = [o for o in outline
            if o["title"] not in file_titles and o["page"] and start <= o["page"] <= end
            and o["depth"] > f["depth"]]
    sec_by_page = {}
    for s in secs:
        sec_by_page.setdefault(s["page"], []).append(s)

    lines = [f"# {f['title']}", ""]
    for pno in range(start, end + 1):
        body = pages[pno - 1].strip()
        heads = []
        for s in sec_by_page.get(pno, []):
            lvl = "#" * min((s["depth"] - f["depth"]) + 1, 5)
            placed = False
            if body:
                key = s["title"].replace(" ", "")
                body_lines = body.split("\n")
                best = None
                for i, ln in enumerate(body_lines):
                    stripped = ln.replace(" ", "")
                    # heading line: starts with the title, no sentence punctuation, short
                    if (key and stripped.startswith(key)
                            and len(stripped) <= len(key) + 30
                            and not re.search(r"[。，；、！？]", stripped)):
                        best = i
                        break
                if best is not None:
                    body_lines.insert(best, f"{lvl} {s['title']}")
                    placed = True
                body = "\n".join(body_lines)
            if not placed:
                heads.append(f"{lvl} {s['title']}")
        for h in heads:
            lines += [h, ""]
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
