from __future__ import annotations

import math
import re
from collections import Counter
from typing import Optional

from .knowledge_store import KnowledgeStore
from .models import KnowledgeChunk, RetrievalResult


_STOPWORDS = {
    "the", "a", "an", "is", "are", "of", "to", "in", "on", "for", "and",
    "or", "what", "which", "how", "why", "can", "be", "with", "this",
    "that", "kwa", "ya", "na", "ni", "je", "wa", "wao", "hii", "huko",
    "kuna", "ni", "naweza", "nao", "mambo",
}


def _tokens(text: str) -> list[str]:
    raw = re.findall(r"[A-Za-zÀ-ÿ0-9._-]+", text.lower())
    return [token for token in raw if token not in _STOPWORDS and len(token) > 1]


class KnowledgeRetriever:
    """Explainable lexical retriever for the first JENGA RAG milestone.

    It deliberately uses deterministic token matching rather than an
    embedding/vector database. Once the corpus and evaluation set are stable,
    this layer can be replaced by embeddings without changing the store API.
    """

    def __init__(self, store: Optional[KnowledgeStore] = None):
        self.store = store or KnowledgeStore()

    @staticmethod
    def _score(query: str, chunk: KnowledgeChunk) -> float:
        q = Counter(_tokens(query))
        c = Counter(_tokens(chunk.content))

        if not q or not c:
            return 0.0

        overlap = sum(min(q[t], c[t]) for t in q if t in c)
        query_mass = sum(q.values())

        if query_mass == 0:
            return 0.0

        score = overlap / query_mass

        # Small provenance-aware boosts. They never create facts; they only
        # help rank chunks with matching metadata.
        query_lower = query.lower()
        if chunk.location and chunk.location.lower() in query_lower:
            score += 0.10

        if chunk.category and chunk.category.lower() in query_lower:
            score += 0.05

        # Penalise extremely tiny overlaps.
        if overlap == 1 and query_mass >= 5:
            score *= 0.6

        return min(score, 1.0)

    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        category: Optional[str] = None,
        location: Optional[str] = None,
        min_score: float = 0.05,
    ) -> list[RetrievalResult]:
        if not query or not query.strip():
            raise ValueError("query cannot be empty.")
        if top_k <= 0:
            raise ValueError("top_k must be greater than zero.")

        scored = []

        for chunk in self.store.iter_chunks():
            if category and chunk.category.lower() != category.lower():
                continue

            if (
                location
                and chunk.location
                and chunk.location.lower() != location.lower()
            ):
                continue

            score = self._score(query, chunk)

            if score >= min_score:
                scored.append(
                    RetrievalResult(
                        chunk=chunk,
                        score=round(score, 6),
                    )
                )

        scored.sort(
            key=lambda result: (
                result.score,
                -result.chunk.chunk_index,
            ),
            reverse=True,
        )

        return scored[:top_k]
