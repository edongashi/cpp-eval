import { Token } from 'moo'

export interface ParseResult {
  declarations: Declarations
  warnings: string[]
  errors: string[]
}

export interface Declarations {
  [name: string]: Declaration
}

export type DeclarationType = 'class' | 'struct' | 'enum' | 'function'

export interface Declaration {
  type: DeclarationType
  source: string
  name: string
  tokens: Token[]
}

export interface DocumentRoot {
  source: string
  tokens: Token[]
  exact: ParseResult
  heuristic: ParseResult
}
