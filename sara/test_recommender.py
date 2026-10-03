"""Run from the repository root with unittest discovery in the sara directory."""

from datetime import datetime, timedelta, timezone
import unittest
from unittest.mock import patch

from mock_data import AS_OF, make_mock_data
from recommendations import get_recommended_event_ids
from recommender import Event, EventRecommender, Interaction, User


class EventRecommenderTests(unittest.TestCase):
    def setUp(self):
        self.users, self.events, self.interactions = make_mock_data()
        self.model = EventRecommender(self.users, self.events, self.interactions, as_of=AS_OF)

    def test_mock_event_dates_are_explicit_and_do_not_shift_with_as_of(self):
        later_model = EventRecommender(self.users, self.events, self.interactions,
                                      as_of=AS_OF + timedelta(days=30))
        self.assertEqual(self.events, list(later_model.events.values()))
        self.assertEqual(self.model.history, later_model.history)
        ai_lab = next(event for event in self.events if event.id == "ai_lab")
        self.assertEqual(ai_lab.starts_at, datetime(2026, 10, 10, 12, tzinfo=timezone.utc))

    def test_similar_users_recommend_ai_lab(self):
        results = self.model.recommend("alice")
        self.assertEqual(results[0].event.id, "ai_lab")
        self.assertGreater(results[0].collaborative_score, 0)
        self.assertIn("similar event history", results[0].reasons[0])

    def test_recommended_event_ids_preserve_ranking_for_each_user(self):
        for user in self.users:
            with self.subTest(user_id=user.id):
                expected = [result.event.id for result in self.model.recommend(
                    user.id, limit=12, exclude_seen=False, relevant_only=True,
                )]
                self.assertEqual(get_recommended_event_ids(user.id), expected)

    def test_eve_gets_fitness_first_without_unrelated_ai_filler(self):
        ids = get_recommended_event_ids("eve")
        self.assertEqual(ids[0], "trail_run")
        self.assertIn("jazz_festival", get_recommended_event_ids("eve", limit=100))
        self.assertNotIn("ai_lab", ids)
        self.assertNotIn("hackathon", ids)
        self.assertNotIn("gallery", ids)

    def test_personalized_entry_point_keeps_cold_start_popularity(self):
        expected = self.model.recommend("new_no_interests", limit=12)
        self.assertEqual(get_recommended_event_ids("new_no_interests"), [r.event.id for r in expected])

    def test_history_without_matching_upcoming_events_returns_empty(self):
        events = [
            Event("ai", "AI", ("technology",), AS_OF + timedelta(days=1), "Warsaw"),
            Event("hike", "Hike", ("fitness",), AS_OF - timedelta(days=1), "Warsaw"),
        ]
        history = [Interaction("eve", "hike", 100, AS_OF - timedelta(days=2))]
        with patch("recommendations.make_mock_data", return_value=(self.users, events, history)):
            self.assertEqual(get_recommended_event_ids("eve"), [])

    def test_recommended_event_ids_default_returns_top_12(self):
        events = [
            Event(str(i), f"Event {i}", ("technology",), AS_OF + timedelta(days=i + 1), "Warsaw")
            for i in range(15)
        ]
        with patch("recommendations.make_mock_data", return_value=(self.users, events, [])):
            self.assertEqual(get_recommended_event_ids("alice"), [str(i) for i in range(12)])

    def test_recommended_event_ids_limits_and_unknown_user(self):
        self.assertEqual(get_recommended_event_ids("alice", limit=0), [])
        self.assertEqual(get_recommended_event_ids("alice", limit=1), ["ai_lab"])
        with self.assertRaises(ValueError):
            get_recommended_event_ids("missing")
        with self.assertRaises(ValueError):
            get_recommended_event_ids("alice", limit=-1)

    def test_seen_and_past_events_are_excluded(self):
        for user in self.users:
            for result in self.model.recommend(user.id, limit=100):
                self.assertNotIn(result.event.id, self.model.history[user.id])
                self.assertGreater(result.event.starts_at, AS_OF)

    def test_user_without_survey_uses_viewed_event_tags(self):
        history = [Interaction("new", "past_jazz", 100, AS_OF - timedelta(days=1))]
        model = EventRecommender(self.users, self.events, history, as_of=AS_OF)
        result = model.recommend("new")[0]
        self.assertEqual(result.event.id, "jazz_festival")
        self.assertEqual(result.collaborative_score, 0)
        self.assertGreater(result.content_score, 0)

    def test_mock_users_have_no_declared_interests(self):
        self.assertTrue(all(not user.interests for user in self.users))

    def test_personalized_scores_are_descending_and_ids_follow_them(self):
        for user in self.users:
            with self.subTest(user_id=user.id):
                results = self.model.recommend(user.id, 12, exclude_seen=False, relevant_only=True)
                scores = [result.score for result in results]
                self.assertEqual(scores, sorted(scores, reverse=True))
                self.assertEqual(get_recommended_event_ids(user.id), [r.event.id for r in results])

    def test_expanded_mock_data_provides_12_personalized_events(self):
        self.assertEqual(len(get_recommended_event_ids("eve")), 12)
        self.assertEqual(len(get_recommended_event_ids("alice")), 12)

    def test_new_user_without_interests_uses_popularity(self):
        results = self.model.recommend("new_no_interests")
        # The expanded community has more combined engagement with trail_run.
        self.assertEqual(results[0].event.id, "trail_run")
        self.assertEqual(results[0].score, results[0].popularity_score)
        self.assertEqual(results[0].content_score, 0)
        self.assertEqual(results[0].collaborative_score, 0)

    def test_new_event_can_match_content_without_interactions(self):
        result = next(r for r in self.model.recommend("alice", 100) if r.event.id == "new_ai")
        self.assertGreater(result.content_score, 0)
        self.assertGreater(result.score, 0)
        self.assertEqual(result.collaborative_score, 0)

    def test_repeat_views_do_not_inflate_feedback(self):
        repeated = Interaction("alice", "past_python", 10, AS_OF - timedelta(days=11))
        model = EventRecommender(self.users, self.events, self.interactions + [repeated] * 100, as_of=AS_OF)
        self.assertEqual(model.history, self.model.history)
        self.assertEqual(model.recommend("alice"), self.model.recommend("alice"))

    def test_return_visit_keeps_latest_date_and_highest_scroll(self):
        for previous_scroll, current_scroll in ((40, 100), (100, 40)):
            with self.subTest(previous=previous_scroll, current=current_scroll):
                views = [
                    Interaction("eve", "trail_run", previous_scroll,
                                AS_OF - timedelta(days=1), session_id="yesterday"),
                    Interaction("eve", "trail_run", current_scroll,
                                AS_OF, session_id="today"),
                ]
                model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
                reverse = EventRecommender(self.users, self.events, reversed(views), as_of=AS_OF)
                self.assertEqual(model.history_latest_at["eve"]["trail_run"], AS_OF)
                self.assertEqual(model.history_scroll_percent["eve"]["trail_run"], 100)
                self.assertAlmostEqual(model.history["eve"]["trail_run"], 8 * 1.05)
                self.assertEqual(model.history_latest_at, reverse.history_latest_at)
                self.assertEqual(model.history_scroll_percent, reverse.history_scroll_percent)
                self.assertEqual(model.history, reverse.history)

    def test_return_visit_moves_old_event_into_recent_history(self):
        views = [
            Interaction("eve", "past_hike", 100, AS_OF - timedelta(days=200)),
            Interaction("eve", "trail_run", 80, AS_OF - timedelta(days=1)),
            Interaction("eve", "past_hike", 40, AS_OF),
        ]
        model = EventRecommender(self.users, self.events, views, as_of=AS_OF, history_limit=1)
        self.assertEqual(set(model.history["eve"]), {"past_hike"})
        self.assertEqual(model.history_latest_at["eve"], {"past_hike": AS_OF})
        self.assertEqual(model.history_scroll_percent["eve"], {"past_hike": 100})

    def test_deep_scroll_outweighs_shallow_view_and_old_feedback_decays(self):
        model = EventRecommender(self.users, self.events, [
            Interaction("alice", "past_ai", 100, AS_OF),
            Interaction("alice", "past_python", 0, AS_OF),
            Interaction("bob", "past_ai", 100, AS_OF - timedelta(days=90)),
        ], as_of=AS_OF, half_life_days=90)
        self.assertEqual(model.history["alice"]["past_ai"], 8)
        self.assertEqual(model.history["alice"]["past_python"], 1)
        self.assertEqual(model.history["bob"]["past_ai"], 4)

    def test_allow_seen_resurfaces_even_fully_scrolled_events(self):
        view = Interaction("alice", "gallery", 10, AS_OF)
        deep_scroll = Interaction("alice", "ai_lab", 100, AS_OF)
        model = EventRecommender(self.users, self.events, self.interactions + [view, deep_scroll], as_of=AS_OF)
        ids = {r.event.id for r in model.recommend("alice", 100, exclude_seen=False)}
        self.assertIn("gallery", ids)
        self.assertIn("ai_lab", ids)
        default_ids = {r.event.id for r in model.recommend("alice", 100)}
        self.assertNotIn("gallery", default_ids)
        self.assertNotIn("ai_lab", default_ids)

    def test_scroll_percentage_maps_to_monotonic_engagement(self):
        for scroll in (0, 10, 25, 50, 75, 100):
            with self.subTest(scroll=scroll):
                model = EventRecommender(self.users, self.events, [
                    Interaction("alice", "past_ai", scroll, AS_OF),
                ], as_of=AS_OF)
                self.assertAlmostEqual(model.history["alice"]["past_ai"], 1 + 7 * scroll / 100)

    def test_separate_visits_get_small_bounded_bonus(self):
        for count, expected in ((1, 8), (2, 8.4), (3, 8.8), (5, 9.6), (100, 9.6)):
            with self.subTest(count=count):
                views = [Interaction("alice", "past_ai", 100, AS_OF, session_id=f"visit-{i}")
                         for i in range(count)]
                model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
                self.assertAlmostEqual(model.history["alice"]["past_ai"], expected)

    def test_scroll_updates_in_same_visit_do_not_get_bonus(self):
        views = [Interaction("alice", "past_ai", scroll, AS_OF - timedelta(minutes=i),
                             session_id="same-visit")
                 for i, scroll in enumerate((10, 30, 60, 100, 100))]
        model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
        reversed_model = EventRecommender(self.users, self.events, reversed(views), as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 8)
        self.assertEqual(model.history, reversed_model.history)

    def test_without_visit_id_count_at_most_one_visit_per_utc_day(self):
        views = [Interaction("alice", "past_ai", 100, AS_OF - timedelta(minutes=i)) for i in range(100)]
        model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 8)
        views.append(Interaction("alice", "past_ai", 100, AS_OF - timedelta(days=1)))
        model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
        self.assertAlmostEqual(model.history["alice"]["past_ai"], 8.4)

    def test_return_visits_do_not_outweigh_save_or_count_future_visits(self):
        views = [Interaction("alice", "past_ai", 100, AS_OF, session_id=f"visit-{i}")
                 for i in range(10)]
        views.append(Interaction("alice", "past_ai", None, AS_OF, action="save"))
        model = EventRecommender(self.users, self.events, views, as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 10)
        observations = [
            Interaction("alice", "past_ai", 100, AS_OF, session_id="now"),
            Interaction("alice", "past_ai", 100, AS_OF + timedelta(days=1), session_id="future"),
        ]
        model = EventRecommender(self.users, self.events, observations, as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 8)

    def test_invalid_visit_ids_are_rejected(self):
        for visit_id in ("", " ", 123, True):
            with self.subTest(visit_id=visit_id), self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [
                    Interaction("alice", "past_ai", 100, AS_OF, session_id=visit_id),
                ], as_of=AS_OF)

    def test_scroll_updates_use_maximum_not_sum_and_are_order_independent(self):
        observations = [Interaction("alice", "past_ai", scroll, AS_OF)
                        for scroll in (0, 25, 100, 40, 100)]
        model = EventRecommender(self.users, self.events, observations, as_of=AS_OF)
        reversed_model = EventRecommender(self.users, self.events, reversed(observations), as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 8)
        self.assertEqual(model.history, reversed_model.history)

    def test_neighbor_deep_scroll_ranks_above_shallow_scroll(self):
        observations = [
            Interaction("alice", "past_ai", 100, AS_OF),
            Interaction("bob", "past_ai", 100, AS_OF),
            Interaction("bob", "ai_lab", 90, AS_OF),
            Interaction("bob", "hackathon", 10, AS_OF),
        ]
        model = EventRecommender(self.users, self.events, observations, as_of=AS_OF)
        results = {r.event.id: r for r in model.recommend("alice", 100)}
        self.assertGreater(results["ai_lab"].collaborative_score, results["hackathon"].collaborative_score)
        self.assertGreater(results["ai_lab"].popularity_score, results["hackathon"].popularity_score)
        self.assertGreater(results["ai_lab"].score, results["hackathon"].score)

    def test_future_interactions_are_ignored(self):
        future = Interaction("alice", "ai_lab", 100, AS_OF + timedelta(days=7))
        model = EventRecommender(self.users, self.events, self.interactions + [future], as_of=AS_OF)
        self.assertEqual(model.recommend("alice"), self.model.recommend("alice"))

    def test_empty_history_has_deterministic_discovery_fallback(self):
        model = EventRecommender([User("u", "User")], self.events, [], as_of=AS_OF)
        result = model.recommend("u")[0]
        self.assertEqual(result.event.id, "gallery")
        self.assertEqual(result.score, 0)
        self.assertIn("not enough history", result.reasons[0])

    def test_limits_filters_and_empty_catalog(self):
        self.assertEqual(self.model.recommend("alice", 0), [])
        self.assertEqual(len(self.model.recommend("alice", 2)), 2)
        self.assertEqual(self.model.recommend("alice", city="London"), [])
        self.assertTrue(self.model.recommend("alice", city="warsaw"))
        self.assertEqual(EventRecommender(self.users, [], [], as_of=AS_OF).recommend("alice"), [])

    def test_scores_are_bounded(self):
        for user in self.users:
            for result in self.model.recommend(user.id, 100):
                for value in (result.score, result.collaborative_score, result.content_score, result.popularity_score):
                    self.assertGreaterEqual(value, 0)
                    self.assertLessEqual(value, 1.000000001)

    def test_invalid_input_is_rejected(self):
        with self.assertRaises(ValueError):
            self.model.recommend("missing")
        with self.assertRaises(ValueError):
            self.model.recommend("alice", -1)
        for half_life in (0, -1, float("nan"), float("inf")):
            with self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [], half_life_days=half_life)
        for interaction in (
            Interaction("missing", "past_ai", 25, AS_OF),
            Interaction("alice", "missing", 25, AS_OF),
            Interaction("alice", "past_ai", 25, AS_OF.replace(tzinfo=None)),
        ):
            with self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [interaction], as_of=AS_OF)
        with self.assertRaises(ValueError):
            EventRecommender(self.users * 2, self.events, [], as_of=AS_OF)
        with self.assertRaises(ValueError):
            EventRecommender(self.users, self.events * 2, [], as_of=AS_OF)
        with self.assertRaises(ValueError):
            EventRecommender(self.users, [], [], as_of=AS_OF.replace(tzinfo=None))
        with self.assertRaises(ValueError):
            EventRecommender(self.users, [Event("bad", "Bad", (), AS_OF.replace(tzinfo=None), "Warsaw")], [])

    def test_invalid_scroll_percentages_are_rejected(self):
        for scroll in (-1, 101, float("nan"), float("inf"), -float("inf"), True, "75", None):
            with self.subTest(scroll=scroll), self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [
                    Interaction("alice", "past_ai", scroll, AS_OF),
                ], as_of=AS_OF)

    def test_save_is_stronger_than_full_scroll_without_needing_scroll_data(self):
        model = EventRecommender(self.users, self.events, [
            Interaction("alice", "past_ai", None, AS_OF, action="save"),
            Interaction("alice", "past_python", 100, AS_OF),
        ], as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 10)
        self.assertEqual(model.history["alice"]["past_python"], 8)
        self.assertIn("past_ai", model.saved["alice"])

    def test_views_and_repeated_saves_use_maximum_not_sum(self):
        save = Interaction("alice", "past_ai", None, AS_OF, action="save")
        observations = [Interaction("alice", "past_ai", 100, AS_OF), save] + [save] * 100
        model = EventRecommender(self.users, self.events, observations, as_of=AS_OF)
        reversed_model = EventRecommender(self.users, self.events, reversed(observations), as_of=AS_OF)
        self.assertEqual(model.history["alice"]["past_ai"], 10)
        self.assertEqual(model.history, reversed_model.history)
        self.assertEqual(model.saved, reversed_model.saved)

    def test_saves_decay_and_future_saves_are_ignored(self):
        model = EventRecommender(self.users, self.events, [
            Interaction("alice", "past_ai", None, AS_OF - timedelta(days=90), action="save"),
            Interaction("alice", "ai_lab", None, AS_OF + timedelta(days=1), action="save"),
        ], as_of=AS_OF, half_life_days=90)
        self.assertEqual(model.history["alice"]["past_ai"], 5)
        self.assertNotIn("ai_lab", model.history["alice"])
        self.assertNotIn("ai_lab", model.saved["alice"])

    def test_recent_scroll_can_outweigh_old_save(self):
        model = EventRecommender(self.users, self.events, [
            Interaction("alice", "past_ai", None, AS_OF - timedelta(days=90), action="save"),
            Interaction("alice", "past_ai", 100, AS_OF),
        ], as_of=AS_OF, half_life_days=90)
        self.assertEqual(model.history["alice"]["past_ai"], 8)

    def test_six_month_inactivity_preserves_history_and_ranking(self):
        # Keep candidate dates fixed and in the future for both snapshots.
        events = [
            Event("past", "Past fitness", ("fitness",), AS_OF - timedelta(days=10), "Warsaw"),
            Event("fit", "Future fitness", ("fitness",), AS_OF + timedelta(days=365), "Warsaw"),
            Event("tech", "Future AI", ("ai",), AS_OF + timedelta(days=365), "Warsaw"),
        ]
        users = [User("u", "Returning user")]
        interactions = [Interaction("u", "past", 100, AS_OF - timedelta(days=1))]
        before = EventRecommender(users, events, interactions, as_of=AS_OF)
        after = EventRecommender(users, events, interactions, as_of=AS_OF + timedelta(days=183))
        self.assertEqual(before.history, after.history)
        self.assertEqual(after.history["u"]["past"], 8)
        self.assertEqual(before.recommend("u", relevant_only=True), after.recommend("u", relevant_only=True))
        self.assertEqual(after.recommend("u", relevant_only=True)[0].event.id, "fit")

    def test_history_uses_latest_100_distinct_events_per_user(self):
        users = [User("u", "User"), User("v", "Other user")]
        events = [Event(str(i), str(i), ("fitness",), AS_OF + timedelta(days=1), "Warsaw")
                  for i in range(105)]
        interactions = [Interaction("u", str(i), 100, AS_OF - timedelta(days=105 - i))
                        for i in range(105)]
        interactions.append(Interaction("u", "0", None, AS_OF - timedelta(days=200), action="save"))
        interactions.extend([Interaction("u", "104", 10, AS_OF)] * 150)
        interactions.append(Interaction("v", "0", 100, AS_OF - timedelta(days=200)))
        model = EventRecommender(users, events, interactions, as_of=AS_OF)
        reverse = EventRecommender(users, events, reversed(interactions), as_of=AS_OF)
        self.assertEqual(set(model.history["u"]), {str(i) for i in range(5, 105)})
        self.assertEqual(model.history["v"], {"0": 8})
        self.assertEqual(model.history, reverse.history)
        self.assertNotIn("0", model.saved["u"])

    def test_history_limit_is_configurable_and_validated(self):
        model = EventRecommender(self.users, self.events, self.interactions, as_of=AS_OF, history_limit=2)
        self.assertEqual(set(model.history["eve"]), {"trail_run", "jazz_festival"})
        for limit in (0, -1, True, 1.5):
            with self.subTest(limit=limit), self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [], history_limit=limit)

    def test_neighbor_save_improves_candidate_signal_and_explanation(self):
        observations = [
            Interaction("alice", "past_ai", 100, AS_OF),
            Interaction("bob", "past_ai", 100, AS_OF),
            Interaction("bob", "ai_lab", 100, AS_OF),
            Interaction("bob", "hackathon", None, AS_OF, action="save"),
        ]
        model = EventRecommender(self.users, self.events, observations, as_of=AS_OF)
        results = {r.event.id: r for r in model.recommend("alice", 100)}
        self.assertGreater(results["hackathon"].collaborative_score, results["ai_lab"].collaborative_score)
        self.assertGreater(results["hackathon"].popularity_score, results["ai_lab"].popularity_score)
        self.assertIn("Saved by people with similar event history", results["hackathon"].reasons)
        self.assertNotIn("Saved by people with similar event history", results["ai_lab"].reasons)

    def test_saved_event_is_seen_but_not_treated_as_booked(self):
        model = EventRecommender(self.users, self.events, [
            Interaction("alice", "ai_lab", None, AS_OF, action="save"),
        ], as_of=AS_OF)
        self.assertNotIn("ai_lab", {r.event.id for r in model.recommend("alice", 100)})
        self.assertIn("ai_lab", {r.event.id for r in model.recommend("alice", 100, exclude_seen=False)})

    def test_invalid_action_and_save_scroll_are_rejected(self):
        for action in ("register", "attend", "unsave", "invalid"):
            with self.subTest(action=action), self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [
                    Interaction("alice", "past_ai", 50, AS_OF, action=action),
                ], as_of=AS_OF)
        for scroll in (-1, 101, float("nan"), float("inf"), True, "75"):
            with self.subTest(scroll=scroll), self.assertRaises(ValueError):
                EventRecommender(self.users, self.events, [
                    Interaction("alice", "past_ai", scroll, AS_OF, action="save"),
                ], as_of=AS_OF)


if __name__ == "__main__":
    unittest.main()