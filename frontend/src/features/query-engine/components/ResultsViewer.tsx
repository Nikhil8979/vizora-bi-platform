import React, { useState, useMemo } from 'react'
import {
  Table as TableIcon,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Copy,
  Check,
  Search,
  Hash,
  Type,
  Calendar,
  AlertCircle,
  Clock,
  Settings,
  ArrowUpDown,
  FileSpreadsheet,
  Bookmark,
  SlidersHorizontal,
} from 'lucide-react'
import { QueryResultData, formatColumnHeader } from '../types'
import { VisualizationConfig } from '../visualizationTypes'
import { EChartsRenderer } from './EChartsRenderer'

interface ResultsViewerProps {
  data: QueryResultData | null
  executionTimeMs?: number | null
  error?: string | null
  isLoading: boolean
  viewMode: 'table' | 'chart'
  onViewModeChange: (mode: 'table' | 'chart') => void
  visConfig: VisualizationConfig
  onOpenVisualPicker: () => void
  onOpenVisualSettings: () => void
  onExportCsv?: () => void
  onSaveQuestion?: () => void
  requiresAggregation?: boolean
  onOpenEditor?: () => void
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  data,
  executionTimeMs,
  error,
  isLoading,
  viewMode,
  onViewModeChange,
  visConfig,
  onOpenVisualPicker,
  onOpenVisualSettings,
  onExportCsv,
  onSaveQuestion,
  requiresAggregation = false,
  onOpenEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortAsc, setSortAsc] = useState<boolean>(true)

  // Filter and sort rows for Table View
  const displayRows = useMemo(() => {
    if (!data) return []
    let rows = [...data.rows]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      rows = rows.filter((r) =>
        r.values.some((v) => String(v ?? '').toLowerCase().includes(q))
      )
    }

    // Column sort
    if (sortCol !== null) {
      rows.sort((a, b) => {
        const valA = a.values[sortCol]
        const valB = b.values[sortCol]
        if (valA === valB) return 0
        if (valA === null || valA === undefined) return 1
        if (valB === null || valB === undefined) return -1
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA))
      })
    }

    return rows
  }, [data, searchQuery, sortCol, sortAsc])

  const copyToClipboard = (val: any, cellKey: string) => {
    navigator.clipboard.writeText(String(val ?? ''))
    setCopiedCell(cellKey)
    setTimeout(() => setCopiedCell(null), 1500)
  }

  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv()
      return
    }
    if (!data || data.rows.length === 0) return

    const headers = data.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',')
    const rows = data.rows.map((r) =>
      r.values
        .map((v) => {
          if (v === null || v === undefined) return '""'
          const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(',')
    )
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `vizora_query_results_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getColIcon = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('float') || t.includes('double') || t.includes('decimal')) {
      return <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
    }
    if (t.includes('date') || t.includes('time')) {
      return <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    }
    return <Type className="w-3.5 h-3.5 text-[#509ee3] shrink-0" />
  }

  // Visual type icon helper
  const getVisualIcon = () => {
    switch (visConfig.type) {
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

  // Empty or Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-slate-50/40">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#509ee3] mb-4 shadow-sm animate-pulse">
          <Clock className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Executing Query...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Compiling query definition and executing across your connected database engine.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-red-50/20">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-red-900 mb-1">Execution Failed</h3>
        <p className="text-xs text-red-600 max-w-md font-mono bg-white p-3 rounded-xl border border-red-200 mt-2 text-left">
          {error}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-slate-50/30">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">No Results Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Run your SQL query above using <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600">⌘ + Enter</kbd> to inspect data rows and visualize charts.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Filter Bar (only when in Table view) */}
      {viewMode === 'table' && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter results in table..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
              title="Download results as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Table View OR Chart View */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewMode === 'table' ? (
          /* ======================================================== */
          /* TABLE VIEW                                               */
          /* ======================================================== */
          <div className="h-full overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 z-10 shadow-2xs">
                <tr>
                  <th className="w-12 py-2.5 px-3 text-center text-[11px] font-bold text-slate-400 border-r border-slate-200/60 bg-slate-100/50">
                    #
                  </th>
                  {data.columns.map((col, idx) => (
                    <th
                      key={col.name}
                      onClick={() => {
                        if (sortCol === idx) {
                          if (sortAsc) setSortAsc(false)
                          else setSortCol(null)
                        } else {
                          setSortCol(idx)
                          setSortAsc(true)
                        }
                      }}
                      className="py-2.5 px-4 font-bold text-slate-700 select-none cursor-pointer hover:bg-slate-100/80 transition border-r border-slate-200/60 last:border-r-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          {getColIcon(col.type)}
                          <span className="truncate">{formatColumnHeader(col.name)}</span>
                        </div>
                        {sortCol === idx ? (
                          <span className="text-[10px] text-[#509ee3] font-bold">
                            {sortAsc ? '▲' : '▼'}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {displayRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-blue-50/30 transition">
                    <td className="py-2 px-3 text-center text-[10px] text-slate-400 bg-slate-50/30 border-r border-slate-200/60 select-none">
                      {rowIdx + 1}
                    </td>
                    {row.values.map((val, cellIdx) => {
                      const cellKey = `${rowIdx}-${cellIdx}`
                      const isCopied = copiedCell === cellKey
                      const strVal =
                        val === null || val === undefined
                          ? 'NULL'
                          : typeof val === 'object'
                          ? JSON.stringify(val)
                          : String(val)
                      const isNull = val === null || val === undefined

                      return (
                        <td
                          key={cellIdx}
                          onClick={() => copyToClipboard(val, cellKey)}
                          className={`py-2 px-4 truncate max-w-[280px] border-r border-slate-100 last:border-r-0 cursor-pointer group hover:bg-blue-50/50 ${
                            isNull ? 'text-slate-400 italic' : ''
                          }`}
                          title="Click to copy value"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{strVal}</span>
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0 transition" />
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ======================================================== */
          /* CHART VIEW (APACHE ECHARTS)                              */
          /* ======================================================== */
          <div className="h-full w-full p-4 flex flex-col flex-1 min-h-0 relative">
            {requiresAggregation ? (
              <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-slate-50/40">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#509ee3] mb-4 shadow-sm">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">
                  Pick a metric and a group by column
                </h3>
                <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                  Click on <span className="font-semibold text-slate-800">sql editor</span> in the top right corner. Then pick a metric and a column to group by.
                </p>
                {onOpenEditor && (
                  <button
                    onClick={onOpenEditor}
                    className="mt-5 px-4 py-2 rounded-lg bg-[#509ee3] hover:bg-[#408ecf] active:scale-[0.99] text-white text-xs font-bold shadow-sm shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    <span>Open SQL Editor</span>
                  </button>
                )}
              </div>
            ) : (
              <EChartsRenderer data={data} config={visConfig} />
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* METABASE BOTTOM FOOTER BAR (Screenshots 1 - 5)               */}
      {/* ============================================================ */}
      <div className="h-14 px-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs select-none shrink-0 shadow-2xs">
        {/* Left: Visualization & Gear Settings Button */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              onClick={onOpenVisualPicker}
              className="px-3.5 py-1.5 rounded-l-lg bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open visualization picker"
            >
              <span>Visualization</span>
            </button>
            <button
              onClick={onOpenVisualSettings}
              className="px-2 py-1.5 rounded-r-lg bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] border-l border-blue-400 text-white transition flex items-center justify-center cursor-pointer shadow-xs"
              title="Configure chart settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {onSaveQuestion && (
            <button
              onClick={onSaveQuestion}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
              title="Save this question"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#509ee3]" />
              <span>Save</span>
            </button>
          )}
        </div>

        {/* Center: Table View / Chart View Segmented Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Table view"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('chart')}
            className={`p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-[#509ee3] text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Switch to Chart view"
          >
            {getVisualIcon()}
          </button>
        </div>

        {/* Right: Row Count, Timing & Quick Info */}
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>
            Showing first <span className="font-bold text-slate-800">{data.row_count.toLocaleString()}</span> rows
          </span>
          {executionTimeMs !== undefined && executionTimeMs !== null && (
            <span className="flex items-center gap-1 font-sans">
              <span className="text-amber-500">⚡</span>
              <span>{executionTimeMs}ms</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
