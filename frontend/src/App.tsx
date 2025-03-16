import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import VoiceInterface from "./components/VoiceInterface";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room/:roomLang" element={<VoiceInterface />} />
      </Routes>
    </Router>
  );
}

export default App;