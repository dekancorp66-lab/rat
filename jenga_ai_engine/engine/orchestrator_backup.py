from typing import Any, Optional

from engine.understanding import understand_message
from engine.conversation_state import ConversationState
from engine.validator import validate_cost_estimation
from engine.followup import generate_followup_question
from engine.project_cost_estimator import ProjectCostEstimator
from engine.jenga_tools import JengaTools

from engine.response_generator import (
    generate_followup_response,
    generate_ready_response,
    generate_estimation_response,
)


class JengaAIOrchestrator:
    """
    Main orchestration layer for JENGA AI.

    Responsibilities:
    - Understand natural-language messages using Gemini
    - Detect intent
    - Extract construction information
    - Maintain conversation state
    - Route requests to the correct tools
    - Handle multi-turn conversations
    - Produce natural, welcoming and useful responses

    Design principles:
    - Direct does not mean extremely short.
    - Do not guess material types that the user did not specify.
    - Generic material requests show available options.
    - Specific material requests use exact lookup.
    - Follow-up messages use conversation context.
    - A new unrelated intent can replace the previous intent.
    - Verified numerical information comes from JENGA tools/data.
    """

    def __init__(
        self,
        project_cost_estimator: Optional[ProjectCostEstimator] = None,
        jenga_tools: Optional[JengaTools] = None,
    ):
        self.state = ConversationState()

        self.current_intent = None

        self.project_cost_estimator = (
            project_cost_estimator
            or ProjectCostEstimator()
        )

        self.jenga_tools = (
            jenga_tools
            or JengaTools()
        )

        # ========================================================
        # MATERIAL PRICE CONVERSATION MEMORY
        # ========================================================

        self.last_material_category: Optional[str] = None
        self.last_material_request: Optional[str] = None
        self.last_material_region: Optional[str] = None

        # Options most recently shown to the user.
        self.last_material_options: list[dict] = []

        # ========================================================
        # RESPONSE VARIATION
        # ========================================================

        self._response_turn = 0

    # ============================================================
    # STATE -> DICT
    # ============================================================

    def _state_to_dict(self) -> dict:
        if isinstance(self.state, dict):
            return dict(self.state)

        if hasattr(self.state, "__dict__"):
            return dict(vars(self.state))

        result = {}

        for field_name in dir(self.state):
            if field_name.startswith("_"):
                continue

            try:
                value = getattr(
                    self.state,
                    field_name,
                )
            except Exception:
                continue

            if callable(value):
                continue

            result[field_name] = value

        return result

    # ============================================================
    # INFO -> DICT
    # ============================================================

    def _info_to_dict(
        self,
        info,
    ) -> dict:

        if info is None:
            return {}

        if isinstance(info, dict):
            return dict(info)

        if hasattr(info, "model_dump"):
            return info.model_dump()

        if hasattr(info, "dict"):
            return info.dict()

        if hasattr(info, "__dict__"):
            return dict(vars(info))

        result = {}

        for field_name in dir(info):
            if field_name.startswith("_"):
                continue

            try:
                value = getattr(
                    info,
                    field_name,
                )
            except Exception:
                continue

            if callable(value):
                continue

            result[field_name] = value

        return result

    # ============================================================
    # TEXT NORMALIZATION
    # ============================================================

    def _normalize_text(
        self,
        value: Any,
    ) -> str:

        if value is None:
            return ""

        text = str(value).strip().lower()

        text = " ".join(
            text.split()
        )

        return text

    # ============================================================
    # GENERIC FOLLOW-UP DETECTION
    # ============================================================

    def _looks_like_context_followup(
        self,
        message: str,
    ) -> bool:

        text = self._normalize_text(
            message
        )

        phrases = [
            "ya bei ndogo",
            "bei ndogo",
            "bei ya chini",
            "bei ndogo kabisa",
            "bei ya chini kabisa",
            "ya bei nafuu",
            "nafuu zaidi",
            "ghali zaidi",
            "bei kubwa",
            "bei kubwa kabisa",
            "bei ya juu",
            "bei ya juu kabisa",
            "ya kwanza",
            "ya pili",
            "ya tatu",
            "ya nne",
            "ya tano",
            "ya sita",
            "option",
            "namba",
            "chaguo",
            "hiyo",
            "ile",
            "iyo",
            "hilo",
            "hii",
            "hiyo ya",
            "na arusha je",
            "na mwanza je",
            "na dodoma je",
            "na mbeya je",
            "na dar es salaam je",
            "vipi arusha",
            "vipi mwanza",
            "vipi dodoma",
            "vipi mbeya",
            "vipi dar",
            "na je",
        ]

        return any(
            phrase in text
            for phrase in phrases
        )

    # ============================================================
    # CHEAPEST REQUEST
    # ============================================================

    def _is_cheapest_request(
        self,
        message: str,
    ) -> bool:

        text = self._normalize_text(
            message
        )

        patterns = [
            "bei ndogo",
            "bei ya chini",
            "bei ndogo kabisa",
            "bei ya chini kabisa",
            "ya bei ndogo",
            "ya bei nafuu",
            "bei nafuu",
            "nafuu zaidi",
            "gharama ndogo",
            "gharama ya chini",
            "cheapest",
            "lowest price",
            "least expensive",
        ]

        return any(
            pattern in text
            for pattern in patterns
        )

    # ============================================================
    # MOST EXPENSIVE REQUEST
    # ============================================================

    def _is_most_expensive_request(
        self,
        message: str,
    ) -> bool:

        text = self._normalize_text(
            message
        )

        patterns = [
            "bei kubwa",
            "bei ya juu",
            "bei kubwa kabisa",
            "bei ya juu kabisa",
            "ghali zaidi",
            "gharama kubwa",
            "most expensive",
            "highest price",
        ]

        return any(
            pattern in text
            for pattern in patterns
        )

    # ============================================================
    # OPTION NUMBER
    # ============================================================

    def _extract_option_number(
        self,
        message: str,
    ) -> Optional[int]:

        text = self._normalize_text(
            message
        )

        ordinal_map = {
            "ya kwanza": 1,
            "wa kwanza": 1,
            "hiyo ya kwanza": 1,
            "ile ya kwanza": 1,

            "ya pili": 2,
            "wa pili": 2,
            "hiyo ya pili": 2,
            "ile ya pili": 2,

            "ya tatu": 3,
            "wa tatu": 3,
            "hiyo ya tatu": 3,
            "ile ya tatu": 3,

            "ya nne": 4,
            "wa nne": 4,
            "hiyo ya nne": 4,

            "ya tano": 5,
            "wa tano": 5,
            "hiyo ya tano": 5,

            "ya sita": 6,
            "wa sita": 6,

            "first": 1,
            "second": 2,
            "third": 3,
            "fourth": 4,
            "fifth": 5,
            "sixth": 6,
        }

        for phrase, number in ordinal_map.items():
            if phrase in text:
                return number

        for number in range(1, 10):

            patterns = [
                f"option {number}",
                f"option ya {number}",
                f"number {number}",
                f"namba {number}",
                f"chaguo {number}",
            ]

            if any(
                pattern in text
                for pattern in patterns
            ):
                return number

        return None

    # ============================================================
    # FIND OPTION BY MATERIAL NAME
    # ============================================================

    def _find_option_by_material(
        self,
        message: str,
    ) -> Optional[dict]:

        if not self.last_material_options:
            return None

        text = self._normalize_text(
            message
        )

        for option in self.last_material_options:

            material = self._normalize_text(
                option.get("material")
            )

            specification = self._normalize_text(
                option.get("specification")
            )

            if (
                material
                and material in text
            ):
                return option

            if (
                specification
                and specification in text
            ):
                return option

        # Support common grades.
        for option in self.last_material_options:

            material = self._normalize_text(
                option.get("material")
            )

            specification = self._normalize_text(
                option.get("specification")
            )

            combined = (
                f"{material} {specification}"
            )

            if (
                "32.5" in text
                and "32.5" in combined
            ):
                return option

            if (
                "42.5" in text
                and "42.5" in combined
            ):
                return option

            if (
                "52.5" in text
                and "52.5" in combined
            ):
                return option

        return None

    # ============================================================
    # EXTRACT REGION FROM FOLLOW-UP
    # ============================================================

    def _extract_region_from_message(
        self,
        message: str,
    ) -> Optional[str]:

        text = self._normalize_text(
            message
        )

        region_aliases = {
            "mwanza": "Mwanza",
            "arusha": "Arusha",
            "dodoma": "Dodoma",
            "mbeya": "Mbeya",
            "dar": "Dar es Salaam",
            "dsm": "Dar es Salaam",
            "dar es salaam": "Dar es Salaam",
            "moro": "Morogoro",
            "morogoro": "Morogoro",
            "tanga": "Tanga",
            "iringa": "Iringa",
            "tabora": "Tabora",
            "geita": "Geita",
            "kigoma": "Kigoma",
            "mtwara": "Mtwara",
            "lindi": "Lindi",
            "zanzibar": "Zanzibar",
        }

        for alias, region in region_aliases.items():
            if alias in text:
                return region

        return None

    # ============================================================
    # FORMAT ONE PRICE OPTION
    # ============================================================

    def _format_price_option(
        self,
        option: dict,
    ) -> str:

        material = option.get(
            "material",
            "Unknown material",
        )

        specification = option.get(
            "specification"
        )

        price = option.get(
            "price_tsh"
        )

        unit = option.get(
            "unit"
        )

        display_name = str(
            material
        )

        if (
            specification
            and self._normalize_text(
                specification
            )
            != self._normalize_text(
                material
            )
        ):
            display_name = (
                f"{material} "
                f"({specification})"
            )

        if price is None:
            return display_name

        try:
            price_text = (
                f"TSh {float(price):,.0f}"
            )
        except (
            TypeError,
            ValueError,
        ):
            price_text = str(price)

        if unit:
            return (
                f"{display_name} — "
                f"{price_text} kwa {unit}"
            )

        return (
            f"{display_name} — "
            f"{price_text}"
        )

    # ============================================================
    # BUILD MATERIAL OPTIONS RESPONSE
    # ============================================================

    def _build_material_options_response(
        self,
        material: str,
        region: str,
        options: list[dict],
    ) -> str:

        if not options:
            return (
                f"Samahani, kwa sasa sina "
                f"bei zilizothibitishwa za "
                f"{material} huko {region}."
            )

        lines = [
            (
                f"Karibu! Nimeangalia taarifa "
                f"zilizopo kwa {material} huko "
                f"{region}, na nimepata hizi:"
            )
        ]

        for index, option in enumerate(
            options,
            start=1,
        ):
            lines.append(
                f"{index}. "
                f"{self._format_price_option(option)}"
            )

        lines.append(
            (
                f"Unaweza kuchagua aina maalum "
                f"unayotaka, au kuniambia kama "
                f"unatafuta iliyo na bei ya chini "
                f"zaidi."
            )
        )

        return "\n".join(lines)

    # ============================================================
    # BUILD SINGLE PRICE RESPONSE
    # ============================================================

    def _build_single_price_response(
        self,
        option: dict,
        opening: str = "Sawa.",
    ) -> str:

        material = option.get(
            "material"
        )

        specification = option.get(
            "specification"
        )

        price = option.get(
            "price_tsh"
        )

        unit = option.get(
            "unit"
        )

        region = option.get(
            "region",
            self.last_material_region,
        )

        date_collected = option.get(
            "date_collected"
        )

        source = option.get(
            "source"
        )

        display_name = str(
            material
        )

        if specification:
            display_name = (
                f"{material} "
                f"({specification})"
            )

        try:
            price_text = (
                f"TSh {float(price):,.0f}"
            )
        except (
            TypeError,
            ValueError,
        ):
            price_text = str(price)

        response = (
            f"{opening} "
            f"{display_name} huko "
            f"{region} ni {price_text}"
        )

        if unit:
            response += (
                f" kwa {unit}."
            )
        else:
            response += "."

        if date_collected:
            response += (
                f" Taarifa hii ilikusanywa "
                f"{date_collected}."
            )

        if source:
            response += (
                f" Chanzo: {source}."
            )

        return response

    # ============================================================
    # HANDLE MATERIAL FOLLOW-UP
    # ============================================================

    def _handle_material_followup(
        self,
        user_message: str,
    ) -> Optional[tuple[str, dict]]:

        if not self.last_material_options:
            return None

        # ========================================================
        # CHEAPEST
        # ========================================================

        if self._is_cheapest_request(
            user_message
        ):

            priced_options = [
                option
                for option
                in self.last_material_options
                if option.get("price_tsh") is not None
            ]

            if not priced_options:
                return None

            cheapest = min(
                priced_options,
                key=lambda option: float(
                    option["price_tsh"]
                ),
            )

            response = (
                self._build_single_price_response(
                    cheapest,
                    opening=(
                        "Ndiyo. Kati ya zile "
                        "nilizokutajia, "
                        "iliyo na bei ya chini "
                        "zaidi ni"
                    ),
                )
            )

            context = {
                "found": True,
                "request_type": (
                    "material_price_selection"
                ),
                "selection_type": "cheapest",
                "selected_option": cheapest,
                "available_options": (
                    self.last_material_options
                ),
            }

            return response, context

        # ========================================================
        # MOST EXPENSIVE
        # ========================================================

        if self._is_most_expensive_request(
            user_message
        ):

            priced_options = [
                option
                for option
                in self.last_material_options
                if option.get("price_tsh") is not None
            ]

            if not priced_options:
                return None

            most_expensive = max(
                priced_options,
                key=lambda option: float(
                    option["price_tsh"]
                ),
            )

            response = (
                self._build_single_price_response(
                    most_expensive,
                    opening=(
                        "Ndiyo. Kati ya zile "
                        "nilizokutajia, "
                        "iliyo na bei ya juu "
                        "zaidi ni"
                    ),
                )
            )

            context = {
                "found": True,
                "request_type": (
                    "material_price_selection"
                ),
                "selection_type": (
                    "most_expensive"
                ),
                "selected_option": (
                    most_expensive
                ),
                "available_options": (
                    self.last_material_options
                ),
            }

            return response, context

        # ========================================================
        # OPTION NUMBER
        # ========================================================

        option_number = (
            self._extract_option_number(
                user_message
            )
        )

        if option_number is not None:

            index = option_number - 1

            if (
                0 <= index
                < len(
                    self.last_material_options
                )
            ):

                selected = (
                    self.last_material_options[
                        index
                    ]
                )

                response = (
                    self._build_single_price_response(
                        selected,
                        opening=(
                            "Sawa. Umechagua"
                        ),
                    )
                )

                context = {
                    "found": True,
                    "request_type": (
                        "material_price_selection"
                    ),
                    "selection_type": (
                        "option_number"
                    ),
                    "selected_index": (
                        option_number
                    ),
                    "selected_option": selected,
                    "available_options": (
                        self.last_material_options
                    ),
                }

                return response, context

        # ========================================================
        # SPECIFIC MATERIAL
        # ========================================================

        selected = (
            self._find_option_by_material(
                user_message
            )
        )

        if selected is not None:

            response = (
                self._build_single_price_response(
                    selected,
                    opening=(
                        "Sawa. Kwa hiyo aina"
                    ),
                )
            )

            context = {
                "found": True,
                "request_type": (
                    "material_price_selection"
                ),
                "selection_type": (
                    "specific_material"
                ),
                "selected_option": selected,
                "available_options": (
                    self.last_material_options
                ),
            }

            return response, context

        return None

    # ============================================================
    # HANDLE REGION FOLLOW-UP
    # ============================================================

    def _handle_region_followup(
        self,
        user_message: str,
    ) -> Optional[tuple[str, dict]]:

        if not self.last_material_request:
            return None

        new_region = (
            self._extract_region_from_message(
                user_message
            )
        )

        if not new_region:
            return None

        # --------------------------------------------------------
        # Only use this if the message looks like a continuation.
        # For example:
        #   "na Arusha je?"
        #   "vipi Dodoma?"
        # --------------------------------------------------------

        text = self._normalize_text(
            user_message
        )

        continuation_markers = [
            "na ",
            "vipi ",
            "je",
            "huko ",
        ]

        looks_like_continuation = (
            any(
                marker in text
                for marker
                in continuation_markers
            )
            or len(text.split()) <= 4
        )

        if not looks_like_continuation:
            return None

        material = (
            self.last_material_request
        )

        options_result = (
            self.jenga_tools
            .get_material_options(
                material=material,
                region=new_region,
            )
        )

        # Update region context.
        self.last_material_region = (
            new_region
        )

        if not options_result.get(
            "found"
        ):

            self.last_material_options = []

            response = (
                f"Sawa. Kwa {new_region}, "
                f"kwa sasa sina bei "
                f"zilizothibitishwa za "
                f"{material}."
            )

            return (
                response,
                options_result,
            )

        options = (
            options_result.get(
                "options",
                []
            )
        )

        self.last_material_options = (
            options
        )

        response = (
            self._build_material_options_response(
                material,
                new_region,
                options,
            )
        )

        return (
            response,
            options_result,
        )

    # ============================================================
    # MATERIAL PRICE HANDLER
    # ============================================================

    def _handle_material_price(
        self,
        extracted_info,
        user_message: str,
    ) -> tuple[str, dict]:

        info = self._info_to_dict(
            extracted_info
        )

        extracted_material = (
            info.get("material")
        )

        extracted_region = (
            info.get("location")
        )

        unit = info.get(
            "unit"
        )

        # --------------------------------------------------------
        # First: follow-up based on previously shown options.
        # --------------------------------------------------------

        followup_result = (
            self._handle_material_followup(
                user_message
            )
        )

        if followup_result is not None:
            return followup_result

        # --------------------------------------------------------
        # Region continuation.
        # --------------------------------------------------------

        region_followup = (
            self._handle_region_followup(
                user_message
            )
        )

        if region_followup is not None:
            return region_followup

        # --------------------------------------------------------
        # Use previous context only when current message
        # doesn't provide a new value.
        # --------------------------------------------------------

        material = (
            extracted_material
            or self.last_material_request
        )

        region = (
            extracted_region
            or self.last_material_region
        )

        # --------------------------------------------------------
        # Missing material.
        # --------------------------------------------------------

        if not material:

            return (
                (
                    "Karibu! Niambie unatafuta "
                    "bei ya material gani, kwa "
                    "mfano cement, mchanga, "
                    "kokoto au blocks."
                ),
                {
                    "found": False,
                    "request_type": (
                        "material_price"
                    ),
                    "error": (
                        "Material is missing."
                    ),
                },
            )

        # --------------------------------------------------------
        # Missing region.
        # --------------------------------------------------------

        if not region:

            self.last_material_request = (
                material
            )

            return (
                (
                    f"Sawa, nimeelewa unataka "
                    f"bei ya {material}. "
                    f"Niambie ungependa "
                    f"kuangalia mkoa gani."
                ),
                {
                    "found": False,
                    "request_type": (
                        "material_price"
                    ),
                    "material_requested": (
                        material
                    ),
                    "error": (
                        "Location is missing."
                    ),
                },
            )

        # --------------------------------------------------------
        # Save context.
        # --------------------------------------------------------

        self.last_material_request = (
            material
        )

        self.last_material_region = (
            region
        )

        # ========================================================
        # GENERIC MATERIAL
        # ========================================================

        is_generic = (
            self.jenga_tools
            .is_generic_material(
                material
            )
        )

        if is_generic:

            options_result = (
                self.jenga_tools
                .get_material_options(
                    material=material,
                    region=region,
                )
            )

            if not options_result.get(
                "found"
            ):

                self.last_material_options = []

                response = (
                    f"Samahani, kwa sasa "
                    f"sina bei zilizothibitishwa "
                    f"za {material} huko {region}."
                )

                return (
                    response,
                    options_result,
                )

            options = (
                options_result.get(
                    "options",
                    []
                )
            )

            self.last_material_options = (
                options
            )

            self.last_material_category = (
                options_result.get(
                    "category"
                )
            )

            response = (
                self._build_material_options_response(
                    material,
                    region,
                    options,
                )
            )

            return (
                response,
                options_result,
            )

        # ========================================================
        # SPECIFIC MATERIAL
        # ========================================================

        price_result = (
            self.jenga_tools
            .get_material_price(
                material=material,
                region=region,
                unit=unit,
            )
        )

        if price_result.get(
            "found"
        ):

            data = price_result.get(
                "data",
                {}
            )

            self.last_material_options = [
                data
            ]

            response = (
                self._build_single_price_response(
                    data,
                    opening="Karibu.",
                )
            )

            return (
                response,
                price_result,
            )

        # ========================================================
        # SPECIFIC MATERIAL NOT FOUND
        # ========================================================

        response = (
            f"Samahani, kwa sasa sina "
            f"bei iliyothibitishwa ya "
            f"{material} huko {region}."
        )

        return (
            response,
            price_result,
        )

    # ============================================================
    # BUILD NATURAL COST-ESTIMATION RESPONSE
    # ============================================================

    def _build_cost_estimation_response(
        self,
        current_info: dict,
        validation: Optional[dict],
        followup_question: Optional[str],
    ) -> str:
        """
        Create a natural cost-estimation response.

        This avoids repeating the exact same sentence on every
        cost-estimation request.
        """

        location = current_info.get(
            "location"
        )

        building_type = current_info.get(
            "building_type"
        )

        area = current_info.get(
            "area_m2"
        )

        bedrooms = current_info.get(
            "bedrooms"
        )

        floors = current_info.get(
            "floors"
        )

        finishing = current_info.get(
            "finishing"
        )

        # --------------------------------------------------------
        # Build known project details naturally.
        # --------------------------------------------------------

        details = []

        if building_type:
            if (
                str(building_type).lower()
                == "residential"
            ):
                details.append(
                    "nyumba ya makazi"
                )
            else:
                details.append(
                    str(building_type)
                )

        if bedrooms:
            details.append(
                f"vyumba {bedrooms}"
            )

        if floors:
            if str(floors) == "1":
                details.append(
                    "ghorofa moja"
                )
            else:
                details.append(
                    f"ghorofa {floors}"
                )

        if area:
            details.append(
                f"eneo la takribani "
                f"{area:g} m²"
            )

        if finishing:
            details.append(
                f"finishing ya {finishing}"
            )

        # --------------------------------------------------------
        # Location-aware introduction.
        # --------------------------------------------------------

        if location and details:

            project_summary = (
                ", ".join(details)
            )

            response = (
                f"Sawa 😊 Nimeelewa unataka "
                f"kujenga {project_summary} "
                f"huko {location}. "
            )

        elif location:

            response = (
                f"Sawa 😊 Nimeelewa mradi wako "
                f"utakuwa huko {location}. "
            )

        elif details:

            project_summary = (
                ", ".join(details)
            )

            response = (
                f"Sawa 😊 Nimeelewa kuwa unataka "
                f"kujenga {project_summary}. "
            )

        else:

            response = (
                "Sawa 😊 Nimeelewa kuwa unataka "
                "kukadiria gharama ya ujenzi. "
            )

        # --------------------------------------------------------
        # Add useful explanation before follow-up.
        # --------------------------------------------------------

        if (
            area is None
            and followup_question
        ):

            response += (
                "Ili nikupatie makadirio yenye "
                "maana, nahitaji kujua ukubwa "
                "wa nyumba kwa sababu quantities "
                "za vifaa na gharama hutegemea "
                "kwa kiasi kikubwa eneo la jengo. "
            )

            response += (
                f"{followup_question}"
            )

            return response

        # --------------------------------------------------------
        # Other missing information.
        # --------------------------------------------------------

        if followup_question:

            response += (
                "Kabla sijaendelea na makadirio, "
                "nahitaji taarifa moja muhimu "
                "iliyobaki. "
            )

            response += (
                f"{followup_question}"
            )

            return response

        # --------------------------------------------------------
        # Everything is ready.
        # --------------------------------------------------------

        response += (
            "Taarifa ulizotoa zinatosha kuanza "
            "hatua ya makadirio. Sasa tunaweza "
            "kuziunganisha na quantities za kazi "
            "na bei za vifaa kulingana na eneo."
        )

        return response

    # ============================================================
    # MAIN PROCESS MESSAGE
    # ============================================================

    def process_message(
        self,
        user_message: str,
        project_data: Optional[
            dict[str, Any]
        ] = None,
    ) -> dict:

        if (
            not user_message
            or not user_message.strip()
        ):
            raise ValueError(
                "user_message cannot be empty."
            )

        self._response_turn += 1

        # --------------------------------------------------------
        # Current state
        # --------------------------------------------------------

        current_state_before = (
            self._state_to_dict()
        )

        # --------------------------------------------------------
        # Gemini understanding
        # --------------------------------------------------------

        understanding = (
            understand_message(
                user_message=user_message,
                previous_intent=(
                    self.current_intent
                ),
                current_state=(
                    current_state_before
                ),
            )
        )

        detected_intent = (
            understanding.intent
        )

        extracted_info = (
            understanding
            .construction_info
        )

        extracted_dict = (
            self._info_to_dict(
                extracted_info
            )
        )

        # ========================================================
        # SPECIAL CASE:
        # Very short material-price follow-ups can sometimes be
        # classified as UNKNOWN by Gemini. Preserve MATERIAL_PRICE
        # when the previous conversation clearly indicates it.
        # ========================================================

        if (
            detected_intent == "UNKNOWN"
            and self.current_intent
            == "MATERIAL_PRICE"
            and self.last_material_options
        ):

            if self._looks_like_context_followup(
                user_message
            ):
                detected_intent = (
                    "MATERIAL_PRICE"
                )

        # ========================================================
        # OTHERWISE, CHANGE INTENT NORMALLY
        # ========================================================

        self.current_intent = (
            detected_intent
        )

        # --------------------------------------------------------
        # Update conversation state.
        # --------------------------------------------------------

        current_info = (
            self.state.update(
                extracted_info
            )
        )

        validation = None
        followup_question = None
        estimation = None
        response = None
        jenga_context = None

        # ========================================================
        # COST ESTIMATION
        # ========================================================

        if (
            self.current_intent
            == "COST_ESTIMATION"
        ):

            validation = (
                validate_cost_estimation(
                    current_info
                )
            )

            if validation[
                "needs_followup"
            ]:

                followup_question = (
                    generate_followup_question(
                        [
                            validation[
                                "next_question_field"
                            ]
                        ]
                    )
                )

                # Use our more natural response rather
                # than the repeated old template.
                response = (
                    self._build_cost_estimation_response(
                        current_info=self._info_to_dict(
                            current_info
                        ),
                        validation=validation,
                        followup_question=(
                            followup_question
                        ),
                    )
                )

            else:

                # Keep the existing ready response for
                # compatibility with the current engine.
                response = (
                    generate_ready_response(
                        current_info
                    )
                )

                if project_data is not None:

                    estimation = (
                        self._estimate_project(
                            project_data
                        )
                    )

                    response = (
                        generate_estimation_response(
                            estimation
                        )
                    )

                else:

                    # More natural explanation when the
                    # information is ready but no explicit
                    # project_data was passed.
                    response = (
                        self._build_cost_estimation_response(
                            current_info=self._info_to_dict(
                                current_info
                            ),
                            validation=validation,
                            followup_question=None,
                        )
                    )

        # ========================================================
        # MATERIAL PRICE
        # ========================================================

        elif (
            self.current_intent
            == "MATERIAL_PRICE"
        ):

            (
                response,
                jenga_context,
            ) = self._handle_material_price(
                extracted_info=extracted_info,
                user_message=user_message,
            )

        # ========================================================
        # MATERIAL ESTIMATION
        # ========================================================

        elif (
            self.current_intent
            == "MATERIAL_ESTIMATION"
        ):

            area = current_info.get(
                "area_m2"
            )

            building_type = (
                current_info.get(
                    "building_type"
                )
            )

            location = current_info.get(
                "location"
            )

            if area and building_type:

                response = (
                    "Sawa  Nimepata taarifa "
                    f"za {building_type}"
                )

                if location:
                    response += (
                        f" huko {location}"
                    )

                response += (
                    f", lenye eneo la {area:g} m². "
                    "Tunaweza kutumia taarifa hizi "
                    "kuanza kukadiria mahitaji ya "
                    "vifaa vya ujenzi."
                )

            elif area:

                response = (
                    "Sawa  Nimepata eneo la "
                    f"{area:g} m². "
                    "Niambie aina ya jengo ili "
                    "nikusaidie kukadiria mahitaji "
                    "ya vifaa."
                )

            elif location:

                response = (
                    f"Sawa  Nimepata eneo la "
                    f"{location}. "
                    "Sasa nahitaji ukubwa wa jengo "
                    "kwa m² na aina yake."
                )

            else:

                response = (
                    "Karibu  Ili nikadirie "
                    "mahitaji ya vifaa, niambie "
                    "aina ya jengo na ukubwa wake "
                    "kwa m²."
                )

        # ========================================================
        # GENERAL CONSTRUCTION
        # ========================================================

        elif (
            self.current_intent
            == "GENERAL_CONSTRUCTION"
        ):

            response = (
                "Karibu kwenye JENGA AI  "
                "Niambie swali lako kuhusu ujenzi, "
                "gharama, vifaa, msingi, udongo au "
                "mpango wa mradi, na nitakusaidia."
            )

        # ========================================================
        # CONSTRUCTION PLANNING
        # ========================================================

        elif (
            self.current_intent
            == "CONSTRUCTION_PLANNING"
        ):

            location = current_info.get(
                "location"
            )

            building_type = (
                current_info.get(
                    "building_type"
                )
            )

            if location and building_type:

                response = (
                    f"Sawa Tunaweza kupanga "
                    f"mradi wa {building_type} "
                    f"huko {location}. "
                    "Tuanze na ukubwa wa jengo "
                    "na mahitaji makuu ya mradi."
                )

            elif location:

                response = (
                    f"Sawa  Kwa mradi wako wa "
                    f"huko {location}, "
                    "niambie aina na ukubwa wa "
                    "jengo ili tuanze kupanga."
                )

            else:

                response = (
                    "Karibu  Niambie eneo la "
                    "mradi, aina ya jengo na "
                    "ukubwa wake ili tuanze kupanga."
                )

        # ========================================================
        # CONSTRUCTION TIMELINE
        # ========================================================

        elif (
            self.current_intent
            == "CONSTRUCTION_TIMELINE"
        ):

            location = current_info.get(
                "location"
            )

            if location:

                response = (
                    f"Sawa Kwa mradi wa "
                    f"huko {location}, "
                    "muda wa ujenzi utategemea "
                    "aina na ukubwa wa jengo. "
                    "Niambie ukubwa na aina ya jengo."
                )

            else:

                response = (
                    "Sawa  Ili nikadirie "
                    "timeline ya ujenzi vizuri, "
                    "niambie aina na ukubwa wa jengo."
                )

        # ========================================================
        # SOIL QUESTION
        # ========================================================

        elif (
            self.current_intent
            == "SOIL_QUESTION"
        ):

            location = current_info.get(
                "location"
            )

            if location:

                response = (
                    f"Sawa  Kwa eneo la "
                    f"{location}, ninaweza kukusaidia "
                    "kuhusu aina ya udongo, uwezo "
                    "wa kubeba mzigo na mambo ya "
                    "msingi. Niambie hasa ungependa "
                    "kujua nini."
                )

            else:

                response = (
                    "Karibu  Niambie eneo la "
                    "mradi ili nikusaidie kuhusu "
                    "aina ya udongo na mambo ya msingi."
                )

        # ========================================================
        # REGULATION QUESTION
        # ========================================================

        elif (
            self.current_intent
            == "REGULATION_QUESTION"
        ):

            response = (
                "Sawa Niambie kanuni, kibali "
                "au utaratibu wa ujenzi unaotaka "
                "kufahamu, na nitakuelezea kwa "
                "ufafanuzi."
            )

        # ========================================================
        # ENGINEERING QUESTION
        # ========================================================

        elif (
            self.current_intent
            == "ENGINEERING_QUESTION"
        ):

            response = (
                "Sawa Niambie swali la "
                "engineering unalotaka kujua. "
                "Nitaelezea kwa lugha rahisi na "
                "kuonyesha hatua muhimu."
            )

        # ========================================================
        # UNKNOWN
        # ========================================================

        else:

            response = (
                "Karibu kwenye JENGA AI "
                "Niambie unahitaji msaada gani "
                "kuhusu ujenzi."
            )

        # ========================================================
        # RETURN RESULT
        # ========================================================

        return {
            "intent": self.current_intent,

            "intent_confidence": (
                understanding.confidence
            ),

            "extracted_info": (
                self._info_to_dict(
                    extracted_info
                )
            ),

            "conversation_state": (
                self._info_to_dict(
                    current_info
                )
            ),

            "validation": validation,

            "followup_question": (
                followup_question
            ),

            "estimation": estimation,

            "response": response,

            "jenga_context": (
                jenga_context
            ),

            "conversation_context": {
                "last_material_category": (
                    self.last_material_category
                ),
                "last_material_request": (
                    self.last_material_request
                ),
                "last_material_region": (
                    self.last_material_region
                ),
                "last_material_options": (
                    self.last_material_options
                ),
            },
        }

    # ============================================================
    # PROJECT ESTIMATION
    # ============================================================

    def _estimate_project(
        self,
        project_data: dict[str, Any],
    ) -> dict:

        if not isinstance(
            project_data,
            dict,
        ):
            raise TypeError(
                "project_data must be a dictionary."
            )

        return (
            self.project_cost_estimator
            .estimate_project(
                project_data
            )
        )