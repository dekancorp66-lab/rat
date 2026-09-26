# JENGA AI Knowledge Base

This module is the first RAG/knowledge-layer foundation.

## Design

```text
Trusted source
   |
   v
document_loader
   |
   v
KnowledgeDocument
   |
   v
chunk_text
   |
   v
KnowledgeChunk
   |
   v
KnowledgeStore (JSONL)
   |
   v
KnowledgeRetriever
   |
   v
ranked source-backed context
```

The initial retriever is deliberately lexical and explainable. It does not
silently generate facts and does not require a vector database.

## Metadata

Each chunk keeps:

- title
- source
- category
- date
- location
- document type
- document id
- chunk id

## Supported initial ingestion

`.txt`, `.md`, `.csv`, and `.json`.

PDF/DOCX extraction should happen in a separate preprocessing step so source
provenance can be preserved explicitly.

## Planned next stage

After the source corpus and retrieval tests are stable, an embedding/vector
retriever can be introduced behind the same `KnowledgeRetriever.search()`
interface.
