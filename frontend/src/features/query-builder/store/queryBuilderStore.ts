import { create } from 'zustand'
import { FieldResponse } from '@/types/datasource'
import {
  QueryDefinition,
  QueryResultData,
  FilterExpression,
  SortDirection,
  AggregationFunction,
  ComparisonOperator,
  compileQueryDefinitionToSql,
} from '@/features/query-engine/types'
import {
  VisualizationConfig,
  createDefaultVisualizationConfig,
} from '@/features/query-engine/visualizationTypes'

export interface AdhocFilter {
  id: string
  column: string
  operator: ComparisonOperator | 'IS NULL' | 'IS NOT NULL'
  value: any
}

export interface AdhocMetric {
  id: string
  aggregation: AggregationFunction
  column: string
  alias?: string
}

export interface AdhocDimension {
  id: string
  column: string
  timeGrain?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  alias?: string
}

export interface AdhocSort {
  field: string
  direction: SortDirection
}

export interface QueryBuilderState {
  // 1. Data Source & Dataset Schema
  dataSourceId: string
  schema: string
  table: string
  columns: FieldResponse[]

  // 2. Query Pipeline Stages (Metabase & Superset MBQL Model)
  filters: AdhocFilter[]
  metrics: AdhocMetric[]
  dimensions: AdhocDimension[]
  sort: AdhocSort | null
  limit: number

  // 3. UI State
  isEditorVisible: boolean
  viewMode: 'table' | 'chart'
  isVisSidebarOpen: boolean
  visSidebarTab: 'picker' | 'settings'
  visConfig: VisualizationConfig

  // 4. Execution & Query Results
  isExecuting: boolean
  executionTimeMs: number | null
  executionError: string | null
  queryResult: QueryResultData | null

  // Actions
  setDataSourceId: (id: string) => void
  setSchema: (schema: string) => void
  setTable: (table: string) => void
  setColumns: (columns: FieldResponse[]) => void

  addFilter: (filter: AdhocFilter) => void
  updateFilter: (id: string, updated: Partial<AdhocFilter>) => void
  removeFilter: (id: string) => void
  clearFilters: () => void

  setPrimaryMetric: (metric: Partial<AdhocMetric>) => void
  addMetric: (metric: AdhocMetric) => void
  updateMetric: (id: string, updated: Partial<AdhocMetric>) => void
  removeMetric: (id: string) => void

  addDimension: (column: string, timeGrain?: AdhocDimension['timeGrain']) => void
  removeDimension: (column: string) => void
  clearDimensions: () => void

  setSort: (field: string, direction: SortDirection) => void
  setLimit: (limit: number) => void

  setIsEditorVisible: (visible: boolean) => void
  setViewMode: (mode: 'table' | 'chart') => void
  setIsVisSidebarOpen: (open: boolean) => void
  setVisSidebarTab: (tab: 'picker' | 'settings') => void
  setVisConfig: (updater: VisualizationConfig | ((prev: VisualizationConfig) => VisualizationConfig)) => void

  setIsExecuting: (isExecuting: boolean) => void
  setQueryResult: (result: QueryResultData | null, timeMs?: number) => void
  setExecutionError: (error: string | null) => void

  resetPipeline: () => void
  getCompiledQueryDefinition: () => QueryDefinition | null
  getCompiledSql: () => string
}

export const useQueryBuilderStore = create<QueryBuilderState>((set, get) => ({
  // Defaults
  dataSourceId: '',
  schema: '',
  table: '',
  columns: [],

  filters: [],
  metrics: [],
  dimensions: [],
  sort: null,
  limit: 100,

  isEditorVisible: true,
  viewMode: 'table',
  isVisSidebarOpen: false,
  visSidebarTab: 'picker',
  visConfig: createDefaultVisualizationConfig(null),

  isExecuting: false,
  executionTimeMs: null,
  executionError: null,
  queryResult: null,

  // Dataset setters
  setDataSourceId: (id) =>
    set((state) => {
      if (state.dataSourceId === id) return state
      return {
        dataSourceId: id,
        schema: '',
        table: '',
        columns: [],
        filters: [],
        metrics: [],
        dimensions: [],
        sort: null,
        queryResult: null,
        executionError: null,
      }
    }),
  setSchema: (schema) =>
    set((state) => {
      if (state.schema === schema) return state
      return {
        schema,
        table: '',
        columns: [],
        filters: [],
        metrics: [],
        dimensions: [],
        sort: null,
        queryResult: null,
        executionError: null,
      }
    }),
  setTable: (table) => {
    set({
      table,
      columns: [],
      filters: [],
      metrics: [],
      dimensions: [],
      sort: null,
      queryResult: null,
      executionError: null,
    })
  },
  setColumns: (columns) => {
    set({ columns })
  },

  // Filter actions
  addFilter: (filter) =>
    set((state) => ({ filters: [...state.filters, filter] })),
  updateFilter: (id, updated) =>
    set((state) => ({
      filters: state.filters.map((f) => (f.id === id ? { ...f, ...updated } : f)),
    })),
  removeFilter: (id) =>
    set((state) => ({ filters: state.filters.filter((f) => f.id !== id) })),
  clearFilters: () => set({ filters: [] }),

  // Metric actions
  setPrimaryMetric: (updated) =>
    set((state) => {
      const current = state.metrics[0] || { id: '1', aggregation: 'COUNT', column: '*' }
      return {
        metrics: [{ ...current, ...updated }, ...state.metrics.slice(1)],
      }
    }),
  addMetric: (metric) =>
    set((state) => ({ metrics: [...state.metrics, metric] })),
  updateMetric: (id, updated) =>
    set((state) => ({
      metrics: state.metrics.map((m) => (m.id === id ? { ...m, ...updated } : m)),
    })),
  removeMetric: (id) =>
    set((state) => ({ metrics: state.metrics.filter((m) => m.id !== id) })),

  // Dimension actions
  addDimension: (column, timeGrain) =>
    set((state) => {
      if (state.dimensions.some((d) => d.column === column)) return state
      return {
        dimensions: [
          ...state.dimensions,
          { id: String(Date.now()), column, timeGrain },
        ],
      }
    }),
  removeDimension: (column) =>
    set((state) => ({
      dimensions: state.dimensions.filter((d) => d.column !== column),
    })),
  clearDimensions: () => set({ dimensions: [] }),

  // Sort & Limit
  setSort: (field, direction) => set({ sort: field ? { field, direction } : null }),
  setLimit: (limit) => set({ limit: Math.max(1, Math.min(10000, limit)) }),

  // View & Visualizer actions
  setIsEditorVisible: (visible) => set({ isEditorVisible: visible }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsVisSidebarOpen: (open) => set({ isVisSidebarOpen: open }),
  setVisSidebarTab: (tab) => set({ visSidebarTab: tab }),
  setVisConfig: (updater) =>
    set((state) => ({
      visConfig:
        typeof updater === 'function' ? updater(state.visConfig) : updater,
    })),

  // Execution actions
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setQueryResult: (result, timeMs) =>
    set((state) => {
      const nextVis = createDefaultVisualizationConfig(result)
      const hasMetricAndDim = state.metrics.length > 0 && state.dimensions.length > 0
      nextVis.type = hasMetricAndDim ? 'bar' : 'table'

      return {
        queryResult: result,
        executionTimeMs: timeMs ?? null,
        executionError: null,
        visConfig: nextVis,
        viewMode: hasMetricAndDim ? 'chart' : 'table',
      }
    }),
  setExecutionError: (error) =>
    set({ executionError: error, queryResult: null }),

  // Reset Pipeline
  resetPipeline: () =>
    set({
      filters: [],
      metrics: [],
      dimensions: [],
      sort: null,
      limit: 100,
      queryResult: null,
      executionError: null,
    }),

  // Compilation to backend QueryDefinition
  getCompiledQueryDefinition: () => {
    const s = get()
    if (!s.dataSourceId || !s.table) return null

    // 1. Dimensions
    let dims = s.dimensions.map((d) => ({
      column: d.column,
      alias: d.alias || null,
    }))

    // 2. Metrics
    const mets = s.metrics.map((m) => {
      const isCount = m.aggregation === 'COUNT'
      const col = isCount && (!m.column || m.column === '*') ? s.columns[0]?.name || 'id' : m.column
      const cleanCol = (m.column || '').replace(/[^a-zA-Z0-9_]/g, '')
      let defaultAlias = m.alias
      if (!defaultAlias) {
        if (isCount) {
          defaultAlias = cleanCol && cleanCol !== '*' ? `count_${cleanCol}` : 'count'
        } else if (m.aggregation === 'COUNT_DISTINCT') {
          defaultAlias = cleanCol ? `distinct_${cleanCol}` : 'distinct_count'
        } else {
          defaultAlias = cleanCol ? `${m.aggregation.toLowerCase()}_${cleanCol}` : m.aggregation.toLowerCase()
        }
      }
      return {
        aggregation: m.aggregation,
        column: col,
        alias: defaultAlias,
      }
    })

    // If no explicit dimensions and no metrics selected, select all columns of table for raw data view
    if (dims.length === 0 && mets.length === 0 && s.columns.length > 0) {
      dims = s.columns.map((c) => ({ column: c.name, alias: null }))
    }

    // 3. Filters
    const compiledConditions: FilterExpression[] = []
    s.filters.forEach((f) => {
      if (!f.column) return
      if (f.operator === 'IS NULL') {
        compiledConditions.push({ type: 'null', column: f.column, is_null: true })
      } else if (f.operator === 'IS NOT NULL') {
        compiledConditions.push({ type: 'null', column: f.column, is_null: false })
      } else if (f.value !== undefined && f.value !== '') {
        const numVal = Number(f.value)
        const finalVal = !isNaN(numVal) && String(f.value).trim() !== '' ? numVal : f.value
        compiledConditions.push({
          type: 'comparison',
          column: f.column,
          operator: f.operator,
          value: finalVal,
        })
      }
    })

    let filtersClause: FilterExpression | null = null
    if (compiledConditions.length === 1) {
      filtersClause = compiledConditions[0]
    } else if (compiledConditions.length > 1) {
      filtersClause = {
        type: 'logical',
        operator: 'AND',
        conditions: compiledConditions,
      }
    }

    // 4. Sort
    const sortClause = s.sort?.field
      ? [{ field: s.sort.field, direction: s.sort.direction }]
      : []

    return {
      data_source_id: s.dataSourceId,
      table: {
        catalog: null,
        schema: s.schema || null,
        name: s.table,
      },
      dimensions: dims,
      metrics: mets,
      filters: filtersClause,
      having: null,
      sort: sortClause,
      limit: s.limit || 100,
      distinct: false,
    }
  },

  // Compilation to readable SQL
  getCompiledSql: () => {
    const qd = get().getCompiledQueryDefinition()
    if (!qd) return '-- Select a table to view SQL'
    return compileQueryDefinitionToSql(qd)
  },
}))
