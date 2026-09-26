from typing import Any, Optional

from engine.orchestrator import JengaAIOrchestrator


class JengaAIService:
    """
    Public service interface for JENGA AI.

    This class is the bridge between the JENGA AI engine
    and external applications such as FastAPI.
    """

    def __init__(
        self,
        orchestrator: Optional[JengaAIOrchestrator] = None,
    ):
        self.orchestrator = (
            orchestrator or JengaAIOrchestrator()
        )

    def process_message(
        self,
        user_message: str,
        project_data: Optional[dict[str, Any]] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        if not user_message or not user_message.strip():
            raise ValueError("user_message cannot be empty.")

        if history is not None:
            self._load_history(history)

        return self.orchestrator.process_message(
            user_message=user_message,
            project_data=project_data,
        )

    def _load_history(
        self,
        history: list[dict[str, str]],
    ) -> None:
        cleaned_history: list[dict[str, str]] = []

        for item in history:
            if not isinstance(item, dict):
                continue

            role = str(item.get("role", "")).strip()
            content = str(item.get("content", "")).strip()

            if not content:
                continue

            if role == "assistant":
                role = "model"

            if role not in {"user", "model"}:
                continue

            cleaned_history.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        self.orchestrator.load_history(cleaned_history)

