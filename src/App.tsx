import { useState, useCallback } from 'react'
import { TestRun } from './types'
import DropZone from './components/DropZone'
import Viewer from './components/Viewer'

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
        const json = JSON.parse(e.target?.result as string)
        const trd = json.testRunData || json
        if (!trd.testCases?.length) throw new Error('No testCases found in file')
        setData(trd as TestRun)
      } catch (ex: any) {
        setError(ex.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }, [])

  if (data) return <Viewer data={data} onReset={() => setData(null)} />

  return <DropZone onFile={handleFile} loading={loading} error={error} />
}