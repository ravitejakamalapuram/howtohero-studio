"""Run with: python3 -B -m unittest publisher/test_stats.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stats import aged


class Aged(unittest.TestCase):
    def test_views_are_kept_once_at_day_2_and_day_7(self):
        self.assertIsNone(aged({}, 1, {'views': 50}))
        self.assertEqual(aged({}, 2, {'views': 50}), {'d2': 50})
        self.assertIsNone(aged({'d2': 50}, 5, {'views': 80}))
        self.assertEqual(aged({'d2': 50}, 7, {'views': 90}), {'d2': 50, 'd7': 90})

    def test_watch_numbers_are_read_at_day_2_and_replaced_once_at_day_7(self):
        post = {'views': 50, 'skipRate': 61.5, 'avgWatchTime': 9200, 'shares': 4, 'saves': None}
        m = aged({}, 3, post)
        self.assertEqual(m['watch'], {'skipRate': 61.5, 'avgWatchTime': 9200, 'shares': 4, 'day': 2, 'views': 50})
        self.assertIsNone(aged(m, 4, dict(post, skipRate=70)))
        m7 = aged(m, 8, dict(post, skipRate=58))
        self.assertEqual(m7['watch']['skipRate'], 58)
        self.assertEqual(m7['watch']['day'], 7)
        self.assertIsNone(aged(m7, 20, dict(post, skipRate=40)))

    def test_a_number_missing_at_day_7_keeps_its_day_2_value(self):
        m = aged({'d2': 5, 'watch': {'skipRate': 61.5, 'shares': 4, 'day': 2}}, 7, {'views': 9, 'shares': 6})
        self.assertEqual(m['watch'], {'skipRate': 61.5, 'shares': 6, 'day': 7, 'views': 9})

    def test_youtube_engaged_views_are_kept_with_the_views_of_that_reading(self):
        m = aged({}, 7, {'views': 200, 'engagedViews': 64})
        self.assertEqual(m['watch'], {'engagedViews': 64, 'day': 7, 'views': 200})

    def test_a_platform_without_watch_numbers_stores_none(self):
        self.assertEqual(aged({}, 7, {'views': 10, 'skipRate': None}), {'d2': 10, 'd7': 10})


if __name__ == '__main__':
    unittest.main()
