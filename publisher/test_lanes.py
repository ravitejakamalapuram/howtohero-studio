"""Run with: python3 -B -m unittest publisher/test_lanes.py"""
import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lanes

IST = lanes.IST
SLOTS = {'am': '10:00', 'pm': {d: '19:00' for d in lanes.DAYS}, 'late': '21:30'}
SLOTS['pm']['sat'] = '14:00'
FRI_PM = dt.datetime(2026, 11, 27, 19, 5, tzinfo=IST)  # a Friday
FRI_AM = dt.datetime(2026, 11, 27, 10, 5, tzinfo=IST)
FRI_LATE = dt.datetime(2026, 11, 27, 21, 35, tzinfo=IST)


def ep(n, status='posted', posted=None, publish_at='2026-11-20T19:30:00+05:30', group=None, drive='d'):
    data = {'channel': 'tale', 'episode': n, 'posted': posted or {}, 'publishAt': publish_at}
    if group:
        data['group'] = group
    return {'id': f'ep-{n}', 'title': f'Ep {n}', 'status': status, 'driveId': drive, 'data': data}


def card(i, status='approved', slot='2026-11-27T08:00:00+05:30', posted=None, posted_at=None, app='Show', news=False):
    data = {'app': app, 'posted': posted or {}}
    if posted_at:
        data['postedAt'] = posted_at
    return {'id': f'news-{i}' if news else f'v-{i}', 'title': str(i), 'status': status, 'driveId': 'd', 'slot': slot,
            'data': data, 'source': 'news' if news else 'idea'}


def strict(**ig):
    return {'slots': SLOTS, 'series': {'Tale': {'channel': 'tale', 'group': 'main', 'defaultGroup': True, 'order': 'strict',
            'lead': 'youtube', 'platforms': {'youtube': {'slots': ['pm']}, 'instagram': dict({'slots': ['pm']}, **ig)}}}}


def loose(**s):
    return {'slots': SLOTS, 'series': {'Show': dict({'app': 'Show', 'order': 'loose', 'lead': 'youtube',
            'platforms': 'post_to', 'slots': ['am', 'pm']}, **s)}}


def run(cfg, items, now, post_to=None):
    return {r['platform']: r for r in lanes.plan(cfg, items, now, {'Show': post_to or {'youtube': '', 'instagram': ''}}, 'Show')}


class Slots(unittest.TestCase):
    def test_weekday_slot_and_one_hour_window(self):
        self.assertEqual(list(lanes.due_slots({'slots': SLOTS}, FRI_PM)), ['pm'])
        sat = dt.datetime(2026, 11, 28, 14, 30, tzinfo=IST)
        self.assertEqual(list(lanes.due_slots({'slots': SLOTS}, sat)), ['pm'])
        self.assertEqual(lanes.due_slots({'slots': SLOTS}, dt.datetime(2026, 11, 28, 19, 5, tzinfo=IST)), {})
        self.assertEqual(lanes.due_slots({'slots': SLOTS}, dt.datetime(2026, 11, 27, 20, 5, tzinfo=IST)), {})

    def test_real_plan_is_valid_and_bad_ones_are_refused(self):
        lanes.load()
        with self.assertRaises(ValueError):
            lanes.check({'slots': SLOTS, 'series': {'X': {'order': 'loose', 'slots': ['nope'], 'platforms': 'post_to'}}})
        with self.assertRaises(ValueError):
            lanes.check({'slots': {'x': {'mon': '10:00'}}, 'series': {}})

    def test_slot_before_midnight_is_due_after_it(self):
        cfg = {'slots': {'night': '23:30'}}
        self.assertEqual(list(lanes.due_slots(cfg, dt.datetime(2026, 11, 28, 0, 10, tzinfo=IST))), ['night'])

    def test_series_without_lead_or_platforms_is_refused(self):
        with self.assertRaises(ValueError):
            lanes.check({'slots': SLOTS, 'series': {'X': {'order': 'loose', 'app': 'X', 'platforms': 'post_to'}}})

    def test_nothing_outside_a_slot(self):
        self.assertEqual(run(strict(), [ep(1, 'approved')], dt.datetime(2026, 11, 27, 15, 0, tzinfo=IST)), {})


class Strict(unittest.TestCase):
    def test_lead_posts_next_approved_episode_and_a_gap_holds_the_rest(self):
        items = [ep(1, posted={'youtube': 'y', 'instagram': 'i'}), ep(3, 'approved')]
        out = run(strict(), items, FRI_PM)
        self.assertIsNone(out['youtube']['id'])
        self.assertIn('episode 2 has no card', out['youtube']['why'])

    def test_follower_never_skips_ahead_and_waits_for_the_lead(self):
        items = [ep(1, posted={'youtube': 'y'}), ep(2, posted={'youtube': 'y', 'instagram': 'i'})]
        self.assertEqual(run(strict(), items, FRI_PM)['instagram']['id'], 'ep-1')
        items = [ep(1, 'approved')]
        self.assertIsNone(run(strict(), items, FRI_PM)['instagram']['id'])

    def test_not_live_yet_waits(self):
        items = [ep(1, posted={'youtube': 'y'}, publish_at='2026-11-28T19:30:00+05:30')]
        self.assertIsNone(run(strict(), items, FRI_PM)['instagram']['id'])

    def test_mode3_catches_up_at_extra_slots_only_while_behind(self):
        items = [ep(1, posted={'youtube': 'y'}), ep(2, posted={'youtube': 'y'})]
        self.assertEqual(run(strict(catchUpSlots=['am']), items, FRI_AM)['instagram']['id'], 'ep-1')
        done = [ep(1, posted={'youtube': 'y', 'instagram': 'i'})]
        self.assertIsNone(run(strict(catchUpSlots=['am']), done, FRI_AM)['instagram']['id'])

    def test_mode2_no_catch_up_slots_keeps_the_same_pace(self):
        items = [ep(1, posted={'youtube': 'y'}), ep(2, posted={'youtube': 'y'})]
        self.assertEqual(run(strict(), items, FRI_AM), {})

    def test_after_counts_hand_posted_episodes_as_on_the_lead(self):
        cfg = strict()
        cfg['series']['Tale']['after'] = 2
        out = run(cfg, [ep(1), ep(2), ep(3, 'approved')], FRI_PM)
        self.assertEqual(out['youtube']['id'], 'ep-3')
        self.assertEqual(out['instagram']['id'], 'ep-1')

    def test_one_post_per_slot_and_every_days(self):
        posted = ep(1, posted={'youtube': 'y'}, publish_at='2026-11-27T19:01:00+05:30')
        self.assertIsNone(run(strict(), [posted, ep(2, 'approved')], FRI_PM).get('youtube'))
        cfg = strict()
        cfg['series']['Tale']['platforms']['youtube']['everyDays'] = 3
        two_days = ep(1, posted={'youtube': 'y'}, publish_at='2026-11-25T19:00:00+05:30')
        self.assertNotIn('youtube', run(cfg, [two_days, ep(2, 'approved')], FRI_PM))
        three_days = ep(1, posted={'youtube': 'y'}, publish_at='2026-11-24T19:00:00+05:30')
        self.assertEqual(run(cfg, [three_days, ep(2, 'approved')], FRI_PM)['youtube']['id'], 'ep-2')

    def test_other_groups_are_other_series(self):
        out = run(strict(), [ep(1, 'approved', group='side')], FRI_PM)
        self.assertIn('nothing left', out['youtube']['why'])


class Loose(unittest.TestCase):
    def test_new_video_goes_everywhere_together_news_first(self):
        items = [card(1), card(2, news=True, slot='2026-12-30T08:00:00+05:30'), card(3, slot='2026-11-28T08:00:00+05:30')]
        out = run(loose(), items, FRI_PM)
        self.assertEqual({p: r['id'] for p, r in out.items()}, {'youtube': 'news-2', 'instagram': 'news-2'})

    def test_future_slot_waits(self):
        out = run(loose(), [card(1, slot='2026-11-28T08:00:00+05:30')], FRI_PM)
        self.assertIsNone(out['youtube']['id'])

    def test_a_platform_that_has_it_moves_on_without_holding_the_others(self):
        items = [card(1, posted={'instagram': 'i'}), card(2, slot='2026-11-27T09:00:00+05:30')]
        out = run(loose(), items, FRI_PM)
        self.assertEqual((out['youtube']['id'], out['instagram']['id']), ('v-1', 'v-2'))

    def test_mode1_missed_cards_go_out_at_catch_up_slots_from_since(self):
        cfg = loose(catchUpSlots=['late'], since='2026-11-27')
        items = [card(1, 'posted', posted={'youtube': 'y'}, posted_at='2026-11-26T08:05:00+05:30'),
                 card(2, 'posted', posted={'youtube': 'y'}, posted_at='2026-11-27T08:05:00+05:30'),
                 card(3, 'posted', posted={'youtube': 'y'}, posted_at='2026-11-27T10:05:00+05:30')]
        out = run(cfg, items, FRI_LATE)
        self.assertEqual(out['instagram']['id'], 'v-2')
        self.assertIn('1 more missed', out['instagram']['why'])
        self.assertIsNone(out['youtube']['id'])
        self.assertEqual(run(cfg, items, FRI_PM)['instagram']['id'], None)  # normal slots post only new cards

    def test_lead_catches_up_a_card_it_missed(self):
        cfg = loose(catchUpSlots=['late'], since='2026-11-27')
        items = [card(1, 'posted', posted={'instagram': 'i'}, posted_at='2026-11-27T08:05:00+05:30')]
        self.assertEqual(run(cfg, items, FRI_LATE)['youtube']['id'], 'v-1')

    def test_a_rerun_in_the_same_slot_posts_nothing_more(self):
        cfg = loose(catchUpSlots=['late'], since='2026-11-27')
        done = card(1, 'posted', posted={'youtube': 'y', 'instagram': 'i'}, posted_at='2026-11-27T08:05:00+05:30')
        done['data']['postedTimes'] = {'instagram': '2026-11-27T21:36:00+05:30'}
        items = [done, card(2, 'posted', posted={'youtube': 'y'}, posted_at='2026-11-27T10:05:00+05:30')]
        self.assertNotIn('instagram', run(cfg, items, FRI_LATE + dt.timedelta(minutes=15)))

    def test_mode4_no_catch_up_slots_skips_missed_cards(self):
        items = [card(1, 'posted', posted={'youtube': 'y'}, posted_at='2026-11-27T08:05:00+05:30')]
        out = run(loose(), items, FRI_PM)
        self.assertIsNone(out['instagram']['id'])

    def test_post_to_accounts_and_other_apps(self):
        out = run(loose(), [card(1), card(2, app='Other')], FRI_PM, {'youtube': 'acct'})
        self.assertEqual((out['youtube']['account'], out['youtube']['id']), ('acct', 'v-1'))
        self.assertNotIn('instagram', out)


if __name__ == '__main__':
    unittest.main()
