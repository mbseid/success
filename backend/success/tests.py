from django.test import TestCase
from success.models import SearchIndex

class SuccessTestCase(TestCase):

    fixtures = ["seed.yaml"]

    def test_search(self):
        results = SearchIndex.objects.search("success")
        self.assertTrue(len(list(results)) > 1)
        results = SearchIndex.objects.search("fubar")
        self.assertEqual(len(list(results)),0)
        results = SearchIndex.objects.search("work success")
        self.assertEqual(len(list(results)),1)

    def test_search_type(self):
        results = SearchIndex.objects.search("success", "link")
        self.assertEqual(len(list(results)),1)
        results = SearchIndex.objects.search("mike", "link")
        self.assertEqual(len(list(results)),0)
        results = SearchIndex.objects.search("mike", "person")
        self.assertEqual(len(list(results)),1)