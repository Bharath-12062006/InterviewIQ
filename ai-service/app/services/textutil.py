"""Small, dependency-free text utilities shared by the ATS engine."""

import re

WORD_RE = re.compile(r"[A-Za-z][A-Za-z+#.\-]*|\d+(?:\.\d+)?")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")
BULLET_PREFIX_RE = re.compile(r"^\s*(?:[\u2022\u25cf\u25aa\u2023\u2043\-\*\u00b7\u25e6]|\d+[.)])\s*")

STOPWORDS = frozenset("""
a about above after again against all am an and any are aren't as at be because been before being
below between both but by can cannot could couldn't did didn't do does doesn't doing don't down during
each few for from further had hadn't has hasn't have haven't having he her here hers herself him
himself his how i if in into is isn't it it's its itself just me more most mustn't my myself no nor not
of off on once only or other ought our ours ourselves out over own same shan't she should shouldn't so
some such than that that's the their theirs them themselves then there these they this those through to
too under until up very was wasn't we were weren't what when where which while who whom why will with
won't would wouldn't you your yours yourself yourselves also etc via per within across among around
using use used work working works worked strong good excellent ability able years year month months
experience experienced knowledge understanding familiar familiarity required requirements requirement
responsibilities responsibility role position job candidate candidates team teams company companies
please apply applicant applicants including include includes must should plus preferred
""".split())


def normalize_whitespace(text: str) -> str:
    return re.sub(r"[ \t\u00a0]+", " ", text or "").strip()


def strip_bullet(line: str) -> str:
    return BULLET_PREFIX_RE.sub("", line or "").strip()


def clean_lines(text: str) -> list:
    """Split raw extracted text into trimmed, non-empty lines."""
    lines = []
    for raw in (text or "").splitlines():
        line = raw.replace("\u00a0", " ").rstrip()
        if line.strip():
            lines.append(line.strip())
    return lines


def words(text: str) -> list:
    """Lower-cased word tokens, punctuation trimmed."""
    tokens = []
    for match in WORD_RE.finditer((text or "").lower()):
        token = match.group(0).strip(".-")
        if token:
            tokens.append(token)
    return tokens


def content_words(text: str) -> list:
    """Word tokens with stopwords, single letters and pure numbers removed."""
    out = []
    for token in words(text):
        if token in STOPWORDS or len(token) < 2 or token.isdigit():
            continue
        out.append(token)
    return out


def ngrams(tokens: list, size: int) -> list:
    if size <= 0 or len(tokens) < size:
        return []
    return [" ".join(tokens[i:i + size]) for i in range(len(tokens) - size + 1)]


def sentences(text: str) -> list:
    parts = SENTENCE_RE.split((text or "").strip())
    return [part.strip() for part in parts if part.strip()]


def word_count(text: str) -> int:
    return len(words(text))


def phrase_pattern(phrase: str) -> re.Pattern:
    """Word-boundary regex so C++ never matches C."""
    escaped = re.escape(phrase.lower()).replace(r"\ ", r"\s+")
    return re.compile(r"(?<![a-z0-9+#])" + escaped + r"(?![a-z0-9+#])", re.IGNORECASE)


def find_phrases(text: str, phrases: list) -> list:
    lowered = (text or "").lower()
    found = []
    for phrase in phrases:
        if phrase not in lowered:
            continue
        if phrase_pattern(phrase).search(text or ""):
            found.append(phrase)
    return found


def truncate(text: str, limit: int) -> str:
    text = text or ""
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "\u2026"
