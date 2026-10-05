import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Highlight, Snippet } from '../components/Highlight.jsx'
import SearchForm from '../components/SearchForm.jsx'
import { ErrorView, Loading } from '../components/Status.jsx'
import { countMatches, matchesAll, parseQuery } from '../lib/arabicSearch.js'
import { loadIndex, loadLibrary, useAsync } from '../lib/data.js'
import { arabicNumber, chapterPath, stripNumber } from '../lib/format.js'
import { usePageTitle } from '../lib/usePageTitle.js'

const PAGE = 40

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const book = params.get('book') || ''
  usePageTitle(q ? `بحث: ${q}` : 'البحث')
  const lib = useAsync(loadLibrary, 'library')

  return (
    <>
      <h1>البحث في الكتب</h1>
      {lib.data && (
        // key: reset the form's fields when the URL query changes
        <SearchForm key={`${q}|${book}`} initialQuery={q} book={book} books={lib.data} autoFocus={!q} />
      )}
      <p className="search-hint">
        البحث يتجاهل التشكيل والهمزات. للبحث عن عبارة كاملة ضعها بين علامتي تنصيص مثل <code>"موت الصليب"</code>.
      </p>
      {lib.error && <ErrorView error={lib.error} />}
      {q && (
        <div id="results">
          <Results key={`${q}|${book}`} q={q} book={book} />
        </div>
      )}
    </>
  )
}

function Results({ q, book }) {
  const terms = useMemo(() => parseQuery(q), [q])
  const { data, error, loading } = useAsync(loadIndex, 'index')
  const [shown, setShown] = useState(PAGE)

  const result = useMemo(() => {
    if (!data || !terms.length) return null
    const titles = new Map(data.books.map((b) => [b.meta.id, b.meta.title]))
    const chapterTitles = new Map()
    for (const b of data.books) for (const c of b.chapters) chapterTitles.set(`${b.meta.id}/${c.order}`, c.title)

    const groups = new Map()
    let paragraphs = 0
    let occurrences = 0
    for (const e of data.entries) {
      if (book && e.book !== book) continue
      if (!matchesAll(e.norm, terms)) continue
      const key = `${e.book}/${e.ch}`
      if (!groups.has(key)) {
        groups.set(key, { key, book: e.book, ch: e.ch, bookTitle: titles.get(e.book), title: chapterTitles.get(key), hits: [], count: 0 })
      }
      const g = groups.get(key)
      const n = countMatches(e.norm, terms)
      g.hits.push({ ...e, n })
      g.count += n
      paragraphs++
      occurrences += n
    }
    return { groups: [...groups.values()], paragraphs, occurrences }
  }, [data, terms, book])

  if (!terms.length) return <p className="empty">اكتب كلمة للبحث.</p>
  if (error) return <ErrorView error={error} />
  if (loading || !result) return <Loading text="جارٍ البحث…" />
  if (!result.groups.length) {
    return <p className="empty">لا توجد نتائج لـ «{q}». جرّب كلمة أخرى أو عددًا أقل من الكلمات.</p>
  }

  const { groups, paragraphs, occurrences } = result
  return (
    <>
      <p className="results-summary">
        {arabicNumber(occurrences)} موضع في {arabicNumber(paragraphs)} فقرة، موزعة على {arabicNumber(groups.length)} فصل.
      </p>
      {groups.slice(0, shown).map((g) => {
        const snippets = g.hits.filter((h) => h.p !== 't').slice(0, 3)
        const titleHits = g.hits.find((h) => h.p === 't')?.n || 0
        const extra = g.count - titleHits - snippets.reduce((s, h) => s + h.n, 0)
        return (
          <div className="result" key={g.key}>
            <h3>
              <Link to={chapterPath(g.book, g.ch, q, g.hits[0].p)}>
                <Highlight text={stripNumber(g.title)} terms={terms} />
              </Link>
            </h3>
            <div className="where">
              {g.bookTitle} · {arabicNumber(g.count)} {g.count === 1 ? 'موضع' : 'مواضع'}
            </div>
            {snippets.map((h) => (
              <Link className="snip" key={h.p} to={chapterPath(g.book, g.ch, q, h.p)}>
                {h.p.startsWith('f') && <small>[حاشية] </small>}
                <Snippet text={h.text} terms={terms} />
              </Link>
            ))}
            {extra > 0 && (
              <Link className="more" to={chapterPath(g.book, g.ch, q)}>
                + {arabicNumber(extra)} {extra === 1 ? 'موضع آخر' : 'مواضع أخرى'} في هذا الفصل
              </Link>
            )}
          </div>
        )
      })}
      {shown < groups.length && (
        <p style={{ textAlign: 'center' }}>
          <button className="btn ghost" type="button" onClick={() => setShown((s) => s + PAGE)}>
            عرض المزيد ({arabicNumber(groups.length - shown)} فصل)
          </button>
        </p>
      )}
    </>
  )
}
