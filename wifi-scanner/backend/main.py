import pywifi
import asyncio
import websockets
import time
from datetime import datetime
import json

# Initialize WiFi interface
wifi = pywifi.PyWiFi()
iface = wifi.interfaces()[0]

# History of scans (each with timestamp and networks)
scan_history = []
clients = set()

def scan_wifi():
    """
    Performs a WiFi scan and returns scan data with timestamp.
    """
    iface.scan()
    time.sleep(5)  # Wait for scan to complete
    results = iface.scan_results()
    seen_ssids = set()
    networks = []

    for net in results:
        if net.ssid not in seen_ssids:
            seen_ssids.add(net.ssid)
            networks.append({
                "ssid": net.ssid,
                "signal": net.signal
            })

    return {
        "timestamp": datetime.now().isoformat(),
        "networks": networks
    }

async def broadcast_new_scan(scan_data):
    """
    Broadcasts new scan data to all connected clients.
    """
    if clients:
        message = {
            "type": "new_scan",
            "data": scan_data
        }
        message_str = json.dumps(message)
        [await client.send(message_str) for client in clients]

async def handle_client(websocket):
    """
    Handles new client connections and sends full scan history.
    """
    clients.add(websocket)
    try:
        # Send scan history on connection
        history_msg = {
            "type": "history",
            "data": scan_history
        }
        await websocket.send(json.dumps(history_msg))

        async for _ in websocket:
            pass

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.remove(websocket)

async def scanner_loop():
    """
    Performs periodic WiFi scans and stores history.
    """
    while True:
        scan_data = scan_wifi()
        scan_history.append(scan_data)
        await broadcast_new_scan(scan_data)
        await asyncio.sleep(10)

async def main():
    server = await websockets.serve(handle_client, "localhost", 8000)
    print("WebSocket server started on ws://localhost:8000")
    await asyncio.gather(scanner_loop(), server.wait_closed())

# Run the server
asyncio.run(main())
