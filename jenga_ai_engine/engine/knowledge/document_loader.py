from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Optional

from .models import KnowledgeDocument, KnowledgeChunk


SUPPORTED_TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json"}


def _normalise_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def load_document(
    path: str | Path,
    *,
    title: Optional[str] = None,
    source: Optional[str] = None,
    category: str = "technical_documents",
    date: Optional[str] = None,
    location: Optional[str] = None,
    document_type: Optional[str] = None,
) -> KnowledgeDocument:
    """Load a text-based knowledge source with explicit provenance metadata.

    PDF/DOCX extraction is intentionally not silently attempted here. They
    should first be converted/extracted with an appropriate parser, preserving
    the source metadata, then the resulting text can be indexed.
    """
    file_path = Path(path)

    if not file_path.exists():
        raise FileNotFoundError(f"Knowledge document not found: {file_path}")

    if file_path.suffix.lower() not in SUPPORTED_TEXT_EXTENSIONS:
        raise ValueError(
            f"Unsupported text format: {file_path.suffix}. "
            "Extract PDF/DOCX content first, then index the extracted text."
        )

    content = _normalise_whitespace(
        file_path.read_text(encoding="utf-8", errors="replace")
    )

    if not content:
        raise ValueError(f"Knowledge document is empty: {file_path}")

    raw_id = f"{file_path.resolve()}::{content[:2000]}"
    document_id = hashlib.sha256(
        raw_id.encode("utf-8")
    ).hexdigest()[:16]

    return KnowledgeDocument(
        document_id=document_id,
        title=title or file_path.stem,
        source=source or file_path.name,
        file_path=str(file_path),
        category=category,
        date=date,
        location=location,
        document_type=document_type,
        content=content,
    )


def chunk_text(
    document: KnowledgeDocument,
    *,
    chunk_size: int = 1200,
    overlap: int = 200,
) -> list:
    """Split a document into overlapping chunks without changing its text."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")
    if overlap < 0:
        raise ValueError("overlap cannot be negative.")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size.")

    text = document.content.strip()
    chunks = []
    start = 0
    chunk_index = 0

    while start < len(text):
        end = min(len(text), start + chunk_size)

        # Prefer a paragraph/sentence boundary when close to the target size.
        if end < len(text):
            boundary_window = text[max(start, end - 250):end]
            candidates = [
                boundary_window.rfind("\n\n"),
                boundary_window.rfind(". "),
                boundary_window.rfind("; "),
                boundary_window.rfind(", "),
            ]
            boundary = max(candidates)
            if boundary >= 80:
                end = max(start + 1, end - 250 + boundary + 1)

        content = text[start:end].strip()

        if content:
            chunks.append(
                KnowledgeChunk(
                    chunk_id=f"{document.document_id}_{chunk_index:04d}",
                    document_id=document.document_id,
                    title=document.title,
                    source=document.source,
                    category=document.category,
                    content=content,
                    date=document.date,
                    location=document.location,
                    document_type=document.document_type,
                    chunk_index=chunk_index,
                )
            )
            chunk_index += 1

        next_start = end - overlap
        if next_start <= start:
            next_start = end
        start = next_start

    return chunks
