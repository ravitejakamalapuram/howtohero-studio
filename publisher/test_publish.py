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
        self.assertEqual(got, [('How To Hero', '🦸', 'youtube', ''), ('How To Hero', '🦸', 'instagram', ''), ('Anaadi', '💬', 'youtube', 'anaadi')])

    def test_without_a_config_the_main_accounts(self):
        self.assertEqual([a[2:] for a in replies.accounts({})], [('youtube', ''), ('instagram', ''), ('facebook', '')])


if __name__ == '__main__':
    unittest.main()
