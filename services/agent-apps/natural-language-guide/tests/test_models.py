import unittest

from app.models import NaturalLanguageGuideRequest, normalize_destination


class DestinationNormalizationTest(unittest.TestCase):
    def test_removes_travel_query_suffix(self) -> None:
        self.assertEqual(normalize_destination("成都攻略"), "成都")
        self.assertEqual(normalize_destination(" 成都旅游攻略 "), "成都")
        self.assertEqual(normalize_destination("新疆自驾游"), "新疆")

    def test_keeps_plain_destination(self) -> None:
        self.assertEqual(normalize_destination("成都"), "成都")

    def test_request_keeps_original_prompt(self) -> None:
        request = NaturalLanguageGuideRequest(
            trip_id="trip-normalize",
            prompt="成都攻略",
            destination="成都攻略",
        )

        self.assertEqual(request.destination, "成都")
        self.assertEqual(request.prompt, "成都攻略")


if __name__ == "__main__":
    unittest.main()
