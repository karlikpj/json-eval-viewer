import type { JsonValue, TestCase } from '../types'
import styles from './CaseDetail.module.css'
import { getPath } from '../utils/json'
import { parseMetricName } from '../utils/metrics'
import { buildCaseComparisonData, formatComparisonValue } from '../utils/evalAnalysis'

function codeCell(value: JsonValue | undefined) {
  if (value === null || value === undefined) {
    return <span style={{ color: '#94a3b8' }}>—</span>
  }

  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  return <div className={styles.code}>{displayValue}</div>
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return '—'
  }

  return `${Math.round(value * 1000) / 10}%`
}

export default function CaseDetail({ c }: { c: TestCase }) {
  const {
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
    showStudyConclusions,
  } = buildCaseComparisonData(c)

  const showMetricsDetail = c.metricsData.length > 0
  const showThresholdColumn = c.metricsData.some(metric => metric.threshold !== undefined)
  const showStrictModeColumn = c.metricsData.some(metric => metric.strictMode !== undefined)
  const showEvaluationCostColumn = c.metricsData.some(metric => metric.evaluationCost !== undefined)

  return (
    <div>
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
              {topFieldRows.map(row => (
                <tr key={row.key} className={row.match ? '' : styles.diffRow}>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                  <td>{formatComparisonValue(row.actualValue)}</td>
                  <td>{formatComparisonValue(row.expectedValue)}</td>
                  <td>{row.match
                    ? <span className={styles.ok}>✓</span>
                    : <span className={styles.bad}>✗</span>}
                  </td>
                </tr>
              ))}
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
                {extractionConfidenceRows.map(row => (
                  <tr key={row.key} className={row.match ? '' : styles.diffRow}>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                    <td>{codeCell(row.actualValue)}</td>
                    <td>{codeCell(row.expectedValue)}</td>
                    <td>{row.match
                      ? <span className={styles.ok}>✓</span>
                      : <span className={styles.bad}>✗</span>}
                    </td>
                  </tr>
                ))}
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
                        Actual: {formatComparisonValue(getPath(actual, 'pico_elements.outcomes.primary_endpoints'))} | Expected: {formatComparisonValue(getPath(expected, 'pico_elements.outcomes.primary_endpoints'))}
                      </td>
                    </tr>
                  )
                  : primaryEndpointGroups.map(group =>
                      group.rows.map((row, rowIndex) => (
                        <tr key={row.key} className={row.match ? '' : styles.diffRow}>
                          {rowIndex === 0 && (
                            <td rowSpan={group.rows.length} style={{ fontWeight: 700, verticalAlign: 'top' }}>
                              {group.endpointNumber}
                            </td>
                          )}
                          <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{row.label}</td>
                          <td>{codeCell(row.actualValue)}</td>
                          <td>{codeCell(row.expectedValue)}</td>
                          <td>{row.match ? <span className={styles.ok}>✓</span> : <span className={styles.bad}>✗</span>}</td>
                        </tr>
                      ))
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
                {studyConclusionRows.map(row => (
                  <tr key={row.key} className={row.match ? '' : styles.diffRow}>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{row.label}</td>
                    <td>{codeCell(row.actualValue)}</td>
                    <td>{codeCell(row.expectedValue)}</td>
                    <td>{row.match
                      ? <span className={styles.ok}>✓</span>
                      : <span className={styles.bad}>✗</span>}
                    </td>
                  </tr>
                ))}
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
                {c.metricsData.map(metric => {
                  const pct = Math.round((metric.score ?? 0) * 100)
                  const barClassName =
                    pct >= 90 ? styles.barHigh : pct >= 60 ? styles.barMid : styles.barLow
                  const parsedMetric = parseMetricName(metric.name)
                  const familyClassName =
                    parsedMetric.familyKey === 'ExactMatch'
                      ? styles.metricFamilyExact
                      : parsedMetric.familyKey === 'JsonFieldSemanticComparator'
                        ? styles.metricFamilySemantic
                        : styles.metricFamilyNeutral

                  return (
                    <tr key={metric.name} className={metric.success ? '' : styles.diffRow}>
                      <td className={styles.metricPath}>{parsedMetric.targetPath ?? parsedMetric.rawName}</td>
                      <td>
                        <span className={`${styles.metricFamily} ${familyClassName}`}>
                          {parsedMetric.familyLabel}
                        </span>
                      </td>
                      <td><span className={`${styles.tag} ${metric.success ? styles.tagPass : styles.tagFail}`}>
                        {metric.success ? '✓ Pass' : '✗ Fail'}
                      </span></td>
                      <td>
                        <div className={styles.scoreBar}>
                          <div className={styles.barBg}>
                            <div className={`${styles.barFill} ${barClassName}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.78rem' }}>{pct}%</span>
                        </div>
                      </td>
                      {showThresholdColumn && <td className={styles.metricMeta}>{formatPercent(metric.threshold)}</td>}
                      {showStrictModeColumn && <td className={styles.metricMeta}>{metric.strictMode === undefined ? '—' : metric.strictMode ? 'Yes' : 'No'}</td>}
                      {showEvaluationCostColumn && <td className={styles.metricMeta}>{metric.evaluationCost ?? '—'}</td>}
                      <td className={styles.reasonCell}>{metric.reason || '—'}</td>
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
