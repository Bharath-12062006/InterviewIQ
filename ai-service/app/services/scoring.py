"""Explainable, configurable resume-to-job ATS scoring and personalized feedback.

Every component produces a 0-100 sub-score, carries a configurable weight (normalized
to sum to 100), and explains how it was computed from the candidate's uploaded resume
and the provided job description.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .textutil import words

DEFAULT_WEIGHTS = {
    "requiredSkills": 32,
    "preferredSkills": 8,
    "keywordCoverage": 12,
    "experienceRelevance": 15,
    "projectRelevance": 15,
    "educationRelevance": 8,
    "completeness": 6,
    "readability": 4,
}

# Preserve WEIGHTS name for compatibility
WEIGHTS = dict(DEFAULT_WEIGHTS)

COMPONENT_LABELS = {
    "requiredSkills": "Required skill match",
    "preferredSkills": "Preferred skill match",
    "keywordCoverage": "Keyword & semantic coverage",
    "experienceRelevance": "Experience relevance",
    "projectRelevance": "Project relevance",
    "educationRelevance": "Education relevance",
    "completeness": "Resume completeness",
    "readability": "Readability & structure",
}


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def _keyword_needles(job: dict) -> list:
    return [item["keyword"].lower() for item in job.get("keywords", [])]


def compute_semantic_similarity(resume_text: str, job_text: str) -> float:
    """Compute TF-IDF cosine similarity (0-100) between resume text and job description."""
    r_text = (resume_text or "").strip()
    j_text = (job_text or "").strip()
    if len(r_text) < 20 or len(j_text) < 20:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=3000)
        matrix = vectorizer.fit_transform([r_text, j_text])
        sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
        return round(_clamp(sim * 100.0), 1)
    except Exception:
        return 0.0


def normalize_weights(custom_weights: dict | None = None) -> dict:
    """Merge optional custom weights and normalize so weights sum to 100."""
    merged = dict(DEFAULT_WEIGHTS)
    if custom_weights:
        for key in merged:
            if key in custom_weights:
                try:
                    val = float(custom_weights[key])
                    if val >= 0:
                        merged[key] = val
                except (TypeError, ValueError):
                    pass

    total = sum(merged.values())
    if total <= 0:
        return dict(DEFAULT_WEIGHTS)
    return {k: round((v / total) * 100.0, 2) for k, v in merged.items()}


def _score_required_skills(match: dict) -> tuple:
    total = match["requiredTotal"]
    if total == 0:
        return 50.0, "The job description did not specify explicit required skills, so this component is neutral (50%)."

    strong = sum(1 for item in match["matched"] if item["priority"] == "required")
    partial = sum(1 for item in match["partial"] if item["priority"] == "required")
    score = _clamp(((strong + partial * 0.5) / total) * 100)
    return score, (
        f"{strong} of {total} required skills matched directly and {partial} partially "
        f"(partial matches receive 50% credit)."
    )


def _score_preferred_skills(match: dict) -> tuple:
    total = match["preferredTotal"]
    if total == 0:
        return 60.0, "The job description listed no separate preferred/bonus skills."

    strong = sum(1 for item in match["matched"] if item["priority"] == "preferred")
    partial = sum(1 for item in match["partial"] if item["priority"] == "preferred")
    score = _clamp(((strong + partial * 0.5) / total) * 100)
    return score, f"{strong} of {total} preferred skills matched directly and {partial} partially."


def _score_keywords(keywords: dict, semantic_sim: float) -> tuple:
    if keywords["total"] == 0:
        return 45.0, "Too few job description keywords were available to score coverage."
    cov = float(keywords["coverage"])
    # Blend exact keyword coverage (65%) with TF-IDF semantic similarity (35%)
    blended = _clamp(cov * 0.65 + min(100.0, semantic_sim * 1.45) * 0.35)
    return blended, (
        f"{keywords['matchedCount']} of {keywords['total']} ranked job keywords appear in the resume "
        f"({keywords['coverage']}%), with {semantic_sim}% TF-IDF document similarity."
    )


def _score_experience(parsed: dict, job: dict) -> tuple:
    entries = parsed.get("experience", [])
    if not entries:
        return 0.0, "No internship or work experience section was detected in the resume."

    needles = _keyword_needles(job)
    job_skills = [s.lower() for s in job.get("requiredSkills", []) + job.get("preferredSkills", [])]
    if not needles and not job_skills:
        return 45.0, f"{len(entries)} experience entry/entries found; add a detailed JD to score role overlap."

    best_ratio = 0.0
    best_label = ""
    denom = max(1, len(job_skills) * 2 + len(needles))

    for entry in entries:
        blob = " ".join(
            [entry.get("role", ""), entry.get("company", "")] + entry.get("points", [])
        ).lower()
        skill_hits = sum(1 for s in job_skills if s in blob)
        kw_hits = sum(1 for needle in needles if needle in blob)
        ratio = (skill_hits * 2 + kw_hits) / denom
        if ratio >= best_ratio:
            best_ratio = ratio
            best_label = " at ".join(p for p in [entry.get("role"), entry.get("company")] if p)

    score = _clamp(min(1.0, best_ratio * 2.3) * 100)
    detail = (
        f"Strongest role alignment in \u201c{best_label}\u201d."
        if best_label and score > 0
        else f"{len(entries)} experience entry/entries found, but bullets show limited overlap with the JD stack."
    )
    return score, detail


def _score_projects(parsed: dict, job: dict) -> tuple:
    projects = parsed.get("projects", [])
    if not projects:
        return 0.0, "No projects section was detected in the uploaded resume."

    needles = _keyword_needles(job)
    job_skills = [s.lower() for s in job.get("requiredSkills", []) + job.get("preferredSkills", [])]

    denominator = max(1, len(job_skills) * 2 + len(needles))
    best_ratio = 0.0
    best_project = ""

    for project in projects:
        blob = " ".join([
            project.get("name", ""),
            project.get("tech", ""),
            project.get("description", ""),
        ]).lower()
        skill_hits = sum(1 for skill in job_skills if skill in blob)
        keyword_hits = sum(1 for needle in needles if needle in blob)
        ratio = (skill_hits * 2 + keyword_hits) / denominator
        if ratio > best_ratio:
            best_ratio = ratio
            best_project = project.get("name", "")

    score = _clamp(min(1.0, best_ratio * 2.1) * 100)
    if job_skills or needles:
        detail = (
            f"Closest project: \u201c{best_project}\u201d."
            if best_project
            else "Uploaded projects do not yet mention the target role's required technologies."
        )
    else:
        detail = f"{len(projects)} project(s) detected."
    return score, detail


def _score_education(parsed: dict, job: dict) -> tuple:
    edu_entries = parsed.get("education", [])
    jd_reqs = job.get("educationRequirements", [])

    if not edu_entries:
        return 0.0, "No education entries were detected in the uploaded resume."

    edu_blob = " ".join(
        f"{e.get('institution', '')} {e.get('degree', '')}" for e in edu_entries
    ).lower()

    if not jd_reqs:
        has_degree = any(e.get("degree") for e in edu_entries)
        score = 85.0 if has_degree else 65.0
        return score, f"{len(edu_entries)} education entry/entries detected; JD stated no strict degree constraint."

    req_blob = " ".join(jd_reqs).lower()
    cs_terms = ("computer", "software", "engineering", "cse", "it", "information technology", "data", "math", "science")
    degree_terms = ("bachelor", "b.tech", "btech", "b.e", "be ", "bs ", "master", "m.tech", "ms ", "mca", "bca", "phd")

    score = 55.0
    if any(t in edu_blob for t in degree_terms):
        score += 25.0
    if any(t in req_blob for t in cs_terms) and any(t in edu_blob for t in cs_terms):
        score += 20.0
    elif not any(t in req_blob for t in cs_terms):
        score += 15.0

    return _clamp(score), (
        f"Resume lists {len(edu_entries)} education record(s) compared against JD requirement: "
        + "; ".join(jd_reqs[:2])
        + "."
    )


def _score_completeness(parsed: dict) -> tuple:
    contact = parsed.get("contact", {})
    checks = [
        ("name", 10, bool(contact.get("name"))),
        ("email", 12, bool(contact.get("email"))),
        ("phone", 8, bool(contact.get("phone"))),
        ("LinkedIn or portfolio link", 6, bool(contact.get("linkedin") or contact.get("portfolio"))),
        ("summary or objective", 8, bool(parsed.get("summary"))),
        ("education", 14, bool(parsed.get("education"))),
        ("experience or internship", 16, bool(parsed.get("experience"))),
        ("projects", 14, bool(parsed.get("projects"))),
        ("five or more skills", 8, len(parsed.get("skills", [])) >= 5),
        ("certifications", 4, bool(parsed.get("certifications"))),
    ]

    earned = sum(points for _, points, passed in checks if passed)
    possible = sum(points for _, points, _ in checks)
    missing = [label for label, _, passed in checks if not passed]

    detail = (
        "All expected resume sections were detected."
        if not missing
        else "Not detected: " + ", ".join(missing) + "."
    )
    return _clamp(earned / possible * 100), detail


def _score_readability(text: str, parsed: dict) -> tuple:
    word_total = len(words(text))
    line_count = max(1, len([line for line in text.splitlines() if line.strip()]))
    avg_line = word_total / line_count

    issues = []
    score = 100.0

    if word_total < 180:
        score -= 30
        issues.append("the resume is very short")
    elif word_total < 280:
        score -= 12
        issues.append("the resume is relatively brief")

    if word_total > 1100:
        score -= 18
        issues.append("the resume is dense and may be skimmed")

    if avg_line > 32:
        score -= 20
        issues.append("many lines are long; concise bullets scan faster")
    elif avg_line > 26:
        score -= 10
        issues.append("some lines run long")

    bullet_count = sum(
        1 for line in text.splitlines()
        if line.strip().startswith(("-", "\u2022", "*", "\u25cf", "\u00b7"))
    )
    if bullet_count < 3:
        score -= 12
        issues.append("few bullet points were detected")

    if not parsed.get("summary"):
        score -= 6
        issues.append("no summary/objective section detected")

    detail = f"{word_total} words, {bullet_count} bullet points, ~{avg_line:.0f} words/line."
    if issues:
        detail += " Notes: " + "; ".join(issues[:3]) + "."

    return _clamp(score), detail


def _band(overall: int) -> str:
    if overall >= 85:
        return "Excellent alignment"
    if overall >= 70:
        return "Strong alignment"
    if overall >= 55:
        return "Moderate alignment"
    if overall >= 40:
        return "Weak alignment"
    return "Poor alignment"


def compute_scores(
    text: str,
    parsed: dict,
    job: dict,
    skill_match: dict,
    keywords: dict,
    custom_weights: dict | None = None,
) -> dict:
    """Compute weighted components and reproducible overall ATS match score."""
    weights = normalize_weights(custom_weights)
    semantic_sim = compute_semantic_similarity(text, job.get("rawText") or job.get("title", ""))

    raw = {
        "requiredSkills": _score_required_skills(skill_match),
        "preferredSkills": _score_preferred_skills(skill_match),
        "keywordCoverage": _score_keywords(keywords, semantic_sim),
        "experienceRelevance": _score_experience(parsed, job),
        "projectRelevance": _score_projects(parsed, job),
        "educationRelevance": _score_education(parsed, job),
        "completeness": _score_completeness(parsed),
        "readability": _score_readability(text, parsed),
    }

    components = []
    total = 0.0
    for key, weight in weights.items():
        value, explanation = raw[key]
        contribution = value * weight / 100.0
        total += contribution
        components.append({
            "key": key,
            "label": COMPONENT_LABELS[key],
            "score": round(value, 1),
            "weight": weight,
            "weightedContribution": round(contribution, 1),
            "explanation": explanation,
        })

    overall = int(round(_clamp(total)))
    return {
        "overall": overall,
        "components": components,
        "band": _band(overall),
        "semanticSimilarity": semantic_sim,
        "weights": weights,
    }


def extract_relevant_items(parsed: dict, job: dict) -> dict:
    """Rank parsed experience & project items by relevance to the actual job description."""
    job_skills = [s.lower() for s in job.get("requiredSkills", []) + job.get("preferredSkills", [])]
    needles = _keyword_needles(job)

    relevant_exp = []
    for entry in parsed.get("experience", []):
        blob = " ".join([entry.get("role", ""), entry.get("company", "")] + entry.get("points", [])).lower()
        matched_terms = [s for s in job.get("requiredSkills", []) + job.get("preferredSkills", []) if s.lower() in blob]
        kw_hits = sum(1 for n in needles if n in blob)
        relevant_exp.append({
            "role": entry.get("role", ""),
            "company": entry.get("company", ""),
            "period": entry.get("period", ""),
            "matchedSkills": matched_terms[:6],
            "keywordHits": kw_hits,
        })
    relevant_exp.sort(key=lambda x: (len(x["matchedSkills"]) * 2 + x["keywordHits"]), reverse=True)

    relevant_proj = []
    for proj in parsed.get("projects", []):
        blob = " ".join([proj.get("name", ""), proj.get("tech", ""), proj.get("description", "")]).lower()
        matched_terms = [s for s in job.get("requiredSkills", []) + job.get("preferredSkills", []) if s.lower() in blob]
        kw_hits = sum(1 for n in needles if n in blob)
        relevant_proj.append({
            "name": proj.get("name", ""),
            "tech": proj.get("tech", ""),
            "matchedSkills": matched_terms[:6],
            "keywordHits": kw_hits,
        })
    relevant_proj.sort(key=lambda x: (len(x["matchedSkills"]) * 2 + x["keywordHits"]), reverse=True)

    return {
        "relevantExperience": [e for e in relevant_exp if e["matchedSkills"] or e["keywordHits"] > 0] or relevant_exp[:2],
        "relevantProjects": [p for p in relevant_proj if p["matchedSkills"] or p["keywordHits"] > 0] or relevant_proj[:2],
    }


def build_summary(parsed: dict, job: dict, score_result: dict, skill_match: dict) -> str:
    candidate = parsed.get("contact", {}).get("name") or "The candidate"
    role = job.get("title") or "the target role"
    req_total = skill_match.get("requiredTotal", 0)
    req_strong = skill_match.get("requiredStrong", 0)
    return (
        f"{candidate}'s resume scored {score_result['overall']}% ({score_result['band']}) for {role}. "
        f"Matched {req_strong} of {req_total} required skills directly across "
        f"{len(parsed.get('projects', []))} project(s) and {len(parsed.get('experience', []))} experience entry/entries."
    )


def build_strengths(parsed: dict, skill_match: dict, keywords: dict) -> list:
    strengths = []
    required = [item["skill"] for item in skill_match["matched"] if item["priority"] == "required"]
    if required:
        strengths.append("Covers required job skills: " + ", ".join(required[:8]) + ".")

    preferred = [item["skill"] for item in skill_match["matched"] if item["priority"] == "preferred"]
    if preferred:
        strengths.append("Includes preferred/bonus skills: " + ", ".join(preferred[:5]) + ".")

    if skill_match["requiredTotal"] and skill_match["requiredStrong"] == skill_match["requiredTotal"]:
        strengths.append("Every explicitly required skill from the job description was found in the resume.")

    if keywords["coverage"] >= 55:
        strengths.append(
            f"Keyword coverage is {keywords['coverage']}% ({keywords['matchedCount']}/{keywords['total']} ranked JD terms)."
        )

    if parsed.get("experience"):
        entry = parsed["experience"][0]
        label = " at ".join(p for p in [entry.get("role"), entry.get("company")] if p)
        if label:
            strengths.append(f"Demonstrates practical experience: {label}.")

    if parsed.get("projects"):
        names = ", ".join(p["name"] for p in parsed["projects"][:3] if p.get("name"))
        if names:
            strengths.append(f"Projects documented in resume: {names}.")

    if not strengths:
        strengths.append("Document extracted cleanly and parsed into structured sections.")
    return strengths[:6]


def build_weaknesses(parsed: dict, skill_match: dict, keywords: dict) -> list:
    weaknesses = []
    missing_req = [item["skill"] for item in skill_match["missing"] if item["priority"] == "required"]
    if missing_req:
        weaknesses.append("Missing required skills from JD: " + ", ".join(missing_req[:8]) + ".")

    partial = [
        f"{item['skill']} (resume shows {', '.join(item.get('relatedSkills', [])[:2])})"
        for item in skill_match["partial"]
    ]
    if partial:
        weaknesses.append("Indirect/partial skill overlap only: " + "; ".join(partial[:4]) + ".")

    if keywords["missingCount"]:
        tops = ", ".join(item["keyword"] for item in keywords["missing"][:6])
        weaknesses.append(f"{keywords['missingCount']} JD keywords are absent, including: {tops}.")

    if not parsed.get("experience"):
        weaknesses.append("No internship or work experience section was detected in the resume.")

    if not parsed.get("projects"):
        weaknesses.append("No projects section was detected in the resume.")

    if not parsed.get("certifications"):
        weaknesses.append("No certifications or completed technical courses were listed.")

    return weaknesses[:6]


def build_recommendations(parsed: dict, skill_match: dict, keywords: dict, components: list) -> list:
    recommendations = []

    for skill in [item["skill"] for item in skill_match["missing"] if item["priority"] == "required"][:4]:
        recommendations.append({
            "title": f"Build hands-on proof for {skill}",
            "detail": (
                f"{skill} is required in the target job description but not detected in your resume. "
                f"Add a project or experience bullet demonstrating real implementation with {skill}."
            ),
            "priority": "high",
        })

    for item in skill_match["partial"][:3]:
        related = ", ".join(item.get("relatedSkills", [])[:2]) or "a related technology"
        recommendations.append({
            "title": f"Bridge {item['skill']} from {related}",
            "detail": (
                f"Your resume shows {related}. If you have applied {item['skill']}, name it explicitly "
                "in your project bullets and skills section."
            ),
            "priority": "medium",
        })

    missing_keywords = [item["keyword"] for item in keywords["missing"][:6]]
    if missing_keywords:
        recommendations.append({
            "title": "Align resume phrasing with JD terminology",
            "detail": (
                "Important JD terms missing from your resume: "
                + ", ".join(missing_keywords)
                + ". Include accurate matching terminology where it reflects your real work."
            ),
            "priority": "medium",
        })

    completeness = next((c for c in components if c["key"] == "completeness"), None)
    if completeness and completeness["score"] < 80:
        recommendations.append({
            "title": "Complete missing resume sections",
            "detail": completeness["explanation"],
            "priority": "medium",
        })

    readability = next((c for c in components if c["key"] == "readability"), None)
    if readability and readability["score"] < 78:
        recommendations.append({
            "title": "Improve ATS formatting & bullet clarity",
            "detail": readability["explanation"],
            "priority": "low",
        })

    return recommendations[:8]


def build_project_suggestions(parsed: dict, job: dict, skill_match: dict) -> list:
    targets = [item["skill"] for item in skill_match["missing"] if item["priority"] == "required"]
    targets += [item["skill"] for item in skill_match["partial"]]
    if not targets:
        targets = [item["skill"] for item in skill_match["missing"] if item["priority"] == "preferred"]

    role = job.get("title") or "the target role"
    return [
        {
            "title": f"Create a focused project featuring {skill}",
            "detail": (
                f"Build and deploy a compact module using {skill} relevant to {role}, "
                "and document measurable metrics (latency, accuracy, or scale) in your resume."
            ),
        }
        for skill in targets[:4]
    ]


def build_interview_questions(parsed: dict, job: dict, skill_match: dict) -> list:
    """Generate tailored interview questions grounded strictly in uploaded resume + JD."""
    questions = []
    role = job.get("title") or "this role"

    for proj in parsed.get("projects", [])[:2]:
        name = proj.get("name")
        tech = proj.get("tech")
        if name:
            tech_clause = f" using {tech}" if tech else ""
            questions.append({
                "category": tech.split(",")[0].strip() if tech else "Projects",
                "question": (
                    f"In your project \u201c{name}\u201d{tech_clause}, what was the hardest architectural "
                    "or debugging challenge you faced and how did you measure the outcome?"
                ),
            })

    for exp in parsed.get("experience", [])[:2]:
        exp_role = exp.get("role")
        company = exp.get("company")
        if exp_role or company:
            where = f"{exp_role} at {company}" if exp_role and company else (exp_role or company)
            questions.append({
                "category": "Experience",
                "question": (
                    f"During your time as {where}, walk me through a technical trade-off you made "
                    f"that relates to {role}."
                ),
            })

    for item in skill_match.get("missing", [])[:2]:
        skill = item["skill"]
        questions.append({
            "category": skill,
            "question": (
                f"This {role} posting emphasizes {skill}. How would you apply your current background "
                f"to ramp up on {skill} in production?"
            ),
        })

    if not questions:
        for item in skill_match.get("matched", [])[:3]:
            skill = item["skill"]
            questions.append({
                "category": skill,
                "question": f"Explain a real problem you solved with {skill} and how you tested edge cases.",
            })

    return questions[:6]
