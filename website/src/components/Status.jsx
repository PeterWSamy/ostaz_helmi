import { Link } from 'react-router-dom'
import { NotFoundError } from '../lib/data.js'

export function Loading({ text = 'جارٍ التحميل…' }) {
  return <p className="loading">{text}</p>
}

export function ErrorView({ error }) {
  const notFound = error instanceof NotFoundError
  if (!notFound) console.error(error)
  return (
    <>
      <p className="error">
        {notFound ? error.message : 'تعذّر تحميل البيانات. تأكد من الاتصال ثم أعد المحاولة.'}
      </p>
      <p style={{ textAlign: 'center' }}>
        <Link className="btn ghost" to="/">العودة إلى المكتبة</Link>
      </p>
    </>
  )
}
