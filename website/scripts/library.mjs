// Builds public/data/library.json from every book JSON in public/data/books/.
// Runs automatically from vite.config.js (dev start, book changes, build);
// can also be run by hand: `npm run library`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BOOKS_DIR = path.join(ROOT, "public", "data", "books");
const OUT = path.join(ROOT, "public", "data", "library.json");

function cleanTitle(title = "", author = "") {
  let t = title.replace(/\s*\|\s*St-Takla\.org\s*$/i, "");
  if (author) t = t.replace(new RegExp(`\\s*-\\s*${author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "");
  return t.replace(/^كتاب\s+/, "").trim();
}

export function buildLibrary({ quiet = false } = {}) {
  const books = [];
  for (const name of fs.readdirSync(BOOKS_DIR).sort()) {
    if (!name.endsWith(".json")) continue;
    let book;
    try {
      book = JSON.parse(fs.readFileSync(path.join(BOOKS_DIR, name), "utf8"));
    } catch (err) {
      console.warn(`[library] skipping ${name}: ${err.message}`);
      continue;
    }
    const chapters = book.chapters || [];
    books.push({
      id: name.replace(/\.json$/, ""),
      file: name,
      title: book.display_title || cleanTitle(book.title, book.author),
      author: book.author || "",
      description: book.description || "",
      source: book.source || "",
      chapter_count: chapters.length,
      paragraph_count: chapters.reduce((n, c) => n + (c.paragraphs || []).length, 0),
      order: book.order ?? 1000,
    });
  }
  books.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ar"));
  const json = JSON.stringify({ books }, null, 2) + "\n";
  const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (json !== old) fs.writeFileSync(OUT, json);
  if (!quiet) console.log(`[library] ${books.length} book(s): ${books.map((b) => b.id).join(", ")}`);
  return books;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildLibrary();
