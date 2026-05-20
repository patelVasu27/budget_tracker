import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import { AuthModal } from './components/AuthModal'
import { Dashboard } from './features/Dashboard'

function App() {
  const { user, isLoading, isGuest, initialize, setGuestMode } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const cleanup = initialize()
    return () => {
      cleanup?.then(fn => fn?.())
    }
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      setShowAuthModal(true)
    }
  }, [isLoading, user, isGuest])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  const handleGuestContinue = () => {
    setGuestMode(true)
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

  if (!user && !isGuest) {
    return (
      <>
        <div className="min-h-screen bg-[#F4F6F0] relative overflow-hidden flex items-center justify-center p-6">
          {/* Natural Glow Mesh Background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div 
              className="absolute w-full h-full"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 15% 20%, rgba(45, 106, 79, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 85% 75%, rgba(217, 167, 82, 0.06) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(90, 107, 94, 0.03) 0%, transparent 60%)
                `
              }}
            />
            {/* Elegant organic fine dots overlay */}
            <svg className="w-full h-full opacity-[0.07]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="dot-grid" width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.5" fill="#1B2A1E" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg>
          </div>

          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#2D6A4F]/[0.02] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-[#D9A752]/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-xl w-full mx-auto px-8 py-12 bg-white/60 backdrop-blur-md rounded-[32px] border border-white/80 shadow-elevated text-center flex flex-col items-center animate-slide-up">
            <div className="mb-8 p-4 bg-[#2D6A4F]/5 text-[#2D6A4F] rounded-2xl animate-scale-in" aria-hidden="true">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-medium tracking-tight text-[#1B2A1E] mb-4">
              Simple<span className="italic font-normal font-serif text-[#2D6A4F]">Budget</span>
            </h1>
            
            <p className="text-base sm:text-lg text-secondary max-w-sm mx-auto mb-10 leading-relaxed text-balance">
              Log an expense and see your remaining balance in <span className="font-semibold text-accent-green">under 5 seconds</span>. Minimalist, private, & free.
            </p>

            <div className="flex flex-col gap-3.5 w-full max-w-[280px]">
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary py-3.5 text-base shadow-md active:scale-[0.96] transition-transform"
              >
                Get Started
              </button>
              <button
                onClick={handleGuestContinue}
                className="btn-secondary py-3.5 text-base active:scale-[0.96] transition-transform"
              >
                Continue as Guest
              </button>
            </div>

            <p className="mt-8 text-xs text-secondary/60 font-medium">
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