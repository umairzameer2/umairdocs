'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Copy,
  Check,
  Link2,
  Users,
  Mail,
  Shield,
  Eye,
  UserPlus,
  AlertCircle,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { RemoteUser } from './use-collaboration'

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Share Dialog ─────────────────────────────────────────────────────

interface InviteResult {
  acceptUrl: string
  emailConfigured: boolean
  emailSent?: boolean
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentTitle: string
  remoteUsers: RemoteUser[]
  onInviteMember: (email: string, role: string) => Promise<InviteResult | { error: string } | null>
}

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  remoteUsers,
  onInviteMember,
}: ShareDialogProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [copied, setCopied] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null)
  const [inviting, setInviting] = useState(false)
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null)

  // Check email config when dialog opens
  useEffect(() => {
    if (open && emailConfigured === null) {
      fetch('/api/settings/email-config')
        .then((r) => r.json())
        .then((data) => setEmailConfigured(data.configured))
        .catch(() => setEmailConfigured(false))
    }
    if (!open) {
      setInviteResult(null)
    }
  }, [open, emailConfigured])

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/?doc=${documentId}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast({ title: 'Link copied', description: 'Share link copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Failed to copy', description: 'Please copy the link manually', variant: 'destructive' })
    }
  }

  const handleCopyAcceptUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: 'Link copied', description: 'Invitation link copied to clipboard' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Failed to copy', description: 'Please copy the link manually', variant: 'destructive' })
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address' })
      return
    }
    setInviting(true)
    try {
      const result = await onInviteMember(inviteEmail.trim(), inviteRole)
      if (result && 'error' in result) {
        toast({ title: 'Invitation failed', description: result.error, variant: 'destructive' })
      } else if (result && !('error' in result)) {
        setInviteResult(result)
        toast({
          title: result.emailConfigured ? 'Invitation sent!' : 'Invitation created!',
          description: result.emailConfigured
            ? `An invitation email has been sent to ${inviteEmail}`
            : `Email not configured — copy the invitation link below to share manually`,
        })
        setInviteEmail('')
      } else {
        toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
      }
    } finally {
      setInviting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Share & Collaborate
          </DialogTitle>
          <DialogDescription>
            Invite others to collaborate on &quot;{documentTitle}&quot; in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Share Link
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="h-9 text-xs bg-slate-50 dark:bg-slate-900"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-green-500" />Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" />Copy</>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Anyone with this link can view the document. Only invited members can edit.
            </p>
          </div>

          <Separator />

          {/* Invite by email */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Invite Collaborator
            </Label>

            {/* Email not configured warning */}
            {emailConfigured === false && !inviteResult && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-2.5 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Email service is not configured. An invitation link will be generated for you to share manually.
                </p>
              </div>
            )}

            {/* Post-invitation: show accept URL when email not configured */}
            {inviteResult && !inviteResult.emailConfigured && (
              <div className="space-y-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Email not sent — copy the invitation link below and share it manually.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteResult.acceptUrl}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-900 font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 shrink-0"
                    onClick={() => handleCopyAcceptUrl(inviteResult.acceptUrl)}
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5 text-green-500" />Copied</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" />Copy</>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  This invitation link expires in 7 days.
                </p>
              </div>
            )}

            {/* Post-invitation: success message when email IS configured */}
            {inviteResult && inviteResult.emailConfigured && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-2.5 flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-green-700 dark:text-green-300">
                  Invitation email sent successfully.
                </p>
              </div>
            )}

            {!inviteResult && (
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
                  className="flex-1 h-9 text-sm"
                />
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-md p-0.5">
                  <button
                    onClick={() => setInviteRole('member')}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      inviteRole === 'member'
                        ? 'bg-white dark:bg-slate-600 shadow-sm font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    onClick={() => setInviteRole('viewer')}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      inviteRole === 'viewer'
                        ? 'bg-white dark:bg-slate-600 shadow-sm font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Viewer
                  </button>
                </div>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                >
                  {inviting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{emailConfigured === false ? 'Create' : 'Invite'}</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Active collaborators */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Active Collaborators
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {remoteUsers.length + 1}
              </Badge>
            </Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {/* Current user (You) */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
                <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-purple-700">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px] font-semibold">
                    You
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">You</p>
                  <p className="text-[10px] text-slate-400">Admin &middot; Editing now</p>
                </div>
                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700 text-[9px] px-1.5 py-0">
                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                  Admin
                </Badge>
              </div>

              {/* Remote users */}
              {remoteUsers.map((remoteUser) => (
                <motion.div
                  key={remoteUser.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Avatar className="h-8 w-8" style={{ boxShadow: `0 0 0 2px ${remoteUser.color}30` }}>
                    <AvatarFallback
                      className="text-white text-[10px] font-semibold"
                      style={{ backgroundColor: remoteUser.color }}
                    >
                      {getInitials(remoteUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {remoteUser.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{remoteUser.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-green-600 dark:text-green-400">Online</span>
                  </div>
                </motion.div>
              ))}

              {remoteUsers.length === 0 && (
                <div className="text-center py-4 text-slate-400 dark:text-slate-500">
                  <Users className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No other collaborators yet</p>
                  <p className="text-[10px] mt-0.5">Invite someone to start collaborating</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}