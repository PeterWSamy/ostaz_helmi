// Data loading: everything comes from JSON under public/data/.
import { useEffect, useEffectEvent, useState } from 'react'
import { normalize } from './arabicSearch.js'

const BASE = import.meta.env.BASE_URL

export class NotFoundError extends Error {}

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

const cache = new Map()
function cached(key, load) {
  if (!cache.has(key)) {
    // drop failed loads so a retry can succeed
    cache.set(key, load().catch((err) => { cache.delete(key); throw err }))
  }
  return cache.get(key)
}

/** Library manifest (generated from public/data/books by scripts/library.mjs). */
export function loadLibrary() {
  return cached('library', () => getJSON(`${BASE}data/library.json`).then((d) => d.books || []))
}

export function loadBook(id) {
  return cached(`book:${id}`, async () => {
    const meta = (await loadLibrary()).find((b) => b.id === id)
    if (!meta) throw new NotFoundError('لم يتم العثور على هذا الكتاب.')
    const book = await getJSON(`${BASE}data/books/${encodeURIComponent(meta.file)}`)
    return { ...book, meta }
  })
}

export function loadFaqs() {
  return cached('faqs', () => getJSON(`${BASE}data/faqs.json`).then((d) => d.categories || []))
}

/**
 * Search index over every book: one entry per chapter title ("t"),
 * paragraph ("0", "1", …) and footnote ("f0", …), with pre-normalised text.
 */
export function loadIndex() {
  return cached('index', async () => {
    const lib = await loadLibrary()
    const books = await Promise.all(lib.map((b) => loadBook(b.id)))
    const entries = []
    for (const book of books) {
      for (const ch of book.chapters) {
        const base = { book: book.meta.id, ch: ch.order }
        entries.push({ ...base, p: 't', text: ch.title, norm: normalize(ch.title) })
        ch.paragraphs.forEach((text, i) => entries.push({ ...base, p: String(i), text, norm: normalize(text) }))
        ;(ch.footnotes || []).forEach((fn, i) => entries.push({ ...base, p: `f${i}`, text: fn.text, norm: normalize(fn.text) }))
      }
    }
    return { entries, books }
  })
}

/**
 * Run `load()` whenever `key` changes: { data, error, loading }.
 * Data from a previous key is never shown for the new one.
 */
export function useAsync(load, key) {
  const [state, setState] = useState({ key: undefined, data: null, error: null })
  const run = useEffectEvent(load)
  useEffect(() => {
    let alive = true
    run().then(
      (data) => alive && setState({ key, data, error: null }),
      (error) => alive && setState({ key, data: null, error }),
    )
    return () => { alive = false }
  }, [key])
  const current = state.key === key
  return { data: current ? state.data : null, error: current ? state.error : null, loading: !current }
}
