"""Simple recommendation entry point using the fixed demo dataset."""

from mock_data import AS_OF, make_mock_data
from recommender import EventRecommender


def get_recommended_event_ids(user_id: str, limit: int = 12) -> list[str]:
    """Return up to 12 event IDs by default, in recommendation order.

    Allows previously viewed/saved events; excludes past events and unrelated
    filler when personalized matches exist. An unknown user or invalid
    limit raises ValueError. Replace the mock loader with real data for production.
    Uses each user's latest 100 distinct event histories without calendar decay.
    """
    users, events, interactions = make_mock_data()
    model = EventRecommender(users, events, interactions, as_of=AS_OF)
    return [result.event.id for result in model.recommend(
        user_id, limit=limit, exclude_seen=False, relevant_only=True,
    )]