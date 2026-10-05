# استاذ حلمي القمص يعقوب

A digital library of the books of أ. حلمي القمص يعقوب: a React website with
Arabic full-text search, the tool that extracts the books from
[st-takla.org](https://st-takla.org/), and the project logo.

| Folder / file | What it is |
|---|---|
| [`website/`](website/) | React (Vite) site: library, chapter reader, search with highlighting, FAQ. See [website/README.md](website/README.md). |
| [`scrape_book.py`](scrape_book.py) | Downloads a book from st-takla.org into a JSON file. |
| `helmi-cross-questions.json` | First extracted book: «أسئلة حول الصليب» (95 chapters). |
| [`logo/`](logo/) | Logo (simplified Coptic Yota cross + name) as layered PSD and PNG in palette, mono and dark versions; `make_logo.py` regenerates them. |

## Quick start

```
cd website
npm install
npm run dev
```

## Add a book

```
python scrape_book.py <st-takla book index URL> website/public/data/books/<book-id>.json
```

The site picks the new file up automatically (dev server and `npm run build`).

`scrape_book.py` needs `pip install requests beautifulsoup4 lxml`;
`logo/make_logo.py` needs `pip install skia-python uharfbuzz psd-tools pillow numpy`.
