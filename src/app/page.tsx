'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { AuthPage } from '@/components/auth/auth-page'
import { HomePage } from '@/components/home/home-page'
import { EditorPage } from '@/components/editor/editor-page'
import { SettingsPage } from '@/components/settings/settings-page'
import { InvitationDialog } from '@/components/invitation/invitation-dialog'

// Extract invitation token from URL synchronously during initialization
function getInvitationTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const token = params.get('invitation')
  if (token) {
    // Clean URL immediately
    window.history.replaceState({}, document.title, '/')
  }
  // Clean up Google OAuth callback URL
  if (params.get('google_auth') === 'success') {
    window.history.replaceState({}, document.title, '/')
  }
  return token
}

export default function UmairDocsApp() {
  const { currentView, isAuthenticated, fetchPendingInvitations, verifySession, user } = useAppStore()
  const [invitationToken, setInvitationToken] = useState(() => getInvitationTokenFromURL())

  // Validate persisted session on mount — if the user's session is
  // invalid (e.g., user deleted from DB), force logout
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      verifySession().then((valid) => {
        if (!valid) {
          // Session is invalid — clear the persisted auth state
          useAppStore.setState({
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
          try {
            localStorage.removeItem('umairdocs-google-accounts')
          } catch { /* ignore */ }
        }
      })
    }
    // Only run ONCE on mount — do NOT add dependencies that change
  }, [])

  // Fetch pending invitations when the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingInvitations()
    }
  }, [isAuthenticated, fetchPendingInvitations])

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="min-h-screen bg-background text-foreground"
      >
        {currentView === 'auth' && <AuthPage />}
        {currentView === 'home' && <HomePage />}
        {currentView === 'editor' && <EditorPage />}
        {currentView === 'settings' && <SettingsPage />}
      </motion.div>

      {/* Invitation acceptance dialog — shows when URL has ?invitation=token */}
      {invitationToken && (
        <InvitationDialog
          token={invitationToken}
          onClose={() => setInvitationToken(null)}
        />
      )}
    </AnimatePresence>
  )
}
