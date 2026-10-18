import React, { useRef } from 'react'
import { Copy, Check, Terminal, Play, RefreshCw, PanelLeft, PanelLeftClose, Bookmark } from 'lucide-react'

interface SqlCodeEditorProps {
  value: string
  onChange: (val: string) => void
  onExecute: () => void
  onSaveQuestion?: () => void
  isExecuting: boolean
  placeholder?: string
  isCatalogOpen?: boolean
  onToggleCatalog?: () => void
}

export const SqlCodeEditor: React.FC<SqlCodeEditorProps> = ({
  value,
  onChange,
  onExecute,
  onSaveQuestion,
  isExecuting,
  placeholder = 'SELECT * FROM orders LIMIT 100;',
  isCatalogOpen = true,
  onToggleCatalog,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = React.useState(false)

  const lineCount = Math.max(1, value.split('\n').length)
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isExecuting) {
        onExecute()
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs font-mono text-sm">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs text-slate-500 select-none">
        <div className="flex items-center gap-2">
          {onToggleCatalog && (
            <button
              onClick={onToggleCatalog}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center mr-1 ${
                isCatalogOpen
                  ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
                  : 'bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-xs'
              }`}
              title={isCatalogOpen ? 'Collapse Data Catalog sidebar' : 'Expand Data Catalog sidebar'}
            >
              {isCatalogOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
          )}

          <Terminal className="w-4 h-4 text-[#509ee3]" />
          <span className="font-bold text-slate-800">SQL Query</span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">⌘ + Enter</kbd> to execute
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Copy SQL query"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onSaveQuestion && (
            <button
              onClick={onSaveQuestion}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs active:bg-slate-100"
              title="Save this query as a question"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#509ee3]" />
              <span>Save Question</span>
            </button>
          )}

          {/* Integrated Run Query Action Button */}
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="px-3.5 py-1.5 rounded-lg bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white font-semibold transition text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 ml-1"
            title="Execute SQL Query (⌘ + Enter)"
          >
            {isExecuting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#438bc8] text-white text-[10px] font-mono">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 flex overflow-hidden min-h-[170px] bg-white">
        {/* Line Numbers Gutter */}
        <div className="w-12 py-3.5 bg-slate-50/70 text-right pr-3.5 select-none text-slate-400 font-mono text-xs border-r border-slate-200 leading-6 shrink-0">
          {lines.map((ln) => (
            <div key={ln}>{ln}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 w-full h-full p-3.5 bg-white text-slate-800 placeholder-slate-400 resize-none outline-none font-mono text-xs leading-6 selection:bg-[#badcf7] selection:text-slate-900"
        />
      </div>
    </div>
  )
}
