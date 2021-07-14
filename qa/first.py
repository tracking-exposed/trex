import unittest
from ours import fetchContentFromApi 

class TestStringMethods(unittest.TestCase):

# https://docs.python.org/3/library/unittest.html#unittest.TestCase.assertFalse
    def test_getLast(self):
        check = fetchContentFromApi('getLast')
        self.assertGreater(len(check['content']), 1)
        firstVid = check['content'][0]
        self.assertGreater(firstVid['secondsago'], 1)
        self.assertGreater(len(firstVid['title']), 1)
        self.assertEqual(len(firstVid['videoId']), 11)
        import pdb; pdb.set_trace()


    def test_getLastHome(self):
        check = fetchContentFromApi('getLastHome')

    def test_getVideoId(self):
        check = fetchContentFromApi('getVideoId')



if __name__ == '__main__':
    unittest.main()
