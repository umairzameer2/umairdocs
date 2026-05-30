'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Trash2,
  Camera,
  Plus,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Key,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  FileText,
  Star,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return email?.[0]?.toUpperCase() || 'U'
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'mobile': return <Smartphone className="w-4 h-4" />
    case 'tablet': return <Tablet className="w-4 h-4" />
    default: return <Monitor className="w-4 h-4" />
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Crop Helper ───────────────────────────────────────────────────
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = new Image()
  image.src = imageSrc

  await new Promise((resolve) => {
    image.onload = resolve
  })

  const canvas = document.createElement('canvas')
  const MAX_SIZE = 200
  canvas.width = MAX_SIZE
  canvas.height = MAX_SIZE
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    MAX_SIZE,
    MAX_SIZE
  )

  return canvas.toDataURL('image/jpeg', 0.7)
}

// ─── Email Configuration Card ──────────────────────────────────────
function EmailConfigCard() {
  const [emailConfig, setEmailConfig] = useState<{ configured: boolean; provider: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings/email-config')
      .then((r) => r.json())
      .then((data) => setEmailConfig(data))
      .catch(() => setEmailConfig({ configured: false, provider: 'none' }))
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-500" />
            Email Service
          </CardTitle>
          <CardDescription>Status of email delivery for invitations and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {!emailConfig ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking email service...
            </div>
          ) : emailConfig.configured ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  Email service is active
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Using <span className="font-medium capitalize">{emailConfig.provider}</span> provider. Invitation emails will be sent to recipients.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700">
                  Email service not configured
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invitation emails will not be sent. You can still invite members — a shareable link will be provided instead. To enable email delivery, add one of these to your <code className="px-1 py-0.5 bg-muted rounded text-[11px] font-mono">.env</code> file:
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="text-xs bg-muted p-2 rounded-lg font-mono">
                    <span className="text-purple-500">RESEND_API_KEY</span>=re_xxxxxxxx
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Or configure SMTP: <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">SMTP_HOST</code>, <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">SMTP_USER</code>, <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">SMTP_PASS</code>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Get a free API key at{' '}
                    <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                      resend.com
                    </a>{' '}
                    (100 free emails/day)
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SettingsPage() {
  const {
    user, setCurrentView, fetchEmails, fetchSessions,
    updateProfile, deleteAvatar, addEmail, removeEmail, makeEmailPrimary,
    changePassword, revokeSession, deleteAccount, registerSession, avatarVersion,
  } = useAppStore()

  // Active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'account'>('profile')

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Crop state
  const [cropMode, setCropMode] = useState(false)
  const [rawImageUrl, setRawImageUrl] = useState('')
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // Email state
  const [addEmailDialogOpen, setAddEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  // Account deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const emails = useAppStore((s) => s.userEmails)
  const sessions = useAppStore((s) => s.userSessions)
  const initials = getInitials(user?.name ?? null, user?.email ?? '')

  // Fetch data on mount
  useEffect(() => {
    fetchEmails()
    fetchSessions()
    // Register current session
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'
    let deviceType = 'desktop'

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edg')) browser = 'Edge'

    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile' }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = ua.includes('iPad') ? 'tablet' : 'mobile' }

    registerSession({
      deviceName: `${os} - ${browser}`,
      deviceType,
      browser,
      os,
    })
  }, [fetchEmails, fetchSessions, registerSession])

  // Profile handlers
  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true)
    try {
      const success = await updateProfile(profileName)
      if (success) {
        toast({ title: 'Profile updated', description: 'Your profile has been saved' })
      } else {
        toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
      }
    } finally {
      setIsSavingProfile(false)
    }
  }, [profileName, updateProfile])

  const handleAvatarUpload = useCallback(async () => {
    // In a real app, this would upload to a storage service
    // For now, we'll use a placeholder data URL or the URL input
    if (!avatarUrl.trim()) {
      toast({ title: 'Enter a URL', description: 'Please enter an image URL for your avatar' })
      return
    }
    setIsSavingProfile(true)
    try {
      const success = await updateProfile(undefined, avatarUrl.trim())
      if (success) {
        setAvatarDialogOpen(false)
        setAvatarUrl('')
        toast({ title: 'Avatar updated', description: 'Your profile photo has been updated' })
      } else {
        toast({ title: 'Error', description: 'Failed to update avatar', variant: 'destructive' })
      }
    } finally {
      setIsSavingProfile(false)
    }
  }, [avatarUrl, updateProfile])

  const handleDeleteAvatar = useCallback(async () => {
    const success = await deleteAvatar()
    if (success) {
      toast({ title: 'Photo removed', description: 'Your profile photo has been deleted' })
    } else {
      toast({ title: 'Error', description: 'Failed to remove photo', variant: 'destructive' })
    }
  }, [deleteAvatar])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      if (!result) return
      // Enter crop mode instead of immediately compressing
      setRawImageUrl(result)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setCropMode(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixelsVal: any) => {
    setCroppedAreaPixels(croppedAreaPixelsVal)
  }, [])

  const handleCropSave = useCallback(async () => {
    if (!rawImageUrl || !croppedAreaPixels) return
    try {
      const croppedDataUrl = await getCroppedImg(rawImageUrl, croppedAreaPixels)
      setAvatarUrl(croppedDataUrl)
      setCropMode(false)
      setRawImageUrl('')
    } catch {
      toast({ title: 'Crop failed', description: 'Could not crop the image. Please try again.', variant: 'destructive' })
    }
  }, [rawImageUrl, croppedAreaPixels])

  // Email handlers
  const handleAddEmail = useCallback(async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address' })
      return
    }
    setAddingEmail(true)
    try {
      const success = await addEmail(newEmail.trim())
      if (success) {
        setAddEmailDialogOpen(false)
        setNewEmail('')
        toast({ title: 'Email added', description: `${newEmail} has been added to your account` })
      } else {
        toast({ title: 'Error', description: 'Failed to add email. It may already be in use.', variant: 'destructive' })
      }
    } finally {
      setAddingEmail(false)
    }
  }, [newEmail, addEmail])

  const handleRemoveEmail = useCallback(async (emailId: string, email: string) => {
    const success = await removeEmail(emailId)
    if (success) {
      toast({ title: 'Email removed', description: `${email} has been removed` })
    } else {
      toast({ title: 'Error', description: 'Cannot remove primary email', variant: 'destructive' })
    }
  }, [removeEmail])

  const handleMakePrimary = useCallback(async (emailId: string, email: string) => {
    const success = await makeEmailPrimary(emailId)
    if (success) {
      toast({ title: 'Primary email changed', description: `${email} is now your primary email` })
    } else {
      toast({ title: 'Error', description: 'Failed to change primary email', variant: 'destructive' })
    }
  }, [makeEmailPrimary])

  // Password handler
  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', description: 'Please confirm your new password' })
      return
    }

    // Reset mode: verify email and reset password without current password
    if (resetMode) {
      if (resetEmail.trim().toLowerCase() !== user?.email.toLowerCase()) {
        toast({ title: 'Email doesn\'t match', description: 'Please enter your account email to verify your identity', variant: 'destructive' })
        return
      }
      setChangingPassword(true)
      try {
        const success = await changePassword('', newPassword, true)
        if (success) {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setResetMode(false)
          setResetEmail('')
          toast({
            title: 'Password reset',
            description: 'Your password has been reset successfully',
          })
        } else {
          toast({ title: 'Error', description: 'Failed to reset password', variant: 'destructive' })
        }
      } finally {
        setChangingPassword(false)
      }
      return
    }

    // Email users must provide current password
    if (user?.authProvider !== 'google' && !currentPassword) {
      toast({ title: 'Current password required', description: 'Please enter your current password' })
      return
    }
    setChangingPassword(true)
    try {
      const success = await changePassword(currentPassword, newPassword)
      if (success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast({
          title: user?.authProvider === 'google' ? 'Password set' : 'Password changed',
          description: user?.authProvider === 'google'
            ? 'You can now sign in with your email and password'
            : 'Your password has been updated successfully',
        })
      } else {
        toast({ title: 'Error', description: 'Current password is incorrect', variant: 'destructive' })
      }
    } finally {
      setChangingPassword(false)
    }
  }, [currentPassword, newPassword, confirmPassword, changePassword, user?.authProvider, resetMode, resetEmail, user?.email])

  // Session handler
  const handleRevokeSession = useCallback(async (sessionId: string, deviceName: string) => {
    const success = await revokeSession(sessionId)
    if (success) {
      toast({ title: 'Session revoked', description: `${deviceName} has been logged out` })
    } else {
      toast({ title: 'Error', description: 'Cannot revoke current session', variant: 'destructive' })
    }
  }, [revokeSession])

  // Account deletion
  const handleDeleteAccount = useCallback(() => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') return
    setDeleteDialogOpen(true)
  }, [deleteConfirmText])

  const confirmDeleteAccount = useCallback(async () => {
    setDeletingAccount(true)
    try {
      const success = await deleteAccount()
      if (success) {
        // Clear all persisted state from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('umairdocs-storage')
        }
        toast({ title: 'Account deleted', description: 'Your account has been permanently deleted' })
      } else {
        toast({ title: 'Error', description: 'Failed to delete account. Please try again.', variant: 'destructive' })
        setDeletingAccount(false)
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' })
      setDeletingAccount(false)
      setDeleteDialogOpen(false)
    }
  }, [deleteAccount])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted" onClick={() => setCurrentView('home')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-foreground">Settings</span>
              </div>
            </div>

          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-row w-full bg-card border border-border shadow-sm rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-50 text-purple-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-purple-50 text-purple-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'account'
                ? 'bg-red-50 text-red-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Account
          </button>
        </div>

        <div className="space-y-6 mt-6">
        {/* ═══ PROFILE TAB ═══ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription>Update your personal information and profile photo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar key={`avatar-settings-${avatarVersion}`} className="h-24 w-24 border-4 border-purple-100 shadow-lg">
                        {user?.avatar ? <AvatarImage src={user.avatar} alt="Profile photo" /> : null}
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => setAvatarDialogOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{user?.name || 'User'}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAvatarDialogOpen(true)}>
                          <Camera className="w-3.5 h-3.5" />
                          Change Photo
                        </Button>
                        {user?.avatar && (
                          <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDeleteAvatar}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Name Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">Display Name</Label>
                    <div className="flex gap-3">
                      <Input
                        id="profile-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter your display name"
                        className="flex-1 h-10"
                      />
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || profileName === (user?.name || '')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                      >
                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email Service Status */}
            <EmailConfigCard />

            {/* Connected Emails */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="w-5 h-5 text-purple-500" />
                        Email Addresses
                      </CardTitle>
                      <CardDescription className="mt-1">Manage your connected email addresses</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setAddEmailDialogOpen(true)}
                      disabled={emails.length >= 5}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Email
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {emails.map((emailRecord, index) => (
                        <motion.div
                          key={emailRecord.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-muted-foreground/30 hover:bg-muted/50 transition-all group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            emailRecord.isPrimary ? 'bg-purple-500/10 text-purple-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{emailRecord.email}</p>
                              {emailRecord.isPrimary && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">
                                  <Star className="w-2.5 h-2.5 mr-0.5" />
                                  Primary
                                </Badge>
                              )}
                              {emailRecord.verified && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                                  <Check className="w-2.5 h-2.5 mr-0.5" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Added {formatDateTime(emailRecord.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!emailRecord.isPrimary && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={() => handleMakePrimary(emailRecord.id, emailRecord.email)}
                                >
                                  Make Primary
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove email address?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove <strong>{emailRecord.email}</strong> from your account. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => handleRemoveEmail(emailRecord.id, emailRecord.email)}
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {emails.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm">No email addresses found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
            {/* Change/Set Password */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-purple-500" />
                    {resetMode ? 'Reset Password' : user?.authProvider === 'google' ? 'Set Password' : 'Change Password'}
                  </CardTitle>
                  <CardDescription>
                    {resetMode
                      ? 'Verify your email to reset your password without the current one'
                      : user?.authProvider === 'google'
                        ? 'You signed in with Google. Set a password to also login with email.'
                        : 'Update your account password'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reset mode: email verification */}
                  {resetMode && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-700">
                          To reset your password, please confirm your account email address for verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {resetMode && (
                    <div className="grid gap-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">Confirm Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your account email"
                        className="h-10"
                      />
                    </div>
                  )}

                  {/* Show current password field only for email users (not in reset mode) */}
                  {!resetMode && user?.authProvider !== 'google' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="current-password" className="text-sm font-medium text-foreground">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="pr-10 h-10"
                          />
                          <button
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={() => { setResetMode(true); setCurrentPassword('') }}
                          className="text-xs text-purple-600 hover:text-purple-700 hover:underline cursor-pointer text-left"
                        >
                          Forgot your password?
                        </button>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Info banner for Google users */}
                  {!resetMode && user?.authProvider === 'google' && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <Globe className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-purple-700">
                        Your account was created with Google sign-in. Setting a password allows you to also sign in with your email address.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className="pr-10 h-10"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 6 && (
                      <p className="text-xs text-amber-600">Password must be at least 6 characters</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="h-10"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">Passwords don&apos;t match</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6 || (resetMode && !resetEmail.trim()) || (!resetMode && user?.authProvider !== 'google' && !currentPassword)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {changingPassword ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />{resetMode ? 'Resetting...' : user?.authProvider === 'google' ? 'Setting...' : 'Changing...'}</>
                      ) : (
                        <><Key className="w-4 h-4 mr-2" />{resetMode ? 'Reset Password' : user?.authProvider === 'google' ? 'Set Password' : 'Change Password'}</>
                      )}
                    </Button>
                    {resetMode && (
                      <Button
                        variant="outline"
                        onClick={() => { setResetMode(false); setResetEmail('') }}
                        className="text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Sessions / Devices */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-purple-500" />
                    Logged-in Devices
                  </CardTitle>
                  <CardDescription>Track and manage devices where your account is signed in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {sessions.map((session, index) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
                            session.isCurrent
                              ? 'border-purple-200 bg-purple-50/30'
                              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                            session.isCurrent
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getDeviceIcon(session.deviceType)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {session.deviceName}
                              </p>
                              {session.isCurrent && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {session.browser} • {session.os}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                IP: {session.ipAddress}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.isCurrent ? 'Active now' : `Last active ${formatDateTime(session.lastActive)}`}
                              <span className="mx-1">•</span>
                              Signed in {formatDateTime(session.createdAt)}
                            </p>
                          </div>

                          {!session.isCurrent && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1">
                                    <X className="w-3.5 h-3.5" />
                                    Revoke
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will sign out <strong>{session.deviceName}</strong>. The device will need to sign in again.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => handleRevokeSession(session.id, session.deviceName)}
                                    >
                                      Revoke Session
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {sessions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Monitor className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm">No active sessions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            </div>
          )}

          {/* ═══ ACCOUNT TAB ═══ */}
          {activeTab === 'account' && (
            <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions that affect your account permanently</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h4 className="font-semibold text-red-800 mb-2">Delete Your Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data, including documents, organizations, and settings.
                      This action <strong>cannot be undone</strong>.
                    </p>
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-red-800">
                          Type <strong>DELETE</strong> to confirm
                        </Label>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="h-10 border-red-300 focus:border-red-500 focus:ring-red-200/20 bg-card"
                        />
                      </div>
                      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deletingAccount) setDeleteDialogOpen(open) }}>
                        <Button
                          variant="destructive"
                          disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || deletingAccount}
                          onClick={handleDeleteAccount}
                          className="gap-2"
                        >
                          {deletingAccount ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</>
                          ) : (
                            <><Trash2 className="w-4 h-4" />Delete My Account Permanently</>
                          )}
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action <strong>cannot be undone</strong>. This will permanently delete your account
                              and remove all of your data from our servers, including all documents, organizations, and settings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
                            <Button
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={confirmDeleteAccount}
                              disabled={deletingAccount}
                            >
                              {deletingAccount ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                              ) : (
                                'Yes, delete my account'
                              )}
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/50 backdrop-blur-sm mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2025 UmairDocs. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ DIALOGS ═══ */}

      {/* Avatar Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={(open) => {
        setAvatarDialogOpen(open)
        if (!open) {
          setCropMode(false)
          setRawImageUrl('')
          setAvatarUrl('')
          setZoom(1)
          setCrop({ x: 0, y: 0 })
          setCroppedAreaPixels(null)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              {cropMode ? 'Crop Your Photo' : 'Change Profile Photo'}
            </DialogTitle>
            <DialogDescription>
              {cropMode ? 'Drag to reposition and use the slider to zoom' : 'Upload a new photo or enter an image URL'}
            </DialogDescription>
          </DialogHeader>

          {cropMode ? (
            <div className="grid gap-4 py-2">
              {/* Crop area */}
              <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                <Cropper
                  image={rawImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 accent-purple-600 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-8 text-right">{zoom.toFixed(1)}×</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-purple-100">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid gap-3">
                <Label className="text-sm font-medium text-foreground">Upload Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  value=""
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Choose File
                </Button>

                <Separator className="my-1">
                  <span className="text-xs text-muted-foreground px-2">or</span>
                </Separator>

                <Label className="text-sm font-medium text-foreground">Image URL</Label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={avatarUrl.startsWith('data:')}
                />
                {avatarUrl.startsWith('data:') && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    File selected
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {cropMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCropMode(false)
                    setRawImageUrl('')
                    setZoom(1)
                    setCrop({ x: 0, y: 0 })
                    setCroppedAreaPixels(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCropSave}
                  disabled={!croppedAreaPixels}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Crop
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setAvatarDialogOpen(false); setAvatarUrl('') }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAvatarUpload}
                  disabled={!avatarUrl.trim() || isSavingProfile}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Update Photo
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Email Dialog */}
      <Dialog open={addEmailDialogOpen} onOpenChange={setAddEmailDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              Add Email Address
            </DialogTitle>
            <DialogDescription>
              Add a new email address to your account ({emails.length}/5)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-email-input">Email address</Label>
              <Input
                id="new-email-input"
                type="email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddEmailDialogOpen(false); setNewEmail('') }} disabled={addingEmail}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEmail}
              disabled={addingEmail || !newEmail.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {addingEmail ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Add Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}