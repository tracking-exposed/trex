import unittest
from qa.ours import fetchContentFromApi

class API_tester(unittest.TestCase):

# https://docs.python.org/3/library/unittest.html#unittest.TestCase.assertFalse
    def testGetLast(self):
        fetched = fetchContentFromApi('getLast')
        self.assertGreater(len(fetched['content']), 1)
        firstVid = fetched['content'][0]
        self.assertGreater(firstVid['secondsago'], 1)
        self.assertGreater(len(firstVid['title']), 1)
        self.assertEqual(len(firstVid['videoId']), 11)


    def testGetLastHome(self):
        fetched = fetchContentFromApi('getLastHome')
        self.assertGreater(len(fetched), 10)
        firstVid = fetched[0]
        self.assertGreater(len(firstVid['title']), 1)
        self.assertEqual(len(firstVid['videoId']), 11)


    def testGetVideoId(self):
        fetched = fetchContentFromApi('getVideoId') # tries to fetch Baby Shark by default
        self.assertGreater(len(fetched), 10)
        firstVid = fetched[0]
        self.assertRegex(firstVid['title'], 'Baby Shark.*')
        recos = firstVid['related']
        self.assertGreater(len(recos), 3)
        self.assertGreater(len(recos[0]['recommendedTitle']), 1) # first recommendation has a non empty title


    def testGetRelatedId(self):
        fetched = fetchContentFromApi('getRelatedId') # tries to fetch Baby Shark by default
        self.assertGreater(len(fetched), 10)
        firstRecord = fetched[0]
        recos = firstRecord['related']
        self.assertGreater(len(recos), 3)
        self.assertGreater(len(recos[0]['recommendedTitle']), 1) # first recommendation has a non empty title


    def testGetPersonalCSV_home(self):
        fetched = fetchContentFromApi('getPersonalCSV_home')
        self.assertGreater(len(fetched), 10)
        firstRecord = fetched[0]
        recos = firstRecord['related']
        self.assertGreater(len(recos), 3)
        self.assertGreater(len(recos[0]['recommendedTitle']), 1) # first recommendation has a non empty title


if __name__ == '__main__':
    unittest.main()

