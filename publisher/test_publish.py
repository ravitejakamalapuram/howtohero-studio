"""Run with: python3 -B -m unittest publisher/test_publish.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import publish
import replies


class Extras(unittest.TestCase):
    def test_first_comment_is_the_pin_question(self):
        self.assertEqual(publish.first_comment('youtube', {'pin': ' Why does GPS never send anything? '}), 'Why does GPS never send anything?')
        self.assertIsNone(publish.first_comment('youtube', {}))
        self.assertIsNone(publish.first_comment('youtube', {'pin': {'x': 1}}))

    def test_instagram_gets_no_first_comment_with_a_hashtag(self):
        self.assertIsNone(publish.first_comment('instagram', {'pin': 'What next? #space'}))
        self.assertIsNone(publish.first_comment('instagram', {'pin': 'Is it #1 for you?'}))
        self.assertEqual(publish.first_comment('instagram', {'pin': 'Is C# hard?'}), 'Is C# hard?')

    def test_playlist_by_kind_card_wins_and_other_channels_have_none(self):
        self.assertEqual(publish.APP, 'How To Hero')
        lists = publish.CHANNELS['How To Hero']['youtube']['playlists']
        self.assertEqual(publish.playlist_for({'id': 'news-x', 'source': 'news'}, {}), lists['news'])
        self.assertEqual(publish.playlist_for({'id': 'idea-x'}, {'kind': 'fact'}), lists['default'])
        self.assertEqual(publish.playlist_for({'id': 'idea-x'}, {'playlist': ' Space '}), 'Space')
        publish.APP = 'Chinni Slokalu'
        try:
            self.assertIsNone(publish.playlist_for({'id': 'x'}, {}))
        finally:
            publish.APP = 'How To Hero'


class PostFor(unittest.TestCase):
    """The body sent to Social Media Publisher for one video, with the Drive and job lookups stubbed out."""
    def setUp(self):
        self.saved = (publish.platform_file, publish.job_exists, publish.instagram_cover, publish.instagram_video, publish.video_seconds)
        publish.platform_file = lambda platform, item, data, cache: item['driveId']
        publish.video_seconds = lambda item, data, cache: 45.0
        publish.job_exists = lambda key: True  # so Instagram keeps the Drive file and asks for no public link
        publish.instagram_cover = lambda item, data: None
        self.item = {'id': 'idea-gps', 'driveId': 'VID', 'title': 'GPS Never Sends Anything #shorts'}
        self.data = {'yt': 'GPS Never Sends Anything #shorts', 'ig': 'how gps works\nFollow @howtohero.official #gps', 'pin': 'Did you know your phone only listens?',
                     'thumb': 'THUMB', 'kind': 'explainer'}

    def tearDown(self):
        publish.platform_file, publish.job_exists, publish.instagram_cover, publish.instagram_video, publish.video_seconds = self.saved

    def test_youtube_gets_the_first_comment_and_a_playlist(self):
        post = publish.post_for('youtube', self.item, self.data, {})
        self.assertEqual(post['firstComment'], 'Did you know your phone only listens?')
        self.assertEqual(post['playlists'], ['How Things Work'])
        self.assertEqual(post['privacy'], 'public')  # Social Media Publisher refuses a first comment on a private upload

    def test_instagram_gets_the_first_comment_and_facebook_the_cover(self):
        self.assertEqual(publish.post_for('instagram', self.item, self.data, {})['firstComment'], 'Did you know your phone only listens?')
        fb = publish.post_for('facebook', self.item, self.data, {})
        self.assertEqual(fb['thumbnail'], {'driveFileId': 'THUMB'})
        self.assertNotIn('firstComment', fb)

    def test_chinni_invites_anaadi_to_collab_and_links_it_on_youtube(self):
        self.assertNotIn('collaborators', publish.post_for('instagram', self.item, self.data, {}))
        publish.APP = 'Chinni Slokalu'
        try:
            self.assertEqual(publish.post_for('instagram', self.item, self.data, {})['collaborators'], ['anaadikatha'])
            yt = publish.post_for('youtube', self.item, self.data, {})
            self.assertTrue(yt['description'].endswith('https://www.youtube.com/@AnaadiKatha'))
            again = publish.post_for('youtube', self.item, dict(self.data, ig=yt['description']), {})
            self.assertEqual(again['description'].count('@AnaadiKatha'), 1)
        finally:
            publish.APP = 'How To Hero'

    def test_cross_link_never_overflows_the_description(self):
        full = 'అ' * 1666  # 4,998 bytes
        self.assertEqual(publish.cross_link(full, 'More: https://x'), full)
        self.assertEqual(publish.cross_link('Story', 'More: https://x'), 'Story\n\nMore: https://x')
        self.assertEqual(publish.cross_link('Story', None), 'Story')

    def test_threads_gets_the_shared_public_link_and_one_hashtag(self):
        made = []
        publish.job_exists = lambda key: False
        publish.instagram_video = lambda item, data: made.append(1) or {'driveFileId': 'IGCOPY', 'url': 'https://x/idea-gps-instagram.mp4'}
        data = dict(self.data, meta={'threads': {'text': 'Your phone never talks to GPS satellites. #gps #science'}})
        cache = {}
        ig = publish.post_for('instagram', self.item, data, cache)
        th = publish.post_for('threads', self.item, data, cache)
        self.assertEqual(th['video'], {'url': 'https://x/idea-gps-instagram.mp4'})
        self.assertEqual(ig['video']['url'], th['video']['url'])
        self.assertEqual(made, [1])  # one copy for both
        self.assertEqual(th['text'], 'Your phone never talks to GPS satellites. #gps')
        self.assertEqual(th['key'], 'idea-gps-threads')

    def test_threads_counts_emojis_as_bytes(self):
        self.assertEqual(publish.threads_len('a🌊'), 5)
        self.assertEqual(publish.threads_len('అఆ'), 2)
        self.assertEqual(publish.threads_len(publish.fit('a' * 497 + '\n🌊🌊', 500, 't', 'threads')), 497)

    def test_a_card_without_pin_or_thumb_posts_as_before(self):
        data = {'yt': 'T #shorts', 'ig': 'c'}
        for p in ('youtube', 'instagram', 'facebook'):
            post = publish.post_for(p, self.item, data, {})
            self.assertNotIn('firstComment', post)
            self.assertNotIn('thumbnail', post)


class ReplyAccounts(unittest.TestCase):
    def test_every_channel_with_its_own_account_and_main_accounts_only_for_the_default(self):
        got = replies.accounts({
            'How To Hero': {'postTo': {'youtube': '', 'instagram': '', 'linkedin': ''}, 'icon': '🦸'},
            'Anaadi': {'postTo': {'youtube': 'anaadi'}},
            'Broken': {'postTo': {'youtube': ''}},
            'Empty': {}})
        self.assertIn(('How To Hero', '🦸', 'youtube', ''), got)
        self.assertIn(('How To Hero', '🦸', 'instagram', ''), got)
        self.assertNotIn('linkedin', [a[2] for a in got])
        self.assertIn(('Anaadi', '💬', 'youtube', 'anaadi'), got)
        self.assertFalse([a for a in got if a[0] in ('Broken', 'Empty')])
        self.assertFalse([a for a in got if a[0] != 'How To Hero' and not a[3]])

    def test_the_default_channel_keeps_its_main_accounts_when_its_post_to_is_empty(self):
        for channels in ({}, {'How To Hero': {'postToError': 'bad cell'}, 'Chinni Slokalu': {'postTo': {'youtube': 'chitti'}}}):
            got = replies.accounts(channels)
            self.assertEqual(sorted(a[2] for a in got if a[0] == 'How To Hero'), ['facebook', 'instagram', 'youtube'])
        self.assertIn(('Chinni Slokalu', '💬', 'youtube', 'chitti'), got)




class InstagramSeries(unittest.TestCase):
    """Serialized channels on Instagram: pacing by timesIST and the caption built from the YouTube text."""
    CFG = {'account': 'anaadi', 'timesIST': ['13:00', '19:30'], 'follow': 'Follow @anaadikatha'}

    def at(self, s):
        return publish.dt.datetime.fromisoformat(s)

    def test_one_post_per_time(self):
        due = lambda posts, now: publish.ig_series_due([self.at(p) for p in posts], self.CFG, self.at(now))
        self.assertTrue(due([], '2026-11-27T10:00:00+05:30'))  # the first ever post goes out at once
        self.assertFalse(due(['2026-11-26T19:31:00+05:30'], '2026-11-27T10:00:00+05:30'))  # nothing since 19:30
        self.assertTrue(due(['2026-11-26T19:31:00+05:30'], '2026-11-27T13:05:00+05:30'))
        self.assertFalse(due(['2026-11-27T13:05:00+05:30'], '2026-11-27T18:00:00+05:30'))
        self.assertTrue(due(['2026-11-27T13:05:00+05:30'], '2026-11-27T19:35:00+05:30'))

    def test_caption_from_youtube_text_with_follow_and_five_hashtags(self):
        item = {'id': 'video-ep5', 'title': 'Ep 5'}
        data = {'meta': {'youtube': {'title': 'కాదన్న కొడుకులు | Anaadi Ep 5 #shorts',
                                     'text': 'కథ.\n#a #b #c #d #e #f #g'}}}
        cap = publish.ig_series_caption(item, data, self.CFG)
        self.assertTrue(cap.startswith('కాదన్న కొడుకులు | Anaadi Ep 5\n\nకథ.'))
        self.assertNotIn('#shorts', cap)
        self.assertIn('Follow @anaadikatha', cap)
        self.assertLessEqual(len(publish.re.findall(r'(?<!\S)#[^\s#]+', cap)), 5)

    def test_card_caption_wins(self):
        data = {'meta': {'instagram': {'text': 'Own caption'}, 'youtube': {'title': 'x', 'text': 'y'}}}
        self.assertEqual(publish.ig_series_caption({'id': 'v', 'title': 't'}, data, self.CFG), 'Own caption\n\nFollow @anaadikatha')

    def test_episodes_go_out_in_order(self):
        now = self.at('2026-11-28T12:00:00+00:00')
        card = lambda ep, at, ig=None, group=None: {'id': f"{group or 'saga'}{ep}", 'driveId': 'd', 'data': dict(
            {'episode': ep, 'publishAt': at, 'posted': {'instagram': ig} if ig else {}}, **({'group': group} if group else {}))}
        nxt = lambda items: publish.ig_series_next(items, now, 'anaadi')[0]['id']
        items = [card(3, '2026-11-20T00:00:00+00:00'), card(1, '2026-11-22T00:00:00+00:00', ig='u1'),
                 card(2, '2026-11-25T00:00:00+00:00'), card(4, '2026-11-26T00:00:00+00:00')]
        self.assertEqual(nxt(items), 'saga2')  # by episode, not by YouTube date
        items[2] = card(2, '2026-11-29T00:00:00+00:00')  # episode 2 not live yet: nothing later may jump ahead
        self.assertEqual(nxt(items), 'saga2')
        self.assertFalse(publish.ig_series_ready(publish.ig_series_next(items, now, 'anaadi')[0], now))
        # each group keeps its own order; a group whose next episode is still scheduled doesn't hold the others
        lokas = [card(1, '2026-12-01T00:00:00+00:00', group='lokas'), card(2, '2026-12-04T00:00:00+00:00', group='lokas')]
        items[2] = card(2, '2026-11-25T00:00:00+00:00')
        self.assertEqual(nxt(items + lokas), 'saga2')
        self.assertEqual(publish.ig_series_next([card(1, '2026-11-22T00:00:00+00:00', ig='u1')], now, 'anaadi'), (None, []))

    def test_anaadi_is_configured(self):
        self.assertEqual(publish.IG_SERIES['anaadi']['account'], 'anaadi')
        self.assertIn('anaadi', publish.SERIES)

if __name__ == '__main__':
    unittest.main()


class Lengths(unittest.TestCase):
    def setUp(self):
        self.saved = publish.inbox, publish.social

    def tearDown(self):
        publish.inbox, publish.social = self.saved

    def test_length_comes_from_drive_without_a_download(self):
        publish.social = lambda body: {'video': {'seconds': 150.2}} if body['action'] == 'video' else self.fail(body)
        publish.inbox = lambda body: self.fail('no download expected')
        self.assertEqual(publish.video_seconds({'id': 'sloka-x', 'driveId': 'd1'}, {}, {}), 150.2)
        self.assertEqual(publish.video_seconds({'id': 'x', 'driveId': 'd1'}, {'videoRef': 'a.mp4 | 47.3 s | x'}, {}), 47.3)

    def test_a_long_reel_goes_everywhere_and_facebook_gets_the_link(self):
        publish.social = lambda body: {'video': {'seconds': 150.0}}
        item = {'id': 'sloka-x', 'driveId': 'd1'}
        self.assertEqual(publish.platform_file('instagram', item, {}, {}), 'd1')
        self.assertEqual(publish.platform_file('facebook', item, {}, {}), 'd1')
        # A Facebook Reel version made by the build wins over posting the long video as a Page video.
        self.assertEqual(publish.platform_file('facebook', item, {'versions': {'facebook': 'v1'}}, {}), 'v1')
        saved = publish.shared_video, publish.job_exists
        publish.shared_video = lambda item, data, cache: {'driveFileId': 'ig', 'url': 'https://x/sloka-x-instagram.mp4'}
        publish.job_exists = lambda key: False
        try:
            self.assertEqual(publish.facebook_video(item, {}, {}, 'k', 'd1'), {'driveFileId': 'd1', 'url': 'https://x/sloka-x-instagram.mp4'})
            self.assertEqual(publish.facebook_video(item, {'videoRef': 'a | 47.3 s | b'}, {}, 'k', 'd1'), {'driveFileId': 'd1'})
        finally:
            publish.shared_video, publish.job_exists = saved

    def test_large_files_download_in_parts(self):
        import base64
        import tempfile
        blob, calls = bytes(range(250)) * 3, []

        def fake(body):
            calls.append(body)
            a = body['start']
            b = min(a + 300, len(blob)) - 1
            return {'size': len(blob), 'start': a, 'end': b, 'base64': base64.b64encode(blob[a:b + 1]).decode()}
        publish.inbox = fake
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'v.mp4')
            publish.inbox_file('sloka-x', path)
            self.assertEqual(open(path, 'rb').read(), blob)
        self.assertEqual([c['start'] for c in calls], [0, 300, 600])


class DailyLimit(unittest.TestCase):
    """How To Hero: 3 new videos a day, at most 1 of them news; other videos only in the channel's own time runs."""

    def setUp(self):
        self.posted, self.updates = [], []
        self._inbox, publish.inbox = publish.inbox, self.fake
        publish.APP = publish.DEFAULT_APP

    def tearDown(self):
        publish.inbox = self._inbox

    def fake(self, body):
        if body['action'] == 'list':
            return {'items': self.posted}
        if body['action'] == 'get':
            return {'item': {'id': body['id'], 'version': 1}}
        if body['action'] == 'update':
            self.updates.append(body)
        return {}

    def at(self, s):
        return publish.dt.datetime.fromisoformat(s)

    def card(self, id, created='2026-11-28T00:00:00+00:00', posted=None, slot='2026-11-27T08:00:00+05:30'):
        c = {'id': id, 'createdAt': created, 'slot': slot, 'driveId': 'x', 'data': {}}
        if id.startswith('news-'):
            c['source'] = 'news'
        if posted:
            c['data']['postedAt'] = posted
        return c

    def limit(self, due, now):
        return [i['id'] for i in publish.daily_limit(due, due, self.at(now))]

    def test_one_news_a_day_freshest_first_and_old_news_expires(self):
        due = [self.card('news-new', '2026-11-28T06:00:00+00:00'), self.card('news-old', '2026-11-24T00:00:00+00:00')]
        self.assertEqual(self.limit(due, '2026-11-28T10:05:00+05:30'), ['news-new'])
        self.assertEqual(self.updates[0]['id'], 'news-old')
        self.assertEqual(self.updates[0]['set']['status'], 'ready')
        self.posted = [self.card('news-a', posted='2026-11-28T04:40:00+00:00')]  # 10:10 IST today
        self.assertEqual(self.limit([self.card('news-new', '2026-11-28T06:00:00+00:00')], '2026-11-28T11:05:00+05:30'), [])

    def test_other_videos_one_per_daily_time_passed(self):
        self.posted = [self.card('video-1', posted='2026-11-28T02:58:00+00:00')]  # 08:28 IST
        due = [self.card('video-a')]
        self.assertEqual(self.limit(due, '2026-11-28T10:05:00+05:30'), [])  # 08:00 used, 13:00 not yet
        self.assertEqual(self.limit(due, '2026-11-28T14:20:00+05:30'), ['video-a'])  # a late run still catches up

    def test_expired_news_approved_again_is_not_expired_twice(self):
        old = self.card('news-old', '2026-11-24T00:00:00+00:00')
        old['data']['newsExpired'] = True
        self.assertEqual(self.limit([old], '2026-11-28T10:05:00+05:30'), ['news-old'])
        self.assertEqual(self.updates, [])

    def test_three_a_day_then_only_unfinished_posts(self):
        self.posted = [self.card(f'video-{n}', posted=f'2026-11-28T0{n}:00:00+00:00') for n in (1, 2, 3)]
        half = self.card('video-half', posted='2026-11-28T08:00:00+00:00')
        due = [self.card('news-x', '2026-11-28T10:00:00+00:00'), half, self.card('video-b')]
        self.assertEqual(self.limit(due, '2026-11-28T19:35:00+05:30'), ['video-half'])

    def test_no_late_alert_while_the_channel_is_posting(self):
        sent = []
        self._alert, publish.alert = publish.alert, lambda *a: sent.append(a)
        try:
            publish.LAST_POST[publish.APP] = publish.dt.datetime.now(publish.dt.timezone.utc)
            publish.late_alert([self.card('video-old', slot='2026-11-20T08:00:00+05:30')])
            self.assertEqual(sent, [])
            publish.LAST_POST[publish.APP] = publish.dt.datetime.now(publish.dt.timezone.utc) - publish.dt.timedelta(days=2)
            publish.late_alert([self.card('video-old', slot='2026-11-20T08:00:00+05:30')])
            self.assertEqual(len(sent), 1)
        finally:
            publish.alert = self._alert
