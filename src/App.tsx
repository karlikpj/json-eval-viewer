import { useState, useCallback } from 'react'
import type { ConclusionSummary, TestRun } from './types'
import ConclusionsViewer from './components/ConclusionsViewer'
import DropZone from './components/DropZone'
import Viewer from './components/Viewer'
import { parseConclusionSummary, parseTestRun, toErrorMessage } from './utils/json'

type LoadedData =
  | { kind: 'test-run'; data: TestRun }
  | { kind: 'conclusion-summary'; data: ConclusionSummary }

export default function App() {
  const [data, setData] = useState<LoadedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setLoading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rawText = e.target?.result
        if (typeof rawText !== 'string') {
          throw new Error('Could not read the selected file')
        }

        const json: unknown = JSON.parse(rawText)
        const testRun = parseTestRun(json)

        if (testRun) {
          setData({ kind: 'test-run', data: testRun })
          return
        }

        const conclusionSummary = parseConclusionSummary(json, rawText)

        if (conclusionSummary) {
          setData({ kind: 'conclusion-summary', data: conclusionSummary })
          return
        }

        throw new Error(
          'Unsupported JSON format. Upload either an eval test-run file with testCases or a conclusions summary file with evaluated_results_by_pmid.'
        )
      } catch (error) {
        setError(toErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }, [])

  const handleReset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  if (data?.kind === 'test-run') {
    return <Viewer data={data.data} onReset={handleReset} />
  }

  if (data?.kind === 'conclusion-summary') {
    return <ConclusionsViewer data={data.data} onReset={handleReset} />
  }

  return <DropZone onFile={handleFile} loading={loading} error={error} />
}
