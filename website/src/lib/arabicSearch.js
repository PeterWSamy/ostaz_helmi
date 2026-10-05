// Arabic-aware text search: normalisation, matching and highlight ranges.

// tashkeel, Quranic marks, superscript alef, tatweel, bidi/zero-width marks
const IGNORED = /[ؐ-ًؚ-ٰٟۖ-ۭـ‌-‏]/
const FOLD = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'ة': 'ه',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

/** Normalised text plus map[i] = index in `s` of normalised char i. */
export function normalizeWithMap(s) {
  let text = ''
  const map = []
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (IGNORED.test(ch)) continue
    const folded = FOLD[ch] || ch.toLowerCase()
    for (let k = 0; k < folded.length; k++) {
      text += folded[k]
      map.push(i)
    }
  }
  return { text, map }
}

export function normalize(s) {
  return normalizeWithMap(s).text
}

/** "a b" -> two terms (all must match); "a b" in quotes / «a b» -> one phrase. */
export function parseQuery(q) {
  const terms = []
  const rest = (q || '').replace(/["«“]([^"»”]+)["»”]/g, (_, phrase) => {
    const t = normalize(phrase).replace(/\s+/g, ' ').trim()
    if (t) terms.push(t)
    return ' '
  })
  for (const w of rest.split(/\s+/)) {
    const t = normalize(w).replace(/["«»“”]/g, '')
    if (t) terms.push(t)
  }
  return [...new Set(terms)]
}

export function matchesAll(normText, terms) {
  return terms.length > 0 && terms.every((t) => normText.includes(t))
}

/** Sorted, merged [start, end) ranges of every term occurrence in normalised text. */
export function findRanges(normText, terms) {
  const ranges = []
  for (const t of terms) {
    let i = normText.indexOf(t)
    while (i !== -1) {
      ranges.push([i, i + t.length])
      i = normText.indexOf(t, i + t.length)
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push(r.slice())
  }
  return merged
}

export function countMatches(normText, terms) {
  return findRanges(normText, terms).length
}

/** Match ranges mapped back onto the original string (trailing diacritics included). */
export function originalRanges(s, terms) {
  if (!terms || !terms.length) return []
  const { text, map } = normalizeWithMap(s)
  return findRanges(text, terms).map(([a, b]) => {
    let end = map[b - 1] + 1
    while (end < s.length && IGNORED.test(s[end])) end++
    return [map[a], end]
  })
}

/** Split `s` into [{ text, mark }] segments for rendering highlights. */
export function highlightParts(s, terms) {
  const parts = []
  let pos = 0
  for (const [a, b] of originalRanges(s, terms)) {
    if (a > pos) parts.push({ text: s.slice(pos, a), mark: false })
    parts.push({ text: s.slice(a, b), mark: true })
    pos = b
  }
  if (pos < s.length) parts.push({ text: s.slice(pos), mark: false })
  return parts
}

/** Excerpt of `s` around the first match: { text, before, after } (ellipsis flags). */
export function snippet(s, terms, radius = 110) {
  const ranges = originalRanges(s, terms)
  if (!ranges.length) {
    const cut = s.length > radius * 2
    return { text: cut ? s.slice(0, radius * 2) : s, before: false, after: cut }
  }
  const [a, b] = ranges[0]
  let start = Math.max(0, a - radius)
  let end = Math.min(s.length, b + radius)
  if (start > 0) {
    const sp = s.indexOf(' ', start)
    if (sp !== -1 && sp < a) start = sp + 1
  }
  if (end < s.length) {
    const sp = s.lastIndexOf(' ', end)
    if (sp > b) end = sp
  }
  return { text: s.slice(start, end), before: start > 0, after: end < s.length }
}
