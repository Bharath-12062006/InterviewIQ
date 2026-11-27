"""InterviewIQ AI service entrypoint.

Run with:
    ai-service/.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000 --host 127.0.0.1

The service is deliberately stateless: it never touches MongoDB and never sees
a user JWT. Express owns identity and persistence; this process owns text
extraction and the deterministic ATS scoring engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import ats, interview
from .services.llm_client import check_llm_health
from .services.transcriber import check_whisper_status

app = FastAPI(
    title="InterviewIQ AI Service",
    version=settings.version,
    description=(
        "Resume extraction and explainable ATS matching for InterviewIQ. "
        "All scoring is deterministic and inspectable; no score is fabricated."
    ),
)

# The service is only called server-to-server by Express, so no browser origin
# is trusted here. CORS stays closed unless a developer opts in.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=["POST", "GET"],
    allow_headers=["x-internal-key", "content-type"],
)

app.include_router(ats.router)
app.include_router(interview.router)


@app.get("/ping", tags=["system"])
def ping() -> dict:
    """Fast local liveness check for Express process management."""
    return {"status": "ok"}


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Liveness plus capability and live LLM availability check."""
    capabilities = {"pdf": False, "docx": False, "ocr": False, "spacy": False, "tfidf": False}

    try:
        import pymupdf  # noqa: F401

        capabilities["pdf"] = True
    except ImportError:
        pass

    try:
        import docx  # noqa: F401

        capabilities["docx"] = True
    except ImportError:
        pass

    try:
        import rapidocr_onnxruntime  # noqa: F401

        capabilities["ocr"] = True
    except ImportError:
        pass

    try:
        import spacy  # noqa: F401

        capabilities["spacy"] = True
    except ImportError:
        pass

    try:
        import sklearn  # noqa: F401

        capabilities["tfidf"] = True
    except ImportError:
        pass

    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.version,
        "scoringVersion": settings.scoring_version,
        "capabilities": capabilities,
        "llm": await check_llm_health(),
        "whisper": check_whisper_status(),
        "maxUploadMb": settings.max_upload_bytes // (1024 * 1024),
        "internalKeyRequired": bool(settings.internal_key),
    }
