"""
Domain Notification — WebSocket endpoint.

Endpoint: GET /ws/notifications?token=<JWT>

Auth: JWT via query param (header tidak gampang di-set saat WebSocket handshake
di browser). Sub-protocol auth bisa jadi alternatif kalau perlu lebih ketat.

Flow:
1. Client connect dgn `?token=<access_token>`.
2. Backend validate JWT, ambil username, resolve user_id.
3. Register koneksi ke ConnectionManager.
4. Server boleh kirim pesan kapan saja via `manager.broadcast_to_user(user_id, ...)`.
5. Client boleh kirim pesan ping/heartbeat — server echo balik.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from core.websocket import manager
from domains.identity.service import get_user_by_username

logger = logging.getLogger(__name__)

ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/notifications")
async def notifications_ws(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token (dari /auth/login)"),
    db: Session = Depends(get_db),
):
    # ---- Auth: decode JWT ----
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        if not username:
            raise ValueError("missing sub")
    except (JWTError, ValueError) as exc:
        logger.warning("WS auth failed: %s", exc)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user = get_user_by_username(db, username)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id_str = str(user.id)
    await manager.connect(user_id_str, websocket)

    # Greeting
    try:
        await websocket.send_json({
            "type": "system",
            "event": "connected",
            "user_id": user_id_str,
            "message": "WebSocket connected to InsightSphere notifications",
        })

        # Receive loop (untuk heartbeat / ping)
        while True:
            data = await websocket.receive_text()
            # Echo back untuk health check (client bisa kirim "ping")
            await websocket.send_json({"type": "echo", "data": data})

    except WebSocketDisconnect:
        await manager.disconnect(user_id_str, websocket)
    except Exception as exc:
        logger.error("WS error user=%s: %s", user_id_str, exc)
        await manager.disconnect(user_id_str, websocket)
