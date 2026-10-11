import { useId } from 'react'
import { arabicNumber } from '../lib/format.js'
import { emblemFor } from './covers/emblems.js'

// Per-book variations of the logo: the Yota cross in a palette swap and one of
// a few layouts, picked deterministically from the book id. Books of the
// "مدارس النقد" series share one colour scheme per testament and show their
// volume number; volumes about a Bible book carry an emblem of that book in
// place of the cross, with a small cross in the corner.

// [background, cross, inner] from the site palette
const SCHEMES = [
  ['#6C1A1A', '#F8E0A4', '#31AAA9'],
  ['#31AAA9', '#F8E0A4', '#6C1A1A'],
  ['#A82020', '#F8E0A4', '#6C1A1A'],
  ['#F8E0A4', '#6C1A1A', '#31AAA9'],
  ['#6C1A1A', '#31AAA9', '#F8E0A4'],
  ['#F8E0A4', '#A82020', '#31AAA9'],
  ['#31AAA9', '#6C1A1A', '#F8E0A4'],
  ['#A82020', '#F8E0A4', '#31AAA9'],
]
const SERIES = [
  { match: /^helmi-criticism-ot-/, scheme: 1 },
  { match: /^helmi-criticism-nt-/, scheme: 2 },
]
const LAYOUTS = ['center', 'rings', 'tile', 'corner', 'bands']

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function coverStyle(id, title = '') {
  const h = hash(id)
  const series = SERIES.find((s) => s.match.test(id))
  const volume = series ? Number(title.match(/ج\s*(\d+)/)?.[1]) || null : null
  return {
    scheme: SCHEMES[series ? series.scheme : h % SCHEMES.length],
    layout: LAYOUTS[(volume ?? h >>> 8) % LAYOUTS.length],
    volume,
    emblem: emblemFor(id),
  }
}

const Cross = ({ size, x = 0, y = 0, style, opacity }) => (
  <use href="#yota-cross" x={x} y={y} width={size} height={size} style={style} opacity={opacity} />
)

export default function BookCover({ id, title }) {
  const { scheme: [bg, body, inner], layout, volume, emblem } = coverStyle(id, title)
  const pid = 'cv' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const flat = { '--badge-cross': body, '--badge-inner': body }

  return (
    <div className="book-cover" style={{ '--badge-bg': bg, '--badge-cross': body, '--badge-inner': inner, background: bg }}>
      <svg className="cover-art" aria-hidden="true">
        {layout === 'tile' && (
          <>
            <defs>
              <pattern id={pid} width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <Cross size={12} x={9} y={9} style={flat} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${pid})`} opacity=".14" />
          </>
        )}
        {layout === 'bands' && (
          <g fill={inner} opacity=".9">
            <rect x="0" y="12%" width="100%" height="4" />
            <rect x="0" y="12%" width="100%" height="1" transform="translate(0 8)" />
            <rect x="0" y="88%" width="100%" height="4" transform="translate(0 -4)" />
            <rect x="0" y="88%" width="100%" height="1" transform="translate(0 -9)" />
          </g>
        )}
        {layout === 'corner' && (
          <svg x="-30%" y="25%" width="100%" height="100%" viewBox="0 0 48 48" overflow="visible">
            <Cross size={48} style={flat} opacity=".13" />
          </svg>
        )}
        <svg width="100%" height="100%" viewBox="-34 -34 116 116">
          {layout === 'tile' && <rect x="-8" y="-8" width="64" height="64" rx="16" fill={bg} />}
          {layout === 'rings' && (
            <g fill="none" stroke={body}>
              <rect x="-7" y="-7" width="62" height="62" rx="15" strokeWidth="1.5" opacity=".55" />
              <rect x="-17" y="-17" width="82" height="82" rx="22" strokeWidth="1" opacity=".25" />
            </g>
          )}
          {emblem ? (
            <g>
              <path d={emblem.body} fill={body} />
              <path d={emblem.inner} fill={inner} />
            </g>
          ) : (
            <Cross size={48} />
          )}
        </svg>
        {emblem && <Cross size={22} x={12} y={10} />}
        {volume && (
          <text className="cover-vol" x="100%" dx="-12" y="12" dominantBaseline="hanging" fill={body}>
            ج{arabicNumber(volume)}
          </text>
        )}
      </svg>
    </div>
  )
}
