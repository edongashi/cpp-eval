import { Token } from 'moo'

export interface ParseResult {
  declarations: Declarations
  warnings: string[]
  errors: string[]
}

export interface Declarations {
  [name: string]: Declaration
}

export interface Declaration {
  type: 'class' | 'struct' | 'enum' | 'function'
  source: string
  name: string
  tokens: Token[]
}
