import { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export interface UseVoiceCommandReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  isMicAvailable: boolean
  voiceError: string | null
  toggleRecording: () => void
}

export function useVoiceCommand(): UseVoiceCommandReturn {
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition()

  const toggleRecording = () => {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      setVoiceError(null)
      resetTranscript()
      try {
        SpeechRecognition.startListening({ continuous: false, language: 'en-US' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Voice recording failed to start'
        setVoiceError(message)
      }
    }
  }

  return {
    transcript,
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    isMicAvailable: isMicrophoneAvailable,
    voiceError,
    toggleRecording,
  }
}
