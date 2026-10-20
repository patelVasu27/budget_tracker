import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X, Lock, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApiLayer } from '../stores/dataStore'
import { apiSignIn, apiSignUp } from '../stores/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isRecovery?: boolean
}

type View = 'login' | 'signup' | 'forgot' | 'forgot-sent' | 'check-email' | 'reset-password'

interface LoginFormData {
  email: string
  password: string
}

interface ResetFormData {
  password: string
  confirmPassword: string
}

export function AuthModal({ isOpen, onClose, onSuccess, isRecovery = false }: AuthModalProps) {
  const [view, setView] = useState<View>(isRecovery ? 'reset-password' : 'login')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors }, reset: resetLogin } = useForm<LoginFormData>({ mode: 'onSubmit' })
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors }, reset: resetReset } = useForm<ResetFormData>({ mode: 'onSubmit' })
  const { register: registerForgot, handleSubmit: handleSubmitForgot, formState: { errors: forgotErrors }, reset: resetForgot } = useForm<{ email: string }>({ mode: 'onSubmit' })

  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRecovery) setView('reset-password')
  }, [isRecovery])

  useEffect(() => {
    if (!isOpen) {
      resetLogin()
      resetReset()
      resetForgot()
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen, resetLogin, resetReset, resetForgot])

  useEffect(() => {
    if (!lockoutUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutUntil(null)
        setLockoutRemaining(0)
        setFailedAttempts(0)
        clearInterval(interval)
      } else {
        setLockoutRemaining(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length === 0) return
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input')
        firstInput?.focus()
      }, 50)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen && !isRecovery) return null

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil

  const handleLogin = async (data: LoginFormData) => {
    if (isLockedOut) return
    setIsLoading(true)
    setError(null)
    try {
      if (useApiLayer()) {
        await apiSignIn(data.email, data.password)
        setFailedAttempts(0)
        onSuccess()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (error) throw error
        setFailedAttempts(0)
        onSuccess()
      }
    } catch (err) {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000)
        setLockoutRemaining(30)
        setError('Too many failed attempts. Please wait 30 seconds before trying again.')
      } else {
        setError(err instanceof Error ? err.message : 'Sign in failed. Please check your email and password.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      if (useApiLayer()) {
        const signUpData = await apiSignUp(data.email, data.password)
        if (signUpData.session) {
          onSuccess()
        } else {
          setView('check-email')
        }
      } else {
        const siteUrl = window.location.origin
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${siteUrl}/`,
          },
        })
        if (error) throw error

        if (signUpData.session) {
          onSuccess()
        } else {
          setView('check-email')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (data: { email: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      if (useApiLayer()) {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
          credentials: 'include',
        })
        if (!response.ok) throw new Error('Failed to send reset email')
        setView('forgot-sent')
      } else {
        const siteUrl = window.location.origin
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${siteUrl}/`,
        })
        if (error) throw error
        setView('forgot-sent')
      }
    } catch (err) {
      setView('forgot-sent')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (data: ResetFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match. Please try again.')
      return
    }
    if (data.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      if (useApiLayer()) {
        const response = await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: data.password }),
          credentials: 'include',
        })
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(errorBody.error || 'Failed to update password')
        }
        window.history.replaceState(null, '', window.location.pathname)
        setSuccessMessage('Your password has been updated. You can now sign in.')
        setView('login')
      } else {
        const { error } = await supabase.auth.updateUser({ password: data.password })
        if (error) throw error
        window.history.replaceState(null, '', window.location.pathname)
        setSuccessMessage('Your password has been updated. You can now sign in.')
        setView('login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchView = (newView: View) => {
    setView(newView)
    setError(null)
    setSuccessMessage(null)
    resetLogin()
    resetReset()
    resetForgot()
  }

  const renderLoginForm = () => (
    <form onSubmit={handleSubmitLogin(handleLogin)} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="email"
            {...registerLogin('email', { required: 'Email is required' })}
            className="input-field pl-11"
            placeholder="you@example.com"
            aria-label="Email address"
            aria-required="true"
            aria-invalid={!!loginErrors.email}
            autoComplete="email"
          />
        </div>
        {loginErrors.email && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">Email is required</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="password"
            {...registerLogin('password', { required: true, minLength: 6 })}
            className="input-field pl-11"
            placeholder="Min 6 characters"
            aria-label="Password"
            aria-required="true"
            aria-invalid={!!loginErrors.password}
            autoComplete="current-password"
          />
        </div>
        {loginErrors.password && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">
            Password must be at least 6 characters
          </p>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-accent-red/10 text-accent-red rounded-xl text-sm font-medium" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-accent-green/10 text-accent-green rounded-xl text-sm font-medium flex items-center gap-2" role="status" aria-live="polite">
          <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {isLockedOut && (
        <div className="p-3.5 bg-accent-amber/10 text-accent-amber rounded-xl text-sm font-medium flex items-center gap-2" role="alert" aria-live="polite">
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          Too many failed attempts. Please wait {lockoutRemaining} seconds.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isLockedOut}
        className="btn-primary w-full py-3.5 text-base shadow-sm active:scale-[0.96] transition-transform mt-2"
        aria-label="Sign in"
      >
        {isLoading ? 'Please wait...' : 'Log In'}
      </button>

      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => switchView('forgot')}
          className="text-sm text-accent-green hover:text-[#1E4D38] hover:underline font-semibold transition-colors"
          aria-label="Forgot password"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => switchView('signup')}
          className="text-sm text-accent-green hover:text-[#1E4D38] hover:underline font-semibold transition-colors"
          aria-label="Switch to sign up"
        >
          Create account
        </button>
      </div>
    </form>
  )

  const renderSignupForm = () => (
    <form onSubmit={handleSubmitLogin(handleSignup)} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="email"
            {...registerLogin('email', { required: 'Email is required' })}
            className="input-field pl-11"
            placeholder="you@example.com"
            aria-label="Email address"
            aria-required="true"
            aria-invalid={!!loginErrors.email}
            autoComplete="email"
          />
        </div>
        {loginErrors.email && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">Email is required</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="password"
            {...registerLogin('password', { required: true, minLength: 6 })}
            className="input-field pl-11"
            placeholder="Min 6 characters"
            aria-label="Password"
            aria-required="true"
            aria-invalid={!!loginErrors.password}
            autoComplete="new-password"
          />
        </div>
        {loginErrors.password && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">
            Password must be at least 6 characters
          </p>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-accent-red/10 text-accent-red rounded-xl text-sm font-medium" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3.5 text-base shadow-sm active:scale-[0.96] transition-transform mt-2"
        aria-label="Create account"
      >
        {isLoading ? 'Please wait...' : 'Create Account'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => switchView('login')}
          className="text-sm text-accent-green hover:text-[#1E4D38] hover:underline font-semibold transition-colors"
          aria-label="Switch to log in"
        >
          Already have an account? Log in
        </button>
      </div>
    </form>
  )

  const renderForgotForm = () => (
    <form onSubmit={handleSubmitForgot(handleForgotPassword)} className="space-y-5">
      <p className="text-sm text-secondary dark:text-secondary/70 mb-4">
        Enter your email address and we will send you a link to reset your password.
      </p>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="email"
            {...registerForgot('email', { required: 'Email is required' })}
            className="input-field pl-11"
            placeholder="you@example.com"
            aria-label="Email address"
            aria-required="true"
            aria-invalid={!!forgotErrors.email}
            autoComplete="email"
          />
        </div>
        {forgotErrors.email && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">Email is required</p>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-accent-red/10 text-accent-red rounded-xl text-sm font-medium" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3.5 text-base shadow-sm active:scale-[0.96] transition-transform mt-2"
        aria-label="Send reset link"
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => switchView('login')}
          className="text-sm text-accent-green hover:text-[#1E4D38] hover:underline font-semibold transition-colors inline-flex items-center gap-1"
          aria-label="Back to log in"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to log in
        </button>
      </div>
    </form>
  )

  const renderForgotSent = () => (
    <div className="text-center space-y-4 py-4">
      <CheckCircle className="w-12 h-12 text-accent-green mx-auto" aria-hidden="true" />
      <h3 className="text-lg font-display font-medium text-primary dark:text-[#E8ECE4]">
        Check your email
      </h3>
      <p className="text-sm text-secondary dark:text-secondary/70 max-w-sm mx-auto">
        If an account exists with that email, we have sent a link to reset your password.
        The link will expire in 1 hour.
      </p>
      <button
        type="button"
        onClick={() => switchView('login')}
        className="btn-primary px-6 py-2.5 text-sm shadow-sm active:scale-[0.96] transition-transform mt-4"
        aria-label="Back to log in"
      >
        Back to log in
      </button>
    </div>
  )

  const renderCheckEmail = () => (
    <div className="text-center space-y-4 py-4">
      <Mail className="w-12 h-12 text-accent-green mx-auto" aria-hidden="true" />
      <h3 className="text-lg font-display font-medium text-primary dark:text-[#E8ECE4]">
        Check your email
      </h3>
      <p className="text-sm text-secondary dark:text-secondary/70 max-w-sm mx-auto">
        We have sent a confirmation link to your email. Click it to activate your account,
        then come back and log in.
      </p>
      <button
        type="button"
        onClick={() => switchView('login')}
        className="btn-primary px-6 py-2.5 text-sm shadow-sm active:scale-[0.96] transition-transform mt-4"
        aria-label="Back to log in"
      >
        Back to log in
      </button>
    </div>
  )

  const renderResetPassword = () => (
    <form onSubmit={handleSubmitReset(handleResetPassword)} className="space-y-5">
      <p className="text-sm text-secondary dark:text-secondary/70 mb-4">
        Enter your new password below.
      </p>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="password"
            {...registerReset('password', { required: true, minLength: 6 })}
            className="input-field pl-11"
            placeholder="Min 6 characters"
            aria-label="New password"
            aria-required="true"
            aria-invalid={!!resetErrors.password}
            autoComplete="new-password"
          />
        </div>
        {resetErrors.password && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">
            Password must be at least 6 characters
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
          <input
            type="password"
            {...registerReset('confirmPassword', { required: true, minLength: 6 })}
            className="input-field pl-11"
            placeholder="Repeat password"
            aria-label="Confirm password"
            aria-required="true"
            aria-invalid={!!resetErrors.confirmPassword}
            autoComplete="new-password"
          />
        </div>
        {resetErrors.confirmPassword && (
          <p className="mt-1.5 text-sm text-accent-red font-medium" role="alert">
            Password must be at least 6 characters
          </p>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-accent-red/10 text-accent-red rounded-xl text-sm font-medium" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-accent-green/10 text-accent-green rounded-xl text-sm font-medium flex items-center gap-2" role="status" aria-live="polite">
          <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3.5 text-base shadow-sm active:scale-[0.96] transition-transform mt-2"
        aria-label="Update password"
      >
        {isLoading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )

  const getTitle = () => {
    switch (view) {
      case 'login': return 'Welcome Back'
      case 'signup': return 'Create Account'
      case 'forgot': return 'Reset Password'
      case 'forgot-sent': return 'Check Your Email'
      case 'check-email': return 'Check Your Email'
      case 'reset-password': return 'Set New Password'
    }
  }

  const getSubtitle = () => {
    switch (view) {
      case 'login': return 'Sign in to access your budget tracker'
      case 'signup': return 'Get started tracking in under 5 seconds'
      case 'forgot': return "We will send you a link to reset your password"
      case 'forgot-sent': return 'A reset link has been sent'
      case 'check-email': return 'Confirm your account to continue'
      case 'reset-password': return 'Choose a new password for your account'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
      aria-describedby="auth-modal-subtitle"
    >
      <div className="absolute inset-0 bg-primary/20 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close" />
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-md mx-4 p-6 sm:p-8 animate-scale-in border border-white/20 dark:border-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-modal-heading" className="text-2xl font-display font-medium text-primary dark:text-[#E8ECE4] mb-2">
          {getTitle()}
        </h2>
        <p id="auth-modal-subtitle" className="text-sm text-secondary dark:text-secondary/70 mb-6">
          {getSubtitle()}
        </p>

        {view === 'login' && renderLoginForm()}
        {view === 'signup' && renderSignupForm()}
        {view === 'forgot' && renderForgotForm()}
        {view === 'forgot-sent' && renderForgotSent()}
        {view === 'check-email' && renderCheckEmail()}
        {view === 'reset-password' && renderResetPassword()}
      </div>
    </div>
  )
}