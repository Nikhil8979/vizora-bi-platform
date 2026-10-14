import { FieldResponse } from '@/types/datasource'

export type AggregationFunction =
  | 'SUM'
  | 'COUNT'
  | 'COUNT_DISTINCT'
  | 'AVG'
  | 'MIN'
  | 'MAX'

export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE'
export type SortDirection = 'ASC' | 'DESC'

export interface TableReference {
  catalog?: string | null
  schema?: string | null
  name: string
}

export interface DimensionDefinition {
  column: string
  alias?: string | null
}

export interface MetricDefinition {
  column: string
  alias?: string | null
  aggregation: AggregationFunction
}

export interface ComparisonFilter {
  type: 'comparison'
  column: string
  operator: ComparisonOperator
  value: any
}

export type FilterExpression = ComparisonFilter

export interface SortDefinition {
  field: string
  direction: SortDirection
}

export interface QueryDefinition {
  data_source_id: string
  table: TableReference
  dimensions?: DimensionDefinition[]
  metrics?: MetricDefinition[]
  filters?: FilterExpression | null
  having?: FilterExpression | null
  sort?: SortDefinition[]
  limit?: number
  distinct?: boolean
}

export interface QueryColumn {
  name: string
  type: string
}

export interface QueryRow {
  values: (string | number | boolean | null | Record<string, any>)[]
}

export interface QueryResultData {
  columns: QueryColumn[]
  rows: QueryRow[]
  row_count: number
}

export type VisualizationType = 'table' | 'bar' | 'line' | 'metric' | 'json'

export function normalizeQueryResult(raw: any): QueryResultData {
  if (!raw) return { columns: [], rows: [], row_count: 0 }

  let columns: QueryColumn[] = []
  if (Array.isArray(raw.columns)) {
    if (
      raw.columns.length > 0 &&
      typeof raw.columns[0] === 'object' &&
      raw.columns[0] !== null &&
      'name' in raw.columns[0]
    ) {
      columns = raw.columns.map((c: any) => ({
        name: String(c.name),
        type: String(c.type || 'string'),
      }))
    } else {
      columns = raw.columns.map((colName: any) => ({
        name: String(colName),
        type: 'string',
      }))
    }
  }

  let rows: QueryRow[] = []
  if (Array.isArray(raw.rows)) {
    rows = raw.rows.map((row: any) => {
      if (row && typeof row === 'object' && Array.isArray(row.values)) {
        return { values: row.values }
      } else if (row && typeof row === 'object') {
        const values = columns.map((c) => row[c.name])
        return { values }
      } else {
        return { values: [row] }
      }
    })
  }

  // Infer types from first non-null values if column types are generic
  if (columns.length > 0 && rows.length > 0) {
    columns.forEach((col, idx) => {
      for (const r of rows) {
        const val = r.values[idx]
        if (val !== null && val !== undefined) {
          if (typeof val === 'number') col.type = Number.isInteger(val) ? 'integer' : 'float'
          else if (typeof val === 'boolean') col.type = 'boolean'
          else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) col.type = 'date'
          break
        }
      }
    })
  }

  return {
    columns,
    rows,
    row_count: raw.row_count ?? rows.length,
  }
}
