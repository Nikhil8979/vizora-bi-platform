import React, { useState } from 'react'
import {
  Table as TableIcon,
  ChevronDown,
  Link2,
  Sliders,
  Play,
  RotateCcw,
  Check,
  Database,
  Folder,
} from 'lucide-react'
import { FieldResponse } from '@/types/datasource'
import { useQueryBuilderStore } from '../store/queryBuilderStore'
import { FilterStage } from './FilterStage'
import { SummarizeStage } from './SummarizeStage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MetabaseNotebookProps {
  dataSources?: Array<{ id: string; name: string; type?: string }>
  selectedDataSourceId?: string
  onSelectDataSource?: (id: string) => void
  schemas?: string[]
  selectedSchema?: string
  onSelectSchema?: (schema: string) => void
  tables: string[]
  isLoadingTables?: boolean
  columns: FieldResponse[]
  isLoadingColumns?: boolean
  onVisualize: () => void
}

export const MetabaseNotebook: React.FC<MetabaseNotebookProps> = ({
  dataSources = [],
  selectedDataSourceId = '',
  onSelectDataSource,
  schemas = [],
  selectedSchema = '',
  onSelectSchema,
  tables,
  isLoadingTables = false,
  columns,
  onVisualize,
}) => {
  const {
    table,
    setTable,
    limit,
    setLimit,
    resetPipeline,
    isExecuting,
  } = useQueryBuilderStore()

  return (
    <div className="w-full py-6 px-6 md:px-8 space-y-7 text-slate-800 font-sans">
      {/* 1. DATA SECTION */}
      <div>
        <label className="text-xs font-bold text-[#509ee3] uppercase tracking-wider block mb-2.5">
          Data
        </label>

        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Data Source Pill */}
            {dataSources.length > 0 && onSelectDataSource && (
              <>
                <Select
                  value={selectedDataSourceId}
                  onValueChange={(val) => onSelectDataSource(val)}
                >
                  <SelectTrigger className="h-10 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center gap-2 border border-slate-200 shadow-2xs transition cursor-pointer select-none w-auto min-w-[180px]">
                    <Database className="w-4 h-4 text-[#509ee3] shrink-0" />
                    <SelectValue placeholder="Select Data Source" />
                  </SelectTrigger>
                  <SelectContent className="w-64 max-h-72">
                    <SelectGroup>
                      <SelectLabel className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Connected Data Sources
                      </SelectLabel>
                      {dataSources.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id} className="cursor-pointer text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-[#509ee3] shrink-0" />
                            <span>{ds.name}</span>
                            {ds.type && (
                              <span className="text-[10px] text-slate-400 font-normal">({ds.type})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <span className="text-slate-300 font-bold text-base select-none">/</span>
              </>
            )}

            {/* 2. Optional Schema Pill if multiple schemas exist */}
            {schemas && schemas.length > 1 && onSelectSchema && (
              <>
                <Select
                  value={selectedSchema}
                  onValueChange={(val) => onSelectSchema(val)}
                >
                  <SelectTrigger className="h-10 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 border border-slate-200 shadow-2xs transition cursor-pointer select-none w-auto min-w-[140px]">
                    <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Select Schema" />
                  </SelectTrigger>
                  <SelectContent className="w-56 max-h-64">
                    <SelectGroup>
                      <SelectLabel className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Schemas
                      </SelectLabel>
                      {schemas.map((s) => (
                        <SelectItem key={s} value={s} className="cursor-pointer text-xs font-semibold">
                          <span>{s}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <span className="text-slate-300 font-bold text-base select-none">/</span>
              </>
            )}

            {/* 3. Solid Blue Table Pill powered by shadcn Select */}
            <Select
              value={table}
              onValueChange={(val) => setTable(val)}
              disabled={!selectedDataSourceId || isLoadingTables}
            >
              <SelectTrigger className="h-10 px-4 rounded-lg bg-[#509ee3] hover:bg-[#408ecf] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 border-0 shadow-2xs transition cursor-pointer select-none [&>svg]:text-white [&>span]:text-white w-auto min-w-[200px]">
                <TableIcon className="w-4 h-4 text-white/90 shrink-0" />
                <SelectValue
                  placeholder={
                    isLoadingTables
                      ? 'Loading tables...'
                      : tables.length === 0
                      ? 'No tables found'
                      : 'Select table'
                  }
                />
              </SelectTrigger>
              <SelectContent className="w-64 max-h-72">
                <SelectGroup>
                  <SelectLabel className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Tables
                  </SelectLabel>
                  {tables.map((t) => (
                    <SelectItem key={t} value={t} className="cursor-pointer text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-3.5 h-3.5 text-[#509ee3] shrink-0" />
                        <span>{t}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Sub-actions: Join data & custom column */}
            <div className="flex items-center gap-2 ml-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-lg bg-[#509ee3]/12 hover:bg-[#509ee3]/20 text-[#509ee3] shadow-2xs"
                title="Join data"
              >
                <Link2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 shadow-2xs"
                title="Custom column"
              >
                <Sliders className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER SECTION */}
      <FilterStage columns={columns} />

      {/* 3. SUMMARIZE SECTION */}
      <SummarizeStage columns={columns} />

      {/* 4. ROW LIMIT SECTION */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
          Row limit
        </label>
        <Input
          type="number"
          min={1}
          max={10000}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value || '100', 10))}
          placeholder="Enter a limit"
          className="w-48 h-10 px-3.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus-visible:ring-[#509ee3]"
        />
      </div>

      {/* 5. VISUALIZE ACTION BUTTON */}
      <div className="pt-2 flex items-center gap-3">
        <Button
          onClick={onVisualize}
          disabled={isExecuting}
          className="h-10 px-6 rounded-lg bg-[#509ee3] hover:bg-[#408ecf] active:scale-[0.99] text-white text-sm font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Computing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Visualize</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={resetPipeline}
          className="h-10 px-3.5 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-semibold shadow-2xs cursor-pointer"
          title="Reset query builder"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
