import React, { useState } from 'react'
import {
  ChevronDown,
  Plus,
  X,
  Check,
  Hash,
  Type,
  Calendar,
  ArrowUpDown,
} from 'lucide-react'
import { FieldResponse } from '@/types/datasource'
import { AggregationFunction } from '@/features/query-engine/types'
import { AdhocMetric, useQueryBuilderStore } from '../store/queryBuilderStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface SummarizeStageProps {
  columns: FieldResponse[]
}

const AGGREGATION_OPTIONS: { label: string; value: AggregationFunction; needsColumn: boolean }[] = [
  { label: 'Count of rows', value: 'COUNT', needsColumn: false },
  { label: 'Sum of ...', value: 'SUM', needsColumn: true },
  { label: 'Average of ...', value: 'AVG', needsColumn: true },
  { label: 'Number of distinct values of ...', value: 'COUNT_DISTINCT', needsColumn: true },
  { label: 'Minimum of ...', value: 'MIN', needsColumn: true },
  { label: 'Maximum of ...', value: 'MAX', needsColumn: true },
]

export const SummarizeStage: React.FC<SummarizeStageProps> = ({ columns }) => {
  const {
    metrics,
    setPrimaryMetric,
    addMetric,
    removeMetric,
    dimensions,
    addDimension,
    removeDimension,
    sort,
    setSort,
  } = useQueryBuilderStore()

  const [isSortOpen, setIsSortOpen] = useState(false)

  const primaryMetric = metrics[0]

  const handleSelectMetric = (agg: AggregationFunction, colName?: string) => {
    const col = colName || (agg === 'COUNT' ? '*' : columns[0]?.name || '')
    setPrimaryMetric({ aggregation: agg, column: col })
  }

  const getMetricDisplayLabel = (m: AdhocMetric) => {
    switch (m.aggregation) {
      case 'COUNT':
        return 'Count of rows'
      case 'SUM':
        return `Sum of ${m.column}`
      case 'AVG':
        return `Average of ${m.column}`
      case 'COUNT_DISTINCT':
        return `Distinct values of ${m.column}`
      case 'MIN':
        return `Min of ${m.column}`
      case 'MAX':
        return `Max of ${m.column}`
      default:
        return `${m.aggregation} (${m.column})`
    }
  }

  const getColIcon = (dt?: string | null) => {
    const t = (dt || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('float') || t.includes('double') || t.includes('decimal')) {
      return <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    }
    if (t.includes('date') || t.includes('time')) {
      return <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    }
    return <Type className="w-3.5 h-3.5 text-[#509ee3] shrink-0" />
  }

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold text-[#2c8d50] uppercase tracking-wider block">
        Summarize
      </label>

      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Metric / Function Pill powered by shadcn DropdownMenu */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 px-5 rounded-lg bg-[#edf8f1] hover:bg-[#e4f5ea] text-[#2c8d50] text-sm font-medium border border-transparent hover:border-[#c8ebd4] inline-flex items-center gap-2 shadow-2xs"
              >
                <span>{primaryMetric ? getMetricDisplayLabel(primaryMetric) : 'Pick a metric'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#2c8d50]/70 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-white border-slate-200 shadow-xl rounded-xl p-1.5 z-50">
              <DropdownMenuLabel className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pick a function
              </DropdownMenuLabel>
              
              {/* Count of rows */}
              <DropdownMenuItem
                onClick={() => handleSelectMetric('COUNT', '*')}
                className={`cursor-pointer text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between ${
                  primaryMetric?.aggregation === 'COUNT' ? 'bg-emerald-50 text-[#2c8d50]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Count of rows</span>
                {primaryMetric?.aggregation === 'COUNT' && <Check className="w-3.5 h-3.5 text-[#2c8d50]" />}
              </DropdownMenuItem>

              {/* Aggregations with column submenu */}
              {AGGREGATION_OPTIONS.filter((opt) => opt.needsColumn).map((opt) => (
                <DropdownMenuSub key={opt.value}>
                  <DropdownMenuSubTrigger className="cursor-pointer text-xs font-semibold py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-50">
                    <span>{opt.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60 max-h-64 overflow-y-auto bg-white border-slate-200 shadow-xl rounded-xl p-1 z-50">
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                      Select column:
                    </DropdownMenuLabel>
                    {columns.map((c) => {
                      const isSelected = primaryMetric?.aggregation === opt.value && primaryMetric?.column === c.name
                      return (
                        <DropdownMenuItem
                          key={c.name}
                          onClick={() => handleSelectMetric(opt.value, c.name)}
                          className={`cursor-pointer text-xs py-1.5 px-2 rounded-lg flex items-center justify-between ${
                            isSelected ? 'bg-emerald-50 text-[#2c8d50] font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {getColIcon(c.data_type)}
                            <span className="truncate">{c.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#2c8d50] shrink-0" />}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryMetric && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeMetric(primaryMetric.id)}
              className="p-1 h-7 w-7 hover:text-rose-600 rounded-lg text-slate-400 hover:bg-slate-100"
              title="Remove metric"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* 2. "by" Connector Label */}
        <span className="text-sm font-medium text-slate-400 select-none">by</span>

        {/* 3. Group By (Dimensions) Pill powered by shadcn DropdownMenu */}
        <div className="flex flex-wrap items-center gap-2">
          {dimensions.map((dim) => (
            <div
              key={dim.id}
              className="h-11 px-4 rounded-lg bg-[#edf8f1] border border-[#c8ebd4] text-sm font-medium text-[#2c8d50] inline-flex items-center gap-2 shadow-2xs"
            >
              <span>{dim.column}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDimension(dim.column)}
                className="p-0.5 h-5 w-5 hover:text-rose-600 rounded text-slate-400"
                title="Remove grouping"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {dimensions.length === 0 ? (
                <Button
                  variant="ghost"
                  className="h-11 px-5 rounded-lg bg-[#edf8f1] hover:bg-[#e4f5ea] text-[#2c8d50] text-sm font-medium border border-transparent hover:border-[#c8ebd4] inline-flex items-center gap-2 shadow-2xs"
                >
                  <span>Pick a column to group by</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#2c8d50]/70 ml-0.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="h-11 w-11 p-0 rounded-lg bg-[#edf8f1] hover:bg-[#e4f5ea] text-[#2c8d50] flex items-center justify-center border border-transparent hover:border-[#c8ebd4] shadow-2xs"
                  title="Add grouping column"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto bg-white border-slate-200 shadow-xl rounded-xl p-1.5 z-50">
              <DropdownMenuLabel className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pick group by column
              </DropdownMenuLabel>
              {columns.map((c) => {
                const isSelected = dimensions.some((d) => d.column === c.name)
                return (
                  <DropdownMenuItem
                    key={c.name}
                    disabled={isSelected}
                    onClick={() => addDimension(c.name)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getColIcon(c.data_type)}
                      <span className={isSelected ? 'text-slate-400 font-normal truncate' : 'text-slate-700 truncate'}>
                        {c.name}
                      </span>
                    </div>
                    {isSelected && <span className="text-[10px] text-slate-400 font-normal shrink-0">(added)</span>}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 4. Sort Button (Metabase Up/Down Button) */}
      <div className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="w-8 h-8 p-0 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-2xs"
          title="Sort results"
        >
          <ArrowUpDown className="w-4 h-4" />
        </Button>

        {isSortOpen && (
          <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-md flex items-center gap-3 max-w-md">
            <span className="text-xs font-bold text-slate-500 shrink-0">Order by:</span>
            <div className="flex-1 min-w-0">
              <Select
                value={sort?.field || 'default'}
                onValueChange={(val) => setSort(val === 'default' ? '' : val, sort?.direction || 'DESC')}
              >
                <SelectTrigger className="h-8 bg-slate-50 border-slate-200 text-xs">
                  <SelectValue placeholder="Default order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default order</SelectItem>
                  {columns.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      <div className="flex items-center gap-1.5">
                        {getColIcon(c.data_type)}
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSort(sort?.field || columns[0]?.name || '', sort?.direction === 'ASC' ? 'DESC' : 'ASC')}
              className="px-2.5 py-1.5 h-8 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shadow-2xs shrink-0"
            >
              {sort?.direction === 'ASC' ? 'ASC' : 'DESC'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
