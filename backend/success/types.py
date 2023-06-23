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

@strawberry.django.filters.filter(models.Person, lookups=True)
class PersonFilter:
    id: auto
    name: auto

@strawberry.django.type(models.Person, filters=PersonFilter)
class Person:
    id: auto
    name: auto
    email: auto
    team: auto
    role: auto
    logs: List['PersonLog']

@strawberry.django.type(models.PersonLog)
class PersonLog:
    id: auto
    date: auto
    note: auto
    person: Person

@strawberry.django.input(models.Person)
class PersonInput:
    name: auto
    email: auto
    team: auto
    role: auto

