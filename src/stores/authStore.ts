import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Local copy to avoid a circular import between authStore and dataStore.
const useApiLayer = () => import.meta.env.VITE_USE_API_LAYER === 'true'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isGuest: boolean
  setSession: (session: Session | null) => void
  clearSession: () => void
  setGuestMode: (value: boolean) => void
  initialize: () => Promise<(() => void) | undefined>
}

interface SignInResponse {
  user: { id: string; email: string }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number | null
  } | null
  email_confirmation_required: boolean
}

interface SessionResponse {
  user: { id: string }
  authenticated: boolean
  session?: Session | null
}

interface SignUpResponse {
  user: { id: string; email: string }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number | null
  } | null
  email_confirmation_required: boolean
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,

  setSession: (session: Session | null) => {
    set({ session, user: session?.user ?? null })
  },

  clearSession: () => {
    set({ session: null, user: null, isGuest: false })
  },

  setGuestMode: (value: boolean) => {
    if (value) {
      localStorage.setItem('isGuest', 'true')
    } else {
      localStorage.removeItem('isGuest')
    }
    set({ isGuest: value })
  },

  initialize: async () => {
    try {
      if (useApiLayer()) {
        // Use API layer for session check
        const session = await fetchSession()
        set({ session: session.session ?? null, user: session.user ? { id: session.user.id, email: '' } as User : null, isLoading: false })

        // Set up polling for auth state changes (equivalent to onAuthStateChange)
        const interval = setInterval(async () => {
          const updated = await fetchSession()
          set({
            session: updated.session ?? null,
            user: updated.user ? { id: updated.user.id, email: '' } as User : null,
          })
        }, 30000)

        return () => clearInterval(interval)
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        const isGuest = localStorage.getItem('isGuest') === 'true'
        set({ session, user: session?.user ?? null, isGuest, isLoading: false })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event: string, session: Session | null) => {
            set({ session, user: session?.user ?? null, isLoading: false })
          }
        )

        return () => subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ isLoading: false })
    }
  },
}))

// ---------------------------------------------------------------------------
// API-layer auth helpers (only used when VITE_USE_API_LAYER=true)
// ---------------------------------------------------------------------------

async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include', // Send cookies
  })

  if (!response.ok) {
    if (response.status === 401) {
      return { user: { id: '' }, authenticated: false, session: null }
    }
    throw new Error(`Session check failed: ${response.status}`)
  }

  return (await response.json()) as SessionResponse
}

async function apiSignIn(email: string, password: string): Promise<SignInResponse> {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Sign in failed')
  }

  return (await response.json()) as SignInResponse
}

async function apiSignUp(email: string, password: string): Promise<SignUpResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Sign up failed')
  }

  return (await response.json()) as SignUpResponse
}

async function apiSignOut(): Promise<void> {
  await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include',
  })
}

// Export for use in components
export { apiSignIn, apiSignUp, apiSignOut, fetchSession }