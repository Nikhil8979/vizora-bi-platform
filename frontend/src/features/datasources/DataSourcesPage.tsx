import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database,
  Plus,
  RefreshCw,
  Search,
  Zap,
  FolderTree,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  Layers,
  LayoutGrid,
  List,
  ExternalLink,
  MoreVertical,
  Activity,
  Copy,
  Check,
  Play,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  useDataSourcesQuery,
  useDeleteDataSourceMutation,
  useTestConnectionMutation,
} from './hooks'
import { getErrorMessage } from '@/lib/api'
import { DataSource, DataSourceType } from '@/types/datasource'
import { CreateDataSourceDialog } from './CreateDataSourceDialog'
import { DataSourceSchemaExplorerDialog } from './DataSourceSchemaExplorerDialog'
import { ConnectorLogo } from './ConnectorLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type DataSourceHealthStatus = 'untested' | 'testing' | 'healthy' | 'error'

export interface DataSourceHealthInfo {
  status: DataSourceHealthStatus
  message?: string
  latency?: number
  testedAt?: string
}

const getStorageKey = (orgId?: string) => `vizora_ds_health_${orgId || 'default'}`

const loadHealthStatuses = (orgId?: string): Record<string, DataSourceHealthInfo> => {
  try {
    const raw = localStorage.getItem(getStorageKey(orgId))
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const persistHealthStatuses = (orgId: string | undefined, data: Record<string, DataSourceHealthInfo>) => {
  try {
    localStorage.setItem(getStorageKey(orgId), JSON.stringify(data))
  } catch {
    // Ignore storage quota errors
  }
}

export const DataSourcesPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentOrganization } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'warehouses' | 'relational'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createInitialType, setCreateInitialType] = useState<DataSourceType>('postgres')
  const [explorerDataSource, setExplorerDataSource] = useState<DataSource | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Track testing status per datasource: { [id]: DataSourceHealthInfo }
  const [testStatuses, setTestStatuses] = useState<Record<string, DataSourceHealthInfo>>(() =>
    loadHealthStatuses(currentOrganization?.id)
  )

  // Synchronize when active organization changes
  React.useEffect(() => {
    setTestStatuses(loadHealthStatuses(currentOrganization?.id))
  }, [currentOrganization?.id])

  const {
    data: dataSources = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDataSourcesQuery(currentOrganization?.id)

  const deleteMutation = useDeleteDataSourceMutation(currentOrganization?.id)
  const testMutation = useTestConnectionMutation(currentOrganization?.id)

  const handleOpenCreateWith = (type: DataSourceType) => {
    setCreateInitialType(type)
    setIsCreateOpen(true)
  }

  const handleTestConnection = (dsId: string) => {
    const startTime = performance.now()
    setTestStatuses((prev) => ({
      ...prev,
      [dsId]: { ...prev[dsId], status: 'testing' },
    }))

    testMutation.mutate(dsId, {
      onSuccess: () => {
        const latency = Math.round(performance.now() - startTime)
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setTestStatuses((prev) => {
          const next = {
            ...prev,
            [dsId]: {
              status: 'healthy' as const,
              message: 'Connection verified',
              latency,
              testedAt: now,
            },
          }
          persistHealthStatuses(currentOrganization?.id, next)
          return next
        })
      },
      onError: (err) => {
        const errorText = getErrorMessage(err)
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setTestStatuses((prev) => {
          const next = {
            ...prev,
            [dsId]: {
              status: 'error' as const,
              message: errorText || 'Connection failed',
              testedAt: now,
            },
          }
          persistHealthStatuses(currentOrganization?.id, next)
          return next
        })
      },
    })
  }

  const handleDelete = (ds: DataSource) => {
    if (window.confirm(`Are you sure you want to delete "${ds.name}"? Existing dashboards and queries using this source may fail.`)) {
      deleteMutation.mutate(ds.id, {
        onSuccess: () => {
          setTestStatuses((prev) => {
            const next = { ...prev }
            delete next[ds.id]
            persistHealthStatuses(currentOrganization?.id, next)
            return next
          })
        },
      })
    }
  }

  const handleCopyConfig = (ds: DataSource) => {
    const info = `Engine: ${ds.type}\nID: ${ds.id}\nConfig: ${JSON.stringify(ds.configuration, null, 2)}`
    navigator.clipboard.writeText(info)
    setCopiedId(ds.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtering
  const filteredSources = dataSources.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filterType === 'warehouses') {
      return ds.type === 'bigquery' || ds.type === 'snowflake' || ds.type === 'redshift'
    }
    if (filterType === 'relational') {
      return ds.type === 'postgres' || ds.type === 'mysql'
    }
    return true
  })

  const bigqueryCount = dataSources.filter((d) => d.type === 'bigquery').length
  const postgresCount = dataSources.filter((d) => d.type === 'postgres').length
  const snowflakeCount = dataSources.filter((d) => d.type === 'snowflake').length
  const mysqlCount = dataSources.filter((d) => d.type === 'mysql').length

  const healthyCount = dataSources.filter((d) => testStatuses[d.id]?.status === 'healthy').length
  const errorCount = dataSources.filter((d) => testStatuses[d.id]?.status === 'error').length
  const untestedCount = dataSources.filter(
    (d) => !testStatuses[d.id] || testStatuses[d.id]?.status === 'untested'
  ).length

  const getEngineDisplay = (type: DataSourceType) => {
    switch (type) {
      case 'bigquery':
        return { name: 'Google BigQuery', category: 'Cloud Warehouse', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'snowflake':
        return { name: 'Snowflake', category: 'Cloud Warehouse', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
      case 'postgres':
        return { name: 'PostgreSQL', category: 'Relational DB', badge: 'bg-[#e0effb] text-[#509ee3] border-[#badcf7]' }
      case 'mysql':
        return { name: 'MySQL', category: 'Relational DB', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'redshift':
        return { name: 'Amazon Redshift', category: 'Cloud Warehouse', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
      default:
        return { name: type, category: 'Database', badge: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
  }

  if (!currentOrganization) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-amber-600" />
          <h2 className="text-lg font-bold">No Organization Selected</h2>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Please select an organization from the top header to manage data sources.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* Top SaaS Header (Metabase & Superset style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-[#509ee3]" />
            <span>{currentOrganization.name}</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#509ee3]">Data Platforms</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Databases & Warehouses
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Configure upstream analytical data warehouses and operational databases to power your SQL queries, semantic metrics, and visual dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer h-9 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Sync Sources</span>
          </Button>

          <Button
            onClick={() => handleOpenCreateWith('postgres')}
            className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-md shadow-blue-500/20 cursor-pointer h-9 px-4 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Database</span>
          </Button>
        </div>
      </div>

      {/* Operational Status & Overview Strip (Metabase / Superset Inspiration) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Engine Health Status */}
        <div className="flex items-center gap-4 flex-wrap">
          {errorCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200/80 text-red-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{errorCount} Connection {errorCount === 1 ? 'Error' : 'Errors'}</span>
            </div>
          ) : healthyCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{healthyCount} {healthyCount === 1 ? 'Source' : 'Sources'} Connected & Healthy</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>{dataSources.length} Configured ({untestedCount} Untested)</span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Engine distribution badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
            <span className="text-slate-400 font-medium">Platforms:</span>
            {bigqueryCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {bigqueryCount} BigQuery
              </span>
            )}
            {postgresCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {postgresCount} Postgres
              </span>
            )}
            {snowflakeCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                {snowflakeCount} Snowflake
              </span>
            )}
            {mysqlCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {mysqlCount} MySQL
              </span>
            )}
            {dataSources.length === 0 && (
              <span className="text-slate-400">0 connected platforms</span>
            )}
          </div>
        </div>

        {/* Right: Quick Launch Engine Adders */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 hidden lg:inline font-medium">Quick Connect:</span>
          {(['bigquery', 'postgres', 'snowflake'] as DataSourceType[]).map((eng) => (
            <button
              key={eng}
              onClick={() => handleOpenCreateWith(eng)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ConnectorLogo type={eng} size="sm" className="w-4 h-4 p-0 border-0 bg-transparent rounded-none" />
              <span className="capitalize">{eng}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filterType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            All Sources ({dataSources.length})
          </button>
          <button
            onClick={() => setFilterType('warehouses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filterType === 'warehouses'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            Cloud Warehouses
          </button>
          <button
            onClick={() => setFilterType('relational')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filterType === 'relational'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            Relational DBs
          </button>
        </div>

        {/* Search & Layout toggle */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search databases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 bg-white border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid' ? 'bg-[#f0f7fd] text-[#509ee3]' : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-[#f0f7fd] text-[#509ee3]' : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid View OR Table View */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#509ee3]" />
          <p className="text-sm font-semibold text-slate-900">Querying data sources...</p>
          <p className="text-xs text-slate-500">Retrieving configuration and connector health.</p>
        </div>
      ) : isError ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-red-200 text-red-600">
          <XCircle className="w-8 h-8 mx-auto text-red-500" />
          <h3 className="text-base font-bold text-slate-900">Failed to load data sources</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Unable to connect to the backend datasources service.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-200 mt-2">
            Retry
          </Button>
        </div>
      ) : filteredSources.length === 0 ? (
        /* Empty State with Metabase style connector cards */
        <div className="p-10 md:p-14 text-center bg-white rounded-2xl border border-slate-200 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#f0f7fd] border border-[#badcf7] flex items-center justify-center mx-auto text-[#509ee3] shadow-sm">
            <Database className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery ? 'No matching data sources found' : 'No databases connected yet'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? 'Try a different search term or reset filters.'
                : 'Connect your cloud data warehouse or operational database to start writing queries and creating dashboards.'}
            </p>
          </div>

          {/* Quick-start connector launcher */}
          <div className="pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Choose an engine to connect
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { type: 'bigquery' as DataSourceType, name: 'Google BigQuery', note: 'JSON Service Account' },
                { type: 'postgres' as DataSourceType, name: 'PostgreSQL', note: 'Port 5432 / SSL' },
                { type: 'snowflake' as DataSourceType, name: 'Snowflake', note: 'Cloud Warehouse' },
                { type: 'mysql' as DataSourceType, name: 'MySQL', note: 'Port 3306' },
              ].map((c) => (
                <button
                  key={c.type}
                  onClick={() => handleOpenCreateWith(c.type)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#509ee3] hover:shadow-md bg-white hover:bg-[#f0f7fd]/40 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
                >
                  <ConnectorLogo type={c.type} size="md" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#509ee3] transition">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{c.note}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout (Rich Enterprise Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSources.map((ds) => {
            const currentTest = testStatuses[ds.id]
            const engineInfo = getEngineDisplay(ds.type)

            return (
              <div
                key={ds.id}
                className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Brand */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ConnectorLogo type={ds.type} size="md" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#509ee3] transition leading-tight">
                          {ds.name}
                        </h3>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {engineInfo.name}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200">
                        <DropdownMenuLabel className="text-xs text-slate-400 uppercase font-mono">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/workbench?datasourceId=${ds.id}`)} className="cursor-pointer text-xs text-[#509ee3] font-semibold hover:bg-[#f0f7fd]">
                          <Play className="w-3.5 h-3.5 mr-2 text-[#509ee3]" />
                          <span>Open in SQL Editor</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setExplorerDataSource(ds)} className="cursor-pointer text-xs">
                          <FolderTree className="w-3.5 h-3.5 mr-2 text-slate-600" />
                          <span>Explore Catalog</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTestConnection(ds.id)} className="cursor-pointer text-xs">
                          <Zap className="w-3.5 h-3.5 mr-2 text-amber-500" />
                          <span>Test Connection</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyConfig(ds)} className="cursor-pointer text-xs">
                          {copiedId === ds.id ? <Check className="w-3.5 h-3.5 mr-2 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                          <span>{copiedId === ds.id ? 'Copied Details' : 'Copy Config'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem onClick={() => handleDelete(ds)} className="cursor-pointer text-xs text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          <span>Remove Database</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {ds.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {ds.description}
                    </p>
                  )}

                  {/* Metadata Property Table */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 text-xs font-mono text-slate-600">
                    {ds.configuration?.project_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-sans">Project:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {ds.configuration.project_id}
                        </span>
                      </div>
                    )}
                    {ds.configuration?.dataset && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-sans">Dataset:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">
                          {ds.configuration.dataset}
                        </span>
                      </div>
                    )}
                    {ds.configuration?.host && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-sans">Endpoint:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {ds.configuration.host}:{ds.configuration?.port || 'default'}
                        </span>
                      </div>
                    )}
                    {ds.configuration?.database && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-sans">Database:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">
                          {ds.configuration.database}
                        </span>
                      </div>
                    )}
                    {ds.configuration?.warehouse && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-sans">Warehouse:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">
                          {ds.configuration.warehouse}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Real-time Connection Status Ping */}
                  {currentTest?.status === 'testing' ? (
                    <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 bg-[#f0f7fd] text-[#509ee3] border border-[#badcf7] animate-fade-in">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#509ee3] shrink-0" />
                      <span className="font-medium">Testing connection latency...</span>
                    </div>
                  ) : currentTest?.status === 'healthy' ? (
                    <div className="p-2.5 rounded-xl text-xs flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200/80 animate-fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-emerald-900">Connected</span>
                        {currentTest.latency !== undefined && (
                          <span className="text-[11px] text-emerald-700 font-mono">({currentTest.latency}ms)</span>
                        )}
                      </div>
                      {currentTest.testedAt && (
                        <span className="text-[10px] text-emerald-600 font-sans shrink-0 font-medium">
                          Verified {currentTest.testedAt}
                        </span>
                      )}
                    </div>
                  ) : currentTest?.status === 'error' ? (
                    <div className="p-2.5 rounded-xl text-xs bg-red-50 text-red-700 border border-red-200 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-red-900">
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>Connection Failed</span>
                        </div>
                        <button
                          onClick={() => handleTestConnection(ds.id)}
                          className="text-[11px] font-semibold text-red-700 hover:text-red-900 hover:underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                      {currentTest.message && (
                        <p className="text-[11px] text-red-600 line-clamp-1 font-mono" title={currentTest.message}>
                          {currentTest.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1.5 font-medium text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Not Verified
                      </span>
                      <button
                        onClick={() => handleTestConnection(ds.id)}
                        className="text-[10px] text-[#509ee3] hover:text-[#438bc8] hover:underline font-medium cursor-pointer"
                      >
                        Ping to verify
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(ds.id)}
                    disabled={currentTest?.status === 'testing'}
                    className="h-8 px-2.5 text-xs text-slate-700 hover:text-amber-700 hover:bg-amber-50/50 border-slate-200 cursor-pointer"
                    title="Test connection to database"
                  >
                    {currentTest?.status === 'testing' ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#509ee3] animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    )}
                    <span>{currentTest?.status === 'testing' ? 'Testing' : 'Ping'}</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExplorerDataSource(ds)}
                      className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200 cursor-pointer"
                      title="Explore Schema Catalog"
                    >
                      <FolderTree className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>Catalog</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/workbench?datasourceId=${ds.id}`)}
                      className="h-8 px-3 text-xs bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-2xs cursor-pointer font-medium"
                      title="Open in SQL Editor"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      <span>SQL</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table Layout (Detailed Superset Data Grid) */
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-6">Database Platform</th>
                  <th className="py-3 px-6">Engine Type</th>
                  <th className="py-3 px-6">Host / Project</th>
                  <th className="py-3 px-6">Target Schema / DB</th>
                  <th className="py-3 px-6">Health</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSources.map((ds) => {
                  const currentTest = testStatuses[ds.id]
                  const engineInfo = getEngineDisplay(ds.type)

                  return (
                    <tr key={ds.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <ConnectorLogo type={ds.type} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{ds.name}</div>
                            {ds.description && (
                              <div className="text-[11px] text-slate-400 line-clamp-1">{ds.description}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border font-mono ${engineInfo.badge}`}>
                          {engineInfo.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                        {ds.configuration?.project_id || ds.configuration?.host || ds.configuration?.account || '—'}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                        {ds.configuration?.dataset || ds.configuration?.database || 'default'}
                      </td>                      <td className="py-3.5 px-6">
                        {currentTest?.status === 'testing' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#509ee3] font-medium">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#509ee3]" />
                            <span>Testing...</span>
                          </span>
                        ) : currentTest?.status === 'healthy' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Connected</span>
                            </span>
                            {currentTest.latency !== undefined && (
                              <span className="text-[10px] text-emerald-600 font-mono">({currentTest.latency}ms)</span>
                            )}
                          </div>
                        ) : currentTest?.status === 'error' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Failed</span>
                            </span>
                            <button
                              onClick={() => handleTestConnection(ds.id)}
                              className="text-[11px] text-red-700 underline hover:text-red-900 cursor-pointer"
                              title={currentTest.message || 'Retry connection test'}
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>Not Verified</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(ds.id)}
                            disabled={currentTest?.status === 'testing'}
                            className="h-8 px-2 text-xs border-slate-200 text-slate-700 hover:text-amber-700 cursor-pointer"
                            title="Test Connection"
                          >
                            {currentTest?.status === 'testing' ? (
                              <RefreshCw className="w-3 h-3 text-[#509ee3] animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-500" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExplorerDataSource(ds)}
                            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200 cursor-pointer"
                          >
                            <FolderTree className="w-3 h-3 mr-1 text-slate-500" />
                            <span>Catalog</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => navigate(`/workbench?datasourceId=${ds.id}`)}
                            className="h-8 px-2.5 text-xs bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white cursor-pointer font-medium"
                            title="Open in SQL Editor"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            <span>SQL</span>
                          </Button>

                          <button
                            onClick={() => handleDelete(ds)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <CreateDataSourceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={currentOrganization?.id}
        initialType={createInitialType}
      />

      {/* Catalog & Schema Explorer Modal */}
      <DataSourceSchemaExplorerDialog
        open={Boolean(explorerDataSource)}
        onOpenChange={(open) => !open && setExplorerDataSource(null)}
        organizationId={currentOrganization?.id}
        dataSource={explorerDataSource}
      />
    </div>
  )
}
