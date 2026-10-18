import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'

interface VoiceMicButtonProps {
  onResult: (transcript: string) => void
  onError: (error: string) => void
  isDisabled?: boolean
}

const HINTS = [
  'Say: ₹350 on groceries',
  'Say: ₹250 on food',
  'Say: Received ₹5000 salary',
  'Say: ₹120 Uber ride',
]

export function VoiceMicButton({ onResult, onError, isDisabled }: VoiceMicButtonProps) {
  const {
    transcript,
    isListening,
    isSupported,
    isMicAvailable,
    voiceError,
    toggleRecording,
  } = useVoiceCommand()

  const wasListeningRef = useRef(false)
  const [hintIndex, setHintIndex] = useState(0)

  useEffect(() => {
    if (wasListeningRef.current && !isListening && transcript) {
      onResult(transcript)
    }
    wasListeningRef.current = isListening
  }, [isListening, transcript, onResult])

  useEffect(() => {
    if (voiceError) {
      onError(voiceError)
    }
  }, [voiceError, onError])

  useEffect(() => {
    if (isListening) return
    const id = setInterval(() => setHintIndex(i => (i + 1) % HINTS.length), 3000)
    return () => clearInterval(id)
  }, [isListening])

  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed flex items-center justify-center"
          aria-label="Voice input not available"
          aria-disabled="true"
        >
          <MicOff className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    )
  }

  if (!isMicAvailable) {
    return (
      <div className="relative group">
        <button
          disabled
          className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl bg-gray-100 dark:bg-white/5 text-amber-500 cursor-not-allowed flex items-center justify-center"
          aria-label="Microphone not available"
          aria-disabled="true"
        >
          <MicOff className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <button
        onClick={(e) => {
          e.preventDefault()
          toggleRecording()
        }}
        disabled={isDisabled}
        className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center focus-visible:outline-none ${
          isListening
            ? 'bg-accent-green text-white shadow-lg shadow-accent-green/25 animate-pulse-mic'
            : 'bg-[#EEF1EB] dark:bg-white/5 text-secondary dark:text-secondary/70 hover:bg-[#E1E6DC] dark:hover:bg-white/10 hover:text-primary dark:hover:text-[#E8ECE4] ring-1 ring-accent-green/20'
        } ${voiceError && !isListening ? 'ring-2 ring-accent-red/40' : ''}`}
        aria-pressed={isListening}
        aria-disabled={isDisabled || undefined}
        aria-label={isListening ? 'Tap to stop recording' : 'Tap to record expense by voice'}
      >
        {isListening ? (
          <span className="flex items-end gap-0.5 h-6" aria-hidden="true">
            {[0, 1, 2, 3, 4].map(i => (
              <span
                key={i}
                className="w-1 rounded-full bg-white animate-pulse"
                style={{ height: `${12 + ((i * 7) % 12)}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
        ) : (
          <Mic className="w-6 h-6" aria-hidden="true" />
        )}
      </button>
      <div
        className={`absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none transition-all duration-200 shadow-md min-w-[160px] max-w-[240px] text-center text-balance z-20 ${
          isListening
            ? 'bg-accent-green text-white scale-100 opacity-100'
            : 'bg-primary dark:bg-accent-green text-white scale-95 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
        }`}
      >
        <span aria-live="polite">
          {isListening
            ? (transcript || 'Listening...')
            : HINTS[hintIndex]}
        </span>
      </div>
      <span className="sr-only" aria-live="polite">
        {isListening ? `Listening: ${transcript}` : ''}
        {voiceError ? `Voice error: ${voiceError}` : ''}
      </span>
    </div>
  )
}
