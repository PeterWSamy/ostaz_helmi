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
            # hard deadline: the read timeout alone lets a trickling response hang forever
            deadline = time.monotonic() + 90
            with SESSION.get(url, timeout=(10, 30), stream=True) as r:
                r.raise_for_status()
                content = b""
                for chunk in r.iter_content(65536):
                    content += chunk
                    if time.monotonic() > deadline:
                        raise TimeoutError("download took over 90s")
            return BeautifulSoup(content.decode("windows-1256", errors="replace"), "lxml")
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


def toc_links(soup, page_url):
    """Links on a page that look like table-of-contents entries: same-directory
    .html pages whose link is most of the text of its block (not an inline
    cross-reference), skipping the prev/next footer."""
    body = soup.find(id="bodytext") or soup
    folder = page_url.rsplit("/", 1)[0]
    out = []
    for a in body.find_all("a", href=True):
        if a.get("id") in ("next", "prev") or a.find_parent("table", class_="table-footer"):
            continue
        url = urljoin(page_url, a["href"]).split("#")[0]
        if not url.endswith(".html") or url.rsplit("/", 1)[0] != folder:
            continue
        text = clean(a.get_text(" "))
        block = a.find_parent(["p", "li", "td", "h2", "h3", "h4", "h5", "div"])
        extra = len(clean(block.get_text(" "))) - len(text) if block is not None else 0
        if not text or (extra > len(text) and extra > 40):
            continue
        out.append((url, text))
    return out


def next_link(soup, page_url):
    a = soup.find("a", id="next", href=True)
    return urljoin(page_url, a["href"]).split("#")[0] if a else None


def parse_chapter(soup):
    body = soup.find(id="bodytext")
    if body is None:
        # a few pages lack the bodytext wrapper: keep what lies between the
        # title and the prev/next footer
        h1, footer = soup.find("h1"), soup.find("table", class_="table-footer")
        body = h1.find_parent("body") if h1 else None
        if body is None:
            return {"title": "", "paragraphs": [], "footnotes": []}
        ancestors = {id(el) for el in h1.parents}  # tags hash by content, which changes as we cut
        for el in h1.find_all_previous():
            if id(el) not in ancestors:
                el.decompose()
        if footer is not None:
            for el in footer.find_all_next():
                el.decompose()
            footer.decompose()

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


def scrape(index_url, stop=()):
    """Walk a book in reading order. Its pages are the table of contents: the
    index plus, recursively, every section page's own list. Each page's
    «next» link is followed when it points into those contents; otherwise the
    walk continues with the first unread entry. Pages in `stop` (other books'
    entry pages in a shared folder) are never part of the book."""
    soup = fetch(index_url)
    book_title = clean(soup.title.get_text()) if soup.title else ""
    blocked = set(stop) | {index_url}
    toc, titles = [], {}

    def add_entries(links, after=None):
        new = [(u, t) for u, t in links if u not in blocked and u not in titles]
        for u, t in new:
            titles[u] = t
        pos = toc.index(after) + 1 if after in toc else len(toc)
        toc[pos:pos] = [u for u, _ in dict(new).items()]
        return len(new)

    add_entries(toc_links(soup, index_url))
    chapters, done, next_targets = [], set(), set()
    cur = toc[0] if toc else None
    while cur:
        done.add(cur)
        print(f"[{len(done)}] {cur.rsplit('/', 1)[-1]}", file=sys.stderr)
        page = fetch(cur)
        nxt = next_link(page, cur)
        # A section page leads («next») into its own list; a chapter's
        # stand-alone links are cross-references, not contents.
        links = toc_links(page, cur)
        is_section = nxt is None or nxt in {u for u, _ in links}
        has_children = is_section and add_entries(links, after=cur) > 0
        ch = parse_chapter(page)
        name = cur.rsplit("/", 1)[-1]
        chapters.append({
            "order": len(chapters) + 1,
            "title": ch["title"] or titles.get(cur, ""),
            "toc_title": titles.get(cur, "") or ch["title"],
            "is_section_header": has_children or name.startswith("lesson-") or not ch["paragraphs"],
            "url": cur,
            "paragraphs": ch["paragraphs"],
            "footnotes": ch["footnotes"],
        })
        # volumes sharing a folder chain into each other, so «next» is only
        # followed within the book's own table of contents
        if nxt and nxt not in blocked and nxt != index_url:
            next_targets.add(nxt)
        if nxt in titles and nxt not in done:
            cur = nxt
        else:
            cur = next((u for u in toc if u not in done), None)
        time.sleep(0.3)

    for url in sorted(next_targets - done):
        print(f"  not in contents (from a «next» link): {url}", file=sys.stderr)
    return {
        "title": book_title,
        "author": "أ. حلمي القمص يعقوب",
        "source": index_url,
        "retrieved": time.strftime("%Y-%m-%d"),
        "chapter_count": len(chapters),
        "chapters": chapters,
    }


def main():
    index_url = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "book.json"
    book = scrape(index_url)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=2)
    print(f"wrote {out}: {book['chapter_count']} chapters", file=sys.stderr)


if __name__ == "__main__":
    main()
