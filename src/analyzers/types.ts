import { Declaration, DocumentRoot } from '../parser'

export interface AnalyzerConfig {
  description: string
  terminating: boolean
  [key: string]: unknown
}

export interface AnalysisResultObject {
  success: boolean
  log?: string
  skipped?: boolean
}

export type AnalysisResult =
  | AnalysisResultObject
  | boolean
  | Promise<AnalysisResultObject | boolean>

export interface DeclarationAnalyzer {
  config: AnalyzerConfig
  analyze(declaration: Declaration): AnalysisResult
}

export interface RootAnalyzer {
  config: AnalyzerConfig
  analyze(root: DocumentRoot): AnalysisResult
}

export interface CompileOptions {
  prefix?: string
  suffix?: string
  sourceMapper?: (source: string) => string
}

export interface RunOptions {
  stdin?: string
  prefix?: string
  suffix?: string
  requireOk?: boolean
  sourceMapper?: (source: string) => string
  validateStdout?: (output: {
    stdout: string
    ok: string[]
    warnings: string[]
    errors: string[]
  }) => AnalysisResult
}

export interface AnalysisSpecification {
  root: RootAnalyzer[]
  declarations: {
    [name: string]: DeclarationAnalyzer[]
  }
}
