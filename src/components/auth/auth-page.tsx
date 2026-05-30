'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, ArrowRight, Loader2, FileText, Sparkles, Github } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { GoogleAccountPicker } from '@/components/auth/google-account-picker'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [googlePickerOpen, setGooglePickerOpen] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const { login, signup, isLoading } = useAppStore()

  const handleGitHubSignIn = async () => {
    setGithubLoading(true)
    try {
      const { signIn } = await import('next-auth/react')
      await signIn('github', { callbackUrl: '/' })
    } catch (error) {
      console.error('GitHub sign in error:', error)
      toast({ title: 'Error', description: 'Failed to sign in with GitHub', variant: 'destructive' })
      setGithubLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    // Show our Google-style account picker directly
    setGoogleLoading(false)
    setGooglePickerOpen(true)
  }

  const handleGoogleSelect = async (googleEmail: string, googleName: string) => {
    setGoogleLoading(true)
    try {
      const { googleLogin } = useAppStore.getState()
      const success = await googleLogin(googleEmail, googleName)
      if (success) {
        setGooglePickerOpen(false)
        toast({ title: 'Welcome!', description: `Signed in as ${googleEmail}` })
      } else {
        toast({ title: 'Google sign-in failed', description: 'Please try again', variant: 'destructive' })
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (isSignUp) {
      const success = await signup(email, password, name)
      if (!success) {
        setError('An account with this email already exists')
        toast({ title: 'Sign up failed', description: 'Please try again', variant: 'destructive' })
      } else {
        toast({ title: 'Welcome!', description: 'Your account has been created successfully' })
      }
    } else {
      const success = await login(email, password)
      if (!success) {
        setError('Invalid email or password')
        toast({ title: 'Login failed', description: 'Please check your credentials', variant: 'destructive' })
      } else {
        toast({ title: 'Welcome back!', description: 'You have signed in successfully' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted relative overflow-hidden">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated background decorations */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating document icons */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-muted-foreground/20"
          style={{
            top: `${15 + i * 15}%`,
            left: `${5 + i * 18}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        >
          <FileText className="w-8 h-8" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <Card className="shadow-2xl shadow-black/10 border-0 bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-4 pb-4">
            {/* Logo */}
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
                UmairDocs
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              className="text-center space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-semibold text-foreground">
                {isSignUp ? 'Create your account' : 'Sign in to UmairDocs'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSignUp
                  ? 'Start your document journey today'
                  : 'Welcome back! Please sign in to continue'}
              </p>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Google Sign In */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="outline"
                className="w-full h-12 border-border hover:bg-muted hover:border-muted-foreground/30 transition-all duration-200 text-base"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                                Continue with Google
              </Button>
            </motion.div>

            {/* GitHub Sign In */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Button
                variant="outline"
                className="w-full h-12 border-border hover:bg-muted hover:border-muted-foreground/30 transition-all duration-200 text-base"
                onClick={handleGitHubSignIn}
                disabled={githubLoading}
              >
                {githubLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Github className="w-5 h-5 mr-2" />
                )}
                Continue with GitHub
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Separator className="relative">
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/80 px-3 text-xs text-muted-foreground">
                  or
                </span>
              </Separator>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 h-11 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 h-11 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                />
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all duration-200 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <motion.div
              className="text-center text-sm text-muted-foreground pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(false)
                      setError('')
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => {
                      setIsSignUp(true)
                      setError('')
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div
              className="text-center pt-3 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Secured with end-to-end encryption</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Google Account Picker */}
      <GoogleAccountPicker
        open={googlePickerOpen}
        onClose={() => setGooglePickerOpen(false)}
        onSelect={handleGoogleSelect}
        isLoading={googleLoading}
      />
    </div>
  )
}
