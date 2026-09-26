
from typing import Dict, List, Any


class QuantityTakeoffError(ValueError):
    """Raised when quantity take-off inputs are invalid."""
    pass


class QuantityTakeoffEngine:
    """
    Calculates construction quantities from defined formulas.
    """

    def __init__(self):
        self.supported_formulas = {
            "linear_volume": self._calculate_linear_volume,
            "area_volume": self._calculate_area_volume,
            "direct_area": self._calculate_direct_area,
        }

    def _validate_inputs(
        self,
        inputs: Dict[str, float],
        required_inputs: List[str],
    ) -> None:
        """
        Validate that all required inputs exist,
        are numeric, and are greater than zero.
        """

        if not isinstance(inputs, dict):
            raise TypeError("inputs must be a dictionary.")

        for field in required_inputs:

            if field not in inputs:
                raise QuantityTakeoffError(
                    f"Missing required input: {field}"
                )

            value = inputs[field]

            if isinstance(value, bool):
                raise QuantityTakeoffError(
                    f"{field} must be numeric."
                )

            if not isinstance(value, (int, float)):
                raise QuantityTakeoffError(
                    f"{field} must be numeric."
                )

            if value <= 0:
                raise QuantityTakeoffError(
                    f"{field} must be greater than zero."
                )

    def _calculate_linear_volume(
        self,
        inputs: Dict[str, float],
    ) -> float:
        """
        Calculate volume using:

            length × width × depth
        """

        required = [
            "foundation_length_m",
            "trench_width_m",
            "excavation_depth_m",
        ]

        self._validate_inputs(inputs, required)

        result = (
            inputs["foundation_length_m"]
            * inputs["trench_width_m"]
            * inputs["excavation_depth_m"]
        )

        return round(result, 6)

    def _calculate_area_volume(
        self,
        inputs: Dict[str, float],
        area_field: str,
        thickness_field: str,
    ) -> float:
        """
        Calculate volume using:

            area × thickness
        """

        self._validate_inputs(
            inputs,
            [
                area_field,
                thickness_field,
            ],
        )

        result = (
            inputs[area_field]
            * inputs[thickness_field]
        )

        return round(result, 6)

    def _calculate_direct_area(
        self,
        inputs: Dict[str, float],
    ) -> float:
        """
        Return an area directly supplied by the project.
        """

        self._validate_inputs(
            inputs,
            ["dpm_area_m2"],
        )

        return round(
            inputs["dpm_area_m2"],
            6,
        )

    def calculate(
        self,
        formula_type: str,
        inputs: Dict[str, float],
    ) -> float:
        """
        Calculate a quantity using a supported formula type.

        Note:
        The generic linear_volume formula is retained for
        foundation excavation. Work-item-specific linear
        formulas are handled by calculate_quantity_output().
        """

        if formula_type not in self.supported_formulas:
            raise QuantityTakeoffError(
                f"Unsupported formula type: {formula_type}"
            )

        if formula_type == "linear_volume":
            return self._calculate_linear_volume(inputs)

        if formula_type == "area_volume":
            raise QuantityTakeoffError(
                "area_volume requires specific field names. "
                "Use calculate_quantity_output()."
            )

        if formula_type == "direct_area":
            return self._calculate_direct_area(inputs)

        raise QuantityTakeoffError(
            f"Unsupported formula type: {formula_type}"
        )

    def calculate_quantity_output(
        self,
        output: Any,
        inputs: Dict[str, float],
    ) -> float:
        """
        Calculate one QuantityOutput using its formula type.
        """

        self._validate_inputs(
            inputs,
            output.required_inputs,
        )

        formula_type = output.formula_type

        # ========================================================
        # LINEAR VOLUME
        # ========================================================

        if formula_type == "linear_volume":

            # FND-002: Foundation Excavation
            if output.name == "Excavated Soil":
                return self._calculate_linear_volume(inputs)

            # FND-003: Foundation Walling
            if output.name == "Foundation Wall Volume":

                result = (
                    inputs["foundation_wall_length_m"]
                    * inputs["wall_height_m"]
                    * inputs["wall_thickness_m"]
                )

                return round(result, 6)

            # FND-008: Ground Beam
            if output.name == "Ground Beam Concrete":

                result = (
                    inputs["ground_beam_length_m"]
                    * inputs["ground_beam_width_m"]
                    * inputs["ground_beam_depth_m"]
                )

                return round(result, 6)

        # ========================================================
        # AREA × VOLUME
        # ========================================================

        elif formula_type == "area_volume":

            # FND-004: Hardcore Filling
            if output.name == "Hardcore Fill":
                return self._calculate_area_volume(
                    inputs,
                    "hardcore_area_m2",
                    "hardcore_thickness_m",
                )

            # FND-005: Sand Blinding
            if output.name == "Sand Blinding":
                return self._calculate_area_volume(
                    inputs,
                    "blinding_area_m2",
                    "blinding_thickness_m",
                )

            # FND-007: Oversite Concrete
            if output.name == "Oversite Concrete":
                return self._calculate_area_volume(
                    inputs,
                    "oversite_area_m2",
                    "oversite_thickness_m",
                )

            # FND-009: Foundation Backfilling
            if output.name == "Backfill Volume":
                return self._calculate_area_volume(
                    inputs,
                    "backfill_area_m2",
                    "backfill_depth_m",
                )

        # ========================================================
        # DIRECT AREA
        # ========================================================

        elif formula_type == "direct_area":

            # FND-006: DPM
            return self._calculate_direct_area(inputs)

        raise QuantityTakeoffError(
            f"Unsupported quantity output: {output.name}"
        )

    def calculate_work_item(
        self,
        work_item_code: str,
        inputs: Dict[str, float],
        methodology: Any,
    ) -> List[Dict[str, Any]]:
        """
        Calculate all quantity outputs defined for a work item.
        """

        work_item = methodology.get_work_item(
            work_item_code
        )

        if work_item is None:
            raise QuantityTakeoffError(
                f"Work item not found: {work_item_code}"
            )

        self._validate_inputs(
            inputs,
            work_item.required_inputs,
        )

        results = []

        for output in work_item.quantity_outputs:

            quantity = self.calculate_quantity_output(
                output=output,
                inputs=inputs,
            )

            results.append(
                {
                    "work_item_code": work_item.code,
                    "work_item_name": work_item.name,
                    "quantity_name": output.name,
                    "quantity": quantity,
                    "unit": output.unit,
                    "formula_type": output.formula_type,
                    "formula": output.quantity_formula,
                    "notes": output.notes,
                }
            )

        return results