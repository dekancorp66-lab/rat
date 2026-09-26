from pathlib import Path
from typing import Optional

import pandas as pd

from engine.material_catalog import MaterialCatalog


class PriceRepository:
    """
    Location-aware and time-aware repository for construction material prices.

    The repository reads current and historical prices from CSV files and
    returns prices together with provenance and freshness information.

    Price matching priority:
        1. Material / specification / unit / region match
        2. Most recent observation
        3. Higher confidence
        4. Higher observation count

    Freshness policy:
        0-7 days   -> FRESH
        8-30 days  -> RECENT
        31-90 days -> AGING
        >90 days   -> STALE

    Important:
    - Current-price lookup is strict about freshness.
    - Main price lookup prefers current data.
    - If no current price exists, main lookup can fall back to verified
      historical data, explicitly marked as HISTORICAL.
    """

    DEFAULT_FRESH_DAYS = 7
    DEFAULT_RECENT_DAYS = 30
    DEFAULT_AGING_DAYS = 90

    REGION_ALIASES = {
        "dar": "Dar es Salaam",
        "dar es salaam": "Dar es Salaam",
        "dsm": "Dar es Salaam",
        "dar-es-salaam": "Dar es Salaam",
        "dodoma": "Dodoma",
        "arusha": "Arusha",
        "mbeya": "Mbeya",
        "mwanza": "Mwanza",
        "zanzibar": "Zanzibar",
        "stone town": "Zanzibar",
    }

    def __init__(
        self,
        current_price_file: Optional[str] = None,
        historical_price_file: Optional[str] = None,
        material_catalog: Optional[MaterialCatalog] = None,
        today: Optional[str] = None,
    ):
        base_dir = (
            Path(__file__)
            .resolve()
            .parent
            .parent
        )

        self.current_price_file = Path(
            current_price_file
            if current_price_file
            else (
                base_dir
                / "data"
                / "cost"
                / "current_material_prices.csv"
            )
        )

        self.historical_price_file = Path(
            historical_price_file
            if historical_price_file
            else (
                base_dir
                / "data"
                / "cost"
                / "material_prices.csv"
            )
        )

        self.material_catalog = (
            material_catalog
            or MaterialCatalog()
        )

        # Fixed date is useful for deterministic tests.
        self.today = (
            pd.Timestamp(today).normalize()
            if today
            else pd.Timestamp.today().normalize()
        )

        self.current_data = (
            self._load_current_data()
        )

        self.historical_data = (
            self._load_historical_data()
        )

    # ============================================================
    # NORMALIZATION
    # ============================================================

    def _resolve_material_name(
        self,
        material: str,
    ) -> str:
        """
        Resolve a material name or alias to the canonical
        MaterialCatalog name when possible.
        """

        if (
            not material
            or not str(material).strip()
        ):
            raise ValueError(
                "Material name is required."
            )

        material = str(
            material
        ).strip()

        resolved = (
            self.material_catalog.resolve(
                material
            )
        )

        if resolved is not None:
            return resolved.name

        return material

    def _normalize_region(
        self,
        region: str,
    ) -> str:
        """
        Normalize common Tanzania location aliases.
        """

        if (
            not region
            or not str(region).strip()
        ):
            raise ValueError(
                "Region/location is required for a price lookup."
            )

        raw = " ".join(
            str(region)
            .strip()
            .split()
        )

        key = raw.lower()

        return self.REGION_ALIASES.get(
            key,
            raw,
        )

    @staticmethod
    def _clean_text(
        series: pd.Series,
    ) -> pd.Series:
        return (
            series
            .fillna("")
            .astype(str)
            .str.strip()
        )

    # ============================================================
    # LOAD CURRENT DATA
    # ============================================================

    def _load_current_data(
        self,
    ) -> pd.DataFrame:

        required_columns = {
            "material",
            "category",
            "specification",
            "unit",
            "region",
            "price_tsh",
            "supplier",
            "source",
            "date_collected",
            "confidence",
            "observation_count",
        }

        if not self.current_price_file.exists():
            return pd.DataFrame(
                columns=sorted(
                    required_columns
                )
            )

        data = pd.read_csv(
            self.current_price_file
        )

        missing = (
            required_columns
            - set(data.columns)
        )

        if missing:
            raise ValueError(
                "Current price dataset is missing columns: "
                f"{sorted(missing)}"
            )

        data["price_tsh"] = (
            pd.to_numeric(
                data["price_tsh"],
                errors="coerce",
            )
        )

        data["confidence"] = (
            pd.to_numeric(
                data["confidence"],
                errors="coerce",
            )
        )

        data["observation_count"] = (
            pd.to_numeric(
                data["observation_count"],
                errors="coerce",
            )
        )

        for col in [
            "material",
            "region",
            "unit",
            "specification",
            "supplier",
            "source",
        ]:
            data[col] = self._clean_text(
                data[col]
            )

        data["date_collected"] = (
            pd.to_datetime(
                data["date_collected"],
                errors="coerce",
            )
        )

        data["region_normalized"] = (
            data["region"].apply(
                lambda x: (
                    self._normalize_region(x)
                    if x
                    else x
                )
            )
        )

        data["material_normalized"] = (
            data["material"].apply(
                lambda x: (
                    self._resolve_material_name(
                        x
                    )
                    if x
                    else x
                )
            )
        )

        data = data[
            data["price_tsh"].notna()
            & (
                data["price_tsh"] > 0
            )
        ].copy()

        data["age_days"] = (
            self.today
            - data[
                "date_collected"
            ].dt.normalize()
        ).dt.days

        # Future dates are not allowed to appear
        # as negative ages.
        data.loc[
            data["age_days"] < 0,
            "age_days",
        ] = 0

        data["freshness_status"] = (
            data["age_days"].apply(
                self._freshness_status
            )
        )

        return data.reset_index(
            drop=True
        )

    # ============================================================
    # LOAD HISTORICAL DATA
    # ============================================================

    def _load_historical_data(
        self,
    ) -> pd.DataFrame:

        required_columns = {
            "material",
            "category",
            "unit",
            "region",
            "price_tsh",
            "source",
            "source_date",
        }

        if not self.historical_price_file.exists():
            return pd.DataFrame(
                columns=sorted(
                    required_columns
                )
            )

        data = pd.read_csv(
            self.historical_price_file
        )

        missing = (
            required_columns
            - set(data.columns)
        )

        if missing:
            raise ValueError(
                "Historical price dataset is missing columns: "
                f"{sorted(missing)}"
            )

        data["price_tsh"] = (
            pd.to_numeric(
                data["price_tsh"],
                errors="coerce",
            )
        )

        for col in [
            "material",
            "region",
            "unit",
            "category",
            "source",
        ]:
            data[col] = self._clean_text(
                data[col]
            )

        data["source_date"] = (
            pd.to_datetime(
                data["source_date"],
                errors="coerce",
            )
        )

        data["region_normalized"] = (
            data["region"].apply(
                lambda x: (
                    self._normalize_region(x)
                    if x
                    else x
                )
            )
        )

        data["material_normalized"] = (
            data["material"].apply(
                lambda x: (
                    self._resolve_material_name(
                        x
                    )
                    if x
                    else x
                )
            )
        )

        data = data[
            data["price_tsh"].notna()
            & (
                data["price_tsh"] > 0
            )
        ].copy()

        data["age_days"] = (
            self.today
            - data[
                "source_date"
            ].dt.normalize()
        ).dt.days

        data.loc[
            data["age_days"] < 0,
            "age_days",
        ] = 0

        data["freshness_status"] = (
            data["age_days"].apply(
                self._freshness_status
            )
        )

        return data.reset_index(
            drop=True
        )

    # ============================================================
    # FRESHNESS
    # ============================================================

    def _freshness_status(
        self,
        age_days,
    ) -> str:

        if pd.isna(age_days):
            return "UNKNOWN"

        age_days = int(
            age_days
        )

        if (
            age_days
            <= self.DEFAULT_FRESH_DAYS
        ):
            return "FRESH"

        if (
            age_days
            <= self.DEFAULT_RECENT_DAYS
        ):
            return "RECENT"

        if (
            age_days
            <= self.DEFAULT_AGING_DAYS
        ):
            return "AGING"

        return "STALE"

    # ============================================================
    # MATCHING HELPERS
    # ============================================================

    def _filter_material_region_unit(
        self,
        data: pd.DataFrame,
        material: str,
        region: str,
        unit: Optional[str] = None,
    ) -> pd.DataFrame:

        if data.empty:
            return data.copy()

        canonical_name = (
            self._resolve_material_name(
                material
            )
        )

        normalized_region = (
            self._normalize_region(
                region
            )
        )

        matches = data[
            data[
                "material_normalized"
            ].str.lower()
            == canonical_name.lower()
        ]

        matches = matches[
            matches[
                "region_normalized"
            ].str.lower()
            == normalized_region.lower()
        ]

        if unit:
            unit_clean = (
                unit
                .strip()
                .lower()
            )

            matches = matches[
                matches[
                    "unit"
                ].str.lower()
                == unit_clean
            ]

        return matches.copy()

    @staticmethod
    def _safe_float(
        value,
    ):
        return (
            float(value)
            if pd.notna(value)
            else None
        )

    @staticmethod
    def _safe_int(
        value,
    ):
        return (
            int(value)
            if pd.notna(value)
            else None
        )

    # ============================================================
    # CURRENT PRICE LOOKUP
    # ============================================================

    def get_current_material_price(
        self,
        material: str,
        region: str,
        unit: Optional[str] = None,
        max_age_days: Optional[int] = 30,
        allow_stale: bool = False,
    ) -> Optional[dict]:
        """
        Return the best current observation.

        Current lookup is strict about freshness by default.
        """

        matches = (
            self._filter_material_region_unit(
                self.current_data,
                material,
                region,
                unit,
            )
        )

        if matches.empty:
            return None

        # --------------------------------------------------------
        # Freshness restriction
        # --------------------------------------------------------

        if (
            max_age_days is not None
            and not allow_stale
        ):

            fresh_matches = matches[
                matches["age_days"].notna()
                & (
                    matches["age_days"]
                    <= max_age_days
                )
            ].copy()

            if fresh_matches.empty:
                return None

            matches = fresh_matches

        # --------------------------------------------------------
        # Best record
        # --------------------------------------------------------

        matches = matches.sort_values(
            by=[
                "date_collected",
                "confidence",
                "observation_count",
            ],
            ascending=[
                False,
                False,
                False,
            ],
            na_position="last",
        )

        row = matches.iloc[0]

        return {
            "material": row["material"],
            "category": row["category"],
            "specification": row[
                "specification"
            ],
            "unit": row["unit"],
            "region": row["region"],
            "price_tsh": float(
                row["price_tsh"]
            ),
            "supplier": row[
                "supplier"
            ],
            "source": row[
                "source"
            ],
            "date_collected": (
                row[
                    "date_collected"
                ].date().isoformat()
                if pd.notna(
                    row[
                        "date_collected"
                    ]
                )
                else None
            ),
            "age_days": self._safe_int(
                row["age_days"]
            ),
            "freshness_status": row[
                "freshness_status"
            ],
            "confidence": self._safe_float(
                row["confidence"]
            ),
            "observation_count": (
                self._safe_int(
                    row[
                        "observation_count"
                    ]
                )
            ),
            "price_type": "CURRENT",
        }

    # ============================================================
    # HISTORICAL PRICE LOOKUP
    # ============================================================

    def get_historical_material_price(
        self,
        material: str,
        region: str,
        unit: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Return the most recent verified historical
        price for a material + region.
        """

        matches = (
            self._filter_material_region_unit(
                self.historical_data,
                material,
                region,
                unit,
            )
        )

        if matches.empty:
            return None

        matches = matches.sort_values(
            by=["source_date"],
            ascending=[False],
            na_position="last",
        )

        row = matches.iloc[0]

        return {
            "material": row[
                "material"
            ],
            "category": row[
                "category"
            ],
            "unit": row[
                "unit"
            ],
            "region": row[
                "region"
            ],
            "price_tsh": float(
                row["price_tsh"]
            ),
            "source": row[
                "source"
            ],
            "source_date": (
                row[
                    "source_date"
                ].date().isoformat()
                if pd.notna(
                    row["source_date"]
                )
                else None
            ),
            "age_days": self._safe_int(
                row["age_days"]
            ),
            "freshness_status": row[
                "freshness_status"
            ],
            "price_type": "HISTORICAL",
        }

    # ============================================================
    # MAIN PRICE LOOKUP
    # ============================================================

    def get_material_price(
        self,
        material: str,
        region: str,
        unit: Optional[str] = None,
        max_age_days: Optional[int] = 30,
        allow_stale: bool = False,
    ) -> Optional[dict]:
        """
        Return the best available verified price.

        Priority:
            1. Current verified price
            2. Historical verified price

        Important:
        Historical fallback is explicitly labeled HISTORICAL.

        This method intentionally does NOT discard a verified
        historical record just because it is older than
        max_age_days. The age is preserved in the returned
        result so callers can decide how to present it.

        Current prices still obey the freshness rules through
        get_current_material_price().
        """

        # ========================================================
        # 1. CURRENT
        # ========================================================

        current = (
            self.get_current_material_price(
                material=material,
                region=region,
                unit=unit,
                max_age_days=max_age_days,
                allow_stale=allow_stale,
            )
        )

        if current is not None:
            return current

        # ========================================================
        # 2. HISTORICAL FALLBACK
        # ========================================================

        historical = (
            self.get_historical_material_price(
                material=material,
                region=region,
                unit=unit,
            )
        )

        if historical is None:
            return None

        # --------------------------------------------------------
        # IMPORTANT:
        # Always preserve HISTORICAL classification.
        # Never silently convert it into CURRENT.
        # --------------------------------------------------------

        historical["price_type"] = (
            "HISTORICAL"
        )

        return historical

    # ============================================================
    # PRICE RANGE
    # ============================================================

    def get_recent_price_range(
        self,
        material: str,
        region: str,
        unit: Optional[str] = None,
        max_age_days: int = 30,
    ) -> Optional[dict]:
        """
        Return min/max/median for recent current observations.
        """

        matches = (
            self._filter_material_region_unit(
                self.current_data,
                material,
                region,
                unit,
            )
        )

        if matches.empty:
            return None

        matches = matches[
            matches["age_days"].notna()
            & (
                matches["age_days"]
                <= max_age_days
            )
        ].copy()

        if matches.empty:
            return None

        return {
            "material": matches.iloc[0][
                "material"
            ],
            "region": matches.iloc[0][
                "region"
            ],
            "unit": matches.iloc[0][
                "unit"
            ],
            "min_price_tsh": float(
                matches[
                    "price_tsh"
                ].min()
            ),
            "max_price_tsh": float(
                matches[
                    "price_tsh"
                ].max()
            ),
            "median_price_tsh": float(
                matches[
                    "price_tsh"
                ].median()
            ),
            "observation_count": int(
                len(matches)
            ),
            "latest_date": (
                matches[
                    "date_collected"
                ].max()
                .date()
                .isoformat()
                if matches[
                    "date_collected"
                ].notna().any()
                else None
            ),
            "max_age_days": max_age_days,
        }

    # ============================================================
    # REGIONAL MATERIALS
    # ============================================================

    def get_materials_by_region(
        self,
        region: str,
        max_age_days: Optional[int] = 30,
        include_stale: bool = False,
    ) -> pd.DataFrame:
        """
        Return current materials available for a region.
        """

        if self.current_data.empty:
            return self.current_data.copy()

        normalized_region = (
            self._normalize_region(
                region
            )
        )

        data = self.current_data[
            self.current_data[
                "region_normalized"
            ].str.lower()
            == normalized_region.lower()
        ].copy()

        if (
            not include_stale
            and max_age_days is not None
        ):

            data = data[
                data["age_days"].notna()
                & (
                    data["age_days"]
                    <= max_age_days
                )
            ].copy()

        return data.sort_values(
            by=[
                "material",
                "date_collected",
                "confidence",
            ],
            ascending=[
                True,
                False,
                False,
            ],
            na_position="last",
        ).reset_index(
            drop=True
        )

    # ============================================================
    # AVAILABLE MATERIALS
    # ============================================================

    def get_available_materials(
        self,
        region: Optional[str] = None,
        max_age_days: Optional[int] = 30,
    ) -> list[str]:
        """
        Return unique material names available in recent
        current data.
        """

        if region:

            data = (
                self.get_materials_by_region(
                    region,
                    max_age_days=max_age_days,
                    include_stale=False,
                )
            )

        elif not self.current_data.empty:

            data = (
                self.current_data.copy()
            )

            if max_age_days is not None:

                data = data[
                    data["age_days"].notna()
                    & (
                        data["age_days"]
                        <= max_age_days
                    )
                ].copy()

        else:

            data = (
                self.historical_data.copy()
            )

        if data.empty:
            return []

        names = set(
            data["material"]
            .dropna()
            .astype(str)
            .str.strip()
            .tolist()
        )

        for name in list(names):

            definition = (
                self.material_catalog.resolve(
                    name
                )
            )

            if definition is not None:

                names.add(
                    definition.name
                )

                names.update(
                    definition.aliases
                )

        return sorted(names)

    # ============================================================
    # REPOSITORY HEALTH
    # ============================================================

    def get_repository_health(
        self,
    ) -> dict:
        """
        Return a simple overview of loaded current
        price data and freshness.
        """

        current = (
            self.current_data
        )

        if current.empty:

            return {
                "current_records": 0,
                "current_regions": 0,
                "fresh_records": 0,
                "recent_records": 0,
                "aging_records": 0,
                "stale_records": 0,
            }

        status_counts = (
            current[
                "freshness_status"
            ].value_counts()
        )

        return {
            "current_records": int(
                len(current)
            ),
            "current_regions": int(
                current[
                    "region"
                ].nunique()
            ),
            "fresh_records": int(
                status_counts.get(
                    "FRESH",
                    0,
                )
            ),
            "recent_records": int(
                status_counts.get(
                    "RECENT",
                    0,
                )
            ),
            "aging_records": int(
                status_counts.get(
                    "AGING",
                    0,
                )
            ),
            "stale_records": int(
                status_counts.get(
                    "STALE",
                    0,
                )
            ),
        }