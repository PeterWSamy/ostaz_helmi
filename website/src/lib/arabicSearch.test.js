import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { countMatches, findRanges, highlightParts, matchesAll, normalize, parseQuery, snippet } from './arabicSearch.js'

const marked = (s, q) => highlightParts(s, parseQuery(q)).map((p) => (p.mark ? `[${p.text}]` : p.text)).join('')

describe('normalize', () => {
  it('ignores tashkeel and tatweel', () => {
    expect(normalize('اللَّه')).toBe('الله')
    expect(normalize('مـــوت')).toBe('موت')
  })
  it('folds letter variants and Arabic digits', () => {
    expect(normalize('أإآ ى ة')).toBe('ااا ي ه')
    expect(normalize('٢٠٢٤')).toBe('2024')
  })
})

describe('parseQuery', () => {
  it('splits words', () => expect(parseQuery('موت  الصليب')).toEqual(['موت', 'الصليب']))
  it('keeps quoted phrases', () => {
    expect(parseQuery('"موت الصليب" قيامة')).toEqual(['موت الصليب', 'قيامه'])
    expect(parseQuery('«موت الصليب»')).toEqual(['موت الصليب'])
  })
  it('handles empty input', () => expect(parseQuery('   ')).toEqual([]))
})

describe('highlightParts', () => {
  it('maps matches back onto the original text with diacritics', () => {
    expect(marked('قال اللَّه لموسى', 'الله')).toBe('قال [اللَّه] لموسى')
    expect(marked('مُعلَّق على خشبة', 'معلق')).toBe('[مُعلَّق] على خشبة')
    expect(marked('أحمد واحمد', 'احمد')).toBe('[أحمد] و[احمد]')
  })
  it('returns the whole string unmarked with no terms', () => {
    expect(highlightParts('نص', [])).toEqual([{ text: 'نص', mark: false }])
  })
})

describe('matching', () => {
  it('requires all terms', () => {
    expect(matchesAll(normalize('مات المسيح على الصليب'), parseQuery('الصليب المسيح'))).toBe(true)
    expect(matchesAll(normalize('مات المسيح'), parseQuery('الصليب المسيح'))).toBe(false)
  })
  it('merges overlapping ranges', () => expect(findRanges('abcd', ['abc', 'bcd'])).toEqual([[0, 4]]))
})

describe('snippet', () => {
  it('cuts around the first match', () => {
    const long = 'كلمة '.repeat(80) + 'الصَّليب ' + 'كلمة '.repeat(80)
    const s = snippet(long, parseQuery('الصليب'))
    expect(s.before && s.after).toBe(true)
    expect(s.text).toContain('الصَّليب')
    expect(s.text.length).toBeLessThan(260)
  })
})

describe('real book', () => {
  const file = path.join(__dirname, '../../public/data/books/helmi-cross-questions.json')
  const book = JSON.parse(fs.readFileSync(file, 'utf8'))
  const paras = book.chapters.flatMap((c) => c.paragraphs)

  it('finds every diacritic spelling of الله', () => {
    const hits = paras.filter((p) => matchesAll(normalize(p), parseQuery('الله'))).length
    const raw = paras.filter((p) => /الل[ً-ْ]*ه/.test(p)).length
    expect(raw).toBeGreaterThan(0)
    expect(hits).toBeGreaterThanOrEqual(raw)
  })

  it('searches the whole book quickly', () => {
    const norm = paras.map(normalize)
    const t = performance.now()
    const terms = parseQuery('الصليب')
    const total = norm.reduce((n, p) => n + (matchesAll(p, terms) ? countMatches(p, terms) : 0), 0)
    expect(total).toBeGreaterThan(400)
    expect(performance.now() - t).toBeLessThan(500)
  })
})
