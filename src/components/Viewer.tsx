import { useState } from 'react'
import type { TestRun } from '../types'
import CaseDetail from './CaseDetail'
import EvalScatterPlot from './EvalScatterPlot'
import styles from './Viewer.module.css'
import { averageMetricScores, parseMetricName } from '../utils/metrics'
import { buildCaseOverviewPoint, getCaseKey } from '../utils/evalAnalysis'

type Filter = 'all' | 'pass' | 'fail'

function shortName(name: string) {
  const match = name.match(/\[([^\]]+)\]$/)
  return match ? match[1] : name.slice(0, 24)
}

interface Props {
  data: TestRun
  onReset: () => void
}

export default function Viewer({ data, onReset }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedCaseKey, setSelectedCaseKey] = useState<string | null>(() => getCaseKey(data.testCases[0]))

  const filteredEntries = data.testCases
    .filter(testCase => (filter === 'all' ? true : filter === 'pass' ? testCase.success : !testCase.success))
    .map(testCase => ({
      caseData: testCase,
      caseKey: getCaseKey(testCase),
      overview: buildCaseOverviewPoint(testCase),
    }))
  const selectedEntry =
    filteredEntries.find(entry => entry.caseKey === selectedCaseKey) ?? filteredEntries[0] ?? null
  const activeCaseKey = selectedEntry?.caseKey ?? null

  const passCount = data.testCases.filter(testCase => testCase.success).length
  const failCount = data.testCases.length - passCount

  function handleFilterChange(nextFilter: Filter) {
    const nextEntries = data.testCases
      .filter(testCase => (
        nextFilter === 'all' ? true : nextFilter === 'pass' ? testCase.success : !testCase.success
      ))
      .map(testCase => getCaseKey(testCase))

    if (!nextEntries.includes(selectedCaseKey ?? '')) {
      setSelectedCaseKey(nextEntries[0] ?? null)
    }

    setFilter(nextFilter)
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{data.testFile || 'Eval Results'}</h1>
        <span className={`${styles.badge} ${styles.pass}`}>✓ {passCount} passed</span>
        <span className={`${styles.badge} ${styles.fail}`}>✗ {failCount} failed</span>
        <span className={styles.badge}>{data.testCases.length} total</span>
        <button className={styles.resetBtn} onClick={onReset}>Load another file</button>
      </header>

      <nav className={styles.nav}>
        <span className={styles.filterLabel}>Filter:</span>
        {(['all', 'pass', 'fail'] as Filter[]).map(value => (
          <button
            key={value}
            className={`${styles.filterBtn} ${filter === value ? styles.active : ''} ${styles[value]}`}
            onClick={() => handleFilterChange(value)}
          >
            {value === 'all' ? `All (${data.testCases.length})`
              : value === 'pass' ? `Pass (${passCount})`
              : `Fail (${failCount})`}
          </button>
        ))}
      </nav>

      <section className={styles.overview}>
        <EvalScatterPlot
          points={filteredEntries.map(entry => entry.overview)}
          selectedCaseKey={activeCaseKey}
          onSelectCase={setSelectedCaseKey}
        />
      </section>

      <div className={styles.pills}>
        {filteredEntries.map(entry => (
          <button
            key={entry.caseKey}
            className={`${styles.pill} ${entry.caseData.success ? styles.pillPass : styles.pillFail} ${entry.caseKey === activeCaseKey ? styles.pillSelected : ''}`}
            onClick={() => setSelectedCaseKey(entry.caseKey)}
            title={entry.caseData.name}
          >
            {shortName(entry.caseData.name)}
          </button>
        ))}
        {filteredEntries.length === 0 && (
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No cases match.</span>
        )}
      </div>

      <main className={styles.main}>
        {data.metricsScores.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Metrics Summary</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Metric Type</th>
                  <th>Average Score</th>
                  <th>Passes</th>
                  <th>Fails</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {data.metricsScores.map(summary => {
                  const metric = parseMetricName(summary.metric)
                  const averageScore = averageMetricScores(summary.scores)
                  const averageScoreLabel =
                    averageScore === null ? '—' : `${Math.round(averageScore * 1000) / 10}%`
                  const familyClassName =
                    metric.familyKey === 'ExactMatch'
                      ? styles.metricFamilyExact
                      : metric.familyKey === 'JsonFieldSemanticComparator'
                        ? styles.metricFamilySemantic
                        : styles.metricFamilyNeutral

                  return (
                    <tr key={summary.metric}>
                      <td className={styles.metricPath}>{metric.targetPath ?? metric.rawName}</td>
                      <td>
                        <span className={`${styles.metricFamily} ${familyClassName}`}>
                          {metric.familyLabel}
                        </span>
                      </td>
                      <td className={styles.metricNumber}>{averageScoreLabel}</td>
                      <td className={styles.metricNumber}>{summary.passes}</td>
                      <td className={styles.metricNumber}>{summary.fails}</td>
                      <td className={styles.metricNumber}>{summary.errors}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}

        {selectedEntry && <CaseDetail c={selectedEntry.caseData} />}
      </main>
    </div>
  )
}
