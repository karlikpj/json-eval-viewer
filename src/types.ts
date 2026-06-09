export type JsonPrimitive = boolean | number | string | null

export interface JsonObject {
  [key: string]: JsonValue | undefined
}

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface Metric {
  name: string
  success: boolean
  score: number
  reason: string
  threshold: number
  strictMode?: boolean
  evaluationCost?: number
}

export interface MetricSummary {
  metric: string
  scores: number[]
  passes: number
  fails: number
  errors: number
}

export interface TestCase {
  name: string
  success: boolean
  actualOutput: string
  expectedOutput: string
  metricsData: Metric[]
  runDuration: number
  order: number
}

export interface TestRun {
  testFile: string
  testCases: TestCase[]
  metricsScores: MetricSummary[]
  testPassed: number
  testFailed: number
}

export interface ConclusionRecord {
  id: string
  studyConclusions: string
  conclusionCategoryLabel: string
}

export interface ConclusionSummary {
  evaluatedCount: number
  rows: ConclusionRecord[]
  generatedAtUtc?: string
  modelId?: string
  provider?: string
}
