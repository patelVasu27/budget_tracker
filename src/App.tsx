import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import { AuthModal } from './components/AuthModal'
import { Dashboard } from './features/Dashboard'

function App() {
  const { user, isLoading, initialize } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [isLoading, user])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  const handleGuestContinue = () => {
    setShowAuthModal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Checking authentication">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-primary/10 border-t-primary animate-spin" aria-hidden="true" />
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-gold/[0.03] rounded-full blur-3xl" />

          <div className="relative max-w-xl mx-auto px-6 py-32 flex flex-col items-center text-center">
            <div className="mb-6 p-4 bg-primary/5 rounded-2xl" aria-hidden="true">
              <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-primary mb-3">
              SimpleBudget
            </h1>
            <p className="text-lg text-secondary max-w-sm mx-auto mb-10">
              Track your monthly expenses in seconds. No complicated features—just your balance, at a glance.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary py-3.5 text-base shadow-lg shadow-primary/10"
              >
                Get Started
              </button>
              <button
                onClick={handleGuestContinue}
                className="btn-secondary py-3.5 text-base"
              >
                Continue as Guest
              </button>
            </div>

            <p className="mt-8 text-xs text-secondary/70">
              Free forever • No credit card required
            </p>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    )
  }

  return <Dashboard />
}

export default App