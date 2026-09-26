
from dataclasses import dataclass
from typing import List

from engine.quantity_methodology import QuantityMethodology


@dataclass
class MaterialQuantity:
    """
    Represents the estimated quantity of a construction material.
    """

    material: str
    quantity: float
    unit: str
    method: str
    notes: str = ""
    source: str = ""


class MaterialEstimator:
    """
    Estimates material quantities using documented methods.
    """

    def __init__(self):
        self.methodology = QuantityMethodology()

    def estimate_concrete_124(
        self,
        concrete_volume_m3: float,
    ) -> List[MaterialQuantity]:
        """
        Estimate materials required for 1:2:4 concrete.

        Source basis:
        NIRC documented quantities per 1.0 m3.
        """

        if concrete_volume_m3 <= 0:
            raise ValueError(
                "Concrete volume must be greater than zero."
            )

        results = []
        methods = [
    (
        "Cement 32.5N",
        6.9,
        "50kg_bag",
    ),
    (
        "Sand",
        0.45,
        "m3",
    ),
    (
        "Aggregate 20mm",
        0.89,
        "m3",
    ),
]


        for material, quantity_per_m3, unit in methods:

            method = self.methodology.get_method_for_mix(
                material=material,
                mix_type="1:2:4",
            )

            if method is None:
                raise ValueError(
                    f"No documented method found for "
                    f"{material} with mix 1:2:4."
                )

            quantity = quantity_per_m3 * concrete_volume_m3

            results.append(
                MaterialQuantity(
                    material=material,
                    quantity=quantity,
                    unit=unit,
                    method=method.formula,
                    source=method.source or "",
                    notes="Concrete mix 1:2:4",
                )
            )

        return results

    def estimate(
        self,
        project_info: dict,
    ) -> List[MaterialQuantity]:
        """
        General entry point for material estimation.

        Only supported methodologies are used.
        """

        concrete_volume = project_info.get(
            "concrete_volume_m3"
        )

        mix_type = project_info.get("mix_type")

        if concrete_volume is None:
            return []

        if mix_type == "1:2:4":
            return self.estimate_concrete_124(
                concrete_volume_m3=float(concrete_volume)
            )

        return []