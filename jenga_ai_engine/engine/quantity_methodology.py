
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class QuantityMethod:
    """
    Describes a documented method used to estimate
    the quantity of a construction material.
    """

    material: str
    unit: str
    required_inputs: List[str]
    formula: str
    assumptions: List[str]
    source: Optional[str] = None
    notes: str = ""


class QuantityMethodology:
    """
    Stores documented construction quantity methods.
    """

    def __init__(self):
        self.methods: List[QuantityMethod] = []

        # Register verified methodology available so far.
        self._register_default_methods()

    def _register_default_methods(self):
        """
        Register documented material quantity methods.
        """

        source = (
            "NIRC Manual for Farmers' Participatory Repair Work"
        )

        concrete_124_assumptions = [
            "Applies to concrete mix 1:2:4.",
            "Quantities are given per 1.0 m3 of concrete.",
            "This method must not be applied to other concrete mixes "
            "without a documented quantity basis.",
        ]

        self.add_method(
            QuantityMethod(
                material="Cement 32.5N",
                unit="50kg_bag",
                required_inputs=[
                    "concrete_volume_m3",
                    "mix_type",
                ],
                formula="6.9 bags per 1.0 m3 of concrete",
                assumptions=concrete_124_assumptions,
                source=source,
                notes="50 kg cement bag basis.",
            )
        )

        self.add_method(
            QuantityMethod(
                material="Sand",
                unit="m3",
                required_inputs=[
                    "concrete_volume_m3",
                    "mix_type",
                ],
                formula="0.45 m3 per 1.0 m3 of concrete",
                assumptions=concrete_124_assumptions,
                source=source,
            )
        )

        self.add_method(
            QuantityMethod(
                material="Aggregate 20mm",
                unit="m3",
                required_inputs=[
                    "concrete_volume_m3",
                    "mix_type",
                ],
                formula="0.89 m3 per 1.0 m3 of concrete",
                assumptions=concrete_124_assumptions,
                source=source,
            )
        )

    def add_method(self, method: QuantityMethod):
        """
        Add a documented quantity estimation method.
        """
        self.methods.append(method)

    def get_method(
        self,
        material: str,
    ) -> Optional[QuantityMethod]:
        """
        Find the methodology for a material.
        """

        for method in self.methods:
            if method.material.lower().strip() == material.lower().strip():
                return method

        return None

    def get_method_for_mix(
        self,
        material: str,
        mix_type: str,
    ) -> Optional[QuantityMethod]:
        """
        Return a method only when the requested mix type
        is supported by the method.
        """

        method = self.get_method(material)

        if method is None:
            return None

        if "mix_type" not in method.required_inputs:
            return method

        if mix_type.lower().strip() == "1:2:4":
            return method

        return None

    def list_materials(self) -> List[str]:
        """
        Return all materials with registered methodologies.
        """

        return [
            method.material
            for method in self.methods
        ]