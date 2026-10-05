import { Link, useParams } from 'react-router-dom'
import SearchForm from '../components/SearchForm.jsx'
import { ErrorView, Loading } from '../components/Status.jsx'
import { YotaCross } from '../components/Yota.jsx'
import { loadBook, useAsync } from '../lib/data.js'
import { arabicNumber, chapterPath, stripNumber } from '../lib/format.js'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function BookPage() {
  const { bookId } = useParams()
  const { data: book, error, loading } = useAsync(() => loadBook(bookId), bookId)
  usePageTitle(book?.meta.title)

  if (error) return <ErrorView error={error} />
  if (loading || !book) return <Loading />
  const m = book.meta

  return (
    <>
      <div className="crumbs"><Link to="/">المكتبة</Link> ‹ {m.title}</div>
      <section className="book-head">
        <div className="book-cover"><YotaCross /></div>
        <div>
          <h1>{m.title}</h1>
          <div className="meta">{m.author} · {arabicNumber(m.chapter_count)} فصل</div>
          {m.description && <p>{m.description}</p>}
          <div className="actions">
            <Link className="btn" to={chapterPath(m.id, book.chapters[0]?.order ?? 1)}>ابدأ القراءة</Link>
            {m.source && <a className="btn ghost" href={m.source} target="_blank" rel="noopener noreferrer">المصدر</a>}
          </div>
        </div>
      </section>

      <div className="book-search">
        <SearchForm book={m.id} placeholder="ابحث داخل هذا الكتاب…" />
      </div>

      <h2>فهرس الكتاب</h2>
      <ol className="toc">
        {book.chapters.map((c) => (
          <li key={c.order} className={c.is_section_header ? 'section' : undefined}>
            <Link to={chapterPath(m.id, c.order)}>
              <span className="num">{arabicNumber(c.order)}</span>
              <span>{stripNumber(c.title)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  )
}
