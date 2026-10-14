import React, { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterMutation } from './hooks'

interface RegisterFormProps {
  onSwitchToLogin: () => void
  onSuccess?: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const registerMutation = useRegisterMutation({
    onSuccess: () => {
      setSuccessMessage('Organization & Account created successfully! Launching workspace...')
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

    if (!fullName.trim() || !email.trim() || !organizationName.trim()) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      organizationName: organizationName.trim(),
      password,
      confirmPassword,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Organization Workspace
        </h2>
        <p className="text-sm text-slate-500">
          Get started with Vizora BI Platform for your analytics team
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="reg-name"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-org">Organization Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="reg-org"
                placeholder="Acme Analytics"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Work Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="alex@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-11 bg-slate-50/50 border-slate-200"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 6 chars"
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

          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 h-11 bg-slate-50/50 border-slate-200"
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer mt-2"
          isLoading={registerMutation.isPending}
        >
          <span>Create Workspace & Start Free</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-slate-500">
        Already registered with an organization?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#509ee3] hover:text-[#438bc8] hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
