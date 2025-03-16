import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom"; // Import for extracting URL params


const VoiceInterface = () => {

  console.log("🚀 VoiceInterface component loaded");
    const  params  = useParams(); // Extracts "abc123-en" or "abc123-vi"  
    const roomLang = params.roomLang || ""; // Ensure it's always a string
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();


  // Extract roomId and lang from URL
  const parts = roomLang.split("-");
  const roomId = parts.length > 1 ? parts[0] : null;
  const lang = parts.length > 1 ? parts[1] : null;
  const targetLang = lang === "en" ? "vi" : "en";
  
  useEffect(() => {

    if (!roomId || !lang) return;

    if (socket) {
      console.log("⚠️ WebSocket already exists, not opening a new one.");
      return;
  }
    //const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${lang}`);
    //hardcoding land to keep the link consistent. As roomId is omportant for websocket.
    console.log(`🛜 Connecting WebSocket to: ws://localhost:8080/ws/${roomId}/vi-en`); // 🔥 Log WebSocket URL
    const ws = new WebSocket(`ws://localhost:8080/ws/${roomId}/vi-en`);
    

    ws.onopen=()=>{
      console.log('✅ Connected to websocket server')
      setSocket(ws); 
    }

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    ws.onclose = (event) => {
      console.warn("⚠️ WebSocket Closed:", event.reason);
      setSocket(null); 
    };
    
    ws.onmessage = (event) => {
      console.log("📨 Received from WebSocket:", event.data);
      const utterance = new SpeechSynthesisUtterance(event.data);
      utterance.lang = targetLang === 'vi' ? 'vi-VN' : 'en-US';
      const mesage=JSON.parse(event.data)
      console.log("📨 Processed message: ",mesage)
      window.speechSynthesis.speak(utterance);
    };

    return () =>{
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          console.log("🔌 WebSocket connection closed.");
      }
    }

  }, [roomId, lang ,targetLang]);

  useEffect(() => {
    if (transcript && socket?.readyState === WebSocket.OPEN) {
      console.log("🎙️ Sending transcript:", transcript); // 🔥 Log recognized speech
      socket.send(transcript);
    }
  }, [transcript, socket]);

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser doesn't support speech recognition</div>;
  }

  return (
    <div>
      <p>Microphone: {listening ? 'Listening...' : 'Off'}</p>
      <button 
       onMouseDown={() => SpeechRecognition.startListening({ language: lang === "en" ? "en-US" : "vi-VN" })}
        onMouseUp={SpeechRecognition.stopListening}
      >
        Push to Talk
      </button>
      <p>{transcript}</p>
    </div>
  );
  
};
export default VoiceInterface;
