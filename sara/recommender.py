"""Dependency-free hybrid recommendations from implicit event feedback.

Scores are ranking signals, not probabilities. Keep past events in the catalog
so their interactions can still inform recommendations for upcoming events.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from math import isfinite, sqrt
from typing import Iterable


# A page visit is weak interest; full scrolling is stronger, not proof of reading.
VIEW_WEIGHT = 1.0
MAX_SCROLL_WEIGHT = 8.0
SAVE_WEIGHT = 10.0
MAX_ENGAGEMENT_WEIGHT = max(MAX_SCROLL_WEIGHT, SAVE_WEIGHT)
REVISIT_BONUS_PER_VISIT = 0.05
MAX_REVISIT_BONUS = 0.20


@dataclass(frozen=True)
class User:
    id: str
    name: str
    interests: tuple[str, ...] = ()


@dataclass(frozen=True)
class Event:
    id: str
    title: str
    tags: tuple[str, ...]
    starts_at: datetime
    city: str


@dataclass(frozen=True)
class Interaction:
    """Page feedback; session_id identifies one page visit across scroll updates.

    Use a new session_id for each return to the page, not every scroll update.
    Without it, views are conservatively grouped into one visit per UTC day.
    """

    user_id: str
    event_id: str
    scroll_percent: float | None
    occurred_at: datetime
    action: str = "view"
    session_id: str | None = None


@dataclass(frozen=True)
class Recommendation:
    event: Event
    score: float
    collaborative_score: float
    content_score: float
    popularity_score: float
    reasons: tuple[str, ...]


def _aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


def _cosine(left: dict[str, float], right: dict[str, float]) -> float:
    denominator = sqrt(sum(v * v for v in left.values())) * sqrt(
        sum(v * v for v in right.values())
    )
    if not denominator:
        return 0.0
    return sum(value * right.get(key, 0.0) for key, value in left.items()) / denominator


class EventRecommender:
    """User-neighbor collaborative filtering + tag affinity + popularity.

    Keep each user's 100 most recently interacted-with distinct events by default.
    Use the strongest view/save engagement per event, not sums of scroll updates.
    Distinct return visits boost view engagement by 5% each, capped at 20%.
    Time decay is opt-in so inactivity alone does not erase learned preferences.
    Similar users are found by cosine similarity over shared event history.
    """

    def __init__(
        self,
        users: Iterable[User],
        events: Iterable[Event],
        interactions: Iterable[Interaction],
        *,
        as_of: datetime | None = None,
        half_life_days: float | None = None,
        neighbor_limit: int = 20,
        history_limit: int = 100,
    ) -> None:
        self.as_of = as_of if as_of is not None else datetime.now(timezone.utc)
        if not _aware(self.as_of):
            raise ValueError("as_of must be timezone-aware")
        if half_life_days is not None and (not isfinite(half_life_days) or half_life_days <= 0):
            raise ValueError("half_life_days must be finite and positive")
        if isinstance(history_limit, bool) or not isinstance(history_limit, int) or history_limit < 1:
            raise ValueError("history_limit must be a positive integer")
        if isinstance(neighbor_limit, bool) or not isinstance(neighbor_limit, int) or neighbor_limit < 1:
            raise ValueError("neighbor_limit must be a positive integer")
        user_list, event_list = list(users), list(events)
        self.users = {user.id: user for user in user_list}
        self.events = {event.id: event for event in event_list}
        if len(self.users) != len(user_list) or len(self.events) != len(event_list):
            raise ValueError("User IDs and event IDs must each be unique")
        if any(not _aware(event.starts_at) for event in event_list):
            raise ValueError("Event timestamps must be timezone-aware")
        self.neighbor_limit = neighbor_limit
        self.history: dict[str, dict[str, float]] = {user_id: {} for user_id in self.users}
        self.saved: dict[str, set[str]] = {user_id: set() for user_id in self.users}
        # Latest timestamp and maximum scroll are independent aggregates.
        self.history_latest_at: dict[str, dict[str, datetime]] = {uid: {} for uid in self.users}
        self.history_scroll_percent: dict[str, dict[str, float]] = {uid: {} for uid in self.users}
        last_seen: dict[str, dict[str, datetime]] = {user_id: {} for user_id in self.users}
        visits: dict[tuple[str, str], set[tuple[str, str]]] = {}
        view_peaks: dict[tuple[str, str], float] = {}
        for interaction in interactions:
            if interaction.user_id not in self.users or interaction.event_id not in self.events:
                raise ValueError("Interaction references an unknown user or event")
            if interaction.action not in ("view", "save"):
                raise ValueError("action must be 'view' or 'save'")
            if interaction.session_id is not None and (
                not isinstance(interaction.session_id, str) or not interaction.session_id.strip()
            ):
                raise ValueError("session_id must be a nonempty string or None")
            scroll = interaction.scroll_percent
            if scroll is None:
                if interaction.action != "save":
                    raise ValueError("View interactions require scroll_percent")
            elif (
                isinstance(scroll, bool) or not isinstance(scroll, (int, float))
                or not isfinite(scroll) or not 0 <= scroll <= 100
            ):
                raise ValueError("scroll_percent must be a finite number between 0 and 100")
            if not _aware(interaction.occurred_at):
                raise ValueError("Interaction timestamps must be timezone-aware")
            # Ignore future observations, including when evaluating historical snapshots.
            if interaction.occurred_at > self.as_of:
                continue
            if interaction.action == "save":
                engagement = SAVE_WEIGHT
                self.saved[interaction.user_id].add(interaction.event_id)
            else:
                assert scroll is not None
                engagement = VIEW_WEIGHT + (MAX_SCROLL_WEIGHT - VIEW_WEIGHT) * scroll / 100
            weight = engagement
            if half_life_days is not None:
                age_days = (self.as_of - interaction.occurred_at).total_seconds() / 86400
                weight *= 0.5 ** (age_days / half_life_days)
            if interaction.action == "view":
                assert scroll is not None
                scroll_history = self.history_scroll_percent[interaction.user_id]
                scroll_history[interaction.event_id] = max(
                    scroll_history.get(interaction.event_id, 0.0), scroll,
                )
                pair = (interaction.user_id, interaction.event_id)
                visit = ("session", interaction.session_id) if interaction.session_id is not None else (
                    "day", interaction.occurred_at.astimezone(timezone.utc).date().isoformat(),
                )
                visits.setdefault(pair, set()).add(visit)
                view_peaks[pair] = max(view_peaks.get(pair, 0.0), weight)
            history = self.history[interaction.user_id]
            history[interaction.event_id] = max(history.get(interaction.event_id, 0.0), weight)
            latest = last_seen[interaction.user_id]
            latest[interaction.event_id] = max(
                latest.get(interaction.event_id, interaction.occurred_at), interaction.occurred_at,
            )

        for (user_id, event_id), peak in view_peaks.items():
            bonus = min(MAX_REVISIT_BONUS,
                        REVISIT_BONUS_PER_VISIT * (len(visits[(user_id, event_id)]) - 1))
            self.history[user_id][event_id] = max(self.history[user_id][event_id], peak * (1 + bonus))

        # Choose recent distinct events independently of input order or repeated clicks.
        for user_id, latest in last_seen.items():
            retained = sorted(latest, key=lambda eid: (-latest[eid].timestamp(), eid))[:history_limit]
            self.history[user_id] = {eid: self.history[user_id][eid] for eid in retained}
            self.history_latest_at[user_id] = {eid: latest[eid] for eid in retained}
            self.history_scroll_percent[user_id] = {
                eid: self.history_scroll_percent[user_id][eid] for eid in retained
                if eid in self.history_scroll_percent[user_id]
            }
            self.saved[user_id].intersection_update(retained)

    def recommend(
        self,
        user_id: str,
        limit: int = 5,
        *,
        city: str | None = None,
        exclude_seen: bool = True,
        relevant_only: bool = False,
    ) -> list[Recommendation]:
        """Return upcoming events ranked using view and save history.

        Set exclude_seen=False to resurface previously viewed/saved events.
        Set relevant_only=True to prioritize tag affinity (70%), neighbors (20%),
        and popularity (10%), without padding tag matches with unrelated events.
        Neither scrolling nor saving implies registration or attendance.
        New users fall back to declared interests and community popularity.
        """
        if user_id not in self.users:
            raise ValueError(f"Unknown user: {user_id}")
        if isinstance(limit, bool) or not isinstance(limit, int) or limit < 0:
            raise ValueError("limit must be a nonnegative integer")
        if limit == 0:
            return []
        history = self.history[user_id]
        excluded = set(history) if exclude_seen else set()
        candidates = [
            event for event in self.events.values()
            if event.id not in excluded and event.starts_at > self.as_of
            and (city is None or event.city.casefold() == city.casefold())
        ]
        if not candidates:
            return []

        neighbors = sorted(
            ((other_id, _cosine(history, other_history))
             for other_id, other_history in self.history.items() if other_id != user_id),
            key=lambda pair: (-pair[1], pair[0]),
        )
        neighbors = [(uid, similarity) for uid, similarity in neighbors if similarity > 0][
            :self.neighbor_limit
        ]
        # Normalize each neighbor's feedback so very active users do not dominate.
        collaborative = {event.id: 0.0 for event in candidates}
        supporters: dict[str, int] = {event.id: 0 for event in candidates}
        save_supporters: dict[str, int] = {event.id: 0 for event in candidates}
        similarity_total = sum(similarity for _, similarity in neighbors)
        for other_id, similarity in neighbors:
            other_history = self.history[other_id]
            peak = max(other_history.values(), default=0.0)
            if not peak:
                continue
            for event in candidates:
                strength = other_history.get(event.id, 0.0)
                collaborative[event.id] += similarity * strength / peak / similarity_total
                if strength > 0:
                    supporters[event.id] += 1
                    if event.id in self.saved[other_id]:
                        save_supporters[event.id] += 1

        profile = {tag.casefold(): 1.0 for tag in self.users[user_id].interests}
        for event_id, strength in history.items():
            tags = set(tag.casefold() for tag in self.events[event_id].tags)
            for tag in tags:
                profile[tag] = profile.get(tag, 0.0) + strength / len(tags)
        content = {
            event.id: _cosine(profile, {tag.casefold(): 1.0 for tag in event.tags})
            for event in candidates
        }
        # One bounded contribution per user, not a raw count of clicks.
        popularity = {
            event.id: sum(
                other_history.get(event.id, 0.0) / MAX_ENGAGEMENT_WEIGHT
                for uid, other_history in self.history.items() if uid != user_id
            ) for event in candidates
        }
        popularity_peak = max(popularity.values(), default=0.0)
        if popularity_peak:
            popularity = {eid: value / popularity_peak for eid, value in popularity.items()}

        has_collaborative = any(collaborative.values())
        has_content = any(content.values())
        # Reallocate absent signals instead of penalizing cold-start users/events.
        collaborative_weight, content_weight = (0.2, 0.7) if relevant_only else (0.6, 0.3)
        weights = [collaborative_weight if has_collaborative else 0.0,
               content_weight if has_content else 0.0, 0.1]
        total_weight = sum(weights)
        weights = [weight / total_weight for weight in weights]
        recommendations = []
        for event in candidates:
            collab, affinity, popular = collaborative[event.id], content[event.id], popularity[event.id]
            if relevant_only:
                if has_content and affinity == 0:
                    continue
                if not has_content and has_collaborative and collab == 0:
                    continue
                # A known tag profile with no matching candidates is not a cold start.
                if profile and not has_content and not has_collaborative:
                    continue
            reasons = []
            if collab > 0:
                people = "person" if supporters[event.id] == 1 else "people"
                reasons.append(
                    f"{supporters[event.id]} {people} with similar event history "
                    "also viewed or saved this event"
                )
                if save_supporters[event.id]:
                    reasons.append("Saved by people with similar event history")
            matching_tags = sorted(
                {tag.casefold() for tag in event.tags} & profile.keys(),
                key=lambda tag: (-profile[tag], tag),
            )
            if affinity > 0:
                reasons.append("Matches your interests/history: " + ", ".join(matching_tags[:3]))
            if popular > 0:
                reasons.append("Popular with other users")
            if not reasons:
                reasons.append("Upcoming event to explore (not enough history yet)")
            score = weights[0] * collab + weights[1] * affinity + weights[2] * popular
            recommendations.append(Recommendation(event, score, collab, affinity, popular, tuple(reasons)))
        return sorted(
            recommendations, key=lambda result: (-result.score, result.event.starts_at, result.event.id)
        )[:limit]