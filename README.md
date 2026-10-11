# استاذ حلمي القمص يعقوب

A digital library of the books of أ. حلمي القمص يعقوب: a React website with
Arabic full-text search, the tool that extracts the books from
[st-takla.org](https://st-takla.org/), and the project logo.

| Folder / file | What it is |
|---|---|
| [`website/`](website/) | React (Vite) site: library, chapter reader, search with highlighting, FAQ. See [website/README.md](website/README.md). |
| [`scrape_book.py`](scrape_book.py) | Downloads a book from st-takla.org into a JSON file. |
| [`scrape_all.py`](scrape_all.py) | Downloads every book of the author (list inside) into `website/public/data/books/`. |
| `helmi-cross-questions.json` | First extracted book: «أسئلة حول الصليب» (95 chapters). |
| [`logo/`](logo/) | Logo (simplified Coptic Yota cross + name) as layered PSD and PNG in palette, mono and dark versions; `make_logo.py` regenerates them. |

## Quick start

```
cd website
npm install
npm run dev
```

## Add a book

All the author's books:

```
python scrape_all.py            # only books not downloaded yet
python scrape_all.py --force    # re-download all
python scrape_all.py <book-id>  # re-download one book
```

A single book from any index URL:

```
python scrape_book.py <st-takla book index URL> website/public/data/books/<book-id>.json
```

The site picks the new file up automatically (dev server and `npm run build`).

`scrape_book.py` and `scrape_all.py` need `pip install requests beautifulsoup4 lxml`;
`logo/make_logo.py` needs `pip install skia-python uharfbuzz psd-tools pillow numpy`.
