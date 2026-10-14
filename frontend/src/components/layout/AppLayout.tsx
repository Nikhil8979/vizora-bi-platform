import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import {
  Building2,
  ChevronDown,
  RefreshCw,
  Check,
  Building,
  User as UserIcon,
  LogOut,
  Users,
  Database,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useOrganizationsQuery } from '@/features/organizations/hooks'
import { useCurrentUserQuery } from '@/features/auth/hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, organizations: storeOrgs, currentOrganization, setCurrentOrganization, logout } = useAuthStore()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('vizora_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('vizora_sidebar_collapsed', String(next))
      } catch { }
      return next
    })
  }

  const {
    data: organizationsData,
    isLoading: isLoadingOrgs,
    refetch: refetchOrgs,
    isRefetching: isRefetchingOrgs,
  } = useOrganizationsQuery()

  const { data: currentUserData } = useCurrentUserQuery()
  const organizations = organizationsData || storeOrgs

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex font-sans">
      {/* Platform Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-200/80 bg-white px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left: Sidebar Toggle + Organization Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4 text-[#509ee3]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 transition cursor-pointer"
                  title="Switch Organization"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#509ee3]" />
                  <span className="font-semibold">
                    {isLoadingOrgs ? 'Loading orgs...' : (currentOrganization?.name || 'Select Organization')}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-white border-slate-200 shadow-lg">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Organizations ({organizations.length})
                  </DropdownMenuLabel>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      refetchOrgs()
                    }}
                    className="text-slate-400 hover:text-[#509ee3] transition p-1"
                    title="Refresh organizations list"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefetchingOrgs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />

                {isLoadingOrgs && organizations.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">Loading organizations...</div>
                ) : organizations.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No organizations found</div>
                ) : (
                  organizations.map((org) => {
                    const isSelected = currentOrganization?.id === org.id
                    return (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => setCurrentOrganization(org)}
                        className={`flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-md ${isSelected ? 'bg-[#f0f7fd] text-[#509ee3] font-medium' : 'hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#509ee3]' : 'text-slate-400'}`} />
                          <span className="truncate">{org.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#509ee3] shrink-0 ml-2" />}
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>


          </div>

          {/* Right: User Profile Menu */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-[#509ee3] text-white font-semibold flex items-center justify-center text-xs shadow-2xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</div>
                    <div className="text-[11px] text-slate-500">{user?.email}</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-lg">
                <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
                  Logged In User
                </DropdownMenuLabel>
                <div className="px-2 py-1 text-xs text-slate-700 font-medium">
                  {currentUserData?.name || user?.name}
                  <div className="text-[11px] text-slate-400 font-normal">{currentUserData?.email || user?.email}</div>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => navigate('/members')} className="cursor-pointer text-slate-700 hover:bg-slate-50">
                  <Users className="w-4 h-4 mr-2 text-[#509ee3]" />
                  <span>Manage Team</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-slate-700 hover:bg-slate-50">
                  <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Content via Route Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
