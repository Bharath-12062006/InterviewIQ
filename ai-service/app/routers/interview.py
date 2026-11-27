"""Conversational AI Mock Interview HTTP router."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..security import require_internal_key
from ..services import interviewer, transcriber
from ..services.llm_client import LLMConfigError, LLMUpstreamError

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/transcribe", dependencies=[Depends(require_internal_key)])
async def transcribe_candidate_audio(file: UploadFile = File(...)) -> dict:
    raw = await file.read()
    return await transcriber.transcribe_audio_bytes(raw, file.filename or "recording.webm")


@router.post("/start", dependencies=[Depends(require_internal_key)])
async def start_interview_session(req: interviewer.StartInterviewRequest) -> dict:
    try:
        result = await interviewer.start_interview(req)
        return result.model_dump()
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMUpstreamError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/answer", dependencies=[Depends(require_internal_key)])
async def submit_interview_answer(req: interviewer.SubmitAnswerRequest) -> dict:
    try:
        result = await interviewer.process_candidate_answer(req)
        return result.model_dump()
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMUpstreamError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/final-report", dependencies=[Depends(require_internal_key)])
async def build_final_interview_report(req: interviewer.FinalReportRequest) -> dict:
    try:
        result = await interviewer.generate_final_report(req)
        return result.model_dump()
    except LLMConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMUpstreamError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
