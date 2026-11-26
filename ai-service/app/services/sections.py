"""Structured resume parsing.

Turns extracted plain text into candidate details, education, experience,
projects, skills and certifications using heading detection plus targeted
regexes. Every field is best-effort: unknown values come back empty rather
than invented, so the UI never displays fabricated candidate data.
"""

import re
from functools import lru_cache

from . import taxonomy
from .textutil import (
    clean_lines,
    normalize_whitespace,
    strip_bullet,
    words,
)


@lru_cache(maxsize=1)
def _load_spacy():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception:
        return None

SECTION_KEYWORDS = {
    "summary": (
        "summary", "professional summary", "profile", "objective", "career objective",
        "about me", "about", "career summary",
    ),
    "education": (
        "education", "academic", "academics", "educational qualification",
        "educational qualifications", "qualifications", "academic background",
        "academic details", "education details",
    ),
    "experience": (
        "experience", "work experience", "professional experience", "employment",
        "employment history", "internship", "internships", "work history",
        "industry experience", "professional background",
    ),
    "projects": (
        "projects", "project", "academic projects", "personal projects",
        "key projects", "major projects", "project experience", "technical projects",
    ),
    "skills": (
        "skills", "technical skills", "core skills", "key skills",
        "technologies", "technical expertise", "technical proficiencies", "skill set",
        "programming languages", "tools and technologies", "technologies known",
    ),
    "certifications": (
        "certifications", "certification", "certificates", "licenses",
        "courses", "training", "certification & training", "online courses",
    ),
    "achievements": (
        "achievements", "awards", "honors", "honours", "accomplishments",
        "extra curricular", "extracurricular", "activities", "positions of responsibility",
    ),
    "languages": ("languages", "languages known"),
}

_HEADING_LOOKUP = {}
for _canonical, _keywords in SECTION_KEYWORDS.items():
    for _keyword in _keywords:
        _HEADING_LOOKUP[_keyword] = _canonical

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(
    r"(?:(?:\+|00)\d{1,3}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{3}[\s\-]?\d{3,4}(?:[\s\-]?\d{1,4})?"
)
URL_RE = re.compile(r"(?:https?://)?(?:www\.)?[A-Za-z0-9.\-]+\.[A-Za-z]{2,}(?:/[^\s,;]*)?")
LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/[A-Za-z0-9._%\-/]+", re.IGNORECASE)
GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9._\-]+", re.IGNORECASE)

DATE_RANGE_RE = re.compile(
    r"(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?"
    r"(?:19|20)\d{2}"
    r"\s*(?:-|–|—|to|until|till)\s*"
    r"(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?"
    r"(?:(?:19|20)\d{2}|present|current|now|ongoing)",
    re.IGNORECASE,
)
SINGLE_DATE_RE = re.compile(r"\b(?:19|20)\d{2}\b")

GPA_RE = re.compile(
    r"(?:cgpa|gpa|sgpa)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)"
    r"|(\d{1,2}(?:\.\d{1,2})?)\s*(?:/\s*10|cgpa|gpa)",
    re.IGNORECASE,
)
PERCENT_RE = re.compile(r"(\d{2,3}(?:\.\d{1,2})?)\s*%")

DEGREE_RE = re.compile(
    r"\b(?:b\.?\s?tech|b\.?\s?e\.?|bachelor(?:'s)?|b\.?\s?sc|b\.?\s?c\.?a|bca|mca|m\.?\s?tech|"
    r"master(?:'s)?|m\.?\s?sc|mba|ph\.?\s?d|doctorate|diploma|associate|higher secondary|"
    r"senior secondary|class\s?xii|class\s?12|class\s?x\b|class\s?10|hsc|ssc|intermediate)\b",
    re.IGNORECASE,
)
INSTITUTION_RE = re.compile(
    r"\b(?:university|college|institute|institution|school|academy|iit|nit|iiit|bits|vit|"
    r"polytechnic|campus|faculty)\b",
    re.IGNORECASE,
)
TITLE_RE = re.compile(
    r"\b(?:intern|internship|engineer|developer|analyst|consultant|associate|manager|lead|"
    r"architect|scientist|designer|administrator|specialist|trainee|freelance|founder|"
    r"co-?founder|teaching assistant|research assistant)\b",
    re.IGNORECASE,
)
CERT_RE = re.compile(
    r"\b(?:certified|certification|certificate|course|nanodegree|specialization|"
    r"credential|badge|udemy|coursera|nptel|edx|aws certified|azure|scrum master)\b",
    re.IGNORECASE,
)

BULLET_HINTS = ("-", "\u2022", "\u25cf", "*", "\u00b7")


def _is_heading(line: str) -> str:
    """Return the canonical section name if the line looks like a heading."""
    raw = strip_bullet(line)
    candidate = raw.rstrip(":").strip()
    if not candidate or len(candidate) > 45:
        return ""

    lowered = re.sub(r"[^a-z& ]", " ", candidate.lower())
    lowered = normalize_whitespace(lowered)

    if lowered in _HEADING_LOOKUP:
        return _HEADING_LOOKUP[lowered]

    # "TECHNICAL SKILLS:" style with a trailing qualifier ("Skills & Interests")
    token_count = len(lowered.split())
    if token_count <= 4:
        for keyword, canonical in _HEADING_LOOKUP.items():
            if lowered == keyword:
                return canonical
            if lowered.startswith(keyword + " ") and token_count <= 3:
                return canonical
    return ""


def _split_sections(lines: list) -> dict:
    buckets = {"header": []}
    current = "header"
    for line in lines:
        heading = _is_heading(line)
        if heading:
            current = heading
            buckets.setdefault(current, [])
            continue
        buckets.setdefault(current, []).append(line)
    return buckets


def _extract_contact(lines: list, full_text: str) -> dict:
    email = ""
    match = EMAIL_RE.search(full_text)
    if match:
        email = match.group(0)

    phone = ""
    for match in PHONE_RE.finditer(full_text):
        digits = re.sub(r"\D", "", match.group(0))
        if 10 <= len(digits) <= 13:
            phone = match.group(0).strip()
            break

    linkedin = ""
    match = LINKEDIN_RE.search(full_text)
    if match:
        linkedin = match.group(0)

    github = ""
    match = GITHUB_RE.search(full_text)
    if match:
        github = match.group(0)

    portfolio = ""
    for match in URL_RE.finditer(full_text):
        url = match.group(0)
        lowered = url.lower()
        if "@" in lowered or "linkedin" in lowered or "github" in lowered:
            continue
        if lowered.endswith((".png", ".jpg", ".jpeg", ".svg")):
            continue
        if "." in lowered and len(lowered) > 6:
            portfolio = url
            break

    name = ""
    for line in lines[:8]:
        candidate = strip_bullet(normalize_whitespace(line))
        if not candidate or len(candidate) > 48:
            continue
        lowered = candidate.lower()
        if any(token in lowered for token in ("resume", "curriculum vitae", "cv", "@", "http", "www.")):
            continue
        if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate):
            continue
        if any(char.isdigit() for char in candidate):
            continue
        if _is_heading(candidate):
            continue
        tokens = candidate.replace(",", " ").split()
        if 1 < len(tokens) <= 5 and all(token.replace(".", "").replace("-", "").isalpha() for token in tokens):
            name = candidate
            break

    if not name:
        nlp = _load_spacy()
        if nlp is not None:
            header_blob = "\n".join(lines[:10])
            doc = nlp(header_blob)
            for ent in doc.ents:
                if ent.label_ == "PERSON" and 2 <= len(ent.text.split()) <= 4:
                    cand = normalize_whitespace(ent.text)
                    if not EMAIL_RE.search(cand) and not PHONE_RE.search(cand) and not _is_heading(cand):
                        name = cand
                        break

    location = ""
    for line in lines[:10]:
        match = re.search(r"\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?),\s*(India|USA|UK|Canada|Germany|Singapore|Australia|UAE)\b", line)
        if match:
            location = match.group(0)
            break

    if not location:
        nlp = _load_spacy()
        if nlp is not None:
            doc = nlp("\n".join(lines[:10]))
            gpes = [normalize_whitespace(ent.text) for ent in doc.ents if ent.label_ == "GPE"]
            if gpes:
                location = ", ".join(dict.fromkeys(gpes[:2]))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
    }


def _group_records(lines: list, is_primary) -> list:
    """Split a section's lines into records starting at each primary line."""
    records = []
    open_record = None
    preamble = []

    for line in lines:
        cleaned = strip_bullet(line)
        if not cleaned:
            continue
        if is_primary(line):
            open_record = [line]
            records.append(open_record)
        elif open_record is not None:
            open_record.append(line)
        else:
            preamble.append(line)

    if preamble:
        if records:
            records[0] = preamble + records[0]
        else:
            records.append(preamble)
    return records


def _first_match(pattern, text: str) -> str:
    match = pattern.search(text or "")
    return match.group(0).strip() if match else ""


def _grade_from(text: str) -> str:
    match = GPA_RE.search(text or "")
    if match:
        value = match.group(1) or match.group(2)
        return f"{value} CGPA"
    match = PERCENT_RE.search(text or "")
    if match:
        return f"{match.group(1)}%"
    return ""


def _parse_education(lines: list) -> list:
    def is_primary(line: str) -> bool:
        return bool(INSTITUTION_RE.search(line) or DEGREE_RE.search(line))

    entries = []
    for record in _group_records(lines, is_primary):
        text = "\n".join(record)
        institution = ""
        degree = ""

        for line in record:
            cleaned = strip_bullet(line)
            if INSTITUTION_RE.search(cleaned) and len(cleaned) <= 120:
                if not institution:
                    institution = cleaned
                    continue
            if DEGREE_RE.search(cleaned) and len(cleaned) <= 120:
                if not degree:
                    degree = cleaned

        if not institution and not degree:
            continue

        entries.append({
            "institution": institution or "",
            "degree": degree or "",
            "period": _first_match(DATE_RANGE_RE, text),
            "grade": _grade_from(text),
        })

    return entries[:8]


def _parse_experience(lines: list) -> list:
    def is_primary(line: str) -> bool:
        if DATE_RANGE_RE.search(line):
            return True
        return bool(TITLE_RE.search(line)) and len(line) <= 140

    entries = []
    for record in _group_records(lines, is_primary):
        if not record:
            continue
        headline = strip_bullet(record[0])
        body_lines = [strip_bullet(line) for line in record[1:] if strip_bullet(line)]

        role, company, location = _split_role_company(headline)

        bullets = []
        for line in body_lines:
            if DATE_RANGE_RE.fullmatch(strip_bullet(line)):
                continue
            if len(line) > 25 and len(bullets) < 8:
                bullets.append(line)

        if not role and not company:
            role = headline

        entries.append({
            "role": role,
            "company": company,
            "location": location,
            "period": _first_match(DATE_RANGE_RE, "\n".join(record)),
            "points": bullets,
        })

    return [entry for entry in entries if entry["role"] or entry["company"]][:10]


def _split_role_company(headline: str) -> tuple:
    cleaned = normalize_whitespace(headline)
    cleaned = DATE_RANGE_RE.sub("", cleaned).strip(" ,|\u2013\u2014-\u00b7")

    separators = [" at ", " | ", " \u2013 ", " \u2014 ", " - ", ", ", " \u00b7 "]
    for separator in separators:
        if separator in cleaned:
            left, right = cleaned.split(separator, 1)
            left, right = left.strip(), right.strip()
            if not left or not right:
                continue
            if TITLE_RE.search(left):
                return left, _strip_location(right)[0], _strip_location(right)[1]
            if TITLE_RE.search(right):
                return right, _strip_location(left)[0], _strip_location(left)[1]
            return left, _strip_location(right)[0], _strip_location(right)[1]

    if TITLE_RE.search(cleaned):
        return cleaned, "", ""
    return cleaned, "", ""


def _strip_location(text: str) -> tuple:
    cleaned = normalize_whitespace(text).strip(" ,|\u00b7")
    match = re.search(r",\s*([A-Za-z .]+)$", cleaned)
    if match and len(match.group(1)) <= 24:
        return cleaned[: match.start()].strip(), match.group(1).strip()
    return cleaned, ""


def _parse_projects(lines: list) -> list:
    def is_primary(line: str) -> bool:
        cleaned = strip_bullet(line)
        if not cleaned or len(cleaned) > 90:
            return False
        if cleaned.endswith("."):
            return False
        if line.strip().startswith(BULLET_HINTS):
            return False
        return len(words(cleaned)) <= 12

    entries = []
    for record in _group_records(lines, is_primary):
        if not record:
            continue
        headline = strip_bullet(record[0])
        description_lines = [strip_bullet(line) for line in record[1:] if strip_bullet(line)]

        name, tech = _split_project_headline(headline)
        if not name:
            continue

        description = " ".join(description_lines)
        entries.append({
            "name": name,
            "tech": tech,
            "description": normalize_whitespace(description),
        })

    return [entry for entry in entries if entry["name"]][:10]


def _split_project_headline(headline: str) -> tuple:
    cleaned = normalize_whitespace(headline).strip()
    for separator in [" | ", " \u2013 ", " \u2014 ", " - ", " :: ", ": "]:
        if separator in cleaned:
            left, right = cleaned.split(separator, 1)
            left, right = left.strip(), right.strip()
            if left and right and 2 <= len(left) <= 80:
                return left, right.strip("()")
    return cleaned.strip("()"), ""


def _parse_certifications(lines: list) -> list:
    entries = []
    for line in lines:
        for chunk in re.split(r"[;\u2022|]", line):
            cleaned = strip_bullet(chunk).strip(" ,-")
            if len(cleaned) < 4 or len(cleaned) > 160:
                continue
            entries.append(cleaned)
    return entries[:10]


def _parse_skills(lines: list, full_text: str) -> dict:
    """Detect skills from the skills section and the resume body."""
    concatenated = "\n".join(lines)
    taxonomy_hits = detect_skills(concatenated or full_text)

    other_skills = []
    seen = {skill.lower() for skill in taxonomy_hits}
    for line in lines:
        for chunk in re.split(r"[,;|\u2022\u00b7/]", line):
            candidate = strip_bullet(chunk).strip(" .-")
            if not (2 <= len(candidate) <= 28):
                continue
            if len(candidate.split()) > 3:
                continue
            lowered = candidate.lower()
            if lowered in seen or lowered in ("and", "etc"):
                continue
            if not re.match(r"^[A-Za-z][A-Za-z0-9+#.\- ]*$", candidate):
                continue
            seen.add(lowered)
            other_skills.append(candidate)

    return {
        "skills": taxonomy_hits,
        "otherSkills": other_skills[:25],
    }


def detect_skills(text: str) -> list:
    """Return canonical taxonomy skill names present in the text, ordered."""
    lowered = (text or "").lower()
    if not lowered:
        return []

    found = []
    seen = set()
    for phrase in taxonomy.all_alias_phrases():
        if phrase not in lowered:
            continue
        skill = taxonomy.ALIAS_INDEX[phrase]
        if skill.name in seen:
            continue
        from .textutil import phrase_pattern  # local import avoids a cycle at module load

        if not phrase_pattern(phrase).search(text):
            continue
        seen.add(skill.name)
        found.append(skill.name)
    return found


def group_by_category(skill_names: list) -> dict:
    groups = {
        "languages": [],
        "frameworks": [],
        "databases": [],
        "cloud": [],
        "tools": [],
        "concepts": [],
        "soft": [],
    }
    mapping = {
        "language": "languages",
        "framework": "frameworks",
        "database": "databases",
        "cloud": "cloud",
        "tool": "tools",
        "concept": "concepts",
        "soft": "soft",
    }
    for name in skill_names:
        skill = taxonomy.SKILL_BY_NAME.get(name.lower())
        if not skill:
            continue
        bucket = mapping.get(skill.category)
        if bucket and name not in groups[bucket]:
            groups[bucket].append(name)
    return groups


def parse_resume(text: str) -> dict:
    """Parse a resume's plain text into structured candidate data."""
    lines = clean_lines(text)
    buckets = _split_sections(lines)

    contact = _extract_contact(buckets.get("header", []), text)
    education = _parse_education(buckets.get("education", []))
    experience = _parse_experience(buckets.get("experience", []))
    projects = _parse_projects(buckets.get("projects", []))
    certifications = _parse_certifications(buckets.get("certifications", []))

    skills_section = buckets.get("skills", [])
    skill_data = _parse_skills(skills_section, text)
    body_skills = detect_skills("\n".join(buckets.get("projects", []) + buckets.get("experience", [])))

    all_skills = []
    for name in skill_data["skills"] + body_skills:
        if name not in all_skills:
            all_skills.append(name)

    summary = normalize_whitespace(" ".join(buckets.get("summary", [])))[:600]

    return {
        "contact": contact,
        "summary": summary,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "skills": all_skills,
        "otherSkills": skill_data["otherSkills"],
        "skillGroups": group_by_category(all_skills),
        "sectionsFound": sorted(key for key in buckets if buckets[key] and key != "header"),
        "lineCount": len(lines),
        "wordCount": len(words(text)),
    }
