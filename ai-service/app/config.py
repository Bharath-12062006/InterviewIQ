import os
from importlib import import_module
from pathlib import Path

try:
    _dotenv = import_module("dotenv")
except ImportError:
    _dotenv = None

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if _dotenv is not None and _ENV_PATH.exists():
    _dotenv.load_dotenv(dotenv_path=_ENV_PATH, override=False)


def _get_env(name: str, default: str = "") -> str:
    """Read process env first, falling back to live .env values so saved key edits take effect without restart."""
    val = os.getenv(name)
    if val is not None and val.strip():
        return val.strip()
    if _dotenv is not None and _ENV_PATH.exists():
        file_vals = _dotenv.dotenv_values(_ENV_PATH)
        file_val = file_vals.get(name)
        if file_val is not None and str(file_val).strip():
            return str(file_val).strip()
    return default


def _int_env(name: str, default: int) -> int:
    raw = _get_env(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _bool_env(name: str, default: bool = False) -> bool:
    raw = _get_env(name)
    if not raw:
        return default
    return raw.lower() in ("1", "true", "yes", "on")


class Settings:
    """Runtime configuration for the InterviewIQ AI service."""

    service_name: str = "interviewiq-ai-service"
    version: str = "1.0.0"

    host: str = os.getenv("AI_HOST", "127.0.0.1")
    port: int = _int_env("AI_PORT", 8000)

    internal_key: str = os.getenv("AI_SERVICE_KEY", "").strip()

    max_upload_bytes: int = _int_env("MAX_UPLOAD_MB", 5) * 1024 * 1024
    max_text_chars: int = _int_env("MAX_RESUME_CHARS", 60000)

    allowed_extensions: tuple = (".pdf", ".docx")
    allowed_mime_types: tuple = (
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    )

    scoring_version: str = "ats-heuristic-v1"

    # Conversational AI Interviewer LLM Configuration (read dynamically via properties)
    @property
    def llm_provider(self) -> str:
        return (_get_env("LLM_PROVIDER", "ollama") or "ollama").lower()

    @property
    def ollama_base_url(self) -> str:
        return (_get_env("OLLAMA_BASE_URL", "http://localhost:11434") or "http://localhost:11434").rstrip("/")

    @property
    def ollama_model(self) -> str:
        return _get_env("OLLAMA_MODEL", "qwen3:4b") or "qwen3:4b"

    @property
    def ollama_timeout_seconds(self) -> int:
        return _int_env("OLLAMA_TIMEOUT_SECONDS", 150)

    @property
    def ollama_keep_alive(self) -> str:
        return _get_env("OLLAMA_KEEP_ALIVE", "15m") or "15m"

    @property
    def ollama_num_ctx(self) -> int:
        return _int_env("OLLAMA_NUM_CTX", 1536)

    @property
    def ollama_num_predict(self) -> int:
        return _int_env("OLLAMA_NUM_PREDICT", 300)

    @property
    def ollama_think(self) -> bool:
        return _bool_env("OLLAMA_THINK", False)

    @property
    def whisper_model(self) -> str:
        return _get_env("WHISPER_MODEL", "base") or "base"

    @property
    def whisper_compute_type(self) -> str:
        return _get_env("WHISPER_COMPUTE_TYPE", "int8") or "int8"

    @property
    def whisper_timeout_seconds(self) -> int:
        return _int_env("WHISPER_TIMEOUT_SECONDS", 45)

    @property
    def gemini_api_key(self) -> str:
        return _get_env("GEMINI_API_KEY") or _get_env("GOOGLE_API_KEY")

    @property
    def gemini_model(self) -> str:
        return _get_env("GEMINI_MODEL", "gemini-3.6-flash") or "gemini-3.6-flash"

    @property
    def openai_api_key(self) -> str:
        return _get_env("OPENAI_API_KEY")

    @property
    def openai_model(self) -> str:
        return _get_env("OPENAI_MODEL", "gpt-4o-mini") or "gpt-4o-mini"

    @property
    def llm_timeout_seconds(self) -> int:
        return _int_env("LLM_TIMEOUT_SECONDS", 35)

    @property
    def allow_nlp_fallback(self) -> bool:
        return _bool_env("ALLOW_NLP_FALLBACK", False)


settings = Settings()


def get_llm_status() -> dict:
    """Return non-sensitive static LLM configuration summary."""
    provider = settings.llm_provider
    if provider == "ollama":
        return {
            "provider": "ollama",
            "model": settings.ollama_model,
            "configured": False,  # Live /health verification updates this after probing Ollama
            "providerAvailable": False,
            "modelAvailable": False,
            "connectionStatus": "unverified",
            "allowNlpFallback": settings.allow_nlp_fallback,
            "timeoutSeconds": settings.ollama_timeout_seconds,
        }
    if provider == "openai":
        configured = bool(settings.openai_api_key)
        model = settings.openai_model
    else:
        provider = "gemini"
        configured = bool(settings.gemini_api_key)
        model = settings.gemini_model

    return {
        "provider": provider,
        "model": model,
        "configured": configured,
        "providerAvailable": configured,
        "modelAvailable": configured,
        "connectionStatus": "configured" if configured else "missing_api_key",
        "allowNlpFallback": settings.allow_nlp_fallback,
        "timeoutSeconds": settings.llm_timeout_seconds,
    }


DISCLAIMER = (
    "This match percentage is produced by InterviewIQ's transparent keyword and "
    "skill-overlap heuristics. It is not an official Applicant Tracking System "
    "score and different ATS products rank resumes differently."
)
