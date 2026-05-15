import { useSpeechRecognition as useSpeechRecognitionOrig } from 'react-speech-recognition'

export interface UseVoiceCommandReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  isMicAvailable: boolean
  toggleRecording: () => void
}

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

  const toggleRecording = () => {
    if (listening) {
      stopListening()
    } else {
      resetTranscript()
      startListening({ continuous: false, language: 'en-US' })
    }
  }

  return {
    transcript,
    isListening: listening,
    isSupported: browserSupportsSpeechRecognition,
    isMicAvailable: isMicrophoneAvailable,
    toggleRecording,
  }
}
