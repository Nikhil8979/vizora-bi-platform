import React, { useState } from 'react'
import {
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Layers,
  ScatterChart,
  AlignLeft,
  AreaChart as AreaChartIcon,
  ChevronLeft,
  SlidersHorizontal,
  LayoutGrid,
  Plus,
  Trash2,
} from 'lucide-react'
import { QueryColumn, formatColumnHeader } from '../types'
import {
  ChartType,
  VisualizationConfig,
} from '../visualizationTypes'

interface VisualizationSidebarProps {
  columns: QueryColumn[]
  config: VisualizationConfig
  onChangeConfig: (newConfig: VisualizationConfig) => void
  onSelectViewMode: (mode: 'table' | 'chart') => void
  onClose: () => void
  initialTab?: 'picker' | 'settings'
  requiresAggregation?: boolean
  onOpenEditor?: () => void
}

type SettingsTab = 'data' | 'display' | 'axes'

export const VisualizationSidebar: React.FC<VisualizationSidebarProps> = ({
  columns,
  config,
  onChangeConfig,
  onSelectViewMode,
  onClose,
  initialTab = 'picker',
  requiresAggregation = false,
  onOpenEditor,
}) => {
  const [viewState, setViewState] = useState<'picker' | 'settings'>(initialTab)
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('data')

  React.useEffect(() => {
    setViewState(initialTab)
  }, [initialTab])

  const updateConfig = (updater: (prev: VisualizationConfig) => VisualizationConfig) => {
    onChangeConfig(updater(config))
  }

  // Visual choices definition
  const visuals: Array<{
    id: ChartType | 'area' | 'combo' | 'row' | 'scatter'
    label: string
    icon: React.ComponentType<{ className?: string }>
    isSupported: boolean
  }> = [
    { id: 'line', label: 'Line', icon: LineChartIcon, isSupported: true },
    { id: 'area', label: 'Area', icon: AreaChartIcon, isSupported: false },
    { id: 'bar', label: 'Bar', icon: BarChart3, isSupported: true },
    { id: 'combo', label: 'Combo', icon: Layers, isSupported: false },
    { id: 'row', label: 'Row', icon: AlignLeft, isSupported: false },
    { id: 'scatter', label: 'Scatter', icon: ScatterChart, isSupported: false },
    { id: 'pie', label: 'Pie', icon: PieChartIcon, isSupported: true },
    { id: 'table', label: 'Table', icon: TableIcon, isSupported: true },
  ]

  const handleSelectVisual = (type: ChartType) => {
    updateConfig((prev) => ({
      ...prev,
      type,
    }))

    if (type === 'table') {
      onSelectViewMode('table')
    } else {
      onSelectViewMode('chart')
      // Automatically transition to settings so user can immediately customize
      setViewState('settings')
    }
  }

  return (
    <aside className="w-80 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 select-none overflow-hidden z-20 shadow-sm animate-fade-in">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewState === 'settings' ? (
            <button
              onClick={() => setViewState('picker')}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition p-1 -ml-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              title="Back to Visual selection"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Visuals</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-[#509ee3]" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Visualizations
              </span>
            </div>
          )}
        </div>

        {viewState === 'settings' && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#509ee3] border border-blue-100 uppercase tracking-wider">
            {config.type}
          </span>
        )}

        {viewState === 'picker' && config.type !== 'table' && (
          <button
            onClick={() => setViewState('settings')}
            className="flex items-center gap-1 text-xs font-semibold text-[#509ee3] hover:underline cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto">
        {viewState === 'picker' ? (
          /* ============================================================ */
          /* 1. VISUAL SELECTION GRID (Screenshot 1)                       */
          /* ============================================================ */
          <div className="p-6 flex flex-col items-center">
            <div className="grid grid-cols-4 gap-y-6 gap-x-4 w-full place-items-center mb-8">
              {visuals.map((v) => {
                const Icon = v.icon
                const isSelected = config.type === v.id
                const isSupported = v.isSupported

                return (
                  <button
                    key={v.id}
                    disabled={!isSupported}
                    onClick={() => isSupported && handleSelectVisual(v.id as ChartType)}
                    className={`flex flex-col items-center gap-2 group transition cursor-pointer disabled:cursor-not-allowed ${
                      !isSupported ? 'opacity-40' : ''
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#509ee3] text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-100'
                          : isSupported
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 group-hover:scale-105'
                          : 'bg-slate-50 text-slate-400 border border-slate-200/60'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isSelected
                          ? 'text-[#509ee3] font-bold'
                          : isSupported
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {v.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="w-full text-center border-t border-slate-100 pt-4 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-default">
                More charts &gt;
              </span>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. CHART CONFIGURATION TABS (Screenshots 2, 3, 4, 5)          */
          /* ============================================================ */
          <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/40 px-4">
              <button
                onClick={() => setActiveSettingsTab('data')}
                className={`py-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  activeSettingsTab === 'data'
                    ? 'border-[#509ee3] text-[#509ee3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Data
              </button>
              <button
                onClick={() => setActiveSettingsTab('display')}
                className={`py-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  activeSettingsTab === 'display'
                    ? 'border-[#509ee3] text-[#509ee3]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Display
              </button>
              {config.type !== 'pie' && (
                <button
                  onClick={() => setActiveSettingsTab('axes')}
                  className={`py-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                    activeSettingsTab === 'axes'
                      ? 'border-[#509ee3] text-[#509ee3]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Axes
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="p-4 space-y-6">
              {/* TAB 1: DATA CONFIGURATION (Screenshot 2) */}
              {activeSettingsTab === 'data' && (
                <div className="space-y-5">
                  {requiresAggregation && config.type !== 'table' && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                      <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#509ee3]" />
                        <span>Aggregation Needed</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Click on <span className="font-semibold text-slate-800">sql editor</span> in the top right corner. Then pick a metric and a column to group by.
                      </p>
                      {onOpenEditor && (
                        <button
                          onClick={onOpenEditor}
                          className="text-[11px] font-bold text-[#509ee3] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Open SQL Editor &rarr;
                        </button>
                      )}
                    </div>
                  )}

                  {config.type === 'pie' ? (
                    <>
                      {/* Pie Dimension */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Dimension (Slice Labels)
                        </label>
                        <select
                          value={config.data.dimensionColumn || config.data.xAxisColumn}
                          onChange={(e) => {
                            const val = e.target.value
                            updateConfig((prev) => ({
                              ...prev,
                              data: { ...prev.data, dimensionColumn: val, xAxisColumn: val },
                            }))
                          }}
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {formatColumnHeader(c.name)} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pie Metric */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Metric (Slice Values)
                        </label>
                        <select
                          value={config.data.metricColumn || config.data.yAxisColumns[0]}
                          onChange={(e) => {
                            const val = e.target.value
                            updateConfig((prev) => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                metricColumn: val,
                                yAxisColumns: [val],
                              },
                              axes: {
                                ...prev.axes,
                                yLabelText: val,
                              },
                            }))
                          }}
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {formatColumnHeader(c.name)} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* X-AXIS */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">X-axis</label>
                        <select
                          value={config.data.xAxisColumn}
                          onChange={(e) => {
                            const val = e.target.value
                            updateConfig((prev) => ({
                              ...prev,
                              data: { ...prev.data, xAxisColumn: val },
                              axes: { ...prev.axes, xLabelText: val },
                            }))
                          }}
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {formatColumnHeader(c.name)} ({c.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Y-AXIS (SERIES) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Y-axis</label>
                          {columns.length > config.data.yAxisColumns.length && (
                            <button
                              onClick={() => {
                                const remaining = columns.find(
                                  (c) => !config.data.yAxisColumns.includes(c.name)
                                )
                                if (remaining) {
                                  updateConfig((prev) => ({
                                    ...prev,
                                    data: {
                                      ...prev.data,
                                      yAxisColumns: [...prev.data.yAxisColumns, remaining.name],
                                    },
                                  }))
                                }
                              }}
                              className="text-[11px] font-semibold text-[#509ee3] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add series</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {config.data.yAxisColumns.map((yCol, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span
                                style={{
                                  backgroundColor:
                                    config.display.colorPalette[
                                      index % config.display.colorPalette.length
                                    ],
                                }}
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                              />
                              <select
                                value={yCol}
                                onChange={(e) => {
                                  const newVal = e.target.value
                                  const updated = [...config.data.yAxisColumns]
                                  updated[index] = newVal
                                  updateConfig((prev) => ({
                                    ...prev,
                                    data: { ...prev.data, yAxisColumns: updated },
                                  }))
                                }}
                                className="flex-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                              >
                                {columns.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {formatColumnHeader(c.name)} ({c.type})
                                  </option>
                                ))}
                              </select>

                              {config.data.yAxisColumns.length > 1 && (
                                <button
                                  onClick={() => {
                                    const updated = config.data.yAxisColumns.filter(
                                      (_, i) => i !== index
                                    )
                                    updateConfig((prev) => ({
                                      ...prev,
                                      data: { ...prev.data, yAxisColumns: updated },
                                    }))
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                  title="Remove series"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: DISPLAY CONFIGURATION (Screenshot 3) */}
              {activeSettingsTab === 'display' && (
                <div className="space-y-5">
                  {/* Goal Line Toggle */}
                  <div className="space-y-2 pt-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Goal line</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.display.showGoalLine}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            display: { ...prev.display, showGoalLine: !prev.display.showGoalLine },
                          }))
                        }
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          config.display.showGoalLine ? 'bg-[#509ee3]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            config.display.showGoalLine ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {config.display.showGoalLine && (
                      <div className="mt-2 pl-1 animate-fade-in">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Goal value
                        </label>
                        <input
                          type="number"
                          value={config.display.goalValue}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              display: {
                                ...prev.display,
                                goalValue: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Show values on data points */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold text-slate-700">
                      Show values on data points
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.display.showValuesOnPoints}
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          display: {
                            ...prev.display,
                            showValuesOnPoints: !prev.display.showValuesOnPoints,
                          },
                        }))
                      }
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        config.display.showValuesOnPoints ? 'bg-[#509ee3]' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          config.display.showValuesOnPoints ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto formatting (Auto | Compact | Full) */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <label className="text-xs font-bold text-slate-700 block">
                      Number formatting
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      {(['auto', 'compact', 'full'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() =>
                            updateConfig((prev) => ({
                              ...prev,
                              display: { ...prev.display, numberFormatting: fmt },
                            }))
                          }
                          className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                            config.display.numberFormatting === fmt
                              ? 'bg-[#509ee3] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AXES CONFIGURATION (Screenshots 4 & 5) */}
              {activeSettingsTab === 'axes' && config.type !== 'pie' && (
                <div className="space-y-6">
                  {/* Y-Axis Controls */}
                  <div className="space-y-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Y-axis Label</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.axes.showYLabel}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            axes: { ...prev.axes, showYLabel: !prev.axes.showYLabel },
                          }))
                        }
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          config.axes.showYLabel ? 'bg-[#509ee3]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            config.axes.showYLabel ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {config.axes.showYLabel && (
                      <div className="animate-fade-in space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 block">
                          Label
                        </label>
                        <input
                          type="text"
                          value={config.axes.yLabelText}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              axes: { ...prev.axes, yLabelText: e.target.value },
                            }))
                          }
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Scale</label>
                      <select
                        value={config.axes.yScale}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            axes: { ...prev.axes, yScale: e.target.value as 'linear' | 'log' },
                          }))
                        }
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="linear">Linear</option>
                        <option value="log">Logarithmic</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Lines and grid marks</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.axes.showTicks}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            axes: { ...prev.axes, showTicks: !prev.axes.showTicks },
                          }))
                        }
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          config.axes.showTicks ? 'bg-[#509ee3]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            config.axes.showTicks ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* X-Axis Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">X-axis Label</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.axes.showXLabel}
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            axes: { ...prev.axes, showXLabel: !prev.axes.showXLabel },
                          }))
                        }
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          config.axes.showXLabel ? 'bg-[#509ee3]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            config.axes.showXLabel ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {config.axes.showXLabel && (
                      <div className="animate-fade-in space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 block">
                          Label
                        </label>
                        <input
                          type="text"
                          value={config.axes.xLabelText}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              axes: { ...prev.axes, xLabelText: e.target.value },
                            }))
                          }
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer with Done Button (Screenshots 1-5) */}
      <div className="p-4 border-t border-slate-200/80 bg-white">
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-full bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </aside>
  )
}
