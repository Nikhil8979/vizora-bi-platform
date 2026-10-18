import { QueryResultData } from './types'

export type ChartType = 'table' | 'bar' | 'line' | 'pie'

export interface ChartDataConfig {
  xAxisColumn: string
  yAxisColumns: string[]
  dimensionColumn: string
  metricColumn: string
}

export interface ChartDisplayConfig {
  showGoalLine: boolean
  goalValue: number
  showValuesOnPoints: boolean
  numberFormatting: 'auto' | 'compact' | 'full'
  colorPalette: string[]
}

export interface ChartAxesConfig {
  showXLabel: boolean
  xLabelText: string
  showYLabel: boolean
  yLabelText: string
  autoYRange: boolean
  yScale: 'linear' | 'log'
  showTicks: boolean
}

export interface VisualizationConfig {
  type: ChartType
  data: ChartDataConfig
  display: ChartDisplayConfig
  axes: ChartAxesConfig
}

export const METABASE_PALETTE = [
  '#509ee3', // Metabase Iconic Sky Blue
  '#88c999', // Mint Green
  '#f2a65a', // Coral Orange
  '#a989c5', // Lavender Purple
  '#e56e6e', // Salmon Red
  '#71a396', // Sage Teal
  '#efbb35', // Warm Yellow
  '#5e72e4', // Royal Blue
]

export function createDefaultVisualizationConfig(result?: QueryResultData | null): VisualizationConfig {
  let defaultX = ''
  let defaultY: string[] = []
  let defaultDim = ''
  let defaultMetric = ''

  if (result && result.columns.length > 0) {
    const cols = result.columns.map((c) => c.name)

    // Check both col.type string and row values to identify numeric columns
    const isColumnNumeric = (colIndex: number): boolean => {
      const typeStr = (result.columns[colIndex]?.type || '').toLowerCase()
      if (['integer', 'float', 'number', 'numeric', 'int', 'double', 'decimal', 'real', 'bigint', 'smallint', 'tinyint'].some((t) => typeStr.includes(t))) {
        return true
      }
      if (result.rows && result.rows.length > 0) {
        let numericCount = 0
        let nonNullCount = 0
        for (let i = 0; i < Math.min(result.rows.length, 20); i++) {
          const val = result.rows[i]?.values?.[colIndex]
          if (val !== null && val !== undefined && val !== '') {
            nonNullCount++
            if (typeof val === 'number' || (!isNaN(Number(val)) && typeof val !== 'boolean')) {
              numericCount++
            }
          }
        }
        if (nonNullCount > 0 && numericCount / nonNullCount >= 0.8) {
          return true
        }
      }
      return false
    }

    const numericCols = result.columns
      .filter((_, idx) => isColumnNumeric(idx))
      .map((c) => c.name)

    const categoricalCols = result.columns
      .filter((_, idx) => !isColumnNumeric(idx))
      .map((c) => c.name)

    // Pick best X-axis: prefer categorical/date, otherwise first column
    defaultX = categoricalCols.length > 0 ? categoricalCols[0] : cols[0]

    // Pick best Y-axis: prefer numeric columns that are different from X
    const validNumeric = numericCols.filter((c) => c !== defaultX)
    if (validNumeric.length > 0) {
      defaultY = [validNumeric[0]]
      defaultMetric = validNumeric[0]
    } else if (numericCols.length > 0) {
      defaultY = [numericCols[0]]
      defaultMetric = numericCols[0]
    } else {
      defaultY = cols.length > 1 ? [cols[1]] : [cols[0]]
      defaultMetric = defaultY[0]
    }

    defaultDim = defaultX
  }

  return {
    type: 'bar',
    data: {
      xAxisColumn: defaultX,
      yAxisColumns: defaultY,
      dimensionColumn: defaultDim,
      metricColumn: defaultMetric,
    },
    display: {
      showGoalLine: false,
      goalValue: 0,
      showValuesOnPoints: false,
      numberFormatting: 'auto',
      colorPalette: METABASE_PALETTE,
    },
    axes: {
      showXLabel: true,
      xLabelText: defaultX,
      showYLabel: true,
      yLabelText: defaultMetric,
      autoYRange: true,
      yScale: 'linear',
      showTicks: true,
    },
  }
}
