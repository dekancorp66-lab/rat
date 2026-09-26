from engine.extractor import ConstructionInfo
from engine.conversation_state import ConversationState
from engine.validator import validate_cost_estimation
from engine.followup import generate_followup_question
from engine.response_generator import (
    generate_followup_response,
    generate_ready_response,
)


def test_initial_missing_information():
    """
    Test a new conversation where the user only provides
    the location and asks for a cost estimate.
    """

    state = ConversationState()

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
    )

    state.update(info)

    validation = validate_cost_estimation(
        state.get_info()
    )

    assert validation["can_estimate"] is False
    assert "area_m2" in validation["missing_required"]
    assert validation["next_question_field"] == "area_m2"


def test_followup_question():
    """
    Test whether the correct follow-up question is generated.
    """

    question = generate_followup_question(
        ["area_m2"]
    )

    assert question is not None
    assert "square meters" in question


def test_state_keeps_previous_information():
    """
    Test that new information is added without deleting
    information collected earlier.
    """

    state = ConversationState()

    # First user message
    first_info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
    )

    state.update(first_info)

    # User answers the follow-up question
    second_info = ConstructionInfo(
        area_m2=120
    )

    state.update(second_info)

    current = state.get_info()

    assert current.location == "Mbeya"
    assert current.building_type == "residential"
    assert current.area_m2 == 120


def test_cost_estimation_becomes_ready():
    """
    Test that validation changes after the missing
    required information is provided.
    """

    state = ConversationState()

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    state.update(info)

    validation = validate_cost_estimation(
        state.get_info()
    )

    assert validation["can_estimate"] is True
    assert validation["missing_required"] == []


def test_optional_information_is_detected():
    """
    Required information is complete, but important details
    are still missing.
    """

    state = ConversationState()

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    state.update(info)

    validation = validate_cost_estimation(
        state.get_info()
    )

    assert "finishing" in validation["missing_important"]
    assert "floors" in validation["missing_important"]
    assert validation["next_question_field"] == "finishing"


def test_missing_important_information():
    """
    Test that the validator knows when important information
    is missing even though required information is complete.
    """

    state = ConversationState()

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    state.update(info)

    validation = validate_cost_estimation(
        state.get_info()
    )

    assert validation["can_estimate"] is True
    assert validation["needs_followup"] is True
    assert validation["next_question_field"] == "finishing"


def test_finishing_followup_question():
    """
    Test the finishing-related follow-up question.
    """

    question = generate_followup_question(
        ["finishing"]
    )

    assert question == (
        "Unataka finishing ya kiwango gani: basic, standard au high-end?"
    )


def test_followup_question_for_floors():
    """
    Test the floor-related follow-up question.
    """

    question = generate_followup_question(
        ["floors"]
    )

    assert question == "Nyumba itakuwa na floor ngapi?"


def test_followup_response_uses_context():
    """
    Test that the follow-up response includes information
    already collected from the user.
    """

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    question = (
        "Unataka finishing ya kiwango gani: "
        "basic, standard au high-end?"
    )

    response = generate_followup_response(
        info,
        question,
    )

    assert "Mbeya" in response
    assert "120" in response
    assert "finishing" in response


def test_ready_response():
    """
    Test the response generated when enough information
    is available to move to the next stage.
    """

    info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    response = generate_ready_response(info)

    assert "Mbeya" in response
    assert "120" in response
    assert "Tunaweza kuendelea" in response
    
def test_pending_finishing_answer():
    """
    Test that a finishing answer is applied to the
    field currently being requested.
    """

    state = ConversationState()

    state.info = ConstructionInfo(
        location="Mbeya",
        building_type="residential",
        area_m2=120,
    )

    state.set_pending_field("finishing")

    state.apply_pending_answer("Standard")

    current = state.get_info()

    assert current.location == "Mbeya"
    assert current.area_m2 == 120
    assert current.finishing == "standard"
    assert state.pending_field is None


def test_pending_floors_answer():
    """
    Test that a floor answer is converted to an integer.
    """

    state = ConversationState()

    state.set_pending_field("floors")

    state.apply_pending_answer("2")

    current = state.get_info()

    assert current.floors == 2
    assert state.pending_field is None


def test_pending_area_answer():
    """
    Test that an area answer such as '120 sqm'
    is converted to a numeric value.
    """

    state = ConversationState()

    state.set_pending_field("area_m2")

    state.apply_pending_answer("120 sqm")

    current = state.get_info()

    assert current.area_m2 == 120
    assert state.pending_field is None