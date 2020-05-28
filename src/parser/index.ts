import { TokenStream } from '../tokenizer'

import { parse } from './parser'
export { parse }

export function parseSource(source: string) {
  const tokens = new TokenStream(source)
  return { tokens, ...parse(tokens) }
}
