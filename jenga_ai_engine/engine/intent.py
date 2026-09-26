from typing import Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from config import GEMINI_API_KEY, GEMINI_MODEL


IntentType = Literal[
    "GENERAL_CONSTRUCTION",
    "COST_ESTIMATION",
    "MATERIAL_ESTIMATION",
    "MATERIAL_PRICE",
    "CONSTRUCTION_PLANNING",
    "CONSTRUCTION_TIMELINE",
    "SOIL_QUESTION",
    "REGULATION_QUESTION",
    "ENGINEERING_QUESTION",
    "UNKNOWN",
]


class IntentResult(BaseModel):
    intent: IntentType = Field(
        description="Primary construction-related intent."
    )

    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=15000),
)


INTENT_INSTRUCTIONS = """
You are the intent detection component of JENGA AI.

Your ONLY job is to identify the primary intent of the user's current
message.

Allowed intents:

- GENERAL_CONSTRUCTION
- COST_ESTIMATION
- MATERIAL_ESTIMATION
- MATERIAL_PRICE
- CONSTRUCTION_PLANNING
- CONSTRUCTION_TIMELINE
- SOIL_QUESTION
- REGULATION_QUESTION
- ENGINEERING_QUESTION
- UNKNOWN

Rules:

1. Do not invent information.
2. If the intent is unclear, use UNKNOWN.
3. Return a confidence value between 0.0 and 1.0.
4. Return only structured output.
5. Focus only on the current user message.
6. A request for construction cost estimates uses COST_ESTIMATION.
7. A request for material prices uses MATERIAL_PRICE.
8. A request for quantities/material requirements uses MATERIAL_ESTIMATION.
"""


def detect_intent(user_message: str) -> IntentResult:
    if not user_message or not user_message.strip():
        raise ValueError("user_message cannot be empty.")

    prompt = f"""
{INTENT_INSTRUCTIONS}

USER MESSAGE:
{user_message}
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IntentResult,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
            tools=None,
        ),
    )

    parsed = getattr(response, "parsed", None)

    if parsed is not None:
        if isinstance(parsed, IntentResult):
            return parsed
        return IntentResult.model_validate(parsed)

    response_text = getattr(response, "text", None)

    if not response_text:
        raise ValueError("Gemini returned an empty intent response.")

    return IntentResult.model_validate_json(response_text)
