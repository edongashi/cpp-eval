import { parse as parseExact } from './parser'
import { parse as parseHeuristic } from './heuristic-parser'
import { ParseResult } from './types'
import { Token } from 'moo'
import { TokenStream } from './tokenizer'
export { ParseResult }

export function parse(
  source: string
): {
  tokens: Token[]
  exact: ParseResult
  heuristic: ParseResult
} {
  const tokens = new TokenStream(source)
  return {
    tokens: tokens.toArray(),
    exact: parseExact(tokens),
    heuristic: parseHeuristic(source)
  }
}
