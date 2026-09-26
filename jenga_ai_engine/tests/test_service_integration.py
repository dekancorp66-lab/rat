from engine.service import JengaAIService


def test_service_accepts_external_history():
    service = JengaAIService()

    history = [
        {
            "role": "user",
            "content": "Nataka kujenga nyumba Mwanza",
        },
        {
            "role": "assistant",
            "content": "Sawa, nimeelewa.",
        },
    ]

    service.orchestrator.load_history(history)

    assert len(
        service.orchestrator._conversation_history
    ) == 2

    assert (
        service.orchestrator._conversation_history[0]["role"]
        == "user"
    )

    assert (
        service.orchestrator._conversation_history[1]["role"]
        == "assistant"
        or
        service.orchestrator._conversation_history[1]["role"]
        == "model"
    )


def test_service_history_is_trimmed_to_latest_40():
    service = JengaAIService()

    history = [
        {
            "role": "user",
            "content": f"message {i}",
        }
        for i in range(50)
    ]

    service._load_history(history)

    assert len(
        service.orchestrator._conversation_history
    ) == 40

    assert (
        service.orchestrator._conversation_history[0]["content"]
        == "message 10"
    )