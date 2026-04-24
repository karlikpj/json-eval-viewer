import type { ConclusionSummary } from '../types'
import detailStyles from './CaseDetail.module.css'
import styles from './ConclusionsViewer.module.css'
import viewerStyles from './Viewer.module.css'

interface Props {
  data: ConclusionSummary
  onReset: () => void
}

function formatTimestamp(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function ConclusionsViewer({ data, onReset }: Props) {
  return (
    <div className={viewerStyles.shell}>
      <header className={viewerStyles.header}>
        <h1 className={viewerStyles.title}>Study Conclusions</h1>
        <span className={viewerStyles.badge}>{data.evaluatedCount} records</span>
        {data.generatedAtUtc && (
          <span className={viewerStyles.badge}>Generated {formatTimestamp(data.generatedAtUtc)}</span>
        )}
        {data.modelId && <span className={viewerStyles.badge}>Model {data.modelId}</span>}
        {data.provider && <span className={viewerStyles.badge}>Provider {data.provider}</span>}
        <button className={viewerStyles.resetBtn} onClick={onReset}>Load another file</button>
      </header>

      <main className={viewerStyles.main}>
        <div className={detailStyles.section}>
          <h2 className={detailStyles.sectionTitle}>Evaluated Results</h2>
          <div className={styles.tableWrap}>
            <table className={`${detailStyles.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Study Conclusion</th>
                  <th>Conclusion Category</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(row => (
                  <tr key={row.id}>
                    <td className={styles.idCell}>{row.id}</td>
                    <td className={styles.conclusionCell}>{row.studyConclusions}</td>
                    <td className={styles.categoryCell}>{row.conclusionCategoryLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
