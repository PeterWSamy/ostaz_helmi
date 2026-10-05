import { Highlight } from './Highlight.jsx'

/** One FAQ entry. Answers are trusted HTML from public/data/faqs.json. */
export default function FaqItem({ item, terms, hidden }) {
  return (
    <details className="faq" hidden={hidden}>
      <summary><Highlight text={item.q} terms={terms} /></summary>
      <div className="answer" dangerouslySetInnerHTML={{ __html: item.a }} />
    </details>
  )
}
