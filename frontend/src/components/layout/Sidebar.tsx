import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Database,
  Terminal,
  Settings,
  BarChart3,
  LogOut,
  Building2,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Wand2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'

export type ActiveNavTab = 'overview' | 'query-builder' | 'workbench' | 'datasources' | 'members' | 'settings'

interface SidebarProps {
  activeTab?: ActiveNavTab
  onSelectTab?: (tab: ActiveNavTab) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab: propActiveTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, currentOrganization, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    {
      id: 'overview' as ActiveNavTab,
      path: '/overview',
      label: 'Overview & Metrics',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'query-builder' as ActiveNavTab,
      path: '/query-builder',
      label: 'Query Builder',
      icon: Wand2,
      badge: 'Visual',
    },
    {
      id: 'workbench' as ActiveNavTab,
      path: '/workbench',
      label: 'SQL Workbench',
      icon: Terminal,
      badge: null,
    },
    {
      id: 'datasources' as ActiveNavTab,
      path: '/datasources',
      label: 'Data Sources',
      icon: Database,
      badge: null,
    },
    {
      id: 'members' as ActiveNavTab,
      path: '/members',
      label: 'Team & Members',
      icon: Users,
      badge: 'Manage',
    },
    {
      id: 'settings' as ActiveNavTab,
      path: '/settings',
      label: 'Workspace Settings',
      icon: Settings,
      badge: null,
    },
  ]

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 h-screen sticky top-0 flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
    >
      {/* Top brand & Organization Header */}
      <div>
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <div
            onClick={() => navigate('/overview')}
            className={`flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition truncate ${isCollapsed ? 'mx-auto' : ''
              }`}
            title="Go to Overview"
          >
            <div className="w-8 h-8 rounded-lg bg-[#509ee3] flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-none block truncate">
                  Vizora <span className="text-[#509ee3] font-semibold">BI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none block truncate mt-0.5">
                  Enterprise Analytics
                </span>
              </div>
            )}
          </div>

          {/* Expand/Collapse Button on Desktop Header */}
          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Active Workspace Pill */}
        <div className="p-3">
          {isCollapsed ? (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-[#509ee3] cursor-pointer"
              title={currentOrganization?.name || 'Workspace'}
            >
              <Building2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[#509ee3] shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentOrganization?.name || 'Workspace'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Active Organization</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="px-2.5 py-2 space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path === '/overview' && location.pathname === '/') ||
              (item.id === 'workbench' && location.pathname === '/sql-editor') ||
              (item.id === 'query-builder' && (location.pathname === '/query-builder' || location.pathname === '/explore')) ||
              (propActiveTab ? propActiveTab === item.id : false)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.path)
                  onSelectTab?.(item.id)
                }}
                className={`w-full flex items-center transition-all cursor-pointer ${isCollapsed
                    ? 'justify-center p-2.5 rounded-xl ' +
                    (isActive
                      ? 'bg-[#f0f7fd] text-[#509ee3] shadow-2xs font-bold border border-[#badcf7]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                    : 'justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ' +
                    (isActive
                      ? 'bg-[#f0f7fd] text-[#509ee3] shadow-2xs font-bold border border-[#badcf7]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className={`w-4 h-4 transition-colors ${isActive ? 'text-[#509ee3]' : 'text-slate-400'
                      }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && (
                  item.badge ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-normal bg-[#f0f7fd] text-[#509ee3] border-[#badcf7]"
                    >
                      {item.badge}
                    </Badge>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[#509ee3]" />
                  ) : null
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-2.5 border-t border-slate-100 space-y-2">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="w-8 h-8 rounded-full bg-[#509ee3] text-white font-bold flex items-center justify-center text-[11px] shadow-xs cursor-default"
              title={`${user?.name || 'User'} (${user?.email || ''})`}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer mt-1"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-[#509ee3] text-white font-bold flex items-center justify-center text-[11px] shrink-0 shadow-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name || 'User'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
