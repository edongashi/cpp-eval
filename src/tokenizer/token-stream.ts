import { Token } from 'moo'
import { tokenize } from './lexer'

export interface ReaderOptions {
  ignoreWhitespace?: boolean
  ignoreNewline?: boolean
  ignoreComments?: boolean
}

const defaults: ReaderOptions = {
  ignoreWhitespace: true,
  ignoreNewline: true,
  ignoreComments: true
}

export function assertType(token: Token, type: string | ((Token) => boolean)) {
  if (typeof type === 'string' && token.type !== type) {
    throw new Error(
      `Unexpected token '${token.value}' at L${token.line}:${token.col}, expected '${type}'.`
    )
  } else if (typeof type === 'function' && !type(token)) {
    throw new Error(
      `Unexpected token '${token.value}' at L${token.line}:${token.col}.`
    )
  }
}

export class TokenStream {
  private position: number = -1
  private readonly source: string
  private readonly tokens: Token[]
  private stack: ReaderOptions[] = [defaults]

  private nextValidIndex(): number {
    const options = this.options()
    let i: number
    for (i = this.position + 1; i < this.tokens.length; i++) {
      const token = this.tokens[i]

      if (options.ignoreComments && token.type === 'COMMENT') {
        continue
      }

      if (options.ignoreNewline && token.type === 'NEWLINE') {
        continue
      }

      if (options.ignoreWhitespace && token.type === 'WHITESPACE') {
        continue
      }

      break
    }

    return i
  }

  constructor(source: string) {
    this.source = source
    this.tokens = tokenize(source)
  }

  peek(): Token {
    const index = this.nextValidIndex()
    if (index === this.tokens.length) {
      throw new Error('Unexpected end of input.')
    }

    return this.tokens[index]
  }

  next(): Token {
    const index = this.nextValidIndex()
    if (index === this.tokens.length) {
      throw new Error('Unexpected end of input.')
    }

    this.position = index
    return this.tokens[index]
  }

  assertNext(type: string | ((Token) => boolean)) {
    const index = this.nextValidIndex()
    if (index >= this.tokens.length) {
      throw new Error(`Unexpected end of input.`)
    }

    const token = this.tokens[index]
    assertType(token, type)
    this.position = index
    return this.tokens[index]
  }

  hasNext() {
    return this.nextValidIndex() < this.tokens.length
  }

  takeUntil(
    cond: string | ((Token) => boolean),
    include: boolean = false
  ): Token[] {
    const tokens: Token[] = []

    while (this.hasNext()) {
      const token = this.peek()

      if (typeof cond === 'string') {
        if (token.type === cond) {
          if (include) {
            tokens.push(token)
            this.next()
          }

          return tokens
        }
      } else if (cond(token)) {
        if (include) {
          tokens.push(token)
          this.next()
        }

        return tokens
      }

      tokens.push(token)
      this.next()
    }

    return tokens
  }

  pushOptions(options: ReaderOptions = {}): void {
    this.stack.push({ ...defaults, ...options })
  }

  popOptions(): ReaderOptions {
    return this.stack.pop()
  }

  options(): ReaderOptions {
    if (this.stack.length === 0) {
      throw new Error('Corrupted options stack.')
    }

    return this.stack[this.stack.length - 1]
  }

  sourceBetween(token1: Token, token2: Token) {
    return this.source.substring(
      token1.offset,
      token2.offset + token2.text.length
    )
  }
}
