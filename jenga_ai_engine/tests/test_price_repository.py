
from engine.price_repository import PriceRepository


def test_repository_initializes():
    repository = PriceRepository()

    assert repository is not None


def test_get_existing_historical_material_price():
    repository = PriceRepository(
        current_price_file="data/cost/does_not_exist.csv"
    )

    result = repository.get_material_price(
        material="Cement 32.5N",
        region="Mbeya",
        unit="50kg_bag",
    )

    assert result is not None
    assert result["material"] == "Cement 32.5N"
    assert result["region"] == "Mbeya"
    assert result["price_type"] == "HISTORICAL"


def test_get_current_material_price():
    repository = PriceRepository()

    result = repository.get_current_material_price(
        material="OPC 32.5N Cement",
        region="Mwanza",
        unit="50kg_bag",
    )

    assert result is not None
    assert result["region"] == "Mwanza"
    assert result["price_type"] == "CURRENT"
    assert result["price_tsh"] > 0


def test_current_price_has_provenance():
    repository = PriceRepository()

    result = repository.get_current_material_price(
        material="OPC 32.5N Cement",
        region="Mwanza",
        unit="50kg_bag",
    )

    assert result["source"] is not None
    assert result["date_collected"] is not None
    assert result["confidence"] is not None


def test_region_filter():
    repository = PriceRepository()

    data = repository.get_materials_by_region(
        "Mwanza"
    )

    assert not data.empty
    assert all(
        data["region"].str.lower() == "mwanza"
    )


def test_available_materials():
    repository = PriceRepository()

    materials = repository.get_available_materials(
        "Mwanza"
    )

    assert len(materials) > 0
    assert "OPC 32.5N Cement" in materials


def test_unknown_material_returns_none():
    repository = PriceRepository()

    result = repository.get_material_price(
        material="Material That Does Not Exist",
        region="Mwanza",
    )

    assert result is None


def test_current_price_has_priority_over_historical():
    repository = PriceRepository()

    result = repository.get_material_price(
        material="OPC 32.5N Cement",
        region="Mwanza",
        unit="50kg_bag",
    )

    assert result is not None
    assert result["price_type"] == "CURRENT"