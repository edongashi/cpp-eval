import { AnalysisResult, AnalysisResultObject } from './types'

export async function normalizeAnalysisResult(
  result: AnalysisResult
): Promise<AnalysisResultObject> {
  const unwrapped = await result

  if (typeof unwrapped === 'boolean') {
    return { success: unwrapped }
  }

  return unwrapped
}
