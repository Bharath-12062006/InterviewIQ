"""Resume-to-job skill matching.

Produces three explicit buckets — matched, partial, missing — plus a keyword
coverage figure. Every entry carries a human-readable reason so the UI can
explain the scoring instead of presenting a bare number.
"""

from . import taxonomy

STRONG = "strong"
PARTIAL = "partial"
MISSING = "missing"

CATEGORY_LABELS = {
    "language": "Programming language",
    "framework": "Framework / library",
    "database": "Database",
    "cloud": "Cloud platform",
    "tool": "Tooling",
    "concept": "Core concept",
    "soft": "Professional skill",
}


def _category_label(skill_name: str) -> str:
    skill = taxonomy.SKILL_BY_NAME.get(skill_name.lower())
    if not skill:
        return "Skill"
    return CATEGORY_LABELS.get(skill.category, "Skill")


def _resolve_partial(skill_name: str, resume_skills: list, other_skills: list) -> dict:
    """Work out *how* a required skill is partially covered, if at all."""
    resume_lower = {name.lower() for name in resume_skills}
    mates = taxonomy.family_mates(skill_name)

    overlaps = sorted(mate for mate in mates if mate.lower() in resume_lower)
    if overlaps:
        return {
            "relatedSkills": overlaps,
            "reason": (
                f"The role asks for {skill_name}. Your resume shows "
                f"{', '.join(overlaps[:3])} — the same family of technology, "
                f"but not the exact requirement."
            ),
        }

    for other in other_skills:
        if other.lower() == skill_name.lower():
            return {
                "relatedSkills": [other],
                "reason": (
                    f"{skill_name} appears in your skills list but is not backed by "
                    f"a project or experience bullet, so it reads as a claim rather "
                    f"than demonstrated experience."
                ),
            }

    return {}


def match_skills(resume_skills: list, other_skills: list, job: dict) -> dict:
    """Compare resume skills against the job's required and preferred skills."""
    resume_lower = {name.lower() for name in resume_skills}

    matched = []
    partial = []
    missing = []

    def bucket(skill_name: str, priority: str) -> None:
        entry = {
            "skill": skill_name,
            "category": _category_label(skill_name),
            "priority": priority,
        }

        if skill_name.lower() in resume_lower:
            entry["status"] = STRONG
            entry["reason"] = (
                f"{skill_name} is required by the role and present in your resume."
                if priority == "required"
                else f"{skill_name} is a preferred skill and you already have it."
            )
            matched.append(entry)
            return

        resolution = _resolve_partial(skill_name, resume_skills, other_skills)
        if resolution:
            entry["status"] = PARTIAL
            entry["reason"] = resolution["reason"]
            entry["relatedSkills"] = resolution["relatedSkills"]
            partial.append(entry)
            return

        entry["status"] = MISSING
        entry["reason"] = (
            f"{skill_name} is explicitly required but does not appear anywhere in your resume."
            if priority == "required"
            else f"{skill_name} is listed as a bonus skill; you do not mention it."
        )
        missing.append(entry)

    for name in job.get("requiredSkills", []):
        bucket(name, "required")
    for name in job.get("preferredSkills", []):
        bucket(name, "preferred")

    required_total = len(job.get("requiredSkills", []))
    required_hits = sum(1 for item in matched + partial if item["priority"] == "required")
    required_strong = sum(1 for item in matched if item["priority"] == "required")

    return {
        "matched": matched,
        "partial": partial,
        "missing": missing,
        "requiredTotal": required_total,
        "requiredCovered": required_hits,
        "requiredStrong": required_strong,
        "preferredTotal": len(job.get("preferredSkills", [])),
    }


def match_keywords(resume_text: str, job: dict, limit: int = 18) -> dict:
    """Check which ranked job keywords appear in the resume text."""
    lowered = (resume_text or "").lower()
    matched = []
    missing = []

    for item in job.get("keywords", []):
        keyword = item["keyword"]
        needle = keyword.lower()
        if needle in lowered:
            matched.append({"keyword": keyword, "weight": item["weight"]})
        else:
            missing.append({"keyword": keyword, "weight": item["weight"]})

    total = len(matched) + len(missing)
    coverage = (len(matched) / total * 100) if total else 0.0

    return {
        "matched": matched[:limit],
        "missing": missing[:limit],
        "matchedCount": len(matched),
        "missingCount": len(missing),
        "coverage": round(coverage, 1),
        "total": total,
    }
