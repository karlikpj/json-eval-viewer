import type { JsonObject, JsonValue, TestCase } from '../types'
import styles from './CaseDetail.module.css'
import { getPath, isJsonObject, parseJsonObject } from '../utils/json'
import { parseMetricName } from '../utils/metrics'

interface ComparisonRow {
  key: string
  label: string
  actualValue: JsonValue | undefined
  expectedValue: JsonValue | undefined
}

function valStr(v: JsonValue | undefined): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.length === 0 ? '[]' : v.map(itemToString).join(', ')
  if (isJsonObject(v)) return JSON.stringify(v)
  return String(v)
}

function codeCell(v: JsonValue | undefined) {
  if (v === null || v === undefined) return <span style={{ color: '#94a3b8' }}>—</span>
  const s = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)
  return <div className={styles.code}>{s}</div>
}

function itemToString(value: JsonValue): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
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

function rowsWithValues<T extends ComparisonRow>(rows: T[]): T[] {
  return rows.filter(row => row.actualValue !== undefined || row.expectedValue !== undefined)
}

function valuesMatch(actualValue: JsonValue | undefined, expectedValue: JsonValue | undefined): boolean {
  return valStr(actualValue) === valStr(expectedValue)
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return '—'
  }

  return `${Math.round(value * 1000) / 10}%`
}

const TOP_FIELDS: [string, string][] = [
  ['study_design.design_type',                        'Design Type'],
  ['study_design.multicenter',                        'Multicenter'],
  ['study_design.prospective',                        'Prospective'],
  ['study_design.trial_phase',                        'Trial Phase'],
  ['pico_elements.population.cancer_type',            'Cancer Type'],
  ['pico_elements.population.cancer_stage',           'Cancer Stage'],
  ['pico_elements.population.age_group',              'Age Group'],
  ['pico_elements.population.sample_size',            'Sample Size'],
  ['pico_elements.intervention.primary_intervention', 'Intervention'],
  ['pico_elements.intervention.intervention_type',    'Intervention Type'],
]

const EXTRACTION_CONFIDENCE_FIELDS: [string, string][] = [
  ['extraction_confidence.overall_confidence', 'Overall Confidence'],
  ['extraction_confidence.missing_critical_elements', 'Missing Critical Elements'],
  ['extraction_confidence.extraction_notes', 'Extraction Notes'],
]

const EP_FIELDS: [string, string][] = [
  ['primary_endpoint_text', 'Text'],
  ['primary_endpoint_category', 'Category'],
  ['primary_endpoint_results', 'Results'],
  ['statistical_significance_assessment', 'Statistical Significance Assessment'],
  ['statistical_significance_assessment_reason', 'Statistical Significance Assessment Reason'],
]

export default function CaseDetail({ c }: { c: TestCase }) {
  const actual = parseJsonObject(c.actualOutput)
  const expected = parseJsonObject(c.expectedOutput)

  const topFieldRows = rowsWithValues(
    TOP_FIELDS.map(([path, label]) => ({
      key: path,
      label,
      actualValue: getPath(actual, path),
      expectedValue: getPath(expected, path),
    }))
  )

  const showExtractionConfidence =
    hasPath(actual, 'extraction_confidence') || hasPath(expected, 'extraction_confidence')
  const extractionConfidenceRows = rowsWithValues(
    EXTRACTION_CONFIDENCE_FIELDS.map(([path, label]) => ({
      key: path,
      label,
      actualValue: getPath(actual, path),
      expectedValue: getPath(expected, path),
    }))
  )

  const showPrimaryEndpoints =
    hasPath(actual, 'pico_elements.outcomes.primary_endpoints') ||
    hasPath(expected, 'pico_elements.outcomes.primary_endpoints')
  const aEPs = getPrimaryEndpoints(actual)
  const eEPs = getPrimaryEndpoints(expected)
  const len = Math.max(aEPs.length, eEPs.length)
  const primaryEndpointGroups = Array.from({ length: len }, (_, i) => {
    const actualEndpoint: JsonObject = aEPs[i] ?? {}
    const expectedEndpoint: JsonObject = eEPs[i] ?? {}
    const rows = rowsWithValues(
      EP_FIELDS.map(([field, label]) => ({
        key: `${i}-${field}`,
        label,
        actualValue: actualEndpoint[field],
        expectedValue: expectedEndpoint[field],
      }))
    )

    return {
      endpointNumber: i + 1,
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
  const showStudyConclusions = studyConclusionRows.length > 0

  const showMetricsDetail = c.metricsData.length > 0
  const showThresholdColumn = c.metricsData.some(metric => metric.threshold !== undefined)
  const showStrictModeColumn = c.metricsData.some(metric => metric.strictMode !== undefined)
  const showEvaluationCostColumn = c.metricsData.some(metric => metric.evaluationCost !== undefined)

  return (
    <div>
      {/* header */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Case</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Name</th><th>Result</th><th>Duration</th></tr></thead>
            <tbody><tr>
              <td style={{ fontSize: '0.78rem', color: '#475569' }}>{c.name}</td>
              <td><span className={`${styles.tag} ${c.success ? styles.tagPass : styles.tagFail}`}>
                {c.success ? '✓ Pass' : '✗ Fail'}
              </span></td>
              <td>{c.runDuration.toFixed(2)}s</td>
            </tr></tbody>
          </table>
        </div>
      </div>

      {/* field comparison */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Field Comparison — Actual vs Expected</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
            <tbody>
              {topFieldRows.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>No comparison fields available.</td>
                </tr>
              )}
              {topFieldRows.map(row => {
                const match = valuesMatch(row.actualValue, row.expectedValue)

                return (
                  <tr key={row.key} className={match ? '' : styles.diffRow}>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                    <td>{valStr(row.actualValue)}</td>
                    <td>{valStr(row.expectedValue)}</td>
                    <td>{match
                      ? <span className={styles.ok}>✓</span>
                      : <span className={styles.bad}>✗</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showExtractionConfidence && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Extraction Confidence</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
              <tbody>
                {extractionConfidenceRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>No extraction confidence fields available.</td>
                  </tr>
                )}
                {extractionConfidenceRows.map(row => {
                  const match = valuesMatch(row.actualValue, row.expectedValue)

                  return (
                    <tr key={row.key} className={match ? '' : styles.diffRow}>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                      <td>{codeCell(row.actualValue)}</td>
                      <td>{codeCell(row.expectedValue)}</td>
                      <td>{match
                        ? <span className={styles.ok}>✓</span>
                        : <span className={styles.bad}>✗</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPrimaryEndpoints && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Primary Endpoints</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>#</th><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
              <tbody>
                {primaryEndpointGroups.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyState}>
                        Actual: {valStr(getPath(actual, 'pico_elements.outcomes.primary_endpoints'))} | Expected: {valStr(getPath(expected, 'pico_elements.outcomes.primary_endpoints'))}
                      </td>
                    </tr>
                  )
                  : primaryEndpointGroups.map(group =>
                      group.rows.map((row, rowIndex) => {
                        const match = valuesMatch(row.actualValue, row.expectedValue)

                        return (
                          <tr key={row.key} className={match ? '' : styles.diffRow}>
                            {rowIndex === 0 && (
                              <td rowSpan={group.rows.length} style={{ fontWeight: 700, verticalAlign: 'top' }}>
                                {group.endpointNumber}
                              </td>
                            )}
                            <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{row.label}</td>
                            <td>{codeCell(row.actualValue)}</td>
                            <td>{codeCell(row.expectedValue)}</td>
                            <td>{match ? <span className={styles.ok}>✓</span> : <span className={styles.bad}>✗</span>}</td>
                          </tr>
                        )
                      })
                    )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSecondaryEndpoints && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Secondary Endpoints</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Actual</th><th>Expected</th></tr></thead>
              <tbody><tr>
                <td>{codeCell(secondaryEndpointsActual)}</td>
                <td>{codeCell(secondaryEndpointsExpected)}</td>
              </tr></tbody>
            </table>
          </div>
        </div>
      )}

      {showStudyConclusions && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Study Conclusions</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
              <tbody>
                {studyConclusionRows.map(row => {
                  const match = valuesMatch(row.actualValue, row.expectedValue)

                  return (
                    <tr key={row.key} className={match ? '' : styles.diffRow}>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                      <td>{codeCell(row.actualValue)}</td>
                      <td>{codeCell(row.expectedValue)}</td>
                      <td>{match
                        ? <span className={styles.ok}>✓</span>
                        : <span className={styles.bad}>✗</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMetricsDetail && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Metrics Detail</h2>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.metricsTable}`}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Metric Type</th>
                  <th>Result</th>
                  <th>Score</th>
                  {showThresholdColumn && <th>Threshold</th>}
                  {showStrictModeColumn && <th>Strict Mode</th>}
                  {showEvaluationCostColumn && <th>Evaluation Cost</th>}
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {c.metricsData.map(m => {
                  const pct = Math.round((m.score ?? 0) * 100)
                  const barCls = pct >= 90 ? styles.barHigh : pct >= 60 ? styles.barMid : styles.barLow
                  const metric = parseMetricName(m.name)
                  const familyClassName =
                    metric.familyKey === 'ExactMatch'
                      ? styles.metricFamilyExact
                      : metric.familyKey === 'JsonFieldSemanticComparator'
                        ? styles.metricFamilySemantic
                        : styles.metricFamilyNeutral

                  return (
                    <tr key={m.name} className={m.success ? '' : styles.diffRow}>
                      <td className={styles.metricPath}>{metric.targetPath ?? metric.rawName}</td>
                      <td>
                        <span className={`${styles.metricFamily} ${familyClassName}`}>
                          {metric.familyLabel}
                        </span>
                      </td>
                      <td><span className={`${styles.tag} ${m.success ? styles.tagPass : styles.tagFail}`}>
                        {m.success ? '✓ Pass' : '✗ Fail'}
                      </span></td>
                      <td>
                        <div className={styles.scoreBar}>
                          <div className={styles.barBg}>
                            <div className={`${styles.barFill} ${barCls}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.78rem' }}>{pct}%</span>
                        </div>
                      </td>
                      {showThresholdColumn && <td className={styles.metricMeta}>{formatPercent(m.threshold)}</td>}
                      {showStrictModeColumn && <td className={styles.metricMeta}>{m.strictMode === undefined ? '—' : m.strictMode ? 'Yes' : 'No'}</td>}
                      {showEvaluationCostColumn && <td className={styles.metricMeta}>{m.evaluationCost ?? '—'}</td>}
                      <td className={styles.reasonCell}>{m.reason || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
