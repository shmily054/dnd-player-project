# -*- coding: utf-8 -*-
"""Extract D&D 5E DMG (Chinese) PDF into structured markdown files."""
import re, sys, unicodedata, json
import pikepdf
import pdfplumber

PDF_PATH = "source/dmg-5e.pdf"
OUT_DIR = "database"

# --- 1. Outline extraction -------------------------------------------------
def get_outline(pdf):
    items = []

    def resolve_page(item):
        # try action /D first
        act = item.action
        dest = item.destination
        d = None
        if act is not None and "/D" in act:
            d = act["/D"]
        elif dest is not None:
            d = dest
        if d is None:
            return None
        try:
            page_obj = d[0]
            if page_obj is None:
                return None
            return pdf.pages.index(page_obj) + 1
        except Exception:
            try:
                return pikepdf.Page(page_obj).index + 1
            except Exception:
                return None

    def walk(outline_items, depth=0):
        for it in outline_items:
            items.append({
                "depth": depth,
                "title": str(it.title).strip(),
                "page": resolve_page(it),
            })
            if it.children:
                walk(it.children, depth + 1)

    with pdf.open_outline() as ol:
        walk(ol.root)
    return items

# --- 2. Text normalization -------------------------------------------------
# Kangxi radicals + CJK radical supplement chars that NFKC may miss.
MANUAL_MAP = {
    "⻰": "龙", "⻥": "鱼", "⻦": "鸟", "⻢": "马", "⻛": "风",
    "⻝": "食", "⻔": "门", "⻅": "见", "⻆": "角", "⻓": "长",
    "⻋": "车", "⻉": "贝", "⻌": "辶", "⻏": "阝", "⻖": "阝",
    "⻙": "韦", "⻚": "页", "⻢": "马", "⽉": "月",
}

def normalize(text):
    text = unicodedata.normalize("NFKC", text)
    for k, v in MANUAL_MAP.items():
        text = text.replace(k, v)
    return text

# --- 3. Main ---------------------------------------------------------------
def main():
    pdf_pk = pikepdf.open(PDF_PATH)
    outline = get_outline(pdf_pk)
    n_pages = len(pdf_pk.pages)

    with open("outline_debug.json", "w", encoding="utf-8") as f:
        json.dump(outline, f, ensure_ascii=False, indent=1)

    # extract all pages (column-aware)
    def col_text(page):
        w, h = page.width, page.height
        mid = w / 2
        words = page.extract_words()
        cross = [x for x in words if x["x0"] < mid - 5 and x["x1"] > mid + 5]
        ratio = len(cross) / max(len(words), 1)
        if ratio < 0.03 and len(words) > 30:
            left = page.crop((0, 0, mid, h)).extract_text() or ""
            right = page.crop((mid, 0, w, h)).extract_text() or ""
            return left + "\n" + right
        return page.extract_text() or ""

    pages_text = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for i, page in enumerate(pdf.pages):
            pages_text.append(normalize(col_text(page)))
            if (i + 1) % 50 == 0:
                print(f"extracted {i+1}/{n_pages}", flush=True)

    with open("pages_text.json", "w", encoding="utf-8") as f:
        json.dump(pages_text, f, ensure_ascii=False)

    print("outline entries:", len(outline))
    missing = [o for o in outline if o["page"] is None]
    print("entries without page:", [o["title"] for o in missing])

if __name__ == "__main__":
    main()
