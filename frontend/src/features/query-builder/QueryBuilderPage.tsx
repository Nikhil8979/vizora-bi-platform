import React, { useEffect, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Play,
  SlidersHorizontal,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataSourcesQuery } from '@/features/datasources/hooks'
import { datasourcesApi } from '@/features/datasources/api'
import { useExecuteQueryMutation } from '@/features/query-engine/hooks'
import { ResultsViewer } from '@/features/query-engine/components/ResultsViewer'
import { VisualizationSidebar } from '@/features/query-engine/components/VisualizationSidebar'
import { SaveQuestionDialog } from '@/features/query-engine/components/SaveQuestionDialog'
import { useQueryBuilderStore } from './store/queryBuilderStore'
import { MetabaseNotebook } from './components/MetabaseNotebook'
import { ViewSqlModal } from './components/ViewSqlModal'
import { Button } from '@/components/ui/button'
import { createDefaultVisualizationConfig } from '@/features/query-engine/visualizationTypes'

export const QueryBuilderPage: React.FC = () => {
  const { currentOrganization } = useAuthStore()
  const [searchParams] = useSearchParams()

  const urlDsId = searchParams.get('datasourceId') || ''
  const urlTable = searchParams.get('table') || ''

  // 1. Data Sources Query
  const { data: dataSources = [] } = useDataSourcesQuery(currentOrganization?.id)

  const [schemas, setSchemas] = useState<string[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false)
  const [isLoadingColumns, setIsLoadingColumns] = useState<boolean>(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false)

  // 2. Query Builder Store State & Actions
  const {
    dataSourceId,
    setDataSourceId,
    schema,
    setSchema,
    table,
    setTable,
    columns,
    setColumns,
    metrics,
    dimensions,
    isEditorVisible,
    setIsEditorVisible,
    viewMode,
    setViewMode,
    isVisSidebarOpen,
    setIsVisSidebarOpen,
    visSidebarTab,
    setVisSidebarTab,
    visConfig,
    setVisConfig,
    isExecuting,
    setIsExecuting,
    executionTimeMs,
    executionError,
    queryResult,
    setQueryResult,
    setExecutionError,
    getCompiledQueryDefinition,
    getCompiledSql,
  } = useQueryBuilderStore()

  const isUnaggregated = metrics.length === 0 || dimensions.length === 0

  // 3. Auto-select Data Source from list or URL
  useEffect(() => {
    if (dataSources.length === 0) return
    if (urlDsId && dataSources.some((ds) => ds.id === urlDsId)) {
      if (dataSourceId !== urlDsId) setDataSourceId(urlDsId)
    } else if (!dataSourceId) {
      setDataSourceId(dataSources[0].id)
    }
  }, [dataSources, dataSourceId, urlDsId, setDataSourceId])

  // 4. Load schemas for active data source
  useEffect(() => {
    if (!currentOrganization?.id || !dataSourceId) {
      setSchemas([])
      return
    }

    let isMounted = true
    datasourcesApi
      .getNamespaces(currentOrganization.id, dataSourceId)
      .then((res) => {
        if (!isMounted) return
        const names = res.map((r) => r.name)
        setSchemas(names)
        if (names.length > 0) {
          if (!schema || !names.includes(schema)) {
            setSchema(names[0])
          }
        } else {
          setSchema('')
        }
      })
      .catch((err) => {
        console.error('Failed to load namespaces', err)
        if (isMounted) setSchemas([])
      })

    return () => {
      isMounted = false
    }
  }, [currentOrganization?.id, dataSourceId, schema, setSchema])

  // 5. Load tables for active schema
  useEffect(() => {
    if (!currentOrganization?.id || !dataSourceId || !schema) {
      setTables([])
      return
    }

    let isMounted = true
    setIsLoadingTables(true)
    datasourcesApi
      .getCollections(currentOrganization.id, dataSourceId, schema)
      .then((res) => {
        if (!isMounted) return
        const tNames = res.map((r) => r.name)
        setTables(tNames)
        if (tNames.length > 0) {
          if (!table || !tNames.includes(table)) {
            setTable(urlTable && tNames.includes(urlTable) ? urlTable : tNames[0])
          }
        } else {
          setTable('')
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
  }, [currentOrganization?.id, dataSourceId, schema, table, urlTable, setTable])

  // 6. Load columns for selected table
  useEffect(() => {
    if (!currentOrganization?.id || !dataSourceId || !schema || !table) {
      setColumns([])
      return
    }

    let isMounted = true
    setIsLoadingColumns(true)
    datasourcesApi
      .getFields(currentOrganization.id, dataSourceId, schema, table)
      .then((res) => {
        if (!isMounted) return
        setColumns(res)
      })
      .catch((err) => {
        console.error('Failed to load fields', err)
        if (isMounted) setColumns([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingColumns(false)
      })

    return () => {
      isMounted = false
    }
  }, [currentOrganization?.id, dataSourceId, schema, table, setColumns])

  // 7. Execution Mutation
  const executeMutation = useExecuteQueryMutation(currentOrganization?.id, {
    onSuccess: (data) => {
      setQueryResult(data)
    },
    onError: (err) => {
      setExecutionError(err)
    },
  })

  // 8. Execute Handler
  const handleExecute = useCallback(() => {
    const qd = getCompiledQueryDefinition()
    if (!qd) {
      setExecutionError('Please select a valid table and columns to query.')
      return
    }

    const startTime = performance.now()
    setIsExecuting(true)
    setExecutionError(null)
    setIsEditorVisible(false)

    executeMutation.mutate(qd, {
      onSettled: (data, error) => {
        setIsExecuting(false)
        const duration = Math.round(performance.now() - startTime)
        if (data) {
          setQueryResult(data, duration)
        } else if (error) {
          setExecutionError(String(error))
        }
      },
    })
  }, [getCompiledQueryDefinition, executeMutation, setIsExecuting, setExecutionError, setQueryResult, setIsEditorVisible])

  // Keyboard shortcut (Cmd+Enter or Ctrl+Enter)
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

  const activeDataSource = dataSources.find((d) => d.id === dataSourceId)
  const currentSql = getCompiledSql()
  const compiledDef = getCompiledQueryDefinition()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white text-slate-800 font-sans overflow-hidden">
      {/* Metabase Authentic Top Header Bar */}
      <header className="h-14 px-6 md:px-8 border-b border-slate-200/90 flex items-center justify-between shrink-0 bg-white">
        {/* Left: Heading */}
        <div className="flex items-center gap-2">
          <h1 className="text-slate-900 font-bold text-base tracking-tight">
            New Question
          </h1>
        </div>

        {/* Right: Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* When Visualization is shown (editor is hidden) */}
          {!isEditorVisible ? (
            /* Show SQL Editor button */
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorVisible(true)}
              className="text-xs font-semibold h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>SQL Editor</span>
            </Button>
          ) : (
            /* When Query Editor is open: Top Visualize Button */
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting}
              className="h-8 px-3.5 rounded-lg bg-[#509ee3] hover:bg-[#408ecf] active:scale-[0.99] text-white text-xs font-bold shadow-sm shadow-blue-500/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Visualize</span>
                </>
              )}
            </Button>
          )}

          {/* View SQL Button (>_) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSqlModalOpen(true)}
            className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-mono text-sm font-bold"
            title="View generated SQL"
          >
            &gt;_
          </Button>

          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSaveModalOpen(true)}
            disabled={!compiledDef}
            className="text-sm font-bold text-[#509ee3] hover:text-[#3d8ad0] hover:bg-blue-50/60 px-3 h-8 disabled:opacity-50"
          >
            Save
          </Button>
        </div>
      </header>

      {/* Main Workspace Row (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left: Visualization Configuration Sidebar */}
        {!isEditorVisible && isVisSidebarOpen && (
          <VisualizationSidebar
            columns={queryResult?.columns || []}
            config={visConfig}
            onChangeConfig={(newCfg) => setVisConfig(newCfg)}
            onSelectViewMode={(mode) => setViewMode(mode)}
            onClose={() => setIsVisSidebarOpen(false)}
            initialTab={visSidebarTab}
            requiresAggregation={isUnaggregated}
            onOpenEditor={() => setIsEditorVisible(true)}
          />
        )}

        {/* Right / Center: Workspace & Results Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col min-w-0">
          {/* 1. Metabase Notebook Pipeline */}
          {isEditorVisible && (
            <div className="bg-white shadow-2xs shrink-0">
              <MetabaseNotebook
                dataSources={dataSources}
                selectedDataSourceId={dataSourceId}
                onSelectDataSource={setDataSourceId}
                schemas={schemas}
                selectedSchema={schema}
                onSelectSchema={setSchema}
                tables={tables}
                isLoadingTables={isLoadingTables}
                columns={columns}
                isLoadingColumns={isLoadingColumns}
                onVisualize={handleExecute}
              />
            </div>
          )}

          {/* 2. Results & Visualization Canvas (only when viewing visualization) */}
          {!isEditorVisible && (
            <div className="w-full py-6 px-6 md:px-8 flex-1 flex flex-col min-h-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex-1 min-h-[480px] flex flex-col">
                <ResultsViewer
                  data={queryResult}
                  executionTimeMs={executionTimeMs}
                  error={executionError}
                  isLoading={isExecuting}
                  viewMode={viewMode}
                  requiresAggregation={isUnaggregated}
                  onOpenEditor={() => setIsEditorVisible(true)}
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
                    setViewMode('chart')
                    setVisSidebarTab('picker')
                    setIsVisSidebarOpen(true)
                  }}
                  onOpenVisualSettings={() => {
                    setViewMode('chart')
                    if (visConfig.type === 'table' || !visConfig.data.xAxisColumn) {
                      setVisConfig((prev) => {
                        const def = createDefaultVisualizationConfig(queryResult)
                        return {
                          ...def,
                          type: prev.type === 'table' ? 'bar' : prev.type,
                        }
                      })
                    }
                    setVisSidebarTab('settings')
                    setIsVisSidebarOpen(true)
                  }}
                  onSaveQuestion={() => setIsSaveModalOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Generated SQL Modal (>_) */}
      <ViewSqlModal
        open={isSqlModalOpen}
        onOpenChange={setIsSqlModalOpen}
        sql={currentSql}
        dataSourceId={dataSourceId}
        tableName={table}
      />

      {/* 5. Save Question Dialog */}
      <SaveQuestionDialog
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        organizationId={currentOrganization?.id}
        dataSourceName={activeDataSource?.name}
        queryDefinition={compiledDef}
        visualizationType={visConfig.type}
        visualizationSettings={{
          chartData: visConfig.data,
          display: visConfig.display,
          axes: visConfig.axes,
        }}
        sql={currentSql}
      />
    </div>
  )
}
