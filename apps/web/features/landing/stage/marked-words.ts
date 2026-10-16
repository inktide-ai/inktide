export type Word = { text: string; key?: boolean }

const plain = (text: string): Word[] => text.split(' ').map(t => ({ text: t }))

/** "my [cat Mochi] knocked my [monitor]…": the bracketed runs are the facts the compressor keeps. */
export function parseMarkedWords(marked: string): Word[] {
  return marked
    .split(/(\[[^\]]+\])/)
    .filter(part => part.trim())
    .flatMap(part => (part.startsWith('[') ? [{ text: part.slice(1, -1), key: true }] : plain(part.trim())))
}
