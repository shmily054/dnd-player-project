# -*- coding: utf-8 -*-
"""Cross-book search over the D&D 5E Chinese markdown database.

Usage:
    python scripts/search.py 关键词 [关键词2 ...]
    python scripts/search.py -i 关键词          # 忽略大小写（对英文有效）
    python scripts/search.py -n 20 关键词       # 最多显示 20 条（默认 50）

多个关键词为 AND 关系。每条结果给出：分册 / 章节 / 原书页码 / 上下文片段。
"""
import os, re, sys, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = [
    ("玩家手册", os.path.join(ROOT, "player handbook")),
    ("城主指南", os.path.join(ROOT, "dungeon master guidance")),
]
PAGE_RE = re.compile(r"\{\{p\.(\d+)\}\}")
HEAD_RE = re.compile(r"^(#{1,5})\s+(.*)$")


def iter_chapters():
    for book, bdir in BOOKS:
        if not os.path.isdir(bdir):
            continue
        for fn in sorted(os.listdir(bdir)):
            if fn == "README.md" or not fn.endswith(".md"):
                continue
            yield book, fn, os.path.join(bdir, fn)


def page_of(pages, line_idx):
    """pages: list of (line_idx_of_marker, page). Return page covering line_idx.

    Content of page N precedes its {{p.N}} marker, so the page is the first
    marker at or after the line; falls back to the previous marker.
    """
    for marker_idx, pno in pages:
        if marker_idx >= line_idx:
            return pno
    return pages[-1][1] if pages else "?"


def search(terms, ignore_case, limit):
    results = []
    for book, fn, path in iter_chapters():
        with open(path, encoding="utf-8") as f:
            lines = f.read().split("\n")
        # precompute page markers and section headings
        pages = [(i, m.group(1)) for i, ln in enumerate(lines)
                 if (m := PAGE_RE.match(ln.strip()))]
        # current section heading per line
        sec_at = {}
        cur_sec = ""
        for i, ln in enumerate(lines):
            m = HEAD_RE.match(ln)
            if m:
                cur_sec = m.group(2).strip()
            sec_at[i] = cur_sec
        chapter = sec_at.get(0, "") or re.sub(r"^\d+-|\.md$", "", fn)

        for i, ln in enumerate(lines):
            if not ln.strip() or PAGE_RE.match(ln.strip()):
                continue
            hay = ln.lower() if ignore_case else ln
            ok = True
            for t in terms:
                needle = t.lower() if ignore_case else t
                if needle not in hay:
                    ok = False
                    break
            if not ok:
                continue
            results.append({
                "book": book,
                "chapter": chapter,
                "section": sec_at.get(i, ""),
                "page": page_of(pages, i),
                "line": ln.strip(),
            })
            if len(results) >= limit:
                return results, True
    return results, False


def main():
    ap = argparse.ArgumentParser(description="跨书检索 D&D 5E 中文文本数据库")
    ap.add_argument("terms", nargs="+", help="关键词（多个为 AND）")
    ap.add_argument("-i", "--ignore-case", action="store_true", help="忽略大小写")
    ap.add_argument("-n", "--limit", type=int, default=50, help="最多显示条数（默认 50）")
    args = ap.parse_args()

    results, truncated = search(args.terms, args.ignore_case, args.limit)
    print(f"共 {len(results)} 条匹配" + ("（已截断，可用 -n 加大上限）" if truncated else ""))
    print()
    for r in results:
        loc = f"[{r['book']}] {r['chapter']}"
        if r["section"] and r["section"] != r["chapter"]:
            loc += f" > {r['section']}"
        loc += f"  ·  原书第 {r['page']} 页"
        print(loc)
        snippet = r["line"]
        print(f"    {snippet[:120]}")
        print()


if __name__ == "__main__":
    main()
