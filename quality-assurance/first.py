import unittest
from ours import fetchContentFromApi 

class TestStringMethods(unittest.TestCase):

    def test_upper(self):
        fetchContentFromApi('last')
        self.assertEqual('foo'.upper(), 'FOO')

    def test_isupper(self):
        # fetchContentFromApi('topVideos')
        self.assertTrue('FOO'.isupper())
        self.assertFalse('Foo'.isupper())

    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])
        # check that s.split fails when the separator is not a string
        with self.assertRaises(TypeError):
            s.split(2)

if __name__ == '__main__':
    unittest.main()
