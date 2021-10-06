import unittest
from API_fetcher import fetchContentFromApi
import os
import subprocess

# Default test values
sample_video_id = "XqZsoesa55w" # tries to fetch Baby Shark by default
sample_public_key = "6t43jZSicgEKo6AEbtNW7c66ZoALAxorrG3SKHsf2JnR"
sample_metadata_id = "d81d2efb21ff5c0182fbcd303a046d41ef2e4a1b"

class API_tester(unittest.TestCase):
    # All test function names must start by 'test' to be executed in main

    # TODO what are these videos? The last recommendations scraped from any video?
    # TODO there is no watchedVideoID
    def testGetLast(self):
        fetched = fetchContentFromApi('/api/v1/last/')
        self.assertGreater(len(fetched['content']), 1)
        firstVid = fetched['content'][0]
        self.assertLess(firstVid['secondsago'], 0)
        self.assertGreater(len(firstVid['title']), 1)
        self.assertEqual(len(firstVid['videoId']), 11)

    # TODO instead of returning the last homepage collected, currently returns several. Needs to be aggregated by accessId to get a single page
    # TODO: what is the purpose of this API? Has a risk of privacy leak, if someone can guess who the last record belongs to
    # TODO: this API should be removed. Too many possible misues
    def testGetLastHome(self):
        fetched = fetchContentFromApi('/api/v1/home/')
        self.assertGreater(len(fetched), 10)
        # ensure no publicKey leak
        for record in fetched:
            self.assertNotIn('publicKey', record.keys())
        firstVid = fetched[0]
        self.assertGreater(len(firstVid['title']), 1)
        self.assertEqual(len(firstVid['videoId']), 11)


    def testGetVideoId(self):
        # get all recommendation records for a given video (compare page)
        fetched = fetchContentFromApi('/api/v1/videoId/' + sample_video_id)
        self.assertGreater(len(fetched), 10)
        firstVid = fetched[0]
        self.assertRegex(firstVid['title'], 'Baby Shark.*')
        self.assertNotIn('publicKey', firstVid.keys())
        recos = firstVid['related']
        self.assertGreater(len(recos), 3)
        self.assertGreater(len(recos[0]['recommendedTitle']), 1) # first recommendation has a non empty title


    def testGetRelatedId(self):
        # gets all records from which the specified video ID was recommended
        fetched = fetchContentFromApi('/api/v1/related/' + sample_video_id) # tries to fetch Baby Shark by default
        self.assertGreater(len(fetched), 2) # true for babyShark, not in general
        # Make sure that each records contains indeed an instance of sample_video_Id in its recommendation list
        for record in fetched:
            recommendedIds = [reco['videoId'] for reco in record['related']]
            self.assertIn(sample_video_id, recommendedIds)


    def testGetPersonalCSV_home(self):
        fetched = fetchContentFromApi('/api/v2/personal/' + sample_public_key + '/home/csv')
        self.assertGreater(len(fetched), 10)
        # check that all records have the requested public key
        for record in fetched:
            self.assertEqual(record['publicKey'], sample_public_key)
        firstVid = fetched[0]
        self.assertGreater(len(firstVid['selectedTitle']), 1)
        self.assertEqual(len(firstVid['selectedVideoId']), 11)

    def testGetPersonalCSV_video(self):
        fetched = fetchContentFromApi('/api/v2/personal/' + sample_public_key + '/video/csv')
        self.assertGreater(len(fetched), 10)
        # check that all records have the requested public key
        for record in fetched:
            self.assertEqual(record['publicKey'], sample_public_key)
        firstVid = fetched[0]
        self.assertGreater(len(firstVid['recommendedTitle']), 1)
        self.assertEqual(len(firstVid['recommendedVideoId']), 11)

    def testListGuardoniExperiments(self):
        fetched = fetchContentFromApi('/api/v2/guardoni/list')
        experiments = fetched['experiments']
        self.assertGreater(len(experiments), 2)
        for experiment_name, n_runs in experiments.items():
            self.assertIsInstance(experiment_name, str)
            self.assertIsInstance(n_runs, int)

    # TODO remove publicKey from the returned fields, can be a big risk!
    def testGetHTMLbyId(self):
        fetched = fetchContentFromApi('/api/v1/html/' + sample_metadata_id)
        self.assertGreater(len(fetched), 1)
        for record in fetched:
            self.assertEqual(record['metadataId'], sample_metadata_id)
            self.assertGreater(record['size'], 1)
            # TODO: remove PublicKey from return values and uncomment line below
            # self.assertNotIn('publicKey', record.keys())


if __name__ == '__main__':
    unittest.main()

    ######
    # For debugging - run a single test
    # https://stackoverflow.com/a/15971942/5089456
    '''
    suite = unittest.TestSuite()
    suite.addTest(API_tester('getHTMLbyId'))
    runner = unittest.TextTestRunner()
    runner.run(suite)
    '''
