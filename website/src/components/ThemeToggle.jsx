import { storage } from '../lib/format.js'

export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    storage('theme', root.dataset.theme)
  }
  return (
    <button className="icon-btn" id="theme-toggle" type="button" onClick={toggle} aria-label="تبديل الوضع الليلي" title="الوضع الليلي">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8C12.92 3.04 12.46 3 12 3Z" />
      </svg>
    </button>
  )
}
