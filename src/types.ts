export interface Metric {
  name: string
  success: boolean
  score: number
  reason: string
  threshold: number
}

export interface TestCase {
  name: string
  success: boolean
  actualOutput: string
  expectedOutput: string
  metricsData: Metric[]
  runDuration: number
  order: number
}

export interface TestRun {
  testFile: string
  testCases: TestCase[]
  testPassed: number
  testFailed: number
}