import type {
  BucketResult,
  CaseOverviewPoint,
  JsonObject,
  JsonValue,
  OverviewBucketKey,
  TestCase,
} from '../types'
import { getPath, isJsonObject, parseJsonObject } from './json'
import { averageMetricScores } from './metrics'

export interface ComparisonRow {
  key: string
  label: string
  actualValue: JsonValue | undefined
  expectedValue: JsonValue | undefined
  match: boolean
}

export interface PrimaryEndpointGroup {
  endpointNumber: number
  rows: ComparisonRow[]
}

export interface CaseComparisonData {
  actual: JsonObject
  expected: JsonObject
  topFieldRows: ComparisonRow[]
  showExtractionConfidence: boolean
  extractionConfidenceRows: ComparisonRow[]
  showPrimaryEndpoints: boolean
  primaryEndpointGroups: PrimaryEndpointGroup[]
  showSecondaryEndpoints: boolean
  secondaryEndpointsActual: JsonValue | undefined
  secondaryEndpointsExpected: JsonValue | undefined
  studyConclusionRows: ComparisonRow[]
  showStudyConclusions: boolean
}

export const OVERVIEW_BUCKET_ORDER: OverviewBucketKey[] = [
  'metrics',
  'fieldComparison',
  'confidence',
  'primaryEndpoints',
]

const PASS_THRESHOLD = 0.75

const OVERVIEW_BUCKET_LABELS: Record<OverviewBucketKey, string> = {
  metrics: 'Metrics',
  fieldComparison: 'Field Comparison',
  confidence: 'Confidence',
  primaryEndpoints: 'Primary Endpoints',
}

const TOP_FIELDS: [string, string][] = [
  ['study_design.design_type', 'Design Type'],
  ['study_design.multicenter', 'Multicenter'],
  ['study_design.prospective', 'Prospective'],
  ['study_design.trial_phase', 'Trial Phase'],
  ['pico_elements.population.cancer_type', 'Cancer Type'],
  ['pico_elements.population.cancer_stage', 'Cancer Stage'],
  ['pico_elements.population.age_group', 'Age Group'],
  ['pico_elements.population.sample_size', 'Sample Size'],
  ['pico_elements.intervention.primary_intervention', 'Intervention'],
  ['pico_elements.intervention.intervention_type', 'Intervention Type'],
]

const EXTRACTION_CONFIDENCE_FIELDS: [string, string][] = [
  ['extraction_confidence.overall_confidence', 'Overall Confidence'],
  ['extraction_confidence.missing_critical_elements', 'Missing Critical Elements'],
  ['extraction_confidence.extraction_notes', 'Extraction Notes'],
]

const PRIMARY_ENDPOINT_FIELDS: [string, string][] = [
  ['primary_endpoint_text', 'Text'],
  ['primary_endpoint_category', 'Category'],
  ['primary_endpoint_results', 'Results'],
  ['statistical_significance_assessment', 'Statistical Significance Assessment'],
  ['statistical_significance_assessment_reason', 'Statistical Significance Assessment Reason'],
]

export function getCaseKey(testCase: TestCase): string {
  return `${testCase.order}:${testCase.name}`
}

export function formatComparisonValue(value: JsonValue | undefined): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.length === 0 ? '[]' : value.map(itemToString).join(', ')
  if (isJsonObject(value)) return JSON.stringify(value)
  return String(value)
}

export function valuesMatch(
  actualValue: JsonValue | undefined,
  expectedValue: JsonValue | undefined,
): boolean {
  return formatComparisonValue(actualValue) === formatComparisonValue(expectedValue)
}

export function formatBucketRatio(bucket: BucketResult): string {
  if (bucket.ratio === null) {
    return 'N/A'
  }

  return `${Math.round(bucket.ratio * 1000) / 10}%`
}

export function buildCaseComparisonData(testCase: TestCase): CaseComparisonData {
  const actual = parseJsonObject(testCase.actualOutput)
  const expected = parseJsonObject(testCase.expectedOutput)

  const topFieldRows = rowsWithValues(
    TOP_FIELDS.map(([path, label]) => ({
      key: path,
      label,
      actualValue: getPath(actual, path),
      expectedValue: getPath(expected, path),
    })),
  )

  const showExtractionConfidence =
    hasPath(actual, 'extraction_confidence') || hasPath(expected, 'extraction_confidence')
  const extractionConfidenceRows = rowsWithValues(
    EXTRACTION_CONFIDENCE_FIELDS.map(([path, label]) => ({
      key: path,
      label,
      actualValue: getPath(actual, path),
      expectedValue: getPath(expected, path),
    })),
  )

  const showPrimaryEndpoints =
    hasPath(actual, 'pico_elements.outcomes.primary_endpoints') ||
    hasPath(expected, 'pico_elements.outcomes.primary_endpoints')
  const actualEndpoints = getPrimaryEndpoints(actual)
  const expectedEndpoints = getPrimaryEndpoints(expected)
  const endpointCount = Math.max(actualEndpoints.length, expectedEndpoints.length)
  const primaryEndpointGroups = Array.from({ length: endpointCount }, (_, index) => {
    const actualEndpoint: JsonObject = actualEndpoints[index] ?? {}
    const expectedEndpoint: JsonObject = expectedEndpoints[index] ?? {}
    const rows = rowsWithValues(
      PRIMARY_ENDPOINT_FIELDS.map(([field, label]) => ({
        key: `${index}-${field}`,
        label,
        actualValue: actualEndpoint[field],
        expectedValue: expectedEndpoint[field],
      })),
    )

    return {
      endpointNumber: index + 1,
      rows,
    }
  }).filter(group => group.rows.length > 0)

  const showSecondaryEndpoints =
    hasPath(actual, 'pico_elements.outcomes.secondary_endpoints') ||
    hasPath(expected, 'pico_elements.outcomes.secondary_endpoints')
  const secondaryEndpointsActual = getPath(actual, 'pico_elements.outcomes.secondary_endpoints')
  const secondaryEndpointsExpected = getPath(expected, 'pico_elements.outcomes.secondary_endpoints')

  const studyConclusionRows = rowsWithValues([
    {
      key: 'study-conclusions',
      label: 'Study Conclusions',
      actualValue: getPath(actual, 'pico_elements.outcomes.study_conclusions'),
      expectedValue: getPath(expected, 'pico_elements.outcomes.study_conclusions'),
    },
    {
      key: 'conclusions-category',
      label: 'Conclusions Category',
      actualValue: getPath(actual, 'pico_elements.outcomes.conclusions_category'),
      expectedValue: getPath(expected, 'pico_elements.outcomes.conclusions_category'),
    },
  ])

  return {
    actual,
    expected,
    topFieldRows,
    showExtractionConfidence,
    extractionConfidenceRows,
    showPrimaryEndpoints,
    primaryEndpointGroups,
    showSecondaryEndpoints,
    secondaryEndpointsActual,
    secondaryEndpointsExpected,
    studyConclusionRows,
    showStudyConclusions: studyConclusionRows.length > 0,
  }
}

export function buildCaseOverviewPoint(testCase: TestCase): CaseOverviewPoint {
  const comparison = buildCaseComparisonData(testCase)
  const primaryEndpointRows = comparison.primaryEndpointGroups.flatMap(group => group.rows)

  const buckets: Record<OverviewBucketKey, BucketResult> = {
    metrics: createBucketResult(
      'metrics',
      testCase.metricsData.filter(metric => metric.success).length,
      testCase.metricsData.length,
    ),
    fieldComparison: createBucketResult(
      'fieldComparison',
      comparison.topFieldRows.filter(row => row.match).length,
      comparison.topFieldRows.length,
    ),
    confidence: createBucketResult(
      'confidence',
      comparison.extractionConfidenceRows.filter(row => row.match).length,
      comparison.extractionConfidenceRows.length,
    ),
    primaryEndpoints: createBucketResult(
      'primaryEndpoints',
      primaryEndpointRows.filter(row => row.match).length,
      primaryEndpointRows.length,
    ),
  }

  return {
    caseKey: getCaseKey(testCase),
    caseName: testCase.name,
    success: testCase.success,
    passedBucketCount: OVERVIEW_BUCKET_ORDER.reduce(
      (passedCount, key) => passedCount + (buckets[key].passed ? 1 : 0),
      0,
    ),
    averageMetricScore: averageMetricScores(testCase.metricsData.map(metric => metric.score)) ?? 0,
    hasMetricScores: testCase.metricsData.length > 0,
    buckets,
  }
}

function createBucketResult(
  key: OverviewBucketKey,
  matched: number,
  comparable: number,
): BucketResult {
  const ratio = comparable > 0 ? matched / comparable : null

  return {
    key,
    label: OVERVIEW_BUCKET_LABELS[key],
    matched,
    comparable,
    ratio,
    passed: ratio !== null && ratio >= PASS_THRESHOLD,
  }
}

function itemToString(value: JsonValue): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function rowsWithValues(rows: Array<Omit<ComparisonRow, 'match'>>): ComparisonRow[] {
  return rows
    .filter(row => row.actualValue !== undefined || row.expectedValue !== undefined)
    .map(row => ({
      ...row,
      match: valuesMatch(row.actualValue, row.expectedValue),
    }))
}

function getPrimaryEndpoints(value: JsonObject): JsonObject[] {
  const endpoints = getPath(value, 'pico_elements.outcomes.primary_endpoints')
  return Array.isArray(endpoints) ? endpoints.filter(isJsonObject) : []
}

function hasPath(value: JsonObject, path: string): boolean {
  let current: JsonValue | undefined = value

  for (const segment of path.split('.')) {
    if (!isJsonObject(current) || !(segment in current)) {
      return false
    }

    current = current[segment]
  }

  return true
}
