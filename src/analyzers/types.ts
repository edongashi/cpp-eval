import { Declaration, DocumentRoot } from '../parser'

export interface AnalyzerConfig {
  description: string
  terminating: boolean
  [key: string]: unknown
}

export interface AnalysisResultObject {
  success: boolean
  log?: string
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
