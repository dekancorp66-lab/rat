from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Optional

from .document_loader import chunk_text
from .models import KnowledgeChunk, KnowledgeDocument


class KnowledgeStore:
    """Persistent local store for JENGA knowledge chunks.

    This first version uses JSONL so it is easy to inspect, version and test.
    It deliberately avoids adding a vector database dependency until the
    corpus and retrieval behavior have been validated.
    """

    def __init__(self, path: str | Path = "data/knowledge/knowledge_store.jsonl"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def clear(self) -> None:
        if self.path.exists():
            self.path.unlink()

    def add_document(self, document: KnowledgeDocument) -> int:
        chunks = chunk_text(document)

        with self.path.open("a", encoding="utf-8") as handle:
            for chunk in chunks:
                handle.write(
                    json.dumps(chunk.to_dict(), ensure_ascii=False) + "\n"
                )

        return len(chunks)

    def add_documents(self, documents: Iterable[KnowledgeDocument]) -> int:
        total = 0
        for document in documents:
            total += self.add_document(document)
        return total

    def iter_chunks(self) -> Iterable[KnowledgeChunk]:
        if not self.path.exists():
            return

        with self.path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                line = line.strip()
                if not line:
                    continue

                try:
                    data = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"Invalid JSONL at line {line_number}: {exc}"
                    ) from exc

                yield KnowledgeChunk(**data)

    def count(self) -> int:
        return sum(1 for _ in self.iter_chunks())

    def get_document_ids(self) -> set[str]:
        return {chunk.document_id for chunk in self.iter_chunks()}

    def get_chunk(self, chunk_id: str) -> Optional[KnowledgeChunk]:
        for chunk in self.iter_chunks():
            if chunk.chunk_id == chunk_id:
                return chunk
        return None
