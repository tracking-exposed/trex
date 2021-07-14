import unittest
from ours import fetchContentFromApi 

class TestStringMethods(unittest.TestCase):

    def test_getLast(self):
        check = fetchContentFromApi('getLast')
        self.assertEqual(check.id, 'SOME')

    def test_isupper(self):
        check = fetchContentFromApi('getLastHome')
        self.assertEqual(check.id, 'SOME')

    def test_split(self):
        check = fetchContentFromApi('getVideoId')
        self.assertEqual(check.id, 'SOME')


if __name__ == '__main__':
    unittest.main()
