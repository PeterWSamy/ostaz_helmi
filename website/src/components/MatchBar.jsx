import { useEffect, useState } from 'react'
import { arabicNumber } from '../lib/format.js'

/**
 * Floating "match i of n" bar for the <mark>s inside `rootRef`.
 * Starts at the first match in paragraph `startAt` (data-p) when given.
 * `contentKey` must change whenever the highlighted content changes.
 */
export default function MatchBar({ rootRef, startAt, contentKey, onClose }) {
  const [marks, setMarks] = useState([])
  const [index, setIndex] = useState(0)

  // collect marks after the content renders
  useEffect(() => {
    const root = rootRef.current
    const found = root ? [...root.querySelectorAll('mark')] : []
    let start = 0
    if (startAt != null && root) {
      const target = root.querySelector(`[data-p="${CSS.escape(startAt)}"] mark`)
      if (target) start = found.indexOf(target)
    }
    setMarks(found)
    setIndex(start)
  }, [rootRef, startAt, contentKey])

  // mark + scroll to the current match
  useEffect(() => {
    if (!marks.length) return
    marks.forEach((m) => m.classList.remove('current'))
    const el = marks[index]
    el.classList.add('current')
    el.scrollIntoView({ block: 'center', inline: 'nearest' })
  }, [marks, index])

  if (!marks.length) return null
  const step = (d) => setIndex((i) => (i + d + marks.length) % marks.length)

  return (
    <div className="match-bar" role="status">
      <span data-count>{arabicNumber(index + 1)} من {arabicNumber(marks.length)}</span>
      <button type="button" data-step="-1" onClick={() => step(-1)} aria-label="الموضع السابق" title="السابق">▲</button>
      <button type="button" data-step="1" onClick={() => step(1)} aria-label="الموضع التالي" title="التالي">▼</button>
      <button type="button" data-close onClick={onClose} aria-label="إلغاء التمييز" title="إلغاء التمييز">✕</button>
    </div>
  )
}
