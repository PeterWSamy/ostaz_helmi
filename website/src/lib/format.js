export const arabicNumber = (n) => Number(n).toLocaleString('ar-EG')

/** "12- title" -> "title" */
export const stripNumber = (title) => title.replace(/^\s*\d+\s*[-–]\s*/, '')

export function chapterPath(bookId, order, q, p) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (p != null) params.set('p', p)
  const qs = params.toString()
  return `/book/${encodeURIComponent(bookId)}/${order}${qs ? `?${qs}` : ''}`
}

export function searchPath(q, book) {
  const params = new URLSearchParams({ q })
  if (book) params.set('book', book)
  return `/search?${params}`
}

/** Paragraph style for the books' Q&A layout. */
export function paragraphClass(text) {
  if (/^س\s*\d+\s*:/.test(text)) return 'q'
  if (/^ج\s*:?\s*$/.test(text)) return 'a'
  if (text.length < 70 && !/[.:،؛؟!"»)]$/.test(text)) return 'sub'
  return undefined
}

export function storage(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key)
    localStorage.setItem(key, value)
  } catch {
    return null
  }
  return null
}
