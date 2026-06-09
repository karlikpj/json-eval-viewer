export interface ParsedMetricName {
  familyKey: string
  familyLabel: string
  rawName: string
  targetPath?: string
}

const METRIC_FAMILY_LABELS: Record<string, string> = {
  ExactMatch: 'Exact Match',
  JsonFieldSemanticComparator: 'Semantic',
}

export function parseMetricName(rawName: string): ParsedMetricName {
  const match = rawName.match(/^([^[\]]+)(?:\[(.+)\])?$/)
  const familyKey = match?.[1]?.trim() || rawName
  const targetPath = match?.[2]?.trim() || undefined

  return {
    familyKey,
    familyLabel: METRIC_FAMILY_LABELS[familyKey] ?? familyKey,
    rawName,
    targetPath,
  }
}

export function averageMetricScores(scores: number[]): number | null {
  if (scores.length === 0) {
    return null
  }

  const total = scores.reduce((sum, score) => sum + score, 0)
  return total / scores.length
}
