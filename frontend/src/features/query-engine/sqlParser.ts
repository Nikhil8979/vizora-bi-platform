import { QueryDefinition, DimensionDefinition, MetricDefinition, ComparisonFilter, SortDefinition, AggregationFunction, ComparisonOperator } from './types'
import { FieldResponse } from '@/types/datasource'

/**
 * Parses a standard SQL query string into a backend QueryDefinition.
 */
export function parseSqlToQueryDefinition(
  sql: string,
  dataSourceId: string,
  defaultSchema?: string,
  availableColumns?: FieldResponse[]
): QueryDefinition {
  // 1. Clean the SQL
  const cleaned = sql
    .replace(/--.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove block comments
    .replace(/;/g, '') // Remove semicolons
    .trim()

  // 2. Extract LIMIT
  let limit = 100
  const limitMatch = cleaned.match(/\bLIMIT\s+(\d+)\b/i)
  if (limitMatch) {
    limit = Math.min(10000, Math.max(1, parseInt(limitMatch[1], 10)))
  }

  // 3. Extract DISTINCT
  const distinct = /\bSELECT\s+DISTINCT\b/i.test(cleaned)

  // 4. Extract FROM table
  let schema: string | null = defaultSchema || null
  let tableName = ''

  const fromMatch = cleaned.match(/\bFROM\s+([`"'\w.]+)/i)
  if (fromMatch) {
    const rawTable = fromMatch[1].replace(/[`"']/g, '')
    const parts = rawTable.split('.')
    if (parts.length >= 3) {
      schema = parts[1]
      tableName = parts[2]
    } else if (parts.length === 2) {
      schema = parts[0]
      tableName = parts[1]
    } else {
      tableName = parts[0]
    }
  }

  // 5. Extract SELECT clause
  const dimensions: DimensionDefinition[] = []
  const metrics: MetricDefinition[] = []

  const selectMatch = cleaned.match(/\bSELECT\s+(?:DISTINCT\s+)?([\s\S]*?)\s+\bFROM\b/i)
  if (selectMatch) {
    const selectClause = selectMatch[1].trim()

    if (selectClause === '*' || selectClause === '`*`') {
      // If SELECT *, use available columns or fallback to wildcard
      if (availableColumns && availableColumns.length > 0) {
        availableColumns.slice(0, 20).forEach((col) => {
          dimensions.push({ column: col.name })
        })
      } else {
        dimensions.push({ column: '*' })
      }
    } else {
      // Split items by commas not inside parentheses
      const items = splitByTopLevelComma(selectClause)

      for (const rawItem of items) {
        const item = rawItem.trim()
        if (!item) continue

        // Check for AS alias
        let expr = item
        let alias: string | null = null
        const asMatch = item.match(/^(.*?)\s+(?:AS\s+)?([`"'\w]+)$/i)
        if (asMatch && !asMatch[1].includes('(') && asMatch[2]) {
          // simple col alias
          expr = asMatch[1].trim()
          alias = asMatch[2].replace(/[`"']/g, '').trim()
        } else if (item.includes('(')) {
          // function with possible alias
          const fnAsMatch = item.match(/\)\s+(?:AS\s+)?([`"'\w]+)$/i)
          if (fnAsMatch) {
            alias = fnAsMatch[1].replace(/[`"']/g, '').trim()
            expr = item.substring(0, item.lastIndexOf(')') + 1).trim()
          }
        }

        // Check for aggregates
        const aggMatch = expr.match(/^(COUNT|COUNT_DISTINCT|SUM|AVG|MIN|MAX)\s*\(\s*(?:DISTINCT\s+)?([^)]*)\s*\)$/i)
        if (aggMatch) {
          const fn = aggMatch[1].toUpperCase() as AggregationFunction
          const col = aggMatch[2].replace(/[`"']/g, '').trim() || '*'
          metrics.push({
            column: col,
            aggregation: fn,
            alias: alias || undefined,
          })
        } else {
          // Regular dimension
          const cleanCol = expr.replace(/[`"']/g, '').trim()
          dimensions.push({
            column: cleanCol,
            alias: alias || undefined,
          })
        }
      }
    }
  }

  // 6. Extract WHERE clause (simple comparison)
  let filters: ComparisonFilter | null = null
  const whereMatch = cleaned.match(/\bWHERE\s+([\s\S]*?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|$)/i)
  if (whereMatch) {
    const whereClause = whereMatch[1].trim()
    const compMatch = whereClause.match(/([`"'\w.]+)\s*(=|!=|>|<|>=|<=|LIKE)\s*([`"']?.*?['"]?)(?:\s+(?:AND|OR)\b|$)/i)
    if (compMatch) {
      const col = compMatch[1].replace(/[`"']/g, '').trim()
      const op = compMatch[2].toUpperCase() as ComparisonOperator
      let val: any = compMatch[3].trim().replace(/^['"]|['"]$/g, '')
      if (!isNaN(Number(val)) && val !== '') {
        val = Number(val)
      }
      filters = {
        type: 'comparison',
        column: col,
        operator: op,
        value: val,
      }
    }
  }

  // 7. Extract ORDER BY
  const sort: SortDefinition[] = []
  const orderMatch = cleaned.match(/\bORDER\s+BY\s+([\s\S]*?)(?:\bLIMIT\b|$)/i)
  if (orderMatch) {
    const orderItems = splitByTopLevelComma(orderMatch[1].trim())
    for (const oi of orderItems) {
      const match = oi.trim().match(/([`"'\w.]+)(?:\s+(ASC|DESC))?/i)
      if (match) {
        const field = match[1].replace(/[`"']/g, '').trim()
        const direction = (match[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
        sort.push({ field, direction })
      }
    }
  }

  // 8. Ensure at least one dimension or metric exists
  if (dimensions.length === 0 && metrics.length === 0) {
    if (availableColumns && availableColumns.length > 0) {
      dimensions.push({ column: availableColumns[0].name })
    } else {
      dimensions.push({ column: 'id' })
    }
  }

  return {
    data_source_id: dataSourceId,
    table: {
      catalog: null,
      schema: schema || null,
      name: tableName || 'table',
    },
    dimensions,
    metrics,
    filters: filters || null,
    having: null,
    sort,
    limit,
    distinct,
  }
}

/**
 * Formats a QueryDefinition back into SQL preview text
 */
export function generateSqlFromQuery(query: QueryDefinition): string {
  const selectParts: string[] = []

  // Dimensions
  query.dimensions?.forEach((dim) => {
    if (dim.alias) {
      selectParts.push(`${dim.column} AS ${dim.alias}`)
    } else {
      selectParts.push(dim.column)
    }
  })

  // Metrics
  query.metrics?.forEach((m) => {
    const fnCall = `${m.aggregation}(${m.column})`
    if (m.alias) {
      selectParts.push(`${fnCall} AS ${m.alias}`)
    } else {
      selectParts.push(fnCall)
    }
  })

  const selectStr = selectParts.length > 0 ? selectParts.join(',\n  ') : '*'
  const tableRef = query.table.schema
    ? `${query.table.schema}.${query.table.name}`
    : query.table.name

  let sql = `SELECT \n  ${selectStr}\nFROM ${tableRef || 'table'}`

  // WHERE
  if (query.filters) {
    const f = query.filters
    const val = typeof f.value === 'string' ? `'${f.value}'` : f.value
    sql += `\nWHERE ${f.column} ${f.operator} ${val}`
  }

  // GROUP BY
  if (query.metrics && query.metrics.length > 0 && query.dimensions && query.dimensions.length > 0) {
    const groupCols = query.dimensions.map((d) => d.column).join(', ')
    sql += `\nGROUP BY ${groupCols}`
  }

  // ORDER BY
  if (query.sort && query.sort.length > 0) {
    const sortParts = query.sort.map((s) => `${s.field} ${s.direction}`).join(', ')
    sql += `\nORDER BY ${sortParts}`
  }

  // LIMIT
  if (query.limit) {
    sql += `\nLIMIT ${query.limit};`
  } else {
    sql += ';'
  }

  return sql
}

function splitByTopLevelComma(str: string): string[] {
  const result: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') depth++
    else if (char === ')') depth--

    if (char === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}
