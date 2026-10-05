import { useEffect } from 'react'

const SITE = 'مكتبة الأستاذ حلمي القمص يعقوب'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE
  }, [title])
}
