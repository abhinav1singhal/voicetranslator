import asyncio
import websockets

async def test_websocket():
    uri = "ws://localhost:8000/ws/abc123/en"
    async with websockets.connect(uri) as websocket:
        await websocket.send("Hello, translate this!")
        response = await websocket.recv()
        print("Response:", response)

asyncio.run(test_websocket())
