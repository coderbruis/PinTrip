import unittest

from app.workflows.natural_language_guide.intent_parser import (
    parse_simple_trip_intent,
)


class SimpleIntentParserTest(unittest.TestCase):
    def test_parses_direct_destination_days_and_preferences(self) -> None:
        intent = parse_simple_trip_intent("成都两天美食游")

        self.assertIsNotNone(intent)
        assert intent is not None
        self.assertEqual("成都", intent.destination)
        self.assertEqual(2, intent.days)
        self.assertEqual(["美食"], intent.preferences)

    def test_parses_go_play_pattern_and_transportation(self) -> None:
        intent = parse_simple_trip_intent("国庆去格聂玩5天，自驾看雪山")

        self.assertIsNotNone(intent)
        assert intent is not None
        self.assertEqual("格聂", intent.destination)
        self.assertEqual(5, intent.days)
        self.assertEqual("自驾", intent.transportation)

    def test_defers_multi_destination_route_to_intent_agent(self) -> None:
        self.assertIsNone(parse_simple_trip_intent("成都-康定-理塘玩七天"))


if __name__ == "__main__":
    unittest.main()
