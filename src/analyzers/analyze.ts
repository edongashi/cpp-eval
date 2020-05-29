import { parse } from '../parser'
import {
  AnalysisResult,
  AnalysisResultObject,
  AnalysisSpecification,
  AnalyzerConfig,
  DeclarationAnalyzer,
  RootAnalyzer
} from './types'
import { normalizeAnalysisResult } from './utils'

interface Analyzer<TElement> {
  config: AnalyzerConfig
  analyze(element: TElement): AnalysisResult
}

interface Pair<TElement> {
  analyzer: Analyzer<TElement>
  result: AnalysisResultObject
}

async function runChain<TElement>(
  element: TElement,
  analyzers: Analyzer<TElement>[]
): Promise<Pair<TElement>[]> {
  const results: Pair<TElement>[] = []

  let failed = false
  for (let i = 0; i < analyzers.length; i++) {
    const analyzer = analyzers[i]
    if (failed) {
      results.push({ analyzer, result: { success: false } })
    } else {
      const result = await normalizeAnalysisResult(analyzer.analyze(element))
      results.push({ analyzer, result })
      if (!result.success && analyzer.config.terminating) {
        failed = true
      }
    }
  }

  return results
}

export async function analyze(
  source: string,
  spec: AnalysisSpecification
): Promise<{
  root: Array<{ analyzer: RootAnalyzer; result: AnalysisResultObject }>
  declarations: {
    [name: string]: null | Array<{
      analyzer: DeclarationAnalyzer
      result: AnalysisResultObject
    }>
  }
}> {
  const root = parse(source)

  const rootChain = await runChain(root, spec.root)

  const declarations = {}

  for (const key in spec.declarations) {
    const analyzer = spec.declarations[key]
    const decl =
      root.exact.declarations[key] || root.heuristic.declarations[key]

    if (decl) {
      declarations[key] = await runChain(decl, analyzer)
    } else {
      declarations[key] = null
    }
  }

  return {
    root: rootChain,
    declarations
  }
}
