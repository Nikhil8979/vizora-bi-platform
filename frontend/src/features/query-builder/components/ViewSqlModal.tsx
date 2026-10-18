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
import { Code2, Copy, Check, Terminal, ExternalLink } from 'lucide-react'

interface ViewSqlModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sql: string
  dataSourceId?: string
  tableName?: string
}

export const ViewSqlModal: React.FC<ViewSqlModalProps> = ({
  open,
  onOpenChange,
  sql,
  dataSourceId,
  tableName,
}) => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInWorkbench = () => {
    onOpenChange(false)
    const params = new URLSearchParams()
    if (dataSourceId) params.set('datasourceId', dataSourceId)
    if (tableName) params.set('table', tableName)
    navigate(`/workbench?${params.toString()}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white border-slate-200 p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#509ee3] flex items-center justify-center border border-blue-100 shadow-2xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Generated SQL Query
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                This SQL query was compiled directly from your visual pipeline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* SQL Code Block */}
        <div className="my-3 relative rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner max-h-80">
          <pre className="whitespace-pre-wrap leading-relaxed select-text">{sql}</pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-3 right-3 h-7 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans border border-slate-700 shadow-2xs"
            title="Copy SQL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenInWorkbench}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 w-full sm:w-auto"
          >
            <Terminal className="w-3.5 h-3.5 text-[#509ee3]" />
            <span>Open in SQL Workbench</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
