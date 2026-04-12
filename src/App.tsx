import { useState, useCallback } from 'react'
import type  { TestRun } from './types'
import DropZone from './components/DropZone'
import Viewer from './components/Viewer'
import { parseTestRun, toErrorMessage } from './utils/json'

export default function App() {
  const [data, setData] = useState<TestRun | null>(null)
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

        if (!testRun) {
          throw new Error('No valid testCases found in file')
        }

        setData(testRun)
      } catch (error) {
        setError(toErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }, [])

  if (data) return <Viewer data={data} onReset={() => setData(null)} />

  return <DropZone onFile={handleFile} loading={loading} error={error} />
}
