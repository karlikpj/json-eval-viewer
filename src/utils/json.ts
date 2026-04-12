import type { JsonObject, JsonValue, Metric, TestCase, TestRun } from '../types'

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
    testPassed,
    testFailed: testCases.length - testPassed,
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
  }
}

function toJsonString(value: unknown): string {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value) ?? ''
  } catch {
    return ''
  }
}
