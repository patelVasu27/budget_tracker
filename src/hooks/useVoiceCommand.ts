import { useSpeechRecognition as useSpeechRecognitionOrig } from 'react-speech-recognition'

export interface UseVoiceCommandReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  isMicAvailable: boolean
  startRecording: () => void
  stopRecording: () => void
  abortRecording: () => void
}

/**
 * Custom hook wrapping react-speech-recognition with hold-to-record semantics.
 */
export function useVoiceCommand(): UseVoiceCommandReturn {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognitionOrig()

  const startRecording = () => {
    resetTranscript()
    startListening({ continuous: false, language: 'en-US' })
  }

  const stopRecording = () => {
    stopListening()
  }

  const abortRecording = () => {
    stopListening()
    resetTranscript()
  }

  return {
    transcript,
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    isMicAvailable: isMicrophoneAvailable,
    startRecording,
    stopRecording,
    abortRecording,
  }
}
