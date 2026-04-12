import { useState } from 'react'
import type  { TestRun } from '../types'
import CaseDetail from './CaseDetail'
import styles from './Viewer.module.css'

type Filter = 'all' | 'pass' | 'fail'

function shortName(name: string) {
  const m = name.match(/\[([^\]]+)\]$/)
  return m ? m[1] : name.slice(0, 24)
}

interface Props { data: TestRun; onReset: () => void }

export default function Viewer({ data, onReset }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [idx, setIdx] = useState(0)

  const filtered = data.testCases.filter(c =>
    filter === 'all' ? true : filter === 'pass' ? c.success : !c.success
  )
  const sel = filtered[idx] ?? filtered[0]

  const passCount = data.testCases.filter(c => c.success).length
  const failCount = data.testCases.length - passCount

  const setF = (f: Filter) => { setFilter(f); setIdx(0) }

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
        {(['all', 'pass', 'fail'] as Filter[]).map(f => (
          <button key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''} ${styles[f]}`}
            onClick={() => setF(f)}>
            {f === 'all' ? `All (${data.testCases.length})`
              : f === 'pass' ? `Pass (${passCount})`
              : `Fail (${failCount})`}
          </button>
        ))}
      </nav>

      <div className={styles.pills}>
        {filtered.map((c, i) => (
          <button key={c.name}
            className={`${styles.pill} ${c.success ? styles.pillPass : styles.pillFail} ${i === idx ? styles.pillSelected : ''}`}
            onClick={() => setIdx(i)}
            title={c.name}>
            {shortName(c.name)}
          </button>
        ))}
        {filtered.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No cases match.</span>}
      </div>

      <main className={styles.main}>
        {sel && <CaseDetail c={sel} />}
      </main>
    </div>
  )
}