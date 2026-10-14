import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Database,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface AuthPageProps {
  initialMode?: 'login' | 'register'
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const handleModeChange = (val: 'login' | 'register') => {
    setMode(val)
    navigate('/' + val, { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50/70 text-slate-900">
      {/* Main Split Layout */}
      <div className="w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left Section: BI Platform Showcase (Pure Light Theme, Metabase / Superset / ThoughtSpot aesthetic) */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#f0f7fd]/90 via-slate-50 to-blue-50/50 p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
          {/* Subtle background glow */}
          <div className="absolute top-[-15%] left-[-10%] w-[450px] h-[450px] bg-[#badcf7]/40 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#509ee3] flex items-center justify-center shadow-md shadow-blue-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                Vizora <span className="text-[#509ee3] font-semibold">BI</span>
              </span>
              <Badge variant="info" className="ml-1 font-mono text-[10px] uppercase bg-[#e0effb] text-[#509ee3] border-[#badcf7]">
                v0.1.0 Beta
              </Badge>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Open-source business intelligence platform for SQL modeling, self-serve dashboards, and natural-language AI analytics.
            </p>
          </div>

          {/* Center BI Mockup / Visual Highlight */}
          <div className="relative z-10 my-8 space-y-4">
            {/* Thoughtspot-style AI Question Chip */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3 max-w-lg">
              <div className="p-2 rounded-lg bg-[#f0f7fd] text-[#509ee3] border border-[#e0effb]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs flex-1">
                <div className="text-slate-400 font-mono text-[10px] uppercase tracking-wider font-semibold">AI Semantic Query</div>
                <div className="text-slate-800 font-medium">&quot;Show me weekly net revenue by region for last quarter&quot;</div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Instant SQL
              </Badge>
            </div>

            {/* SQL & Metrics Preview Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/40 space-y-4 max-w-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-mono font-medium">
                  <Database className="w-3.5 h-3.5 text-[#509ee3]" />
                  <span>warehouse.analytics.orders_mart</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% YoY</span>
                </div>
              </div>

              {/* Stat Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-500 text-xs font-medium">Annual Recurring Revenue</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">$4,850,230</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-slate-500 text-xs font-medium">Active Analytical Queries</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">12,419 / hr</div>
                </div>
              </div>

              {/* SQL snippet teaser */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 leading-relaxed">
                <span className="text-[#509ee3] font-semibold">SELECT</span> date_trunc(<span className="text-amber-600">&apos;month&apos;</span>, created_at), <span className="text-[#509ee3] font-semibold">SUM</span>(amount)<br />
                <span className="text-[#509ee3] font-semibold">FROM</span> analytics.billing_events <span className="text-[#509ee3] font-semibold">GROUP BY</span> 1;
              </div>
            </div>

            {/* Supported Connectors */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-500 mr-1 flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Connectors:
              </span>
              {['PostgreSQL', 'BigQuery', 'Snowflake', 'DuckDB', 'ClickHouse'].map((source) => (
                <span
                  key={source}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 pt-4 border-t border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#509ee3] shrink-0" />
            <span>Enterprise-grade RBAC, OAuth2 Authentication, and multi-tenant organization workspaces.</span>
          </div>
        </div>

        {/* Right Section: Interactive Auth Form (Login / Register) */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-md space-y-6">
            <Tabs value={mode} onValueChange={(val) => handleModeChange(val as 'login' | 'register')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-slate-100 border border-slate-200 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#509ee3] data-[state=active]:shadow-2xs">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-[#509ee3] data-[state=active]:shadow-2xs">
                  Register Organization
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-100">
                <TabsContent value="login" className="mt-0 focus-visible:outline-none">
                  <LoginForm onSwitchToRegister={() => handleModeChange('register')} />
                </TabsContent>
                <TabsContent value="register" className="mt-0 focus-visible:outline-none">
                  <RegisterForm onSwitchToLogin={() => handleModeChange('login')} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
