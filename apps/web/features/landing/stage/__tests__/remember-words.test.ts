import { describe, expect, it } from 'vitest'
import { parseMarkedWords } from '../marked-words'

const word = (text: string) => ({ text })
const fact = (text: string) => ({ text, key: true })

describe('parseMarkedWords', () => {
  it('splits plain text into words and keeps each bracketed fact whole', () => {
    expect(parseMarkedWords('my [cat Mochi] knocked my [monitor] off the desk again lol')).toEqual([
      word('my'), fact('cat Mochi'), word('knocked'), word('my'), fact('monitor'),
      word('off'), word('the'), word('desk'), word('again'), word('lol'),
    ])
  })

  it('handles a fact at the end and punctuation inside plain runs', () => {
    expect(parseMarkedWords('big [exam tomorrow] wish me luck, I [barely slept]')).toEqual([
      word('big'), fact('exam tomorrow'), word('wish'), word('me'), word('luck,'), word('I'), fact('barely slept'),
    ])
  })

  it('reads Russian the same way', () => {
    expect(parseMarkedWords('первый раз в [Elden Ring] и уже [40 смертей]')).toEqual([
      word('первый'), word('раз'), word('в'), fact('Elden Ring'), word('и'), word('уже'), fact('40 смертей'),
    ])
  })
})
