"""ATS Resume Analysis HTTP router."""

import json
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..config import DISCLAIMER, settings
from ..security import require_internal_key
from ..services import extractor, jd, scoring, sections, skills

router = APIRouter(prefix="/ats", tags=["ats"])


@router.post("/analyze", dependencies=[Depends(require_internal_key)])
async def analyze_resume(
    file: UploadFile = File(...),
    targetRole: str = Form(default=""),
    jobDescription: str = Form(default=""),
    weightsJson: str = Form(default=""),
) -> dict:
    """Extract PDF/DOCX text, parse resume & JD, compute dynamic ATS score & feedback."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > settings.max_upload_bytes:
        max_mb = settings.max_upload_bytes // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File exceeds the {max_mb} MB size limit.")

    try:
        extracted_doc = extractor.extract(content, file.filename or "resume")
    except extractor.ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    text = extracted_doc["text"][: settings.max_text_chars]
    parsed = sections.parse_resume(text)

    effective_role = (targetRole or "").strip() or "Target Role"
    effective_jd = (jobDescription or "").strip()
    if not effective_jd and not targetRole.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide a target job title or job description to match against.",
        )

    custom_weights = None
    if weightsJson and weightsJson.strip():
        try:
            custom_weights = json.loads(weightsJson)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid weightsJson payload.") from exc

    job = jd.analyze_job_description(effective_role, effective_jd or effective_role)
    skill_match = skills.match_skills(parsed["skills"], parsed["otherSkills"], job)
    keyword_match = skills.match_keywords(text, job)
    score_result = scoring.compute_scores(
        text=text,
        parsed=parsed,
        job=job,
        skill_match=skill_match,
        keywords=keyword_match,
        custom_weights=custom_weights,
    )
    keyword_match["semanticSimilarity"] = score_result["semanticSimilarity"]

    relevance = scoring.extract_relevant_items(parsed, job)
    strengths = scoring.build_strengths(parsed, skill_match, keyword_match)
    weaknesses = scoring.build_weaknesses(parsed, skill_match, keyword_match)
    recommendations = scoring.build_recommendations(
        parsed, skill_match, keyword_match, score_result["components"]
    )
    project_suggestions = scoring.build_project_suggestions(parsed, job, skill_match)
    suggested_questions = scoring.build_interview_questions(parsed, job, skill_match)
    summary = scoring.build_summary(parsed, job, score_result, skill_match)

    # Compatibility list for missingSkills cards
    missing_skills_cards = [
        {
            "skill": item["skill"],
            "importance": "High" if item["priority"] == "required" else "Medium",
            "reason": item["reason"],
            "status": item["status"],
        }
        for item in (skill_match["missing"] + skill_match["partial"])
    ]

    size_mb = len(content) / (1024 * 1024)
    formatted_size = f"{size_mb:.2f} MB" if size_mb >= 0.1 else f"{max(1, len(content) // 1024)} KB"

    return {
        "fileName": file.filename or "resume",
        "fileSize": formatted_size,
        "format": extracted_doc["format"],
        "extractionMethod": extracted_doc["extractionMethod"],
        "pageCount": extracted_doc["pageCount"],
        "wordCount": extracted_doc["wordCount"],
        "atsScore": score_result["overall"],
        "scoreBand": score_result["band"],
        "scoringVersion": settings.scoring_version,
        "scoringWeights": score_result["weights"],
        "disclaimer": DISCLAIMER,
        "targetRole": job["title"],
        "jobDescription": effective_jd,
        "jobAnalysis": {
            "title": job["title"],
            "requiredSkills": job["requiredSkills"],
            "preferredSkills": job["preferredSkills"],
            "skillsByCategory": job["skillsByCategory"],
            "educationRequirements": job["educationRequirements"],
            "experienceRequirements": job["experienceRequirements"],
            "keywords": job["keywords"],
            "hasDetailedJD": job["hasDetailedJD"],
        },
        "summary": summary,
        "contact": parsed["contact"],
        "extracted": {
            "summary": parsed["summary"],
            "education": parsed["education"],
            "experience": parsed["experience"],
            "projects": parsed["projects"],
            "certifications": parsed["certifications"],
            "skills": parsed["skills"],
            "otherSkills": parsed["otherSkills"],
            "skillGroups": parsed["skillGroups"],
            "sectionsFound": parsed["sectionsFound"],
        },
        "components": score_result["components"],
        "skillMatch": skill_match,
        "keywords": keyword_match,
        "relevantExperience": relevance["relevantExperience"],
        "relevantProjects": relevance["relevantProjects"],
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missingSkills": missing_skills_cards,
        "recommendations": recommendations,
        "projectSuggestions": project_suggestions,
        "suggestedQuestions": suggested_questions,
    }
