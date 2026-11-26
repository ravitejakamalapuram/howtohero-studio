"""Run with: python3 -B -m unittest publisher/test_learn.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from learn import lever_table, shared, skipped, stayed, watch_lines


def video(hook, skip=None, engaged=None, end='follow', shares=None, views=1000):
    return {'hookPattern': hook, 'opening': 'big-subject', 'endCard': end,
            'metrics': {'instagram': {'d7': views, 'watch': {'skipRate': skip, 'shares': shares, 'views': views, 'day': 7}},
                        'youtube': {'d7': views, 'watch': {'engagedViews': engaged, 'views': views, 'day': 7}}}}


class Watch(unittest.TestCase):
    def test_measures(self):
        self.assertEqual(skipped(video('claim', skip=62)), 62)
        self.assertIsNone(skipped({'metrics': {'instagram': {'d7': 5}}}))
        self.assertEqual(stayed(video('claim', engaged=330)), 33)
        self.assertIsNone(stayed(video('claim', engaged=5, views=0)))
        self.assertEqual(shared(video('claim', shares=4)), 4)

    def test_a_shape_is_ranked_only_with_enough_videos_and_best_first(self):
        datas = [video('claim', skip=60, engaged=200) for _ in range(8)] + [video('open-loop', skip=45, engaged=400) for _ in range(8)]
        datas += [video('number', skip=10, engaged=900) for _ in range(7)]
        lines = watch_lines(datas)
        self.assertIn('Left in the first 3 s on Instagram (skip rate), by hookPattern: open-loop 45 (8), claim 60 (8)', lines)
        self.assertIn('Stayed to watch on YouTube, by hookPattern: open-loop 40% (8), claim 20% (8)', lines)
        self.assertFalse(any('number' in l for l in lines))

    def test_end_cards_are_ranked_by_shares(self):
        datas = [video('claim', end='follow', shares=1) for _ in range(8)] + [video('claim', end='send', shares=5) for _ in range(8)]
        self.assertIn('Instagram shares per 1,000 views, by endCard: send 5.0 (8), follow 1.0 (8)', watch_lines(datas))

    def test_no_data_says_so(self):
        self.assertEqual(len(watch_lines([{'hookPattern': 'claim'}])), 1)
        self.assertIn('not enough data', watch_lines([])[0])

    def test_the_new_parts_are_levers_on_views_too(self):
        rows = [(video('claim'), 0.1, None)] * 8
        t = lever_table(rows)
        self.assertEqual(t['opening']['big-subject'][0], 8)
        self.assertEqual(t['endCard']['follow'][0], 8)


if __name__ == '__main__':
    unittest.main()
