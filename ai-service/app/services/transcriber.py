"""Offline CPU speech-to-text transcription using faster-whisper."""

import asyncio
import logging
import os
import tempfile
import threading
from pathlib import Path
from typing import Optional

import av
import numpy as np
from fastapi import HTTPException

from ..config import settings

logger = logging.getLogger(__name__)

ALLOWED_AUDIO_EXTENSIONS = (".webm", ".wav", ".ogg", ".mp3", ".m4a", ".mp4")
MIN_AUDIO_BYTES = 512
MAX_AUDIO_BYTES = 15 * 1024 * 1024
MIN_DURATION_SECONDS = 0.4
MAX_DURATION_SECONDS = 300.0

_MODEL = None
_MODEL_NAME: Optional[str] = None
_MODEL_LOCK = threading.Lock()
_TRANSCRIBE_ASYNC_LOCK: Optional[asyncio.Lock] = None


def _get_async_lock() -> asyncio.Lock:
    global _TRANSCRIBE_ASYNC_LOCK
    if _TRANSCRIBE_ASYNC_LOCK is None:
        _TRANSCRIBE_ASYNC_LOCK = asyncio.Lock()
    return _TRANSCRIBE_ASYNC_LOCK


def check_whisper_status() -> dict:
    """Return non-sensitive offline speech-to-text readiness status."""
    try:
        import faster_whisper  # noqa: F401

        available = True
    except ImportError:
        available = False

    return {
        "engine": "faster-whisper",
        "model": settings.whisper_model,
        "computeType": settings.whisper_compute_type,
        "device": "cpu",
        "available": available,
        "loaded": _MODEL is not None,
    }


def _get_model():
    global _MODEL, _MODEL_NAME
    target = settings.whisper_model
    compute = settings.whisper_compute_type
    with _MODEL_LOCK:
        if _MODEL is None or _MODEL_NAME != target:
            from faster_whisper import WhisperModel

            logger.info("Loading faster-whisper model=%s device=cpu compute_type=%s", target, compute)
            _MODEL = WhisperModel(target, device="cpu", compute_type=compute)
            _MODEL_NAME = target
        return _MODEL


def _decode_audio_16k(file_path: str) -> tuple[np.ndarray, float]:
    """Decode browser audio (.webm, .ogg, .wav, .mp3, .m4a) to 16kHz mono float32 PCM via PyAV."""
    resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
    chunks = []
    with av.open(file_path) as container:
        audio_streams = [s for s in container.streams if s.type == "audio"]
        if not audio_streams:
            raise ValueError("Uploaded file contains no audio track.")
        for frame in container.decode(audio=0):
            for resampled in resampler.resample(frame):
                chunks.append(resampled.to_ndarray().reshape(-1))
        for resampled in resampler.resample(None):
            chunks.append(resampled.to_ndarray().reshape(-1))

    if not chunks:
        return np.zeros(0, dtype=np.float32), 0.0

    pcm = np.concatenate(chunks)
    audio_f32 = pcm.astype(np.float32) / 32768.0
    duration_sec = len(audio_f32) / 16000.0
    return audio_f32, duration_sec


def _run_whisper_sync(file_path: str) -> dict:
    audio_f32, duration = _decode_audio_16k(file_path)
    if duration < MIN_DURATION_SECONDS:
        raise ValueError(
            f"Recording is too short ({duration:.1f}s). Speak for at least 1 second and try again."
        )
    if duration > MAX_DURATION_SECONDS:
        raise ValueError(
            f"Recording exceeds the {int(MAX_DURATION_SECONDS)}s limit."
        )

    model = _get_model()
    segments, info = model.transcribe(
        audio_f32,
        beam_size=2,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 400},
        initial_prompt=(
            "Technical software engineering campus placement interview answer covering Python, Java, "
            "JavaScript, React, Node.js, Express, MongoDB, SQL, REST APIs, data structures, and algorithms."
        ),
    )
    text_parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
    transcript = " ".join(text_parts).strip()
    language = str(getattr(info, "language", "en") or "en")

    return {
        "transcript": transcript,
        "durationSeconds": round(duration, 2),
        "language": language,
    }


async def transcribe_audio_bytes(raw_bytes: bytes, filename: str) -> dict:
    """Validate uploaded audio bytes and run offline Whisper transcription on a worker thread."""
    ext = Path(filename or "recording.webm").suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext or 'unknown'}'. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}",
        )
    if not raw_bytes or len(raw_bytes) < MIN_AUDIO_BYTES:
        raise HTTPException(
            status_code=422,
            detail="Audio recording is empty or too short. Check your microphone and try recording again.",
        )
    if len(raw_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Audio recording exceeds the 15 MB upload limit.",
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        async with _get_async_lock():
            result = await asyncio.wait_for(
                asyncio.to_thread(_run_whisper_sync, tmp_path),
                timeout=settings.whisper_timeout_seconds,
            )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail=f"Speech transcription timed out after {settings.whisper_timeout_seconds}s. Please record a shorter answer.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Whisper transcription error")
        raise HTTPException(
            status_code=502,
            detail=f"Could not transcribe audio locally: {exc}",
        ) from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    if not result.get("transcript"):
        raise HTTPException(
            status_code=422,
            detail="No clear speech detected in the recording. Please speak closer to your microphone and try again.",
        )

    return {
        "success": True,
        "transcript": result["transcript"],
        "durationSeconds": result["durationSeconds"],
        "language": result["language"],
        "engine": f"faster-whisper-{settings.whisper_model}",
    }
