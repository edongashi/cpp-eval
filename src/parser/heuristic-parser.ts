import { ParseResult, Declaration, Declarations } from './types'
import { split } from './tokenizer'
import { tokenize } from './tokenizer/lexer'

export function parse(source: string): ParseResult {
  const tokens = split(source)
  const declarations: Declarations = {}

  for (const token of tokens) {
    const decl = parseDeclaration(token)
    if (decl) {
      declarations[decl.name] = decl
    }
  }

  return {
    declarations,
    errors: [],
    warnings: []
  }
}

function parseDeclaration(source: string): Declaration | null {
  let matches = source.match(
    /^(class|enum|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/
  )

  if (matches) {
    const [, type, name] = matches
    return {
      name,
      type: type as 'class' | 'enum' | 'struct',
      source,
      tokens: tokenize(source)
    }
  }

  matches = source.match(
    /^((?:\n|.)*?)(?:>\s*|\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/
  )

  if (matches) {
    const name = matches[2]
    return {
      name,
      type: 'function',
      source,
      tokens: tokenize(source)
    }
  }

  return null
}
