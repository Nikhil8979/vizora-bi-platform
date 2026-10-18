import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Database,
  Code2,
} from 'lucide-react'
import { QueryDefinition } from '../types'
import { useSaveQuestionMutation } from '../hooks'
import { SavedQuestion } from '../api'

interface SaveQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  dataSourceName?: string
  queryDefinition: QueryDefinition | null
  visualizationType?: string
  visualizationSettings?: Record<string, any>
  sql?: string
  onSaved?: (saved: SavedQuestion) => void
}

export const SaveQuestionDialog: React.FC<SaveQuestionDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  dataSourceName,
  queryDefinition,
  visualizationType = 'table',
  visualizationSettings = {},
  sql = '',
  onSaved,
}) => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSqlPreview, setShowSqlPreview] = useState(false)

  const saveMutation = useSaveQuestionMutation(organizationId, {
    onSuccess: (data) => {
      setSuccessMessage('Question saved successfully! Redirecting...')
      setErrorMessage(null)
      onSaved?.(data)
      setTimeout(() => {
        setTitle('')
        setDescription('')
        setSuccessMessage(null)
        onOpenChange(false)
        navigate(`/question/${data.id}`)
      }, 700)
    },
    onError: (msg) => {
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!title.trim()) {
      setErrorMessage('Please provide a title for this question.')
      return
    }

    if (!queryDefinition) {
      setErrorMessage('No valid query definition found. Please write and execute your query first.')
      return
    }

    // Determine safe visualization type:
    // If visualization type is bar/line/pie but query doesn't have 1 dimension & 1 metric,
    // fallback safely to 'table' to pass backend validation.
    let safeVisType = visualizationType || 'table'
    const metricCount = queryDefinition.metrics?.length || 0
    const dimCount = queryDefinition.dimensions?.length || 0

    if (['bar', 'line', 'pie'].includes(safeVisType)) {
      if (metricCount !== 1 || dimCount !== 1) {
        safeVisType = 'table'
      }
    }

    saveMutation.mutate({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      query_definition: {
        ...queryDefinition,
        filters: queryDefinition.filters || null,
        having: queryDefinition.having || null,
      },
      visualization: {
        type: safeVisType,
        settings: {
          ...visualizationSettings,
          sql: sql || undefined,
        },
      },
    })
  }

  const getVisualIcon = () => {
    switch (visualizationType) {
      case 'bar':
        return <BarChart3 className="w-3.5 h-3.5 text-[#509ee3]" />
      case 'line':
        return <LineChartIcon className="w-3.5 h-3.5 text-[#509ee3]" />
      case 'pie':
        return <PieChartIcon className="w-3.5 h-3.5 text-[#509ee3]" />
      default:
        return <TableIcon className="w-3.5 h-3.5 text-[#509ee3]" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 p-6 shadow-xl rounded-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#e0effb] flex items-center justify-center text-[#509ee3] shrink-0">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Save Question
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Save this analytical query and visualization for future dashboards and reports.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fade-in my-1">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in my-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="question-title" className="text-xs font-semibold text-slate-700">
              Question Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="question-title"
              type="text"
              placeholder="e.g. Total Sales by Product Category"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="h-9.5 bg-slate-50/50 border-slate-200 text-xs focus-visible:ring-[#509ee3]"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label htmlFor="question-desc" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Description</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </Label>
            <textarea
              id="question-desc"
              rows={3}
              placeholder="Describe what this query calculates or any business logic assumptions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#509ee3]/20 resize-none"
            />
          </div>

          {/* Metadata & Query Preview Card */}
          <div className="rounded-xl bg-slate-50/80 border border-slate-200 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium text-slate-500 text-[11px]">Database / Table</span>
              <span className="font-semibold text-slate-800 font-mono text-[11px] flex items-center gap-1.5">
                <Database className="w-3 h-3 text-[#509ee3]" />
                {dataSourceName ? `${dataSourceName} • ` : ''}
                {queryDefinition?.table?.schema ? `${queryDefinition.table.schema}.` : ''}
                {queryDefinition?.table?.name || 'query'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium text-slate-500 text-[11px]">Visualization</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 capitalize">
                {getVisualIcon()}
                {visualizationType || 'Table'}
              </span>
            </div>

            {sql && (
              <div className="pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="text-[11px] text-[#509ee3] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Code2 className="w-3 h-3" />
                  <span>{showSqlPreview ? 'Hide SQL Query' : 'Preview SQL Query'}</span>
                </button>
                {showSqlPreview && (
                  <pre className="mt-2 p-2 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-lg overflow-x-auto max-h-24">
                    {sql}
                  </pre>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saveMutation.isPending}
              className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white cursor-pointer h-9 px-4 text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              <Bookmark className="w-3.5 h-3.5 mr-1.5 fill-current" />
              <span>Save Question</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
