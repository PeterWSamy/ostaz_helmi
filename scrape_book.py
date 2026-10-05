"""Scrape a book by أ. حلمي القمص يعقوب from st-takla.org into JSON.

Usage:
    python scrape_book.py <book-index-url> [output.json]

Example:
    python scrape_book.py https://st-takla.org/books/helmy-elkommos/cross/index.html cross.json
"""
import json
import re
import sys
import time
import urllib3
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, NavigableString

urllib3.disable_warnings()
SESSION = requests.Session()
SESSION.headers["User-Agent"] = "Mozilla/5.0"
SESSION.verify = False  # site's cert chain fails on this machine's store


def fetch(url):
    for attempt in range(4):
        try:
            r = SESSION.get(url, timeout=30)
            r.raise_for_status()
            return BeautifulSoup(r.content.decode("windows-1256", errors="replace"), "lxml")
        except Exception as e:
            if attempt == 3:
                raise
            print(f"  retry {url}: {e}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))


def clean(text):
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\s*\n\s*", " ", text)
    text = re.sub(r" +([،.:؛؟!)\]])", r"\1", text)
    text = re.sub(r"([(\[]) +", r"\1", text)
    return text.strip()


def parse_toc(index_url):
    soup = fetch(index_url)
    body = soup.find(id="bodytext") or soup
    title = clean(soup.title.get_text()) if soup.title else ""
    entries, seen = [], set()
    for a in body.find_all("a", href=True):
        href = a["href"]
        if "/" in href or ":" in href or href.startswith("#") or not href.endswith(".html"):
            continue
        if href in ("index.html",) or href in seen:
            continue
        seen.add(href)
        entries.append({"file": href, "toc_title": clean(a.get_text(" "))})
    return title, entries


def parse_chapter(url):
    soup = fetch(url)
    body = soup.find(id="bodytext")
    if body is None:
        return {"title": "", "paragraphs": [], "footnotes": []}

    h1 = body.find("h1")
    title = clean(h1.get_text(" ")) if h1 else ""

    # footnotes
    footnotes = []
    for fn in body.find_all("div", id=re.compile(r"^ftn\d+")):
        t = clean(fn.get_text(" "))
        m = re.match(r"\((\d+)\)\s*(.*)", t, re.S)
        if m:
            footnotes.append({"n": int(m.group(1)), "text": m.group(2).strip()})
        elif t:
            footnotes.append({"n": None, "text": t})
        fn.decompose()

    # drop noise: scripts, image/caption tables, nav table, footnote header
    for tag in body.find_all(["script", "style", "noscript", "ins", "iframe", "img"]):
        tag.decompose()
    for tbl in body.find_all("table"):
        tbl.decompose()
    for h in body.find_all(["h6"]):
        h.decompose()
    for tag in body.find_all(["h2", "h3"]):
        tag.decompose()
    if h1:
        h1.decompose()

    # walk block elements in order
    paragraphs = []
    for el in body.find_all(["p", "li", "h4", "h5", "blockquote"]):
        if el.find(["p", "li"]):  # skip containers; leaves are captured individually
            continue
        t = clean(el.get_text(" "))
        if not t or t == "_____" or t.startswith("St-Takla.org Image") or t.startswith("صورة في موقع الأنبا تكلا"):
            continue
        paragraphs.append(t)
    return {"title": title, "paragraphs": paragraphs, "footnotes": footnotes}


def main():
    index_url = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "book.json"
    book_title, toc = parse_toc(index_url)
    print(f"{book_title}: {len(toc)} chapters", file=sys.stderr)

    chapters = []
    for i, e in enumerate(toc, 1):
        url = urljoin(index_url, e["file"])
        print(f"[{i}/{len(toc)}] {e['file']}", file=sys.stderr)
        ch = parse_chapter(url)
        chapters.append({
            "order": i,
            "title": ch["title"] or e["toc_title"],
            "toc_title": e["toc_title"],
            "is_section_header": e["file"].startswith("lesson-"),
            "url": url,
            "paragraphs": ch["paragraphs"],
            "footnotes": ch["footnotes"],
        })
        time.sleep(0.5)

    book = {
        "title": book_title,
        "author": "أ. حلمي القمص يعقوب",
        "source": index_url,
        "retrieved": time.strftime("%Y-%m-%d"),
        "chapter_count": len(chapters),
        "chapters": chapters,
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=2)
    print(f"wrote {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
