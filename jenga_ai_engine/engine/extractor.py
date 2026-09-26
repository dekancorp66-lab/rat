from typing import Optional

from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL


class ConstructionInfo(BaseModel):
    location: Optional[str] = Field(
        default=None,
        description="City, region, or location where the construction will take place.",
    )

    building_type: Optional[str] = Field(
        default=None,
        description="Type of building, for example residential, commercial, school, or other.",
    )

    bedrooms: Optional[int] = Field(
        default=None,
        description="Number of bedrooms if mentioned.",
    )

    floors: Optional[int] = Field(
        default=None,
        description="Number of floors if mentioned.",
    )

    area_m2: Optional[float] = Field(
        default=None,
        description="Building floor area in square meters if mentioned.",
    )

    budget_tsh: Optional[float] = Field(
        default=None,
        description="Construction budget in Tanzanian Shillings if mentioned.",
    )

    finishing: Optional[str] = Field(
        default=None,
        description="Finishing level if mentioned, such as basic, standard, or high.",
    )

    foundation_type: Optional[str] = Field(
        default=None,
        description="Foundation type if mentioned.",
    )

    roof_type: Optional[str] = Field(
        default=None,
        description="Roof type if mentioned.",
    )


client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=15000),
)


EXTRACTION_INSTRUCTIONS = """
You are the information extraction component of JENGA AI.

JENGA AI is a Tanzania-focused construction assistant.

Extract only information that is explicitly stated or clearly expressed
in the user's message.

Available fields:

- location
- building_type
- bedrooms
- floors
- area_m2
- budget_tsh
- finishing
- foundation_type
- roof_type

Important rules:

1. Do not invent missing information.
2. If a field is not provided, return null.
3. Convert area to square meters when the value is clearly given.
4. Convert Tanzanian budget expressions into TSh numbers when possible.
   Example: "milioni 80" = 80000000.
5. Preserve the meaning of the user's information.
6. Extract information only. Do not answer the user's question.
"""


def extract_construction_info(user_message: str) -> ConstructionInfo:
    if not user_message or not user_message.strip():
        raise ValueError("user_message cannot be empty.")

    prompt = f"""
{EXTRACTION_INSTRUCTIONS}

USER MESSAGE:
{user_message}
"""

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ConstructionInfo,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
            tools=None,
        ),
    )

    parsed = getattr(response, "parsed", None)

    if parsed is not None:
        if isinstance(parsed, ConstructionInfo):
            return parsed
        return ConstructionInfo.model_validate(parsed)

    response_text = getattr(response, "text", None)

    if not response_text:
        raise ValueError("Gemini returned an empty extraction response.")

    return ConstructionInfo.model_validate_json(response_text)
