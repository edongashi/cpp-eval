import * as moo from 'moo'
import { Token } from 'moo'
import { CHAR, COMMENT, MULTILINE_COMMENT, STRING } from './patterns'

const lexer = moo.compile({
  PREPROCESSOR: /#.*?$/,
  MULTILINE_COMMENT,
  COMMENT,
  STRING,
  CHAR,
  USING: /using\s+namespace\s+std;?/,
  TYPE_DECLARATION: {
    match: /(?:class|enum|struct)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\{/,
    lineBreaks: true
  },
  FUNCTION_DECLARATION: {
    match: /[a-zA-Z_][a-zA-Z0-9_*]*(?:\s*<[a-zA-Z_][a-zA-Z0-9_*]*>\s*|\s+)[a-zA-Z_][a-zA-Z0-9_]*\s*\([^()]*\)\s*(?:;\s*)?\{/,
    lineBreaks: true
  },
  NEWLINE: { match: /\r?\n/, lineBreaks: true },
  WHITESPACE: /[ \t]+/,
  OTHER: /.+?/
})

export function split(source: string): string[] {
  lexer.reset(source)

  let token: Token = lexer.next()
  const tokens: Token[] = []
  while (token) {
    switch (token.type) {
      case 'TYPE_DECLARATION':
      case 'FUNCTION_DECLARATION':
        tokens.push(token)
    }

    token = lexer.next()
  }

  const declarations: string[] = tokens.map((t, i) => {
    const end = i + 1 < tokens.length ? tokens[i + 1].offset : undefined
    return source.substring(t.offset, end).trim()
  })

  return declarations
}
