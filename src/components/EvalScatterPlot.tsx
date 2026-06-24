import { useState, type KeyboardEvent } from 'react'
import type { CaseOverviewPoint } from '../types'
import styles from './EvalScatterPlot.module.css'
import { formatBucketRatio, OVERVIEW_BUCKET_ORDER } from '../utils/evalAnalysis'

interface Props {
  points: CaseOverviewPoint[]
  selectedCaseKey: string | null
  onSelectCase: (caseKey: string) => void
}

interface PositionedPoint extends CaseOverviewPoint {
  plotX: number
  plotY: number
}

const CHART_WIDTH = 920
const CHART_HEIGHT = 380
const POINT_RADIUS = 19
const MARGIN = {
  top: 34,
  right: 28,
  bottom: 54,
  left: 78,
}
const COLUMN_VALUES = [0, 1, 2, 3, 4]
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1]

export default function EvalScatterPlot({
  points,
  selectedCaseKey,
  onSelectCase,
}: Props) {
  const [tooltipCaseKey, setTooltipCaseKey] = useState<string | null>(selectedCaseKey)

  const plotWidth = CHART_WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
  const positionedPoints = points.map(point => {
    const baseX = MARGIN.left + (point.passedBucketCount / 4) * plotWidth
    const plotX = clamp(
      baseX + getStableJitter(point.caseKey),
      MARGIN.left + POINT_RADIUS,
      CHART_WIDTH - MARGIN.right - POINT_RADIUS,
    )
    const plotY = MARGIN.top + (1 - point.averageMetricScore) * plotHeight

    return {
      ...point,
      plotX,
      plotY,
    }
  })
  const highlightedPoint = positionedPoints.find(point => point.caseKey === tooltipCaseKey) ?? null

  function handlePointKeyDown(event: KeyboardEvent<SVGGElement>, caseKey: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onSelectCase(caseKey)
    setTooltipCaseKey(caseKey)
  }

  return (
    <section className={styles.shell}>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>Eval Scatter Overview</div>
          <h2 className={styles.title}>Bucket pass count vs average metric score</h2>
          <p className={styles.subtle}>X = passed overview buckets, Y = average metric score.</p>
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendPass}`} aria-hidden="true" />
            Passing case
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendFail}`} aria-hidden="true" />
            Failing case
          </span>
          <span className={styles.legendInfo}>Point label = passed buckets out of 4</span>
        </div>
      </div>

      <div className={styles.frame}>
        {points.length === 0 ? (
          <div className={styles.emptyState}>No cases match the current filter.</div>
        ) : (
          <>
            <svg
              className={styles.chart}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              aria-label="Scatter plot of eval case overview buckets and metric scores"
            >
              <defs>
                <linearGradient id="scatter-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f8fbff" />
                  <stop offset="100%" stopColor="#eef2ff" />
                </linearGradient>
              </defs>

              <rect
                x={0}
                y={0}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                className={styles.chartBg}
                rx={14}
              />

              {COLUMN_VALUES.map(value => {
                const x = MARGIN.left + (value / 4) * plotWidth

                return (
                  <line
                    key={`column-${value}`}
                    x1={x}
                    y1={MARGIN.top}
                    x2={x}
                    y2={CHART_HEIGHT - MARGIN.bottom}
                    className={styles.columnLine}
                  />
                )
              })}

              {Y_TICKS.map(value => {
                const y = MARGIN.top + (1 - value) * plotHeight

                return (
                  <g key={`y-${value}`}>
                    <line
                      x1={MARGIN.left}
                      y1={y}
                      x2={CHART_WIDTH - MARGIN.right}
                      y2={y}
                      className={styles.gridLine}
                    />
                    <text x={MARGIN.left - 14} y={y + 4} className={styles.tickText}>
                      {Math.round(value * 100)}%
                    </text>
                  </g>
                )
              })}

              <line
                x1={MARGIN.left}
                y1={MARGIN.top}
                x2={MARGIN.left}
                y2={CHART_HEIGHT - MARGIN.bottom}
                className={styles.axisLine}
              />
              <line
                x1={MARGIN.left}
                y1={CHART_HEIGHT - MARGIN.bottom}
                x2={CHART_WIDTH - MARGIN.right}
                y2={CHART_HEIGHT - MARGIN.bottom}
                className={styles.axisLine}
              />

              {COLUMN_VALUES.map(value => {
                const x = MARGIN.left + (value / 4) * plotWidth

                return (
                  <text
                    key={`x-${value}`}
                    x={x}
                    y={CHART_HEIGHT - MARGIN.bottom + 26}
                    className={styles.tickText}
                    textAnchor="middle"
                  >
                    {value}
                  </text>
                )
              })}

              <text
                x={(MARGIN.left + CHART_WIDTH - MARGIN.right) / 2}
                y={CHART_HEIGHT - 12}
                className={styles.axisLabel}
                textAnchor="middle"
              >
                Passed Overview Buckets
              </text>
              <text
                x={24}
                y={CHART_HEIGHT / 2}
                transform={`rotate(-90 24 ${CHART_HEIGHT / 2})`}
                className={styles.axisLabel}
                textAnchor="middle"
              >
                Average Metric Score
              </text>

              {positionedPoints.map(point => {
                const isSelected = point.caseKey === selectedCaseKey
                const fillClassName = point.success ? styles.pointPass : styles.pointFail

                return (
                  <g
                    key={point.caseKey}
                    className={styles.point}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={buildPointAriaLabel(point)}
                    onClick={() => {
                      onSelectCase(point.caseKey)
                      setTooltipCaseKey(point.caseKey)
                    }}
                    onFocus={() => setTooltipCaseKey(point.caseKey)}
                    onBlur={() => setTooltipCaseKey(null)}
                    onMouseEnter={() => setTooltipCaseKey(point.caseKey)}
                    onMouseLeave={() => setTooltipCaseKey(null)}
                    onKeyDown={event => handlePointKeyDown(event, point.caseKey)}
                  >
                    <circle
                      cx={point.plotX}
                      cy={point.plotY}
                      r={POINT_RADIUS + (isSelected ? 6 : 4)}
                      className={`${styles.pointRing} ${isSelected ? styles.pointRingSelected : ''}`}
                    />
                    <circle
                      cx={point.plotX}
                      cy={point.plotY}
                      r={POINT_RADIUS}
                      className={`${styles.pointCircle} ${fillClassName}`}
                    />
                    <text
                      x={point.plotX}
                      y={point.plotY}
                      className={styles.pointLabel}
                      textAnchor="middle"
                    >
                      {point.passedBucketCount}/4
                    </text>
                  </g>
                )
              })}
            </svg>

            {highlightedPoint && (
              <div
                className={`${styles.tooltip} ${highlightedPoint.plotY < 88 ? styles.tooltipBelow : ''}`}
                style={{
                  left: `${(highlightedPoint.plotX / CHART_WIDTH) * 100}%`,
                  top: `${(highlightedPoint.plotY / CHART_HEIGHT) * 100}%`,
                }}
              >
                <div className={styles.tooltipHeader}>
                  <span className={styles.tooltipName}>{highlightedPoint.caseName}</span>
                  <span className={highlightedPoint.success ? styles.tooltipPass : styles.tooltipFail}>
                    {highlightedPoint.success ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <div className={styles.tooltipMeta}>
                  {highlightedPoint.passedBucketCount}/4 buckets passed
                </div>
                <div className={styles.tooltipMeta}>
                  {highlightedPoint.hasMetricScores
                    ? `Average metric score: ${formatPercent(highlightedPoint.averageMetricScore)}`
                    : 'Average metric score: No metric scores'}
                </div>
                <div className={styles.tooltipList}>
                  {OVERVIEW_BUCKET_ORDER.map(key => {
                    const bucket = highlightedPoint.buckets[key]

                    return (
                      <div key={key} className={styles.tooltipRow}>
                        <span>{bucket.label}</span>
                        <span>
                          {bucket.matched}/{bucket.comparable} ({formatBucketRatio(bucket)})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function buildPointAriaLabel(point: PositionedPoint): string {
  const bucketSummary = OVERVIEW_BUCKET_ORDER
    .map(key => {
      const bucket = point.buckets[key]
      return `${bucket.label} ${bucket.matched} of ${bucket.comparable}, ${formatBucketRatio(bucket)}`
    })
    .join('. ')

  const metricSummary = point.hasMetricScores
    ? `Average metric score ${formatPercent(point.averageMetricScore)}`
    : 'No metric scores'

  return `${point.caseName}. ${point.success ? 'Passing' : 'Failing'} case. ${point.passedBucketCount} of 4 overview buckets passed. ${metricSummary}. ${bucketSummary}.`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`
}

function getStableJitter(caseKey: string): number {
  return (normalizeHash(hashString(caseKey)) - 0.5) * 44
}

function normalizeHash(value: number): number {
  return (value >>> 0) / 0xffffffff
}

function hashString(value: string): number {
  let hash = 2166136261

  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
