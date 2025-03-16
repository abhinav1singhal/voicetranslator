declare module 'react-speech-recognition' {
    interface SpeechRecognition {
      startListening: (options?: { language?: string; continuous?: boolean }) => void;
      stopListening: () => void;
    }
  
    const SpeechRecognition: SpeechRecognition;
  
    export function useSpeechRecognition(): {
      transcript: string;
      listening: boolean;
      browserSupportsSpeechRecognition: boolean;
    };
  
    export default SpeechRecognition;
  }
  