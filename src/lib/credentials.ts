/**
 * Browser Credential Management API helper
 * 
 * This uses the navigator.credentials API to:
 * - Store credentials when a user signs in (so the browser remembers them)
 * - Retrieve saved credentials automatically (auto-detect accounts)
 * - Store both PasswordCredential (email+password) and FederatedCredential (Google)
 * 
 * This allows the Google account picker to automatically detect
 * accounts that the user has previously signed in with.
 */

export interface DetectedAccount {
  email: string
  name: string
  avatar: string | null
  provider: 'google' | 'password'
}

const GOOGLE_PROVIDER = 'https://accounts.google.com'

// Check if the Credential Management API is available
export function isCredentialAPISupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(navigator.credentials && typeof navigator.credentials.store === 'function' && typeof navigator.credentials.get === 'function')
}

/**
 * Store a Google federated credential in the browser
 * This makes the account appear in the picker next time
 */
export async function storeGoogleCredential(email: string, name: string): Promise<void> {
  if (!isCredentialAPISupported()) return

  try {
    // Try FederatedCredential first
    if ('FederatedCredential' in window) {
      const cred = new (window as any).FederatedCredential({
        id: email,
        name: name,
        iconURL: '',
        provider: GOOGLE_PROVIDER,
      })
      await navigator.credentials.store(cred)
    }
  } catch (err) {
    // Silently fail - not critical
    console.debug('Could not store federated credential:', err)
  }

  // Also store as PasswordCredential so the browser remembers the email
  try {
    if ('PasswordCredential' in window) {
      const cred = new (window as any).PasswordCredential({
        id: email,
        name: name,
        iconURL: '',
        password: '__google_oauth__',
      })
      await navigator.credentials.store(cred)
    }
  } catch (err) {
    console.debug('Could not store password credential:', err)
  }
}

/**
 * Store a password credential in the browser
 */
export async function storePasswordCredential(email: string, name: string, password: string): Promise<void> {
  if (!isCredentialAPISupported()) return

  try {
    if ('PasswordCredential' in window) {
      const cred = new (window as any).PasswordCredential({
        id: email,
        name: name,
        iconURL: '',
        password: password,
      })
      await navigator.credentials.store(cred)
    }
  } catch (err) {
    console.debug('Could not store password credential:', err)
  }
}

/**
 * Get all saved credentials from the browser
 * Returns both federated (Google) and password accounts
 */
export async function getBrowserCredentials(): Promise<DetectedAccount[]> {
  if (!isCredentialAPISupported()) return []

  const accounts: DetectedAccount[] = []
  const seenEmails = new Set<string>()

  try {
    // Try to get federated credentials (Google)
    try {
      const fedCred = await navigator.credentials.get({
        federated: {
          providers: [GOOGLE_PROVIDER],
        },
        mediation: 'silent', // Don't show any UI, just check silently
      } as any)

      if (fedCred && (fedCred as any).id && !seenEmails.has((fedCred as any).id)) {
        seenEmails.add((fedCred as any).id)
        accounts.push({
          email: (fedCred as any).id,
          name: (fedCred as any).name || (fedCred as any).id.split('@')[0],
          avatar: (fedCred as any).iconURL || null,
          provider: 'google',
        })
      }
    } catch {
      // Silently fail
    }

    // Try to get password credentials
    try {
      const passCred = await navigator.credentials.get({
        password: true,
        mediation: 'silent',
      } as any)

      if (passCred && (passCred as any).id && !seenEmails.has((passCred as any).id)) {
        seenEmails.add((passCred as any).id)
        // If the password is __google_oauth__, it's a Google account
        const isGoogle = (passCred as any).password === '__google_oauth__'
        accounts.push({
          email: (passCred as any).id,
          name: (passCred as any).name || (passCred as any).id.split('@')[0],
          avatar: (passCred as any).iconURL || null,
          provider: isGoogle ? 'google' : 'password',
        })
      }
    } catch {
      // Silently fail
    }
  } catch {
    // Silently fail
  }

  return accounts
}

/**
 * Prevent the browser's auto-sign-in for the next navigation
 */
export async function preventAutoSignIn(): Promise<void> {
  if (!isCredentialAPISupported()) return
  try {
    await navigator.credentials.preventSilentAccess()
  } catch {
    // Silently fail
  }
}
