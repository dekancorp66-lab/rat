
from engine.orchestrator import JengaAIOrchestrator


def print_response(result: dict) -> None:
    """
    Print a clean JENGA AI response.
    """

    print("\nJENGA AI:")
    print(result["response"])

    if result.get("estimation") is not None:

        print("\nESTIMATION RESULT:")
        print(
            result["estimation"]
        )


def main() -> None:
    print("=" * 60)
    print("              JENGA AI ENGINE")
    print("        End-to-End Conversation Test")
    print("=" * 60)

    print(
        "\nAndika 'exit' au 'quit' kumaliza."
    )

    orchestrator = JengaAIOrchestrator()

    # ------------------------------------------------------------
    # CONVERSATION LOOP
    # ------------------------------------------------------------

    while True:

        try:
            user_message = input(
                "\nUSER: "
            ).strip()

        except (
            EOFError,
            KeyboardInterrupt,
        ):
            print(
                "\n\nJENGA AI session ended."
            )
            break

        if not user_message:
            print(
                "Naomba uandike ujumbe."
            )
            continue

        if user_message.lower() in {
            "exit",
            "quit",
        }:
            print(
                "\nJENGA AI session ended."
            )
            break

        try:

            result = (
                orchestrator.process_message(
                    user_message
                )
            )

            print_response(
                result
            )

        except Exception as exc:

            print(
                "\nJENGA AI ERROR:"
            )
            print(
                str(exc)
            )


if __name__ == "__main__":
    main()