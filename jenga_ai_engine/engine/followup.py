
from typing import Optional


QUESTIONS = {
    "location": (
        "Ujenzi utafanyika eneo gani, mfano Mbeya, Arusha au Dar es Salaam?"
    ),

    "building_type": (
        "Unajenga aina gani ya jengo, kwa mfano nyumba ya makazi au jengo la biashara?"
    ),

    "area_m2": (
        "Takribani nyumba hiyo ina ukubwa gani kwa square meters (m²)?"
    ),

    "finishing": (
        "Unataka finishing ya kiwango gani: basic, standard au high-end?"
    ),

    "floors": (
        "Nyumba itakuwa na floor ngapi?"
    ),

    "roof_type": (
        "Unapanga kutumia aina gani ya roof?"
    ),

    "foundation_type": (
        "Unapanga kutumia aina gani ya foundation?"
    ),

    "bedrooms": (
        "Nyumba itakuwa na vyumba vingapi?"
    ),
}


def generate_followup_question(
    missing_fields: list[str],
) -> Optional[str]:
    """
    Generate the next follow-up question.
    Only one question is returned at a time.
    """

    if not missing_fields:
        return None

    first_missing = missing_fields[0]

    return QUESTIONS.get(
        first_missing,
        "Naomba utoe taarifa zaidi kuhusu mradi wako."
    )