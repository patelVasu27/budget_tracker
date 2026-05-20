import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
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
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close" />
      <div ref={modalRef} className="relative bg-white rounded-3xl shadow-modal w-full max-w-md mx-4 p-8 border border-[#E8ECE4] animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-secondary hover:text-primary hover:bg-[#F4F6F0] rounded-xl transition-all duration-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-modal-heading" className="text-3xl font-display font-medium text-primary mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-sm text-secondary mb-6">
          {isLogin ? 'Sign in to access your budget tracker' : 'Get started tracking in under 5 seconds'}
        </p>
        <p id="auth-modal-subtitle" className="sr-only">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input-field"
              placeholder="you@example.com"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-accent-red font-medium" role="alert">Email is required</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              {...register('password', { required: true, minLength: 6 })}
              className="input-field"
              placeholder="Min 6 characters"
              aria-label="Password"
              aria-required="true"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-accent-red font-medium" role="alert">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-accent-red/10 text-accent-red rounded-xl text-xs font-medium" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-base shadow-sm active:scale-[0.96] transition-transform"
            aria-label={isLogin ? 'Sign in' : 'Create account'}
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
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
            className="text-accent-green hover:text-[#1E4D38] hover:underline font-semibold"
            aria-label={isLogin ? 'Switch to sign up' : 'Switch to log in'}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}