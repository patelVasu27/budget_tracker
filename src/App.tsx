import { useCallback, useEffect, useState } from 'react'
import { Sun, Moon, Mic } from 'lucide-react'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { AuthModal } from './components/AuthModal'
import { Dashboard } from './features/Dashboard'

function App() {
  const { user, isLoading, isGuest, initialize, setGuestMode } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  // Detect password-reset recovery token in URL hash on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true)
      setShowAuthModal(true)
    }
  }, [])
  const [waveformPhase, setWaveformPhase] = useState(0)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

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

  // Animate waveform for voice demo
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformPhase(p => (p + 1) % 20)
    }, 120)
    return () => clearInterval(interval)
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false)
  }, [])

  const handleAuthClose = useCallback(() => {
    setShowAuthModal(false)
    setIsRecovery(false)
  }, [])

  const handleGuestContinue = () => {
    setGuestMode(true)
    setShowAuthModal(false)
  }

  const handleTryVoice = () => {
    setGuestMode(true)
    setShowAuthModal(true)
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
        <div className="min-h-screen bg-background dark:bg-[#0F1410] relative overflow-hidden transition-colors duration-300">
          {/* Single field color background with ₹ watermark */}
          <div className="absolute inset-0 pointer-events-none aria-hidden" aria-hidden="true">
            {/* Large ₹ watermark */}
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-[500px] opacity-[0.03] dark:opacity-[0.05]" viewBox="0 0 200 200" preserveAspectRatio="none">
              <text x="100" y="130" fontFamily="Fraunces, Georgia, serif" fontSize="180" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill="currentColor">₹</text>
            </svg>
            {/* Subtle grain overlay */}
            <svg className="w-full h-full opacity-[0.04] dark:opacity-[0.06]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.5" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grain)" />
            </svg>
          </div>

          <div className="relative flex min-h-screen items-center justify-center p-6 lg:p-12">
            <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-start lg:items-center gap-12 lg:gap-16">
              {/* Left Panel - Hero Content */}
              <div className="relative flex-1 lg:max-w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left animate-slide-up stagger-1">
                {/* Animated ₹ Symbol */}
                <div className="mb-8 relative" aria-hidden="true">
                  <svg className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-accent-green animate-draw" viewBox="0 0 100 100" style={{ transformOrigin: 'center' }}>
                    <defs>
                      <path id="rupee-path" d="M50 15 C50 15, 70 15, 70 30 C70 40, 55 45, 50 45 C45 45, 30 40, 30 30 C30 20, 40 15, 50 15 Z M50 30 L50 55 M30 55 L70 55 M30 70 L70 70" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </defs>
                    <use href="#rupee-path" style={{ strokeDasharray: '120', strokeDashoffset: '120' }} />
                  </svg>
                </div>

                <h1 className="text-hero font-display font-medium tracking-tight text-primary dark:text-[#E8ECE4] mb-6 max-w-xl">
                  Log an expense.<br />See your balance.<br /><span className="text-accent-green">In under 5 seconds.</span>
                </h1>

                <p className="text-base sm:text-lg text-secondary dark:text-secondary/70 max-w-sm lg:max-w-md mb-10 leading-relaxed text-balance">
                  No forms. No friction. Just speak or tap. Your monthly ledger, always current.
                </p>

                {/* Primary CTA - Voice First */}
                <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs lg:max-w-none">
                  <button
                    onClick={handleTryVoice}
                    className="btn-primary py-4 text-base shadow-lg active:scale-[0.96] transition-transform flex items-center justify-center gap-3 group relative overflow-hidden"
                    aria-label="Try voice entry as guest"
                  >
                    <Mic className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    <span>Try Voice Entry</span>
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </button>
                </div>

                {/* Secondary - Guest continue */}
                <p className="mt-6 text-sm text-secondary/60 dark:text-secondary/50 font-medium text-center lg:text-left">
                  <button
                    onClick={handleGuestContinue}
                    className="text-accent-green hover:text-[#1E4D38] underline underline-offset-2 font-semibold transition-colors"
                    aria-label="Continue as guest without voice"
                  >
                    Or continue as guest
                  </button>
                </p>

                <p className="mt-8 text-xs text-secondary/50 dark:text-secondary/40 font-medium text-center lg:text-left max-w-sm">
                  Free forever • No account needed to try • Data stays in your browser
                </p>
              </div>

              {/* Right Panel - Voice Demo */}
              <div className="relative flex-1 lg:max-w-[45%] flex items-center justify-center animate-slide-up stagger-2" aria-hidden="true">
                <div className="relative w-full max-w-md">
                  {/* Phone frame mockup */}
                  <div className="relative bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-[36px] p-1.5 border border-white/20 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                    <div className="bg-background dark:bg-[#0F1410] rounded-[32px] overflow-hidden min-h-[480px] max-h-[480px] flex flex-col">
                      {/* Status bar */}
                      <div className="flex items-center justify-between px-4 py-3 text-xs text-secondary/60 dark:text-secondary/40">
                        <span>9:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-3 rounded-full bg-secondary/30" />
                          <span className="w-5 h-3 rounded-full bg-secondary/30" />
                          <span className="w-5 h-3 rounded-full bg-secondary/30" />
                          <span className="w-6 h-3 rounded-full bg-secondary/30" />
                        </div>
                      </div>

                      {/* Voice Entry Demo */}
                      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                        {/* Animated Waveform */}
                        <div className="relative flex items-center justify-center gap-2" role="img" aria-label="Voice waveform animation">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 rounded-full bg-accent-green/60 transition-all duration-150 ease-in-out"
                              style={{
                                height: `${30 + Math.abs(Math.sin((waveformPhase + i * 0.5) * 0.3) * 50)}px`,
                                animationDelay: `${i * 50}ms`,
                              }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-secondary/70 dark:text-secondary/50 mb-2">Listening...</p>
                          <p className="text-lg font-display font-medium text-primary dark:text-[#E8ECE4]">&quot;₹350 on groceries&quot;</p>
                        </div>

                        {/* Prefilled Form Preview */}
                        <div className="w-full px-4 space-y-3">
                          <div className="bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-white/10 animate-scale-in stagger-3">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-11 h-11 rounded-xl bg-accent-green/10 flex items-center justify-center">
                                <span className="text-lg" role="img" aria-label="Food category">🍽️</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-secondary/60 dark:text-secondary/40">Category</p>
                                <p className="font-semibold text-primary dark:text-[#E8ECE4]">Food</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-secondary/60 dark:text-secondary/40">Amount</p>
                                <p className="text-3xl font-display font-bold text-accent-green tabular-nums">₹350.00</p>
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-accent-green/10 flex items-center justify-center">
                                <Mic className="w-6 h-6 text-accent-green" aria-hidden="true" />
                              </div>
                            </div>
                          </div>

                          <button className="btn-primary w-full py-3.5 text-base shadow-md active:scale-[0.96] transition-transform animate-scale-in stagger-4">
                            Confirm & Save
                          </button>
                        </div>
                      </div>

                      {/* Home indicator */}
                      <div className="flex justify-center pb-3">
                        <div className="w-10 h-1 rounded-full bg-white/30 dark:bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Toggle - Bottom Right */}
            <button
              onClick={toggleDarkMode}
              className="fixed bottom-8 right-8 p-3 rounded-2xl bg-white/60 dark:bg-[#1B2A1E]/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-elevated text-secondary hover:text-primary dark:hover:text-[#E8ECE4] transition-all duration-300 hover:shadow-lg"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          isRecovery={isRecovery}
        />
      </>
    )
  }

  return <Dashboard />
}

export default App