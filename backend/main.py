from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import logging
import json
from dotenv import load_dotenv

logging.basicConfig(
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler()  # Logs to console (works with Docker)
    ]
)

logger = logging.getLogger(__name__)  # Use this for logging

load_dotenv();
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
        self.active_connections = {} # { "room_id": [ { "socket": WebSocket, "lang": "en" }, ... ] }

    async def connect(self, websocket: WebSocket, room: str, lang: str):
        await websocket.accept()
        client_info = {"socket": websocket, "lang": lang}

        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(client_info)

        logger.info(f"✅ Connected: {websocket.client.host} | Room: {room} | Lang: {lang}")
        logger.info(f"🌐 Active Connections: {self.active_connections}")

    async def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            self.active_connections[room] = [
                client for client in self.active_connections[room] if client["socket"] != websocket
            ]
            logger.info(f"❌ Disconnected: {websocket.client.host} | Room: {room}")    

    async def broadcast(self, message: str, room: str, sender: WebSocket, source_lang: str):
        logger.info(f"📢 Broadcasting message in room: {room}")
        if room not in self.active_connections:
            return
        for client in self.active_connections[room]:
            if client["socket"] != sender:  # Don't send message back to sender
                target_lang = client["lang"]
                logger.info(f" Target Lang on room is: {target_lang}")
                
                # Translate only if target language is different
                if source_lang != target_lang:
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    response = model.generate_content(f"Translate this to {target_lang}: {message}")
                    translated_text = response.text
                else:
                    translated_text = message

                logger.info(f"🔄 {source_lang} → {target_lang}: {translated_text}")
                await client["socket"].send_text(translated_text)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    print(f"health looks okay")
    return {"status": "OK app halth is okay"}

@app.websocket("/ws/{room}/{target_lang}")
async def websocket_endpoint(websocket: WebSocket, room: str, target_lang: str):
    logger.info(f"🌍 New WebSocket Connection: room={room}, targetlang={target_lang}")
    await manager.connect(websocket, room, target_lang)
    try:
        while True:
            message_data = await websocket.receive_text()
            data = json.loads(message_data)
            text = data["text"]
            source_lang = data["sourceLang"]  # ✅ The actual spoken language
            target_lang = data["targetLang"]  # ✅ The desired translation language

            logger.info(f"📩 Received in {source_lang}: {text} (Target: {target_lang})")

            await manager.broadcast(text, room, websocket, source_lang)
    except Exception as e:
        logger.error(f"❌ Connection closed: {e}")
    finally:
        await manager.disconnect(websocket, room)    
