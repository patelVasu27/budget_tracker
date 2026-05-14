import { useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'

interface VoiceMicButtonProps {
  onResult: (transcript: string) => void
  onError: (error: string) => void
  isDisabled?: boolean
}

/**
 * Hold-to-record microphone button with three render states:
 *
 * 1. Unsupported browser (D-23) — disabled button with tooltip
 * 2. Mic permission denied (D-21) — disabled with amber tooltip
 * 3. Active hold-to-record (D-18) — press and hold to record, release to stop
 *
 * Handles both mouse and touch events for cross-device compatibility (Pitfall 3).
 */
export function VoiceMicButton({ onResult, onError: _onError, isDisabled }: VoiceMicButtonProps) {
  const {
    transcript,
    isListening,
    isSupported,
    isMicAvailable,
    startRecording,
    stopRecording,
    abortRecording,
  } = useVoiceCommand()

  // React to transcript changes after recording stops (Pitfall 1)
  const wasListeningRef = useRef(false)
  const lastTranscriptRef = useRef('')

  useEffect(() => {
    if (wasListeningRef.current && !isListening && transcript && transcript !== lastTranscriptRef.current) {
      onResult(transcript)
    }
    lastTranscriptRef.current = transcript
    wasListeningRef.current = isListening
  }, [isListening, transcript, onResult])

  // D-23: Not supported — show disabled button with tooltip
  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
          aria-label="Voice input not supported in your browser"
          title="Voice input not supported in your browser"
        >
          <MicOff className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Voice input not supported in your browser
        </div>
      </div>
    )
  }

  // D-21: Mic permission denied
  if (!isMicAvailable) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-3 rounded-xl bg-gray-100 text-amber-500 cursor-not-allowed"
          aria-label="Microphone access denied"
          title="Microphone access denied. Update browser settings to enable."
        >
          <MicOff className="w-5 h-5" />
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Microphone access denied. Update browser settings to enable.
        </div>
      </div>
    )
  }

  // D-18: Hold-to-record
  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={abortRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      onTouchCancel={abortRecording}
      disabled={isDisabled}
      className={`p-3 rounded-xl transition-all duration-200 ${
        isListening
          ? 'bg-accent-red/10 text-accent-red animate-pulse-mic'
          : 'bg-primary/5 text-secondary hover:bg-primary/10 hover:text-primary'
      }`}
      title={isListening ? 'Release to stop' : 'Press and hold to record'}
      aria-label={isListening ? 'Recording - release to stop' : 'Press and hold to record'}
    >
      <Mic className={`w-5 h-5 transition-transform duration-200 ${isListening ? 'scale-110' : ''}`} />
    </button>
  )
}
