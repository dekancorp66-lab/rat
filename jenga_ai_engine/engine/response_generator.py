
from typing import Optional

from engine.extractor import ConstructionInfo


def generate_followup_response(
    info: ConstructionInfo,
    question: str,
) -> str:
    """
    Generate a natural response when more information
    is needed from the user.
    """

    details = []

    if info.location:
        details.append(
            f"eneo la {info.location}"
        )

    if info.building_type:
        details.append(
            f"jengo la aina ya {info.building_type}"
        )

    if info.bedrooms is not None:
        details.append(
            f"vyumba {info.bedrooms}"
        )

    if info.floors is not None:
        details.append(
            f"floors {info.floors}"
        )

    if info.area_m2 is not None:
        details.append(
            f"ukubwa wa {info.area_m2:g} m²"
        )

    if details:
        context = ", ".join(details)

        return (
            f"Sawa, nimepata taarifa kwamba unataka kujenga "
            f"{context}. "
            f"Kabla sijaendelea, {question}"
        )

    return (
        f"Naomba taarifa zaidi kuhusu mradi wako. "
        f"{question}"
    )


def generate_ready_response(
    info: ConstructionInfo,
) -> str:
    """
    Generate a simple response when the required
    information is available and the system is ready
    for the next stage.
    """

    details = []

    if info.location:
        details.append(
            f"eneo la {info.location}"
        )

    if info.building_type:
        details.append(
            f"jengo la aina ya {info.building_type}"
        )

    if info.area_m2 is not None:
        details.append(
            f"ukubwa wa {info.area_m2:g} m²"
        )

    if info.bedrooms is not None:
        details.append(
            f"vyumba {info.bedrooms}"
        )

    if details:
        context = ", ".join(details)

        return (
            f"Sawa, nimepata taarifa muhimu za awali: "
            f"{context}. "
            "Tunaweza kuendelea na hatua inayofuata "
            "ya makadirio."
        )

    return (
        "Sawa, taarifa za msingi zimepatikana. "
        "Tunaweza kuendelea na hatua inayofuata."
    )


# ============================================================
# ESTIMATION RESPONSE
# ============================================================

def generate_estimation_response(
    estimation: Optional[dict],
) -> str:
    """
    Convert a ProjectCostEstimator result into a
    user-readable response.

    The generator only presents values supplied by the
    estimation engine. It never calculates or invents prices.
    """

    if estimation is None:
        return (
            "Taarifa za mradi zimekamilika, lakini "
            "makadirio bado hayajaanzishwa."
        )

    region = estimation.get(
        "region",
        "eneo lisilojulikana",
    )

    summary = estimation.get(
        "summary",
        {},
    )

    total_cost = summary.get(
        "total_material_cost_tsh",
        estimation.get(
            "total_material_cost_tsh",
            0,
        ),
    )

    work_items = estimation.get(
        "work_items",
        [],
    )

    lines = [
        "Sawa. Nimekamilisha makadirio ya awali "
        f"ya vifaa kwa mradi wa {region}.",
        "",
        f"Jumla ya gharama za vifaa: "
        f"TSh {total_cost:,.0f}",
    ]

    unavailable_materials = []

    for work_item in work_items:

        material_cost = (
            work_item.get(
                "material_cost",
                {},
            )
        )

        unavailable = (
            material_cost.get(
                "unavailable_items",
                [],
            )
        )

        unavailable_materials.extend(
            unavailable
        )

    if unavailable_materials:

        lines.extend([
            "",
            "Kumbuka:",
            "Baadhi ya bei hazikupatikana "
            "kwa unit inayohitajika, hivyo "
            "hazijaingizwa kwenye jumla."
        ])

        for item in unavailable_materials:

            material = item.get(
                "material",
                "Material",
            )

            unit = item.get(
                "unit",
                "",
            )

            lines.append(
                f"- {material} ({unit})"
            )

    lines.extend([
        "",
        "Haya ni makadirio ya awali ya "
        "gharama za vifaa na yanapaswa "
        "kukaguliwa pamoja na taarifa "
        "za eneo na quotations za suppliers."
    ])

    return "\n".join(lines)