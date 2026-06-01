'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

// Extend window to include Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void
          prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void
          renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
          disableAutoSelect: () => void
          cancel: () => void
          revoke: (hint: string, callback: (done: RevocationResponse) => void) => void
        }
      }
    }
    onGoogleLibraryLoad?: () => void
  }
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: string
  nonce?: string
}

interface CredentialResponse {
  credential: string
  select_by: string
  clientId?: string
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  getDismissedReason: () => string
}

interface GoogleRenderButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  local_policy?: string
}

interface RevocationResponse {
  successful: boolean
  error?: string
}

interface GoogleUserInfo {
  email: string
  name: string
  picture: string
  sub: string
  given_name?: string
  family_name?: string
}

/**
 * Decodes the JWT credential returned by Google Sign-In
 */
function decodeJwtResponse(token: string): GoogleUserInfo {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

interface UseGoogleAuthOptions {
  onSuccess: (userInfo: GoogleUserInfo) => void
  onError?: (error: string) => void
}

export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  const [scriptLoaded, setScriptLoaded] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!document.querySelector('script[src*="accounts.google.com/gsi/client"]')
  })
  const initializedRef = useRef(false)
  const callbackRef = useRef(onSuccess)
  const errorCallbackRef = useRef(onError)

  // Keep refs updated
  useEffect(() => {
    callbackRef.current = onSuccess
  }, [onSuccess])
  useEffect(() => {
    errorCallbackRef.current = onError
  }, [onError])

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleCredentialResponse = useCallback((response: CredentialResponse) => {
    try {
      const userInfo = decodeJwtResponse(response.credential)
      callbackRef.current(userInfo)
    } catch (err) {
      console.error('Failed to decode Google credential:', err)
      errorCallbackRef.current?.('Failed to process Google sign-in response')
    }
  }, [])

  // Load the Google Identity Services script
  useEffect(() => {
    if (!clientId) return
    if (scriptLoaded) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script')
      errorCallbackRef.current?.('Failed to load Google Sign-In')
    }
    document.head.appendChild(script)
  }, [clientId, scriptLoaded])

  // Initialize Google Sign-In
  const initializeGoogle = useCallback(() => {
    if (!clientId || !window.google || initializedRef.current) return

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
      })
      initializedRef.current = true
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err)
      errorCallbackRef.current?.('Failed to initialize Google Sign-In')
    }
  }, [clientId, handleCredentialResponse])

  // Show the Google account picker (One Tap or popup)
  const signInWithGoogle = useCallback(() => {
    if (!clientId) {
      onError?.('Google Sign-In is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env file.')
      return false
    }

    if (!window.google) {
      onError?.('Google Sign-In is still loading. Please try again in a moment.')
      return false
    }

    // Initialize if not already done
    if (!initializedRef.current) {
      initializeGoogle()
    }

    try {
      // Show the Google account picker popup
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.warn('Google Sign-In not displayed:', notification.getNotDisplayedReason())
          // Fallback: try rendering the button-based approach
          errorCallbackRef.current?.(
            notification.getNotDisplayedReason() === 'browser_not_supported'
              ? 'Your browser does not support Google Sign-In'
              : 'Could not show Google account picker. Please try again.'
          )
        } else if (notification.isSkippedMoment()) {
          console.warn('Google Sign-In skipped:', notification.getSkippedReason())
        } else if (notification.isDismissedMoment()) {
          console.log('Google Sign-In dismissed:', notification.getDismissedReason())
        }
      })
      return true
    } catch (err) {
      console.error('Google Sign-In prompt error:', err)
      onError?.('Failed to show Google account picker')
      return false
    }
  }, [clientId, initializeGoogle, onError])

  // Render the Google Sign-In button in a container
  const renderGoogleButton = useCallback((containerRef: HTMLDivElement) => {
    if (!clientId || !window.google || !initializedRef.current) return

    try {
      window.google.accounts.id.renderButton(containerRef, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: containerRef.offsetWidth,
      })
    } catch (err) {
      console.error('Failed to render Google button:', err)
    }
  }, [clientId])

  return {
    signInWithGoogle,
    renderGoogleButton,
    isGoogleAvailable: !!clientId,
    isGoogleLoaded: scriptLoaded,
  }
}

export type { GoogleUserInfo }