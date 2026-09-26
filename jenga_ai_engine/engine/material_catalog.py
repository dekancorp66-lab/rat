from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass(frozen=True)
class MaterialDefinition:
    """
    Canonical definition of a construction material.
    """

    code: str
    name: str
    category: str
    aliases: List[str]
    compatible_units: List[str]


class MaterialCatalog:
    """
    Resolves different material names to canonical
    JENGA AI material definitions.
    """

    def __init__(self):
        self.materials: Dict[str, MaterialDefinition] = {}

        self._register_default_materials()

    def add_material(
        self,
        material: MaterialDefinition,
    ) -> None:

        if material.code in self.materials:
            raise ValueError(
                f"Material code already exists: {material.code}"
            )

        self.materials[material.code] = material

    def get_material(
        self,
        code: str,
    ) -> Optional[MaterialDefinition]:

        return self.materials.get(code)

    def resolve(
        self,
        name: str,
    ) -> Optional[MaterialDefinition]:
        """
        Resolve a material name or alias to its
        canonical definition.
        """

        if not name or not name.strip():
            return None

        query = name.strip().lower()

        for material in self.materials.values():

            if material.name.lower() == query:
                return material

            for alias in material.aliases:
                if alias.lower() == query:
                    return material

        return None

    def list_materials(self) -> List[str]:
        return [
            material.name
            for material in self.materials.values()
        ]

    def _register_default_materials(self) -> None:

        self.add_material(
            MaterialDefinition(
                code="CEM-325",
                name="Cement 32.5N",
                category="cement",
                aliases=[
                    "OPC 32.5N Cement",
                    "OPC 32.5N",
                    "32.5N Cement",
                    "Cement 32.5N 50kg",
                ],
                compatible_units=[
                    "50kg_bag",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="CEM-425",
                name="Cement 42.5N",
                category="cement",
                aliases=[
                    "OPC 42.5N Cement",
                    "OPC 42.5N",
                    "42.5N Cement",
                    "Cement 42.5N 50kg",
                ],
                compatible_units=[
                    "50kg_bag",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="SND-RIV",
                name="River Sand",
                category="sand",
                aliases=[
                    "River sand",
                    "Coarse river sand",
                ],
                compatible_units=[
                    "m3",
                    "tonne",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="AGG-20",
                name="Aggregate 20mm",
                category="aggregate",
                aliases=[
                    "Ballast 20 mm",
                    "20mm Ballast",
                    "20 mm crushed stone",
                    "Aggregate 20 mm",
                ],
                compatible_units=[
                    "m3",
                    "tonne",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="HRD-001",
                name="Hardcore",
                category="aggregate",
                aliases=[
                    "Hardcore filling",
                    "Hardcore 200mm",
                    "200 mm rubble",
                ],
                compatible_units=[
                    "m3",
                    "tonne",
                    "trip",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="ST-Y08",
                name="Y8 Deformed Rebar",
                category="steel",
                aliases=[
                    "Y8",
                    "Y8 Rebar",
                    "Y8 Deformed Rebar (12 m)",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="ST-Y10",
                name="Y10 Deformed Rebar",
                category="steel",
                aliases=[
                    "Y10",
                    "Y10 Rebar",
                    "Y10 Deformed Rebar (12 m)",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="ST-Y12",
                name="Y12 Deformed Rebar",
                category="steel",
                aliases=[
                    "Y12",
                    "Y12 Rebar",
                    "Y12 Deformed Rebar (12 m)",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="ST-Y16",
                name="Y16 Deformed Rebar",
                category="steel",
                aliases=[
                    "Y16",
                    "Y16 Rebar",
                    "Y16 Deformed Rebar (12 m)",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="ST-Y20",
                name="Y20 Deformed Rebar",
                category="steel",
                aliases=[
                    "Y20",
                    "Y20 Rebar",
                    "Y20 Deformed Rebar (12 m)",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="BLK-150",
                name="Hollow Block 6 inch",
                category="masonry",
                aliases=[
                    "6 inch block",
                    "6 inch hollow block",
                    "150 mm hollow block",
                    "Hollow Block 6 inch",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="BLK-225",
                name="Hollow Block 9 inch",
                category="masonry",
                aliases=[
                    "9 inch block",
                    "9 inch hollow block",
                    "225 mm hollow block",
                    "Hollow Block 9 inch",
                ],
                compatible_units=[
                    "piece",
                ],
            )
        )

        self.add_material(
            MaterialDefinition(
                code="DPM-001",
                name="Damp Proof Membrane",
                category="damp_proofing",
                aliases=[
                    "DPM",
                    "Damp proof membrane",
                    "Damp-proof membrane",
                ],
                compatible_units=[
                    "m2",
                ],
            )
        )