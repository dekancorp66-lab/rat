from typing import Optional, Dict, Any, List

import pandas as pd

from engine.price_repository import PriceRepository


class JengaTools:
    """
    JENGA AI verified-data tools.

    Main principle:

    - Generic material request:
        Return all available products in that category.
        DO NOT guess a specific material.

    - Specific material request:
        Perform exact material lookup.

    Examples:

        "bei ya cement Mwanza"
            -> list cement products in Mwanza

        "bei ya Cement 32.5N Mwanza"
            -> exact lookup for Cement 32.5N

    The tool never invents prices.
    All numerical price information comes from PriceRepository.
    """

    # ============================================================
    # CATEGORY ALIASES
    # ============================================================

    CATEGORY_ALIASES = {
        # Cement
        "cement": "cement",
        "saruji": "cement",

        # Sand
        "sand": "sand",
        "mchanga": "sand",
        "mchanga wa mto": "sand",

        # Aggregate / ballast
        "ballast": "aggregate",
        "kokoto": "aggregate",
        "aggregate": "aggregate",

        # Hardcore
        "hardcore": "hardcore",

        # Blocks
        "block": "blocks",
        "blocks": "blocks",
        "tofali": "blocks_or_bricks",
        "matofali": "blocks_or_bricks",
    }

    def __init__(
        self,
        price_repository: Optional[PriceRepository] = None,
    ):
        self.price_repository = (
            price_repository
            or PriceRepository()
        )

    # ============================================================
    # NORMALIZE CATEGORY
    # ============================================================

    def normalize_category(
        self,
        material: str,
    ) -> Optional[str]:
        """
        Resolve a generic user material term to a category.

        Examples:
            cement -> cement
            saruji -> cement
            mchanga -> sand
            kokoto -> aggregate
        """

        if not material or not material.strip():
            return None

        cleaned = (
            material
            .strip()
            .lower()
        )

        cleaned = " ".join(
            cleaned.split()
        )

        return self.CATEGORY_ALIASES.get(
            cleaned
        )

    # ============================================================
    # CHECK WHETHER REQUEST IS GENERIC
    # ============================================================

    def is_generic_material(
        self,
        material: str,
    ) -> bool:
        """
        Determine whether the user requested a category
        rather than a specific product.

        Example:

            cement       -> True
            saruji       -> True
            Cement 32.5N -> False
            Y12          -> False
        """

        if not material or not material.strip():
            return False

        return (
            self.normalize_category(material)
            is not None
        )

    # ============================================================
    # EXACT MATERIAL SEARCH
    # ============================================================

    def get_material_price(
        self,
        material: str,
        region: str,
        unit: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Exact material lookup.

        IMPORTANT:
        This method does NOT automatically convert:

            cement -> Cement 32.5N

        Generic requests should use
        get_material_options().
        """

        if not material or not material.strip():
            return {
                "found": False,
                "request_type": "material_price",
                "error": "Material is required.",
            }

        if not region or not region.strip():
            return {
                "found": False,
                "request_type": "material_price",
                "error": "Region is required.",
            }

        # --------------------------------------------------------
        # Exact lookup.
        # PriceRepository itself may resolve registered aliases.
        # We intentionally do NOT force generic category aliases
        # here.
        # --------------------------------------------------------

        result = (
            self.price_repository
            .get_material_price(
                material=material.strip(),
                region=region.strip(),
                unit=unit,
            )
        )

        if result is not None:

            return {
                "found": True,
                "request_type": "material_price",
                "material_requested": material,
                "region_requested": region,
                "unit_requested": unit,
                "data": result,
            }

        # --------------------------------------------------------
        # No exact match
        # --------------------------------------------------------

        try:
            available_materials = (
                self.price_repository
                .get_available_materials(
                    region=region
                )
            )
        except Exception:
            available_materials = []

        return {
            "found": False,
            "request_type": "material_price",
            "material_requested": material,
            "region_requested": region,
            "unit_requested": unit,
            "available_materials": available_materials,
            "message": (
                "No exact verified JENGA material price "
                "was found for the requested material "
                "and region."
            ),
        }

    # ============================================================
    # GENERIC MATERIAL OPTIONS
    # ============================================================

    def get_material_options(
        self,
        material: str,
        region: str,
    ) -> Dict[str, Any]:
        """
        Return all verified material options belonging to
        a generic category in a specific region.

        Example:

            material = "cement"
            region = "Mwanza"

        returns all cement products found in Mwanza.
        """

        if not material or not material.strip():
            return {
                "found": False,
                "request_type": "material_options",
                "error": "Material is required.",
            }

        if not region or not region.strip():
            return {
                "found": False,
                "request_type": "material_options",
                "error": "Region is required.",
            }

        category = self.normalize_category(
            material
        )

        if category is None:
            return {
                "found": False,
                "request_type": "material_options",
                "material_requested": material,
                "region_requested": region,
                "message": (
                    "The requested material is not "
                    "recognized as a generic category."
                ),
            }

        # --------------------------------------------------------
        # Get current regional dataset
        # --------------------------------------------------------

        data = getattr(
            self.price_repository,
            "current_data",
            None,
        )

        if data is None or data.empty:
            return {
                "found": False,
                "request_type": "material_options",
                "material_requested": material,
                "category": category,
                "region_requested": region,
                "message": (
                    "No current price data is available."
                ),
            }

        df = data.copy()

        # --------------------------------------------------------
        # Region filter
        # --------------------------------------------------------

        df["region"] = (
            df["region"]
            .astype(str)
            .str.strip()
        )

        region_clean = region.strip()

        regional = df[
            df["region"].str.lower()
            == region_clean.lower()
        ].copy()

        if regional.empty:
            return {
                "found": False,
                "request_type": "material_options",
                "material_requested": material,
                "category": category,
                "region_requested": region,
                "message": (
                    "No verified current price data "
                    "was found for this region."
                ),
            }

        # --------------------------------------------------------
        # Category matching
        # --------------------------------------------------------

        if "category" in regional.columns:

            regional["category_clean"] = (
                regional["category"]
                .astype(str)
                .str.strip()
                .str.lower()
            )

            if category == "blocks_or_bricks":

                mask = (
                    regional["category_clean"]
                    .isin(
                        {
                            "blocks",
                            "block",
                            "brick",
                            "bricks",
                            "masonry",
                    }
                    )
                    |
                    regional["material"]
                    .astype(str)
                    .str.lower()
                    .str.contains(
                        "block|brick",
                        regex=True,
                        na=False,
                    )
                )

            elif category == "aggregate":

                mask = (
                    regional["category_clean"]
                    .isin(
                        {
                            "aggregate",
                            "ballast",
                            "stone",
                            "hardcore",
                        }
                    )
                    |
                    regional["material"]
                    .astype(str)
                    .str.lower()
                    .str.contains(
                        "ballast|aggregate",
                        regex=True,
                        na=False,
                    )
                )

            else:

                mask = (
                    regional["category_clean"]
                    == category
                )

            matches = regional[
                mask
            ].copy()

        else:
            matches = pd.DataFrame()

        # --------------------------------------------------------
        # Fallback matching using material names
        # --------------------------------------------------------

        if matches.empty:

            material_text = (
                regional["material"]
                .astype(str)
                .str.lower()
            )

            if category == "cement":

                matches = regional[
                    material_text.str.contains(
                        "cement|saruji",
                        regex=True,
                        na=False,
                    )
                ].copy()

            elif category == "sand":

                matches = regional[
                    material_text.str.contains(
                        "sand|mchanga",
                        regex=True,
                        na=False,
                    )
                ].copy()

            elif category == "aggregate":

                matches = regional[
                    material_text.str.contains(
                        "ballast|aggregate|kokoto",
                        regex=True,
                        na=False,
                    )
                ].copy()

            elif category == "hardcore":

                matches = regional[
                    material_text.str.contains(
                        "hardcore",
                        regex=True,
                        na=False,
                    )
                ].copy()

            elif category == "blocks_or_bricks":

                matches = regional[
                    material_text.str.contains(
                        "block|brick",
                        regex=True,
                        na=False,
                    )
                ].copy()

        # --------------------------------------------------------
        # No options found
        # --------------------------------------------------------

        if matches.empty:
            return {
                "found": False,
                "request_type": "material_options",
                "material_requested": material,
                "category": category,
                "region_requested": region,
                "options": [],
                "message": (
                    "No verified prices were found "
                    "for this material category "
                    "in the requested region."
                ),
            }

        # --------------------------------------------------------
        # Build clean options
        # --------------------------------------------------------

        options: List[Dict[str, Any]] = []

        # Remove exact duplicates if dataset has any.
        dedupe_columns = [
            col
            for col in [
                "material",
                "specification",
                "unit",
                "region",
                "price_tsh",
            ]
            if col in matches.columns
        ]

        if dedupe_columns:
            matches = (
                matches
                .drop_duplicates(
                    subset=dedupe_columns
                )
            )

        # Sort alphabetically by material
        matches = matches.sort_values(
            by=["material"],
            kind="stable",
        )

        for _, row in matches.iterrows():

            options.append(
                {
                    "material": row.get(
                        "material"
                    ),
                    "category": row.get(
                        "category"
                    ),
                    "specification": row.get(
                        "specification"
                    ),
                    "unit": row.get(
                        "unit"
                    ),
                    "region": row.get(
                        "region"
                    ),
                    "price_tsh": row.get(
                        "price_tsh"
                    ),
                    "supplier": row.get(
                        "supplier"
                    ),
                    "source": row.get(
                        "source"
                    ),
                    "date_collected": row.get(
                        "date_collected"
                    ),
                    "confidence": row.get(
                        "confidence"
                    ),
                    "observation_count": row.get(
                        "observation_count"
                    ),
                }
            )

        return {
            "found": True,
            "request_type": "material_options",
            "material_requested": material,
            "category": category,
            "region_requested": region,
            "options": options,
        }

    # ============================================================
    # AVAILABLE MATERIALS
    # ============================================================

    def get_available_materials(
        self,
        region: Optional[str] = None,
    ) -> list[str]:
        """
        Return available materials in the repository.
        """

        return (
            self.price_repository
            .get_available_materials(
                region=region
            )
        )

    # ============================================================
    # REPOSITORY HEALTH
    # ============================================================

    def get_repository_health(
        self,
    ) -> Dict[str, Any]:
        """
        Return repository health when supported.
        """

        method = getattr(
            self.price_repository,
            "get_repository_health",
            None,
        )

        if callable(method):
            return method()

        return {
            "status": "unknown",
            "message": (
                "PriceRepository does not expose "
                "get_repository_health()."
            ),
        }

    # ============================================================
    # RECENT PRICE RANGE
    # ============================================================

    def get_recent_price_range(
        self,
        material: str,
        region: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get recent price range for a specific material.
        """

        if not material or not material.strip():
            return None

        if not region or not region.strip():
            return None

        method = getattr(
            self.price_repository,
            "get_recent_price_range",
            None,
        )

        if not callable(method):
            return None

        return method(
            material=material.strip(),
            region=region.strip(),
        )
