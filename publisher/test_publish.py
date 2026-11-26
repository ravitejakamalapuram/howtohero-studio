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
        self.saved = (publish.platform_file, publish.job_exists, publish.instagram_cover, publish.instagram_video)
        publish.platform_file = lambda platform, item, data, cache: item['driveId']
        publish.job_exists = lambda key: True  # so Instagram keeps the Drive file and asks for no public link
        publish.instagram_cover = lambda item, data: None
        self.item = {'id': 'idea-gps', 'driveId': 'VID', 'title': 'GPS Never Sends Anything #shorts'}
        self.data = {'yt': 'GPS Never Sends Anything #shorts', 'ig': 'how gps works\nFollow @howtohero.official #gps', 'pin': 'Did you know your phone only listens?',
                     'thumb': 'THUMB', 'kind': 'explainer'}

    def tearDown(self):
        publish.platform_file, publish.job_exists, publish.instagram_cover, publish.instagram_video = self.saved

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
