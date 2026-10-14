import React from 'react'
import {
  Building2,
  Key,
  Shield,
  Bell,
  Mail,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const SettingsPage: React.FC = () => {
  const { user, currentOrganization } = useAuthStore()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in font-sans">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5 text-[#509ee3]" />
          <span>Organization Administration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Workspace Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your organization workspace credentials, security policies, and user profiles.
        </p>
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Workspace Profile</h2>
            <p className="text-xs text-slate-500">Public profile and identifiers for this BI workspace.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Organization Name</Label>
            <Input value={currentOrganization?.name || ''} readOnly className="bg-slate-50 text-xs border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Organization UUID</Label>
            <Input value={currentOrganization?.id || ''} readOnly className="bg-slate-50 font-mono text-xs border-slate-200" />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">User Account</h2>
          <p className="text-xs text-slate-500">Authenticated user details stored in the Vizora platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Full Name</Label>
            <Input value={user?.name || ''} readOnly className="bg-slate-50 text-xs border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Email Address</Label>
            <Input value={user?.email || ''} readOnly className="bg-slate-50 font-mono text-xs border-slate-200" />
          </div>
        </div>
      </div>

      {/* API Keys and Integrations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">API Access & Tokens</h2>
            <p className="text-xs text-slate-500">Tokens for embedding dashboards and programmatic API access.</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200">
            <Key className="w-3.5 h-3.5 mr-1.5 text-[#509ee3]" /> Generate Token
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          API token authentication allows external microservices to query published semantic models and charts safely.
        </p>
      </div>
    </div>
  )
}
