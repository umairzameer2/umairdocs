'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'

// ─── Session sync component (MUST be inside SessionProvider) ───────
// This component syncs the NextAuth session into Zustand store.
// By putting useSession() HERE (inside SessionProvider), we guarantee
// it always has context. Page components don't need useSession at all.
function SessionSync() {
  const { data: session, status } = useSession()
  const { user, isAuthenticated, setUser, setCurrentView, currentView } = useAppStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Only update if we don't have user data yet, or it changed
      if (!user || user.id !== session.user.id) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.image,
        })
        // If we're on auth view, redirect to home
        if (currentView === 'auth') {
          setCurrentView('home')
        }
      }
    } else if (status === 'unauthenticated' && isAuthenticated) {
      // NextAuth session expired but Zustand thinks we're authenticated
      if (!user || user.authProvider === 'google') {
        // Only auto-logout for Google auth users (they rely on NextAuth session)
        setUser(null)
      }
    }
  }, [status, session, user, setUser, setCurrentView, isAuthenticated, currentView])

  return null // This component renders nothing
}

// ─── Cookie guard to prevent HTTP 431 ──────────────────────────────
// Checks total cookie size on mount. If cookies are too large (>3.5KB),
// clears all NextAuth cookies BEFORE any request is made.
const MAX_COOKIE_SIZE = 3500

function CookieGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const cookieStr = document.cookie
    if (cookieStr.length <= MAX_COOKIE_SIZE) return

    console.warn(
      `[cookie-guard] Cookie size ${cookieStr.length} exceeds ${MAX_COOKIE_SIZE} — clearing NextAuth cookies`
    )

    const authCookieNames = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.session-token',
      '__Host-next-auth.callback-url',
      '__Host-next-auth.csrf-token',
      'next-auth.pkce.code_verifier',
      'next-auth.state',
    ]

    for (const name of authCookieNames) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure=true; sameSite=lax`
    }

    // Also catch any dynamically-named next-auth cookies
    cookieStr.split(';').forEach((c) => {
      const name = c.split('=')[0].trim()
      if (name.startsWith('next-auth') || name.startsWith('__Host-next-auth')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure=true; sameSite=lax`
      }
    })
  }, [])

  return null // This component renders nothing
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CookieGuard />
      <SessionSync />
      {children}
    </SessionProvider>
  )
}