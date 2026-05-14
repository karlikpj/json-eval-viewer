import type { JsonObject, JsonValue, TestCase } from '../types'
import styles from './CaseDetail.module.css'
import { getPath, isJsonObject, parseJsonObject } from '../utils/json'

function valStr(v: JsonValue | undefined): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.map(itemToString).join(', ')
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
  ['extraction_confidence.overall_confidence',        'Confidence'],
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

  const aEPs = getPrimaryEndpoints(actual)
  const eEPs = getPrimaryEndpoints(expected)
  const len = Math.max(aEPs.length, eEPs.length)
  const actualStudyConclusions = getPath(actual, 'pico_elements.outcomes.study_conclusions')
  const expectedStudyConclusions = getPath(expected, 'pico_elements.outcomes.study_conclusions')
  const actualConclusionsCategory = getPath(actual, 'pico_elements.outcomes.conclusions_category')
  const expectedConclusionsCategory = getPath(expected, 'pico_elements.outcomes.conclusions_category')
  const studyConclusionRows: [string, JsonValue | undefined, JsonValue | undefined][] = [
    ['Study Conclusions', actualStudyConclusions, expectedStudyConclusions],
    ['Conclusions Category', actualConclusionsCategory, expectedConclusionsCategory],
  ]

  return (
    <div>
      {/* header */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Case</h2>
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

      {/* field comparison */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Field Comparison — Actual vs Expected</h2>
        <table className={styles.table}>
          <thead><tr><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
          <tbody>
            {TOP_FIELDS.map(([path, label]) => {
              const av = valStr(getPath(actual, path))
              const ev = valStr(getPath(expected, path))
              const match = av === ev
              return (
                <tr key={path} className={match ? '' : styles.diffRow}>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</td>
                  <td>{av}</td>
                  <td>{ev}</td>
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

      {/* primary endpoints */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Primary Endpoints</h2>
        <table className={styles.table}>
          <thead><tr><th>#</th><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
          <tbody>
            {len === 0
              ? <tr><td colSpan={5} style={{ color: '#94a3b8' }}>
                  Actual: {valStr(getPath(actual, 'pico_elements.outcomes.primary_endpoints'))} | Expected: {valStr(getPath(expected, 'pico_elements.outcomes.primary_endpoints'))}
                </td></tr>
              : Array.from({ length: len }, (_, i) => {
                  const a = aEPs[i] ?? {}
                  const e = eEPs[i] ?? {}
                  return EP_FIELDS.map(([field, label], fi) => {
                    const av = a[field] ?? '—', ev = e[field] ?? '—'
                    const match = av === ev
                    return (
                      <tr key={`${i}-${field}`} className={match ? '' : styles.diffRow}>
                        {fi === 0 && <td rowSpan={EP_FIELDS.length} style={{ fontWeight: 700, verticalAlign: 'top' }}>{i + 1}</td>}
                        <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>{label}</td>
                        <td>{codeCell(av)}</td>
                        <td>{codeCell(ev)}</td>
                        <td>{match ? <span className={styles.ok}>✓</span> : <span className={styles.bad}>✗</span>}</td>
                      </tr>
                    )
                  })
                })
            }
          </tbody>
        </table>
      </div>

      {/* secondary endpoints */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Secondary Endpoints</h2>
        <table className={styles.table}>
          <thead><tr><th>Actual</th><th>Expected</th></tr></thead>
          <tbody><tr>
            <td>{codeCell(getPath(actual, 'pico_elements.outcomes.secondary_endpoints'))}</td>
            <td>{codeCell(getPath(expected, 'pico_elements.outcomes.secondary_endpoints'))}</td>
          </tr></tbody>
        </table>
      </div>

      {/* study conclusions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Study Conclusions</h2>
        <table className={styles.table}>
          <thead><tr><th>Field</th><th>Actual</th><th>Expected</th><th></th></tr></thead>
          <tbody>
            {studyConclusionRows.map(([label, actualValue, expectedValue]) => {
              const match = valStr(actualValue) === valStr(expectedValue)

              return (
                <tr key={label} className={match ? '' : styles.diffRow}>
                  <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</td>
                  <td>{codeCell(actualValue)}</td>
                  <td>{codeCell(expectedValue)}</td>
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

      {/* metrics */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Metrics Detail</h2>
        <table className={styles.table}>
          <thead><tr><th>Metric</th><th>Result</th><th>Score</th><th>Reason</th></tr></thead>
          <tbody>
            {c.metricsData.map(m => {
              const pct = Math.round((m.score ?? 0) * 100)
              const barCls = pct >= 90 ? styles.barHigh : pct >= 60 ? styles.barMid : styles.barLow
              return (
                <tr key={m.name} className={m.success ? '' : styles.diffRow}>
                  <td style={{ fontSize: '0.78rem' }}>{m.name.match(/\[([^\]]+)\]/)?.[1]}</td>
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
                  <td style={{ fontSize: '0.76rem', color: '#475569', maxWidth: 280 }}>{m.reason || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
