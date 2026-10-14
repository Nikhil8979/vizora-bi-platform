import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { QueryResultData } from '../types'
import { VisualizationConfig, METABASE_PALETTE } from '../visualizationTypes'

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
    if (!chartRef.current) return

    // Initialize chart if needed
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'svg',
      })
    }

    const myChart = chartInstance.current
    const palette = config.display.colorPalette && config.display.colorPalette.length > 0
      ? config.display.colorPalette
      : METABASE_PALETTE

    // Prepare Column Index Map
    const colNameToIdx: Record<string, number> = {}
    data.columns.forEach((col, idx) => {
      colNameToIdx[col.name] = idx
    })

    const chartType = config.type

    if (chartType === 'pie') {
      // PIE / DONUT CHART
      const dimCol = config.data.dimensionColumn || config.data.xAxisColumn || data.columns[0]?.name || ''
      const metricCol = config.data.metricColumn || config.data.yAxisColumns[0] || data.columns[1]?.name || ''

      const dimIdx = colNameToIdx[dimCol] ?? 0
      const metricIdx = colNameToIdx[metricCol] ?? (data.columns.length > 1 ? 1 : 0)

      // Aggregate / extract pie data
      const pieDataMap: Record<string, number> = {}
      data.rows.forEach((r) => {
        const key = String(r.values[dimIdx] ?? 'Unknown')
        const rawVal = Number(r.values[metricIdx])
        const numVal = isNaN(rawVal) ? 0 : rawVal
        pieDataMap[key] = (pieDataMap[key] || 0) + numVal
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
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">${params.seriesName || dimCol}</div>
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
      // BAR OR LINE CHART
      const xCol = config.data.xAxisColumn || data.columns[0]?.name || ''
      const yCols = config.data.yAxisColumns.length > 0
        ? config.data.yAxisColumns
        : [data.columns[1]?.name || data.columns[0]?.name || '']

      const xIdx = colNameToIdx[xCol] ?? 0
      const xCategories = data.rows.map((r) => String(r.values[xIdx] ?? ''))

      const series: echarts.SeriesOption[] = yCols.map((yColName, yIdx) => {
        const yColIndex = colNameToIdx[yColName] ?? 1
        const seriesData = data.rows.map((r) => {
          const val = Number(r.values[yColIndex])
          return isNaN(val) ? 0 : val
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
            name: yColName,
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
          name: yColName,
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
        legend: yCols.length > 1 ? {
          top: 8,
          textStyle: { color: '#64748b', fontSize: 11 },
        } : undefined,
        xAxis: {
          type: 'category',
          data: xCategories,
          name: config.axes.showXLabel ? (config.axes.xLabelText || xCol) : undefined,
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
          name: config.axes.showYLabel ? (config.axes.yLabelText || yCols[0]) : undefined,
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

    // Resize observer for responsive layout
    const resizeObserver = new ResizeObserver(() => {
      myChart.resize()
    })
    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [data, config])

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[340px]">
      <div ref={chartRef} className="w-full h-full min-h-[340px]" />
    </div>
  )
}
