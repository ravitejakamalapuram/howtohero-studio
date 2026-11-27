"""Run with: python3 -B -m unittest publisher/test_engine.py"""
import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import publish

SAT_PM = dt.datetime(2026, 11, 28, 14, 5, tzinfo=publish.IST)  # Saturday prime-pm (14:00)


def ep(n, posted):
    return {'id': f'ep-{n}', 'title': f'Ep {n}', 'status': 'posted', 'driveId': f'd{n}', 'version': 1,
            'data': {'channel': 'anaadi', 'episode': n, 'posted': posted, 'publishAt': '2026-11-21T19:30:00+05:30',
                     'meta': {'youtube': {'title': f'Ep {n} #shorts', 'text': 'story'}}}}


class Engine(unittest.TestCase):
    def setUp(self):
        self.items = [ep(1, {'youtube': 'y', 'instagram': 'i', 'threads': 't'}), ep(2, {'youtube': 'y', 'instagram': 'i'})]
        self.sent, self.updates = [], []
        self.saved = publish.inbox, publish.social, publish.platform_file, publish.time.sleep, publish.shared_video
        publish.platform_file = lambda p, item, data, cache: item['driveId']
        publish.time.sleep = lambda s: None

        def inbox(body):
            if body['action'] == 'list':
                return {'items': self.items}
            if body['action'] == 'channelConfig':
                return {'channels': {}}
            if body['action'] == 'get':
                return {'item': next(i for i in self.items if i['id'] == body['id'])}
            self.updates.append(body)
            return {}

        def social(body):
            if body['action'] == 'publish':
                self.sent.append(body)
                return {'job': {'id': 'j', 'status': 'done', 'result': {'url': f"https://x/{body['platform']}"}}}
            if body['action'] == 'get' and 'key' in body:
                return {'job': None}
            return {}
        publish.inbox, publish.social = inbox, social

    def tearDown(self):
        publish.inbox, publish.social, publish.platform_file, publish.time.sleep, publish.shared_video = self.saved

    def test_posts_only_facebook_and_threads_lanes_in_episode_order(self):
        publish.shared_video = lambda item, data, cache: {'url': 'https://pub/v.mp4'}
        self.assertEqual(publish.run_engine(SAT_PM), 0)
        got = {(b['platform'], b['key']) for b in self.sent}
        self.assertEqual(got, {('facebook', 'ep-1-facebook-anaadi'), ('threads', 'ep-2-threads-anaadi')})
        fb = next(b for b in self.sent if b['platform'] == 'facebook')
        self.assertEqual((fb['account'], fb['title']), ('anaadi', 'Ep 1'))
        posted = {u['id']: u['set']['data']['posted'] for u in self.updates}
        self.assertEqual(posted['ep-2']['threads'], 'https://x/threads')
        self.assertIn('threads', next(u for u in self.updates if u['id'] == 'ep-2')['set']['data']['postedTimes'])

    def test_nothing_outside_a_slot(self):
        self.assertEqual(publish.run_engine(dt.datetime(2026, 11, 28, 15, 30, tzinfo=publish.IST)), 0)
        self.assertEqual(self.sent, [])


if __name__ == '__main__':
    unittest.main()
