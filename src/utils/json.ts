import type {
  ConclusionRecord,
  ConclusionSummary,
  JsonObject,
  JsonValue,
  Metric,
  MetricSummary,
  TestCase,
  TestRun,
} from '../types'

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonObject(value: string): JsonObject {
  try {
    const parsed: unknown = JSON.parse(value)
    return isJsonObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function getPath(value: JsonObject, path: string): JsonValue | undefined {
  return path.split('.').reduce<JsonValue | undefined>((current, segment) => {
    if (!isJsonObject(current)) return undefined
    return current[segment]
  }, value)
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to parse the selected file'
}

export function parseTestRun(value: unknown): TestRun | null {
  const candidate = isJsonObject(value) ? value.testRunData ?? value : value

  if (!isJsonObject(candidate) || !Array.isArray(candidate.testCases)) {
    return null
  }

  const testCases = candidate.testCases
    .map(toTestCase)
    .filter((testCase: TestCase | null): testCase is TestCase => testCase !== null)

  if (testCases.length === 0) {
    return null
  }

  const testPassed = testCases.filter((testCase: TestCase) => testCase.success).length

  return {
    testFile: typeof candidate.testFile === 'string' ? candidate.testFile : '',
    testCases,
    metricsScores: Array.isArray(candidate.metricsScores)
      ? candidate.metricsScores
          .map(toMetricSummary)
          .filter((metricSummary: MetricSummary | null): metricSummary is MetricSummary => metricSummary !== null)
      : [],
    testPassed,
    testFailed: testCases.length - testPassed,
  }
}

export function parseConclusionSummary(value: unknown, sourceText?: string): ConclusionSummary | null {
  if (!isJsonObject(value) || !isJsonObject(value.evaluated_results_by_pmid)) {
    return null
  }

  const rows = Object.entries(value.evaluated_results_by_pmid)
    .map(([id, row]) => toConclusionRecord(id, row))
    .filter((row: ConclusionRecord | null): row is ConclusionRecord => row !== null)

  if (rows.length === 0) {
    return null
  }

  const orderedRows = sourceText ? orderConclusionRows(rows, sourceText) : rows
  const model = isJsonObject(value.model) ? value.model : undefined
  const rawEvaluatedCount =
    typeof value.evaluated_count === 'number' && Number.isFinite(value.evaluated_count)
      ? value.evaluated_count
      : null

  return {
    evaluatedCount: rawEvaluatedCount === orderedRows.length ? rawEvaluatedCount : orderedRows.length,
    rows: orderedRows,
    generatedAtUtc: typeof value.generated_at_utc === 'string' ? value.generated_at_utc : undefined,
    modelId: model && typeof model.model_id === 'string' ? model.model_id : undefined,
    provider: model && typeof model.provider === 'string' ? model.provider : undefined,
  }
}

function toTestCase(value: unknown): TestCase | null {
  if (!isJsonObject(value)) return null
  if (typeof value.name !== 'string' || typeof value.success !== 'boolean') {
    return null
  }

  return {
    name: value.name,
    success: value.success,
    actualOutput: toJsonString(value.actualOutput),
    expectedOutput: toJsonString(value.expectedOutput),
    metricsData: Array.isArray(value.metricsData)
      ? value.metricsData
          .map(toMetric)
          .filter((metric: Metric | null): metric is Metric => metric !== null)
      : [],
    runDuration: typeof value.runDuration === 'number' ? value.runDuration : 0,
    order: typeof value.order === 'number' ? value.order : 0,
  }
}

function toMetric(value: unknown): Metric | null {
  if (!isJsonObject(value)) return null
  if (typeof value.name !== 'string' || typeof value.success !== 'boolean') {
    return null
  }

  return {
    name: value.name,
    success: value.success,
    score: typeof value.score === 'number' ? value.score : 0,
    reason: typeof value.reason === 'string' ? value.reason : '',
    threshold: typeof value.threshold === 'number' ? value.threshold : 0,
    strictMode: typeof value.strictMode === 'boolean' ? value.strictMode : undefined,
    evaluationCost: typeof value.evaluationCost === 'number' ? value.evaluationCost : undefined,
  }
}

function toMetricSummary(value: unknown): MetricSummary | null {
  if (!isJsonObject(value) || typeof value.metric !== 'string') {
    return null
  }

  return {
    metric: value.metric,
    scores: Array.isArray(value.scores)
      ? value.scores.filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
      : [],
    passes: typeof value.passes === 'number' ? value.passes : 0,
    fails: typeof value.fails === 'number' ? value.fails : 0,
    errors: typeof value.errors === 'number' ? value.errors : 0,
  }
}

function toConclusionRecord(id: string, value: unknown): ConclusionRecord | null {
  if (!isJsonObject(value)) return null
  if (
    typeof value.study_conclusions !== 'string' ||
    typeof value.conclusions_category_label !== 'string'
  ) {
    return null
  }

  return {
    id,
    studyConclusions: value.study_conclusions,
    conclusionCategoryLabel: value.conclusions_category_label,
  }
}

function orderConclusionRows(rows: ConclusionRecord[], sourceText: string): ConclusionRecord[] {
  const idsInSource = [...sourceText.matchAll(/"(\d{6,})"\s*:\s*\{/g)].map(match => match[1])

  if (idsInSource.length === 0) {
    return rows
  }

  const rowById = new Map(rows.map(row => [row.id, row]))
  const orderedRows: ConclusionRecord[] = []
  const seen = new Set<string>()

  idsInSource.forEach(id => {
    const row = rowById.get(id)

    if (!row || seen.has(id)) {
      return
    }

    orderedRows.push(row)
    seen.add(id)
  })

  rows.forEach(row => {
    if (!seen.has(row.id)) {
      orderedRows.push(row)
    }
  })

  return orderedRows
}

function toJsonString(value: unknown): string {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return ''
  }
}
