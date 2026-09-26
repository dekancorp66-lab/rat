
from typing import Dict, Any, List

from engine.construction_cost_pipeline import (
    ConstructionCostPipeline,
)


class ProjectCostEstimator:
    """
    Estimates a complete construction project by processing
    multiple construction work items.
    """

    def __init__(
        self,
        pipeline: ConstructionCostPipeline | None = None,
    ):
        self.pipeline = (
            pipeline
            if pipeline is not None
            else ConstructionCostPipeline()
        )

    def estimate_project(
        self,
        project_data: Dict[str, Any],
    ) -> Dict[str, Any]:

        self._validate_project_data(project_data)

        project_name = project_data.get(
            "project_name",
            "Unnamed Project",
        )

        region = project_data["region"]

        work_items = project_data["work_items"]

        work_item_results: List[Dict[str, Any]] = []

        total_material_cost_tsh = 0.0

        for work_item in work_items:

            result = self.pipeline.estimate_work_item(
                work_item_code=work_item["code"],
                project_inputs=work_item["inputs"],
                region=region,
            )

            work_item_results.append(result)

            total_material_cost_tsh += (
                result["material_cost"][
                    "total_material_cost_tsh"
                ]
            )

        return {
            "project_name": project_name,
            "region": region,
            "work_items": work_item_results,
            "summary": {
                "number_of_work_items": len(
                    work_item_results
                ),
                "total_material_cost_tsh": (
                    total_material_cost_tsh
                ),
            },
        }

    def _validate_project_data(
        self,
        project_data: Dict[str, Any],
    ) -> None:

        if not isinstance(project_data, dict):
            raise TypeError(
                "project_data must be a dictionary."
            )

        if not project_data.get("region"):
            raise ValueError(
                "Project region is required."
            )

        if "work_items" not in project_data:
            raise ValueError(
                "Project work_items are required."
            )

        work_items = project_data["work_items"]

        if not isinstance(work_items, list):
            raise TypeError(
                "work_items must be a list."
            )

        if not work_items:
            raise ValueError(
                "At least one work item is required."
            )

        for index, work_item in enumerate(work_items):

            if not isinstance(work_item, dict):
                raise TypeError(
                    f"work_items[{index}] must be a dictionary."
                )

            if not work_item.get("code"):
                raise ValueError(
                    f"work_items[{index}] requires a code."
                )

            if "inputs" not in work_item:
                raise ValueError(
                    f"work_items[{index}] requires inputs."
                )

            if not isinstance(
                work_item["inputs"],
                dict,
            ):
                raise TypeError(
                    f"work_items[{index}]['inputs'] "
                    "must be a dictionary."
                )