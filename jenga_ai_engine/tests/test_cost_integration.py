
from engine.material_estimator import MaterialEstimator
from engine.cost_engine import CostEngine
from engine.project_cost_estimator import ProjectCostEstimator
from engine.construction_cost_pipeline import ConstructionCostPipeline


def test_full_concrete_cost_calculation():
    estimator = MaterialEstimator()
    cost_engine = CostEngine()

    materials = estimator.estimate(
        {
            "concrete_volume_m3": 5,
            "mix_type": "1:2:4",
        }
    )

    result = cost_engine.calculate_materials_cost(
        materials=materials,
        region="Mbeya",
    )

    assert result["region"] == "Mbeya"
    assert len(result["items"]) == 3
    assert result["total_material_cost_tsh"] > 0


def test_current_price_is_used_in_cost_engine():
    cost_engine = CostEngine()

    result = cost_engine.calculate_material_cost(
        material="Cement 32.5N",
        quantity=10,
        unit="50kg_bag",
        region="Mwanza",
    )

    assert result["price_type"] == "CURRENT"
    assert result["source"] is not None
    assert result["date_collected"] is not None


def test_current_price_flows_through_construction_pipeline():
    pipeline = ConstructionCostPipeline()

    result = pipeline.estimate_work_item(
        work_item_code="FND-001",
        project_inputs={
            "concrete_volume_m3": 5,
            "mix_type": "1:2:4",
        },
        region="Mwanza",
    )

    assert len(result["material_quantities"]) == 3

    cement = next(
        item
        for item in result["material_cost"]["items"]
        if item["material"] == "Cement 32.5N"
    )

    assert cement["price_type"] == "CURRENT"
    assert cement["unit_price_tsh"] > 0
    assert cement["source"] is not None


def test_current_price_flows_through_project_estimator():
    estimator = ProjectCostEstimator()

    project = {
        "project_name": "Current Price Test",
        "region": "Mwanza",
        "work_items": [
            {
                "code": "FND-001",
                "inputs": {
                    "concrete_volume_m3": 5,
                    "mix_type": "1:2:4",
                },
            }
        ],
    }

    result = estimator.estimate_project(project)

    assert result["project_name"] == "Current Price Test"
    assert result["region"] == "Mwanza"
    assert result["summary"]["number_of_work_items"] == 1
    assert result["summary"]["total_material_cost_tsh"] > 0

    cost_items = (
        result["work_items"][0]
        ["material_cost"]["items"]
    )

    assert len(cost_items) == 3

    current_items = [
        item
        for item in cost_items
        if item["price_type"] == "CURRENT"
    ]

    assert len(current_items) >= 1


def test_historical_fallback_still_works():
    estimator = ProjectCostEstimator()

    project = {
        "project_name": "Historical Fallback Test",
        "region": "Mbeya",
        "work_items": [
            {
                "code": "FND-001",
                "inputs": {
                    "concrete_volume_m3": 5,
                    "mix_type": "1:2:4",
                },
            }
        ],
    }

    result = estimator.estimate_project(project)

    assert result["summary"]["total_material_cost_tsh"] > 0

    cost_items = (
        result["work_items"][0]
        ["material_cost"]["items"]
    )

    cement = next(
        item
        for item in cost_items
        if item["material"] == "Cement 32.5N"
    )

    assert cement["price_type"] == "HISTORICAL"
    assert cement["source_date"] is not None