import { useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'

interface VoiceMicButtonProps {
  onResult: (transcript: string) => void
  onError: (error: string) => void
  isDisabled?: boolean
}

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

  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
          aria-label="Voice input not available"
          aria-disabled="true"
        >
          <MicOff className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    )
  }

  if (!isMicAvailable) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-amber-500 cursor-not-allowed"
          aria-label="Voice input not available"
          aria-disabled="true"
        >
          <MicOff className="w-5 h-5" aria-hidden="true" />
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
        className={`p-3 rounded-xl transition-all duration-300 active:scale-95 ${
          isListening
            ? 'bg-accent-green/10 text-accent-green animate-pulse-mic'
            : 'bg-[#EEF1EB] dark:bg-white/5 text-secondary dark:text-secondary/70 hover:bg-[#E1E6DC] dark:hover:bg-white/10 hover:text-primary dark:hover:text-[#E8ECE4]'
        }`}
        role="button"
        aria-pressed={isListening}
        aria-disabled={isDisabled || undefined}
        aria-label={isListening ? 'Tap to stop recording' : 'Tap to record expense by voice'}
      >
        <Mic className={`w-5 h-5 transition-transform duration-300 ${isListening ? 'scale-110' : ''}`} aria-hidden="true" />
      </button>
      <div className={`absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none transition-all duration-250 shadow-md min-w-[140px] text-center z-20 ${
        isListening
          ? 'bg-accent-green text-white scale-100 opacity-100'
          : 'bg-primary dark:bg-accent-green text-white scale-95 opacity-0 group-hover:opacity-100'
      }`}>
        {isListening 
          ? (transcript || 'Listening...') 
          : 'Say: Rs. 350 on Groceries'}
      </div>
    </div>
  )
}
