
from typing import Any

from engine.conversation_state import ConversationState


# -------------------------------------------------------------
# Fields that are genuinely required for an initial estimate.
# -------------------------------------------------------------

REQUIRED_COST_FIELDS = [
    "location",
    "building_type",
    "area_m2",
]


# -------------------------------------------------------------
# Important information.
#
# Order matters because the first missing field can become
# the next conversational question.
# -------------------------------------------------------------

IMPORTANT_COST_FIELDS = [
    "finishing",
    "floors",
    "bedrooms",
    "roof_type",
    "budget_tsh",
    "foundation_type",
]


# -------------------------------------------------------------
# Foundation is intentionally non-blocking.
#
# It can depend on:
# - soil/site information
# - structural design
# - engineering assessment
# -------------------------------------------------------------

NON_BLOCKING_FIELDS = {
    "foundation_type",
}


def validate_cost_estimation(
    info: ConversationState,
) -> dict[str, Any]:
    """
    Validate construction information for initial cost estimation.

    Required fields:
        location
        building_type
        area_m2

    Important fields:
        finishing
        floors
        bedrooms
        roof_type
        budget_tsh
        foundation_type

    Foundation is non-blocking.
    """

    # ---------------------------------------------------------
    # 1. Find missing required fields
    # ---------------------------------------------------------

    missing_required = []

    for field_name in REQUIRED_COST_FIELDS:

        value = getattr(
            info,
            field_name,
            None,
        )

        if value is None:
            missing_required.append(
                field_name
            )
            continue

        if isinstance(value, str) and not value.strip():
            missing_required.append(
                field_name
            )

    # ---------------------------------------------------------
    # 2. Find missing important fields
    # ---------------------------------------------------------

    missing_important = []

    for field_name in IMPORTANT_COST_FIELDS:

        value = getattr(
            info,
            field_name,
            None,
        )

        if value is None:
            missing_important.append(
                field_name
            )
            continue

        if isinstance(value, str) and not value.strip():
            missing_important.append(
                field_name
            )

    # ---------------------------------------------------------
    # 3. REQUIRED fields missing
    # ---------------------------------------------------------

    if missing_required:

        return {
            "can_estimate": False,
            "needs_followup": True,

            "next_question_field": (
                missing_required[0]
            ),

            "missing_required": (
                missing_required
            ),

            "missing_important": (
                missing_important
            ),

            "missing_required_fields": (
                missing_required
            ),

            "missing_important_fields": (
                missing_important
            ),

            "validation_status": (
                "MISSING_REQUIRED_INFORMATION"
            ),
        }

    # ---------------------------------------------------------
    # 4. Important fields missing
    #
    # Remove non-blocking fields from the set used to decide
    # whether we actually need another question.
    # ---------------------------------------------------------

    blocking_important = [
        field_name
        for field_name in missing_important
        if field_name not in NON_BLOCKING_FIELDS
    ]

    # ---------------------------------------------------------
    # 5. Required fields are complete and there are still
    #    useful missing important fields.
    # ---------------------------------------------------------

    if blocking_important:

        return {
            "can_estimate": True,

            "needs_followup": True,

            "next_question_field": (
                blocking_important[0]
            ),

            "missing_required": [],

            "missing_important": (
                missing_important
            ),

            "missing_required_fields": [],

            "missing_important_fields": (
                missing_important
            ),

            "validation_status": (
                "READY_BUT_IMPORTANT_INFORMATION_MISSING"
            ),
        }

    # ---------------------------------------------------------
    # 6. Only non-blocking fields are missing.
    #
    # Example:
    # foundation_type = None
    #
    # The estimate can proceed.
    # ---------------------------------------------------------

    return {
        "can_estimate": True,

        "needs_followup": False,

        "next_question_field": None,

        "missing_required": [],

        "missing_important": (
            missing_important
        ),

        "missing_required_fields": [],

        "missing_important_fields": (
            missing_important
        ),

        "validation_status": (
            "READY_FOR_INITIAL_ESTIMATE"
        ),
    }