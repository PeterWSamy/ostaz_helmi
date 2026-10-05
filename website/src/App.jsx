import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { ErrorView } from './components/Status.jsx'
import { NotFoundError } from './lib/data.js'
import BookPage from './pages/BookPage.jsx'
import ChapterPage from './pages/ChapterPage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import Home from './pages/Home.jsx'
import SearchPage from './pages/SearchPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="book/:bookId" element={<BookPage />} />
        <Route path="book/:bookId/:order" element={<ChapterPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="*" element={<ErrorView error={new NotFoundError('الصفحة غير موجودة.')} />} />
      </Route>
    </Routes>
  )
}
