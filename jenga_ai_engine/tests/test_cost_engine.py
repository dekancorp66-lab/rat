
from engine.cost_engine import CostEngine
from engine.material_estimator import MaterialQuantity


def test_single_material_cost():
    engine = CostEngine()

    result = engine.calculate_material_cost(
        material="Cement 32.5N",
        quantity=10,
        unit="50kg_bag",
        region="Mbeya",
    )

    assert result["material"] == "Cement 32.5N"
    assert result["quantity"] == 10
    assert result["unit"] == "50kg_bag"
    assert result["region"] == "Mbeya"

    assert result["unit_price_tsh"] > 0
    assert result["subtotal_tsh"] > 0

    assert "source" in result
    assert "price_type" in result
    assert "source_date" in result


def test_current_price_provenance():
    engine = CostEngine()

    result = engine.calculate_material_cost(
        material="OPC 32.5N Cement",
        quantity=10,
        unit="50kg_bag",
        region="Mwanza",
    )

    assert result["price_type"] == "CURRENT"

    assert result["source"] is not None
    assert result["date_collected"] is not None
    assert result["source_date"] is not None

    assert result["confidence"] is not None
    assert result["observation_count"] is not None


def test_historical_price_provenance():
    engine = CostEngine()

    result = engine.calculate_material_cost(
        material="Cement 32.5N",
        quantity=10,
        unit="50kg_bag",
        region="Mbeya",
    )

    assert result["price_type"] == "HISTORICAL"

    assert result["source"] is not None
    assert result["source_date"] is not None

    assert result["date_collected"] is None
    assert result["confidence"] is None


def test_multiple_materials_cost():
    engine = CostEngine()

    materials = [
        {
            "material": "Cement 32.5N",
            "quantity": 10,
            "unit": "50kg_bag",
        },
        {
            "material": "Sand",
            "quantity": 2,
            "unit": "m3",
        },
    ]

    result = engine.calculate_materials_cost(
        materials=materials,
        region="Mbeya",
    )

    assert result["region"] == "Mbeya"
    assert len(result["items"]) == 2

    assert result["total_material_cost_tsh"] > 0

    for item in result["items"]:
        assert "price_type" in item
        assert "source" in item


def test_material_quantity_object_is_supported():
    engine = CostEngine()

    material = MaterialQuantity(
        material="Cement 32.5N",
        quantity=5,
        unit="50kg_bag",
        method="test methodology",
        notes="test",
        source="NIRC",
    )

    result = engine.calculate_materials_cost(
        materials=[material],
        region="Mbeya",
    )

    assert len(result["items"]) == 1
    assert result["items"][0]["quantity"] == 5


def test_unknown_material_raises_error():
    engine = CostEngine()

    try:
        engine.calculate_material_cost(
            material="Unknown Material",
            quantity=10,
            unit="bag",
            region="Mbeya",
        )

        assert False, "Expected ValueError"

    except ValueError:
        assert True


def test_invalid_quantity_raises_error():
    engine = CostEngine()

    try:
        engine.calculate_material_cost(
            material="Cement 32.5N",
            quantity=0,
            unit="50kg_bag",
            region="Mbeya",
        )

        assert False, "Expected ValueError"

    except ValueError:
        assert True


def test_negative_quantity_raises_error():
    engine = CostEngine()

    try:
        engine.calculate_material_cost(
            material="Cement 32.5N",
            quantity=-5,
            unit="50kg_bag",
            region="Mbeya",
        )

        assert False, "Expected ValueError"

    except ValueError:
        assert True


def test_empty_region_is_rejected():
    engine = CostEngine()

    try:
        engine.calculate_material_cost(
            material="Cement 32.5N",
            quantity=5,
            unit="50kg_bag",
            region="",
        )

        assert False, "Expected ValueError"

    except ValueError:
        assert True


def test_materials_must_be_list():
    engine = CostEngine()

    try:
        engine.calculate_materials_cost(
            materials={},
            region="Mbeya",
        )

        assert False, "Expected TypeError"

    except TypeError:
        assert True


def test_invalid_material_type_is_rejected():
    engine = CostEngine()

    try:
        engine.calculate_materials_cost(
            materials=["invalid material"],
            region="Mbeya",
        )

        assert False, "Expected TypeError"

    except TypeError:
        assert True


def test_missing_material_dictionary_field_is_rejected():
    engine = CostEngine()

    try:
        engine.calculate_materials_cost(
            materials=[
                {
                    "material": "Cement 32.5N",
                    "quantity": 5,
                }
            ],
            region="Mbeya",
        )

        assert False, "Expected ValueError"

    except ValueError:
        assert True