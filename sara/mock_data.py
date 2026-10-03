"""Survey-free demo: event tags plus view/scroll/save history.

Event and interaction dates are explicit UTC timestamps.
"""

from datetime import datetime, timezone

from recommender import Event, Interaction, User


AS_OF = datetime(2026, 10, 3, 12, tzinfo=timezone.utc)


def make_mock_data() -> tuple[list[User], list[Event], list[Interaction]]:
    users = [
        # No declared interests: all personalization comes from interactions.
        User("alice", "Alice"),
        User("bob", "Bob"),
        User("carol", "Carol"),
        User("dan", "Dan"),
        User("eve", "Eve"),
        User("frank", "Frank"),
        User("grace", "Grace"),
        User("hannah", "Hannah"),
        User("ivan", "Ivan"),
        User("julia", "Julia"),
        User("new", "New user"),
        User("new_no_interests", "Another new user"),
    ]
    specs = [
        ("past_ai", "AI community meetup", ("technology", "ai"), "2026-09-13T12:00:00+00:00"),
        ("past_python", "Python workshop", ("technology", "coding"), "2026-09-23T12:00:00+00:00"),
        ("past_jazz", "Jazz night", ("music", "jazz"), "2026-09-18T12:00:00+00:00"),
        ("past_hike", "Weekend hike", ("outdoors", "fitness"), "2026-09-25T12:00:00+00:00"),
        ("ai_lab", "Hands-on AI lab", ("technology", "ai", "coding"), "2026-10-10T12:00:00+00:00"),
        ("hackathon", "Community hackathon", ("technology", "coding"), "2026-10-17T12:00:00+00:00"),
        ("tech_careers", "Careers in technology", ("technology", "career"), "2026-10-13T12:00:00+00:00"),
        ("jazz_festival", "Autumn jazz festival", ("music", "jazz"), "2026-10-12T12:00:00+00:00"),
        ("gallery", "Gallery opening", ("art", "culture"), "2026-10-08T12:00:00+00:00"),
        ("trail_run", "Forest trail run", ("outdoors", "fitness"), "2026-10-15T12:00:00+00:00"),
        ("new_ai", "New AI research evening", ("technology", "ai"), "2026-10-21T12:00:00+00:00"),
        ("ml_workshop", "Machine learning workshop", ("technology", "ai", "coding"), "2026-10-22T12:00:00+00:00"),
        ("data_science", "Data science meetup", ("technology", "ai", "data"), "2026-10-23T12:00:00+00:00"),
        ("python_lab", "Python coding lab", ("technology", "coding"), "2026-10-24T12:00:00+00:00"),
        ("robotics", "Robotics evening", ("technology", "ai", "robotics"), "2026-10-25T12:00:00+00:00"),
        ("web_workshop", "Web development workshop", ("technology", "coding", "web"), "2026-10-26T12:00:00+00:00"),
        ("cloud_meetup", "Cloud engineering meetup", ("technology", "cloud"), "2026-10-27T12:00:00+00:00"),
        ("cybersecurity", "Cybersecurity talks", ("technology", "security"), "2026-10-28T12:00:00+00:00"),
        ("ai_ethics", "Responsible AI discussion", ("technology", "ai"), "2026-10-29T12:00:00+00:00"),
        ("open_source", "Open source coding night", ("technology", "coding"), "2026-10-30T12:00:00+00:00"),
        ("tech_networking", "Technology networking", ("technology", "career"), "2026-10-31T12:00:00+00:00"),
        ("park_run", "Morning park run", ("outdoors", "fitness"), "2026-10-09T12:00:00+00:00"),
        ("forest_hike", "Forest hiking group", ("outdoors", "fitness", "hiking"), "2026-10-11T12:00:00+00:00"),
        ("outdoor_yoga", "Yoga in the park", ("outdoors", "fitness", "yoga"), "2026-10-14T12:00:00+00:00"),
        ("cycling", "Community cycling ride", ("outdoors", "fitness", "cycling"), "2026-10-16T12:00:00+00:00"),
        ("bootcamp", "Outdoor fitness bootcamp", ("outdoors", "fitness"), "2026-10-18T12:00:00+00:00"),
        ("nordic_walk", "Nordic walking session", ("outdoors", "fitness"), "2026-10-19T12:00:00+00:00"),
        ("hill_run", "Hill running practice", ("outdoors", "fitness"), "2026-10-20T12:00:00+00:00"),
        ("lake_walk", "Active walk by the lake", ("outdoors", "fitness"), "2026-10-22T12:00:00+00:00"),
        ("weekend_trek", "Weekend trekking trip", ("outdoors", "fitness", "hiking"), "2026-10-24T12:00:00+00:00"),
        ("stretching", "Outdoor stretching class", ("outdoors", "fitness"), "2026-10-26T12:00:00+00:00"),
        ("charity_run", "Charity running event", ("outdoors", "fitness"), "2026-10-28T12:00:00+00:00"),
        ("urban_hike", "Active city hike", ("outdoors", "fitness"), "2026-10-30T12:00:00+00:00"),
        ("jazz_club", "Jazz club evening", ("music", "jazz"), "2026-10-16T12:00:00+00:00"),
        ("live_concert", "Live music concert", ("music", "live"), "2026-10-18T12:00:00+00:00"),
        ("piano_night", "Jazz piano night", ("music", "jazz"), "2026-10-20T12:00:00+00:00"),
        ("art_workshop", "Painting workshop", ("art", "culture"), "2026-10-22T12:00:00+00:00"),
        ("museum_tour", "Museum evening tour", ("art", "culture"), "2026-10-24T12:00:00+00:00"),
    ]
    events = [Event(eid, title, tags, datetime.fromisoformat(starts_at), "Warsaw")
              for eid, title, tags, starts_at in specs]
    # Each row: (user_id, event_id, scroll_percent, occurred_at).
    # scroll_percent is the maximum page depth reached, from 0 to 100.
    # occurred_at orders the user's recent history; inactivity does not decay it.
    # No survey, booking, or attendance data is used.
    behavior = [
        ("alice", "past_ai", 100, "2026-09-13T12:00:00+00:00"),
        ("alice", "past_python", 10, "2026-09-22T12:00:00+00:00"),
        ("bob", "past_ai", 100, "2026-09-13T12:00:00+00:00"),
        ("bob", "past_python", 100, "2026-09-23T12:00:00+00:00"),
        ("bob", "ai_lab", 60, "2026-10-01T12:00:00+00:00"),
        ("bob", "hackathon", 30, "2026-10-02T12:00:00+00:00"),
        ("carol", "past_ai", 10, "2026-09-12T12:00:00+00:00"),
        ("carol", "past_python", 100, "2026-09-23T12:00:00+00:00"),
        ("carol", "hackathon", 60, "2026-09-30T12:00:00+00:00"),
        ("carol", "tech_careers", 30, "2026-10-01T12:00:00+00:00"),
        ("dan", "past_jazz", 100, "2026-09-18T12:00:00+00:00"),
        ("dan", "jazz_festival", 60, "2026-10-02T12:00:00+00:00"),
        ("dan", "gallery", 30, "2026-10-01T12:00:00+00:00"),
        ("eve", "past_hike", 100, "2026-09-25T12:00:00+00:00"),
        ("eve", "trail_run", 60, "2026-10-02T12:00:00+00:00"),
        ("eve", "jazz_festival", 10, "2026-09-30T12:00:00+00:00"),
        ("frank", "past_hike", 100, "2026-09-25T12:00:00+00:00"),
        ("frank", "trail_run", 90, "2026-10-02T12:00:00+00:00"),
        ("frank", "park_run", 75, "2026-10-01T12:00:00+00:00"),
        ("frank", "forest_hike", 85, "2026-09-30T12:00:00+00:00"),
        ("frank", "cycling", 60, "2026-10-01T12:00:00+00:00"),
        ("frank", "bootcamp", 55, "2026-10-02T12:00:00+00:00"),
        ("grace", "past_hike", 85, "2026-09-26T12:00:00+00:00"),
        ("grace", "trail_run", 80, "2026-10-01T12:00:00+00:00"),
        ("grace", "outdoor_yoga", 95, "2026-10-02T12:00:00+00:00"),
        ("grace", "nordic_walk", 70, "2026-10-01T12:00:00+00:00"),
        ("grace", "stretching", 90, "2026-09-30T12:00:00+00:00"),
        ("grace", "lake_walk", 50, "2026-10-01T12:00:00+00:00"),
        ("grace", "charity_run", 65, "2026-10-02T12:00:00+00:00"),
        ("hannah", "past_ai", 90, "2026-09-15T12:00:00+00:00"),
        ("hannah", "past_python", 70, "2026-09-24T12:00:00+00:00"),
        ("hannah", "ai_lab", 95, "2026-10-02T12:00:00+00:00"),
        ("hannah", "ml_workshop", 85, "2026-10-01T12:00:00+00:00"),
        ("hannah", "data_science", 70, "2026-09-30T12:00:00+00:00"),
        ("hannah", "robotics", 50, "2026-10-01T12:00:00+00:00"),
        ("ivan", "past_python", 90, "2026-09-25T12:00:00+00:00"),
        ("ivan", "past_ai", 30, "2026-09-15T12:00:00+00:00"),
        ("ivan", "python_lab", 80, "2026-10-02T12:00:00+00:00"),
        ("ivan", "web_workshop", 65, "2026-10-01T12:00:00+00:00"),
        ("ivan", "open_source", 75, "2026-09-30T12:00:00+00:00"),
        ("ivan", "hackathon", 50, "2026-10-01T12:00:00+00:00"),
        ("julia", "past_jazz", 95, "2026-09-19T12:00:00+00:00"),
        ("julia", "jazz_festival", 85, "2026-10-01T12:00:00+00:00"),
        ("julia", "jazz_club", 70, "2026-10-02T12:00:00+00:00"),
        ("julia", "piano_night", 80, "2026-09-30T12:00:00+00:00"),
        ("julia", "live_concert", 40, "2026-10-01T12:00:00+00:00"),
        ("dan", "art_workshop", 60, "2026-10-02T12:00:00+00:00"),
        ("dan", "museum_tour", 45, "2026-10-01T12:00:00+00:00"),
    ]
    interactions = [Interaction(uid, eid, scroll, datetime.fromisoformat(occurred_at))
                    for uid, eid, scroll, occurred_at in behavior]
    interactions.extend([
        Interaction("bob", "ai_lab", None, datetime.fromisoformat("2026-10-02T12:00:00+00:00"), action="save"),
        Interaction("carol", "past_python", None, datetime.fromisoformat("2026-09-23T12:00:00+00:00"), action="save"),
        # Eve returns twice on the same day. Updates within a visit share its ID.
        Interaction("eve", "trail_run", 30, datetime.fromisoformat("2026-10-03T09:00:00+00:00"), session_id="eve-trail-morning"),
        Interaction("eve", "trail_run", 70, datetime.fromisoformat("2026-10-03T09:05:00+00:00"), session_id="eve-trail-morning"),
        Interaction("eve", "trail_run", 80, datetime.fromisoformat("2026-10-03T11:00:00+00:00"), session_id="eve-trail-return"),
    ])
    return users, events, interactions