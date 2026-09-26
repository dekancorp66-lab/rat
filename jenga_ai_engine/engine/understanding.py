
import time
from typing import Literal, Optional

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from config import GEMINI_API_KEY, GEMINI_MODEL


# ============================================================
# CONSTRUCTION INFORMATION
# ============================================================

class ConstructionInfo(BaseModel):

    location: Optional[str] = Field(
        default=None,
        description=(
            "Construction location explicitly mentioned "
            "by the user."
        ),
    )

    building_type: Optional[str] = Field(
        default=None,
        description=(
            "Building type explicitly mentioned or clearly "
            "stated, such as residential house or commercial "
            "building."
        ),
    )

    bedrooms: Optional[int] = Field(
        default=None,
        description=(
            "Number of bedrooms explicitly mentioned."
        ),
    )

    floors: Optional[int] = Field(
        default=None,
        description=(
            "Number of floors or storeys explicitly mentioned."
        ),
    )

    area_m2: Optional[float] = Field(
        default=None,
        description=(
            "Building area in square metres."
        ),
    )

    budget_tsh: Optional[float] = Field(
        default=None,
        description=(
            "Construction budget in Tanzanian shillings."
        ),
    )

    finishing: Optional[str] = Field(
        default=None,
        description=(
            "Finishing level explicitly mentioned."
        ),
    )

    foundation_type: Optional[str] = Field(
        default=None,
        description=(
            "Foundation type explicitly mentioned."
        ),
    )

    roof_type: Optional[str] = Field(
        default=None,
        description=(
            "Roof type explicitly mentioned."
        ),
    )

    material: Optional[str] = Field(
        default=None,
        description=(
            "Construction material explicitly mentioned "
            "by the user. Preserve the user's wording when "
            "possible. Do not replace a generic or ambiguous "
            "term with a specific material."
        ),
    )

    unit: Optional[str] = Field(
        default=None,
        description=(
            "Requested material unit explicitly mentioned "
            "by the user, such as 50kg_bag, piece, m3, "
            "tonne, or m2."
        ),
    )


# ============================================================
# INTENTS
# ============================================================

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


# ============================================================
# UNDERSTANDING RESULT
# ============================================================

class UnderstandingResult(BaseModel):

    intent: IntentType = Field(
        description=(
            "Primary construction-related intent."
        ),
    )

    confidence: float = Field(
        description=(
            "Confidence score between 0 and 1."
        ),
    )

    construction_info: ConstructionInfo = Field(
        description=(
            "Construction information explicitly stated "
            "in the current user message."
        ),
    )


# ============================================================
# CLIENT
# ============================================================

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY haijapatikana kwenye .env file."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=15000,
    ),
)


# ============================================================
# INSTRUCTIONS
# ============================================================

SYSTEM_INSTRUCTIONS = """
You are the understanding layer of JENGA AI.

Your ONLY job is to understand the user's current message.

Return:
1. Primary intent.
2. Confidence.
3. Construction information explicitly contained
   in the current message.

STRICT RULES:

1. Never invent information.
2. Use null when information is absent.
3. Extract ALL information present in one message.
4. Do not extract only one field when many fields exist.
5. If the user requests a cost estimate, use COST_ESTIMATION.
6. "milioni 80" means 80,000,000 TSh when it is clearly
   a construction budget.
7. "ghorofa moja" means 1 floor.
8. "vyumba 3" means 3 bedrooms in the context of a house.
9. "120 sqm" means 120 square metres.
10. "nyumba" may be interpreted as a residential house
    when the context clearly indicates that.
11. Do not invent foundation information.
12. Extract only information stated in the current message.
13. Previous conversation state is context only.
14. Do not ask questions.

15. When the user asks about a material or material price,
    extract the material name exactly as expressed by the user
    when possible.

16. Extract a requested unit only when the user explicitly
    provides one.

17. Do not convert generic terms such as "tofali", "bati",
    "chuma", or "mchanga" into a specific material unless
    the user explicitly specifies the type.

18. For ambiguous material terms, preserve the user's original
    term so that another JENGA layer can determine whether
    clarification is required.

19. Return only structured output.
"""


# ============================================================
# UNDERSTANDING
# ============================================================

def understand_message(
    user_message: str,
    previous_intent: Optional[str] = None,
    current_state: Optional[dict] = None,
) -> UnderstandingResult:

    if not user_message or not user_message.strip():
        raise ValueError(
            "user_message cannot be empty."
        )

    previous_intent = (
        previous_intent
        if previous_intent
        else "None"
    )

    if not isinstance(current_state, dict):
        current_state = {}

    prompt = f"""
{SYSTEM_INSTRUCTIONS}

Previous intent:
{previous_intent}

Current conversation state:
{current_state}

Current user message:
{user_message}
"""

    # ---------------------------------------------------------
    # Measure actual API latency
    # ---------------------------------------------------------

    start_time = time.perf_counter()

    try:

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=UnderstandingResult,

                # Keep response very small.
                max_output_tokens=250,

                # Explicitly disable AFC.
                automatic_function_calling=(
                    types.AutomaticFunctionCallingConfig(
                        disable=True
                    )
                ),

                tools=None,
            ),
        )

    except Exception as exc:

        elapsed = (
            time.perf_counter()
            - start_time
        )

        print(
            f"\n[Gemini API] FAILED after "
            f"{elapsed:.2f} seconds"
        )

        raise RuntimeError(
            f"Gemini understanding request failed: "
            f"{exc}"
        ) from exc

    elapsed = (
        time.perf_counter()
        - start_time
    )

    print(
        f"\n[Gemini API] Response time: "
        f"{elapsed:.2f} seconds"
    )

    # ---------------------------------------------------------
    # Structured parsing
    # ---------------------------------------------------------

    if getattr(
        response,
        "parsed",
        None,
    ) is not None:

        parsed = response.parsed

        if isinstance(
            parsed,
            UnderstandingResult,
        ):
            return parsed

        return UnderstandingResult.model_validate(
            parsed
        )

    # ---------------------------------------------------------
    # Text fallback
    # ---------------------------------------------------------

    response_text = getattr(
        response,
        "text",
        None,
    )

    if not response_text:
        raise ValueError(
            "Gemini returned an empty "
            "understanding response."
        )

    return UnderstandingResult.model_validate_json(
        response_text
    )