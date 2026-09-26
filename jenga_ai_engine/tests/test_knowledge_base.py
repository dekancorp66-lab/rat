from engine.knowledge import (
    KnowledgeStore,
    KnowledgeRetriever,
    load_document,
)


def test_document_can_be_loaded_and_indexed(tmp_path):
    source = tmp_path / "foundation.txt"
    source.write_text(
        "Foundation design depends on soil conditions and building loads.",
        encoding="utf-8",
    )

    document = load_document(
        source,
        title="Foundation Guidance",
        source="Test Source",
        category="construction_methods",
        location="Tanzania",
    )

    store = KnowledgeStore(tmp_path / "knowledge.jsonl")
    count = store.add_document(document)

    assert count >= 1
    assert store.count() == count


def test_retriever_returns_matching_source(tmp_path):
    source = tmp_path / "soil.txt"
    source.write_text(
        "Soil conditions should be considered when selecting a foundation.",
        encoding="utf-8",
    )

    document = load_document(
        source,
        title="Soil and Foundation",
        source="Test Source",
        category="soil",
        location="Mbeya",
    )

    store = KnowledgeStore(tmp_path / "knowledge.jsonl")
    store.add_document(document)

    retriever = KnowledgeRetriever(store)
    results = retriever.search("soil conditions foundation", top_k=3)

    assert results
    assert results[0].chunk.source == "Test Source"
    assert results[0].chunk.location == "Mbeya"


def test_unknown_query_returns_no_match(tmp_path):
    source = tmp_path / "doc.txt"
    source.write_text(
        "Foundation and soil information.",
        encoding="utf-8",
    )

    document = load_document(source, source="Test Source")
    store = KnowledgeStore(tmp_path / "knowledge.jsonl")
    store.add_document(document)

    retriever = KnowledgeRetriever(store)
    results = retriever.search("banana cultivation", top_k=3)

    assert results == []
