import { evalSource, typeCheckSource } from '../compiler'
import { Declaration, DeclarationType } from '../parser'
import {
  AnalyzerConfig,
  CompileOptions,
  DeclarationAnalyzer,
  RunOptions
} from './types'
import { normalizeAnalysisResult } from './utils'

function analyzer(a: DeclarationAnalyzer): DeclarationAnalyzer {
  return a
}

const PREFIX = `
#include <iostream>
using namespace std;
`.trim()

export function compiles(
  config: AnalyzerConfig,
  { prefix = PREFIX, suffix = '', sourceMapper }: CompileOptions = {}
): DeclarationAnalyzer {
  return analyzer({
    config,
    async analyze(declaration) {
      let { source } = declaration
      if (typeof sourceMapper === 'function') {
        source = sourceMapper(source)
      }

      const result = await typeCheckSource(
        `${prefix.trim()}\n\n${source.trim()}\n\n${suffix.trim()}`.trim()
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

export function matchesPattern(
  pattern: RegExp,
  config: AnalyzerConfig
): DeclarationAnalyzer {
  return analyzer({
    config,
    analyze(declaration) {
      return pattern.test(declaration.source)
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

export function declarationRuns(
  config: AnalyzerConfig,
  {
    stdin,
    prefix = PREFIX,
    suffix = '',
    requireOk = false,
    sourceMapper,
    validateStdout
  }: RunOptions = {}
): DeclarationAnalyzer {
  return analyzer({
    config,
    async analyze(declaration) {
      let { source } = declaration
      if (typeof sourceMapper === 'function') {
        source = sourceMapper(source)
      }

      const result = await evalSource(
        `${prefix.trim()}\n\n${source.trim()}\n\n${suffix.trim()}`.trim(),
        stdin
      )

      if (result.compilation.status !== 'OK') {
        return {
          success: false,
          log: result.compilation.log
        }
      }

      if (result.exitCode === null) {
        return {
          success: false,
          log: result.error
        }
      }

      let stdout = result.output

      const ok: string[] = []
      const warnings: string[] = []
      const errors: string[] = []

      stdout = stdout.replace(/<assert-ok>.*?<\/assert-ok>/gs, (match) => {
        ok.push(match.replace('<assert-ok>', '').replace('</assert-ok>', ''))
        return ''
      })

      stdout = stdout.replace(/<assert-warn>.*?<\/assert-warn>/gs, (match) => {
        warnings.push(
          match.replace('<assert-warn>', '').replace('</assert-warn>', '')
        )
        return ''
      })

      stdout = stdout.replace(
        /<assert-error>.*?<\/assert-error>/gs,
        (match) => {
          errors.push(
            match.replace('<assert-error>', '').replace('</assert-error>', '')
          )
          return ''
        }
      )

      let stdoutFail = false

      const stdoutLog: string[] = []
      if (typeof validateStdout === 'function') {
        const result = await normalizeAnalysisResult(
          validateStdout({ stdout, ok, errors, warnings })
        )

        if (!result.success) {
          stdoutFail = true
        }

        if (result.log) {
          stdoutLog.push(result.log)
        }
      }

      if (result.exitCode != 0) {
        stdoutLog.push(`Exited with status ${result.exitCode}`)
      }

      const log = [
        ...errors.filter((s) => s).map((s) => `[ERROR] ${s}`),
        ...warnings.filter((s) => s).map((s) => `[WARN] ${s}`),
        ...ok.filter((s) => s).map((s) => `[OK] ${s}`),
        ...stdoutLog.filter((s) => s)
      ]

      if (stdoutFail || result.exitCode != 0 || errors.length > 0) {
        return {
          success: false,
          log: log.join('\n')
        }
      }

      return {
        success: requireOk ? ok.length > 0 : true,
        log: log.join('\n')
      }
    }
  })
}
