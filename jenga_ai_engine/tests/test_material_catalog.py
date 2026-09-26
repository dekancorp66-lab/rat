from engine.material_catalog import MaterialCatalog


def test_material_catalog_initializes():
    catalog = MaterialCatalog()

    assert catalog is not None
    assert len(catalog.list_materials()) > 0


def test_cement_alias_is_resolved():
    catalog = MaterialCatalog()

    result = catalog.resolve("OPC 32.5N Cement")

    assert result is not None
    assert result.name == "Cement 32.5N"
    assert result.code == "CEM-325"


def test_cement_325_canonical_name():
    catalog = MaterialCatalog()

    result = catalog.resolve("Cement 32.5N")

    assert result is not None
    assert result.code == "CEM-325"


def test_rebar_alias_is_resolved():
    catalog = MaterialCatalog()

    result = catalog.resolve("Y12")

    assert result is not None
    assert result.name == "Y12 Deformed Rebar"
    assert result.code == "ST-Y12"


def test_block_alias_is_resolved():
    catalog = MaterialCatalog()

    result = catalog.resolve("150 mm hollow block")

    assert result is not None
    assert result.name == "Hollow Block 6 inch"


def test_dpm_alias_is_resolved():
    catalog = MaterialCatalog()

    result = catalog.resolve("DPM")

    assert result is not None
    assert result.code == "DPM-001"


def test_unknown_material_returns_none():
    catalog = MaterialCatalog()

    result = catalog.resolve(
        "Completely Unknown Construction Material"
    )

    assert result is None


def test_material_has_compatible_units():
    catalog = MaterialCatalog()

    cement = catalog.resolve("Cement 32.5N")

    assert "50kg_bag" in cement.compatible_units


def test_catalog_material_can_be_retrieved_by_code():
    catalog = MaterialCatalog()

    material = catalog.get_material("CEM-325")

    assert material is not None
    assert material.name == "Cement 32.5N"


def test_catalog_returns_multiple_materials():
    catalog = MaterialCatalog()

    materials = catalog.list_materials()

    assert "Cement 32.5N" in materials
    assert "River Sand" in materials
    assert "Aggregate 20mm" in materials
    assert "Hardcore" in materials
    assert "Y12 Deformed Rebar" in materials