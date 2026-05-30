'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Building2,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  User,
  Users,
  Shield,
  Eye,
  UserPlus,
  MoreVertical,
  Trash2,
  UserCircle,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  AlertCircle,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { toast } from '@/hooks/use-toast'

// ─── Helper ────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email?.[0]?.toUpperCase() || 'U'
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'member':
      return 'bg-muted text-muted-foreground border-border'
    case 'viewer':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'admin':
      return <Shield className="w-3 h-3" />
    case 'viewer':
      return <Eye className="w-3 h-3" />
    default:
      return <User className="w-3 h-3" />
  }
}

// ─── Common emoji list for the icon picker ─────────────────────────

const ORG_EMOJIS = [
  '🏢', '🏗️', '🚀', '💡', '🎯', '📊', '🔬', '🎨', '🌍', '⚡',
  '🔒', '🎓', '🏥', '🏭', '🌾', '⛵', '🎮', '📱', '🛒', '🎵',
]

// ─── Main Component ────────────────────────────────────────────────

export function AppSidebar() {
  const {
    user,
    organizations,
    activeOrgId,
    setActiveOrgId,
    fetchOrganizations,
    createOrganization,
    deleteOrganization,
    addOrgMember,
    removeOrgMember,
    updateOrgMemberRole,
    fetchOrgChanges,
    logout,
    setCurrentView,
    avatarVersion,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore()

  // ── Local state ───────────────────────────────────────────────
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDescription, setNewOrgDescription] = useState('')
  const [newOrgIcon, setNewOrgIcon] = useState('🏢')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    acceptUrl: string
    emailSent: boolean
    emailConfigured: boolean
  } | null>(null)
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null)

  // Check email config when invite dialog opens
  useEffect(() => {
    if (inviteOpen && emailConfigured === null) {
      fetch('/api/settings/email-config')
        .then((r) => r.json())
        .then((data) => setEmailConfigured(data.configured))
        .catch(() => setEmailConfigured(false))
    }
    if (!inviteOpen) {
      // Don't reset emailConfigured on close — keep cached
    }
  }, [inviteOpen, emailConfigured])

  const [deleteOrgDialogOpen, setDeleteOrgDialogOpen] = useState(false)
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletingOrg, setDeletingOrg] = useState(false)

  // ── Derived values ────────────────────────────────────────────
  const activeOrg = organizations.find((o) => o.id === activeOrgId) || null
  const initials = getInitials(user?.name ?? null, user?.email ?? '')

  // ── Fetch orgs & changes on mount / org switch ────────────────
  useEffect(() => {
    if (user) {
      fetchOrganizations()
    }
  }, [user])

  useEffect(() => {
    if (activeOrgId) {
      fetchOrgChanges(activeOrgId)
    }
  }, [activeOrgId, fetchOrgChanges])

  // ── Handlers ──────────────────────────────────────────────────
  const handleCreateOrg = useCallback(async () => {
    if (!newOrgName.trim()) {
      toast({ title: 'Name required', description: 'Please enter an organization name' })
      return
    }
    setCreating(true)
    try {
      const org = await createOrganization(
        newOrgName.trim(),
        newOrgDescription.trim() || undefined,
        newOrgIcon || undefined,
      )
      if (org) {
        setActiveOrgId(org.id)
        toast({
          title: 'Organization created',
          description: `"${org.name}" is ready to use`,
        })
        setCreateOrgOpen(false)
        setNewOrgName('')
        setNewOrgDescription('')
        setNewOrgIcon('🏢')
      } else {
        toast({ title: 'Error', description: 'Failed to create organization', variant: 'destructive' })
      }
    } finally {
      setCreating(false)
    }
  }, [newOrgName, newOrgDescription, newOrgIcon, createOrganization, setActiveOrgId])

  const handleInviteMember = useCallback(async () => {
    if (!activeOrgId || !inviteEmail.trim()) {
      toast({ title: 'Email required', description: 'Please enter a valid email address' })
      return
    }
    setInviting(true)
    try {
      const result = await addOrgMember(activeOrgId, inviteEmail.trim(), inviteRole)
      if (result && 'error' in result) {
        // API returned an error message
        toast({ title: 'Invitation failed', description: result.error, variant: 'destructive' })
      } else if (result) {
        const { emailSent, emailConfigured, acceptUrl } = result as { emailSent?: boolean; emailConfigured?: boolean; acceptUrl?: string }
        // Store the result so the dialog can show the copy-link option
        setInviteResult({
          acceptUrl: acceptUrl || '',
          emailSent: !!emailSent,
          emailConfigured: !!emailConfigured,
        })
        toast({
          title: emailConfigured ? 'Invitation sent!' : 'Invitation created!',
          description: emailConfigured
            ? `An invitation email has been sent to ${inviteEmail}`
            : `Email not configured — copy the invitation link below to share manually`,
        })
        // Re-fetch to update members list
        fetchOrganizations()
      } else {
        toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
      }
    } finally {
      setInviting(false)
    }
  }, [activeOrgId, inviteEmail, inviteRole, addOrgMember, fetchOrganizations])

  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      const success = await removeOrgMember(memberId)
      if (success) {
        toast({ title: 'Member removed', description: `${memberName} has been removed` })
        fetchOrganizations()
      } else {
        toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' })
      }
    },
    [removeOrgMember, fetchOrganizations],
  )

  const handleChangeRole = useCallback(
    async (memberId: string, newRole: string) => {
      const success = await updateOrgMemberRole(memberId, newRole)
      if (success) {
        toast({ title: 'Role updated', description: `Role changed to ${newRole}` })
        fetchOrganizations()
      } else {
        toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
      }
    },
    [updateOrgMemberRole, fetchOrganizations],
  )

  const handleSignOut = useCallback(() => {
    logout()
    toast({ title: 'Signed out', description: 'You have been signed out successfully' })
  }, [logout])

  const handleDeleteOrg = useCallback(async () => {
    if (!deleteOrgTarget) return
    setDeletingOrg(true)
    try {
      const success = await deleteOrganization(deleteOrgTarget.id)
      if (success) {
        toast({
          title: 'Organization deleted',
          description: `"${deleteOrgTarget.name}" has been permanently deleted`,
        })
        setDeleteOrgDialogOpen(false)
        setDeleteOrgTarget(null)
      } else {
        toast({ title: 'Error', description: 'Failed to delete organization', variant: 'destructive' })
      }
    } finally {
      setDeletingOrg(false)
    }
  }, [deleteOrgTarget, deleteOrganization])

  // ── Collapsed sidebar content (icons only) ──────────────────
  if (sidebarCollapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-[68px] h-screen flex flex-col bg-card border-r border-border/80 shrink-0 overflow-hidden"
        >
          {/* Toggle button at top */}
          <div className="p-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>

          {/* Avatar / User icon */}
          <div className="px-2 pb-2 flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-xl p-1 hover:bg-muted transition-colors">
                  <Avatar key={`avatar-collapsed-${avatarVersion}`} className="h-9 w-9 border-2 border-purple-200">
                    {user?.avatar && <AvatarImage src={user.avatar} alt="Profile" />}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <Avatar key={`avatar-dropdown-collapsed-${avatarVersion}`} className="h-10 w-10 border-2 border-purple-200">
                      {user?.avatar && <AvatarImage src={user.avatar} alt="Profile" />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2"
                  onClick={() => setActiveOrgId(null)}
                >
                  <UserCircle className="w-4 h-4 mr-2 text-purple-500" />
                  Personal Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer py-2"
                  onClick={() => setCurrentView('settings')}
                >
                  <Settings className="w-4 h-4 mr-2 text-purple-500" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator className="mx-2" />

          {/* Workspace icons */}
          <ScrollArea className="flex-1">
            <div className="p-2 flex flex-col items-center gap-1">
              {/* Personal */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveOrgId(null)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      !activeOrgId
                        ? 'bg-purple-500/10 text-purple-500 shadow-sm shadow-purple-500/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Personal</TooltipContent>
              </Tooltip>

              {/* Organization icons */}
              {organizations.map((org) => (
                <Tooltip key={org.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveOrgId(org.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all duration-200 ${
                        activeOrgId === org.id
                          ? 'bg-purple-500/10 text-purple-500 shadow-sm shadow-purple-500/10'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {org.icon || <Building2 className="w-5 h-5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{org.name}</TooltipContent>
                </Tooltip>
              ))}

              {/* Create Organization */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCreateOrgOpen(true)}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-purple-600 hover:border-purple-300 hover:bg-purple-500/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Organization</TooltipContent>
              </Tooltip>
            </div>
          </ScrollArea>

          {/* Settings icon at bottom */}
          <Separator className="mx-2" />
          <div className="p-2 flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle theme</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCurrentView('settings')}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </div>

          {/* Create Organization Dialog (accessible from collapsed mode) */}
          <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  Create Organization
                </DialogTitle>
                <DialogDescription>
                  Create a new workspace to collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm text-muted-foreground w-12">Icon</Label>
                  <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-xl hover:bg-muted transition-colors">
                        {newOrgIcon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-3" align="start">
                      <div className="grid grid-cols-5 gap-2">
                        {ORG_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setNewOrgIcon(emoji)
                              setIconPickerOpen(false)
                            }}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-purple-50 transition-colors ${
                              newOrgIcon === emoji
                                ? 'bg-purple-100 ring-2 ring-purple-300'
                                : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="org-name-collapsed" className="text-sm text-muted-foreground w-12 shrink-0">Name</Label>
                  <Input
                    id="org-name-collapsed"
                    placeholder="e.g. Acme Inc."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-start gap-4">
                  <Label htmlFor="org-desc-collapsed" className="text-sm text-muted-foreground w-12 shrink-0 pt-2">Desc</Label>
                  <Input
                    id="org-desc-collapsed"
                    placeholder="Optional description..."
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOrgOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={creating || !newOrgName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Organization Dialog */}
          <Dialog open={deleteOrgDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setDeleteOrgDialogOpen(false)
              setDeleteOrgTarget(null)
            }
          }}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Delete Organization
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the organization
                  <span className="font-semibold text-foreground"> "{deleteOrgTarget?.name}"</span>,
                  all its documents, and remove all members.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <p className="text-sm text-muted-foreground bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  ⚠️ All documents and member associations will be permanently removed.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteOrgDialogOpen(false)
                    setDeleteOrgTarget(null)
                  }}
                  disabled={deletingOrg}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteOrg} disabled={deletingOrg}>
                  {deletingOrg ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Organization
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.aside>
      </TooltipProvider>
    )
  }

  // ── Expanded sidebar (default) ──────────────────────────────
  return (
    <TooltipProvider>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-[280px] h-screen flex flex-col bg-card border-r border-border/80 shrink-0 overflow-hidden"
      >
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {/* ─── Toggle button ──────────────────────────── */}
            <div className="p-2 flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
              <ThemeToggle />
            </div>

            {/* ─── 1. Personal Account Section ──────────────────────── */}
            <div className="px-4 pb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted transition-colors text-left group">
                    <Avatar key={`avatar-main-${avatarVersion}`} className="h-9 w-9 border-2 border-purple-200 shrink-0">
                      {user?.avatar && <AvatarImage src={user.avatar} alt="Profile" />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-1">
                      <Avatar key={`avatar-dropdown-${avatarVersion}`} className="h-10 w-10 border-2 border-purple-200">
                        {user?.avatar && <AvatarImage src={user.avatar} alt="Profile" />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer py-2"
                    onClick={() => setActiveOrgId(null)}
                  >
                    <UserCircle className="w-4 h-4 mr-2 text-purple-500" />
                    Personal Account
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer py-2"
                    onClick={() => setCurrentView('settings')}
                  >
                    <Settings className="w-4 h-4 mr-2 text-purple-500" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator className="mx-4 w-auto" />

            {/* ─── 2. Organization Section ──────────────────────────── */}
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                Workspace
              </p>

              {/* Personal option */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveOrgId(null)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 mb-1 ${
                  !activeOrgId
                    ? 'bg-purple-500/10 text-purple-500 shadow-sm shadow-purple-500/10'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    !activeOrgId
                      ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Personal</p>
                  <p className="text-[11px] text-muted-foreground truncate">My documents</p>
                </div>
                {!activeOrgId && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"
                  />
                )}
              </motion.button>

              {/* Organization list */}
              <AnimatePresence mode="popLayout">
                {organizations.map((org) => (
                  <motion.div
                    key={org.id}
                    layout
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 mb-1 group/org ${
                      activeOrgId === org.id
                        ? 'bg-purple-500/10 text-purple-500 shadow-sm shadow-purple-500/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <motion.button
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveOrgId(org.id)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                          activeOrgId === org.id
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {org.icon || <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{org.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                      {activeOrgId === org.id && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"
                        />
                      )}
                    </motion.button>

                    {/* Three-dot menu for organization */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover/org:opacity-100 transition-opacity p-1 rounded hover:bg-muted shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1.5">
                        <DropdownMenuItem
                          className="cursor-pointer text-xs py-2"
                          onClick={() => setActiveOrgId(org.id)}
                        >
                          <Building2 className="w-3.5 h-3.5 mr-2 text-purple-500" />
                          Switch to workspace
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50 py-2"
                          onClick={() => {
                            setDeleteOrgTarget({ id: org.id, name: org.name })
                            setDeleteOrgDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete organization
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Create Organization button */}
              <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 py-2.5 mt-1 text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 h-auto font-normal"
                  >
                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center shrink-0 group-hover:border-purple-300 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm">Create Organization</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-500" />
                      Create Organization
                    </DialogTitle>
                    <DialogDescription>
                      Create a new workspace to collaborate with your team.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    {/* Icon Picker */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm text-muted-foreground w-12">Icon</Label>
                      <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                        <PopoverTrigger asChild>
                          <button className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-xl hover:bg-muted transition-colors">
                            {newOrgIcon}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-3" align="start">
                          <div className="grid grid-cols-5 gap-2">
                            {ORG_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  setNewOrgIcon(emoji)
                                  setIconPickerOpen(false)
                                }}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-purple-50 transition-colors ${
                                  newOrgIcon === emoji
                                    ? 'bg-purple-100 ring-2 ring-purple-300'
                                    : ''
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-4">
                      <Label htmlFor="org-name" className="text-sm text-muted-foreground w-12 shrink-0">
                        Name
                      </Label>
                      <Input
                        id="org-name"
                        placeholder="e.g. Acme Inc."
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                    </div>

                    {/* Description */}
                    <div className="flex items-start gap-4">
                      <Label htmlFor="org-desc" className="text-sm text-muted-foreground w-12 shrink-0 pt-2">
                        Desc
                      </Label>
                      <Input
                        id="org-desc"
                        placeholder="Optional description..."
                        value={newOrgDescription}
                        onChange={(e) => setNewOrgDescription(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateOrgOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOrg}
                      disabled={creating || !newOrgName.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator className="mx-4 w-auto" />

            {/* ─── 4. Members Panel (when org is active) ───────────── */}
            <AnimatePresence>
              {activeOrg && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Members
                      </p>

                      {/* Invite Member */}
                      <Dialog open={inviteOpen} onOpenChange={(open) => {
                        setInviteOpen(open)
                        if (!open) {
                          setInviteEmail('')
                          setInviteRole('member')
                          setInviteResult(null)
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <UserPlus className="w-5 h-5 text-purple-500" />
                              {inviteResult ? 'Invitation Created' : emailConfigured === false ? 'Create Invitation' : 'Send Invitation'}
                            </DialogTitle>
                            <DialogDescription>
                              {inviteResult
                                ? inviteResult.emailConfigured
                                  ? `An invitation email has been sent to ${inviteEmail}`
                                  : 'Email is not configured — copy the link below to share manually'
                                : `Invite someone to join ${activeOrg.name}`}
                            </DialogDescription>
                          </DialogHeader>

                          {inviteResult ? (
                            /* ─── Post-invitation: show link ─── */
                            <div className="grid gap-4 py-4">
                              {!inviteResult.emailConfigured && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Email service is not configured. Copy the invitation link below and share it with the person you want to invite.
                                  </p>
                                </div>
                              )}
                              <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground">Invitation Link</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    readOnly
                                    value={inviteResult.acceptUrl}
                                    className="text-xs bg-muted border-0 font-mono"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 gap-1.5"
                                    onClick={() => {
                                      navigator.clipboard.writeText(inviteResult.acceptUrl)
                                      toast({ title: 'Link copied!', description: 'Invitation link copied to clipboard' })
                                    }}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  This link expires in 7 days. Anyone with this link can accept the invitation.
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* ─── Pre-invitation: form ─── */
                            <div className="grid gap-4 py-4">
                              {/* Email not configured warning */}
                              {emailConfigured === false && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                      Email service not configured
                                    </p>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                      Invitation won&apos;t be sent via email. You&apos;ll get a shareable link to send manually. Configure email in{' '}
                                      <button
                                        type="button"
                                        className="underline font-medium hover:text-amber-800 dark:hover:text-amber-200"
                                        onClick={() => {
                                          setInviteOpen(false)
                                          setCurrentView('settings')
                                        }}
                                      >
                                        Settings
                                      </button>.
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="grid gap-2">
                                <Label htmlFor="invite-email">Email address</Label>
                                <Input
                                  id="invite-email"
                                  type="email"
                                  placeholder="colleague@example.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-purple-500" />
                                        <span>Admin</span>
                                        <span className="text-xs text-muted-foreground">— Full access</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="member">
                                      <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>Member</span>
                                        <span className="text-xs text-muted-foreground">— Edit access</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                      <div className="flex items-center gap-2">
                                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Viewer</span>
                                        <span className="text-xs text-muted-foreground">— Read only</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          <DialogFooter>
                            {inviteResult ? (
                              <Button
                                onClick={() => setInviteOpen(false)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Done
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => setInviteOpen(false)}
                                  disabled={inviting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleInviteMember}
                                  disabled={inviting || !inviteEmail.trim()}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  {inviting ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                      {emailConfigured === false ? 'Creating...' : 'Sending...'}
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      {emailConfigured === false ? 'Create Invitation' : 'Send Invitation'}
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Members list */}
                    <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {activeOrg.members.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted transition-colors group"
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            {member.user.avatar ? (
                              <AvatarImage src={member.user.avatar} alt="" />
                            ) : null}
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                              {getInitials(member.user.name, member.user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {member.user.name || member.user.email}
                            </p>
                          </div>

                          {/* Clickable Role Badge — opens role change dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 font-medium gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadgeVariant(
                                  member.role,
                                )}`}
                              >
                                {getRoleIcon(member.role)}
                                {member.role}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5">
                              <DropdownMenuLabel className="text-[10px] text-muted-foreground px-2 py-1.5">
                                Change role for {member.user.name || member.user.email}
                              </DropdownMenuLabel>
                              {(['admin', 'member', 'viewer'] as const).map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  disabled={member.role === role}
                                  onClick={() => handleChangeRole(member.id, role)}
                                  className="text-xs py-1.5 gap-2"
                                >
                                  {getRoleIcon(role)}
                                  <span className="capitalize">{role}</span>
                                  {member.role === role && (
                                    <Check className="w-3 h-3 ml-auto text-purple-500" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50 py-1.5"
                                onClick={() =>
                                  handleRemoveMember(
                                    member.id,
                                    member.user.name || member.user.email,
                                  )
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      ))}

                      {activeOrg.members.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No members yet
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator className="mx-4 w-auto" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Bottom spacer / branding ──────────────────────────── */}
            {!activeOrg && (
              <div className="p-4 mt-auto">
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 text-center">
                  <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-purple-700">Collaborate with teams</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">
                    Create an organization to start
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100 h-7"
                    onClick={() => setCreateOrgOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Organization
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Delete Organization Confirmation Dialog */}
        <Dialog open={deleteOrgDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setDeleteOrgDialogOpen(false)
            setDeleteOrgTarget(null)
          }
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Organization
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the organization
                <span className="font-semibold text-foreground"> "{deleteOrgTarget?.name}"</span>,
                all its documents, and remove all members.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="text-sm text-muted-foreground bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                ⚠️ All documents and member associations will be permanently removed.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteOrgDialogOpen(false)
                  setDeleteOrgTarget(null)
                }}
                disabled={deletingOrg}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOrg}
                disabled={deletingOrg}
              >
                {deletingOrg ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.aside>
    </TooltipProvider>
  )
}
