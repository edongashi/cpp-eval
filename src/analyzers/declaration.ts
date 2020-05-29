import { Declaration, DeclarationType } from '../parser'
import { typeCheckSource } from '../compiler'
import { AnalyzerConfig, DeclarationAnalyzer } from './types'

function analyzer(a: DeclarationAnalyzer): DeclarationAnalyzer {
  return a
}

const PREFIX = `
#include <iostream>
using namespace std;
`.trim()

const SUFFIX = `
int main() {
  return 0;
}
`.trim()

export function compiles(
  config: AnalyzerConfig,
  prefix = PREFIX,
  suffix = SUFFIX
): DeclarationAnalyzer {
  return analyzer({
    config,
    async analyze(declaration) {
      const result = await typeCheckSource(
        `${prefix.trim()}\n\n${declaration.source}\n\n${suffix.trim()}`
      )

      switch (result.status) {
        case 'OK':
          return true
        case 'FAILED':
          return {
            success: false,
            log: result.log
          }
        case 'UNKNOWN':
        default:
          return {
            success: false,
            log: 'Unknown compilation error.'
          }
      }
    }
  })
}

export function isDeclarationType(
  type: DeclarationType,
  config: AnalyzerConfig
): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      return declaration.type === type
    }
  })
}

export function hasReturnType(
  type: string,
  config: AnalyzerConfig
): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      return (
        declaration.type === 'function' && declaration.source.startsWith(type)
      )
    }
  })
}

function hasIdentifier(declaration: Declaration, identifier: string): boolean {
  return declaration.tokens.some(
    (t) => t.type === 'IDENTIFIER' && t.value === identifier
  )
}

export function isPureFunction(config: AnalyzerConfig): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      if (declaration.type !== 'function') {
        return false
      }

      return !declaration.tokens.some(
        (t) =>
          t.type === 'IDENTIFIER' && (t.value === 'cout' || t.value === 'cin')
      )
    }
  })
}

export function containsIdentifier(
  identifier: string,
  config: AnalyzerConfig
): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      return hasIdentifier(declaration, identifier)
    }
  })
}

export function doesNotContainIdentifier(
  identifier: string,
  config: AnalyzerConfig
): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      return !hasIdentifier(declaration, identifier)
    }
  })
}
