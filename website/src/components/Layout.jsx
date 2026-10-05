import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'
import { YotaBadge, YotaSymbols } from './Yota.jsx'

const CHAPTER_ROUTE = /^\/book\/[^/]+\/\d+$/

export default function Layout() {
  const { pathname, search } = useLocation()

  // new page -> top; a chapter opened from a search scrolls to its match instead
  useEffect(() => {
    if (CHAPTER_ROUTE.test(pathname) && new URLSearchParams(search).get('q')) return
    window.scrollTo(0, 0)
  }, [pathname, search])

  const isLibrary = pathname === '/' || pathname.startsWith('/book')

  return (
    <>
      <YotaSymbols />
      <header className="site-header">
        <div className="wrap header-inner">
          <Link className="brand" to="/">
            <YotaBadge className="brand-mark" />
            <span className="brand-text">
              <small>استاذ</small>
              <strong>حلمي القمص يعقوب</strong>
            </span>
          </Link>
          <nav className="main-nav" aria-label="القائمة الرئيسية">
            <Link to="/" className={isLibrary ? 'active' : undefined}>المكتبة</Link>
            <NavLink to="/search">البحث</NavLink>
            <NavLink to="/faq">الأسئلة الشائعة</NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="wrap">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>
            مكتبة الأستاذ حلمي القمص يعقوب · نصوص الكتب منقولة من{' '}
            <a href="https://st-takla.org/" target="_blank" rel="noopener noreferrer">موقع الأنبا تكلاهيمانوت</a>
          </p>
        </div>
      </footer>
    </>
  )
}
