import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

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
      const { data: { session } } = await supabase.auth.getSession()
      const isGuest = localStorage.getItem('isGuest') === 'true'
      set({ session, user: session?.user ?? null, isGuest, isLoading: false })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false })
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ isLoading: false })
    }
  },
}))