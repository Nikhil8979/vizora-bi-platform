import React, { useState } from 'react'
import { Plus, X, Hash, Type, Calendar } from 'lucide-react'
import { FieldResponse } from '@/types/datasource'
import { ComparisonOperator } from '@/features/query-engine/types'
import { AdhocFilter, useQueryBuilderStore } from '../store/queryBuilderStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FilterStageProps {
  columns: FieldResponse[]
}

const OPERATOR_OPTIONS: { label: string; value: ComparisonOperator | 'IS NULL' | 'IS NOT NULL' }[] = [
  { label: 'Equal to (=)', value: '=' },
  { label: 'Not equal to (!=)', value: '!=' },
  { label: 'Greater than (>)', value: '>' },
  { label: 'Less than (<)', value: '<' },
  { label: 'Greater or equal (>=)', value: '>=' },
  { label: 'Less or equal (<=)', value: '<=' },
  { label: 'Contains text (LIKE)', value: 'LIKE' },
  { label: 'Is empty (IS NULL)', value: 'IS NULL' },
  { label: 'Is not empty (IS NOT NULL)', value: 'IS NOT NULL' },
]

export const FilterStage: React.FC<FilterStageProps> = ({ columns }) => {
  const { filters, addFilter, removeFilter } = useQueryBuilderStore()

  const [isOpen, setIsOpen] = useState(false)
  const [column, setColumn] = useState('')
  const [operator, setOperator] = useState<ComparisonOperator | 'IS NULL' | 'IS NOT NULL'>('=')
  const [value, setValue] = useState('')

  const handleOpen = () => {
    setColumn(columns[0]?.name || '')
    setOperator('=')
    setValue('')
    setIsOpen(true)
  }

  const handleSave = () => {
    const colName = column || columns[0]?.name || ''
    if (!colName) return

    addFilter({
      id: String(Date.now()),
      column: colName,
      operator,
      value,
    })
    setIsOpen(false)
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
      <label className="text-xs font-bold text-[#7064e6] uppercase tracking-wider block">
        Filter
      </label>

      {filters.length === 0 ? (
        /* Metabase Empty Filter Callout */
        <Button
          variant="ghost"
          onClick={handleOpen}
          className="w-full justify-start h-auto px-5 py-3 rounded-lg bg-[#f3f0fc] hover:bg-[#ede8fb] text-[#7064e6] text-sm font-medium border border-transparent hover:border-[#ddd5f9] shadow-2xs"
        >
          Add filters to narrow your answer
        </Button>
      ) : (
        /* Active Filter Chips */
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <div
              key={f.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f0fc] border border-[#dcd5f7] text-xs font-semibold text-[#6348d9] shadow-2xs"
            >
              <span className="font-bold">{f.column}</span>
              <span className="text-[#8974e6] font-mono">{f.operator}</span>
              {f.operator !== 'IS NULL' && f.operator !== 'IS NOT NULL' && (
                <span className="bg-white/90 px-1.5 py-0.5 rounded text-slate-800 border border-[#e6e0f8] font-normal">
                  {f.value || '""'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(f.id)}
                className="p-0.5 h-4 w-4 hover:text-rose-600 ml-1 rounded text-slate-400"
                title="Remove filter"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpen}
            className="h-8 px-2.5 rounded-lg bg-[#f3f0fc] hover:bg-[#ede8fb] text-[#7064e6] text-xs font-semibold inline-flex items-center gap-1 border border-transparent hover:border-[#ddd5f9]"
          >
            <Plus className="w-3 h-3" />
            <span>Add filter</span>
          </Button>
        </div>
      )}

      {/* Filter Popover Dialog using shadcn UI Select and Input */}
      {isOpen && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xl space-y-3 max-w-md animate-fade-in">
          <div className="text-xs font-bold text-slate-700">Add filter condition</div>
          <div className="space-y-2.5">
            {/* Column Selector */}
            <Select value={column} onValueChange={(val) => setColumn(val)}>
              <SelectTrigger className="w-full h-9 bg-slate-50/80 border-slate-200 text-xs">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    <div className="flex items-center gap-2">
                      {getColIcon(c.data_type)}
                      <span className="font-semibold text-slate-700">{c.name}</span>
                      <span className="text-slate-400 font-normal">({c.data_type || 'text'})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select value={operator} onValueChange={(val) => setOperator(val as any)}>
              <SelectTrigger className="w-full h-9 bg-slate-50/80 border-slate-200 text-xs">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {OPERATOR_OPTIONS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value Input */}
            {operator !== 'IS NULL' && operator !== 'IS NOT NULL' && (
              <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Comparison value..."
                className="h-9 text-xs bg-white border-slate-200 focus-visible:ring-[#7064e6]"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-[#7064e6] hover:bg-[#6052db] text-white text-xs font-bold shadow-2xs h-8 px-4"
            >
              Add Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
