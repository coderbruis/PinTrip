import unittest
from unittest.mock import Mock, patch

from app.infrastructure.amap_client import AmapClient


class AmapClientTest(unittest.TestCase):
    @patch("app.infrastructure.amap_client.httpx.get")
    def test_weather_resolves_city_adcode_before_query(self, get: Mock) -> None:
        district_response = Mock()
        district_response.json.return_value = {
            "status": "1",
            "districts": [{"adcode": "510100"}],
        }
        weather_response = Mock()
        weather_response.json.return_value = {
            "status": "1",
            "forecasts": [{"casts": [{"date": "2026-10-01"}]}],
        }
        get.side_effect = [district_response, weather_response]

        result = AmapClient("test-key").get_weather("成都")

        self.assertEqual(result, [{"date": "2026-10-01"}])
        self.assertEqual(get.call_args_list[1].kwargs["params"]["city"], "510100")


if __name__ == "__main__":
    unittest.main()
