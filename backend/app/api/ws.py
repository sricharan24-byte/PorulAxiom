"""WebSocket routes for real-time market quote streaming."""

import asyncio
import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.market_service import market_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_quotes(self, quotes_data: list):
        if not self.active_connections:
            return
        message = json.dumps({"type": "MARKET_TICK", "data": quotes_data})
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.remove(dead)


manager = ConnectionManager()


@router.websocket("/ws/market")
async def websocket_market_feed(websocket: WebSocket):
    """Stream live market prices continuously every 1 second."""
    await manager.connect(websocket)
    try:
        while True:
            # Generate and stream quotes
            db = SessionLocal()
            try:
                quotes = market_service.get_all_quotes(db)
                data = [q.dict() for q in quotes]
                await websocket.send_text(json.dumps({"type": "MARKET_TICK", "data": data}))
            finally:
                db.close()
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning("WebSocket connection terminated: %s", e)
        if websocket in manager.active_connections:
            manager.disconnect(websocket)
