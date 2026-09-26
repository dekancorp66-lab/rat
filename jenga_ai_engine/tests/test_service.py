from engine.service import JengaAIService


def test_service_initializes():
    service = JengaAIService()

    assert service is not None
    assert service.orchestrator is not None


def test_service_rejects_empty_message():
    service = JengaAIService()

    try:
        service.process_message("")
    except ValueError as exc:
        assert "user_message cannot be empty" in str(exc)
    else:
        raise AssertionError("Expected ValueError")


def test_service_loads_history():
    service = JengaAIService()

    history = [
        {
            "role": "user",
            "content": "Nataka kujenga nyumba Mwanza",
        },
        {
            "role": "assistant",
            "content": "Sawa, nimekupata.",
        },
    ]

    service._load_history(history)

    assert len(service.orchestrator._conversation_history) == 2
    assert (
        service.orchestrator._conversation_history[1]["role"]
        == "model"
    )


def test_service_ignores_invalid_history_items():
    service = JengaAIService()

    history = [
        {"role": "user", "content": "Habari"},
        {"role": "invalid", "content": "test"},
        {"role": "assistant", "content": ""},
        "invalid item",
        {"role": "model", "content": "Karibu"},
    ]

    service._load_history(history)

    assert len(service.orchestrator._conversation_history) == 2

    assert service.orchestrator._conversation_history[0] == {
        "role": "user",
        "content": "Habari",
    }

    assert service.orchestrator._conversation_history[1] == {
        "role": "model",
        "content": "Karibu",
    }