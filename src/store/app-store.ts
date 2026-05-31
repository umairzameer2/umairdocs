import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type View = 'auth' | 'home' | 'editor' | 'settings'

// ─── Request deduplication cache ──────────────────────────────────
// Prevents concurrent duplicate API calls and adds short-lived cache
const pendingRequests = new Map<string, Promise<any>>()
const cacheTimestamps = new Map<string, number>()
const CACHE_TTL = 3000 // 3 seconds — prevents rapid re-fetches

async function dedupedFetch<T>(key: string, url: string): Promise<T> {
  const now = Date.now()
  const lastFetch = cacheTimestamps.get(key)

  // Return early if we fetched this recently
  if (lastFetch && now - lastFetch < CACHE_TTL) {
    // Return a resolved promise with null to skip the fetch
    return null as unknown as T
  }

  // If there's already a pending request for this key, reuse it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = fetch(url)
    .then((r) => r.json())
    .then((data) => {
      cacheTimestamps.set(key, Date.now())
      pendingRequests.delete(key)
      return data
    })
    .catch((err) => {
      pendingRequests.delete(key)
      throw err
    })

  pendingRequests.set(key, promise)
  return promise
}

// Invalidate cache entries by prefix — call after mutations
function invalidateCache(prefix?: string) {
  if (!prefix) {
    cacheTimestamps.clear()
    return
  }
  for (const key of cacheTimestamps.keys()) {
    if (key.startsWith(prefix)) {
      cacheTimestamps.delete(key)
    }
  }
}

interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  authProvider?: string
}

interface OrgMember {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

interface Organization {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  createdBy: string
  createdAt: string
  updatedAt: string
  role: string
  memberCount: number
  documentCount: number
  members: OrgMember[]
}

interface ChangeEntry {
  id: string
  action: string
  description: string
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  document?: {
    id: string
    title: string
    icon: string
  }
}

interface Document {
  id: string
  title: string
  content: string
  template: string
  icon: string
  isStarred: boolean
  isTrashed: boolean
  authorId: string
  authorName?: string
  organizationId: string | null
  createdAt: string
  updatedAt: string
}

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Navigation
  currentView: View
  activeDocumentId: string | null

  // Documents
  documents: Document[]

  // Organizations
  organizations: Organization[]
  activeOrgId: string | null
  orgDocuments: Document[]

  // Change tracking
  documentChanges: ChangeEntry[]
  orgChanges: ChangeEntry[]

  // Pending invitations (for current user's email)
  pendingInvitations: Array<{
    id: string
    token: string
    email: string
    role: string
    expiresAt: string
    createdAt: string
    organization: { id: string; name: string; icon: string; description: string }
    inviter: { id: string; name: string | null; email: string; avatar: string | null }
  }>

  // Settings
  recentDocViewMode: 'grid' | 'list'
  userEmails: Array<{ id: string; email: string; isPrimary: boolean; verified: boolean; createdAt: string }>
  userSessions: Array<{ id: string; deviceName: string; deviceType: string; browser: string; os: string; ipAddress: string; location: string; lastActive: string; createdAt: string; isCurrent: boolean }>
  avatarVersion: number

  // Sidebar
  sidebarCollapsed: boolean

  // Actions - Auth
  setUser: (user: User | null) => void
  setIsLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  googleLogin: (email: string, name: string) => Promise<boolean>
  logout: () => void

  // Actions - Navigation
  setCurrentView: (view: View) => void
  setActiveDocumentId: (id: string | null) => void

  // Actions - Documents
  setDocuments: (docs: Document[]) => void
  fetchDocuments: () => Promise<void>
  createDocument: (title: string, template: string, icon: string, organizationId?: string | null) => Promise<Document | null>
  updateDocument: (id: string, data: Partial<Pick<Document, 'title' | 'content' | 'isStarred' | 'isTrashed'>>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>

  // Actions - Organizations
  setOrganizations: (orgs: Organization[]) => void
  setActiveOrgId: (id: string | null) => void
  fetchOrganizations: () => Promise<void>
  createOrganization: (name: string, description?: string, icon?: string) => Promise<Organization | null>
  deleteOrganization: (id: string) => Promise<boolean>
  addOrgMember: (orgId: string, email: string, role?: string) => Promise<OrgMember | { error: string } | null>
  removeOrgMember: (memberId: string) => Promise<boolean>
  updateOrgMemberRole: (memberId: string, role: string) => Promise<boolean>
  fetchOrgDocuments: (orgId: string) => Promise<void>

  // Actions - Invitations
  fetchPendingInvitations: () => Promise<void>
  dismissPendingInvitation: (invitationId: string) => void

  // Actions - Sidebar
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Actions - Settings
  setRecentDocViewMode: (mode: 'grid' | 'list') => void

  // Actions - Change tracking
  fetchDocumentChanges: (documentId: string) => Promise<void>
  fetchOrgChanges: (orgId: string) => Promise<void>
  logChange: (documentId: string, action: string, description: string, oldValue?: string, newValue?: string) => Promise<void>

  // Actions - Settings
  updateProfile: (name?: string, avatar?: string) => Promise<boolean>
  deleteAvatar: () => Promise<boolean>
  fetchEmails: () => Promise<void>
  addEmail: (email: string) => Promise<boolean>
  removeEmail: (emailId: string) => Promise<boolean>
  makeEmailPrimary: (emailId: string) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string, resetPassword?: boolean) => Promise<boolean>
  fetchSessions: () => Promise<void>
  registerSession: (deviceInfo: { deviceName: string; deviceType: string; browser: string; os: string }) => Promise<void>
  revokeSession: (sessionId: string) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  verifySession: () => Promise<boolean>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      currentView: 'auth',
      activeDocumentId: null,
      documents: [],
      organizations: [],
      activeOrgId: null,
      orgDocuments: [],
      documentChanges: [],
      orgChanges: [],
      pendingInvitations: [],
      recentDocViewMode: 'grid',
      userEmails: [],
      userSessions: [],
      avatarVersion: 0,
      sidebarCollapsed: false,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setRecentDocViewMode: (mode) => set({ recentDocViewMode: mode }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true, isLoading: false, currentView: 'home' })
            return true
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          })
          const data = await res.json()
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true, isLoading: false, currentView: 'home' })
            return true
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      googleLogin: async (email, name) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
          })
          const data = await res.json()
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true, isLoading: false, currentView: 'home' })
            return true
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      logout: () => {
        // Simply reset all state — persist middleware will save the logged-out state
        // DO NOT call localStorage.clear() or window.location.href — those cause
        // race conditions where React re-writes the old state before the page unloads
        set({
          user: null,
          isAuthenticated: false,
          currentView: 'auth',
          activeDocumentId: null,
          documents: [],
          organizations: [],
          activeOrgId: null,
          orgDocuments: [],
          documentChanges: [],
          orgChanges: [],
          pendingInvitations: [],
        })
        // Invalidate all caches so fresh data is fetched on next login
        invalidateCache()
      },

      setCurrentView: (currentView) => set({ currentView }),
      setActiveDocumentId: (activeDocumentId) => set({ activeDocumentId }),
      setDocuments: (documents) => set({ documents }),

      fetchDocuments: async () => {
        const { user, activeOrgId } = get()
        if (!user) return
        try {
          if (activeOrgId) {
            // Invalidate cache to ensure fresh data (org may have been deleted)
            invalidateCache('docs-org-')
            const data = await dedupedFetch<{ success: boolean; documents: Document[] }>(`docs-org-${activeOrgId}`, `/api/documents?organizationId=${activeOrgId}`)
            if (data && data.success) {
              set({ orgDocuments: data.documents })
            } else if (data && !data.success) {
              // Org might have been deleted — clear stale state
              set({ orgDocuments: [], activeOrgId: null })
              invalidateCache('orgs-')
              invalidateCache('changes-org-')
            }
          } else {
            const data = await dedupedFetch<{ success: boolean; documents: Document[] }>(`docs-user-${user.id}`, `/api/documents?authorId=${user.id}`)
            if (data && data.success) {
              set({ documents: data.documents, orgDocuments: [] })
            }
          }
        } catch {
          // silently fail
        }
      },

      createDocument: async (title, template, icon, organizationId) => {
        const { user } = get()
        if (!user) return null
        try {
          const res = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              template,
              icon,
              authorId: user.id,
              organizationId: organizationId || null,
            }),
          })
          const data = await res.json()
          if (data.success && data.document) {
            const doc = data.document
            if (organizationId) {
              invalidateCache('docs-org-')
              set((state) => ({ orgDocuments: [doc, ...state.orgDocuments] }))
            } else {
              invalidateCache('docs-user-')
              set((state) => ({ documents: [doc, ...state.documents] }))
            }
            return doc
          }
          return null
        } catch {
          return null
        }
      },

      updateDocument: async (id, updateData) => {
        const { user } = get()
        try {
          const res = await fetch(`/api/documents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updateData, _userId: user?.id }),
          })
          if (!res.ok) {
            console.error('Update document failed: HTTP', res.status, res.statusText)
            return false
          }
          const data = await res.json()
          if (data.success) {
            set((state) => ({
              documents: state.documents.map((doc) =>
                doc.id === id ? { ...doc, ...updateData, updatedAt: new Date().toISOString() } : doc
              ),
              orgDocuments: state.orgDocuments.map((doc) =>
                doc.id === id ? { ...doc, ...updateData, updatedAt: new Date().toISOString() } : doc
              ),
            }))
            return true
          }
          console.error('Update document failed:', data.error)
          return false
        } catch (error) {
          console.error('Update document error:', error)
          return false
        }
      },

      deleteDocument: async (id) => {
        try {
          const { user } = get()
          const res = await fetch(`/api/documents/${id}?userId=${user?.id || ''}`, { method: 'DELETE' })
          const data = await res.json()
          if (data.success) {
            invalidateCache('docs-')
            set((state) => ({
              documents: state.documents.filter((doc) => doc.id !== id),
              orgDocuments: state.orgDocuments.filter((doc) => doc.id !== id),
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      // Organizations
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrgId: (activeOrgId) => {
        invalidateCache('docs-')
        set({ activeOrgId })
        // Fetch documents for the new org context
        const { user, fetchDocuments } = get()
        if (user) {
          fetchDocuments()
        }
      },

      fetchOrganizations: async () => {
        const { user } = get()
        if (!user) return
        try {
          // Always force a fresh fetch (invalidate cache) to ensure deleted orgs are removed
          invalidateCache('orgs-')
          const data = await dedupedFetch<{ success: boolean; organizations: Organization[] }>(`orgs-${user.id}`, `/api/organizations?userId=${user.id}`)
          if (data && data.success) {
            const { activeOrgId } = get()
            // If the active org no longer exists in the database, clear it
            const activeOrgStillExists = activeOrgId
              ? data.organizations.some((org) => org.id === activeOrgId)
              : true
            set({
              organizations: data.organizations,
              ...(activeOrgStillExists ? {} : { activeOrgId: null }),
            })
            // Also clear org documents if active org was removed
            if (!activeOrgStillExists) {
              invalidateCache('docs-org-')
              invalidateCache('changes-org-')
            }
          }
        } catch {
          // silently fail
        }
      },

      createOrganization: async (name, description, icon) => {
        const { user } = get()
        if (!user) return null
        try {
          const res = await fetch('/api/organizations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, icon, userId: user.id }),
          })
          const data = await res.json()
          if (data.success && data.organization) {
            invalidateCache('orgs-')
            set((state) => ({
              organizations: [data.organization, ...state.organizations],
            }))
            return data.organization
          }
          return null
        } catch {
          return null
        }
      },

      deleteOrganization: async (id) => {
        try {
          const { user } = get()
          const res = await fetch(`/api/organizations/${id}?userId=${user?.id || ''}`, { method: 'DELETE' })
          const data = await res.json()
          if (data.success) {
            invalidateCache('orgs-')
            invalidateCache('docs-org-')
            invalidateCache('changes-org-')
            set((state) => ({
              organizations: state.organizations.filter((org) => org.id !== id),
              activeOrgId: state.activeOrgId === id ? null : state.activeOrgId,
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      addOrgMember: async (orgId, email, role) => {
        try {
          const { user } = get()
          // Use the invitation API instead of direct member add
          const res = await fetch('/api/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId,
              email,
              role: role || 'viewer',
              invitedBy: user?.id,
            }),
          })
          const data = await res.json()
          if (data.success) {
            // Re-fetch organizations to get updated member list
            const { fetchOrganizations } = get()
            await fetchOrganizations()
            // Pass through all invitation data including acceptUrl and emailConfigured
            return data.invitation
          }
          // Return error info so the caller can display it
          return { error: data.error || 'Failed to send invitation' }
        } catch {
          return { error: 'Network error' }
        }
      },

      removeOrgMember: async (memberId) => {
        try {
          // Find the orgId first
          const { organizations } = get()
          let targetOrgId: string | null = null
          for (const org of organizations) {
            if (org.members.some((m) => m.id === memberId)) {
              targetOrgId = org.id
              break
            }
          }

          const { user } = get()
          const res = await fetch(`/api/organizations/${targetOrgId}/members/${memberId}?userId=${user?.id || ''}`, {
            method: 'DELETE',
          })
          const data = await res.json()
          if (data.success) {
            set((state) => ({
              organizations: state.organizations.map((org) =>
                org.members.some((m) => m.id === memberId)
                  ? {
                      ...org,
                      members: org.members.filter((m) => m.id !== memberId),
                      memberCount: org.memberCount - 1,
                    }
                  : org
              ),
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      updateOrgMemberRole: async (memberId, role) => {
        try {
          const { organizations } = get()
          let targetOrgId: string | null = null
          for (const org of organizations) {
            if (org.members.some((m) => m.id === memberId)) {
              targetOrgId = org.id
              break
            }
          }

          const { user } = get()
          const res = await fetch(`/api/organizations/${targetOrgId}/members/${memberId}?userId=${user?.id || ''}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          })
          const data = await res.json()
          if (data.success) {
            set((state) => ({
              organizations: state.organizations.map((org) =>
                org.members.some((m) => m.id === memberId)
                  ? {
                      ...org,
                      members: org.members.map((m) =>
                        m.id === memberId ? { ...m, role } : m
                      ),
                    }
                  : org
              ),
            }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      fetchOrgDocuments: async (orgId) => {
        try {
          const data = await dedupedFetch<{ success: boolean; documents: Document[] }>(`docs-org-${orgId}`, `/api/documents?organizationId=${orgId}`)
          if (data && data.success) {
            set({ orgDocuments: data.documents })
          }
        } catch {
          // silently fail
        }
      },

      fetchPendingInvitations: async () => {
        try {
          const { user } = get()
          if (!user?.email) return
          const data = await dedupedFetch<{ success: boolean; invitations: any[] }>(`inv-pending-${user.email}`, `/api/invitations/pending?email=${encodeURIComponent(user.email)}`)
          if (data && data.success) {
            set({ pendingInvitations: data.invitations })
          }
        } catch {
          // silently fail
        }
      },

      dismissPendingInvitation: (invitationId) => {
        set((state) => ({
          pendingInvitations: state.pendingInvitations.filter((inv) => inv.id !== invitationId),
        }))
      },

      // Change tracking
      fetchDocumentChanges: async (documentId) => {
        try {
          const data = await dedupedFetch<{ success: boolean; changes: ChangeEntry[] }>(`changes-doc-${documentId}`, `/api/changes?documentId=${documentId}`)
          if (data && data.success) {
            set({ documentChanges: data.changes })
          }
        } catch {
          // silently fail
        }
      },

      fetchOrgChanges: async (orgId) => {
        try {
          const data = await dedupedFetch<{ success: boolean; changes: ChangeEntry[] }>(`changes-org-${orgId}`, `/api/changes?organizationId=${orgId}`)
          if (data && data.success) {
            set({ orgChanges: data.changes })
          }
        } catch {
          // silently fail
        }
      },

      logChange: async (documentId, action, description, oldValue, newValue) => {
        const { user } = get()
        if (!user) return
        try {
          await fetch('/api/changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId,
              userId: user.id,
              action,
              description,
              oldValue: oldValue || null,
              newValue: newValue || null,
            }),
          })
        } catch {
          // silently fail
        }
      },

      // ── Settings Actions ──────────────────────────────────────

      updateProfile: async (name, avatar) => {
        const { user } = get()
        if (!user) return false
        try {
          const body: Record<string, string> = { userId: user.id }
          if (name !== undefined) body.name = name
          if (avatar !== undefined) body.avatar = avatar

          const res = await fetch('/api/settings/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            console.error('Update profile failed: HTTP', res.status)
            return false
          }
          const data = await res.json()
          if (data.success && data.profile) {
            // Use the latest state to avoid overwriting other concurrent updates
            const currentUser = get().user
            if (currentUser) {
              // Only increment avatarVersion if avatar actually changed
              const avatarChanged = avatar !== undefined || data.profile.avatar !== currentUser.avatar
              set({
                user: {
                  ...currentUser,
                  name: data.profile.name ?? currentUser.name,
                  // Use API response directly (handles null for avatar deletion)
                  avatar: data.profile.avatar !== undefined ? data.profile.avatar : currentUser.avatar,
                  authProvider: data.profile.authProvider ?? currentUser.authProvider,
                },
                // Only force Avatar re-render when avatar actually changes
                ...(avatarChanged ? { avatarVersion: get().avatarVersion + 1 } : {}),
              })
            }
            return true
          }
          console.error('Update profile failed:', data.error)
          return false
        } catch (error) {
          console.error('Update profile error:', error)
          return false
        }
      },

      deleteAvatar: async () => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch(`/api/settings/profile?userId=${user.id}&field=avatar`, { method: 'DELETE' })
          const data = await res.json()
          if (data.success) {
            set({ user: { ...user, avatar: null }, avatarVersion: get().avatarVersion + 1 })
            return true
          }
          return false
        } catch {
          return false
        }
      },

      fetchEmails: async () => {
        const { user } = get()
        if (!user) return
        try {
          const res = await fetch(`/api/settings/emails?userId=${user.id}`)
          const data = await res.json()
          if (data.success) {
            set({ userEmails: data.emails })
          }
        } catch {
          // silently fail
        }
      },

      addEmail: async (email) => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch('/api/settings/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, email }),
          })
          const data = await res.json()
          if (data.success) {
            set((state) => ({ userEmails: [...state.userEmails, data.email] }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      removeEmail: async (emailId) => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch(`/api/settings/emails?emailId=${emailId}&userId=${user.id}`, { method: 'DELETE' })
          const data = await res.json()
          if (data.success) {
            set((state) => ({ userEmails: state.userEmails.filter((e) => e.id !== emailId) }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      makeEmailPrimary: async (emailId) => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch('/api/settings/emails', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId, userId: user.id, makePrimary: true }),
          })
          const data = await res.json()
          if (data.success) {
            // Refresh emails and update user email
            const { fetchEmails } = get()
            await fetchEmails()
            const emails = get().userEmails
            const primary = emails.find((e) => e.isPrimary)
            if (primary) {
              set((state) => ({ user: state.user ? { ...state.user, email: primary.email } : null }))
            }
            return true
          }
          return false
        } catch {
          return false
        }
      },

      changePassword: async (currentPassword, newPassword, resetPassword) => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch('/api/settings/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, currentPassword, newPassword, resetPassword }),
          })
          const data = await res.json()
          if (data.success) {
            // If user was a Google user and just set a password, update authProvider
            const currentUser = get().user
            if (currentUser && (currentUser.authProvider === 'google' || resetPassword)) {
              set({ user: { ...currentUser, authProvider: 'email' } })
            }
          }
          return data.success
        } catch {
          return false
        }
      },

      fetchSessions: async () => {
        const { user } = get()
        if (!user) return
        try {
          const res = await fetch(`/api/settings/devices?userId=${user.id}`)
          const data = await res.json()
          if (data.success) {
            set({ userSessions: data.sessions })
          }
        } catch {
          // silently fail
        }
      },

      registerSession: async (deviceInfo) => {
        const { user } = get()
        if (!user) return
        try {
          await fetch('/api/settings/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, ...deviceInfo }),
          })
        } catch {
          // silently fail
        }
      },

      revokeSession: async (sessionId) => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch(`/api/settings/devices?sessionId=${sessionId}&userId=${user.id}`, { method: 'DELETE' })
          const data = await res.json()
          if (data.success) {
            set((state) => ({ userSessions: state.userSessions.filter((s) => s.id !== sessionId) }))
            return true
          }
          return false
        } catch {
          return false
        }
      },

      deleteAccount: async () => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch(`/api/settings/delete-account?userId=${user.id}&confirmation=DELETE_ACCOUNT`, { method: 'DELETE' })
          const data = await res.json()
          if (res.ok && data.success) {
            // Use the logout function which properly resets state
            const { logout } = get()
            logout()
            return true
          }
          console.error('Delete account failed:', data.error, 'Status:', res.status)
          return false
        } catch (error) {
          console.error('Delete account error:', error)
          return false
        }
      },

      verifySession: async () => {
        const { user } = get()
        if (!user) return false
        try {
          const res = await fetch(`/api/auth/verify?userId=${user.id}`)
          if (!res.ok) return true // Network error — assume valid
          const data = await res.json()
          // Only return the result — do NOT modify state here
          // (state changes from verifySession caused infinite loops)
          return !!(data.success && data.valid)
        } catch {
          return true // Network error — assume session is valid
        }
      },
    }),
    {
      name: 'umairdocs-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentView: state.currentView,
        activeOrgId: state.activeOrgId,
        avatarVersion: state.avatarVersion,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)