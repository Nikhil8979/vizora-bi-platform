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
import { OrganizationRole } from '@/types/members'
import { useInviteMemberMutation } from './hooks'
import { Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  organizationName?: string
}

const ROLES: Array<{
  value: OrganizationRole
  title: string
  description: string
}> = [
  {
    value: 'ANALYST',
    title: 'Analyst',
    description: 'Can query datasources, build semantic models, and create dashboards.',
  },
  {
    value: 'VIEWER',
    title: 'Viewer',
    description: 'Can view and interact with shared dashboards and queries.',
  },
  {
    value: 'ADMIN',
    title: 'Admin',
    description: 'Can configure datasources, invite team members, and manage workspace.',
  },
  {
    value: 'OWNER',
    title: 'Owner',
    description: 'Full workspace ownership including organization deletion.',
  },
]

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRole>('ANALYST')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const inviteMutation = useInviteMemberMutation(organizationId, {
    onSuccess: () => {
      setSuccessMessage('Invitation sent successfully!')
      setErrorMessage(null)
      setTimeout(() => {
        setEmail('')
        setRole('ANALYST')
        setSuccessMessage(null)
        onOpenChange(false)
      }, 1200)
    },
    onError: (msg) => {
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage('Please enter a valid user email address')
      return
    }

    inviteMutation.mutate({
      email: email.trim(),
      role,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#509ee3]" />
            Invite Member to Workspace
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs">
            Add a colleague to <strong className="text-slate-700">{organizationName || 'this organization'}</strong>. Note that the user must already have a Vizora account.
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
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs font-semibold text-slate-700">
              User Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 bg-slate-50/50 border-slate-200 text-sm focus-visible:ring-[#509ee3]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Permission Role</Label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const isSelected = role === r.value
                return (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#509ee3] bg-[#f0f7fd] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Custom Radio Circle */}
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-[#509ee3] bg-[#509ee3]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-900">{r.title}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            isSelected
                              ? 'text-[#509ee3] bg-[#e0effb]'
                              : 'text-slate-500 bg-slate-100'
                          }`}
                        >
                          {r.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{r.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

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
              isLoading={inviteMutation.isPending}
              className="bg-[#509ee3] hover:bg-[#438bc8] active:bg-[#3b7cb4] text-white cursor-pointer font-semibold shadow-md shadow-blue-500/20"
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
