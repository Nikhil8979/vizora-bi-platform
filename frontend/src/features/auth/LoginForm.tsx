import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from './hooks'

interface LoginFormProps {
  onSwitchToRegister: () => void
  onSuccess?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      setSuccessMessage('Logged in successfully! Redirecting...')
      setErrorMessage(null)
      onSuccess?.()
    },
    onError: (msg) => {
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password')
      return
    }

    loginMutation.mutate({ email: email.trim(), password })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500">
          Sign in to access your analytics dashboards and queries
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="analyst@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-11 bg-slate-50/50 border-slate-200"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 h-11 bg-slate-50/50 border-slate-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          isLoading={loginMutation.isPending}
        >
          <span>Sign In to Vizora</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-slate-500">
        Don&apos;t have an organization account yet?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-[#509ee3] hover:text-[#438bc8] hover:underline cursor-pointer"
        >
          Create one now
        </button>
      </div>
    </div>
  )
}
