"""Internal-service authentication.

The Python service is bound to loopback and only ever called by the Express
API. When AI_SERVICE_KEY is configured, every request must carry it in the
x-internal-key header so the AI endpoints cannot be reached from a browser.
"""

from fastapi import Header, HTTPException

from .config import settings


async def require_internal_key(x_internal_key: str = Header(default="")) -> None:
    if not settings.internal_key:
        # No key configured (local development): loopback binding is the guard.
        return
    if x_internal_key != settings.internal_key:
        raise HTTPException(status_code=401, detail="Invalid or missing internal service key.")
