import React, { useState } from 'react'
import {
  Play,
  Database,
  Terminal,
  Save,
  Download,
  Copy,
  Clock,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useDataSourcesQuery } from '@/features/datasources/hooks'

export const WorkbenchPage: React.FC = () => {
  const { currentOrganization } = useAuthStore()
  const { data: dataSources = [] } = useDataSourcesQuery(currentOrganization?.id)
  const [selectedSourceId, setSelectedSourceId] = useState<string>(dataSources[0]?.id || '')
  const [query, setQuery] = useState(`-- Vizora SQL Workbench
SELECT 
  date_trunc('day', created_at) AS date,
  count(id) AS total_events,
  round(avg(response_time_ms), 2) AS avg_latency
FROM analytics_events
WHERE created_at >= current_date - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 50;`)

  const [activeTab, setActiveTab] = useState<'results' | 'schema' | 'history'>('results')

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-[#509ee3]" />
            <span>SQL Analysis</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            SQL Workbench
          </h1>
          <p className="text-sm text-slate-500">
            Author, test, and model multi-database analytical queries across your connected warehouses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#509ee3]"
          >
            {dataSources.length === 0 ? (
              <option value="">No data source connected</option>
            ) : (
              dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.type})
                </option>
              ))
            )}
          </select>

          <Button className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-md shadow-blue-500/20 text-xs font-semibold h-9 px-4 cursor-pointer">
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            <span>Run Query</span>
          </Button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>query_v1.sql</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">
              <Sparkles className="w-3 h-3 mr-1 text-[#509ee3]" /> AI Optimize
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800">
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="p-4 bg-white">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={8}
            className="w-full bg-white text-slate-800 font-mono text-xs focus:outline-none resize-none leading-relaxed placeholder-slate-400 selection:bg-[#badcf7] selection:text-slate-900"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Results / Schema Inspector */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === 'results' ? 'bg-white text-[#509ee3] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 inline mr-1" />
              Query Results (3 rows)
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === 'schema' ? 'bg-white text-[#509ee3] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 inline mr-1" />
              Schema Inspector
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === 'history' ? 'bg-white text-[#509ee3] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              History
            </button>
          </div>

          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-slate-600 border-slate-200">
            <Download className="w-3 h-3 mr-1" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">date</th>
                <th className="py-2 px-3">total_events</th>
                <th className="py-2 px-3">avg_latency (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3">2026-10-10</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">4,819</td>
                <td className="py-2.5 px-3">28.4</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">2026-10-09</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">5,102</td>
                <td className="py-2.5 px-3">31.2</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">2026-10-08</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">4,650</td>
                <td className="py-2.5 px-3">26.9</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
