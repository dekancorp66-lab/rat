
from typing import Dict, Any

from engine.construction_methodology import (
    ConstructionMethodology,
    build_default_methodology,
)
from engine.quantity_takeoff import QuantityTakeoffEngine
from engine.material_estimator import MaterialEstimator
from engine.cost_engine import CostEngine


class ConstructionCostPipeline:
    """
    Coordinates construction methodology, quantity take-off,
    material estimation, and cost calculation.
    """

    def __init__(
        self,
        methodology: ConstructionMethodology | None = None,
        quantity_engine: QuantityTakeoffEngine | None = None,
        material_estimator: MaterialEstimator | None = None,
        cost_engine: CostEngine | None = None,
    ):
        self.methodology = (
            methodology
            if methodology is not None
            else build_default_methodology()
        )

        self.quantity_engine = (
            quantity_engine
            if quantity_engine is not None
            else QuantityTakeoffEngine()
        )

        self.material_estimator = (
            material_estimator
            if material_estimator is not None
            else MaterialEstimator()
        )

        self.cost_engine = (
            cost_engine
            if cost_engine is not None
            else CostEngine()
        )

    def estimate_work_item(
        self,
        work_item_code: str,
        project_inputs: Dict[str, Any],
        region: str,
    ) -> Dict[str, Any]:

        if not isinstance(project_inputs, dict):
            raise TypeError(
                "project_inputs must be a dictionary."
            )

        if not region or not region.strip():
            raise ValueError("region is required.")

        work_item = self.methodology.get_work_item(
            work_item_code
        )

        if work_item is None:
            raise ValueError(
                f"Work item not found: {work_item_code}"
            )

        quantity_results = []

        if work_item.quantity_outputs:
            quantity_results = (
                self.quantity_engine.calculate_work_item(
                    work_item_code=work_item_code,
                    inputs=project_inputs,
                    methodology=self.methodology,
                )
            )

        material_results = []

        material_cost_result = {
            "region": region,
            "items": [],
            "total_material_cost_tsh": 0,
        }

        if work_item.materials:

            material_results = (
                self.material_estimator.estimate(
                    project_inputs
                )
            )

            if material_results:
                material_cost_result = (
                    self.cost_engine.calculate_materials_cost(
                        materials=material_results,
                        region=region,
                    )
                )

        return {
            "work_item_code": work_item.code,
            "work_item_name": work_item.name,
            "activity": work_item.activity,
            "quantity_results": quantity_results,
            "material_quantities": [
                {
                    "material": item.material,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "method": item.method,
                    "source": item.source,
                    "notes": item.notes,
                }
                for item in material_results
            ],
            "material_cost": material_cost_result,
        }