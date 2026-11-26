import os

from dotenv import load_dotenv

load_dotenv()


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default


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


settings = Settings()


DISCLAIMER = (
    "This match percentage is produced by InterviewIQ's transparent keyword and "
    "skill-overlap heuristics. It is not an official Applicant Tracking System "
    "score and different ATS products rank resumes differently."
)
