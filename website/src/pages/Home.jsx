import { Link } from 'react-router-dom'
import FaqItem from '../components/FaqItem.jsx'
import SearchForm from '../components/SearchForm.jsx'
import { ErrorView, Loading } from '../components/Status.jsx'
import { YotaBadge, YotaCross } from '../components/Yota.jsx'
import { loadFaqs, loadLibrary, useAsync } from '../lib/data.js'
import { arabicNumber } from '../lib/format.js'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function Home() {
  usePageTitle('')
  const { data, error, loading } = useAsync(
    () => Promise.all([loadLibrary(), loadFaqs().catch(() => [])]),
    'home',
  )

  return (
    <>
      <section className="hero">
        <YotaBadge className="hero-mark" />
        <div className="kicker">استاذ</div>
        <h1>حلمي القمص يعقوب</h1>
        <p className="lead">مكتبة كتبه في مكان واحد: قراءة مريحة، وبحث في نصوص كل الكتب مع تمييز المواضع.</p>
        <SearchForm />
      </section>

      {loading && <Loading />}
      {error && <ErrorView error={error} />}
      {data && <Library books={data[0]} faqItems={data[1].flatMap((c) => c.items).slice(0, 3)} />}
    </>
  )
}

function Library({ books, faqItems }) {
  return (
    <>
      <div className="section-title">
        <h2>الكتب</h2>
        <span className="meta">{arabicNumber(books.length)} {books.length === 1 ? 'كتاب' : 'كتب'}</span>
      </div>
      {books.length ? (
        <div className="book-grid">
          {books.map((b) => (
            <Link key={b.id} className="book-card" to={`/book/${encodeURIComponent(b.id)}`}>
              <div className="book-cover"><YotaCross /></div>
              <div className="book-card-body">
                <h3>{b.title}</h3>
                <div className="meta">{b.author} · {arabicNumber(b.chapter_count)} فصل</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty">لا توجد كتب بعد.</p>
      )}

      {faqItems.length > 0 && (
        <>
          <div className="section-title">
            <h2>أسئلة شائعة</h2>
            <Link to="/faq">كل الأسئلة ←</Link>
          </div>
          <div className="faq-preview">
            {faqItems.map((item) => <FaqItem key={item.q} item={item} />)}
          </div>
        </>
      )}
    </>
  )
}
