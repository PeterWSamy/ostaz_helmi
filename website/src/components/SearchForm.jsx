import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchPath } from '../lib/format.js'

/**
 * Search box that navigates to the results page.
 * `books` shows a book selector; `book` alone scopes the search to one book.
 */
export default function SearchForm({ initialQuery = '', book = '', books, autoFocus, placeholder = 'ابحث عن كلمة أو عبارة في كل الكتب…' }) {
  const navigate = useNavigate()
  const [q, setQ] = useState(initialQuery)
  const [scope, setScope] = useState(book)

  const submit = (e) => {
    e.preventDefault()
    const query = q.trim()
    if (query) navigate(searchPath(query, scope))
  }

  return (
    <form className="search-form" role="search" onSubmit={submit}>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="كلمة البحث"
        autoFocus={autoFocus}
        required
      />
      {books && (
        <select name="book" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="نطاق البحث">
          <option value="">كل الكتب</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      )}
      <button className="btn" type="submit">بحث</button>
    </form>
  )
}
