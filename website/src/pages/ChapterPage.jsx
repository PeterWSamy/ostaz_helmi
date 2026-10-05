import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Highlight } from '../components/Highlight.jsx'
import MatchBar from '../components/MatchBar.jsx'
import { ErrorView, Loading } from '../components/Status.jsx'
import { parseQuery } from '../lib/arabicSearch.js'
import { NotFoundError, loadBook, useAsync } from '../lib/data.js'
import { chapterPath, paragraphClass, storage, stripNumber } from '../lib/format.js'
import { usePageTitle } from '../lib/usePageTitle.js'

const MIN_SIZE = 15
const MAX_SIZE = 30

export default function ChapterPage() {
  const { bookId, order: orderParam } = useParams()
  const order = Number(orderParam)
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const startAt = params.get('p')
  const terms = useMemo(() => parseQuery(q), [q])
  const navigate = useNavigate()
  const articleRef = useRef(null)
  const sideRef = useRef(null)
  const [tocOpen, setTocOpen] = useState(false)
  const [size, setSize] = useState(() => Number(storage('readerSize')) || 20)

  const { data: book, error, loading } = useAsync(() => loadBook(bookId), bookId)
  const idx = book ? book.chapters.findIndex((c) => c.order === order) : -1
  const ch = idx >= 0 ? book.chapters[idx] : null
  usePageTitle(ch ? stripNumber(ch.title) : '')

  useEffect(() => {
    document.documentElement.style.setProperty('--reader-size', `${size}px`)
    storage('readerSize', String(size))
  }, [size])

  // keep the current chapter visible in the sidebar (without scrolling the page)
  useEffect(() => {
    const side = sideRef.current
    const current = side?.querySelector('a.current')
    if (current) side.scrollTop = current.offsetTop - side.clientHeight / 2
  }, [ch])

  if (error) return <ErrorView error={error} />
  if (loading || !book) return <Loading />
  if (!ch) return <ErrorView error={new NotFoundError('لم يتم العثور على هذا الفصل.')} />

  const m = book.meta
  const prev = book.chapters[idx - 1]
  const next = book.chapters[idx + 1]

  return (
    <>
      <div className="crumbs">
        <Link to="/">المكتبة</Link> ‹ <Link to={`/book/${encodeURIComponent(m.id)}`}>{m.title}</Link> ‹ {stripNumber(ch.title)}
      </div>
      <div className="reader">
        <aside className={`reader-side${tocOpen ? ' open' : ''}`} ref={sideRef}>
          <h2>{m.title}</h2>
          <ol>
            {book.chapters.map((c) => (
              <li key={c.order} className={c.is_section_header ? 'section' : undefined}>
                <Link
                  to={chapterPath(m.id, c.order, q)}
                  className={c.order === order ? 'current' : undefined}
                  aria-current={c.order === order ? 'page' : undefined}
                  onClick={() => setTocOpen(false)}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <div>
          <div className="reader-tools">
            <div className="group">
              <button className="btn ghost toc-toggle" type="button" onClick={() => setTocOpen((o) => !o)}>الفهرس</button>
              <Link className="btn ghost" to={`/book/${encodeURIComponent(m.id)}`}>صفحة الكتاب</Link>
            </div>
            <div className="group" role="group" aria-label="حجم الخط">
              <button className="btn ghost" type="button" onClick={() => setSize((s) => Math.max(MIN_SIZE, s - 2))} aria-label="تصغير الخط">ا−</button>
              <button className="btn ghost" type="button" onClick={() => setSize((s) => Math.min(MAX_SIZE, s + 2))} aria-label="تكبير الخط">ا+</button>
            </div>
          </div>

          <article className="chapter" ref={articleRef}>
            <h1 data-p="t"><Highlight text={ch.title} terms={terms} /></h1>
            {ch.paragraphs.map((p, i) => (
              <p key={i} data-p={i} className={paragraphClass(p)}>
                <Highlight text={p} terms={terms} />
              </p>
            ))}
            {ch.footnotes?.length > 0 && (
              <section className="footnotes">
                <h2>الحواشي والمراجع</h2>
                <ol>
                  {ch.footnotes.map((f, i) => (
                    <li key={i} data-p={`f${i}`} value={f.n || i + 1}>
                      <Highlight text={f.text} terms={terms} />
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <p className="source-link">
              <a href={ch.url} target="_blank" rel="noopener noreferrer">قراءة الفصل في المصدر</a>
            </p>
          </article>

          <nav className="chapter-nav" aria-label="التنقل بين الفصول">
            {prev ? (
              <Link className="btn ghost" to={chapterPath(m.id, prev.order, q)} rel="prev">→ <span>{stripNumber(prev.title)}</span></Link>
            ) : <span />}
            {next ? (
              <Link className="btn" to={chapterPath(m.id, next.order, q)} rel="next"><span>{stripNumber(next.title)}</span> ←</Link>
            ) : <span />}
          </nav>
        </div>
      </div>

      {terms.length > 0 && (
        <MatchBar
          rootRef={articleRef}
          startAt={startAt}
          contentKey={`${bookId}/${order}/${q}`}
          onClose={() => navigate(chapterPath(m.id, order))}
        />
      )}
    </>
  )
}
