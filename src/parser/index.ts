import { parse as parseExact } from './parser'
import { parse as parseHeuristic } from './heuristic-parser'
import { DocumentRoot } from './types'
import { TokenStream } from './tokenizer'
export * from './types'

export function parse(source: string): DocumentRoot {
  const tokens = new TokenStream(source)
  return {
    source,
    tokens: tokens.toArray(),
    exact: parseExact(tokens),
    heuristic: parseHeuristic(source)
  }
}
