import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Table as TableIcon,
  Search,
  RefreshCw,
  FolderTree,
  Folder,
  Hash,
  Type,
  Calendar,
} from 'lucide-react'
import { DataSource } from '@/types/datasource'
import { ConnectorLogo } from '@/features/datasources/ConnectorLogo'
import { datasourcesApi } from '@/features/datasources/api'
import { FieldResponse } from '@/types/datasource'

interface CatalogSidebarProps {
  organizationId: string
  dataSources: DataSource[]
  selectedDataSourceId: string
  schemas?: string[]
  selectedSchema: string
  onSelectSchema?: (schema: string) => void
  tables: string[]
  isLoadingTables?: boolean
  selectedTable: string
  onSelectTable: (dsId: string, schema: string, tableName: string) => void
  onInsertText?: (text: string) => void
  isOpen: boolean
  onToggle: () => void
}

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  organizationId,
  dataSources,
  selectedDataSourceId,
  schemas = [],
  selectedSchema,
  onSelectSchema,
  tables = [],
  isLoadingTables = false,
  selectedTable,
  onSelectTable,
  onInsertText,
  isOpen,
  onToggle,
}) => {
  const [search, setSearch] = useState('')
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})
  const [tableFields, setTableFields] = useState<Record<string, FieldResponse[]>>({})
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({})

  // Toggle table columns inspection
  const toggleTableExpansion = async (schema: string, tableName: string) => {
    const key = `${schema}.${tableName}`
    const isExpanding = !expandedTables[key]
    setExpandedTables((prev) => ({ ...prev, [key]: isExpanding }))

    if (isExpanding && !tableFields[key] && selectedDataSourceId && organizationId) {
      setLoadingFields((prev) => ({ ...prev, [key]: true }))
      try {
        const fields = await datasourcesApi.getFields(
          organizationId,
          selectedDataSourceId,
          schema,
          tableName
        )
        setTableFields((prev) => ({ ...prev, [key]: fields }))
      } catch (err) {
        console.error('Failed to load table fields', err)
      } finally {
        setLoadingFields((prev) => ({ ...prev, [key]: false }))
      }
    }
  }

  const getDataTypeIcon = (dt?: string | null) => {
    const t = (dt || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('float') || t.includes('double') || t.includes('decimal')) {
      return <Hash className="w-3 h-3 text-emerald-500 shrink-0" />
    }
    if (t.includes('date') || t.includes('time')) {
      return <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
    }
    return <Type className="w-3 h-3 text-[#509ee3] shrink-0" />
  }

  if (!isOpen) return null

  const activeDataSource = dataSources.find((d) => d.id === selectedDataSourceId)
  const filteredTables = tables.filter((t) =>
    t.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 h-full flex flex-col shrink-0 select-none overflow-hidden font-sans">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[#509ee3]" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Data Catalog
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {dataSources.length} source{dataSources.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Database Selector */}
      <div className="p-3 border-b border-slate-100 bg-white">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Active Database
        </label>
        <div className="relative">
          <select
            value={selectedDataSourceId}
            onChange={(e) => {
              const newId = e.target.value
              const ds = dataSources.find((d) => d.id === newId)
              if (ds) {
                onSelectTable(newId, '', '')
              }
            }}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#509ee3]/20 cursor-pointer"
          >
            {dataSources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search schemas & tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#509ee3]"
          />
        </div>
      </div>

      {/* Tables & Schema Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeDataSource ? (
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-700">
              <ConnectorLogo type={activeDataSource.type} size="sm" />
              <span className="truncate">{activeDataSource.name}</span>
            </div>

            {/* Schema Selector or Label */}
            {schemas.length > 1 ? (
              <div className="my-2 px-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Schema / Namespace
                </label>
                <select
                  value={selectedSchema}
                  onChange={(e) => onSelectSchema?.(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#509ee3] cursor-pointer"
                >
                  {schemas.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedSchema ? (
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-slate-500 bg-slate-50/80 rounded-md border border-slate-200/60 my-1.5">
                <Folder className="w-3.5 h-3.5 text-[#509ee3] shrink-0" />
                <span className="truncate">schema: <strong>{selectedSchema}</strong></span>
              </div>
            ) : null}

            {/* Discovered Collections / Tables List */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tables ({filteredTables.length})
                </span>
                {isLoadingTables && (
                  <RefreshCw className="w-3 h-3 animate-spin text-[#509ee3]" />
                )}
              </div>

              {isLoadingTables && filteredTables.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-[#509ee3]" />
                  <span>Loading tables...</span>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {search ? `No tables matching "${search}"` : 'No tables in this schema'}
                </div>
              ) : (
                filteredTables.map((tblName) => {
                  const isSelected = selectedTable === tblName
                  const isExpanded = !!expandedTables[`${selectedSchema || 'public'}.${tblName}`]
                  const key = `${selectedSchema || 'public'}.${tblName}`
                  const fields = tableFields[key] || []
                  const isLoadingF = loadingFields[key]

                  return (
                    <div key={tblName} className="space-y-0.5">
                      <div
                        onClick={() => {
                          onSelectTable(selectedDataSourceId, selectedSchema, tblName)
                          toggleTableExpansion(selectedSchema || 'public', tblName)
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer group transition ${
                          isSelected
                            ? 'bg-[#f0f7fd] border border-[#badcf7] text-[#2b6ba3]'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <TableIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected
                                ? 'text-[#509ee3]'
                                : 'text-slate-400 group-hover:text-[#509ee3]'
                            }`}
                          />
                          <span className="truncate">{tblName}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#509ee3]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Fields */}
                      {isExpanded && (
                        <div className="ml-3 pl-2.5 border-l-2 border-[#badcf7] py-1 space-y-1 font-mono text-[11px]">
                          {isLoadingF ? (
                            <div className="text-[10px] text-slate-400 py-1 flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#509ee3]" />
                              <span>Loading columns...</span>
                            </div>
                          ) : fields.length === 0 ? (
                            <div className="text-[10px] text-slate-400 py-1">No columns discovered</div>
                          ) : (
                            fields.map((field) => (
                              <div
                                key={field.name}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onInsertText?.(field.name)
                                }}
                                className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 cursor-pointer text-slate-700 group transition"
                                title={`Click to insert column "${field.name}"`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {getDataTypeIcon(field.data_type)}
                                  <span className="truncate">{field.name}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 group-hover:text-[#509ee3] shrink-0 font-sans">
                                  {field.data_type}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No data source selected
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Click column to insert in editor</span>
      </div>
    </aside>
  )
}

