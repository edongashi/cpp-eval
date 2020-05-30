import { typeCheckSource } from '../compiler'
import { RootAnalyzer, AnalyzerConfig } from './types'

function analyzer(a: RootAnalyzer): RootAnalyzer {
  return a
}

export function documentCompiles(config: AnalyzerConfig): RootAnalyzer {
  return analyzer({
    config,
    async analyze(root) {
      const result = await typeCheckSource(root.source)
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

function includeRegex(header: string): RegExp {
  return new RegExp(`^\\s*#\\s*include\\s*[<"]${header}(?:\\.h)?[>"]`, 'm')
}

export function hasInclude(
  include: string,
  config: AnalyzerConfig
): RootAnalyzer {
  return analyzer({
    config,
    analyze(root) {
      return includeRegex(include).test(root.source)
    }
  })
}

export function hasDeclaration(
  declaration: string,
  config: AnalyzerConfig
): RootAnalyzer {
  return analyzer({
    config,
    analyze(root) {
      const exact = root.exact.declarations[declaration]
      const heuristic = root.heuristic.declarations[declaration]

      const exactSource = exact ? exact.source : null
      const heuristicSource = heuristic ? heuristic.source : null

      if (exactSource !== heuristicSource) {
        return {
          success: true,
          log: 'Exact and heuristic matches are not identical.'
        }
      }

      if (exactSource) {
        return true
      }

      if (heuristicSource) {
        return {
          success: true,
          log: 'Matched via heuristic search.'
        }
      }

      return false
    }
  })
}
