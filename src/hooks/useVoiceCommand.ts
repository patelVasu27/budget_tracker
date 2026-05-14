import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

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
 *
 * - startRecording(): resets transcript, starts listening (non-continuous, English)
 * - stopRecording(): stops listening (transcript arrives async after stop)
 * - abortRecording(): aborts listening and resets transcript
 */
export function useVoiceCommand(): UseVoiceCommandReturn {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition()

  const startRecording = () => {
    resetTranscript()
    SpeechRecognition.startListening({ continuous: false, language: 'en-US' })
  }

  const stopRecording = () => {
    SpeechRecognition.stopListening()
  }

  const abortRecording = () => {
    SpeechRecognition.abortListening()
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
