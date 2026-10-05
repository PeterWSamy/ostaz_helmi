import { highlightParts, snippet } from '../lib/arabicSearch.js'

/** Text with every search term wrapped in <mark>. */
export function Highlight({ text, terms }) {
  if (!terms || !terms.length) return text
  return highlightParts(text, terms).map((part, i) => (part.mark ? <mark key={i}>{part.text}</mark> : part.text))
}

/** Short excerpt around the first match, highlighted. */
export function Snippet({ text, terms }) {
  const s = snippet(text, terms)
  return (
    <>
      {s.before && '… '}
      <Highlight text={s.text} terms={terms} />
      {s.after && ' …'}
    </>
  )
}
