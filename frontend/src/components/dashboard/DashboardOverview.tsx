import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database,
  Terminal,
  Layers,
  Sparkles,
  Plus,
  RefreshCw,
  CheckCircle,
  Users,
  Wand2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCurrentUserQuery } from '@/features/auth/hooks'
import { useOrganizationsQuery } from '@/features/organizations/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardOverviewProps {
  onNavigateToMembers?: () => void
  onNavigateToDataSources?: () => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateToMembers,
  onNavigateToDataSources,
}) => {
  const navigate = useNavigate()
  const { user, organizations: storeOrgs, currentOrganization } = useAuthStore()

  const {
    data: organizationsData,
    refetch: refetchOrgs,
    isRefetching: isRefetchingOrgs,
  } = useOrganizationsQuery()

  const {
    data: currentUserData,
    isLoading: isLoadingUser,
    refetch: refetchUser,
    isRefetching: isRefetchingUser,
  } = useCurrentUserQuery()

  const organizations = organizationsData || storeOrgs

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in font-sans">
      {/* Welcome Banner - Metabase Sky Blue Theme */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#f0f7fd] via-white to-blue-50/70 text-slate-900 shadow-xs border border-[#badcf7]/70 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0effb] text-[#509ee3] text-xs font-semibold border border-[#badcf7]">
            <Sparkles className="w-3.5 h-3.5 text-[#509ee3]" />
            <span>Connected to Vizora Fast-API Backend</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to Vizora, {currentUserData?.name || user?.name || 'Explorer'}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Workspace active for <span className="font-semibold text-slate-900">{currentOrganization?.name || 'Your Organization'}</span>. Connect data warehouses, write analytical SQL, or manage team members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate('/query-builder')}
            className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-md shadow-blue-500/20 cursor-pointer font-bold"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            <span>Ask a Question</span>
          </Button>
          <Button
            onClick={() => (onNavigateToMembers ? onNavigateToMembers() : navigate('/members'))}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer font-medium"
          >
            <Users className="w-4 h-4 mr-2 text-[#509ee3]" />
            <span>Manage Team</span>
          </Button>
          <Button
            onClick={() => navigate('/workbench')}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer font-medium"
          >
            <Plus className="w-4 h-4 mr-2 text-[#509ee3]" />
            <span>SQL Query</span>
          </Button>
        </div>
      </div>

      {/* Live Backend API Synchronization Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Live API & Organization Synchronization
            </CardTitle>
            <CardDescription className="text-slate-500">
              Data dynamically fetched from <code className="text-xs bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">/api/v1/organizations/</code> and <code className="text-xs bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">/api/v1/auth/me</code>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchOrgs()
              refetchUser()
            }}
            disabled={isRefetchingOrgs || isRefetchingUser}
            className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${(isRefetchingOrgs || isRefetchingUser) ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Logged-in User Profile</div>
              <div className="text-sm font-semibold text-slate-900">
                {isLoadingUser ? 'Loading...' : (currentUserData?.name || user?.name)}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {currentUserData?.email || user?.email}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Active Organization</div>
              <div className="text-sm font-semibold text-slate-900">
                {currentOrganization?.name || 'No Org Selected'}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {organizations.length} organization(s) available via API
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Backend Authentication</div>
              <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Bearer JWT Active
              </div>
              <div className="text-xs text-slate-500 font-mono">Synced to Zustand Global Store</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BI Platform Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card
          onClick={() => navigate('/query-builder')}
          className="border-slate-200 bg-white hover:border-[#509ee3]/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7064e6] border border-purple-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Wand2 className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-slate-900 group-hover:text-[#509ee3] transition-colors">Query Builder</CardTitle>
            <CardDescription className="text-slate-500">
              Create visual questions with Metabase notebook pipeline without writing SQL.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          onClick={() => (onNavigateToDataSources ? onNavigateToDataSources() : navigate('/datasources'))}
          className="border-slate-200 bg-white hover:border-[#509ee3]/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-[#f0f7fd] text-[#509ee3] border border-[#e0effb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-slate-900 group-hover:text-[#509ee3] transition-colors">Data Sources</CardTitle>
            <CardDescription className="text-slate-500">
              Connect PostgreSQL, Google BigQuery, Snowflake, and ClickHouse databases to your organization.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          onClick={() => navigate('/workbench')}
          className="border-slate-200 bg-white hover:border-[#509ee3]/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-[#f0f7fd] text-[#509ee3] border border-[#e0effb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-slate-900 group-hover:text-[#509ee3] transition-colors">SQL Workbench</CardTitle>
            <CardDescription className="text-slate-500">
              Write queries with schema autocomplete, result caching, and save reusable queries.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          onClick={() => navigate('/overview')}
          className="border-slate-200 bg-white hover:border-[#509ee3]/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-[#f0f7fd] text-[#509ee3] border border-[#e0effb] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <CardTitle className="text-base text-slate-900 group-hover:text-[#509ee3] transition-colors">Interactive Dashboards</CardTitle>
            <CardDescription className="text-slate-500">
              Assemble multi-tab dashboards, KPI scorecards, drill-down charts, and automated reporting.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
