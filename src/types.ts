export type JsonPrimitive = boolean | number | string | null

export interface JsonObject {
  [key: string]: JsonValue | undefined
}

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

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
