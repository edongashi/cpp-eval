import * as moo from 'moo'
import { Token } from 'moo'
import { default as keywordsList } from '../keywords'
import { CHAR, COMMENT, MULTILINE_COMMENT, STRING } from './patterns'

const keywords = keywordsList.reduce((acc, next) => {
  acc['KEYWORD-' + next.toUpperCase()] = next
  return acc
}, {})

const symbols = {
  ARROW: '->',
  EQUALS: '==',
  NOT_EQUALS: '!=',
  GREATER_THAN_EQUALS: '>=',
  LESS_THAN_EQUALS: '<=',
  STREAM_WRITE: '<<',
  STREAM_READ: '>>',
  PLUSPLUS: '++',
  MINUSMINUS: '--',
  SCOPE: '::',
  LPAREN: '(',
  RPAREN: ')',
  LBRACKET: '[',
  RBRACKET: ']',
  LCURLY: '{',
  RCURLY: '}',
  LANGULAR: '<',
  RANGULAR: '>',
  COMMA: ',',
  DOT: '.',
  PIPE: '|',
  AMPERSAND: '&',
  ASTERISK: '*',
  SLASH: '/',
  PERCENT: '%',
  PLUS: '+',
  MINUS: '-',
  ASSIGNMENT: '=',
  SEMICOLON: ';',
  COLON: ':',
  QUESTIONMARK: '?'
}

const UNKNOWN = /[^\n]+?/

const lexer = moo.states({
  main: {
    COMMENT,
    MULTILINE_COMMENT,
    HASH: {
      match: '#',
      push: 'preprocessor'
    },
    ...symbols,
    STRING,
    CHAR,
    IDENTIFIER: {
      match: /[a-zA-Z_][a-zA-Z0-9_]*/,
      type: moo.keywords(keywords)
    },
    NUMBER: /[0-9]+[.]?[0-9]*(?:[eE][-+]?[0-9]+)?/,
    WHITESPACE: /[ \t]+/,
    NEWLINE: { match: /\r?\n/, lineBreaks: true },
    UNKNOWN
  },
  preprocessor: {
    COMMENT,
    MULTILINE_COMMENT_SINGLE_LINE: {
      match: /\/\*.*?\*\//,
      type: () => 'MULTILINE_COMMENT'
    },
    MULTILINE_COMMENT: {
      ...MULTILINE_COMMENT,
      pop: 1
    },
    NEWLINE: { match: /\r?\n/, lineBreaks: true, pop: 1 },
    PREPROCESSOR_INCLUDE: 'include',
    PREPROCESSOR_DEFINE: { match: 'define', pop: 1 },
    STRING,
    BRACKETED_STRING: /<[^\n]*?>/,
    WHITESPACE: /[ \t]+/,
    UNKNOWN
  }
})

export function tokenize(source: string): Token[] {
  lexer.reset(source)

  const tokens = []
  let token = lexer.next()
  while (token) {
    tokens.push(token)
    token = lexer.next()
  }

  return tokens
}
