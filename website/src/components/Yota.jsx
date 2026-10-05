// Simplified Coptic Yota cross (same geometry as the logo), as reusable SVG symbols.
const BODY =
  'M23 2L25 2L25 4L27 4L27 6L29 6L29 8L31 8L31 10L33 10L33 12L31 12L31 14L29 14L29 16L27 16L27 21L32 21L32 19L34 19L34 17L36 17L36 15L38 15L38 17L40 17L40 19L42 19L42 21L44 21L44 23L46 23L46 25L44 25L44 27L42 27L42 29L40 29L40 31L38 31L38 33L36 33L36 31L34 31L34 29L32 29L32 27L27 27L27 32L29 32L29 34L31 34L31 36L33 36L33 38L31 38L31 40L29 40L29 42L27 42L27 44L25 44L25 46L23 46L23 44L21 44L21 42L19 42L19 40L17 40L17 38L15 38L15 36L17 36L17 34L19 34L19 32L21 32L21 27L16 27L16 29L14 29L14 31L12 31L12 33L10 33L10 31L8 31L8 29L6 29L6 27L4 27L4 25L2 25L2 23L4 23L4 21L6 21L6 19L8 19L8 17L10 17L10 15L12 15L12 17L14 17L14 19L16 19L16 21L21 21L21 16L19 16L19 14L17 14L17 12L15 12L15 10L17 10L17 8L19 8L19 6L21 6L21 4L23 4L23 2Z'
const INNER =
  'M25 6L23 6L23 10L19 10L19 12L23 12L23 16L25 16L25 12L29 12L29 10L25 10L25 6ZM10 19L12 19L12 23L16 23L16 25L12 25L12 29L10 29L10 25L6 25L6 23L10 23L10 19ZM36 19L38 19L38 23L42 23L42 25L38 25L38 29L36 29L36 25L32 25L32 23L36 23L36 19ZM23 21L25 21L25 23L27 23L27 25L25 25L25 27L23 27L23 25L21 25L21 23L23 23L23 21ZM23 32L25 32L25 36L29 36L29 38L25 38L25 42L23 42L23 38L19 38L19 36L23 36L23 32Z'

/** Render once (in the layout); <YotaBadge/> and <YotaCross/> reference it. */
export function YotaSymbols() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="yota-cross" viewBox="0 0 48 48">
          <path className="yc-body" d={BODY} />
          <path className="yc-inner" d={INNER} />
        </symbol>
        <symbol id="yota-badge" viewBox="0 0 48 48">
          <rect className="yb-bg" width="48" height="48" rx="11.5" />
          <g transform="translate(7.2 7.2) scale(0.7)">
            <use href="#yota-cross" />
          </g>
        </symbol>
      </defs>
    </svg>
  )
}

export function YotaBadge({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <use href="#yota-badge" />
    </svg>
  )
}

export function YotaCross({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <use href="#yota-cross" />
    </svg>
  )
}
