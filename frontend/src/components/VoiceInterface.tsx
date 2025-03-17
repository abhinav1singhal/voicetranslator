import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom"; // Import for extracting URL params


const VoiceInterface = () => {

  console.log("🚀 VoiceInterface component loaded");
    //const  params  = useParams(); // Extracts "abc123-en" or "abc123-vi"  
    //const roomLang = params.roomLang || ""; // Ensure it's always a string
    const { roomLang } = useParams();  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const supportedLanguages = ["en", "hi", "vi"] as const;
  type Language = (typeof supportedLanguages)[number];
  
  // ✅ Allow users to select spoken and target languages separately
  const [spokenLang, setSpokenLang] = useState<Language>("en");  // ✅ Language spoken by the user
  const [targetLang, setTargetLang] = useState<Language>("hi");  // ✅ Language for translation output


  const languageMap = {
    en: "en-US",
    hi: "hi-IN",
    vi: "vi-VN"
  };

  
  
  const roomId = roomLang ? roomLang.split("-")[0] : null;
  
  useEffect(() => {

    //if (!roomId || !lang) return;
    if (!roomLang) return ;

    if (socket) {
      console.log("⚠️ WebSocket already exists, not opening a new one.");
      return;
  }
    //const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${lang}`);
    //hardcoding land to keep the link consistent. As roomId is omportant for websocket.
    
    console.log(`🛜 Connecting WebSocket to: ws://localhost:8080/ws/${roomId}/${targetLang}`); // 🔥 Log WebSocket URL
    const ws = new WebSocket(`ws://localhost:8080/ws/${roomId}/${targetLang}`);
    

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
      utterance.lang = languageMap[targetLang]; // ✅ Output in the selected target language
      window.speechSynthesis.speak(utterance);
    };

    return () =>{
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          console.log("🔌 WebSocket connection closed.");
      }
    }

  }, [roomLang, targetLang, socket]);

  useEffect(() => {
    if (transcript && socket?.readyState === WebSocket.OPEN) {
      console.log(`🎙️ Sending transcript: "${transcript}" (spoken in ${spokenLang}, target: ${targetLang})`);
      socket.send(JSON.stringify({ text: transcript, sourceLang: spokenLang, targetLang }));
    }
  }, [transcript, socket]);

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser doesn't support speech recognition</div>;
  }


  const getButtonStyle = (selected: boolean) => ({
    backgroundColor: selected ? "#4CAF50" : "#ddd", // Green for selected, gray for unselected
    color: selected ? "white" : "black",
    padding: "10px 20px",
    margin: "5px",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    fontSize: "16px",
  });

  return (
    <div>
      <h2>Choose Languages</h2>

<h3>Spoken Language</h3>
<button style={getButtonStyle(spokenLang === "en")} onClick={() => setSpokenLang("en")}>English</button>
<button style={getButtonStyle(spokenLang === "hi")} onClick={() => setSpokenLang("hi")}>Hindi</button>
<button style={getButtonStyle(spokenLang === "vi")} onClick={() => setSpokenLang("vi")}>Vietnamese</button>

<h3>Target Language</h3>
<button style={getButtonStyle(targetLang === "en")} onClick={() => setTargetLang("en")}>English</button>
<button style={getButtonStyle(targetLang === "hi")} onClick={() => setTargetLang("hi")}>Hindi</button>
<button style={getButtonStyle(targetLang === "vi")} onClick={() => setTargetLang("vi")}>Vietnamese</button>

      
      <p>Microphone: {listening ? 'Listening...' : 'Off'}</p>
      <button 
       onMouseDown={() => SpeechRecognition.startListening({ language: languageMap[spokenLang] })}
        onMouseUp={SpeechRecognition.stopListening}
      >
        Push to Talk
      </button>
      <p>{transcript}</p>
    </div>
  );
  
};
export default VoiceInterface;
