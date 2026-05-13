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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-900">SimpleBudget</h1>
            <p className="mt-2 text-gray-600">Track your monthly expenses in seconds</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleGuestContinue}
                className="w-full py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Continue as Guest
              </button>
            </div>
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