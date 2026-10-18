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

export interface NullFilter {
  type: 'null'
  column: string
  is_null: boolean
}

export interface LogicalFilter {
  type: 'logical'
  operator: 'AND' | 'OR'
  conditions: FilterExpression[]
}

export type FilterExpression = ComparisonFilter | NullFilter | LogicalFilter

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

/**
 * Compiles a QueryDefinition into readable SQL for previewing and editing.
 */
export function compileQueryDefinitionToSql(queryDef: QueryDefinition): string {
  if (!queryDef || !queryDef.table?.name) return '-- Select a table to generate SQL'

  const selectParts: string[] = []

  if (queryDef.dimensions && queryDef.dimensions.length > 0) {
    queryDef.dimensions.forEach((d) => {
      selectParts.push(d.alias ? `${d.column} AS ${d.alias}` : d.column)
    })
  }

  if (queryDef.metrics && queryDef.metrics.length > 0) {
    queryDef.metrics.forEach((m) => {
      const agg =
        m.aggregation === 'COUNT_DISTINCT'
          ? `COUNT(DISTINCT ${m.column})`
          : `${m.aggregation}(${m.column})`
      const cleanCol = (m.column || '').replace(/[^a-zA-Z0-9_]/g, '')
      const alias =
        m.alias ||
        (m.aggregation === 'COUNT'
          ? cleanCol && cleanCol !== '*'
            ? `count_${cleanCol}`
            : 'count'
          : m.aggregation === 'COUNT_DISTINCT'
          ? cleanCol
            ? `distinct_${cleanCol}`
            : 'distinct_count'
          : cleanCol
          ? `${m.aggregation.toLowerCase()}_${cleanCol}`
          : m.aggregation.toLowerCase())
      selectParts.push(`${agg} AS ${alias}`)
    })
  }

  const selectClause = selectParts.length > 0 ? selectParts.join(',\n  ') : '*'
  const distinctClause = queryDef.distinct ? 'DISTINCT ' : ''

  const tableName = queryDef.table.schema
    ? `"${queryDef.table.schema}"."${queryDef.table.name}"`
    : `"${queryDef.table.name}"`

  let sql = `SELECT ${distinctClause}\n  ${selectClause}\nFROM ${tableName}`

  const formatFilter = (filter: FilterExpression): string => {
    if (!filter) return ''
    if (filter.type === 'comparison') {
      const val =
        typeof filter.value === 'string'
          ? `'${filter.value}'`
          : filter.value === null
          ? 'NULL'
          : filter.value
      return `${filter.column} ${filter.operator} ${val}`
    }
    if (filter.type === 'null') {
      return `${filter.column} ${filter.is_null ? 'IS NULL' : 'IS NOT NULL'}`
    }
    if (filter.type === 'logical') {
      const inner = filter.conditions
        .map(formatFilter)
        .filter(Boolean)
        .join(` ${filter.operator} `)
      return inner ? `(${inner})` : ''
    }
    return ''
  }

  if (queryDef.filters) {
    const whereClause = formatFilter(queryDef.filters)
    if (whereClause) {
      sql += `\nWHERE ${whereClause}`
    }
  }

  if (
    queryDef.metrics &&
    queryDef.metrics.length > 0 &&
    queryDef.dimensions &&
    queryDef.dimensions.length > 0
  ) {
    const groupByCols = queryDef.dimensions.map((d) => d.column).join(', ')
    sql += `\nGROUP BY ${groupByCols}`
  }

  if (queryDef.sort && queryDef.sort.length > 0) {
    const sortClause = queryDef.sort
      .map((s) => `${s.field} ${s.direction}`)
      .join(', ')
    sql += `\nORDER BY ${sortClause}`
  }

  if (queryDef.limit) {
    sql += `\nLIMIT ${queryDef.limit}`
  }

  return sql + ';'
}

/**
 * Formats raw/driver column names (like BigQuery's f0_, f1_, _col0) into readable names.
 */
export function formatColumnHeader(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'f0_' || lower === 'f_0' || lower === 'f0' || lower === '_col0') {
    return 'Count'
  }
  const match = lower.match(/^f_?(\d+)_?$/)
  if (match) {
    const idx = parseInt(match[1], 10)
    return idx === 0 ? 'Count' : `Metric ${idx + 1}`
  }
  return trimmed
}


