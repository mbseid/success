from django.test import TestCase
from success.models import SearchIndex
from success import assistant

class SuccessTestCase(TestCase):

    fixtures = ["seed.yaml"]

    def test_search(self):
        # It runs
        results = SearchIndex.objects.search("success")
        self.assertTrue(len(list(results)) > 1)
        # Partial search
        results = SearchIndex.objects.search("mik")
        self.assertTrue(len(list(results)) > 1)

        # Won't find this
        results = SearchIndex.objects.search("fubar")
        self.assertEqual(len(list(results)),0)

        # multi word
        results = SearchIndex.objects.search("work success")
        self.assertEqual(len(list(results)),1)

    def test_search_type(self):
        results = SearchIndex.objects.search("success", "link")
        self.assertEqual(len(list(results)),1)

        # search link tags, should return multiple
        results = SearchIndex.objects.search("search", "link")
        self.assertEqual(len(list(results)),2)

        # search link tags and keyword, should return multiple
        results = SearchIndex.objects.search("search bing")
        self.assertEqual(len(list(results)),1)

        # should find chelsea, who is only saved as a person
        results = SearchIndex.objects.search("chelsea", "link")
        self.assertEqual(len(list(results)),0)

        results = SearchIndex.objects.search("mike", "person")
        self.assertEqual(len(list(results)),1)

    def test_assistant(self):
        answer = assistant.predict("You are a person", "respond with multiple lines")
        self.assertTrue("\n" in answer.response)