
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class MaterialRequirement:
    """
    Defines a material required for a specific construction work item.
    """

    material: str
    unit: str
    quantity_formula: str
    required_inputs: List[str]
    source: Optional[str] = None
    notes: str = ""


@dataclass
class QuantityOutput:
    """
    Defines a measurable quantity produced by a construction work item.
    """

    name: str
    unit: str
    formula_type: str
    quantity_formula: str
    required_inputs: List[str]
    notes: str = ""


@dataclass
class WorkItem:
    """
    Represents a specific construction work item.
    """

    code: str
    name: str
    activity: str
    description: str
    materials: List[MaterialRequirement] = field(default_factory=list)
    quantity_outputs: List[QuantityOutput] = field(default_factory=list)
    required_inputs: List[str] = field(default_factory=list)
    source: Optional[str] = None


class ConstructionMethodology:
    """
    Stores and provides access to construction work methodologies.
    """

    def __init__(self):
        self.work_items: List[WorkItem] = []

    def add_work_item(self, work_item: WorkItem) -> None:
        if not isinstance(work_item, WorkItem):
            raise TypeError("work_item must be a WorkItem instance.")

        if self.get_work_item(work_item.code) is not None:
            raise ValueError(
                f"Work item code already exists: {work_item.code}"
            )

        self.work_items.append(work_item)

    def get_work_item(self, code: str) -> Optional[WorkItem]:
        for item in self.work_items:
            if item.code == code:
                return item

        return None

    def get_work_items_by_activity(
        self,
        activity: str,
    ) -> List[WorkItem]:
        if not activity:
            return []

        return [
            item
            for item in self.work_items
            if item.activity.lower() == activity.lower()
        ]

    def list_work_items(self) -> List[str]:
        return [item.code for item in self.work_items]


def build_default_methodology() -> ConstructionMethodology:
    """
    Build the default construction methodology used by JENGA AI.

    Current foundation work items:

        FND-001 -> Strip Foundation Concrete
        FND-002 -> Strip Foundation Excavation
        FND-003 -> Foundation Walling
        FND-004 -> Hardcore Filling
        FND-005 -> Sand Blinding
        FND-006 -> Damp Proof Membrane
        FND-007 -> Oversite Concrete
        FND-008 -> Ground Beam
        FND-009 -> Foundation Backfilling
    """

    methodology = ConstructionMethodology()

    # ============================================================
    # FND-001: STRIP FOUNDATION CONCRETE
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-001",
            name="Strip Foundation Concrete",
            activity="Foundation",
            description="Plain concrete used in strip foundation works.",
            required_inputs=[
                "concrete_volume_m3",
                "mix_type",
            ],
            source="NIRC",
            materials=[
                MaterialRequirement(
                    material="Cement 32.5N",
                    unit="50kg_bag",
                    quantity_formula="6.9 × concrete_volume_m3",
                    required_inputs=[
                        "concrete_volume_m3",
                        "mix_type",
                    ],
                    source="NIRC",
                    notes=(
                        "Factor applies to the documented "
                        "1:2:4 concrete methodology."
                    ),
                ),
                MaterialRequirement(
                    material="Sand",
                    unit="m3",
                    quantity_formula="0.45 × concrete_volume_m3",
                    required_inputs=[
                        "concrete_volume_m3",
                        "mix_type",
                    ],
                    source="NIRC",
                    notes=(
                        "Factor applies to the documented "
                        "1:2:4 concrete methodology."
                    ),
                ),
                MaterialRequirement(
                    material="Aggregate 20mm",
                    unit="m3",
                    quantity_formula="0.89 × concrete_volume_m3",
                    required_inputs=[
                        "concrete_volume_m3",
                        "mix_type",
                    ],
                    source="NIRC",
                    notes=(
                        "Factor applies to the documented "
                        "1:2:4 concrete methodology."
                    ),
                ),
            ],
        )
    )

    # ============================================================
    # FND-002: STRIP FOUNDATION EXCAVATION
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-002",
            name="Strip Foundation Excavation",
            activity="Foundation",
            description="Excavation of trenches for strip foundation works.",
            required_inputs=[
                "foundation_length_m",
                "trench_width_m",
                "excavation_depth_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Excavated Soil",
                    unit="m3",
                    formula_type="linear_volume",
                    quantity_formula=(
                        "foundation_length_m × "
                        "trench_width_m × "
                        "excavation_depth_m"
                    ),
                    required_inputs=[
                        "foundation_length_m",
                        "trench_width_m",
                        "excavation_depth_m",
                    ],
                    notes=(
                        "Calculated from actual trench dimensions "
                        "supplied for the project."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-003: FOUNDATION WALLING
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-003",
            name="Foundation Walling",
            activity="Foundation",
            description=(
                "Construction of foundation walls below ground level."
            ),
            required_inputs=[
                "foundation_wall_length_m",
                "wall_height_m",
                "wall_thickness_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Foundation Wall Volume",
                    unit="m3",
                    formula_type="linear_volume",
                    quantity_formula=(
                        "foundation_wall_length_m × "
                        "wall_height_m × "
                        "wall_thickness_m"
                    ),
                    required_inputs=[
                        "foundation_wall_length_m",
                        "wall_height_m",
                        "wall_thickness_m",
                    ],
                    notes=(
                        "Calculated from project-specific "
                        "foundation wall dimensions."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-004: HARDCORE FILLING
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-004",
            name="Hardcore Filling",
            activity="Foundation",
            description=(
                "Hardcore filling within the prepared foundation area."
            ),
            required_inputs=[
                "hardcore_area_m2",
                "hardcore_thickness_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Hardcore Fill",
                    unit="m3",
                    formula_type="area_volume",
                    quantity_formula=(
                        "hardcore_area_m2 × "
                        "hardcore_thickness_m"
                    ),
                    required_inputs=[
                        "hardcore_area_m2",
                        "hardcore_thickness_m",
                    ],
                    notes=(
                        "Based on the prepared area and "
                        "specified compacted thickness."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-005: SAND BLINDING
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-005",
            name="Sand Blinding",
            activity="Foundation",
            description="Sand blinding layer over prepared hardcore.",
            required_inputs=[
                "blinding_area_m2",
                "blinding_thickness_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Sand Blinding",
                    unit="m3",
                    formula_type="area_volume",
                    quantity_formula=(
                        "blinding_area_m2 × "
                        "blinding_thickness_m"
                    ),
                    required_inputs=[
                        "blinding_area_m2",
                        "blinding_thickness_m",
                    ],
                    notes=(
                        "Based on the specified blinding area "
                        "and thickness."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-006: DAMP PROOF MEMBRANE
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-006",
            name="Damp Proof Membrane",
            activity="Foundation",
            description=(
                "Damp proof membrane laid below the ground floor slab."
            ),
            required_inputs=[
                "dpm_area_m2",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="DPM Area",
                    unit="m2",
                    formula_type="direct_area",
                    quantity_formula="dpm_area_m2",
                    required_inputs=[
                        "dpm_area_m2",
                    ],
                    notes=(
                        "Area is based on the actual floor area "
                        "requiring damp proof membrane."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-007: OVERSITE CONCRETE
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-007",
            name="Oversite Concrete",
            activity="Foundation",
            description=(
                "Concrete layer forming the ground floor base."
            ),
            required_inputs=[
                "oversite_area_m2",
                "oversite_thickness_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Oversite Concrete",
                    unit="m3",
                    formula_type="area_volume",
                    quantity_formula=(
                        "oversite_area_m2 × "
                        "oversite_thickness_m"
                    ),
                    required_inputs=[
                        "oversite_area_m2",
                        "oversite_thickness_m",
                    ],
                    notes=(
                        "Volume is based on project-specific "
                        "floor area and thickness."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-008: GROUND BEAM
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-008",
            name="Ground Beam",
            activity="Foundation",
            description=(
                "Reinforced concrete ground beam at foundation level."
            ),
            required_inputs=[
                "ground_beam_length_m",
                "ground_beam_width_m",
                "ground_beam_depth_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Ground Beam Concrete",
                    unit="m3",
                    formula_type="linear_volume",
                    quantity_formula=(
                        "ground_beam_length_m × "
                        "ground_beam_width_m × "
                        "ground_beam_depth_m"
                    ),
                    required_inputs=[
                        "ground_beam_length_m",
                        "ground_beam_width_m",
                        "ground_beam_depth_m",
                    ],
                    notes=(
                        "Concrete volume is based on "
                        "specified beam dimensions."
                    ),
                )
            ],
        )
    )

    # ============================================================
    # FND-009: FOUNDATION BACKFILLING
    # ============================================================

    methodology.add_work_item(
        WorkItem(
            code="FND-009",
            name="Foundation Backfilling",
            activity="Foundation",
            description=(
                "Backfilling of approved material around foundation works."
            ),
            required_inputs=[
                "backfill_area_m2",
                "backfill_depth_m",
            ],
            quantity_outputs=[
                QuantityOutput(
                    name="Backfill Volume",
                    unit="m3",
                    formula_type="area_volume",
                    quantity_formula=(
                        "backfill_area_m2 × "
                        "backfill_depth_m"
                    ),
                    required_inputs=[
                        "backfill_area_m2",
                        "backfill_depth_m",
                    ],
                    notes=(
                        "Based on the actual backfill area "
                        "and specified depth."
                    ),
                )
            ],
        )
    )

    return methodology