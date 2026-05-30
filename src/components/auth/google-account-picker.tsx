'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, ChevronRight, User } from 'lucide-react'

interface SavedAccount {
  email: string
  name: string
  avatar: string | null
  addedAt: string
}

const STORAGE_KEY = 'umairdocs-google-accounts'

function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveAccount(account: SavedAccount) {
  const accounts = getSavedAccounts()
  const filtered = accounts.filter((a) => a.email !== account.email)
  filtered.unshift(account)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface GoogleAccountPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (email: string, name: string) => Promise<void>
  isLoading: boolean
}

function PickerContent({ onClose, onSelect, isLoading }: Omit<GoogleAccountPickerProps, 'open'>) {
  const accounts = useMemo(() => getSavedAccounts(), [])
  const [view, setView] = useState<'choose' | 'email' | 'name'>('choose')
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelectAccount = useCallback(async (account: SavedAccount) => {
    setSelectedEmail(account.email)
    saveAccount(account)
    try {
      await onSelect(account.email, account.name)
    } catch {
      setSelectedEmail(null)
    }
  }, [onSelect])

  const handleEmailNext = useCallback(() => {
    setError('')
    if (!newEmail.trim()) {
      setError('Enter an email or phone number')
      return
    }
    if (!newEmail.includes('@')) {
      setError("Couldn't find your Google Account")
      return
    }
    setView('name')
  }, [newEmail])

  const handleNameSubmit = useCallback(async () => {
    setError('')
    const email = newEmail.trim()
    const name = newName.trim() || email.split('@')[0]

    const account: SavedAccount = {
      email,
      name,
      avatar: null,
      addedAt: new Date().toISOString(),
    }

    saveAccount(account)
    setSelectedEmail(email)

    try {
      await onSelect(email, name)
    } catch {
      setSelectedEmail(null)
    }
  }, [newEmail, newName, onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }, [])

  return (
    <motion.div
      className="w-full max-w-[450px] mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Google Header Bar */}
      <div className="flex items-center justify-center pt-8 pb-2">
        <svg className="w-7 h-7" viewBox="0 0 48 48">
          <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
          <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
          <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
          <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
        </svg>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {view === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-10 pb-8 pt-2"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-normal text-foreground mb-1">
                Choose an account
              </h2>
              <p className="text-sm text-muted-foreground">
                to continue to <span className="font-medium text-foreground">UmairDocs</span>
              </p>
            </div>

            {/* Account List */}
            <div className="space-y-0 -mx-2">
              {accounts.map((account) => (
                <motion.button
                  key={account.email}
                  className="w-full flex items-center gap-4 px-3 py-3.5 hover:bg-muted transition-colors text-left rounded-lg group"
                  onClick={() => handleSelectAccount(account)}
                  disabled={isLoading}
                  whileTap={{ scale: 0.99 }}
                >
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(account.name)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-medium">
                        {getInitials(account.name)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate font-normal">{account.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{account.email}</p>
                  </div>
                  {selectedEmail === account.email && isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </motion.button>
              ))}

              {/* Use another account */}
              <motion.button
                className="w-full flex items-center gap-4 px-3 py-3.5 hover:bg-muted transition-colors text-left rounded-lg group"
                onClick={() => {
                  setView('email')
                  setError('')
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center flex-shrink-0 group-hover:border-muted-foreground/30 transition-colors">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground">Use another account</span>
              </motion.button>
            </div>

            {/* Info text */}
            <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
              To continue, Google will share your name, email address, and profile picture with UmairDocs. Before using this app, you can review its{' '}
              <button className="text-primary hover:underline">privacy policy</button> and{' '}
              <button className="text-primary hover:underline">terms of service</button>.
            </p>
          </motion.div>
        ) : view === 'email' ? (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-10 pb-8 pt-2"
          >
            {/* Back button */}
            <button
              onClick={() => {
                setView('choose')
                setError('')
              }}
              className="mb-2 p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-normal text-foreground mb-1">
                Sign in
              </h2>
              <p className="text-sm text-muted-foreground">
                Use your Google Account
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-1 mb-1">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => handleKeyDown(e, handleEmailNext)}
                  className="h-12 text-base border-border focus:border-blue-500 focus:ring-blue-500/20 rounded-lg px-4 text-foreground"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 mt-2"
                >
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <p className="text-sm text-red-500">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Forgot email link */}
            <div className="mb-6">
              <button className="text-sm text-primary hover:underline font-medium">
                Forgot email?
              </button>
            </div>

            {/* Info text */}
            <p className="text-sm text-muted-foreground mb-6">
              Not your computer? Use Guest mode to sign in privately.{' '}
              <button className="text-primary hover:underline text-sm">Learn more about using Guest mode</button>
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button className="text-sm text-primary hover:underline font-medium">
                Create account
              </button>
              <Button
                onClick={handleEmailNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                Next
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-10 pb-8 pt-2"
          >
            {/* Back button */}
            <button
              onClick={() => {
                setView('email')
                setError('')
              }}
              className="mb-2 p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Account chip */}
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-full ${getAvatarColor(newEmail)} flex items-center justify-center`}>
                <span className="text-white text-xs font-medium">
                  {getInitials(newEmail.split('@')[0])}
                </span>
              </div>
              <div>
                <p className="text-sm text-foreground">{newEmail.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">{newEmail}</p>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-normal text-foreground mb-1">
                Welcome
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your name
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-1 mb-6">
              <Input
                type="text"
                placeholder="Your name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => handleKeyDown(e, handleNameSubmit)}
                className="h-12 text-base border-border focus:border-blue-500 focus:ring-blue-500/20 rounded-lg px-4 text-foreground"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end">
              <Button
                onClick={handleNameSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-10 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              English (United States)
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Help</button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function GoogleAccountPicker({ open, onClose, onSelect, isLoading }: GoogleAccountPickerProps) {
  // Use a ref to track the "open count" so PickerContent remounts with fresh state
  const openCountRef = useRef(0)
  const prevOpenRef = useRef(false)
  const [openKey, setOpenKey] = useState(0)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      openCountRef.current += 1
      setOpenKey(openCountRef.current)
    }
    prevOpenRef.current = open
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={openKey}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) onClose()
          }}
        >
          <PickerContent
            onClose={onClose}
            onSelect={onSelect}
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
