"""Text extraction for PDF (text + OCR fallback) and DOCX resumes.

Both paths return plain text plus structural metadata. Nothing is written to
disk: the uploaded bytes are parsed in memory and discarded.
"""

import io
import zipfile
from functools import lru_cache

PDF_MAGIC = b"%PDF-"
DOCX_MAGIC = b"PK\x03\x04"

MIN_MEANINGFUL_CHARS = 120
MIN_OCR_CHARS = 60
MAX_OCR_PAGES = 6


class ExtractionError(ValueError):
    """Raised when a document cannot be turned into usable text."""


@lru_cache(maxsize=1)
def _get_ocr_engine():
    from rapidocr_onnxruntime import RapidOCR

    return RapidOCR()


def detect_format(content: bytes, filename: str) -> str:
    """Identify the real container format from magic bytes, not the extension."""
    if not content:
        raise ExtractionError("The uploaded file is empty.")

    if content[:5] == PDF_MAGIC:
        return "pdf"

    if content[:4] == DOCX_MAGIC:
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                names = archive.namelist()
        except zipfile.BadZipFile as exc:
            raise ExtractionError("The uploaded DOCX file is corrupt.") from exc
        if any(name.startswith("word/") for name in names):
            return "docx"
        raise ExtractionError(
            "The uploaded archive is not a Word .docx document. "
            "Legacy .doc files must be re-saved as .docx or .pdf."
        )

    suffix = (filename or "").lower().rsplit(".", 1)[-1]
    if suffix == "pdf":
        raise ExtractionError("This file is not a valid PDF (missing %PDF- header).")
    if suffix == "docx":
        raise ExtractionError("This file is not a valid DOCX document.")
    raise ExtractionError("Unsupported file type. Upload a PDF or DOCX resume.")


def _ocr_pdf_document(document) -> str:
    """Render scanned PDF pages to images in memory and run RapidOCR."""
    try:
        import numpy as np
        from PIL import Image

        ocr_engine = _get_ocr_engine()
    except Exception:
        return ""

    ocr_pages = []
    for index, page in enumerate(document):
        if index >= MAX_OCR_PAGES:
            break
        pixmap = page.get_pixmap(dpi=200, alpha=False)
        image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
        result, _ = ocr_engine(np.array(image))
        if result:
            lines = [item[1].strip() for item in result if len(item) >= 2 and item[1].strip()]
            if lines:
                ocr_pages.append("\n".join(lines))

    return "\n".join(ocr_pages)


def _extract_pdf(content: bytes) -> dict:
    import pymupdf

    try:
        document = pymupdf.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise ExtractionError(f"Could not open the PDF: {exc}") from exc

    if document.needs_pass:
        document.close()
        raise ExtractionError("This PDF is password protected. Remove the password and retry.")

    pages = []
    extraction_method = "pdf-text"
    try:
        page_count = document.page_count
        for page in document:
            pages.append(page.get_text("text"))

        embedded_text = "\n".join(pages)
        if len("".join(embedded_text.split())) < MIN_MEANINGFUL_CHARS:
            ocr_text = _ocr_pdf_document(document)
            if len("".join(ocr_text.split())) >= MIN_OCR_CHARS:
                embedded_text = ocr_text
                extraction_method = "pdf-ocr"
    finally:
        document.close()

    return {
        "format": "pdf",
        "extractionMethod": extraction_method,
        "text": embedded_text,
        "pageCount": page_count,
    }


def _extract_docx(content: bytes) -> dict:
    import docx

    try:
        document = docx.Document(io.BytesIO(content))
    except Exception as exc:
        raise ExtractionError(f"Could not open the DOCX: {exc}") from exc

    blocks = []
    for paragraph in document.paragraphs:
        text = (paragraph.text or "").strip()
        if text:
            blocks.append(text)

    # Resumes frequently place skills and education inside tables.
    for table in document.tables:
        for row in table.rows:
            cells = []
            for cell in row.cells:
                text = (cell.text or "").strip()
                if text and text not in cells:
                    cells.append(text)
            if cells:
                blocks.append(" | ".join(cells))

    return {
        "format": "docx",
        "extractionMethod": "docx-xml",
        "text": "\n".join(blocks),
        "pageCount": None,
    }


def extract(content: bytes, filename: str) -> dict:
    """Extract text and metadata from an uploaded resume."""
    fmt = detect_format(content, filename)

    if len(content) > 12 * 1024 * 1024:
        raise ExtractionError("The uploaded file is too large to process.")

    result = _extract_pdf(content) if fmt == "pdf" else _extract_docx(content)

    text = (result.get("text") or "").replace("\r\n", "\n").replace("\r", "\n")
    collapsed_len = len("".join(text.split()))

    min_required = MIN_OCR_CHARS if result.get("extractionMethod") == "pdf-ocr" else MIN_MEANINGFUL_CHARS
    if collapsed_len < min_required:
        raise ExtractionError(
            "Almost no readable text was found in this document, even after OCR. "
            "Upload a clearer PDF or a DOCX resume."
        )

    result["text"] = text
    result["charCount"] = len(text)
    result["wordCount"] = len(text.split())
    return result
