import React, { useState } from 'react'
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
import { DataSourceType, CreateDataSourcePayload } from '@/types/datasource'
import { useCreateDataSourceMutation } from './hooks'
import { Database, AlertCircle, CheckCircle2, Server, Lock, Layers } from 'lucide-react'

interface CreateDataSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  initialType?: DataSourceType
}

const CONNECTOR_TYPES: Array<{
  type: DataSourceType
  name: string
  desc: string
  defaultPort?: number
  badgeColor: string
}> = [
  {
    type: 'postgres',
    name: 'PostgreSQL',
    desc: 'Reliable SQL database with rich indexing and JSON support.',
    defaultPort: 5432,
    badgeColor: 'bg-[#e0effb] text-[#509ee3] border-[#badcf7]',
  },
  {
    type: 'mysql',
    name: 'MySQL',
    desc: 'Popular relational database for web services and analytics.',
    defaultPort: 3306,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'bigquery',
    name: 'Google BigQuery',
    desc: 'Serverless, cost-effective data warehouse from Google Cloud.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'snowflake',
    name: 'Snowflake',
    desc: 'Multi-cluster, elasticity-first cloud data warehouse.',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    type: 'redshift',
    name: 'Amazon Redshift',
    desc: 'Fast, petabyte-scale cloud data warehouse from AWS.',
    defaultPort: 5439,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
]

export const CreateDataSourceDialog: React.FC<CreateDataSourceDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  initialType = 'postgres',
}) => {
  const [selectedType, setSelectedType] = useState<DataSourceType>(initialType)

  React.useEffect(() => {
    if (open && initialType) {
      setSelectedType(initialType)
    }
  }, [open, initialType])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // SQL fields (Postgres, MySQL, Redshift)
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState(5432)
  const [database, setDatabase] = useState('postgres')
  const [schemaName, setSchemaName] = useState('public')
  const [username, setUsername] = useState('postgres')
  const [password, setPassword] = useState('')

  // Snowflake fields
  const [account, setAccount] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [role, setRole] = useState('')

  // BigQuery fields
  const [projectId, setProjectId] = useState('')
  const [dataset, setDataset] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [tokenUri, setTokenUri] = useState('https://oauth2.googleapis.com/token')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const createMutation = useCreateDataSourceMutation(organizationId, {
    onSuccess: () => {
      setSuccessMessage('Data source created successfully!')
      setErrorMessage(null)
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
      }, 1200)
    },
    onError: (err) => {
      setErrorMessage(err)
      setSuccessMessage(null)
    },
  })

  const handleTypeSelect = (type: DataSourceType) => {
    setSelectedType(type)
    if (type === 'postgres') setPort(5432)
    if (type === 'mysql') setPort(3306)
    if (type === 'redshift') setPort(5439)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPassword('')
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Please give your data source a name')
      return
    }

    let payload: CreateDataSourcePayload

    if (selectedType === 'postgres' || selectedType === 'mysql' || selectedType === 'redshift') {
      if (!host || !database || !username) {
        setErrorMessage('Host, database, and username are required')
        return
      }
      payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: selectedType,
        configuration: {
          host: host.trim(),
          port: Number(port),
          database: database.trim(),
          schema: schemaName.trim() || undefined,
        },
        credentials: {
          username: username.trim(),
          password,
        },
      } as CreateDataSourcePayload
    } else if (selectedType === 'snowflake') {
      if (!account || !warehouse || !database || !schemaName || !username) {
        setErrorMessage('Account, warehouse, database, schema, and username are required for Snowflake')
        return
      }
      payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: 'snowflake',
        configuration: {
          account: account.trim(),
          warehouse: warehouse.trim(),
          database: database.trim(),
          schema: schemaName.trim(),
          role: role.trim() || undefined,
        },
        credentials: {
          username: username.trim(),
          password,
        },
      }
    } else {
      // bigquery
      if (!projectId || !clientEmail || !privateKey) {
        setErrorMessage('Project ID, Service Account Email, and Private Key are required for BigQuery')
        return
      }
      payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: 'bigquery',
        configuration: {
          project_id: projectId.trim(),
          dataset: dataset.trim() || undefined,
        },
        credentials: {
          type: 'service_account',
          client_email: clientEmail.trim(),
          private_key: privateKey.trim(),
          token_uri: tokenUri.trim(),
        },
      }
    }

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#509ee3]" />
            Connect New Data Source
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs">
            Connect an analytical warehouse or relational database to execute SQL queries and build dashboards.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Connector Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Select Database Engine</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONNECTOR_TYPES.map((c) => {
                const isSelected = selectedType === c.type
                return (
                  <button
                    type="button"
                    key={c.type}
                    onClick={() => handleTypeSelect(c.type)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected
                        ? 'border-[#509ee3] bg-[#f0f7fd]/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#509ee3] bg-[#509ee3]' : 'border-slate-300'
                          }`}
                      >
                        {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border self-start font-medium ${c.badgeColor}`}>
                      {c.type.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* General Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="ds-name" className="text-xs font-semibold text-slate-700">
                Display Name
              </Label>
              <Input
                id="ds-name"
                placeholder="e.g. Analytics PostgreSQL"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-slate-50/50 border-slate-200 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-desc" className="text-xs font-semibold text-slate-700">
                Description (Optional)
              </Label>
              <Input
                id="ds-desc"
                placeholder="Primary transactional replica"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 bg-slate-50/50 border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {(selectedType === 'postgres' || selectedType === 'mysql' || selectedType === 'redshift') && (
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200/80">
                <Server className="w-3.5 h-3.5 text-[#509ee3]" />
                <span>Connection & Network Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Host / Endpoint</Label>
                  <Input
                    placeholder="localhost or db.company.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Port</Label>
                  <Input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Database Name</Label>
                  <Input
                    placeholder="my_database"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Schema (Optional)</Label>
                  <Input
                    placeholder="public"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Username</Label>
                  <Input
                    placeholder="postgres"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'snowflake' && (
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200/80">
                <Server className="w-3.5 h-3.5 text-cyan-600" />
                <span>Snowflake Account & Warehouse</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Account Identifier</Label>
                  <Input
                    placeholder="xy12345.us-east-1"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Warehouse</Label>
                  <Input
                    placeholder="COMPUTE_WH"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Database</Label>
                  <Input
                    placeholder="ANALYTICS_DB"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Schema</Label>
                  <Input
                    placeholder="PUBLIC"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/80">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Role (Optional)</Label>
                  <Input
                    placeholder="ACCOUNTADMIN"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Username</Label>
                  <Input
                    placeholder="snowflake_user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'bigquery' && (
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200/80">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Cloud BigQuery Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">GCP Project ID</Label>
                  <Input
                    placeholder="my-gcp-project-123"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-600 font-semibold">Dataset (Optional)</Label>
                  <Input
                    placeholder="analytics_mart"
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    className="h-9 bg-white text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-semibold">Service Account Email</Label>
                <Input
                  placeholder="bigquery-sa@project.iam.gserviceaccount.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="h-9 bg-white text-xs border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600 font-semibold">Private Key (PEM format)</Label>
                <textarea
                  rows={3}
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white p-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#509ee3]"
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white cursor-pointer font-bold shadow-md shadow-blue-500/20"
            >
              Connect Data Source
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
