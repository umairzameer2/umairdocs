'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, ArrowRight, Loader2, FileText, Sparkles, Github, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// ─── Password Strength Utility ────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number // 0-4
  label: string
  color: string
  bgColor: string
  icon: typeof ShieldX
} {
  if (!password) return { score: 0, label: '', color: '', bgColor: '', icon: ShieldX }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { label: 'Too short', color: 'text-red-500', bgColor: 'bg-red-500', icon: ShieldX },
    { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500', icon: ShieldAlert },
    { label: 'Fair', color: 'text-amber-500', bgColor: 'bg-amber-500', icon: ShieldAlert },
    { label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500', icon: ShieldCheck },
    { label: 'Strong', color: 'text-green-500', bgColor: 'bg-green-500', icon: ShieldCheck },
  ]

  // If password is less than 6, always show "Too short"
  if (password.length < 6) return levels[0]

  return levels[score] || levels[0]
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password])

  if (!password) return null

  const Icon = strength.icon

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2"
    >
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= strength.score ? strength.bgColor : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {/* Strength label */}
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${strength.color}`} />
        <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
      </div>
    </motion.div>
  )
}

function AuthPageContent() {
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const { login, signup, isLoading } = useAppStore()

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Reset password flow
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Check for reset_token in URL on mount
  useEffect(() => {
    const token = searchParams.get('reset_token')
    if (token) {
      setResetToken(token)
      // Validate the token
      fetch(`/api/auth/reset-password?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setResetEmail(data.email || '')
            setShowResetPassword(true)
          } else {
            toast({
              title: 'Invalid Link',
              description: 'This password reset link is invalid or expired. Please request a new one.',
              variant: 'destructive',
            })
          }
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to validate reset link',
            variant: 'destructive',
          })
        })
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { signIn } = await import('next-auth/react')
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('Google sign in error:', error)
      toast({ title: 'Error', description: 'Failed to sign in with Google', variant: 'destructive' })
      setGoogleLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' })
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()

      if (data.success) {
        setForgotSent(true)
        toast({
          title: 'Reset link sent!',
          description: 'If an account with that email exists, you will receive a password reset link.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send reset link',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send reset link. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    setError('')

    if (!newPassword) {
      setError('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== resetConfirmPassword) {
      setError('Passwords do not match')
      return
    }

    setResetLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      })
      const data = await res.json()

      if (data.success) {
        setResetSuccess(true)
        toast({
          title: 'Password reset!',
          description: 'Your password has been reset. You can now sign in with your new password.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reset password',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setResetLoading(false)
    }
  }

  // ─── Reset Password Modal ──────────────────────────────────────
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md mx-4 relative z-10"
        >
          <Card className="shadow-2xl shadow-black/10 border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">
                  {resetSuccess ? 'Password Reset!' : 'Set New Password'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {resetSuccess
                    ? 'You can now sign in with your new password'
                    : resetEmail
                      ? `Resetting password for ${resetEmail}`
                      : 'Enter your new password below'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {resetSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  </motion.div>
                  <p className="text-muted-foreground">
                    Your password has been successfully reset.
                  </p>
                  <Button
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200"
                    onClick={() => {
                      setShowResetPassword(false)
                      setResetSuccess(false)
                      setResetToken('')
                      setNewPassword('')
                      setResetConfirmPassword('')
                    }}
                  >
                    Continue to Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                      New Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 pr-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-2">
                      <PasswordStrengthBar password={newPassword} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="resetConfirmPassword" className="text-sm font-medium text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="resetConfirmPassword"
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="h-11 pr-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {resetConfirmPassword && newPassword !== resetConfirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 mt-1.5"
                      >
                        Passwords don&apos;t match
                      </motion.p>
                    )}
                  </div>
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
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200"
                    disabled={resetLoading || !newPassword || newPassword !== resetConfirmPassword || newPassword.length < 6}
                  >
                    {resetLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ─── Forgot Password Modal ─────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        {/* Background decorations */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md mx-4 relative z-10"
        >
          <Card className="shadow-2xl shadow-black/10 border-0 bg-card/80 backdrop-blur-xl">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-semibold text-foreground">
                  {forgotSent ? 'Check Your Email' : 'Forgot Password?'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {forgotSent
                    ? `We sent a reset link to ${forgotEmail}`
                    : "No worries! Enter your email and we'll send you a reset link."}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {forgotSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <Mail className="w-16 h-16 text-purple-400 mx-auto" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    If an account with that email exists, you will receive a password reset link shortly. Check your inbox and spam folder.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotSent(false)
                      setForgotEmail('')
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                  <button
                    onClick={() => {
                      setForgotSent(false)
                      setForgotLoading(false)
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                  >
                    Didn&apos;t receive the email? Send again
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgotEmail" className="text-sm font-medium text-foreground">
                      Email address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgotEmail"
                        type="email"
                        placeholder="Enter your email address"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="h-11 pl-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotEmail('')
                    }}
                    className="flex items-center justify-center w-full text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ─── Main Auth Page (Sign In / Sign Up) ────────────────────────
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
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className="h-11 pl-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true)
                        setForgotEmail(email)
                      }}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    className="h-11 pr-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar for signup */}
                {isSignUp && <div className="mt-2"><PasswordStrengthBar password={password} /></div>}
              </motion.div>

              {/* Confirm password for signup */}
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="confirm-password-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm password
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                        className="h-11 pr-10 border-border focus:border-purple-400 focus:ring-purple-400/20 transition-all text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 mt-1.5"
                      >
                        Passwords don&apos;t match
                      </motion.p>
                    )}
                    {confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 mt-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600">Passwords match</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

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
                  disabled={isLoading || (isSignUp && (!confirmPassword || password !== confirmPassword))}
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
                      setConfirmPassword('')
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
    </div>
  )
}

export function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}