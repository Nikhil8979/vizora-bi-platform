import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { QueryResultData, formatColumnHeader } from '../types'
import { VisualizationConfig, METABASE_PALETTE } from '../visualizationTypes'
import { BarChart3 } from 'lucide-react'

interface EChartsRendererProps {
  data: QueryResultData
  config: VisualizationConfig
}

export const EChartsRenderer: React.FC<EChartsRendererProps> = ({ data, config }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Number formatting helper
  const formatNumber = (val: number | null | undefined, mode: 'auto' | 'compact' | 'full'): string => {
    if (val === null || val === undefined || isNaN(val)) return '-'
    if (mode === 'compact') {
      if (Math.abs(val) >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
      if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
      if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
      return val.toLocaleString()
    }
    if (mode === 'full') {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return val.toLocaleString()
  }

  useEffect(() => {
    if (!chartRef.current || !data.columns || data.columns.length === 0) return

    // Initialize or reuse existing echarts instance on the DOM element
    let myChart = echarts.getInstanceByDom(chartRef.current)
    if (!myChart) {
      myChart = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      })
    }
    chartInstance.current = myChart

    const palette =
      config.display.colorPalette && config.display.colorPalette.length > 0
        ? config.display.colorPalette
        : METABASE_PALETTE

    // Prepare Column Index Map
    const colNameToIdx: Record<string, number> = {}
    data.columns.forEach((col, idx) => {
      colNameToIdx[col.name] = idx
    })

    // Helper: is column numeric
    const isColNumeric = (colIndex: number): boolean => {
      if (colIndex < 0 || colIndex >= data.columns.length) return false
      const col = data.columns[colIndex]
      const typeStr = (col.type || '').toLowerCase()
      if (['int', 'float', 'num', 'double', 'decimal', 'real', 'bigint'].some((t) => typeStr.includes(t))) {
        return true
      }
      for (let i = 0; i < Math.min(data.rows.length, 10); i++) {
        const val = data.rows[i]?.values?.[colIndex]
        if (typeof val === 'number') return true
        if (val !== null && val !== undefined && val !== '' && !isNaN(Number(val)) && typeof val !== 'boolean') {
          return true
        }
      }
      return false
    }

    // Default chart type if set to table
    const rawType = config.type || 'bar'
    const chartType = rawType === 'table' ? 'bar' : rawType

    if (chartType === 'pie') {
      // ========================================================
      // PIE / DONUT CHART
      // ========================================================
      let dimCol = config.data.dimensionColumn || config.data.xAxisColumn
      if (!dimCol || !(dimCol in colNameToIdx)) {
        // Find first non-numeric column
        const nonNumCol = data.columns.find((_, idx) => !isColNumeric(idx))
        dimCol = nonNumCol ? nonNumCol.name : data.columns[0]?.name || ''
      }

      let metricCol = config.data.metricColumn || config.data.yAxisColumns[0]
      if (!metricCol || !(metricCol in colNameToIdx)) {
        // Find first numeric column
        const numCol = data.columns.find((_, idx) => isColNumeric(idx))
        metricCol = numCol ? numCol.name : (data.columns.length > 1 ? data.columns[1].name : data.columns[0]?.name || '')
      }

      const dimIdx = colNameToIdx[dimCol] ?? 0
      const metricIdx = colNameToIdx[metricCol] ?? (data.columns.length > 1 ? 1 : 0)
      const metricIsNumeric = isColNumeric(metricIdx)

      // Aggregate / extract pie data
      const pieDataMap: Record<string, number> = {}
      data.rows.forEach((r) => {
        const key = String(r.values[dimIdx] ?? 'Unknown')
        if (metricIsNumeric) {
          const rawVal = Number(r.values[metricIdx])
          const numVal = isNaN(rawVal) ? 0 : rawVal
          pieDataMap[key] = (pieDataMap[key] || 0) + numVal
        } else {
          // If metric column is categorical, count occurrences
          pieDataMap[key] = (pieDataMap[key] || 0) + 1
        }
      })

      const pieData = Object.entries(pieDataMap).map(([name, value]) => ({
        name,
        value,
      }))

      const option: echarts.EChartsOption = {
        color: palette,
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            const formattedVal = formatNumber(params.value, config.display.numberFormatting)
            return `
              <div style="font-family: inherit; padding: 2px;">
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">${dimCol}</div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${params.color};"></span>
                    <span style="font-weight: 600;">${params.name}</span>
                  </span>
                  <span style="font-weight: 700;">${formattedVal} (${params.percent}%)</span>
                </div>
              </div>
            `
          },
        },
        legend: {
          orient: 'horizontal',
          bottom: 12,
          type: 'scroll',
          textStyle: { color: '#64748b', fontSize: 11 },
          pageIconColor: '#509ee3',
          pageTextStyle: { color: '#64748b' },
        },
        series: [
          {
            name: metricCol,
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['50%', '46%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#ffffff',
              borderWidth: 2,
            },
            label: {
              show: config.display.showValuesOnPoints,
              formatter: '{b}: {d}%',
              fontSize: 11,
              color: '#475569',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold',
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.15)',
              },
            },
            data: pieData,
          },
        ],
      }

      myChart.setOption(option, true)
    } else {
      // ========================================================
      // BAR OR LINE CHART
      // ========================================================
      let xCol = config.data.xAxisColumn
      if (!xCol || !(xCol in colNameToIdx)) {
        // Prefer categorical column for X
        const nonNumCol = data.columns.find((_, idx) => !isColNumeric(idx))
        xCol = nonNumCol ? nonNumCol.name : data.columns[0]?.name || ''
      }

      let yCols = (config.data.yAxisColumns || []).filter((c) => c in colNameToIdx)
      if (yCols.length === 0) {
        // Find first numeric column that is distinct from xCol
        const numCol = data.columns.find((c, idx) => c.name !== xCol && isColNumeric(idx))
        if (numCol) {
          yCols = [numCol.name]
        } else {
          // If no numeric column, pick second column or first
          const otherCol = data.columns.find((c) => c.name !== xCol)
          yCols = [otherCol ? otherCol.name : data.columns[0]?.name || '']
        }
      }

      const xIdx = colNameToIdx[xCol] ?? 0
      const xCategories = data.rows.map((r) => String(r.values[xIdx] ?? ''))

      const series: echarts.SeriesOption[] = yCols.map((yColName, yIdx) => {
        const yColIndex = colNameToIdx[yColName] ?? 1
        const yIsNumeric = isColNumeric(yColIndex)

        const seriesData = data.rows.map((r) => {
          if (yIsNumeric) {
            const raw = Number(r.values[yColIndex])
            return isNaN(raw) ? 0 : raw
          }
          // Fallback if categorical column was mapped to Y
          return 1
        })

        const markLineOption = config.display.showGoalLine
          ? {
              symbol: 'none',
              data: [
                {
                  yAxis: config.display.goalValue,
                  name: 'Goal',
                  lineStyle: {
                    type: 'dashed' as const,
                    color: '#ef4444',
                    width: 2,
                  },
                  label: {
                    show: true,
                    position: 'insideEndTop' as const,
                    formatter: `Goal: ${formatNumber(config.display.goalValue, config.display.numberFormatting)}`,
                    color: '#ef4444',
                    fontSize: 11,
                  },
                },
              ],
            }
          : undefined

        if (chartType === 'line') {
          return {
            name: formatColumnHeader(yColName),
            type: 'line',
            smooth: 0.25,
            showSymbol: true,
            symbolSize: 6,
            lineStyle: {
              width: 3,
            },
            areaStyle: {
              opacity: 0.12,
            },
            label: {
              show: config.display.showValuesOnPoints,
              position: 'top',
              fontSize: 10,
              color: '#64748b',
              formatter: (p: any) => formatNumber(p.value, config.display.numberFormatting),
            },
            markLine: yIdx === 0 ? markLineOption : undefined,
            data: seriesData,
          }
        }

        // Default: Bar Chart
        return {
          name: formatColumnHeader(yColName),
          type: 'bar',
          barMaxWidth: 44,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: config.display.showValuesOnPoints,
            position: 'top',
            fontSize: 10,
            color: '#64748b',
            formatter: (p: any) => formatNumber(p.value, config.display.numberFormatting),
          },
          markLine: yIdx === 0 ? markLineOption : undefined,
          data: seriesData,
        }
      })

      const option: echarts.EChartsOption = {
        color: palette,
        grid: {
          top: yCols.length > 1 ? 48 : 36,
          right: 36,
          bottom: config.axes.showXLabel ? 64 : 44,
          left: config.axes.showYLabel ? 68 : 52,
          containLabel: true,
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: chartType === 'bar' ? 'shadow' : 'line',
            shadowStyle: { color: 'rgba(80, 158, 227, 0.08)' },
          },
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params: any) => {
            if (!Array.isArray(params)) return ''
            const header = params[0]?.axisValueLabel || ''
            let rowsHtml = ''
            params.forEach((p: any) => {
              const formattedVal = formatNumber(p.value, config.display.numberFormatting)
              rowsHtml += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 4px;">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${p.color};"></span>
                    <span style="color: #cbd5e1;">${p.seriesName}</span>
                  </span>
                  <span style="font-weight: 700; color: #ffffff;">${formattedVal}</span>
                </div>
              `
            })
            return `
              <div style="font-family: inherit; padding: 2px;">
                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; border-bottom: 1px solid #334155; padding-bottom: 4px;">
                  ${header}
                </div>
                ${rowsHtml}
              </div>
            `
          },
        },
        legend:
          yCols.length > 1
            ? {
                top: 8,
                textStyle: { color: '#64748b', fontSize: 11 },
              }
            : undefined,
        xAxis: {
          type: 'category',
          data: xCategories,
          name: config.axes.showXLabel ? config.axes.xLabelText || xCol : undefined,
          nameLocation: 'middle',
          nameGap: 36,
          nameTextStyle: {
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
          },
          axisLine: {
            lineStyle: { color: '#cbd5e1' },
          },
          axisTick: {
            show: config.axes.showTicks,
            lineStyle: { color: '#cbd5e1' },
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            interval: 'auto',
            rotate: xCategories.length > 12 ? 30 : 0,
            formatter: (val: string) => {
              if (val.length > 14) return val.slice(0, 12) + '...'
              return val
            },
          },
        },
        yAxis: {
          type: config.axes.yScale === 'log' ? 'log' : 'value',
          name: config.axes.showYLabel ? config.axes.yLabelText || yCols[0] : undefined,
          nameLocation: 'middle',
          nameGap: 48,
          nameTextStyle: {
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
          },
          axisLine: { show: false },
          axisTick: { show: config.axes.showTicks },
          splitLine: {
            show: config.axes.showTicks,
            lineStyle: { color: '#f1f5f9' },
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (val: number) => formatNumber(val, config.display.numberFormatting),
          },
        },
        series,
      }

      myChart.setOption(option, true)
    }

    // Force resize on next frame and short timeout to guarantee correct layout computation
    requestAnimationFrame(() => {
      myChart.resize()
    })
    const resizeTimeout = setTimeout(() => {
      myChart.resize()
    }, 60)

    // Resize observer for responsive layout
    const resizeObserver = new ResizeObserver(() => {
      myChart.resize()
    })
    resizeObserver.observe(chartRef.current)

    const handleWindowResize = () => {
      myChart.resize()
    }
    window.addEventListener('resize', handleWindowResize)

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [data, config])

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs font-medium">No data columns available to visualize</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[380px] flex-1 flex flex-col items-center justify-center relative">
      <div
        ref={chartRef}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
        className="w-full h-full min-h-[380px] flex-1"
      />
    </div>
  )
}

