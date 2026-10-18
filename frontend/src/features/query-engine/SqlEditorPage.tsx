import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataSourcesQuery } from '@/features/datasources/hooks'
import { datasourcesApi } from '@/features/datasources/api'
import { FieldResponse } from '@/types/datasource'
import { QueryResultData } from './types'
import { useExecuteQueryMutation } from './hooks'
import { parseSqlToQueryDefinition } from './sqlParser'
import { CatalogSidebar } from './components/CatalogSidebar'
import { ResultsViewer } from './components/ResultsViewer'
import { SqlCodeEditor } from './components/SqlCodeEditor'
import { VisualizationSidebar } from './components/VisualizationSidebar'
import {
  VisualizationConfig,
  createDefaultVisualizationConfig,
} from './visualizationTypes'
import { SaveQuestionDialog } from './components/SaveQuestionDialog'

export const SqlEditorPage: React.FC = () => {
  const { currentOrganization } = useAuthStore()
  const [searchParams] = useSearchParams()

  const urlDsId = searchParams.get('datasourceId') || ''
  const urlTable = searchParams.get('table') || ''

  // 1. Data Sources
  const { data: dataSources = [] } = useDataSourcesQuery(currentOrganization?.id)

  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>(urlDsId)
  const [schemas, setSchemas] = useState<string[]>([])
  const [selectedSchema, setSelectedSchema] = useState<string>('')
  const [tables, setTables] = useState<string[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false)
  const [selectedTable, setSelectedTable] = useState<string>(urlTable)
  const [availableColumns, setAvailableColumns] = useState<FieldResponse[]>([])

  const [isCatalogOpen, setIsCatalogOpen] = useState(true)

  // 2. Single Query Editor State (No multiple tabs)
  const [sql, setSql] = useState<string>(
    urlTable ? `SELECT * \nFROM ${urlTable} \nLIMIT 100;` : 'SELECT * \nFROM orders \nLIMIT 100;'
  )

  // 3. Execution & Results
  const [queryResult, setQueryResult] = useState<QueryResultData | null>(null)
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  // 4. Visualization State (Metabase Visual Picker & ECharts Configuration)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [isVisSidebarOpen, setIsVisSidebarOpen] = useState(false)
  const [visSidebarTab, setVisSidebarTab] = useState<'picker' | 'settings'>('picker')
  const [visConfig, setVisConfig] = useState<VisualizationConfig>(() =>
    createDefaultVisualizationConfig(null)
  )
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  const executeMutation = useExecuteQueryMutation(currentOrganization?.id, {
    onSuccess: (data) => {
      setQueryResult(data)
      setExecutionError(null)
      // Auto-configure chart defaults if no column is set
      setVisConfig((prev) => {
        if (!prev.data.xAxisColumn || !data.columns.some((c) => c.name === prev.data.xAxisColumn)) {
          return createDefaultVisualizationConfig(data)
        }
        return prev
      })
    },
    onError: (err) => {
      setExecutionError(err)
      setQueryResult(null)
    },
  })

  // Auto-select data source from list or URL
  useEffect(() => {
    if (dataSources.length === 0) return

    if (urlDsId && dataSources.some((ds) => ds.id === urlDsId)) {
      if (selectedDataSourceId !== urlDsId) {
        setSelectedDataSourceId(urlDsId)
      }
    } else if (!selectedDataSourceId) {
      setSelectedDataSourceId(dataSources[0].id)
    }
  }, [dataSources, selectedDataSourceId, urlDsId])

  // Load schemas
  useEffect(() => {
    if (!currentOrganization?.id || !selectedDataSourceId) return

    let isMounted = true
    datasourcesApi
      .getNamespaces(currentOrganization.id, selectedDataSourceId)
      .then((res) => {
        if (!isMounted) return
        const names = res.map((r) => r.name)
        setSchemas(names)
        if (names.length > 0) {
          setSelectedSchema(names[0])
        }
      })
      .catch((err) => console.error('Failed to load namespaces', err))

    return () => {
      isMounted = false
    }
  }, [currentOrganization?.id, selectedDataSourceId])

  // Load tables / collections
  useEffect(() => {
    if (!currentOrganization?.id || !selectedDataSourceId || !selectedSchema) {
      setTables([])
      return
    }

    let isMounted = true
    setIsLoadingTables(true)
    datasourcesApi
      .getCollections(currentOrganization.id, selectedDataSourceId, selectedSchema)
      .then((res) => {
        if (!isMounted) return
        const tNames = res.map((r) => r.name)
        setTables(tNames)
        if (tNames.length > 0 && (!selectedTable || !tNames.includes(selectedTable))) {
          setSelectedTable(tNames[0])
        }
      })
      .catch((err) => {
        console.error('Failed to load collections', err)
        if (isMounted) setTables([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingTables(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentOrganization?.id, selectedDataSourceId, selectedSchema])

  // Load columns for selected table
  useEffect(() => {
    if (!currentOrganization?.id || !selectedDataSourceId || !selectedSchema || !selectedTable) return

    let isMounted = true
    datasourcesApi
      .getFields(currentOrganization.id, selectedDataSourceId, selectedSchema, selectedTable)
      .then((res) => {
        if (!isMounted) return
        setAvailableColumns(res)
      })
      .catch((err) => console.error('Failed to load fields', err))

    return () => {
      isMounted = false
    }
  }, [currentOrganization?.id, selectedDataSourceId, selectedSchema, selectedTable])

  // Execute query handler
  const handleExecute = useCallback(() => {
    if (!selectedDataSourceId) {
      setExecutionError('Please select a data source from the catalog.')
      return
    }

    const sqlToRun = sql.trim()
    if (!sqlToRun) {
      setExecutionError('Please enter a SQL query to execute.')
      return
    }

    try {
      const queryDefinition = parseSqlToQueryDefinition(
        sqlToRun,
        selectedDataSourceId,
        selectedSchema,
        availableColumns
      )

      const startTime = performance.now()
      setExecutionError(null)

      executeMutation.mutate(queryDefinition, {
        onSettled: () => {
          setExecutionTimeMs(Math.round(performance.now() - startTime))
        },
      })
    } catch (parseErr: any) {
      setExecutionError(parseErr?.message || 'Failed to parse SQL into query definition.')
    }
  }, [selectedDataSourceId, selectedSchema, availableColumns, sql, executeMutation])

  // Keyboard shortcut listener for Cmd+Enter / Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleExecute()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleExecute])

  // Current parsed QueryDefinition
  const currentQueryDefinition = React.useMemo(() => {
    if (!selectedDataSourceId || !sql.trim()) return null
    try {
      return parseSqlToQueryDefinition(
        sql.trim(),
        selectedDataSourceId,
        selectedSchema,
        availableColumns
      )
    } catch {
      return null
    }
  }, [sql, selectedDataSourceId, selectedSchema, availableColumns])

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100/70">
      {/* 1. Left Panel: Either Visualization Sidebar (when configuring visual) OR Data Catalog */}
      {isVisSidebarOpen ? (
        <VisualizationSidebar
          columns={queryResult?.columns || []}
          config={visConfig}
          onChangeConfig={setVisConfig}
          onSelectViewMode={(m) => setViewMode(m)}
          onClose={() => setIsVisSidebarOpen(false)}
          initialTab={visSidebarTab}
        />
      ) : (
        <CatalogSidebar
          organizationId={currentOrganization?.id || ''}
          isOpen={isCatalogOpen}
          onToggle={() => setIsCatalogOpen(!isCatalogOpen)}
          dataSources={dataSources}
          selectedDataSourceId={selectedDataSourceId}
          schemas={schemas}
          selectedSchema={selectedSchema}
          onSelectSchema={(s) => {
            setSelectedSchema(s)
            setSelectedTable('')
          }}
          tables={tables}
          isLoadingTables={isLoadingTables}
          selectedTable={selectedTable}
          onSelectTable={(dsId, schema, tableName) => {
            setSelectedDataSourceId(dsId)
            setSelectedSchema(schema)
            setSelectedTable(tableName)
            setSql(`SELECT * \nFROM ${tableName} \nLIMIT 100;`)
          }}
          onInsertText={(text) => {
            setSql((prev) => `${prev} ${text}`)
          }}
        />
      )}

      {/* 2. Single Query Executor Workspace (Metabase native SQL layout) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white p-4 gap-4">
        {/* SQL Code Editor with integrated Run Query button */}
        <div className="h-[240px] shrink-0">
          <SqlCodeEditor
            value={sql}
            onChange={setSql}
            onExecute={handleExecute}
            onSaveQuestion={() => setIsSaveModalOpen(true)}
            isExecuting={executeMutation.isPending}
            placeholder="Enter your SQL query (e.g. SELECT * FROM table LIMIT 100)..."
            isCatalogOpen={isVisSidebarOpen || isCatalogOpen}
            onToggleCatalog={() => {
              if (isVisSidebarOpen) {
                setIsVisSidebarOpen(false)
              } else {
                setIsCatalogOpen(!isCatalogOpen)
              }
            }}
          />
        </div>

        {/* Execution Error Banner */}
        {executionError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fade-in shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-red-900">Query Error: </span>
              <span className="font-mono">{executionError}</span>
            </div>
          </div>
        )}

        {/* Results Viewer Grid */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <ResultsViewer
            data={queryResult}
            executionTimeMs={executionTimeMs}
            error={executionError}
            isLoading={executeMutation.isPending}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode)
              if (mode === 'chart' && (visConfig.type === 'table' || !visConfig.data.xAxisColumn)) {
                setVisConfig((prev) => {
                  const def = createDefaultVisualizationConfig(queryResult)
                  return {
                    ...def,
                    type: prev.type === 'table' ? 'bar' : prev.type,
                  }
                })
              }
            }}
            visConfig={visConfig}
            onOpenVisualPicker={() => {
              setVisSidebarTab('picker')
              setIsVisSidebarOpen(true)
            }}
            onOpenVisualSettings={() => {
              setVisSidebarTab('settings')
              setIsVisSidebarOpen(true)
            }}
            onSaveQuestion={() => setIsSaveModalOpen(true)}
          />
        </div>
      </div>

      {/* Save Question Modal Dialog */}
      <SaveQuestionDialog
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        organizationId={currentOrganization?.id}
        dataSourceName={dataSources.find((d) => d.id === selectedDataSourceId)?.name}
        queryDefinition={currentQueryDefinition}
        visualizationType={viewMode === 'chart' ? visConfig.type : 'table'}
        visualizationSettings={{
          ...visConfig,
          viewMode,
        }}
        sql={sql}
      />
    </div>
  )
}
