# مكتبة الأستاذ حلمي القمص يعقوب — website

React (Vite) site that shows the books of أ. حلمي القمص يعقوب, with full-text
Arabic search and an FAQ. All content is read from JSON files:

- `public/data/books/*.json` — one file per book (output of `../scrape_book.py`)
- `public/data/library.json` — generated automatically from the book files
- `public/data/faqs.json` — FAQ categories and questions

## Commands

```
npm install        # once
npm run dev        # development server with hot reload
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
npm test           # search unit tests (Vitest)
npm run library    # regenerate library.json by hand (normally automatic)
```

To publish, upload the contents of `dist/` to any static host (GitHub Pages,
Netlify, Cloudflare Pages, shared hosting…). URLs use `#/…`, and asset paths are
relative, so no server configuration is needed and it works from a sub-folder.

## Add a book

Put the book JSON in `public/data/books/` — for example:

```
python ../scrape_book.py https://st-takla.org/books/helmy-elkommos/revelation/index.html public/data/books/helmi-revelation.json
```

The file name (without `.json`) becomes the book id in URLs. `library.json` is
rebuilt automatically when the dev server sees the file and on every
`npm run build`; the book then shows on the home page and is searchable.

Optional top-level fields in a book file: `display_title`, `description`,
`order` (lower numbers are listed first).

## Edit the FAQ

`public/data/faqs.json`: a list of categories, each with `items` of `{ "q", "a" }`.
Answers may contain simple HTML; link to a chapter with
`<a href="#/book/<book-id>/<chapter-number>">…</a>`.
The current questions are placeholders to be replaced after discussion.

## Search

- Runs in the browser across every book (or one book).
- Ignores tashkeel/tatweel and treats أ/إ/آ/ا, ى/ي, ة/ه, ؤ/و, ئ/ي and
  Arabic/Latin digits as equal — `الله` finds `اللَّه`.
- Several words = paragraphs containing all of them; `"..."` = exact phrase.
- Results link to the exact paragraph; the chapter view highlights every match
  with ▲/▼ to move between them.

## Structure

```
src/
  App.jsx                 routes
  components/             Layout (header/footer), SearchForm, Highlight, MatchBar, Yota logo, …
  pages/                  Home, BookPage, ChapterPage, SearchPage, FaqPage
  lib/arabicSearch.js     normalisation, matching, highlight ranges (+ tests)
  lib/data.js             cached JSON loading, search index, useAsync hook
scripts/library.mjs       builds public/data/library.json (used by vite.config.js)
```

| URL | Page |
|---|---|
| `#/` | library home |
| `#/book/<id>` | book page + table of contents |
| `#/book/<id>/<n>?q=…&p=…` | chapter reader (optional highlight + jump to paragraph) |
| `#/search?q=…&book=<id>` | search results |
| `#/faq` | FAQ |
