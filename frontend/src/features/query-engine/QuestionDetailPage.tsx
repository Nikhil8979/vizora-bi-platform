import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Table as TableIcon,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Terminal,
  Database,
  Calendar,
  AlertCircle,
  Search,
  Code2,
  Copy,
  Check,
  Hash,
  Type,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuestionQuery, useExecuteQuestionQuery } from './hooks'
import { EChartsRenderer } from './components/EChartsRenderer'
import { VisualizationConfig, METABASE_PALETTE, ChartType } from './visualizationTypes'
import { Button } from '@/components/ui/button'

export const QuestionDetailPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>()
  const navigate = useNavigate()
  const { currentOrganization } = useAuthStore()

  // 1. Fetch Question definition
  const {
    data: question,
    isLoading: isLoadingQuestion,
    isError: isErrorQuestion,
    error: questionError,
  } = useQuestionQuery(currentOrganization?.id, questionId)

  // 2. Fetch and Execute Question
  const {
    data: queryResult,
    isLoading: isLoadingExecution,
    isError: isErrorExecution,
    error: executionError,
    refetch: refetchExecution,
    isRefetching: isRefetchingExecution,
  } = useExecuteQuestionQuery(currentOrganization?.id, questionId)

  // 3. View Mode State
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart')
  const [searchTable, setSearchTable] = useState('')
  const [showSqlDrawer, setShowSqlDrawer] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Extract the saved chart type from the question
  const savedChartType: ChartType = useMemo(() => {
    const rawType = question?.visualization?.type as string | undefined
    const settingsType = (question?.visualization?.settings as any)?.type as string | undefined
    if (rawType && ['bar', 'line', 'pie'].includes(rawType)) {
      return rawType as ChartType
    }
    if (settingsType && ['bar', 'line', 'pie'].includes(settingsType)) {
      return settingsType as ChartType
    }
    return 'bar'
  }, [question?.visualization])

  // Synchronize initial viewMode when question loads
  React.useEffect(() => {
    if (question?.visualization?.type) {
      setViewMode(question.visualization.type === 'table' ? 'table' : 'chart')
    }
  }, [question?.visualization?.type])

  // Build VisualizationConfig using the exact chart type and configuration saved in the question
  const visConfig: VisualizationConfig = useMemo(() => {
    const rawSettings = question?.visualization?.settings || {}
    const colNames = queryResult?.columns.map((c) => c.name) || []

    const savedX = rawSettings?.data?.xAxisColumn || rawSettings?.xAxisColumn || colNames[0] || ''
    const savedY = rawSettings?.data?.yAxisColumns || rawSettings?.yAxisColumns || (colNames[1] ? [colNames[1]] : [colNames[0] || ''])
    const savedDim = rawSettings?.data?.dimensionColumn || rawSettings?.dimensionColumn || savedX
    const savedMetric = rawSettings?.data?.metricColumn || rawSettings?.metricColumn || (Array.isArray(savedY) ? savedY[0] : savedY) || ''

    return {
      type: savedChartType,
      data: {
        xAxisColumn: savedX,
        yAxisColumns: Array.isArray(savedY) ? savedY : [savedY],
        dimensionColumn: savedDim,
        metricColumn: savedMetric,
      },
      display: {
        showGoalLine: Boolean(rawSettings?.display?.showGoalLine),
        goalValue: Number(rawSettings?.display?.goalValue || 0),
        showValuesOnPoints: Boolean(rawSettings?.display?.showValuesOnPoints),
        numberFormatting: rawSettings?.display?.numberFormatting || 'auto',
        colorPalette:
          rawSettings?.display?.colorPalette && rawSettings.display.colorPalette.length > 0
            ? rawSettings.display.colorPalette
            : METABASE_PALETTE,
      },
      axes: {
        showXLabel: rawSettings?.axes?.showXLabel ?? true,
        xLabelText: rawSettings?.axes?.xLabelText ?? savedX,
        showYLabel: rawSettings?.axes?.showYLabel ?? true,
        yLabelText: rawSettings?.axes?.yLabelText ?? savedMetric,
        autoYRange: rawSettings?.axes?.autoYRange ?? true,
        yScale: rawSettings?.axes?.yScale || 'linear',
        showTicks: rawSettings?.axes?.showTicks ?? true,
      },
    }
  }, [question, queryResult, savedChartType])

  // Extract saved SQL if available
  const savedSql = (question?.visualization?.settings as any)?.sql || ''

  // Filtered rows for Table View
  const filteredRows = useMemo(() => {
    if (!queryResult?.rows) return []
    if (!searchTable.trim()) return queryResult.rows
    const q = searchTable.toLowerCase()
    return queryResult.rows.filter((row) =>
      row.values.some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  }, [queryResult?.rows, searchTable])

  // Export CSV
  const handleExportCsv = () => {
    if (!queryResult || queryResult.columns.length === 0) return
    const headers = queryResult.columns.map((c) => `"${c.name}"`).join(',')
    const rowsText = queryResult.rows
      .map((r) =>
        r.values
          .map((v) => {
            if (v === null || v === undefined) return '""'
            const str = String(v).replace(/"/g, '""')
            return `"${str}"`
          })
          .join(',')
      )
      .join('\n')

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + '\n' + rowsText)
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `${question?.title || 'question'}_results.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy SQL
  const handleCopySql = () => {
    if (!savedSql) return
    navigator.clipboard.writeText(savedSql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 1500)
  }

  const getDataTypeIcon = (dt?: string) => {
    const t = (dt || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('float') || t.includes('double') || t.includes('decimal')) {
      return <Hash className="w-3 h-3 text-emerald-500 shrink-0" />
    }
    if (t.includes('date') || t.includes('time')) {
      return <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
    }
    return <Type className="w-3 h-3 text-[#509ee3] shrink-0" />
  }

  const getVisualIcon = (type = savedChartType) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />
      case 'line':
        return <LineChartIcon className="w-4 h-4" />
      case 'pie':
        return <PieChartIcon className="w-4 h-4" />
      default:
        return <BarChart3 className="w-4 h-4" />
    }
  }

  if (isLoadingQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50">
        <div className="p-8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#509ee3]" />
          <p className="text-sm font-semibold text-slate-700">Loading Question...</p>
        </div>
      </div>
    )
  }

  if (isErrorQuestion || !question) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50 p-6">
        <div className="max-w-md p-6 bg-white rounded-2xl border border-red-200 shadow-sm text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Failed to Load Question</h2>
          <p className="text-xs text-slate-500 font-mono">
            {(questionError as Error)?.message || 'Question could not be found or access is denied.'}
          </p>
          <Button
            onClick={() => navigate('/workbench')}
            variant="outline"
            size="sm"
            className="mt-2 border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to SQL Workbench
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
      {/* 1. Top Navigation Bar */}
      <header className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/workbench')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-2xs shrink-0"
            title="Back to SQL Workbench"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                {question.title}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e0effb] text-[#509ee3] border border-[#badcf7] capitalize shrink-0">
                {getVisualIcon(savedChartType)}
                {savedChartType}
              </span>
            </div>
            {question.description && (
              <p className="text-xs text-slate-500 truncate max-w-xl">{question.description}</p>
            )}
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetchExecution()}
            disabled={isRefetchingExecution}
            className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
            title="Refresh question data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefetchingExecution ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              navigate(
                `/workbench?datasourceId=${question.data_source_id}&table=${question.query_definition.table.name}`
              )
            }}
            className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Open query in SQL Workbench"
          >
            <Terminal className="w-3.5 h-3.5 text-[#509ee3]" />
            <span className="hidden sm:inline">Open in SQL Editor</span>
          </button>

          {/* Segmented View Mode Toggle: Table and Saved Chart */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-[#509ee3] text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visual view"
            >
              {getVisualIcon(savedChartType)}
              <span className="hidden md:inline">Visual</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Question Visualization / Results Area */}
      <main className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {isLoadingExecution ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
              <div className="w-12 h-12 rounded-2xl bg-[#e0effb] flex items-center justify-center text-[#509ee3] mb-3 shadow-sm animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Running Question Query...</h3>
              <p className="text-xs text-slate-400">Fetching live results from connected warehouse.</p>
            </div>
          ) : isErrorExecution ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-50/20">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-sm">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-red-900 mb-1">Execution Failed</h3>
              <p className="text-xs text-red-600 max-w-md font-mono bg-white p-3 rounded-xl border border-red-200 mt-2 text-left">
                {(executionError as Error)?.message || 'Failed to execute saved query.'}
              </p>
              <Button
                onClick={() => refetchExecution()}
                size="sm"
                variant="outline"
                className="mt-3 border-slate-200"
              >
                Retry
              </Button>
            </div>
          ) : !queryResult || queryResult.columns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Data Returned</h3>
              <p className="text-xs text-slate-400 max-w-sm">The query executed with 0 rows returned.</p>
            </div>
          ) : viewMode === 'chart' ? (
            /* ECharts Visualization */
            <div className="flex-1 min-h-0 w-full h-full p-4 bg-white relative flex flex-col">
              <EChartsRenderer data={queryResult} config={visConfig} />
            </div>
          ) : (
            /* Interactive Data Table */
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Table search & CSV export */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                <div className="relative w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search in results..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#509ee3]/20"
                  />
                </div>

                <button
                  onClick={handleExportCsv}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export results as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Table Grid */}
              <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 select-none">
                    <tr>
                      <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-slate-400 w-12 text-center border-r border-slate-200/80 bg-slate-50">
                        #
                      </th>
                      {queryResult.columns.map((col) => (
                        <th
                          key={col.name}
                          className="py-2.5 px-4 font-bold text-slate-700 border-r border-slate-200/80 last:border-r-0"
                        >
                          <div className="flex items-center gap-1.5">
                            {getDataTypeIcon(col.type)}
                            <span>{col.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50/70 transition">
                        <td className="py-2 px-3 text-[10px] text-slate-400 text-center border-r border-slate-100 bg-slate-50/40">
                          {rowIdx + 1}
                        </td>
                        {row.values.map((val, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="py-2 px-4 truncate max-w-[280px] border-r border-slate-100 last:border-r-0"
                          >
                            {val === null || val === undefined ? (
                              <span className="text-slate-300 italic">null</span>
                            ) : typeof val === 'boolean' ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  val ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {val ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Bottom Metabase Bar */}
          <footer className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-sans select-none shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono text-[11px]">
                <Database className="w-3.5 h-3.5 text-[#509ee3]" />
                {question.query_definition.table.schema
                  ? `${question.query_definition.table.schema}.`
                  : ''}
                {question.query_definition.table.name}
              </span>

              {savedSql && (
                <button
                  onClick={() => setShowSqlDrawer(!showSqlDrawer)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#509ee3]" />
                  <span>{showSqlDrawer ? 'Hide SQL' : 'View SQL'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
              {queryResult && (
                <span>
                  <strong>{queryResult.row_count}</strong> {queryResult.row_count === 1 ? 'row' : 'rows'}
                </span>
              )}
            </div>
          </footer>
        </div>

        {/* 4. Collapsible SQL Drawer */}
        {showSqlDrawer && savedSql && (
          <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs shadow-md border border-slate-800 animate-fade-in shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#509ee3]" /> SQL Query
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-slate-200 text-xs leading-relaxed max-h-36">
              {savedSql}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}
