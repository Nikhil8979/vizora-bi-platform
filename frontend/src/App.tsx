import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AuthPage } from '@/features/auth/AuthPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardOverview } from '@/components/dashboard/DashboardOverview'
import { MembersPage } from '@/features/members/MembersPage'
import { DataSourcesPage } from '@/features/datasources/DataSourcesPage'
import { SqlEditorPage } from '@/features/query-engine/SqlEditorPage'
import { QueryBuilderPage } from '@/features/query-builder'
import { QuestionDetailPage } from '@/features/query-engine/QuestionDetailPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

// Protected Route Guard
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <AppLayout />
}

// Public Auth Route Guard (Redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/overview" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage initialMode="login" />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthPage initialMode="register" />
          </PublicRoute>
        }
      />

      {/* Protected Application Workspace Pages */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<DashboardOverview />} />
        <Route path="/datasources" element={<DataSourcesPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/workbench" element={<SqlEditorPage />} />
        <Route path="/sql-editor" element={<SqlEditorPage />} />
        <Route path="/query-builder" element={<QueryBuilderPage />} />
        <Route path="/explore" element={<Navigate to="/query-builder" replace />} />
        <Route path="/question/:questionId" element={<QuestionDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
