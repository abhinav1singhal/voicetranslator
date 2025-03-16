from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        print(f"client {websocket.client.host}: {websocket.client.port}")
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
        print(f"connected clients {self.active_connections}")

    async def broadcast(self, message: str, room: str, sender: WebSocket):
        for connection in self.active_connections.get(room, []):
            if connection != sender:
                await connection.send_text(message)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    print(f"health looks okay")
    return {"status": "OK app halth is okay"}

@app.websocket("/ws/{room}/{lang}")
async def websocket_endpoint(websocket: WebSocket, room: str, lang: str):
    print(f"room= {room} lang={lang}")
    await manager.connect(websocket, room)
    try:
        while True:
            text = await websocket.receive_text()
            target_lang = "vi" if lang == "en" else "en"
            
            # Gemini AI translation
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(
                f"Translate this to {target_lang}: {text}"
            )
            translation = response.text
            
            await manager.broadcast(translation, room, websocket)
    except Exception as e:
        print(f"Connection closed: {e}")
