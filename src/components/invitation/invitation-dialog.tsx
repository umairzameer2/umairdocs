'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Building2,
  Mail,
  UserPlus,
  Check,
  X,
  Loader2,
  AlertCircle,
  Shield,
  Eye,
  User,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface InvitationDetails {
  id: string
  email: string
  role: string
  expiresAt: string
  organization: {
    id: string
    name: string
    icon: string
    description: string
  }
  inviter: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  userExists: boolean
}

interface InvitationDialogProps {
  token: string
  onClose: () => void
}

type Step = 'loading' | 'details' | 'signup' | 'accepting' | 'accepted' | 'error' | 'expired'

export function InvitationDialog({ token, onClose }: InvitationDialogProps) {
  const { user, isAuthenticated, setUser, setCurrentView } = useAppStore()
  const [step, setStep] = useState<Step>('loading')
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  // Signup fields
  const [signupName, setSignupName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')

  // Fetch invitation details
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invitations/${token}`)
        const data = await res.json()

        if (!data.success) {
          if (data.expired || data.accepted) {
            setStep('expired')
            setErrorMessage(data.error)
          } else {
            setStep('error')
            setErrorMessage(data.error || 'Invitation not found')
          }
          return
        }

        setInvitation(data.invitation)
        setSignupName(data.invitation.email.split('@')[0])

        // If user is logged in and it's their email, go straight to details
        // If user is logged in but different email, show details with option to accept
        // If not logged in, check if user exists
        if (data.invitation.userExists && !isAuthenticated) {
          setStep('details') // They need to log in first
        } else if (isAuthenticated) {
          setStep('details')
        } else {
          setStep('details') // Show details, they can sign up
        }
      } catch {
        setStep('error')
        setErrorMessage('Failed to load invitation')
      }
    }

    fetchInvitation()
  }, [token, isAuthenticated])

  // Accept invitation
  const handleAccept = useCallback(async () => {
    if (!invitation) return

    // If not logged in and user doesn't exist, need to create account
    if (!isAuthenticated && !invitation.userExists) {
      if (!signupPassword || signupPassword.length < 6) {
        toast({ title: 'Password required', description: 'Please set a password (min 6 characters)', variant: 'destructive' })
        return
      }
      if (signupPassword !== signupConfirm) {
        toast({ title: 'Passwords don\'t match', description: 'Please make sure both passwords match', variant: 'destructive' })
        return
      }
    }

    setIsAccepting(true)
    try {
      const body: Record<string, string> = {}
      if (!isAuthenticated) {
        if (!invitation.userExists) {
          body.name = signupName
          body.password = signupPassword
        }
      } else {
        body.userId = user?.id || ''
      }

      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        setStep('accepted')
        setIsAccepting(false)
        // If a new user was created, auto-login
        if (data.user && !isAuthenticated) {
          setUser(data.user)
          setCurrentView('home')
        }
        toast({
          title: 'Welcome aboard! 🎉',
          description: `You've joined ${invitation.organization.name}`,
        })
      } else if (data.needsSignup) {
        setStep('signup')
        setIsAccepting(false)
      } else {
        setStep('error')
        setErrorMessage(data.error || 'Failed to accept invitation')
        setIsAccepting(false)
      }
    } catch {
      setStep('error')
      setErrorMessage('Network error. Please try again.')
      setIsAccepting(false)
    }
  }, [invitation, isAuthenticated, user, signupName, signupPassword, signupConfirm, token, setUser, setCurrentView])

  // Auto-close dialog after accepting invitation
  useEffect(() => {
    if (step === 'accepted') {
      const timer = setTimeout(() => {
        onClose()
      }, 2500) // 2.5 seconds to see the success animation
      return () => clearTimeout(timer)
    }
  }, [step, onClose])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-purple-500" />
      case 'member': return <User className="w-4 h-4 text-green-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-amber-500" />
      default: return <User className="w-4 h-4 text-slate-500" />
    }
  }

  const inviterInitials = invitation?.inviter?.name
    ? invitation.inviter.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : invitation?.inviter?.email?.[0]?.toUpperCase() || '?'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== 'accepting') onClose()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
        >
          {/* Loading State */}
          {step === 'loading' && (
            <div className="p-12 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">Loading invitation...</p>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          )}

          {/* Expired State */}
          {step === 'expired' && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-amber-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Invitation Expired</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage || 'This invitation has expired or already been used.'}</p>
              </div>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          )}

          {/* Details State */}
          {(step === 'details' || step === 'signup') && invitation && (
            <>
              {/* Header with org info */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-6 text-white text-center">
                <div className="text-3xl mb-2">{invitation.organization.icon || '🏢'}</div>
                <h2 className="text-xl font-bold">{invitation.organization.name}</h2>
                {invitation.organization.description && (
                  <p className="text-purple-100 text-sm mt-1">{invitation.organization.description}</p>
                )}
              </div>

              <div className="p-6">
                {/* Inviter info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-xl">
                  <Avatar className="h-9 w-9 border border-border">
                    {invitation.inviter.avatar && <AvatarImage src={invitation.inviter.avatar} alt="" />}
                    <AvatarFallback className="bg-purple-500/10 text-purple-500 text-xs font-semibold">
                      {inviterInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {invitation.inviter.name || invitation.inviter.email}
                    </p>
                    <p className="text-xs text-muted-foreground">invited you to join</p>
                  </div>
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-purple-500/10 rounded-xl">
                  {getRoleIcon(invitation.role)}
                  <div>
                    <p className="text-xs text-purple-500 font-medium">
                      Role: <span className="capitalize">{invitation.role}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {invitation.role === 'admin' && 'Full access to manage the organization'}
                      {invitation.role === 'member' && 'Can create and edit documents'}
                      {invitation.role === 'viewer' && 'Read-only access to documents'}
                    </p>
                  </div>
                </div>

                {/* Email info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invitation sent to: <strong className="text-foreground">{invitation.email}</strong></span>
                </div>

                {/* Signup fields for new users */}
                {!isAuthenticated && !invitation.userExists && (
                  <div className="space-y-3 mb-4 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-foreground">Create your account to accept</p>
                    <div>
                      <Label htmlFor="inv-name" className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        id="inv-name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inv-pass" className="text-xs text-muted-foreground">Password</Label>
                      <Input
                        id="inv-pass"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inv-confirm" className="text-xs text-muted-foreground">Confirm Password</Label>
                      <Input
                        id="inv-confirm"
                        type="password"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        placeholder="Confirm your password"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Login prompt for existing users who aren't logged in */}
                {!isAuthenticated && invitation.userExists && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                    <p className="text-xs text-amber-600">
                      An account with this email already exists. Please log in first, then accept the invitation from your dashboard.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isAccepting}
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={
                      isAccepting ||
                      (!isAuthenticated && !invitation.userExists && (!signupPassword || signupPassword.length < 6))
                    }
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept & Join
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Accepting State */}
          {step === 'accepting' && (
            <div className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="text-foreground font-medium">Joining organization...</p>
            </div>
          )}

          {/* Accepted State */}
          {step === 'accepted' && invitation && (
            <div className="p-8 flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Welcome to {invitation.organization.name}! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You've joined as a <span className="capitalize font-medium">{invitation.role}</span>
                </p>
              </div>
              <Button
                onClick={onClose}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}