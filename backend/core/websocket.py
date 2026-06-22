"""
Core WebSocket — Connection Manager (singleton).

Skala MVP: in-memory, single-process. Tiap user_id boleh punya >1 koneksi
(multiple tab/device). Broadcast ke semua koneksi untuk user yg dituju.

Limitasi & roadmap scaling:
- Tidak bekerja di multi-instance/horizontal scaling. Gunakan Redis pub/sub
  atau Postgres LISTEN/NOTIFY untuk fan-out antar process.
- Tidak ada persistence — pesan hilang kalau client offline. Notifikasi
  utama tetap di-persist via NotificationService (DB), WebSocket cuma push.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Thread-safe manager untuk koneksi WebSocket per user."""

    def __init__(self):
        # user_id (str) → set of WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)
        logger.info(
            "WS connected user=%s total_for_user=%d",
            user_id, len(self._connections[user_id]),
        )

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)
        logger.info("WS disconnected user=%s", user_id)

    async def broadcast_to_user(self, user_id: str, payload: Dict[str, Any]) -> int:
        """
        Push JSON payload ke SEMUA koneksi user. Return jumlah socket yg sukses.
        Koneksi yg gagal kirim akan otomatis di-cleanup.
        """
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))

        if not sockets:
            return 0

        delivered = 0
        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(payload)
                delivered += 1
            except Exception as exc:
                logger.warning("WS send failed user=%s err=%s", user_id, exc)
                dead.append(ws)

        # Cleanup mati
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.get(user_id, set()).discard(ws)
                if user_id in self._connections and not self._connections[user_id]:
                    self._connections.pop(user_id, None)

        return delivered

    def stats(self) -> Dict[str, Any]:
        """Untuk endpoint debugging / monitoring."""
        return {
            "users_online": len(self._connections),
            "total_connections": sum(len(s) for s in self._connections.values()),
        }


# Singleton — di-import dari mana saja
manager = ConnectionManager()


def schedule_broadcast(user_id: str, payload: Dict[str, Any]) -> None:
    """
    Fire-and-forget helper untuk dipanggil dari kode SYNC (mis. service layer).
    Schedule broadcast ke event loop yg sedang aktif (FastAPI lifespan).
    Jika tidak ada loop (mis. CLI script), payload silently di-skip.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast_to_user(user_id, payload))
            return
    except RuntimeError:
        pass
    logger.debug("schedule_broadcast skipped (no running loop) user=%s", user_id)
