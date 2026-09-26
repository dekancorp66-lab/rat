from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Optional


@dataclass
class KnowledgeDocument:
    """Metadata and source content for one trusted knowledge document."""

    document_id: str
    title: str
    source: str
    file_path: str
    category: str
    date: Optional[str] = None
    location: Optional[str] = None
    document_type: Optional[str] = None
    content: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class KnowledgeChunk:
    """A searchable section of a trusted document."""

    chunk_id: str
    document_id: str
    title: str
    source: str
    category: str
    content: str
    date: Optional[str] = None
    location: Optional[str] = None
    document_type: Optional[str] = None
    chunk_index: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RetrievalResult:
    """A chunk returned by the retriever with an explainable score."""

    chunk: KnowledgeChunk
    score: float

    def to_dict(self) -> dict[str, Any]:
        data = self.chunk.to_dict()
        data["score"] = self.score
        return data
