
from typing import Optional

from engine.price_repository import PriceRepository
from engine.material_estimator import MaterialQuantity


class CostEngine:
    """
    Calculates construction material costs using
    verified prices from the price repository.

    Price priority is handled by PriceRepository:
        CURRENT -> HISTORICAL FALLBACK

    Missing prices are not invented. When a material has no
    verified price for the requested region and unit, the
    material is returned with PRICE_UNAVAILABLE status.
    """

    def __init__(
        self,
        price_repository: Optional[PriceRepository] = None,
    ):
        self.price_repository = (
            price_repository or PriceRepository()
        )

    def calculate_material_cost(
        self,
        material: str,
        quantity: float,
        unit: str,
        region: str,
    ) -> dict:
        """
        Calculate the cost of one material.

        Formula:
            quantity × unit price

        This method requires a verified price.
        If no verified price exists, it raises ValueError.
        The multi-material method handles missing prices safely.
        """

        # --------------------------------------------------------
        # INPUT VALIDATION
        # --------------------------------------------------------

        if quantity <= 0:
            raise ValueError(
                "Material quantity must be greater than zero."
            )

        if not region or not region.strip():
            raise ValueError(
                "Region is required."
            )

        # --------------------------------------------------------
        # PRICE LOOKUP
        # --------------------------------------------------------

        price_data = self.price_repository.get_material_price(
            material=material,
            region=region,
            unit=unit,
        )

        if price_data is None:
            raise ValueError(
                f"No verified price found for "
                f"{material} in {region} ({unit})."
            )

        # --------------------------------------------------------
        # UNIT PRICE VALIDATION
        # --------------------------------------------------------

        unit_price = float(
            price_data["price_tsh"]
        )

        if unit_price <= 0:
            raise ValueError(
                f"Invalid unit price for {material}: "
                f"{unit_price}"
            )

        # --------------------------------------------------------
        # COST CALCULATION
        # --------------------------------------------------------

        subtotal = round(
            float(quantity) * unit_price,
            2,
        )

        result = {
            "material": price_data["material"],
            "category": price_data["category"],
            "quantity": float(quantity),
            "unit": price_data["unit"],
            "unit_price_tsh": unit_price,
            "subtotal_tsh": subtotal,
            "region": price_data["region"],
            "source": price_data["source"],
            "price_type": price_data.get(
                "price_type",
                "UNKNOWN",
            ),
            "status": "PRICE_AVAILABLE",
        }

        # --------------------------------------------------------
        # CURRENT PRICE PROVENANCE
        # --------------------------------------------------------

        if price_data.get("price_type") == "CURRENT":

            result["date_collected"] = (
                price_data.get(
                    "date_collected"
                )
            )

            result["confidence"] = (
                price_data.get(
                    "confidence"
                )
            )

            result["observation_count"] = (
                price_data.get(
                    "observation_count"
                )
            )

            # Backward-compatible field.
            result["source_date"] = (
                price_data.get(
                    "date_collected"
                )
            )

        # --------------------------------------------------------
        # HISTORICAL PRICE PROVENANCE
        # --------------------------------------------------------

        elif price_data.get("price_type") == "HISTORICAL":

            result["source_date"] = (
                price_data.get(
                    "source_date"
                )
            )

            result["date_collected"] = None
            result["confidence"] = None
            result["observation_count"] = None

        # --------------------------------------------------------
        # UNKNOWN / CUSTOM PRICE SOURCE
        # --------------------------------------------------------

        else:

            result["source_date"] = (
                price_data.get(
                    "source_date"
                )
            )

            result["date_collected"] = (
                price_data.get(
                    "date_collected"
                )
            )

            result["confidence"] = (
                price_data.get(
                    "confidence"
                )
            )

            result["observation_count"] = (
                price_data.get(
                    "observation_count"
                )
            )

        return result

    def calculate_materials_cost(
        self,
        materials: list,
        region: str,
    ) -> dict:
        """
        Calculate total cost for multiple materials.

        Supports:
            - MaterialQuantity objects
            - dictionaries containing material, quantity and unit

        Missing verified prices do not stop the entire calculation.
        Such materials are returned with:

            status = "PRICE_UNAVAILABLE"

        Their subtotal is None and they are excluded from the
        calculated material-cost total.

        This prevents the engine from inventing prices.
        """

        # --------------------------------------------------------
        # INPUT VALIDATION
        # --------------------------------------------------------

        if not isinstance(materials, list):
            raise TypeError(
                "materials must be a list."
            )

        if not region or not region.strip():
            raise ValueError(
                "Region is required."
            )

        items = []
        unavailable_items = []
        total = 0.0

        # --------------------------------------------------------
        # PROCESS EACH MATERIAL
        # --------------------------------------------------------

        for material in materials:

            # ----------------------------------------------------
            # MaterialQuantity object
            # ----------------------------------------------------

            if isinstance(
                material,
                MaterialQuantity,
            ):

                material_name = (
                    material.material
                )
                quantity = (
                    material.quantity
                )
                unit = material.unit

            # ----------------------------------------------------
            # Dictionary
            # ----------------------------------------------------

            elif isinstance(
                material,
                dict,
            ):

                required_keys = [
                    "material",
                    "quantity",
                    "unit",
                ]

                for key in required_keys:
                    if key not in material:
                        raise ValueError(
                            f"Material dictionary is missing "
                            f"required field: {key}"
                        )

                material_name = (
                    material["material"]
                )
                quantity = (
                    material["quantity"]
                )
                unit = material["unit"]

            # ----------------------------------------------------
            # Invalid type
            # ----------------------------------------------------

            else:
                raise TypeError(
                    "Each material must be a MaterialQuantity "
                    "object or a dictionary."
                )

            # ----------------------------------------------------
            # QUANTITY VALIDATION
            # ----------------------------------------------------

            try:
                quantity = float(quantity)
            except (
                TypeError,
                ValueError,
            ):
                raise ValueError(
                    f"Invalid quantity for {material_name}: "
                    f"{quantity}"
                )

            if quantity <= 0:
                raise ValueError(
                    f"Material quantity must be greater than zero "
                    f"for {material_name}."
                )

            # ----------------------------------------------------
            # CALCULATE PRICE
            # ----------------------------------------------------

            try:
                result = self.calculate_material_cost(
                    material=material_name,
                    quantity=quantity,
                    unit=unit,
                    region=region,
                )

                items.append(result)

                total += result[
                    "subtotal_tsh"
                ]

            except ValueError as exc:

                error_message = str(exc)

                # Only handle the specific case where
                # a verified price is unavailable.
                if not error_message.startswith(
                    "No verified price found for"
                ):
                    raise

                unavailable_result = {
                    "material": material_name,
                    "quantity": quantity,
                    "unit": unit,
                    "region": region,
                    "status": "PRICE_UNAVAILABLE",
                    "unit_price_tsh": None,
                    "subtotal_tsh": None,
                    "source": None,
                    "price_type": None,
                    "reason": error_message,
                }

                items.append(
                    unavailable_result
                )

                unavailable_items.append(
                    unavailable_result
                )

        # --------------------------------------------------------
        # FINAL RESULT
        # --------------------------------------------------------

        return {
            "region": region,
            "items": items,
            "total_material_cost_tsh": round(
                total,
                2,
            ),
            "unavailable_items": (
                unavailable_items
            ),
            "has_unavailable_prices": bool(
                unavailable_items
            ),
        }