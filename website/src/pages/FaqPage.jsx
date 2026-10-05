import { useMemo, useState } from 'react'
import FaqItem from '../components/FaqItem.jsx'
import { ErrorView, Loading } from '../components/Status.jsx'
import { matchesAll, normalize, parseQuery } from '../lib/arabicSearch.js'
import { loadFaqs, useAsync } from '../lib/data.js'
import { usePageTitle } from '../lib/usePageTitle.js'

const stripTags = (html) => html.replace(/<[^>]*>/g, ' ')

export default function FaqPage() {
  usePageTitle('الأسئلة الشائعة')
  const { data: cats, error, loading } = useAsync(loadFaqs, 'faqs')
  const [filter, setFilter] = useState('')
  const terms = useMemo(() => parseQuery(filter), [filter])

  const visible = useMemo(() => {
    if (!cats) return []
    return cats.map((c) => ({
      ...c,
      items: c.items.map((item) => ({
        item,
        show: !terms.length || matchesAll(normalize(`${item.q} ${stripTags(item.a)}`), terms),
      })),
    }))
  }, [cats, terms])

  if (error) return <ErrorView error={error} />
  if (loading) return <Loading />
  const anyVisible = visible.some((c) => c.items.some((i) => i.show))

  return (
    <>
      <h1>الأسئلة الشائعة</h1>
      <div className="faq-tools">
        <input
          className="filter-input"
          type="search"
          placeholder="ابحث في الأسئلة…"
          aria-label="ابحث في الأسئلة"
          data-faq-filter
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      {visible.map((c) => (
        <section className="faq-cat" key={c.title} hidden={!c.items.some((i) => i.show)}>
          <h2>{c.title}</h2>
          {c.items.map(({ item, show }) => (
            <FaqItem key={item.q} item={item} terms={terms} hidden={!show} />
          ))}
        </section>
      ))}
      {!anyVisible && <p className="empty">لا توجد أسئلة مطابقة.</p>}
    </>
  )
}
