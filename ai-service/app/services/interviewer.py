"""AI-powered conversational mock interviewer & evidence-based answer evaluator.

Uses the configured LLM provider (Gemini primary, OpenAI optional) with strict
Pydantic validation, spaCy + TF-IDF answer signal analysis, duplicate-question
detection, conversation memory summarization, and resume-aware context.
"""

from functools import lru_cache
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config import settings
from . import textutil
from .llm_client import LLMConfigError, LLMUpstreamError, generate_structured_json

DIFFICULTY_LEVELS = ("beginner", "intermediate", "advanced")

PERSONA_MAP = {
    "friendly interviewer": {
        "name": "Maya",
        "tone": "warm, encouraging, patient, and collaborative while probing for concrete clarity",
    },
    "friendly": {
        "name": "Maya",
        "tone": "warm, encouraging, patient, and collaborative while probing for concrete clarity",
    },
    "strict technical interviewer": {
        "name": "Vikram",
        "tone": "rigorous, direct, precision-focused, checking edge cases, complexity, and internals",
    },
    "strict technical": {
        "name": "Vikram",
        "tone": "rigorous, direct, precision-focused, checking edge cases, complexity, and internals",
    },
    "senior software engineer": {
        "name": "Arjun",
        "tone": "pragmatic, architecture-minded, focused on production trade-offs, debugging, and scale",
    },
    "senior engineer": {
        "name": "Arjun",
        "tone": "pragmatic, architecture-minded, focused on production trade-offs, debugging, and scale",
    },
    "hr interviewer": {
        "name": "Ananya",
        "tone": "empathetic, structured, probing STAR behavior, ownership, communication, and teamwork",
    },
    "hr": {
        "name": "Ananya",
        "tone": "empathetic, structured, probing STAR behavior, ownership, communication, and teamwork",
    },
}


@lru_cache(maxsize=1)
def _load_spacy():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception:
        return None


def _persona_for_mode(mode: str) -> dict:
    return PERSONA_MAP.get((mode or "").strip().lower(), PERSONA_MAP["strict technical interviewer"])


def _normalize_difficulty(val: str) -> str:
    low = str(val or "intermediate").strip().lower()
    if low in DIFFICULTY_LEVELS:
        return low
    if "easy" in low or "basic" in low:
        return "beginner"
    if "med" in low or "mod" in low:
        return "intermediate"
    if "hard" in low or "expert" in low or "senior" in low:
        return "advanced"
    return "intermediate"


# ------------------------------------------------------------------ Pydantic IO
class ResumeContext(BaseModel):
    candidateName: str = ""
    targetRole: str = ""
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    missingSkills: list[str] = Field(default_factory=list)
    projects: list[Any] = Field(default_factory=list)
    experience: list[Any] = Field(default_factory=list)
    education: list[Any] = Field(default_factory=list)


class ConversationTurn(BaseModel):
    role: Literal["interviewer", "candidate"]
    content: str
    topic: str = ""
    difficulty: str = ""


class StartInterviewRequest(BaseModel):
    candidateName: str = "Candidate"
    jobRole: str = "Software Engineer"
    category: str = "Technical Interview"
    difficulty: str = "Intermediate"
    mode: str = "Strict Technical Interviewer"
    durationMinutes: int = 20
    seedQuestion: str = ""
    resumeContext: Optional[ResumeContext] = None


class StartInterviewResponse(BaseModel):
    interviewer_name: str
    greeting: str
    first_question: str
    topic: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    engine: str


class AnswerEvaluation(BaseModel):
    score: float = Field(ge=0.0, le=10.0)
    accuracy: Literal["excellent", "correct", "partial", "incorrect", "unclear"]
    technical_accuracy: int = Field(ge=0, le=100)
    conceptual_understanding: int = Field(ge=0, le=100)
    completeness: int = Field(ge=0, le=100)
    relevance: int = Field(ge=0, le=100)
    depth: int = Field(ge=0, le=100)
    communication_clarity: int = Field(ge=0, le=100)
    what_was_correct: list[str] = Field(default_factory=list)
    what_was_missing: list[str] = Field(default_factory=list)
    suggested_improvement: str = ""
    ideal_answer: str = ""
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    feedback: str = ""

    @model_validator(mode="before")
    @classmethod
    def _fill_missing_subaxes_from_llm_score(cls, data):
        if not isinstance(data, dict):
            return data
        axes = (
            "technical_accuracy",
            "conceptual_understanding",
            "completeness",
            "relevance",
            "depth",
            "communication_clarity",
        )
        present_vals = []
        for ax in axes:
            if ax in data and data[ax] is not None:
                try:
                    present_vals.append(max(0, min(100, int(round(float(data[ax]))))))
                except Exception:
                    pass
        base = int(round(sum(present_vals) / len(present_vals))) if present_vals else int(
            round(max(0.0, min(10.0, float(data.get("score", 5.0)))) * 10)
        )
        for ax in axes:
            if data.get(ax) is None:
                data[ax] = base
        if data.get("accuracy") is None:
            data["accuracy"] = base
        return data

    @field_validator("score", mode="before")
    @classmethod
    def _clamp_score(cls, v):
        val = float(v)
        if val > 10.0:
            val = val / 10.0
        return round(max(0.0, min(10.0, val)), 1)

    @field_validator("accuracy", mode="before")
    @classmethod
    def _normalize_accuracy(cls, v):
        if isinstance(v, (int, float)):
            num = float(v)
            pct = num * 10 if num <= 10 else num
            if pct >= 85:
                return "excellent"
            if pct >= 70:
                return "correct"
            if pct >= 45:
                return "partial"
            if pct >= 20:
                return "incorrect"
            return "unclear"
        low = str(v or "partial").strip().lower()
        if low in ("excellent", "correct", "partial", "incorrect", "unclear"):
            return low
        if "excel" in low or "outstand" in low:
            return "excellent"
        if "part" in low or "fair" in low or "incomplete" in low:
            return "partial"
        if "wrong" in low or "false" in low or "inaccurate" in low:
            return "incorrect"
        if "unclear" in low or "off" in low or "unrel" in low:
            return "unclear"
        if "good" in low or "right" in low or "accurate" in low:
            return "correct"
        return "partial"

    @field_validator(
        "technical_accuracy",
        "conceptual_understanding",
        "completeness",
        "relevance",
        "depth",
        "communication_clarity",
        mode="before",
    )
    @classmethod
    def _clamp_subscore(cls, v):
        try:
            return max(0, min(100, int(round(float(v)))))
        except Exception:
            return 0

    @field_validator("what_was_correct", "what_was_missing", "strengths", "weaknesses", mode="before")
    @classmethod
    def _coerce_str_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []


class SubmitAnswerRequest(BaseModel):
    jobRole: str = "Software Engineer"
    category: str = "Technical Interview"
    difficulty: str = "Intermediate"
    mode: str = "Strict Technical Interviewer"
    durationMinutes: int = 20
    remainingSeconds: int = 900
    currentQuestion: str
    currentTopic: str = ""
    candidateAnswer: str
    conversationHistory: list[ConversationTurn] = Field(default_factory=list)
    conversationSummary: str = ""
    askedQuestions: list[str] = Field(default_factory=list)
    topicsCovered: list[str] = Field(default_factory=list)
    answeredCount: int = 0
    maxQuestions: int = 8
    resumeContext: Optional[ResumeContext] = None


class SubmitAnswerResponse(BaseModel):
    evaluation: AnswerEvaluation
    conversational_response: str
    next_action: Literal[
        "follow_up",
        "elaborate_example",
        "probe_missing",
        "simplify_or_pivot",
        "clarify",
        "advance_difficulty",
        "next_topic",
        "conclude",
    ]
    next_question: str = ""
    next_topic: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    interview_complete: bool
    updated_summary: str = ""
    nlp_signals: dict = Field(default_factory=dict)
    engine: str

    @field_validator("next_action", mode="before")
    @classmethod
    def _normalize_next_action(cls, v):
        allowed = {
            "follow_up",
            "elaborate_example",
            "probe_missing",
            "simplify_or_pivot",
            "clarify",
            "advance_difficulty",
            "next_topic",
            "conclude",
        }
        low = str(v or "follow_up").strip().lower().replace("-", "_").replace(" ", "_")
        if low in allowed:
            return low
        if "clarify" in low:
            return "clarify"
        if "simpl" in low or "pivot" in low:
            return "simplify_or_pivot"
        if "miss" in low or "probe" in low:
            return "probe_missing"
        if "example" in low or "elaborat" in low:
            return "elaborate_example"
        if "advanc" in low or "hard" in low:
            return "advance_difficulty"
        if "conclud" in low or "end" in low or "finish" in low:
            return "conclude"
        if "next" in low or "topic" in low:
            return "next_topic"
        return "follow_up"


class EvaluatedQuestionItem(BaseModel):
    question: str
    candidateAnswer: str
    topic: str = ""
    difficulty: str = ""
    score: float = 0.0
    accuracy: str = ""
    technical_accuracy: int = 0
    conceptual_understanding: int = 0
    completeness: int = 0
    relevance: int = 0
    depth: int = 0
    communication_clarity: int = 0
    what_was_correct: list[str] = Field(default_factory=list)
    what_was_missing: list[str] = Field(default_factory=list)
    suggested_improvement: str = ""
    ideal_answer: str = ""


class FinalReportRequest(BaseModel):
    candidateName: str = "Candidate"
    jobRole: str = "Software Engineer"
    category: str = "Technical Interview"
    difficulty: str = "Intermediate"
    mode: str = "Strict Technical Interviewer"
    durationMinutes: int = 20
    elapsedMinutes: int = 1
    topicsCovered: list[str] = Field(default_factory=list)
    evaluatedQuestions: list[EvaluatedQuestionItem] = Field(default_factory=list)
    resumeContext: Optional[ResumeContext] = None


class FinalReportResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    performance_level: str
    technical_evaluation: dict
    communication_evaluation: dict
    strongest_areas: list[str] = Field(default_factory=list)
    weakest_areas: list[str] = Field(default_factory=list)
    missing_concepts: list[str] = Field(default_factory=list)
    incorrect_concepts: list[str] = Field(default_factory=list)
    recommended_subjects: list[str] = Field(default_factory=list)
    learning_plan: list[dict] = Field(default_factory=list)
    executive_summary: str
    engine: str

    @field_validator(
        "strongest_areas",
        "weakest_areas",
        "missing_concepts",
        "incorrect_concepts",
        "recommended_subjects",
        mode="before",
    )
    @classmethod
    def _coerce_report_lists(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []


# --------------------------------------------------------------- NLP Signals
def analyze_answer_nlp(question: str, answer: str) -> dict:
    """Compute transparent linguistic & relevance signals from the candidate's response."""
    clean_answer = textutil.normalize_whitespace(answer)
    tokens = textutil.words(clean_answer)
    content = textutil.content_words(clean_answer)
    q_content = set(textutil.content_words(question))
    a_content = set(content)
    overlap_terms = sorted(q_content & a_content)

    has_example = any(
        cue in clean_answer.lower()
        for cue in ("for example", "e.g.", "such as", "like when", "in my project", "for instance", "suppose")
    )
    has_code_or_complexity = any(
        cue in clean_answer.lower()
        for cue in ("o(", "complexity", "memory", "pointer", "index", "query", "async", "thread", "http", "sql")
    )

    similarity = 0.0
    if len(clean_answer) >= 10 and len(question) >= 10:
        try:
            vec = TfidfVectorizer(stop_words="english").fit_transform([question, clean_answer])
            similarity = round(float(cosine_similarity(vec[0:1], vec[1:2])[0][0]) * 100.0, 1)
        except Exception:
            similarity = 0.0

    entities = []
    nlp = _load_spacy()
    if nlp is not None and clean_answer:
        doc = nlp(clean_answer[:2000])
        entities = list(dict.fromkeys(ent.text for ent in doc.ents))[:8]

    return {
        "wordCount": len(tokens),
        "contentWordCount": len(content),
        "hasExample": has_example,
        "hasTechnicalDepthCues": has_code_or_complexity,
        "questionTermOverlap": overlap_terms[:10],
        "tfidfRelevance": similarity,
        "entities": entities,
    }


def _is_question_duplicate(candidate_q: str, asked_questions: list[str]) -> bool:
    norm_q = textutil.normalize_whitespace(candidate_q).lower().rstrip("?.!")
    if not norm_q:
        return False
    for prev in asked_questions:
        norm_prev = textutil.normalize_whitespace(prev).lower().rstrip("?.!")
        if not norm_prev:
            continue
        if norm_q == norm_prev:
            return True
        try:
            vec = TfidfVectorizer(stop_words="english").fit_transform([norm_q, norm_prev])
            sim = float(cosine_similarity(vec[0:1], vec[1:2])[0][0])
            if sim >= 0.78:
                return True
        except Exception:
            pass
    return False


def _format_resume_block(resume: Optional[ResumeContext]) -> str:
    if not resume:
        return "Resume: None attached (never invent projects/experience)."
    projects_items = []
    for p in resume.projects[:3]:
        if isinstance(p, dict) and p.get("name"):
            tech = f" [{p.get('tech')}]" if p.get("tech") else ""
            projects_items.append(
                f"{p.get('name')}{tech}: {textutil.truncate(p.get('description', ''), 90)}"
            )
        elif isinstance(p, str) and p.strip():
            projects_items.append(textutil.truncate(p.strip(), 110))

    exp_items = []
    for e in resume.experience[:2]:
        if isinstance(e, dict) and (e.get("role") or e.get("company")):
            pts = f" ({textutil.truncate(', '.join(e.get('points', [])[:1]), 70)})" if e.get("points") else ""
            exp_items.append(f"{e.get('role', '')} @ {e.get('company', '')}{pts}".strip())
        elif isinstance(e, str) and e.strip():
            exp_items.append(textutil.truncate(e.strip(), 100))

    edu_items = []
    for ed in resume.education[:1]:
        if isinstance(ed, dict):
            edu_items.append(f"{ed.get('degree', '')} - {ed.get('institution', '')}".strip(" -"))
        elif isinstance(ed, str) and ed.strip():
            edu_items.append(textutil.truncate(ed.strip(), 90))

    parts = [
        f"Resume ({resume.candidateName or 'Candidate'}, role={resume.targetRole or 'N/A'}):",
        f"Skills: {', '.join(resume.skills[:10]) or 'None'}",
    ]
    if resume.missingSkills:
        parts.append(f"Gaps: {', '.join(resume.missingSkills[:5])}")
    if projects_items:
        parts.append(f"Projects: {'; '.join(projects_items)}")
    if exp_items:
        parts.append(f"Exp: {'; '.join(exp_items)}")
    if edu_items:
        parts.append(f"Edu: {'; '.join(x for x in edu_items if x)}")
    return "\n".join(parts)


def _compress_memory(history: list[ConversationTurn], prior_summary: str) -> tuple[str, list[ConversationTurn]]:
    """Keep recent 4 turns verbatim and compress older turns into a compact rolling summary."""
    if len(history) <= 4:
        return prior_summary, history

    older = history[:-4]
    recent = history[-4:]
    snippets = []
    for turn in older:
        prefix = "Q" if turn.role == "interviewer" else "A"
        topic_tag = f"[{turn.topic}]" if turn.topic else ""
        snippets.append(f"{prefix}{topic_tag}:{textutil.truncate(turn.content, 60)}")
    combined = (prior_summary + " | " if prior_summary else "") + "; ".join(snippets)
    return textutil.truncate(combined, 360), recent


# -------------------------------------------------------------- Start Session
async def start_interview(req: StartInterviewRequest) -> StartInterviewResponse:
    persona = _persona_for_mode(req.mode)
    diff = _normalize_difficulty(req.difficulty)
    resume_block = _format_resume_block(req.resumeContext)

    system_prompt = (
        f"You are {persona['name']} ({req.mode}: {persona['tone']}) conducting a live mock placement interview.\n"
        'Return JSON: {"interviewer_name":string,"greeting":string,"first_question":string,"topic":string,"difficulty":"beginner"|"intermediate"|"advanced"}.\n'
        "Rules: Welcome candidate briefly in greeting, ask ONE focused first_question suited to role/category/difficulty/resume, never give model answers, never invent resume items."
    )

    seed_clause = f"\nUse/refine seed question: {req.seedQuestion.strip()}" if req.seedQuestion.strip() else ""

    user_prompt = (
        f"Candidate:{req.candidateName} | Role:{req.jobRole} | Category:{req.category} | Diff:{diff} | Duration:{req.durationMinutes}m\n"
        f"{resume_block}{seed_clause}"
    )

    try:
        raw = await generate_structured_json(system_prompt, user_prompt, temperature=0.45)
        raw.setdefault("interviewer_name", persona["name"])
        raw["difficulty"] = _normalize_difficulty(raw.get("difficulty", diff))
        raw["engine"] = settings.llm_provider
        return StartInterviewResponse(**raw)
    except LLMConfigError:
        if not settings.allow_nlp_fallback:
            raise
        return _nlp_fallback_start(req, persona, diff)
    except Exception as exc:
        if isinstance(exc, LLMUpstreamError):
            raise
        raise LLMUpstreamError(f"Failed to validate AI interviewer start response: {exc}", status_code=502) from exc


# ----------------------------------------------------------- Answer Evaluation
async def process_candidate_answer(req: SubmitAnswerRequest) -> SubmitAnswerResponse:
    persona = _persona_for_mode(req.mode)
    current_diff = _normalize_difficulty(req.difficulty)
    nlp_signals = analyze_answer_nlp(req.currentQuestion, req.candidateAnswer)
    updated_summary, recent_turns = _compress_memory(req.conversationHistory, req.conversationSummary)

    history_lines = "\n".join(
        f"{'Q' if t.role == 'interviewer' else 'A'}({t.topic or req.category}): {textutil.truncate(t.content, 95)}"
        for t in recent_turns
    )
    asked_block = " | ".join(textutil.truncate(q, 65) for q in req.askedQuestions[-4:]) or "None"
    resume_block = _format_resume_block(req.resumeContext)

    should_wrap = req.answeredCount + 1 >= req.maxQuestions or req.remainingSeconds <= 45

    system_prompt = (
        f"You are {persona['name']} ({req.mode}). Evaluate the candidate's ACTUAL answer strictly in compact JSON (no indentation).\n"
        "Scoring: off-topic/silent->score 0..2,accuracy 'unclear'/'incorrect'; partial->3..6; correct->7..8; excellent->9..10.\n"
        "Rules: 1 brief sentence in conversational_response; 1 distinct next_question (NEVER repeat Asked); set interview_complete=true ONLY if Wrap=True; keep every string <=10 words, max 2 items per list.\n"
        'JSON:{"score":0..10,"accuracy":"excellent"|"correct"|"partial"|"incorrect"|"unclear","conversational_response":str,"next_question":str,"next_topic":str,"next_action":"follow_up"|"elaborate_example"|"probe_missing"|"simplify_or_pivot"|"clarify"|"advance_difficulty"|"next_topic"|"conclude","difficulty":"beginner"|"intermediate"|"advanced","tech":0..100,"concept":0..100,"relevance":0..100,"clarity":0..100,"correct":[str],"missing":[str],"tip":str,"interview_complete":bool}.'
    )

    user_prompt = (
        f"Role:{req.jobRole} | Cat:{req.category} | Diff:{current_diff} | Topic:{req.currentTopic or req.category} | Done:{req.answeredCount}/{req.maxQuestions} | Left:{req.remainingSeconds}s | Wrap:{should_wrap}\n"
        f"Summary:{updated_summary or 'None'} | {resume_block}\n"
        f"Recent:\n{history_lines or 'First turn'}\n"
        f"Asked: {asked_block}\n"
        f"Q: {req.currentQuestion}\n"
        f"A: {textutil.truncate(req.candidateAnswer, 1400)}"
    )

    try:
        # Strictly ONE LLM call per submitted candidate answer (no secondary repair calls)
        raw = await generate_structured_json(system_prompt, user_prompt, temperature=0.35)
        raw["difficulty"] = _normalize_difficulty(raw.get("difficulty", current_diff))
        if should_wrap:
            raw["interview_complete"] = True
            raw["next_action"] = "conclude"
            raw["next_question"] = ""
        else:
            raw["interview_complete"] = False
            if str(raw.get("next_action") or "").lower() == "conclude":
                raw["next_action"] = "follow_up"

        # Accept either nested evaluation (Gemini/OpenAI) or compact flat keys (fast local Ollama)
        alias_map = {
            "tech": "technical_accuracy",
            "concept": "conceptual_understanding",
            "clarity": "communication_clarity",
            "correct": "what_was_correct",
            "missing": "what_was_missing",
            "tip": "suggested_improvement",
        }
        ev = raw.get("evaluation") if isinstance(raw.get("evaluation"), dict) else {}
        for short_k, full_k in alias_map.items():
            if short_k in raw and full_k not in raw:
                raw[full_k] = raw[short_k]
            if short_k in ev and full_k not in ev:
                ev[full_k] = ev[short_k]
        for k in (
            "score",
            "accuracy",
            "technical_accuracy",
            "conceptual_understanding",
            "completeness",
            "relevance",
            "depth",
            "communication_clarity",
            "what_was_correct",
            "what_was_missing",
            "suggested_improvement",
            "ideal_answer",
            "strengths",
            "weaknesses",
            "feedback",
        ):
            if k not in ev and k in raw:
                ev[k] = raw[k]
        ev.setdefault("strengths", ev.get("what_was_correct") or [])
        ev.setdefault("weaknesses", ev.get("what_was_missing") or [])
        ev.setdefault("feedback", ev.get("suggested_improvement") or raw.get("conversational_response") or "")
        raw["evaluation"] = ev
        raw.setdefault("next_topic", req.currentTopic or req.category)
        raw.setdefault("interview_complete", False)
        if not raw.get("next_action"):
            acc_guess = str((raw.get("evaluation") or {}).get("accuracy") or "").lower()
            action_by_acc = {
                "excellent": "advance_difficulty",
                "correct": "follow_up",
                "partial": "probe_missing",
                "incorrect": "simplify_or_pivot",
                "unclear": "clarify",
            }
            raw["next_action"] = action_by_acc.get(acc_guess, "follow_up")
        if not raw.get("interview_complete") and not str(raw.get("next_question") or "").strip():
            topic_ref = raw.get("next_topic") or req.currentTopic or req.category
            gaps = (raw.get("evaluation") or {}).get("what_was_missing") or []
            if gaps:
                raw["next_question"] = f"Building on {topic_ref}, can you elaborate specifically on: {gaps[0]}?"
            else:
                raw["next_question"] = f"Can you walk through a concrete edge case or trade-off in {topic_ref}?"
        if not raw.get("conversational_response"):
            raw["conversational_response"] = (
                f"Thanks for your response. Let's explore {raw.get('next_topic') or req.category} further."
            )

        raw["updated_summary"] = updated_summary
        raw["nlp_signals"] = nlp_signals
        raw["engine"] = settings.llm_provider
        return SubmitAnswerResponse(**raw)
    except LLMConfigError:
        if not settings.allow_nlp_fallback:
            raise
        return _nlp_fallback_answer(req, nlp_signals, updated_summary, should_wrap)
    except Exception as exc:
        if isinstance(exc, LLMUpstreamError):
            raise
        raise LLMUpstreamError(f"Failed to validate AI answer evaluation: {exc}", status_code=502) from exc


# --------------------------------------------------------------- Final Report
async def generate_final_report(req: FinalReportRequest) -> FinalReportResponse:
    items = req.evaluatedQuestions
    if not items:
        return FinalReportResponse(
            overall_score=0,
            performance_level="Incomplete",
            technical_evaluation={
                "technical_knowledge": 0,
                "conceptual_understanding": 0,
                "answer_accuracy": 0,
                "depth_of_knowledge": 0,
                "problem_solving_ability": 0,
            },
            communication_evaluation={
                "explanation_clarity": 0,
                "relevance": 0,
                "completeness": 0,
                "articulation": 0,
            },
            strongest_areas=[],
            weakest_areas=["No interview answers were submitted before ending the session."],
            missing_concepts=[],
            incorrect_concepts=[],
            recommended_subjects=[req.category],
            learning_plan=[
                {
                    "step": 1,
                    "topic": req.category,
                    "action": f"Complete at least 3-5 questions in a {req.category} session to generate an evidence-based evaluation.",
                    "priority": "high",
                }
            ],
            executive_summary="Interview ended before any candidate answers were evaluated.",
            engine="deterministic",
        )

    n = len(items)
    avg = lambda attr: int(round(sum(getattr(x, attr) for x in items) / n))
    overall_score = int(round((sum(x.score for x in items) / n) * 10))
    tech_eval = {
        "technical_knowledge": avg("technical_accuracy"),
        "conceptual_understanding": avg("conceptual_understanding"),
        "answer_accuracy": overall_score,
        "depth_of_knowledge": avg("depth"),
        "problem_solving_ability": int(round((avg("conceptual_understanding") + avg("depth")) / 2)),
    }
    comm_eval = {
        "explanation_clarity": avg("communication_clarity"),
        "relevance": avg("relevance"),
        "completeness": avg("completeness"),
        "articulation": int(round((avg("communication_clarity") + avg("relevance")) / 2)),
    }

    if overall_score >= 85:
        perf_level = "Outstanding / Placement Ready"
    elif overall_score >= 70:
        perf_level = "Strong"
    elif overall_score >= 55:
        perf_level = "Developing"
    else:
        perf_level = "Needs Focused Practice"

    # Reuse existing per-answer LLM evaluations whenever rich qualitative evidence is already present,
    # avoiding an unnecessary 50s+ extra Qwen3 inference when finalizing the session.
    has_rich_evals = any(
        it.what_was_correct or it.what_was_missing or it.suggested_improvement
        for it in items
    )
    if has_rich_evals:
        return _deterministic_final_report(
            req,
            overall_score,
            perf_level,
            tech_eval,
            comm_eval,
            engine=f"{settings.llm_provider}-synthesized",
        )

    qa_digest = "\n".join(
        f"Q{idx+1}[{it.topic}|{it.score}/10|{it.accuracy}]: {textutil.truncate(it.question, 100)} | "
        f"Ans:{textutil.truncate(it.candidateAnswer, 120)} | OK:{','.join(it.what_was_correct[:2]) or 'None'} | Gap:{','.join(it.what_was_missing[:2]) or 'None'}"
        for idx, it in enumerate(items)
    )

    system_prompt = (
        "Senior interview panelist writing the final report. Ground EVERY point strictly in the evaluated Q&As below. Keep lists <=3 items, strings <=18 words, compact JSON.\n"
        'Return JSON: {"strongest_areas":[str],"weakest_areas":[str],"missing_concepts":[str],"incorrect_concepts":[str],"recommended_subjects":[str],"learning_plan":[{"step":int,"topic":str,"action":str,"priority":"high"|"medium"|"low"}],"executive_summary":str}.'
    )

    user_prompt = (
        f"Candidate:{req.candidateName} | Role:{req.jobRole} | Cat:{req.category} | Score:{overall_score}% ({perf_level}) in {req.elapsedMinutes}m\n"
        f"{qa_digest}"
    )

    try:
        raw = await generate_structured_json(system_prompt, user_prompt, temperature=0.3)
        return FinalReportResponse(
            overall_score=overall_score,
            performance_level=perf_level,
            technical_evaluation=tech_eval,
            communication_evaluation=comm_eval,
            strongest_areas=raw.get("strongest_areas") or [],
            weakest_areas=raw.get("weakest_areas") or [],
            missing_concepts=raw.get("missing_concepts") or [],
            incorrect_concepts=raw.get("incorrect_concepts") or [],
            recommended_subjects=raw.get("recommended_subjects") or [req.category],
            learning_plan=raw.get("learning_plan") or [],
            executive_summary=raw.get("executive_summary")
            or f"Completed {n} questions with an average score of {overall_score}%.",
            engine=settings.llm_provider,
        )
    except LLMConfigError:
        return _deterministic_final_report(req, overall_score, perf_level, tech_eval, comm_eval)
    except LLMUpstreamError:
        # Preserve already-evaluated real scores if final synthesis times out
        return _deterministic_final_report(req, overall_score, perf_level, tech_eval, comm_eval)


def _deterministic_final_report(
    req: FinalReportRequest,
    overall_score: int,
    perf_level: str,
    tech_eval: dict,
    comm_eval: dict,
    engine: str = "deterministic-from-evaluations",
) -> FinalReportResponse:
    items = req.evaluatedQuestions
    strengths = []
    weaknesses = []
    missing_concepts = []
    incorrect_concepts = []
    learning_plan = []
    seen_topics = set()

    for it in items:
        strengths.extend(it.what_was_correct)
        weaknesses.extend(it.what_was_missing)
        topic_label = it.topic or req.category
        acc_low = str(it.accuracy or "").strip().lower()
        if acc_low in ("incorrect", "unclear") or it.score < 5.0:
            reason = (
                it.suggested_improvement
                or (f"Missed: {', '.join(it.what_was_missing[:2])}" if it.what_was_missing else "")
                or f"Response scored {it.score}/10 ({acc_low or 'needs correction'})."
            )
            incorrect_concepts.append(f"{topic_label}: {reason}")
        if it.score < 7.5 and it.what_was_missing:
            missing_concepts.append(f"{topic_label}: {', '.join(it.what_was_missing[:2])}")
        if it.score < 8.0 and topic_label not in seen_topics:
            seen_topics.add(topic_label)
            learning_plan.append(
                {
                    "step": len(learning_plan) + 1,
                    "topic": topic_label,
                    "action": it.suggested_improvement
                    or f"Review core concepts and practice scenario explanations for {topic_label}.",
                    "priority": "high" if it.score < 5.5 else "medium",
                }
            )

    strengths = list(dict.fromkeys(strengths))[:6]
    weaknesses = list(dict.fromkeys(weaknesses))[:6]
    missing_concepts = list(dict.fromkeys(missing_concepts))[:6]
    incorrect_concepts = list(dict.fromkeys(incorrect_concepts))[:6]
    rec_subjects = list(dict.fromkeys([it.topic for it in items if it.score < 8.0 and it.topic] or [req.category]))[:5]

    if not learning_plan:
        learning_plan = [
            {
                "step": idx + 1,
                "topic": subj,
                "action": f"Practice advanced edge cases and architectural trade-offs for {subj}.",
                "priority": "medium",
            }
            for idx, subj in enumerate(rec_subjects[:3])
        ]

    return FinalReportResponse(
        overall_score=overall_score,
        performance_level=perf_level,
        technical_evaluation=tech_eval,
        communication_evaluation=comm_eval,
        strongest_areas=strengths or ["Completed structured responses across the evaluated questions."],
        weakest_areas=weaknesses or ["No major conceptual gaps flagged; continue depth practice."],
        missing_concepts=missing_concepts,
        incorrect_concepts=incorrect_concepts,
        recommended_subjects=rec_subjects,
        learning_plan=learning_plan[:5],
        executive_summary=(
            f"Evaluated {len(items)} question{'s' if len(items) != 1 else ''} for {req.jobRole} ({req.category}) "
            f"with an overall score of {overall_score}% ({perf_level})."
        ),
        engine=engine,
    )


# ------------------------------------------- Optional Explicit NLP Fallback
def _nlp_fallback_start(req: StartInterviewRequest, persona: dict, diff: str) -> StartInterviewResponse:
    resume = req.resumeContext
    if req.seedQuestion.strip():
        first_q = req.seedQuestion.strip()
        topic = req.category
    elif resume and resume.projects:
        proj = resume.projects[0]
        if isinstance(proj, dict):
            p_name = proj.get("name", "your recent project")
            p_tech = proj.get("tech", "")
        else:
            p_name = textutil.truncate(str(proj), 80) or "your recent project"
            p_tech = ""
        tech_part = f" built with {p_tech}" if p_tech else ""
        first_q = (
            f"I see on your resume you worked on \"{p_name}\"{tech_part}. "
            f"Can you walk me through its architecture and one key design trade-off you made?"
        )
        topic = p_name
    else:
        first_q = (
            f"To start our {req.category} round for the {req.jobRole} role, "
            f"walk me through a core problem or concept in {req.category} that you recently solved or studied, "
            "including how it works under the hood."
        )
        topic = req.category

    greeting = (
        f"Hello {req.candidateName}, I'm {persona['name']}, your {req.mode}. "
        f"Over the next {req.durationMinutes} minutes, we will focus on {req.category} for the {req.jobRole} role, "
        "starting with foundational concepts and adapting follow-up questions based on your answers."
    )
    return StartInterviewResponse(
        interviewer_name=persona["name"],
        greeting=greeting,
        first_question=first_q,
        topic=topic,
        difficulty=diff,
        engine="nlp-fallback",
    )


def _nlp_fallback_answer(
    req: SubmitAnswerRequest,
    signals: dict,
    updated_summary: str,
    should_wrap: bool,
) -> SubmitAnswerResponse:
    wc = signals["wordCount"]
    rel = signals["tfidfRelevance"]
    has_ex = signals["hasExample"]
    diff = _normalize_difficulty(req.difficulty)

    if wc < 5 or (rel < 4.0 and wc < 15):
        accuracy = "unclear"
        score = 2.5
        action = "clarify"
        next_diff = diff
        resp_text = "Your answer was quite brief or unclear. Could you clarify your reasoning directly for the question?"
        next_q = f"Let's revisit that: could you explain step by step how you would approach {req.currentTopic or req.category} here?"
    elif wc < 22 and not has_ex:
        accuracy = "correct"
        score = 7.0
        action = "elaborate_example"
        next_diff = diff
        resp_text = "That touches on the core idea, though it is fairly concise."
        next_q = f"Can you illustrate your explanation of {req.currentTopic or req.category} with a concrete real-world example or edge case?"
    elif has_ex and wc >= 45:
        accuracy = "excellent"
        score = 9.0
        action = "advance_difficulty"
        next_diff = "advanced" if diff != "beginner" else "intermediate"
        resp_text = "Strong, detailed answer with a practical example."
        next_q = f"Going deeper into {req.currentTopic or req.category}, how would your approach behave under high concurrency or failure scenarios?"
    else:
        accuracy = "partial"
        score = 6.0
        action = "probe_missing"
        next_diff = diff
        resp_text = "You covered parts of the concept, though some operational details were missing."
        next_q = f"What trade-offs or failure modes would you check when applying {req.currentTopic or req.category} in production?"

    if should_wrap:
        action = "conclude"
        next_q = ""

    eval_obj = AnswerEvaluation(
        score=score,
        accuracy=accuracy,
        technical_accuracy=int(score * 10),
        conceptual_understanding=int(score * 10),
        completeness=min(100, wc * 2),
        relevance=min(100, max(25, int(rel * 2.5))),
        depth=85 if signals["hasTechnicalDepthCues"] else 55,
        communication_clarity=min(100, max(35, wc * 2)),
        what_was_correct=["Addressed the topic using domain terminology."] if wc >= 10 else [],
        what_was_missing=["Include deeper trade-offs and a concrete example."] if not has_ex else [],
        suggested_improvement="Structure your answer with the core definition, time/space or system trade-off, and a concrete example.",
        ideal_answer="A complete response defines the core mechanism, analyzes trade-offs or edge cases, and provides a concrete scenario.",
        strengths=["Clear attempt at addressing the prompt."] if wc >= 8 else [],
        weaknesses=["Response lacked sufficient depth or concrete example."] if wc < 30 else [],
        feedback=resp_text,
    )

    return SubmitAnswerResponse(
        evaluation=eval_obj,
        conversational_response=resp_text,
        next_action=action,
        next_question=next_q,
        next_topic=req.currentTopic or req.category,
        difficulty=next_diff,
        interview_complete=should_wrap,
        updated_summary=updated_summary,
        nlp_signals=signals,
        engine="nlp-fallback",
    )
