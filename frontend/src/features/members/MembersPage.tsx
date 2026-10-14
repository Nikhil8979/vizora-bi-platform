import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Eye,
  Building2,
  Mail,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useOrganizationMembersQuery } from './hooks'
import { InviteMemberDialog } from './InviteMemberDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { OrganizationRole } from '@/types/members'

export const MembersPage: React.FC = () => {
  const { currentOrganization } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOrganizationMembersQuery(currentOrganization?.id)

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase()
    const nameMatch = member.user?.name?.toLowerCase().includes(query)
    const emailMatch = member.user?.email?.toLowerCase().includes(query)
    const roleMatch = member.role?.toLowerCase().includes(query)
    return nameMatch || emailMatch || roleMatch
  })

  // Role counters
  const ownerCount = members.filter((m) => m.role === 'OWNER').length
  const adminCount = members.filter((m) => m.role === 'ADMIN').length
  const analystCount = members.filter((m) => m.role === 'ANALYST').length
  const viewerCount = members.filter((m) => m.role === 'VIEWER').length

  const getRoleBadge = (role: OrganizationRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            Owner
          </span>
        )
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0effb] text-[#509ee3] border border-[#badcf7]">
            <ShieldAlert className="w-3 h-3" />
            Admin
          </span>
        )
      case 'ANALYST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3" />
            Analyst
          </span>
        )
      case 'VIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3" />
            Viewer
          </span>
        )
    }
  }

  if (!currentOrganization) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-amber-600" />
          <h2 className="text-lg font-bold">No Organization Selected</h2>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Please select or create an organization from the top bar dropdown to view and manage its members.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#509ee3] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>{currentOrganization.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Team & Organization Members
          </h1>
          <p className="text-sm text-slate-500">
            Manage who has access to this BI workspace, assign roles, and invite collaborators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsInviteOpen(true)}
            className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white shadow-md shadow-blue-500/20 cursor-pointer font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Invite Member</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Members</span>
              <Users className="w-4 h-4 text-[#509ee3]" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{members.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">In active workspace</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Owners & Admins</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{ownerCount + adminCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Full management access</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Analysts</span>
              <UserCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{analystCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Query & build dashboards</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Viewers</span>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{viewerCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Read-only consumers</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">Member Directory</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              View and manage all members with access to this workspace.
            </CardDescription>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-50/70 border-slate-200 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#509ee3]" />
              <p className="text-xs text-slate-500 font-medium">Loading organization members...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-sm font-semibold text-slate-900">Failed to load members</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {(error as Error)?.message || 'There was a problem querying the members endpoint.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2 border-slate-200 text-slate-700"
              >
                Retry
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-900">
                {searchQuery ? 'No matching members found' : 'No members yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different term or clear the filter.'
                  : 'Invite team members to collaborate on queries and dashboards.'}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                  className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white cursor-pointer mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  <span>Invite First Member</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-6">Member</th>
                    <th className="py-3 px-6">Email Address</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMembers.map((member) => {
                    const initials = member.user?.name
                      ? member.user.name.slice(0, 2).toUpperCase()
                      : 'U'
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#e0effb] text-[#509ee3] font-bold flex items-center justify-center text-xs shadow-2xs">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {member.user?.name || 'Unnamed User'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Member #{member.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{member.user?.email || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6">{getRoleBadge(member.role)}</td>

                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right font-mono text-xs text-slate-400">
                          #{member.user_id}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal Dialog */}
      <InviteMemberDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        organizationId={currentOrganization?.id}
        organizationName={currentOrganization?.name}
      />
    </div>
  )
}
