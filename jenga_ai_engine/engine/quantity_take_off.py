from typing import Dict, List, Any


class QuantityTakeoffError(ValueError):
    """Raised when quantity take-off inputs are invalid."""
    pass


class QuantityTakeoffEngine:
    """
    Calculates construction quantities from defined formulas.

    The engine currently supports the quantity formulas required
    by the JENGA AI construction methodology.
    """

    def __init__(self):
        self.supported_formulas = {
            "linear_volume": self._calculate_linear_volume,
        }

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

        length = inputs["foundation_length_m"]
        width = inputs["trench_width_m"]
        depth = inputs["excavation_depth_m"]

        return length * width * depth

    def _validate_inputs(
        self,
        inputs: Dict[str, float],
        required_inputs: List[str],
    ) -> None:
        """
        Validate that all required inputs exist and are positive.
        """

        if not isinstance(inputs, dict):
            raise TypeError("inputs must be a dictionary.")

        for field in required_inputs:
            if field not in inputs:
                raise QuantityTakeoffError(
                    f"Missing required input: {field}"
                )

            value = inputs[field]

            if not isinstance(value, (int, float)):
                raise QuantityTakeoffError(
                    f"{field} must be numeric."
                )

            if value <= 0:
                raise QuantityTakeoffError(
                    f"{field} must be greater than zero."
                )

    def calculate(
        self,
        formula_type: str,
        inputs: Dict[str, float],
    ) -> float:
        """
        Calculate a quantity using a supported formula.
        """

        if formula_type not in self.supported_formulas:
            raise QuantityTakeoffError(
                f"Unsupported formula type: {formula_type}"
            )

        calculator = self.supported_formulas[formula_type]

        return calculator(inputs)

    def calculate_work_item(
        self,
        work_item_code: str,
        inputs: Dict[str, float],
        methodology: Any,
    ) -> List[Dict[str, Any]]:
        """
        Calculate all quantity outputs defined for a work item.

        This method connects the Quantity Take-Off Engine
        to ConstructionMethodology.
        """

        work_item = methodology.get_work_item(work_item_code)

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

            formula = output.quantity_formula

            if (
                "foundation_length_m" in formula
                and "trench_width_m" in formula
                and "excavation_depth_m" in formula
            ):
                quantity = self._calculate_linear_volume(inputs)

            else:
                raise QuantityTakeoffError(
                    f"Unsupported quantity formula: {formula}"
                )

            results.append(
                {
                    "work_item_code": work_item.code,
                    "work_item_name": work_item.name,
                    "quantity_name": output.name,
                    "quantity": quantity,
                    "unit": output.unit,
                    "formula": output.quantity_formula,
                    "notes": output.notes,
                }
            )

        return results