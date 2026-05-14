declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    continuous?: boolean
    language?: string
    interimResults?: boolean
  }

  interface UseSpeechRecognitionReturn {
    transcript: string
    listening: boolean
    browserSupportsSpeechRecognition: boolean
    isMicrophoneAvailable: boolean
    resetTranscript: () => void
  }

  const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>
    stopListening: () => Promise<void>
    abortListening: () => void
  }

  export function useSpeechRecognition(): UseSpeechRecognitionReturn
  export default SpeechRecognition
}
