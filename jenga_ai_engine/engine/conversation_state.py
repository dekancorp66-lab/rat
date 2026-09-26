  
from engine.extractor import ConstructionInfo


class ConversationState:
    """
    Stores information collected during a JENGA AI conversation.
    """

    def __init__(self):
        self.info = ConstructionInfo()

        # The field the AI is currently waiting for
        self.pending_field = None

        # The main intent of the current conversation
        self.current_intent = None

    def update(self, new_info: ConstructionInfo) -> ConstructionInfo:
        """
        Merge newly extracted information with existing information.
        """

        current_data = self.info.model_dump()
        new_data = new_info.model_dump()

        for field, value in new_data.items():
            if value is not None:
                current_data[field] = value

        self.info = ConstructionInfo(**current_data)

        return self.info

    def set_intent(self, intent: str):
        """
        Store the current conversation intent.
        """
        self.current_intent = intent

    def set_pending_field(self, field: str | None):
        """
        Store the field the system is currently asking the user about.
        """
        self.pending_field = field

    def apply_pending_answer(self, answer: str):
        """
        Apply a short user answer to the field currently being requested.
        This handles simple fields locally without calling the LLM.
        """

        if not self.pending_field:
            return self.info

        field = self.pending_field
        value = answer.strip()

        if not value:
            return self.info

        # -----------------------------
        # FINISHING
        # -----------------------------
        if field == "finishing":

            normalized = value.lower()

            if "basic" in normalized:
                value = "basic"

            elif "standard" in normalized:
                value = "standard"

            elif "high-end" in normalized or "high end" in normalized:
                value = "high-end"

            else:
                value = value

            data = self.info.model_dump()
            data["finishing"] = value

        # -----------------------------
        # FLOORS
        # -----------------------------
        elif field == "floors":

            try:
                value = int(value)
            except ValueError:
                return self.info

            data = self.info.model_dump()
            data["floors"] = value

        # -----------------------------
        # BEDROOMS
        # -----------------------------
        elif field == "bedrooms":

            try:
                value = int(value)
            except ValueError:
                return self.info

            data = self.info.model_dump()
            data["bedrooms"] = value

        # -----------------------------
        # AREA
        # -----------------------------
        elif field == "area_m2":

            cleaned = (
                value.lower()
                .replace("sqm", "")
                .replace("m²", "")
                .replace("m2", "")
                .strip()
            )

            try:
                value = float(cleaned)
            except ValueError:
                return self.info

            data = self.info.model_dump()
            data["area_m2"] = value

        else:
            # For fields not yet handled locally,
            # do not make an unsupported assumption.
            return self.info

        self.info = ConstructionInfo(**data)

        # Field has now been answered
        self.pending_field = None

        return self.info

    def get_info(self) -> ConstructionInfo:
        """
        Return current construction information.
        """
        return self.info

    def reset(self):
        """
        Reset the conversation state.
        """
        self.info = ConstructionInfo()
        self.pending_field = None
        self.current_intent = None