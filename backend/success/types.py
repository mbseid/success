# types.py
import strawberry
from strawberry import auto
from typing import List

from . import models

@strawberry.django.filters.filter(models.Link, lookups=True)
class LinkFilter:
    id: auto
    url: auto

@strawberry.django.type(models.Link, filters=LinkFilter)
class Link:
    id: auto
    title: auto
    url: auto
    tags: List[str]

@strawberry.django.input(models.Link)
class LinkInput:
    title: auto
    url: auto
    tags: List[str]
