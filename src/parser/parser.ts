import { TokenStream, Token, assertType } from './tokenizer'
import { ParseResult, Declarations } from './types'
import { tokenize } from './tokenizer/lexer'

export function parse(source: string | TokenStream): ParseResult {
  const tokens = typeof source === 'string' ? new TokenStream(source) : source

  const { declarations: topLevelDeclarations, errors } = parseDeclarations(
    tokens
  )

  const declarations: Declarations = {}

  for (const declaration of topLevelDeclarations) {
    switch (declaration.type) {
      case 'class':
      case 'enum':
      case 'struct':
      case 'function': {
        const source = tokens.sourceBetween(
          declaration.source[0],
          declaration.source[1]
        )

        declarations[declaration.name] = {
          name: declaration.name,
          type: declaration.type,
          source,
          tokens: tokenize(source)
        }

        break
      }
    }
  }

  return {
    declarations,
    errors,
    warnings: []
  }
}

interface PreprocessorDirective {
  type: 'include' | 'define'
  body: Token[]
  source: [Token, Token]
}

interface UsingStatement {
  type: 'using'
  body: Token[]
  source: [Token, Token]
}

interface TypeDeclaration {
  type: 'class' | 'struct' | 'enum'
  name: string
  body: Token[]
  source: [Token, Token]
  warnings: string[]
}

interface FunctionDeclaration {
  type: 'function-declaration' | 'function'
  name: string
  returnType: Token[]
  args: Token[]
  body: Token[]
  source: [Token, Token]
  warnings: string[]
}

type TopLevelDeclaration =
  | PreprocessorDirective
  | UsingStatement
  | TypeDeclaration
  | FunctionDeclaration

const types = {
  'KEYWORD-CLASS': 'class',
  'KEYWORD-STRUCT': 'struct',
  'KEYWORD-ENUM': 'enum'
}

const preprocessorDirectives = {
  PREPROCESSOR_INCLUDE: 'include',
  PREPROCESSOR_DEFINE: 'define'
}

function parseDeclarations(
  tokens: TokenStream
): {
  declarations: TopLevelDeclaration[]
  errors: string[]
} {
  const declarations: TopLevelDeclaration[] = []
  const errors: string[] = []

  while (true) {
    tokens.takeUntil((t) => t.type !== 'SEMICOLON')

    if (!tokens.hasNext()) {
      break
    }

    try {
      const declaration = parseTopLevelDeclaration(tokens)
      declarations.push(declaration)
    } catch (e) {
      if (!errors.includes(e.message)) {
        errors.push(e.message)
      }

      if (tokens.hasNext()) {
        tokens.next()
      }
    }
  }

  return { declarations, errors }
}

function parseTopLevelDeclaration(tokens: TokenStream): TopLevelDeclaration {
  const current = tokens.peek()
  switch (current.type) {
    case 'HASH':
      return parsePreprocessorDirective(tokens)
    case 'KEYWORD-USING':
      return parseUsingStatement(tokens)
    case 'KEYWORD-CLASS':
    case 'KEYWORD-STRUCT':
    case 'KEYWORD-ENUM':
      return parseTypeDeclaration(tokens)
    default:
      return parseFunctionDeclaration(tokens)
  }
}

function parsePreprocessorDirective(
  tokens: TokenStream
): PreprocessorDirective {
  tokens.pushOptions()
  try {
    const first = tokens.assertNext('HASH')
    const statementToken = tokens.assertNext(
      (t) => t.type in preprocessorDirectives
    )

    const body = tokens.takeUntil((t) => t.line !== first.line)
    return {
      type: preprocessorDirectives[statementToken.type],
      body,
      source: [first, body[body.length - 1]]
    }
  } finally {
    tokens.popOptions()
  }
}

function parseUsingStatement(tokens: TokenStream): UsingStatement {
  tokens.pushOptions()
  try {
    const first = tokens.assertNext('KEYWORD-USING')
    const body = tokens.takeUntil('SEMICOLON', true)
    return {
      type: 'using',
      body,
      source: [first, body[body.length - 1]]
    }
  } finally {
    tokens.popOptions()
  }
}

function parseBody(tokens: TokenStream, includeSemicolon: boolean): Token[] {
  const body: Token[] = [tokens.assertNext('LCURLY')]

  let state = 1

  let token: Token
  while (true) {
    token = tokens.next()
    body.push(token)

    if (token.type === 'LCURLY') {
      state++
    } else if (token.type === 'RCURLY') {
      state--
      if (state === 0) {
        break
      }
    }
  }

  if (includeSemicolon && tokens.hasNext()) {
    const semicolon = tokens.peek()
    if (semicolon.type === 'SEMICOLON') {
      body.push(semicolon)
    }
  }

  return body
}

function parseTypeDeclaration(tokens: TokenStream): TypeDeclaration {
  tokens.pushOptions()
  try {
    const warnings: string[] = []
    const typeToken = tokens.assertNext(({ type }) => type in types)
    const nameToken = tokens.assertNext('IDENTIFIER')
    const body = parseBody(tokens, true)

    const lastToken = body[body.length - 1]
    if (lastToken.type !== 'SEMICOLON') {
      warnings.push(
        `Missing trailing semicolon after type declaration at L${lastToken.line}:${lastToken.col}.`
      )
    }

    return {
      type: types[typeToken.type],
      name: nameToken.value,
      body,
      source: [typeToken, lastToken],
      warnings
    }
  } finally {
    tokens.popOptions()
  }
}

function parseFunctionDeclaration(tokens: TokenStream): FunctionDeclaration {
  tokens.pushOptions()
  try {
    const typeTokens = tokens.takeUntil('LPAREN')
    const nameToken = typeTokens.pop()
    assertType(nameToken, 'IDENTIFIER')

    tokens.assertNext('LPAREN')
    const args = tokens.takeUntil('RPAREN')
    tokens.assertNext('RPAREN')

    const next = tokens.peek()
    if (next.type === 'SEMICOLON') {
      return {
        type: 'function-declaration',
        name: nameToken.value,
        returnType: typeTokens,
        args,
        body: [],
        source: [typeTokens[0] || nameToken, tokens.next()],
        warnings: []
      }
    }

    const body = parseBody(tokens, false)
    return {
      type: 'function',
      name: nameToken.value,
      returnType: typeTokens,
      args,
      body,
      source: [typeTokens[0] || nameToken, body[body.length - 1]],
      warnings: []
    }
  } finally {
    tokens.popOptions()
  }
}
