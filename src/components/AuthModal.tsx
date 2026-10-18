import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X, Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  email: string
  password: string
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    mode: 'onSubmit',
  })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      reset()
      setError(null)
    }
  }, [isOpen, reset])

  // Focus trap within modal when open
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

  if (!isOpen) return null

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })
        if (error) throw error
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
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
      <div ref={modalRef} className="relative bg-surface dark:bg-[#1B2A1E] rounded-2xl shadow-modal w-full max-w-2xl mx-4 overflow-hidden animate-scale-in border border-white/20 dark:border-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-secondary hover:text-primary dark:hover:text-[#E8ECE4] hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Brand Panel - Left side on desktop */}
          <div className="hidden lg:flex lg:w-1/2 bg-accent-green/5 dark:bg-accent-green/10 p-10 lg:p-12 flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" aria-hidden="true">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <text x="100" y="120" fontFamily="Fraunces, Georgia, serif" fontSize="160" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill="currentColor">₹</text>
              </svg>
            </div>
            <div className="relative z-10 space-y-6">
              <div className="mb-2">
                <img src="/logo.png" alt="Budget Pulse" className="w-16 h-16 mx-auto object-contain" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-medium text-primary dark:text-[#E8ECE4]">
                Welcome back to your ledger
              </h3>
              <p className="text-secondary dark:text-secondary/70 max-w-sm mx-auto leading-relaxed">
                {isLogin
                  ? 'Sign in to access your Budget Pulse account. Your expenses, income, and balance — all in one place.'
                  : 'Create your Budget Pulse account. Start tracking in under 5 seconds with voice or tap.'}
              </p>
              <div className="mt-8 flex items-center gap-3 text-xs text-secondary/60 dark:text-secondary/40">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Encrypted & private
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  No spam, ever
                </span>
              </div>
            </div>
          </div>

          {/* Form Panel - Right side on desktop, full on mobile */}
          <div className="flex-1 p-6 lg:p-10 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              <h2 id="auth-modal-heading" className="text-2xl sm:text-3xl font-display font-medium text-primary dark:text-[#E8ECE4] mb-2 text-center lg:text-left">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-secondary dark:text-secondary/70 mb-8 text-center lg:text-left">
                {isLogin ? 'Sign in to access your budget tracker' : 'Get started tracking in under 5 seconds'}
              </p>
              <p id="auth-modal-subtitle" className="sr-only">
                {isLogin ? 'Sign in to your account' : 'Create a new account'}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary/70 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/40 dark:text-secondary/50 pointer-events-none" aria-hidden="true" />
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="input-field pl-11"
                      placeholder="you@example.com"
                      aria-label="Email address"
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
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
                      {...register('password', { required: true, minLength: 6 })}
                      className="input-field pl-11"
                      placeholder="Min 6 characters"
                      aria-label="Password"
                      aria-required="true"
                      aria-invalid={!!errors.password}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                  </div>
                  {errors.password && (
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
                  aria-label={isLogin ? 'Sign in' : 'Create account'}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Please wait...
                    </>
                  ) : isLogin ? 'Log In' : 'Sign Up'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-secondary font-medium">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError(null)
                    reset()
                  }}
                  className="text-accent-green hover:text-[#1E4D38] hover:underline font-semibold transition-colors"
                  aria-label={isLogin ? 'Switch to sign up' : 'Switch to log in'}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}