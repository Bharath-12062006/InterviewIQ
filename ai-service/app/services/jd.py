"""Job description analysis using taxonomy matching, spaCy NER/noun chunks, and TF-IDF keywords."""

import re
from functools import lru_cache

from . import sections, taxonomy
from .textutil import clean_lines, content_words, ngrams, normalize_whitespace, phrase_pattern

REQUIRED_CUES = (
    "required", "requirements", "must have", "must-have", "mandatory",
    "minimum qualifications", "basic qualifications", "essential", "you have",
    "strong proficiency", "proven experience", "proficiency in",
)
PREFERRED_CUES = (
    "preferred", "nice to have", "nice-to-have", "bonus", "plus",
    "desired", "good to have", "advantageous", "optional",
)

EXP_YEARS_RE = re.compile(
    r"(\d+\s*(?:\+|-\s*\d+|to\s*\d+)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?|"
    r"fresher|entry[\s-]level|new\s*grad|intern(?:ship)?)",
    re.IGNORECASE,
)
EDU_REQ_RE = re.compile(
    r"((?:bachelor(?:'s)?|master(?:'s)?|ph\.?d|b\.?\s?tech|b\.?\s?e\.?|m\.?\s?tech|mca|bca|bs|ms)"
    r"(?:\s*(?:or|\/)\s*(?:bachelor(?:'s)?|master(?:'s)?|m\.?\s?tech|b\.?\s?tech|b\.?\s?e\.?|ms|mca))*"
    r"(?:\s*(?:degree)?\s*(?:in|of)?\s*[A-Za-z &,/]{2,55})?)",
    re.IGNORECASE,
)


@lru_cache(maxsize=1)
def _load_spacy():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception:
        return None


def _split_jd_priority_zones(description: str) -> tuple[str, str]:
    """Separate lines/sentences that indicate required vs preferred qualifications."""
    required_lines = []
    preferred_lines = []
    mode = "required"

    for line in clean_lines(description):
        lowered = line.lower()
        if any(cue in lowered for cue in PREFERRED_CUES):
            mode = "preferred"
            preferred_lines.append(line)
            continue
        if any(cue in lowered for cue in REQUIRED_CUES):
            mode = "required"
            required_lines.append(line)
            continue
        if mode == "preferred":
            preferred_lines.append(line)
        else:
            required_lines.append(line)

    return "\n".join(required_lines), "\n".join(preferred_lines)


def _extract_ranked_keywords(title: str, description: str, limit: int = 24) -> list:
    """Rank job keywords using spaCy noun chunks + content n-grams and frequency."""
    combined = f"{title}\n{description}".strip()
    if not combined:
        return []

    counts: dict[str, float] = {}
    nlp = _load_spacy()

    if nlp is not None:
        doc = nlp(combined[:25000])
        for chunk in doc.noun_chunks:
            cleaned = normalize_whitespace(re.sub(r"[^A-Za-z0-9+#.\-/ ]", " ", chunk.text)).lower()
            words_list = cleaned.split()
            if not (1 <= len(words_list) <= 3):
                continue
            filtered = [w for w in words_list if w not in _STOP_EXTRAS and len(w) >= 2]
            if not filtered:
                continue
            phrase = " ".join(filtered)
            if len(phrase) < 3:
                continue
            counts[phrase] = counts.get(phrase, 0.0) + (2.0 if len(filtered) > 1 else 1.0)

        for token in doc:
            if token.is_stop or token.is_punct or len(token.text) < 2:
                continue
            if token.pos_ in ("NOUN", "PROPN"):
                term = token.text.lower().strip(".,-:")
                if term and term not in _STOP_EXTRAS and not term.isdigit():
                    counts[term] = counts.get(term, 0.0) + 1.0

    tokens = content_words(combined)
    for token in tokens:
        counts[token] = counts.get(token, 0.0) + 1.0
    for bigram in ngrams(tokens, 2):
        counts[bigram] = counts.get(bigram, 0.0) + 1.4

    # Boost canonical taxonomy terms detected in the JD
    for skill_name in sections.detect_skills(combined):
        key = skill_name.lower()
        counts[key] = counts.get(key, 0.0) + 3.0

    # Boost title words
    for t_word in content_words(title):
        counts[t_word] = counts.get(t_word, 0.0) + 2.0

    ranked = sorted(counts.items(), key=lambda item: (-item[1], -len(item[0]), item[0]))
    out = []
    seen = set()
    for term, weight in ranked:
        if term in seen:
            continue
        seen.add(term)
        out.append({"keyword": term, "weight": round(weight, 2)})
        if len(out) >= limit:
            break
    return out


_STOP_EXTRAS = frozenset({
    "role", "team", "work", "experience", "skills", "skill", "ability", "knowledge",
    "candidate", "company", "responsibilities", "requirements", "qualifications",
    "degree", "year", "years", "strong", "good", "excellent", "understanding",
})


def _extract_education_requirements(description: str) -> list:
    found = []
    seen = set()
    for match in EDU_REQ_RE.finditer(description or ""):
        snippet = normalize_whitespace(match.group(1)).strip(" ,.;:-")
        if len(snippet) < 2 or len(snippet) > 90:
            continue
        lowered = snippet.lower()
        if lowered not in seen:
            seen.add(lowered)
            found.append(snippet)
    return found[:6]


def _extract_experience_requirements(description: str) -> list:
    found = []
    seen = set()
    for match in EXP_YEARS_RE.finditer(description or ""):
        snippet = normalize_whitespace(match.group(1))
        lowered = snippet.lower()
        if lowered not in seen:
            seen.add(lowered)
            found.append(snippet)
    return found[:5]


_ROLE_BASELINE_SKILLS = {
    "full stack": (["JavaScript", "TypeScript", "React", "Node.js", "Express.js", "SQL", "MongoDB", "REST API", "Git"], ["Docker", "Unit Testing"]),
    "backend": (["Node.js", "Python", "SQL", "PostgreSQL", "REST API", "Docker", "Git", "Unit Testing"], ["Redis", "AWS", "Microservices"]),
    "frontend": (["JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind CSS", "REST API", "Git"], ["Next.js", "Unit Testing"]),
    "data analyst": (["SQL", "Python", "Data Analysis", "Data Visualization", "Statistics"], ["PostgreSQL", "Big Data"]),
    "data scientist": (["Python", "SQL", "Machine Learning", "Statistics", "Data Analysis", "Scikit-learn"], ["PyTorch", "Deep Learning", "Natural Language Processing"]),
    "machine learning": (["Python", "Machine Learning", "Scikit-learn", "PyTorch", "SQL", "Data Structures"], ["Docker", "FastAPI", "MLflow"]),
    "software engineer": (["Data Structures", "Algorithms", "Object Oriented Programming", "SQL", "Git", "REST API"], ["Docker", "Unit Testing", "System Design"]),
    "devops": (["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Git"], ["Terraform", "Bash", "Prometheus"]),
}


def _baseline_skills_for_title(title: str) -> tuple[list, list]:
    low = (title or "").lower()
    for cue, (req, pref) in _ROLE_BASELINE_SKILLS.items():
        if cue in low:
            return list(req), list(pref)
    return list(_ROLE_BASELINE_SKILLS["software engineer"][0]), list(_ROLE_BASELINE_SKILLS["software engineer"][1])


def analyze_job_description(title: str, description: str) -> dict:
    """Parse target job title & JD into required/preferred skills, keywords, and requirements."""
    clean_title = normalize_whitespace(title) or "Target Role"
    clean_desc = (description or "").strip()

    req_zone, pref_zone = _split_jd_priority_zones(clean_desc)
    all_detected = sections.detect_skills(f"{clean_title}\n{clean_desc}")
    pref_detected = set(s.lower() for s in sections.detect_skills(pref_zone))
    req_detected = set(s.lower() for s in sections.detect_skills(req_zone))

    required_skills = []
    preferred_skills = []
    for skill_name in all_detected:
        low = skill_name.lower()
        if low in pref_detected and low not in req_detected:
            preferred_skills.append(skill_name)
        else:
            required_skills.append(skill_name)

    # Also capture explicit single-line skills in preferred zone if missed
    for line in clean_lines(pref_zone):
        for s_name in sections.detect_skills(line):
            if s_name not in preferred_skills and s_name not in required_skills:
                preferred_skills.append(s_name)

    has_detailed_jd = len(content_words(clean_desc)) >= 12
    # If the user supplied only a job title or short prompt without listing skills,
    # infer transparent baseline skills from the target role so matching stays meaningful.
    if not has_detailed_jd and not required_skills and not preferred_skills:
        required_skills, preferred_skills = _baseline_skills_for_title(clean_title)
        all_detected = required_skills + preferred_skills

    keywords = _extract_ranked_keywords(clean_title, clean_desc)
    edu_reqs = _extract_education_requirements(clean_desc)
    exp_reqs = _extract_experience_requirements(clean_desc)

    return {
        "title": clean_title,
        "rawText": clean_desc,
        "requiredSkills": required_skills,
        "preferredSkills": preferred_skills,
        "skillsByCategory": sections.group_by_category(all_detected),
        "educationRequirements": edu_reqs,
        "experienceRequirements": exp_reqs,
        "keywords": keywords,
        "hasDetailedJD": has_detailed_jd,
    }
