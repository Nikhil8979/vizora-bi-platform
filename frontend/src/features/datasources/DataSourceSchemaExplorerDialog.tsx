import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataSource } from '@/types/datasource'
import {
  useNamespacesQuery,
  useCollectionsQuery,
  useFieldsQuery,
} from './hooks'
import {
  FolderTree,
  Folder,
  Table as TableIcon,
  Columns,
  RefreshCw,
  AlertCircle,
  Database,
  Key,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DataSourceSchemaExplorerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  dataSource?: DataSource | null
}

export const DataSourceSchemaExplorerDialog: React.FC<DataSourceSchemaExplorerDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  dataSource,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  // 1. Fetch Namespaces (Schemas / Datasets)
  const {
    data: namespaces = [],
    isLoading: isLoadingNamespaces,
    isError: isErrorNamespaces,
    refetch: refetchNamespaces,
  } = useNamespacesQuery(organizationId, dataSource?.id)

  // 2. Fetch Collections (Tables / Views) for selected namespace
  const {
    data: collections = [],
    isLoading: isLoadingCollections,
    isError: isErrorCollections,
    refetch: refetchCollections,
  } = useCollectionsQuery(organizationId, dataSource?.id, selectedNamespace || undefined)

  // 3. Fetch Fields (Columns / Types) for selected collection
  const {
    data: fields = [],
    isLoading: isLoadingFields,
    isError: isErrorFields,
    refetch: refetchFields,
  } = useFieldsQuery(
    organizationId,
    dataSource?.id,
    selectedNamespace || undefined,
    selectedCollection || undefined
  )

  const handleSelectNamespace = (ns: string) => {
    setSelectedNamespace(ns)
    setSelectedCollection(null)
  }

  const handleSelectCollection = (col: string) => {
    setSelectedCollection(col)
  }

  // Auto-select first namespace if none selected
  React.useEffect(() => {
    if (!selectedNamespace && namespaces.length > 0) {
      setSelectedNamespace(namespaces[0].name)
    }
  }, [namespaces, selectedNamespace])

  // Auto-select first collection if none selected
  React.useEffect(() => {
    if (!selectedCollection && collections.length > 0) {
      setSelectedCollection(collections[0].name)
    }
  }, [collections, selectedCollection])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] h-[650px] bg-white border-slate-200 flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#509ee3]" />
              <DialogTitle className="text-xl font-bold text-slate-900">
                Schema Explorer — {dataSource?.name}
              </DialogTitle>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {dataSource?.type}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-slate-500 text-xs">
            Browse discovered schemas, tables, and column metadata from your database.
          </DialogDescription>
        </DialogHeader>

        {/* 3-Column Drilldown Browser */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-0 pt-2">
          {/* Column 1: Namespaces (Schemas) */}
          <div className="flex flex-col min-h-0 pr-0 md:pr-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#509ee3]" />
                Schemas ({namespaces.length})
              </span>
              <button
                onClick={() => refetchNamespaces()}
                className="text-slate-400 hover:text-[#509ee3] p-1"
                title="Refresh schemas"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {isLoadingNamespaces ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-[#509ee3]" />
                  <span>Loading schemas...</span>
                </div>
              ) : isErrorNamespaces ? (
                <div className="p-4 text-center text-xs text-red-500">
                  <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  Failed to load schemas. Ensure credentials and connection are valid.
                </div>
              ) : namespaces.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No schemas found</div>
              ) : (
                namespaces.map((ns) => {
                  const isSelected = selectedNamespace === ns.name
                  return (
                    <button
                      key={ns.name}
                      onClick={() => handleSelectNamespace(ns.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#f0f7fd] text-[#509ee3] font-bold border border-[#badcf7]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{ns.name}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Column 2: Collections (Tables / Views) */}
          <div className="flex flex-col min-h-0 px-0 md:px-3 pt-2 md:pt-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-[#509ee3]" />
                Tables ({collections.length})
              </span>
              {selectedNamespace && (
                <button
                  onClick={() => refetchCollections()}
                  className="text-slate-400 hover:text-[#509ee3] p-1"
                  title="Refresh tables"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {!selectedNamespace ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Select a schema on the left to view tables
                </div>
              ) : isLoadingCollections ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-purple-600" />
                  <span>Loading tables...</span>
                </div>
              ) : isErrorCollections ? (
                <div className="p-4 text-center text-xs text-red-500">Failed to load tables</div>
              ) : collections.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No tables in schema</div>
              ) : (
                collections.map((col) => {
                  const isSelected = selectedCollection === col.name
                  return (
                    <button
                      key={col.name}
                      onClick={() => handleSelectCollection(col.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#f0f7fd] text-[#509ee3] font-bold border border-[#badcf7]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{col.name}</span>
                      {col.type && (
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {col.type}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Column 3: Fields (Columns) */}
          <div className="flex flex-col min-h-0 pl-0 md:pl-3 pt-2 md:pt-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-emerald-600" />
                Columns ({fields.length})
              </span>
              {selectedCollection && (
                <button
                  onClick={() => refetchFields()}
                  className="text-slate-400 hover:text-emerald-600 p-1"
                  title="Refresh columns"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {!selectedCollection ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Select a table to view column fields and types
                </div>
              ) : isLoadingFields ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-emerald-600" />
                  <span>Loading columns...</span>
                </div>
              ) : isErrorFields ? (
                <div className="p-4 text-center text-xs text-red-500">Failed to load columns</div>
              ) : fields.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No columns found</div>
              ) : (
                fields.map((f) => (
                  <div
                    key={f.name}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Key className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[#509ee3] shrink-0">
                      {f.data_type || 'text'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
